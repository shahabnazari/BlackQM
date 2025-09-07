# 🔐 Login Credentials & Instructions

## ✅ SOLUTION: Why "researcher@test.com" couldn't log in

The issue was that the user existed in the database but with an unknown password. The password has now been **reset and verified**.

---

## 📝 Test Accounts (Ready to Use)

### Researcher Account

- **Email:** `researcher@test.com`
- **Password:** `Password123!`
- **Role:** RESEARCHER
- **Status:** ✅ Verified & Working

### Admin Account

- **Email:** `admin@test.com`
- **Password:** `Password123!`
- **Role:** ADMIN
- **Status:** ✅ Verified & Working

### Participant Account

- **Email:** `participant@test.com`
- **Password:** `Password123!`
- **Role:** PARTICIPANT
- **Status:** ✅ Verified & Working

### Demo Account

- **Email:** `demo@vqmethod.com`
- **Password:** `Password123!`
- **Role:** RESEARCHER
- **Status:** ✅ Verified & Working

---

## 🚀 How to Log In

### Step 1: Start the Backend

```bash
cd backend
npm run start:dev
```

Wait for: `🚀 Backend server running on: http://localhost:4000/api`

### Step 2: Start the Frontend

```bash
cd frontend
npm run dev
```

Wait for: `✓ Ready in Xs`

### Step 3: Access the Application

1. Open browser: http://localhost:3000
2. Click "Login" or go to: http://localhost:3000/auth/login
3. Enter credentials:
   - Email: `researcher@test.com`
   - Password: `Password123!`
4. Click "Sign In"

---

## 🔧 Troubleshooting

### If login fails:

1. **Check Backend is Running**
   - Look for process on port 4000
   - Check terminal for errors
   - Verify: `curl http://localhost:4000/api/health`

2. **Check Database**

   ```bash
   cd backend
   npx ts-node prisma/check-users.ts
   ```

3. **Reset Password** (if needed)

   ```bash
   cd backend
   npx ts-node prisma/reset-password.ts
   ```

4. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for network errors
   - Check for CORS issues

### Common Issues & Solutions:

| Issue              | Solution                                             |
| ------------------ | ---------------------------------------------------- |
| "Network Error"    | Backend not running - start with `npm run start:dev` |
| "401 Unauthorized" | Wrong password - use `Password123!`                  |
| "User not found"   | Run reset-password script                            |
| "CORS Error"       | Check backend CORS configuration                     |
| Port 4000 in use   | Kill process: `lsof -ti:4000 \| xargs kill`          |

---

## 🛠️ Database Management

### View All Users

```bash
cd backend
npx ts-node prisma/check-users.ts
```

### Reset All Test Users

```bash
cd backend
npx ts-node prisma/reset-password.ts
```

### Prisma Studio (GUI)

```bash
cd backend
npx prisma studio
```

Opens at: http://localhost:5555

---

## 📊 What Was Fixed

1. **Database Initialized:** Created SQLite database with Prisma migrations
2. **User Created:** researcher@test.com was already in database
3. **Password Reset:** Changed password to known value: `Password123!`
4. **Email Verified:** Set emailVerified to true
5. **Additional Users:** Created admin, participant, and demo accounts

---

## 🔒 Security Notes

- These are **TEST ACCOUNTS ONLY**
- Do NOT use these credentials in production
- Change passwords before deploying
- Enable 2FA for production accounts

---

## ✅ Verification Complete

The login system is fully functional. You can now log in with:

- **Email:** `researcher@test.com`
- **Password:** `Password123!`

The authentication flow connects to the real backend with:

- JWT tokens
- Refresh tokens
- Session management
- Protected routes

---

**Last Updated:** September 6, 2025
**Status:** ✅ WORKING
