# Origami World - Product Requirements Document

## Overview
A kid-friendly origami learning app that helps users make origami based on skill level, with seasonal/holiday themes, step-by-step instructions, and premium video tutorials.

## Core Features

### 1. Authentication (JWT)
- Email/password registration with 1-month free trial
- Login with JWT Bearer tokens stored in AsyncStorage
- Profile management with skill level and age range

### 2. Origami Library (15 projects)
- **Beginner (6):** Paper Airplane, Sailing Boat, Puppy Face, Spring Tulip, Love Heart
- **Intermediate (5):** Paper Crane, Jumping Frog, Beautiful Butterfly, Clever Fox, Christmas Star, Spooky Bat, Winter Snowflake
- **Advanced (4):** Fire Dragon, Elegant Rose, Lotus Flower

### 3. Step-by-Step Instructions
- Visual step navigator with progress bar
- Prev/Next navigation between steps
- Tips for tricky folds
- Mark as completed with XP rewards

### 4. Seasonal & Holiday Themes
- Seasons: Spring, Summer, Fall, Winter
- Holidays: Christmas, Halloween, Valentine's, Easter
- Dynamic seasonal recommendations

### 5. Progress Tracking
- Completed origami counter
- XP points system
- Favorites/bookmarks
- Personal stats dashboard

### 6. Premium Subscription
- 1-month free trial for all new users
- $4.99/month subscription
- PayPal payment (MOCKED for MVP)
- Apple Pay / Google Pay buttons (production-only)
- Premium video tutorials locked behind paywall

## Tech Stack
- **Frontend:** Expo React Native (SDK 54) with Expo Router
- **Backend:** FastAPI with MongoDB
- **Auth:** JWT with bcrypt password hashing
- **Payment:** PayPal (MOCKED for MVP)

## Navigation
- Tab Navigation: Home, Browse, Seasonal, Profile
- Stack screens: Origami detail, Subscription, Auth screens

## Database Collections
- `users` - User profiles, auth, subscription status
- `origami` - Origami projects with steps
- `progress` - User progress per origami

## API Endpoints
- Auth: /api/auth/register, /api/auth/login, /api/auth/me, /api/auth/profile
- Origami: /api/origami, /api/origami/featured, /api/origami/seasonal, /api/origami/:id
- Progress: /api/progress, /api/progress/stats, /api/progress/:id/step, /api/progress/:id/complete, /api/progress/:id/favorite
- Subscription: /api/subscription/status, /api/subscription/activate
