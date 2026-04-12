# Foldiverse - Google Play Store Listing Guide

## App Details

**App Name:** Foldiverse
**Tagline:** *Start with paper. End with magic.*

---

## Short Description (80 chars max)
```
Learn origami step by step! 295 projects for all ages. Start with paper. End with magic.
```

## Full Description (4000 chars max)
```
✨ Foldiverse — Start with paper. End with magic. ✨

Learn the magical art of origami with 295 step-by-step projects! Whether you're folding your very first paper airplane or crafting an advanced fire dragon, Foldiverse has something for everyone.

🎯 FOR ALL SKILL LEVELS
• Beginner — Simple, fun projects perfect for ages 5-7
• Intermediate — More challenging folds for ages 8-10
• Advanced — Complex masterpieces for ages 11+

🌸 SEASONAL & HOLIDAY THEMES
• Spring: Cherry blossoms, butterflies, Easter bunnies
• Summer: Boats, tropical fish, beach shells
• Fall: Pumpkins, bats, foxes, autumn leaves
• Winter: Snowflakes, Christmas trees, reindeer
• Holiday specials for Christmas, Halloween, Valentine's Day & Easter!

📱 FEATURES
• 110 FREE origami projects to enjoy right away
• Step-by-step instructions with helpful tips
• Track your progress and earn XP points
• Save your favourites for easy access
• Beautiful, kid-friendly design

⭐ FOLDIVERSE PREMIUM (185+ extra projects!)
• Unlock rare animals: Axolotl, Narwhal, Snow Leopard, Baby Dragon
• Beautiful flowers: Sakura, Bird of Paradise, Orchid
• Cool objects: Pirate Ship, UFO, Dragon Mask, Space Rocket
• New projects added regularly
• 1 month FREE trial, then just $2.99/month or $24.99/year

🛡️ SAFE FOR KIDS
• No ads ever
• COPPA compliant
• No data sold or shared
• Simple, kid-friendly language throughout

Start your origami journey today! Fold, create, and amaze with Foldiverse. 🦋
```

---

## Category
**Primary:** Education
**Secondary:** Entertainment

## Content Rating
**Target Age:** All Ages (includes children)
**IARC Rating:** Apply for "Everyone" rating
**Contains:** Digital purchases (subscriptions)

## Store Listing Checklist

### Required Assets
- [ ] App Icon: 512x512 PNG (high-res)
- [ ] Feature Graphic: 1024x500 PNG
- [ ] Screenshots: Min 2, max 8 (phone: 16:9 or 9:16)
- [ ] Privacy Policy URL: Host privacy-policy.html and provide URL

### Developer Account Setup
1. Go to https://play.google.com/console
2. Pay $25 one-time registration fee
3. Complete identity verification
4. Create new app → "Foldiverse"
5. Fill in store listing details above
6. Upload app bundle (.aab file)

### Building for Play Store
Run these commands when ready:
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure for Android build
eas build:configure

# Build Android App Bundle for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

### Google Play Billing Setup
1. In Play Console → Monetise → Products → Subscriptions
2. Create subscription: "foldiverse_monthly"
   - Price: $2.99/month
   - Free trial: 1 month
3. Create subscription: "foldiverse_yearly"
   - Price: $24.99/year
   - Free trial: 1 month
4. These product IDs must match the ones in the app code

### App Review Notes
- App is kid-friendly, targets all ages
- Contains in-app subscriptions (Google Play Billing)
- No ads
- COPPA compliant
- Privacy policy URL required

---

## Timeline Estimate
1. Create Play Developer Account — 1 day (+ verification 1-3 days)
2. Build production APK/AAB — 15 minutes
3. Upload to Play Console — 30 minutes
4. Fill store listing — 1 hour
5. Google review — 1-7 days
6. **Total: ~3-10 days to go live**
