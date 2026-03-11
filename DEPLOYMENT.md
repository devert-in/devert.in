# DeVert Deployment Guide

## Prerequisites
1.  **Firebase CLI**: You already have this installed (`v15.4.0`).
2.  **Google Cloud CLI**: You need to install the Google Cloud SDK to deploy the backend.
    *   [Download and Install Google Cloud SDK for Windows](https://cloud.google.com/sdk/docs/install)
    *   Once installed, run: `gcloud init` in your terminal to log in.

---

## Part 1: Backend Deployment (Google Cloud Run)
Since your backend is Java (Spring Boot), we will use **Google Cloud Run**. This allows your backend to run as a "Serverless Container".

1.  **Open Terminal** in `devert-backend` folder.
2.  **Enable Services**:
    ```powershell
    gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
    ```
3.  **Build and Deploy** (Run this command):
    *   Replace `YOUR_PROJECT_ID` with your actual Firebase project ID (you can find this in `.firebaserc` or the Firebase Console).
    ```powershell
    gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/devert-backend
    ```
4.  **Deploy to Cloud Run**:
    ```powershell
    gcloud run deploy devert-backend --image gcr.io/YOUR_PROJECT_ID/devert-backend --platform managed --region us-central1 --allow-unauthenticated
    ```
    *   *Note*: Save the **Service URL** output by this command (e.g., `https://devert-backend-xyz.a.run.app`).

---

## Part 2: Frontend Deployment (Firebase Hosting)

1.  **Build the Frontend**:
    Run this in the `devert-frontend` directory:
    ```powershell
    npm run build
    ```
    (This creates the static `out` folder).

2.  **Deploy**:
    Run this in the root `DeVert.in` directory:
    ```powershell
    firebase deploy --only hosting
    ```

---

## Part 3: Connecting Frontend to Backend
To make your API calls work seamlessly (e.g., `/api/users` instead of the full Cloud Run URL), we configure a **Rewrite**.

1.  Open `firebase.json`.
2.  Update the `hosting` section to look like this:

```json
  "hosting": {
    "public": "devert-frontend/out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "cleanUrls": true,
    "trailingSlash": false,
    "rewrites": [
      {
        "source": "/api/**",
        "run": {
          "serviceId": "devert-backend",
          "region": "us-central1"
        }
      }
    ]
  }
```

3.  **Redeploy Hosting**:
    ```powershell
    firebase deploy --only hosting
    ```
