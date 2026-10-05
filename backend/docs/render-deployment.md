# Deploying SafeSignal Backend to Render

This guide outlines the step-by-step process to deploy the SafeSignal Node.js/Express backend to [Render](https://render.com/).

## 1. Prerequisites

1. Your SafeSignal codebase must be pushed to a GitHub or GitLab repository.
2. You must have a Render account.
3. You need your Firebase Admin SDK Service Account credentials (from the Firebase Console).

---

## 2. Create a New Web Service

1. Log in to your Render dashboard.
2. Click **New** in the top right corner and select **Web Service**.
3. Choose **Build and deploy from a Git repository**.
4. Connect your GitHub/GitLab account and select the SafeSignal repository.

---

## 3. Configure the Web Service

Fill in the configuration details exactly as follows:

| Setting | Value |
|---------|-------|
| **Name** | `safesignal-backend` *(or your preferred name)* |
| **Region** | Choose the region closest to your Firebase Firestore location (e.g., Singapore for Asia). |
| **Branch** | `main` *(or your primary production branch)* |
| **Root Directory** | `backend` *(Crucial: This tells Render that the backend is inside the `backend/` folder)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

> **Why `npm start`?** 
> Inside `backend/package.json`, the start script is mapped to `node src/server.js`, which is the production entry point.

---

## 4. Set Environment Variables

Before clicking "Create Web Service", scroll down to the **Environment Variables** section. Click **Add Environment Variable** for each of the following:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Enables production optimizations in Express. |
| `FIREBASE_PROJECT_ID` | `your-firebase-project-id` | From your Firebase console. |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...` | The service account email. |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\nMIIEvQ...` | Copy and paste the entire private key from the JSON file. Render fully supports multi-line environment variables. Ensure the `\n` characters are preserved as actual newlines if pasting directly, or just paste the raw text with actual line breaks. |
| `ALLOWED_ORIGINS` | `https://your-frontend.onrender.com` | The exact URL where your React frontend is hosted. Multiple origins can be comma-separated. Do not put a trailing slash. |

> **Note on `PORT`:** Render automatically injects the `PORT` environment variable at runtime. You do not need to set it manually. SafeSignal's `server.js` will automatically pick it up.

---

## 5. Deploy

1. Click **Create Web Service** at the bottom of the page.
2. Render will automatically pull your repository, change directory into `backend`, run `npm install`, and then execute `npm start`.
3. Wait for the build logs to display:
   ```
   [Firebase] Admin SDK initialised. Project: safesignal-...
   [Server] Running in production mode on port 10000
   ```
4. Once the service is marked as **Live**, your backend is publicly accessible.

---

## 6. Verify Deployment

To verify your deployment is successful, click the public `.onrender.com` URL provided at the top of your Render dashboard. You can test the system health endpoint:

**Request:**
```bash
curl https://your-render-url.onrender.com/api/v1/admin/system/health
```

**Expected Response (If unauthenticated):**
```json
{
  "success": false,
  "message": "Missing authentication token. Include Authorization: Bearer <token> header."
}
```
*(Getting this 401 response confirms the Express server is running, the route is active, and the Firebase auth middleware is successfully intercepting requests.)*

---

## 7. Connecting the Frontend

Once the backend is live, copy the Render URL (e.g., `https://safesignal-backend.onrender.com`) and update your frontend's API base URL configuration to point to this new production endpoint. 

Remember to rebuild and deploy the frontend after making this change!
