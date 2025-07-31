import React, { useEffect, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import UserHeader from "../components/user/UserHeader";
import SongList from "../components/user/SongList";
import RecentPlays from "../components/user/RecentPlays";
import { FiMapPin } from "react-icons/fi";
import { LuSquareChevronRight } from "react-icons/lu";
import { fetchArtistBySlug } from "../features/artists/artistsSlice";
import { selectSelectedArtist } from "../features/artists/artistsSelectors";
import { setSelectedSong, play } from "../features/playback/playerSlice";
import { formatDuration } from "../utills/helperFunctions";
import { getAlbumsByArtist } from "../features/albums/albumsSlice";
import ArtistAboutSection from "../components/user/ArtistAboutSection";
import AlbumCard from "../components/user/AlbumCard";
import axiosInstance from "../utills/axiosInstance";
import {
  selectArtistAlbums,
  selectArtistAlbumPagination,
  selectArtistInfo,
} from "../features/albums/albumsSelector";
import { fetchSongsByArtist } from "../features/songs/songSlice";
import { selectSongsByArtist } from "../features/songs/songSelectors";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import { fetchUserSubscriptions } from "../features/payments/userPaymentSlice";
import { 
  initiateRazorpayItemPayment, 
  initiateRazorpaySubscription,
  resetPaymentState 
} from "../features/payments/paymentSlice";
import {
  selectPaymentLoading,
  selectRazorpayOrder,
  selectRazorpaySubscriptionId,
  selectPaymentError
} from "../features/payments/paymentSelectors";

// ✅ Cookie utility functions
const getCookieValue = (cookieName) => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split('; ');
  const targetCookie = cookies.find(cookie => cookie.startsWith(`${cookieName}=`));
  
  if (targetCookie) {
    return targetCookie.split('=')[1];
  }
  return null;
};

const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    return payload.exp > currentTime;
  } catch (error) {
    console.error('❌ Token validation error:', error);
    return false;
  }
};

const clearAuthCookies = () => {
  // Clear auth cookies
  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  
  // Clear localStorage
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

// ✅ Enhanced Razorpay script loader with comprehensive error handling
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      console.log('✅ Razorpay already loaded');
      resolve(true);
      return;
    }

    // Remove any existing script to avoid conflicts
    const existingScript = document.querySelector('script[src*="razorpay"]');
    if (existingScript) {
      console.log('🔄 Removing existing Razorpay script');
      existingScript.remove();
    }

    console.log('📦 Loading Razorpay script...');
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    
    script.onload = () => {
      console.log('✅ Razorpay script loaded successfully');
      // Double check if Razorpay is available
      if (window.Razorpay) {
        console.log('✅ Razorpay object confirmed available');
        resolve(true);
      } else {
        console.error('❌ Razorpay object not found after script load');
        resolve(false);
      }
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Razorpay script:', error);
      resolve(false);
    };
    
    // Add to head for better loading
    document.head.appendChild(script);
    
    // Timeout fallback
    setTimeout(() => {
      if (!window.Razorpay) {
        console.error('❌ Razorpay script load timeout (10s)');
        resolve(false);
      }
    }, 10000);
  });
};

const Artist = () => {
  const { artistId } = useParams();
  const dispatch = useDispatch();
  const recentScrollRef = useRef(null);
  const singlesScrollRef = useRef(null);
  const navigate = useNavigate();

  const selectedSong = useSelector((state) => state.player.selectedSong);
  const currentUser = useSelector((state) => state.auth?.user || null);
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated || false);
  const artist = useSelector(selectSelectedArtist);
  const artistAlbums = useSelector(selectArtistAlbums);
  const artistAlbumPagination = useSelector(selectArtistAlbumPagination);
  const artistInfo = useSelector(selectArtistInfo);
  const artistSongsData = useSelector(
    (state) => selectSongsByArtist(state, artistId),
    shallowEqual
  );

  const paymentLoading = useSelector(selectPaymentLoading);
  const razorpayOrder = useSelector(selectRazorpayOrder);
  const razorpaySubscriptionId = useSelector(selectRazorpaySubscriptionId);
  const paymentError = useSelector(selectPaymentError);

  const userSubscriptions = useSelector(
    (state) => state.userDashboard.subscriptions || []
  );

  const isSubscribed = userSubscriptions.some((sub) => sub.artist.slug === artistId);

  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(process.env.NODE_ENV === 'development');

  const {
    songs: artistSongs = [],
    pages: totalPages = 1,
    status: songsStatus = "idle",
  } = artistSongsData || {};

  const [songsPage, setSongsPage] = useState(1);
  const [albumsPage, setAlbumsPage] = useState(1);
  const [albumsStatus, setAlbumsStatus] = useState("idle");
  const [hasMoreAlbums, setHasMoreAlbums] = useState(true);
  const [showAllSongs, setShowAllSongs] = useState(false);

  const songsObserverRef = useRef();
  const albumsObserverRef = useRef();

  const getArtistColor = (name) => {
    if (!name) return "bg-blue-600";
    const colors = [
      "bg-blue-600",
      "bg-purple-600",
      "bg-pink-600",
      "bg-red-600",
      "bg-orange-600",
      "bg-yellow-600",
      "bg-green-600",
      "bg-teal-600",
      "bg-indigo-600",
    ];
    const hash = name.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
  };

  // ✅ Enhanced environment and network checks
  useEffect(() => {
    const tokenFromCookie = getCookieValue('token');
    const tokenFromLocalStorage = localStorage.getItem('token');
    
    console.log('🔧 Environment & Auth Debug:', {
      environment: import.meta.env.MODE,
      razorpayKey: import.meta.env.VITE_RAZORPAY_KEY_ID ? 
        import.meta.env.VITE_RAZORPAY_KEY_ID.substring(0, 10) + '...' : 'MISSING',
      apiBaseUrl: import.meta.env.VITE_API_URL || 'MISSING',
      artistId,
      userId: currentUser?._id || 'MISSING',
      networkStatus: navigator.onLine ? 'Online' : 'Offline',
      tokenInCookie: !!tokenFromCookie,
      tokenInLocalStorage: !!tokenFromLocalStorage,
      cookiesCount: document.cookie.split(';').filter(c => c.trim()).length,
      isAuthenticated,
      razorpayLoaded: !!window.Razorpay
    });

    // Network status monitoring
    const handleOnline = () => console.log('🌐 Network: Online');
    const handleOffline = () => console.log('🌐 Network: Offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [artistId, currentUser, isAuthenticated]);

  // ✅ Load Razorpay script with multiple retry attempts
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadWithRetry = async () => {
      console.log(`🔄 Razorpay load attempt ${retryCount + 1}/${maxRetries + 1}`);
      const success = await loadRazorpayScript();
      
      if (!success && retryCount < maxRetries) {
        retryCount++;
        console.log(`🔄 Retrying Razorpay script load in ${retryCount}s...`);
        setTimeout(loadWithRetry, 1000 * retryCount);
      } else if (!success) {
        console.error('❌ Failed to load Razorpay after all retries');
        toast.error('Failed to load payment gateway. Please refresh the page.');
      } else {
        console.log('✅ Razorpay ready for use');
      }
    };
    
    loadWithRetry();
  }, []);

  // ✅ Data fetching
  useEffect(() => {
    if (artistId) {
      console.log('📊 Fetching artist data for:', artistId);
      dispatch(fetchArtistBySlug(artistId));
      dispatch(fetchUserSubscriptions());
      dispatch(getAlbumsByArtist({ artistId, page: 1, limit: 10 }));
      dispatch(fetchSongsByArtist({ artistId, page: 1, limit: 10 }));
    }
  }, [dispatch, artistId]);

  useEffect(() => {
    dispatch(resetPaymentState());
    return () => {
      dispatch(resetPaymentState());
    };
  }, [dispatch]);

  const fetchAlbums = async (page) => {
    if (albumsStatus === "loading") return;
    setAlbumsStatus("loading");
    try {
      await dispatch(
        getAlbumsByArtist({ artistId, page, limit: 10 })
      ).unwrap();
      if (page >= artistAlbumPagination.totalPages) {
        setHasMoreAlbums(false);
      }
    } catch (error) {
      console.error("❌ Failed to fetch albums:", error);
      toast.error("Failed to load albums");
    } finally {
      setAlbumsStatus("idle");
    }
  };

  useEffect(() => {
    if (albumsPage > 1 && hasMoreAlbums) {
      fetchAlbums(albumsPage);
    }
  }, [albumsPage, hasMoreAlbums]);

  useEffect(() => {
    if (artistId && songsPage > 1) {
      dispatch(fetchSongsByArtist({ artistId, page: songsPage, limit: 10 }));
    }
  }, [dispatch, artistId, songsPage]);

  const handlePlaySong = (song) => {
    console.log('🎵 Playing song:', song.title);
    dispatch(setSelectedSong(song));
    dispatch(play());
  };

  const handleScroll = (ref) => {
    ref?.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  // ✅ Enhanced item purchase handler
  const handleRazorpayItemPurchase = async (item, itemType) => {
    try {
      console.log('💳 Starting item purchase:', { item: item._id, type: itemType });
      
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        return;
      }

      const orderResult = await dispatch(
        initiateRazorpayItemPayment({
          itemType,
          itemId: item._id,
          amount: item.price,
        })
      ).unwrap();

      if (!orderResult.order) {
        toast.error("Failed to create payment order. Please try again.");
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResult.order.amount,
        currency: orderResult.order.currency || 'INR',
        name: "RESET Music",
        description: `Purchase ${item.title || item.name}`,
        image: `${window.location.origin}/logo.png`,
        order_id: orderResult.order.id,
        handler: async function (response) {
          console.log('✅ Item purchase successful:', response);
          toast.success(`Successfully purchased ${item.title || item.name}!`);
          dispatch(fetchUserSubscriptions());
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        },
        prefill: {
          name: currentUser?.name || "",
          email: currentUser?.email || "",
          contact: currentUser?.phone || "",
        },
        notes: {
          itemType,
          itemId: item._id,
          userId: currentUser?._id,
          artistId: artist?._id,
          timestamp: new Date().toISOString(),
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment cancelled.");
            dispatch(resetPaymentState());
          },
          escape: true,
          backdropclose: false
        },
        error: function(error) {
          console.error('❌ Item purchase error:', error);
          toast.error(`Payment failed: ${error.description || error.reason || 'Unknown error'}`);
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('❌ Payment failed event:', response);
        toast.error(`Payment failed: ${response.error.description}`);
      });
      razorpay.open();

    } catch (error) {
      console.error("❌ Purchase error:", error);
      toast.error(error.message || "Failed to initiate purchase");
    }
  };

  // ✅ COMPLETELY ENHANCED subscription handler with all debugging and fixes
  const handleRazorpaySubscription = async () => {
    if (!artist?._id) {
      toast.error("Artist info not loaded.");
      return;
    }

    try {
      setSubscriptionLoading(true);
      
      // ✅ 1. Environment Variables Validation
      console.log('🔧 Environment Validation:', {
        mode: import.meta.env.MODE,
        razorpayKey: import.meta.env.VITE_RAZORPAY_KEY_ID ? 'Present' : '❌ MISSING',
        apiUrl: import.meta.env.VITE_API_URL || '❌ MISSING',
        nodeEnv: process.env.NODE_ENV
      });

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        console.error('❌ CRITICAL: Razorpay key missing from environment variables');
        toast.error("Payment configuration error. Please contact support.");
        return;
      }

      if (!razorpayKey.startsWith('rzp_')) {
        console.error('❌ CRITICAL: Invalid Razorpay key format:', razorpayKey.substring(0, 10));
        toast.error("Invalid payment configuration. Please contact support.");
        return;
      }

      // ✅ 2. Authentication Check with Cookie Support
      const tokenFromCookie = getCookieValue('token');
      const tokenFromLocalStorage = localStorage.getItem('token');
      const activeToken = tokenFromCookie || tokenFromLocalStorage;
      
      console.log('🔐 Authentication Status:', {
        currentUser: !!currentUser,
        userId: currentUser?._id || '❌ MISSING',
        userName: currentUser?.name || '❌ MISSING',
        tokenInCookie: !!tokenFromCookie,
        tokenInLocalStorage: !!tokenFromLocalStorage,
        activeToken: !!activeToken,
        isAuthenticated: isAuthenticated,
        cookieCount: document.cookie.split(';').length
      });

      // Check if user is authenticated
      if (!currentUser || !currentUser._id) {
        console.warn('❌ User not authenticated in Redux state');
        toast.error("Please login to subscribe.");
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              from: window.location.pathname,
              message: 'Please login to subscribe to this artist'
            }
          });
        }, 2000);
        return;
      }

      // Token validation
      if (!activeToken) {
        console.warn('❌ No auth token found');
        toast.error("Session not found. Please login again.");
        clearAuthCookies();
        navigate('/login');
        return;
      }

      if (!isTokenValid(activeToken)) {
        console.warn('❌ Token invalid or expired');
        toast.error("Session expired. Please login again.");
        clearAuthCookies();
        navigate('/login');
        return;
      }

      // ✅ 3. Server Session Verification
      try {
        console.log('🔍 Verifying session with server...');
        const sessionCheck = await axiosInstance.get('/users/me', {
          withCredentials: true,
          headers: { 'Authorization': `Bearer ${activeToken}` }
        });
        console.log('✅ Session verified with server');
      } catch (sessionError) {
        console.error('❌ Session verification failed:', sessionError);
        if (sessionError.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          clearAuthCookies();
          navigate('/login');
          return;
        }
      }

      // ✅ 4. Razorpay Script Loading
      console.log('📦 Checking Razorpay script...');
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        console.error('❌ CRITICAL: Failed to load Razorpay script');
        toast.error("Failed to load payment gateway. Please refresh the page and try again.");
        return;
      }

      if (!window.Razorpay) {
        console.error('❌ CRITICAL: Razorpay object not available');
        toast.error("Payment gateway not available. Please refresh and try again.");
        return;
      }

      console.log('✅ Razorpay script and object confirmed ready');

      // ✅ 5. Artist Data Validation
      console.log('🎨 Artist Data:', {
        artistId: artist._id,
        artistName: artist.name,
        artistSlug: artistId,
        subscriptionPrice: artist.subscriptionPrice || 4.99
      });

      // ✅ 6. API Call for Subscription
      console.log('📡 Initiating subscription API call...');
      const subscriptionResult = await dispatch(
        initiateRazorpaySubscription(artist._id)
      ).unwrap();

      console.log('💳 Subscription API Response:', {
        success: !!subscriptionResult?.subscriptionId,
        subscriptionId: subscriptionResult?.subscriptionId,
        hasResponse: !!subscriptionResult,
        responseKeys: Object.keys(subscriptionResult || {})
      });

      if (!subscriptionResult?.subscriptionId) {
        console.error('❌ CRITICAL: No subscription ID in response:', subscriptionResult);
        toast.error("Failed to create subscription. Please try again or contact support.");
        return;
      }

      console.log('✅ Subscription ID created successfully:', subscriptionResult.subscriptionId);

      // ✅ 7. Razorpay Configuration
      const razorpayOptions = {
        key: razorpayKey,
        subscription_id: subscriptionResult.subscriptionId,
        name: "RESET Music",
        description: `Subscribe to ${artist.name}`,
        image: `${window.location.origin}/logo.png`,
        handler: async function (response) {
          console.log('✅ Payment successful:', {
            payment_id: response.razorpay_payment_id,
            subscription_id: response.razorpay_subscription_id,
            signature: response.razorpay_signature ? 'Present' : 'Missing'
          });
          
          toast.success(`Successfully subscribed to ${artist.name}!`);
          
          try {
            await dispatch(fetchUserSubscriptions());
            console.log('✅ User subscriptions refreshed');
          } catch (refreshError) {
            console.warn('⚠️ Failed to refresh subscriptions:', refreshError);
          }
        },
        prefill: {
          name: currentUser.name || "",
          email: currentUser.email || "",
          contact: currentUser.phone || "",
        },
        notes: {
          artistId: artist._id,
          artistSlug: artistId,
          userId: currentUser._id,
          timestamp: new Date().toISOString(),
          source: 'artist-page',
          subscriptionPrice: artist.subscriptionPrice || 4.99,
          authMethod: tokenFromCookie ? 'cookie' : 'localStorage'
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: function () {
            console.log('⚠️ Payment modal dismissed by user');
            toast.error("Subscription cancelled.");
            dispatch(resetPaymentState());
          },
          escape: true,
          backdropclose: false
        },
        error: function(error) {
          console.error('❌ Razorpay modal error:', error);
          toast.error(`Payment failed: ${error.description || error.reason || 'Unknown error'}`);
        }
      };

      console.log('🎛️ Razorpay Options:', {
        hasKey: !!razorpayOptions.key,
        keyPrefix: razorpayOptions.key?.substring(0, 10) + '...',
        hasSubscriptionId: !!razorpayOptions.subscription_id,
        subscriptionId: razorpayOptions.subscription_id
      });

      // ✅ 8. Create and Open Razorpay Instance
      console.log('🚀 Creating Razorpay instance...');
      
      try {
        const razorpay = new window.Razorpay(razorpayOptions);
        
        // Add event listeners for debugging
        razorpay.on('payment.failed', function (response) {
          console.error('❌ Payment failed event:', response);
          toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        });

        console.log('✅ Razorpay instance created successfully');
        console.log('🎯 Opening Razorpay modal...');
        
        razorpay.open();
        console.log('✅ Razorpay modal opened successfully');
        
      } catch (razorpayError) {
        console.error('❌ CRITICAL: Error creating/opening Razorpay:', razorpayError);
        toast.error(`Failed to open payment modal: ${razorpayError.message}`);
      }

    } catch (error) {
      console.error("❌ CRITICAL SUBSCRIPTION ERROR:", {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        timestamp: new Date().toISOString()
      });
      
      let errorMessage = "Failed to initiate subscription";
      
      if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your network.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please login again.";
        clearAuthCookies();
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 403) {
        errorMessage = "Access denied. Please check your permissions.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Invalid subscription request";
      } else if (error.response?.status === 404) {
        errorMessage = "Artist not found or subscription not available";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Subscription failed: ${errorMessage}`);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!artist?._id) {
      toast.error("Artist info not loaded.");
      return;
    }

    if (isSubscribed) {
      const confirmUnsub = window.confirm(
        `Are you sure you want to unsubscribe from ${artist.name}?`
      );
      if (!confirmUnsub) return;

      setSubscriptionLoading(true);
      try {
        await axiosInstance.delete(`/subscriptions/artist/${artist._id}`);
        dispatch(fetchUserSubscriptions());
        toast.success(`Unsubscribed from ${artist.name}`);
      } catch (error) {
        console.error("❌ Unsubscribe error:", error);
        toast.error(`Failed to unsubscribe: ${error.response?.data?.message || error.message}`);
      } finally {
        setSubscriptionLoading(false);
      }
    } else {
      await handleRazorpaySubscription();
    }
  };

  const handlePurchaseClick = (item, type) => {
    handleRazorpayItemPurchase(item, type);
  };

  // Intersection observers for infinite scrolling
  const songsLastRef = useCallback(
    (node) => {
      if (songsStatus === "loading") return;
      if (songsObserverRef.current) songsObserverRef.current.disconnect();
      songsObserverRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && songsPage < totalPages) {
          setSongsPage((prev) => prev + 1);
        }
      });
      if (node) songsObserverRef.current.observe(node);
    },
    [songsStatus, songsPage, totalPages]
  );

  const albumsLastRef = useCallback(
    (node) => {
      if (albumsStatus === "loading" || !hasMoreAlbums) return;
      if (albumsObserverRef.current) albumsObserverRef.current.disconnect();
      albumsObserverRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMoreAlbums) {
          setAlbumsPage((prev) => prev + 1);
        }
      });
      if (node) albumsObserverRef.current.observe(node);
    },
    [albumsStatus, hasMoreAlbums]
  );

  const songListView = showAllSongs ? artistSongs : artistSongs.slice(0, 5);
  const subscriptionPrice = artist?.subscriptionPrice || 4.99;
  const artistColor = getArtistColor(artist?.name);

  const renderArtistImage = (imageUrl, name, size = "w-20 h-20") =>
    imageUrl ? (
      <img
        src={imageUrl}
        alt={name || "Artist"}
        className={`${size} rounded-full object-cover border-2 border-blue-500 shadow-[0_0_5px_1px_#3b82f6]`}
      />
    ) : (
      <div
        className={`${size} ${artistColor} rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-blue-500 shadow-[0_0_5px_1px_#3b82f6]`}
      >
        {name ? name.charAt(0).toUpperCase() : "A"}
      </div>
    );

  const renderCoverImage = (imageUrl, title, size = "w-full h-full") =>
    imageUrl ? (
      <img
        src={imageUrl}
        alt={title || "Cover"}
        className={`${size} object-cover`}
      />
    ) : (
      <div
        className={`${size} ${artistColor} flex items-center justify-center text-white font-bold text-2xl`}
      >
        {title ? title.charAt(0).toUpperCase() : "C"}
      </div>
    );

  return (
    <>
      <UserHeader />
      <SkeletonTheme baseColor="#1f2937" highlightColor="#374151">
        {/* ✅ Debug Panel (Development only) */}
        {debugMode && (
          <div className="fixed bottom-4 right-4 z-50 bg-gray-900/90 backdrop-blur-sm border border-gray-600 rounded-lg p-3 text-xs text-gray-300 max-w-sm">
            <div className="font-bold text-purple-400 mb-2">Debug Panel</div>
            <div className="space-y-1">
              <div>Environment: {import.meta.env.MODE}</div>
              <div>Network: {navigator.onLine ? '🟢 Online' : '🔴 Offline'}</div>
              <div>Artist ID: {artistId}</div>
              <div>User ID: {currentUser?._id || '❌'}</div>
              <div>Subscribed: {isSubscribed ? '✅' : '❌'}</div>
              <div>Razorpay: {window.Razorpay ? '✅' : '❌'}</div>
              <div>Cookie Token: {getCookieValue('token') ? '✅' : '❌'}</div>
              <div>Local Token: {localStorage.getItem('token') ? '✅' : '❌'}</div>
              <div>Auth State: {isAuthenticated ? '✅' : '❌'}</div>
              <div>Razorpay Key: {import.meta.env.VITE_RAZORPAY_KEY_ID ? '✅' : '❌'}</div>
            </div>
            <button 
              onClick={() => setDebugMode(false)}
              className="text-xs text-gray-500 hover:text-gray-300 mt-2"
            >
              Hide
            </button>
          </div>
        )}

        {/* Artist Header */}
        <div className="relative h-80 w-full">
          {artist ? (
            <>
              {artist.image ? (
                <img
                  src={artist.image}
                  className="w-full h-full object-cover opacity-80"
                  alt="Artist Background"
                />
              ) : (
                <div className={`w-full h-full ${artistColor} opacity-80`} />
              )}
              <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-[#0f172a] to-transparent z-20" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-blue-900/30 z-10" />
              <div className="absolute bottom-8 left-8 z-30 flex items-center gap-6 text-white">
                {renderArtistImage(artist?.image, artist?.name)}
                <div>
                  <p className="text-sm lowercase tracking-widest text-gray-200">
                    Artist
                  </p>
                  <h1 className="text-3xl md:text-4xl font-bold mt-1">
                    {artist?.name || "Unknown Artist"}
                  </h1>
                  <div className="flex items-center mt-1 text-gray-300 text-sm">
                    <FiMapPin className="mr-2 text-blue-600" />
                    <span>{artist?.location || "Unknown City"}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-lg font-semibold text-blue-400">
                      ₹{subscriptionPrice.toFixed(2)}/month
                    </span>
                    <button
                      onClick={handleSubscribe}
                      disabled={subscriptionLoading || paymentLoading}
                      className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 shadow-md
                        ${(subscriptionLoading || paymentLoading) ? "opacity-70 cursor-not-allowed" : ""}
                        ${
                          isSubscribed
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                      {(subscriptionLoading || paymentLoading)
                        ? "Processing..."
                        : isSubscribed
                        ? "Cancel Subscription"
                        : `Subscribe ₹${subscriptionPrice.toFixed(2)}/mo`}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <Skeleton width={200} height={40} />
            </div>
          )}
        </div>

        {/* Songs Section */}
        <div className="flex justify-between mt-6 px-6 text-lg text-white">
          <h2>All Songs</h2>
          {artistSongs.length > 5 && (
            <button
              className="text-blue-500 cursor-pointer hover:underline"
              onClick={() => setShowAllSongs(!showAllSongs)}
            >
              {showAllSongs ? "Show less" : "See all"}
            </button>
          )}
        </div>
        <div className="px-6 py-4 flex flex-col gap-4">
          {songsStatus === "loading" && artistSongs.length === 0 ? (
            [...Array(5)].map((_, idx) => (
              <div
                key={`song-skeleton-${idx}`}
                className="flex items-center gap-4"
              >
                <Skeleton circle width={50} height={50} />
                <div className="flex-1">
                  <Skeleton width={120} height={16} />
                  <Skeleton width={80} height={12} />
                </div>
                <Skeleton width={40} height={16} />
              </div>
            ))
          ) : (
            <>
              {songListView.map((song) => (
                <SongList
                  key={song._id}
                  songId={song._id}
                  img={
                    song.coverImage
                      ? song.coverImage
                      : renderCoverImage(null, song.title, "w-12 h-12")
                  }
                  songName={song.title}
                  singerName={song.singer}
                  seekTime={formatDuration(song.duration)}
                  onPlay={() => handlePlaySong(song)}
                  isSelected={selectedSong?._id === song._id}
                />
              ))}
              {songsStatus === "loading" &&
                songsPage < totalPages &&
                [...Array(5)].map((_, idx) => (
                  <div
                    key={`song-loading-${idx}`}
                    className="flex items-center gap-4"
                  >
                    <Skeleton circle width={50} height={50} />
                    <div className="flex-1">
                      <Skeleton width={120} height={16} />
                      <Skeleton width={80} height={12} />
                    </div>
                    <Skeleton width={40} height={16} />
                  </div>
                ))}
            </>
          )}
        </div>

        {/* Albums Section */}
        <div className="flex justify-between mt-6 px-6 text-lg text-white items-center">
          <h2>Albums</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              Page {artistAlbumPagination.page} of {artistAlbumPagination.totalPages}
            </span>
            <LuSquareChevronRight
              className="text-white cursor-pointer hover:text-blue-800 text-2xl"
              onClick={() => handleScroll(recentScrollRef)}
            />
          </div>
        </div>
        <div className="px-6 py-2">
          <div
            ref={recentScrollRef}
            className="flex gap-4 overflow-x-auto pb-2 no-scrollbar whitespace-nowrap min-h-[220px]"
          >
            {albumsStatus === "loading" && artistAlbums.length === 0 ? (
              [...Array(5)].map((_, idx) => (
                <div key={`album-skeleton-${idx}`} className="min-w-[160px]">
                  <Skeleton height={160} width={160} className="rounded-xl" />
                  <Skeleton width={120} height={16} className="mt-2" />
                </div>
              ))
            ) : artistAlbums.length > 0 ? (
              <>
                {artistAlbums.map((album) => (
                  <AlbumCard
                    key={album._id}
                    tag={`#${album.title || "music"}`}
                    artists={album.artist?.name || "Various Artists"}
                    image={album.coverImage || "/images/placeholder.png"}
                    price={
                      album.price === 0 ? (
                        "subs.."
                      ) : currentUser?.purchasedAlbums?.includes(album._id) ? (
                        "Purchased"
                      ) : (
                        <button
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2 py-1 rounded disabled:opacity-50"
                          onClick={() => handlePurchaseClick(album, "album")}
                          disabled={paymentLoading}
                        >
                          {paymentLoading ? "Processing..." : `Buy for ₹${album.price}`}
                        </button>
                      )
                    }
                    onClick={() => navigate(`/album/${album.slug}`)}
                  />
                ))}
                {albumsStatus === "loading" &&
                  hasMoreAlbums &&
                  [...Array(2)].map((_, idx) => (
                    <div key={`album-loading-${idx}`} className="min-w-[160px]">
                      <Skeleton height={160} width={160} className="rounded-xl" />
                      <Skeleton width={120} height={16} className="mt-2" />
                    </div>
                  ))}
              </>
            ) : (
              <p className="text-white text-sm">No albums found.</p>
            )}
          </div>
        </div>

        {/* Singles Section */}
        <div className="flex justify-between mt-6 px-6 text-lg text-white items-center">
          <h2>Singles</h2>
          <LuSquareChevronRight
            className="text-white cursor-pointer hover:text-blue-800 text-2xl"
            onClick={() => handleScroll(singlesScrollRef)}
          />
        </div>
        <div
          ref={singlesScrollRef}
          className="flex gap-4 overflow-x-auto px-6 py-2 no-scrollbar min-h-[160px]"
        >
          {songsStatus === "loading" && artistSongs.length === 0
            ? [...Array(5)].map((_, idx) => (
                <div key={`single-skeleton-${idx}`} className="min-w-[160px]">
                  <Skeleton height={160} width={160} className="rounded-xl" />
                  <Skeleton width={120} height={16} className="mt-2" />
                </div>
              ))
            : artistSongs.map((song, idx) => (
                <RecentPlays
                  ref={idx === artistSongs.length - 1 ? songsLastRef : null}
                  key={song._id}
                  title={song.title}
                  singer={song.singer}
                  image={
                    song.coverImage
                      ? song.coverImage
                      : renderCoverImage(null, song.title, "w-full h-40")
                  }
                  onPlay={() => handlePlaySong(song)}
                  isSelected={selectedSong?._id === song._id}
                  price={
                    song.accessType === "purchase-only" ? (
                      currentUser?.purchasedSongs?.includes(song._id) ? (
                        "Purchased"
                      ) : (
                        <button
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2 py-1 rounded disabled:opacity-50"
                          onClick={() => handlePurchaseClick(song, "song")}
                          disabled={paymentLoading}
                        >
                          {paymentLoading ? "Processing..." : `Buy for ₹${song.price}`}
                        </button>
                      )
                    ) : (
                      "Subs.."
                    )
                  }
                />
              ))}
        </div>

        {/* Artist About Section */}
        <ArtistAboutSection
          artist={artist}
          isSubscribed={isSubscribed}
          subscriptionLoading={subscriptionLoading || paymentLoading}
          subscriptionPrice={subscriptionPrice}
          handleSubscribe={handleSubscribe}
          getArtistColor={getArtistColor}
        />

        {/* Enhanced Error Display */}
        {paymentError && (
          <div className="fixed top-4 right-4 z-50 bg-red-900/90 backdrop-blur-sm border border-red-500/30 rounded-lg p-4 text-red-300 max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold">Payment Error</p>
              <button 
                onClick={() => dispatch(resetPaymentState())}
                className="text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
            <p className="text-sm">{paymentError.message || "Payment failed. Please try again."}</p>
            {paymentError.status && (
              <p className="text-xs text-red-400 mt-1">Code: {paymentError.status}</p>
            )}
          </div>
        )}

        {/* Network Status Indicator */}
        {!navigator.onLine && (
          <div className="fixed top-4 left-4 z-50 bg-yellow-900/90 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-3 text-yellow-300">
            <p className="text-sm">🔴 No internet connection</p>
          </div>
        )}
      </SkeletonTheme>
    </>
  );
};

export default Artist;
