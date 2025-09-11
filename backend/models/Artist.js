import mongoose from "mongoose";
import slugify from "slugify";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

const subscriptionPlanSchema = new mongoose.Schema(
  {
    cycle: {
      type: String,
      enum: ["1m", "3m", "6m", "12m"], // subscription cycle in months
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    razorpayPlanId: {
      type: String,
      required: [true, "Razorpay plan ID is required"],
      trim: true,
    },
    stripePriceId: {
      type: String,
      default: null,
      trim: true,
    },
    paypalPlans: [
      {
        currency: { type: String, required: true },
        paypalPlanId: { type: String, required: true }
      }
    ]
  },
  { _id: false } // prevent extra _id for subdocs
);

const artistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Artist name is required"],
      trim: true,
      minlength: [2, "Artist name must be at least 2 characters"],
      maxlength: [100, "Artist name must be at most 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      unique: true, // ✅ enforce uniqueness at DB level
      trim: true,
      match: [/^[a-z0-9-]+$/, "Slug must be lowercase and URL-friendly"],
    },
    location: {
      type: String,
      maxlength: 100,
      default: "",
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },

    // 💳 Multiple subscription cycles
    subscriptionPlans: {
      type: [subscriptionPlanSchema],
      validate: {
        validator: function (plans) {
          const cycles = plans.map((p) => p.cycle);
          return new Set(cycles).size === cycles.length; // prevent duplicate cycles
        },
        message: "Duplicate subscription cycles are not allowed",
      },
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ⚡ store subscriber references (not for counting, use Subscription collection instead)
    subscribers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

// 🔁 Auto-generate unique slug before validation
artistSchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    const baseSlug = slugify(this.name, { lower: true, strict: true });
    this.slug = `${baseSlug}-${nanoid()}`;
  }
  next();
});

// 📈 Indexes for fast lookup
artistSchema.index({ name: 1 });
artistSchema.index({ slug: 1 }, { unique: true });

export const Artist =
  mongoose.models.Artist || mongoose.model("Artist", artistSchema);
