# Foldiverse - Android AAB Build Instructions

## Everything is pre-configured. Just run these commands:

### Step 1: Save to GitHub
Click "Save to GitHub" in the Emergent interface.

### Step 2: Clone to your computer
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO/frontend
```

### Step 3: Install dependencies
```bash
npm install
```

### Step 4: Login to Expo (one-time)
```bash
# Create free account at https://expo.dev/signup if needed
npx eas-cli login
```

### Step 5: Build the AAB
```bash
npx eas-cli build --platform android --profile production
```

This builds in Expo's cloud (free tier: 30 builds/month). Takes ~10-15 minutes.

### Step 6: Download the AAB
After build completes, EAS provides a download link.
Or run:
```bash
npx eas-cli build:list --platform android
```

## What's Pre-Configured:

| Setting | Value |
|---------|-------|
| App Name | Foldiverse |
| Package Name | com.foldiverse.app |
| Build Type | app-bundle (.aab) |
| Allowed Permissions | BILLING only |
| Blocked Permissions | CAMERA, RECORD_AUDIO, STORAGE, AUDIO_SETTINGS |
| Version | 1.0.0 (versionCode 1) |

## The AAB will be:
- ✅ Signed and ready for Play Store upload
- ✅ Package: com.foldiverse.app
- ✅ No CAMERA permission
- ✅ No RECORD_AUDIO permission
- ✅ No storage permissions
- ✅ Only BILLING permission (for subscriptions)
- ✅ Play Store compliant for kids' app
