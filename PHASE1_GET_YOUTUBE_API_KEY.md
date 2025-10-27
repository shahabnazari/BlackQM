# PHASE 1: Get YouTube Data API v3 Key

**Time Required:** 5 minutes
**Cost:** FREE
**Difficulty:** Easy (follow screenshots below)

---

## Step-by-Step Instructions

### Step 1: Go to Google Cloud Console

1. Open your web browser
2. Go to: https://console.cloud.google.com/
3. Sign in with your Google account (Gmail)
4. If you don't have a Google account, create one first

---

### Step 2: Create a New Project (or Select Existing)

**If this is your FIRST TIME:**

1. You'll see a screen that says "Select a project" at the top
2. Click on the dropdown that says "Select a project"
3. Click "NEW PROJECT" button (top right of the popup)
4. Enter project name: `VQMethod-Research` (or any name you want)
5. Leave organization field empty (unless you have one)
6. Click "CREATE" button
7. Wait 10-20 seconds for project to be created
8. You'll see a notification when it's ready

**If you ALREADY HAVE projects:**

1. Click the project dropdown at the top of the page
2. Either select an existing project OR click "NEW PROJECT" to create one
3. Make sure the correct project name is showing at the top

---

### Step 3: Enable YouTube Data API v3

1. Look for the search bar at the top that says "Search products and resources"
2. Type: `YouTube Data API v3`
3. Click on "YouTube Data API v3" from the search results
4. You'll see a page with a blue "ENABLE" button
5. Click "ENABLE"
6. Wait 5-10 seconds
7. You should see "API enabled" notification

**Alternative way:**

1. Click on the "☰" menu (hamburger menu) on the top left
2. Scroll down and click "APIs & Services"
3. Click "Enable APIs and Services" (big blue button)
4. Search for "YouTube Data API v3"
5. Click on it, then click "ENABLE"

---

### Step 4: Create API Key (Credentials)

1. After enabling the API, you should see "Credentials" in the left sidebar
2. Click "Credentials"
3. At the top, click "CREATE CREDENTIALS" button
4. From the dropdown, select "API key"
5. A popup will appear showing "API key created"
6. You'll see something like: `AIzaSyD1234567890abcdefghijklmnopqrstuvw`
7. **COPY THIS KEY** - Click the copy button 📋
8. **DO NOT CLOSE THIS YET**

---

### Step 5: Restrict the API Key (Security - IMPORTANT)

1. In the popup, click "EDIT API KEY" or "RESTRICT KEY"
2. Under "API restrictions":
   - Select "Restrict key"
   - Click "Select APIs" dropdown
   - Find and check "YouTube Data API v3"
   - Uncheck everything else
3. Under "Application restrictions" (optional but recommended):
   - Select "IP addresses"
   - Click "Add an IP address"
   - Add: `0.0.0.0/0` (allows all IPs - for development)
   - Or add your specific IP if you know it
4. Click "SAVE" at the bottom
5. Wait for "API key saved" notification

---

### Step 6: Give Me Your API Key

**Copy your API key and paste it here in the chat:**

```
YOUTUBE_API_KEY=paste-your-key-here
```

**Your key will look something like:**

```
YOUTUBE_API_KEY=AIzaSyD1234567890abcdefghijklmnopqrstuvw
```

---

## Common Issues & Solutions

### Issue 1: "You need to enable billing"

- **Solution:** YouTube Data API v3 is FREE for 10,000 requests/day
- You might need to enable billing but won't be charged unless you go over the free quota
- Click "Enable Billing" and add a payment method (it won't charge you)

### Issue 2: "Project already exists"

- **Solution:** That's fine! Just select the existing project and continue

### Issue 3: "Cannot find YouTube Data API v3"

- **Solution:** Make sure you're typing exactly: `YouTube Data API v3` (with capital Y and D)

### Issue 4: "API key not working"

- **Solution:** Wait 1-2 minutes after creating the key for it to activate
- Make sure you restricted it to "YouTube Data API v3" only

---

## What Happens Next?

After you give me your API key:

1. ✅ I'll add it to your backend/.env file
2. ✅ I'll restart the backend server
3. ✅ We'll test YouTube search with a real query
4. ✅ You'll see real YouTube videos instead of demo data
5. ✅ I'll remove all demo data fallbacks

---

## Security Reminder

- Never share your API key publicly (only with me in this chat)
- I'll add it to your .env file which is NOT committed to git
- You can always regenerate the key if you accidentally expose it

---

## Ready?

1. Follow the steps above
2. Copy your YouTube API key
3. Paste it in the chat like this:
   ```
   YOUTUBE_API_KEY=your-actual-key-here
   ```

**I'm waiting for your API key to continue to PHASE 2!** 🚀
