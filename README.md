# 🎵 MUSICRESET – Full-Stack Music Streaming Platform

<div align="center">

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tech](https://img.shields.io/badge/stack-React%20%7C%20Node%20%7C%20MongoDB%20%7C%20AWS%20%7C%20Docker-blue)
![Version](https://img.shields.io/badge/version-2.0.0-green)
![Status](https://img.shields.io/badge/status-production--ready-success)

</div>

<div align="center">
  <img src="data:image/svg+xml,%3csvg%20width='46'%20height='53'%20viewBox='0%200%2046%2053'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20filter='url(%23filter0_di_803_4322)'%3e%3cpath%20d='M36.599%2015.2069C39.3406%2018.3656%2041%2022.489%2041%2027C41%2036.9411%2032.9411%2045%2023%2045C13.0589%2045%205%2036.9411%205%2027C5%2017.0589%2013.0589%209%2023%209C23.4173%209%2023.8312%209.0142%2024.2414%209.04214'%20stroke='url(%23paint0_linear_803_4322)'%20stroke-width='2.8125'%20stroke-linecap='round'%20stroke-linejoin='round'/%3e%3c/g%3e%3crect%20x='28.1758'%20y='0.175781'%20width='2.64844'%20height='29.6484'%20rx='1.32422'%20fill='url(%23paint1_linear_803_4322)'%20stroke='url(%23paint2_linear_803_4322)'%20stroke-width='0.351562'/%3e%3cdefs%3e%3cfilter%20id='filter0_di_803_4322'%20x='0.781252'%20y='7.59375'%20width='44.4375'%20height='44.4375'%20filterUnits='userSpaceOnUse'%20color-interpolation-filters='sRGB'%3e%3cfeFlood%20flood-opacity='0'%20result='BackgroundImageFix'/%3e%3cfeColorMatrix%20in='SourceAlpha'%20type='matrix'%20values='0%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%20127%200'%20result='hardAlpha'/%3e%3cfeOffset%20dy='2.8125'/%3e%3cfeGaussianBlur%20stdDeviation='1.40625'/%3e%3cfeComposite%20in2='hardAlpha'%20operator='out'/%3e%3cfeColorMatrix%20type='matrix'%20values='0%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200.25%200'/%3e%3cfeBlend%20mode='normal'%20in2='BackgroundImageFix'%20result='effect1_dropShadow_803_4322'/%3e%3cfeBlend%20mode='normal'%20in='SourceGraphic'%20in2='effect1_dropShadow_803_4322'%20result='shape'/%3e%3cfeColorMatrix%20in='SourceAlpha'%20type='matrix'%20values='0%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%20127%200'%20result='hardAlpha'/%3e%3cfeOffset%20dy='0.703125'/%3e%3cfeGaussianBlur%20stdDeviation='0.28125'/%3e%3cfeComposite%20in2='hardAlpha'%20operator='arithmetic'%20k2='-1'%20k3='1'/%3e%3cfeColorMatrix%20type='matrix'%20values='0%200%200%200%201%200%200%200%200%201%200%200%200%200%201%200%200%200%200.31%200'/%3e%3cfeBlend%20mode='normal'%20in2='shape'%20result='effect2_innerShadow_803_4322'/%3e%3c/filter%3e%3clinearGradient%20id='paint0_linear_803_4322'%20x1='8.72414'%20y1='12.7241'%20x2='38.5172'%20y2='45'%20gradientUnits='userSpaceOnUse'%3e%3cstop%20stop-color='white'/%3e%3cstop%20offset='0.086327'%20stop-color='%2388B2EF'/%3e%3cstop%20offset='0.285547'%20stop-color='%231D3485'/%3e%3cstop%20offset='0.441866'%20stop-color='%23213782'/%3e%3cstop%20offset='0.641761'%20stop-color='%230459FE'/%3e%3cstop%20offset='0.723958'%20stop-color='%23033CAA'/%3e%3cstop%20offset='0.890708'%20stop-color='%2317318C'/%3e%3c/linearGradient%3e%3clinearGradient%20id='paint1_linear_803_4322'%20x1='28'%20y1='15.4286'%20x2='31'%20y2='15.4286'%20gradientUnits='userSpaceOnUse'%3e%3cstop%20stop-color='%23104BA5'/%3e%3cstop%20offset='0.46875'%20stop-color='%23459CCA'/%3e%3cstop%20offset='1'%20stop-color='%23000E3F'/%3e%3c/linearGradient%3e%3clinearGradient%20id='paint2_linear_803_4322'%20x1='28.3103'%20y1='3.10345'%20x2='33.6443'%20y2='3.68129'%20gradientUnits='userSpaceOnUse'%3e%3cstop%20stop-color='%23CCDEF9'/%3e%3cstop%20offset='0.359375'%20stop-color='%23095CD6'/%3e%3cstop%20offset='0.65625'%20stop-color='%231746A3'/%3e%3cstop%20offset='1'%20stop-color='%230556F4'/%3e%3c/linearGradient%3e%3c/defs%3e%3c/svg%3e" alt="MusicReset Banner" width="100%" />
</div>

---

## 🌟 Overview

**MUSICRESET** is a cutting-edge, full-featured music streaming platform that delivers a premium audio experience with enterprise-grade security. Built with modern web technologies, it supports encrypted music streaming, comprehensive payment integration, and advanced user management.

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🔐 **Authentication & Security**
- User registration/login/logout
- Social login (Google, Facebook, Apple)
- JWT-based authentication
- Cookie-based session management
- Password encryption with bcrypt

### 🎵 **Music Streaming**
- HLS (HTTP Live Streaming) with AES encryption
- High-quality audio streaming
- Progressive loading with skeleton UI
- Responsive audio player

</td>
<td width="50%">

### 💳 **E-Commerce & Payments**
- Razorpay payment integration
- Buy individual songs or full albums
- Artist subscription system
- Purchase history tracking

### 🎨 **User Experience**
- Like/unlike songs and playlist management
- Advanced search with filters
- Fully responsive design
- Dark/Light theme support
- Loading states and error handling

</td>
</tr>
</table>

### 🛠 **Admin Features**
- Complete artist, album, and song management
- User analytics and insights
- Content moderation tools
- API documentation with Swagger

---

## 🏗️ Tech Stack

<div align="center">

### **Frontend Technologies**
| Core | UI/UX | Routing & State | Build Tools |
|------|-------|-----------------|-------------|
| ![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react) | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?logo=tailwindcss) | ![React Router](https://img.shields.io/badge/React_Router-6.x-CA4245?logo=reactrouter) | ![Vite](https://img.shields.io/badge/Vite-4.x-646CFF?logo=vite) |
| ![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-1.9-764ABC?logo=redux) | ![React Loading Skeleton](https://img.shields.io/badge/Loading_Skeleton-3.x-gray) | ![React Helmet](https://img.shields.io/badge/React_Helmet-6.x-blue) | ![ESLint](https://img.shields.io/badge/ESLint-8.x-4B32C3?logo=eslint) |

### **Backend Technologies**
| Core | Database | Security | Documentation |
|------|----------|----------|---------------|
| ![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=nodedotjs) | ![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?logo=mongodb) | ![bcrypt](https://img.shields.io/badge/bcrypt-5.x-red) | ![Swagger](https://img.shields.io/badge/Swagger-3.x-85EA2D?logo=swagger) |
| ![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?logo=express) | ![Mongoose](https://img.shields.io/badge/Mongoose-7.x-880000) | ![crypto](https://img.shields.io/badge/crypto-Node_built--in-green) | ![Nodemailer](https://img.shields.io/badge/Nodemailer-6.x-blue) |
| ![Cookie Parser](https://img.shields.io/badge/Cookie_Parser-1.x-orange) | | ![JWT](https://img.shields.io/badge/JWT-9.x-000000?logo=jsonwebtokens) | |

### **Cloud Infrastructure & Media**
| AWS Services | Media Processing | DevOps |
|--------------|------------------|--------|
| ![AWS S3](https://img.shields.io/badge/AWS_S3-Storage-FF9900?logo=amazons3) | ![HLS](https://img.shields.io/badge/HLS-Streaming-red) | ![Docker](https://img.shields.io/badge/Docker-20.x-2496ED?logo=docker) |
| ![MediaConvert](https://img.shields.io/badge/MediaConvert-Processing-FF9900) | ![AES Encryption](https://img.shields.io/badge/AES-Encryption-green) | ![AWS EC2](https://img.shields.io/badge/AWS_EC2-Compute-FF9900?logo=amazonec2) |
| ![Lambda](https://img.shields.io/badge/AWS_Lambda-Serverless-FF9900?logo=awslambda) | | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?logo=githubactions) |

### **Payment & Social Integration**
| Payments | Social Auth |
|----------|-------------|
| ![Razorpay](https://img.shields.io/badge/Razorpay-528DD7?logo=razorpay) | ![Google OAuth](https://img.shields.io/badge/Google_OAuth-4285F4?logo=google) |
| | ![Facebook Login](https://img.shields.io/badge/Facebook_Login-1877F2?logo=facebook) |
| | ![Apple ID](https://img.shields.io/badge/Apple_ID-000000?logo=apple) |

</div>

---

## 🚀 Quick Start

### **Prerequisites**
