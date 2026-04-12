# Foldiverse Static Site - Netlify Deployment Guide

## What's Included

```
foldiverse-site/
  index.html          → Homepage (foldiverse.netlify.app/)
  privacy/index.html  → Privacy Policy (foldiverse.netlify.app/privacy)
  about/index.html    → About Page (foldiverse.netlify.app/about)
  _redirects          → Netlify config for clean URLs
```

## Deploy in 3 Steps (Drag & Drop)

### Step 1: Go to Netlify
1. Open **https://app.netlify.com**
2. Sign up free (use GitHub, GitLab, or email)
3. After login, you'll see your dashboard

### Step 2: Deploy
1. Scroll down to **"Want to deploy a new site without connecting to Git?"**
2. Click **"Deploy manually"** (or drag & drop area)
3. **Drag the `foldiverse-site` folder** (or the `foldiverse-site.zip` file) into the upload area
4. Wait 10-20 seconds — done!

### Step 3: Get Your URLs
Netlify gives you a random URL like `random-name-123.netlify.app`

Your pages will be:
- **Homepage:** `https://random-name-123.netlify.app`
- **Privacy:** `https://random-name-123.netlify.app/privacy`
- **About:** `https://random-name-123.netlify.app/about`

## Change the Site Name (Free)

1. Go to **Site settings → Site details → Change site name**
2. Change to `foldiverse` 
3. Your URLs become:
   - `https://foldiverse.netlify.app`
   - `https://foldiverse.netlify.app/privacy`
   - `https://foldiverse.netlify.app/about`

## Use Custom Domain (Optional)

If you buy `foldiverse.app` or `foldiverse.com`:
1. Go to **Site settings → Domain management → Add custom domain**
2. Add your domain
3. Follow Netlify's DNS setup instructions
4. Free HTTPS is automatic

## For Play Store Submission

Use these URLs:
- **Privacy Policy:** `https://foldiverse.netlify.app/privacy`
- **Website:** `https://foldiverse.netlify.app`

These are:
- ✅ Permanent (won't change)
- ✅ Fast (Netlify CDN worldwide)
- ✅ HTTPS (automatic SSL)
- ✅ Free forever (on Netlify free tier)
