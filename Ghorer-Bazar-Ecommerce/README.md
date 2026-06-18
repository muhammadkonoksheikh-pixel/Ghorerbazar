# Ghorer Bazar - Premium Ecommerce Web Application

A complete, production-ready, Full Stack Serverless Ecommerce application built using purely HTML, CSS, Vanilla JavaScript (ES6), Firebase, and Cloudinary.

## 🔥 Features Overview

### For Users (`/user-app`)
- **Authentication:** Login, Register, Google Auth, Forgot Password via Firebase Auth.
- **Home Page:** Dynamic Banners, Category Grid, Flash Sale with Countdown, Featured & Latest Products.
- **Product Pages:** Grid listings, Filtering, Search Functionality, Detailed View, Multiple Images with Zoom, Stock Availability.
- **Cart & Checkout:** Realtime Add to Cart, Quantity Control, Dynamic Delivery Charge Calculation (Inside/Outside Dhaka).
- **Payment Gateway:** Manual verification system for bKash & Nagad (TrxID) and Cash on Delivery (COD).
- **User Dashboard:** Profile Management, My Orders History, Order Status Tracking Pipeline.
- **UI/UX:** Fully Responsive Mobile-First Design, Glassmorphism elements, CSS Animations (AOS), SweetAlert2 Modals, Toast Notifications, Skeleton Loaders.

### For Admin (`/admin-app`)
- **Secure Access:** Admin-only route protection via Firestore Role Verification.
- **Dashboard Overview:** Live stats for Revenue, Orders, Products, and Users.
- **Product Management:** Add, Edit, Delete products with direct Cloudinary Image Uploading.
- **Order Management:** View orders, change Payment Status (Paid/Pending), Update Order Pipeline (Processing, Shipped, Delivered).
- **Category Management:** Create dynamic categories with image and priority order.

## 🛠 Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Auth
- **Image Hosting:** Cloudinary Unsigned Uploads
- **Libraries:** FontAwesome, Swiper.js, AOS.js, SweetAlert2.

## 🚀 Setup & Deployment
1. Create a Firebase Project. Replace config in `firebase-config.js` for both user and admin folders.
2. In Firebase Firestore Database, create a collection named `admins`. Add a document where the Document ID is your User UID. Set a field `role: "admin"`.
3. Set up Cloudinary Unsigned Upload Preset named `ghorer_bazar_preset` (Read `cloudinary/upload-guide.txt`).
4. Host freely on InfinityFree, Vercel, Netlify, or GitHub Pages since there is no Node.js backend required!