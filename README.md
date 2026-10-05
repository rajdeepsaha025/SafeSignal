# SafeSignal

**Real-Time UPI Fraud Detection & Pre-Transaction Risk Scorer**

SafeSignal is a citizen-facing fraud intelligence platform that allows users to check UPI IDs before making payments and submit suspicious UPI IDs for community review. 

The system relies on a combination of rule-based risk scoring and a community reporting mechanism, moderated by a tiered administrative system, to identify and flag fraudulent UPI accounts.

## Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Firebase Project Setup](#firebase-project-setup)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running the Frontend](#running-the-frontend)
- [Running the Backend](#running-the-backend)
- [Running Frontend and Backend Together](#running-frontend-and-backend-together)
- [Database Schema and Collections](#database-schema-and-collections)
- [API Documentation](#api-documentation)
- [Authentication and Authorization](#authentication-and-authorization)
- [Testing and Code Quality](#testing-and-code-quality)
- [Common Problems and Troubleshooting](#common-problems-and-troubleshooting)
- [Deployment](#deployment)
- [Security Guidelines](#security-guidelines)
- [Development Workflow and Contribution](#development-workflow-and-contribution)
- [Project Status and Roadmap](#project-status-and-roadmap)

---

## Project Overview

SafeSignal helps prevent digital payment fraud in India by assessing the risk of a UPI ID before a transaction occurs. 
Users can query the system with a UPI ID, and SafeSignal returns a calculated risk score based on community reports and internal rules.

**Current Implementation Status:**
- The **Backend API** is fully implemented with robust authentication, role-based access control (RBAC), community reporting, UPI risk checking, moderation queues, and administrative operations. 
- The **Frontend** is currently a static mock prototype for demonstration purposes and does **not** yet connect to the backend or Firebase Authentication. 

> **Disclaimer:** Risk scores are indicators of potential risk based on community reports and system rules. They are not absolute guarantees of fraud or safety. The system does not verify actual bank account ownership.

---

## Features

| Feature | Status |
|---------|--------|
| **UPI ID Normalization** | Implemented (Backend) |
| **Rule-Based Risk Scoring** | Implemented (Backend) |
| **Firebase Authentication** | Implemented (Backend) |
| **Role-Based Access Control** | Implemented (Backend) |
| **Community Fraud Reporting** | Implemented (Backend) |
| **Report Moderation** | Implemented (Backend) |
| **UPI Intelligence Management** | Implemented (Backend) |
| **Internal SafeSignal Blacklist** | Implemented (Backend) |
| **Audit Logging** | Implemented (Backend) |
| **Administrative Configuration** | Implemented (Backend) |
| **Operational Dashboard APIs** | Implemented (Backend) |
| **Analytics (Reporting)** | Implemented (Backend) |
| **Machine Learning Integration** | Planned |
| **External Threat Intelligence Integrations** | Planned |

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Frontend** | React, Vite, React Router DOM, Material UI v5, Recharts | React 18, Vite 5 |
| **Backend** | Node.js, Express, Zod (Validation) | Express 4.19 |
| **Database** | Cloud Firestore | |
| **Authentication** | Firebase Authentication | |
| **Backend Firebase SDK**| Firebase Admin SDK | v12.0.0 |
| **Testing** | Vitest, Supertest | Vitest 5 |
| **Deployment** | Firebase Hosting (Frontend configured) | |

---

## Architecture Overview

**Current implemented request flow for the Backend:**
Developer API Client (e.g. Postman) → Backend REST API → Authentication Middleware (verifies Firebase ID Token) → Authorization Middleware (verifies RBAC in Firestore) → Controllers → Services → Repositories → Cloud Firestore.

*The React frontend currently utilizes mock data and does not issue live requests to the backend.*

**Layer Responsibilities:**
- **Controllers:** Handle HTTP requests and responses, execute Zod validation (`validate` middleware).
- **Services:** Execute core business logic and transaction management.
- **Repositories:** Abstract Cloud Firestore queries and writes.
- **Middleware:** Extracts and verifies Firebase tokens, enforces Roles (USER, MODERATOR, ADMIN).

```mermaid
graph TD
    Client[API Client] --> Express[Express Backend]
    Express --> Auth[authenticateFirebase Middleware]
    Auth --> RBAC[authorizeRoles Middleware]
    RBAC --> Controller[Route Controllers]
    Controller --> Service[Business Logic Services]
    Service --> Repository[Firestore Repositories]
    Repository --> Firestore[(Cloud Firestore)]
```

---

## Project Structure

```
SafeSignal/
├── backend/                       # Express REST API Backend
│   ├── docs/                      # API Endpoint Documentation
│   ├── scripts/                   # Seeding and utility scripts
│   ├── src/
│   │   ├── config/                # Environment, logger, and constants
│   │   ├── controllers/           # HTTP Request Handlers
│   │   ├── middlewares/           # Auth, RBAC, Validation, Error Handling
│   │   ├── repositories/          # Firestore data access layer
│   │   ├── routes/                # Express route definitions
│   │   ├── services/              # Business logic layer
│   │   ├── utils/                 # Helpers (ApiError, tokenExtractor, etc.)
│   │   ├── validators/            # Zod validation schemas
│   │   ├── app.js                 # Express app configuration
│   │   └── server.js              # Server entry point
│   └── tests/                     # Integration and Unit Tests (Vitest)
├── public/                        # Static frontend assets
├── src/                           # React Frontend (Mock Prototype)
│   ├── components/                # Reusable UI components
│   ├── context/                   # React Context (Contains Mock Data)
│   ├── pages/                     # Application pages
│   ├── theme/                     # Material UI Theme configuration
│   ├── App.jsx                    # Frontend routing
│   └── main.jsx                   # Frontend entry point
├── firebase.json                  # Firebase deployment and rules configuration
├── firestore.rules                # Firestore Security Rules
├── firestore.indexes.json         # Firestore Composite Indexes
├── storage.rules                  # Firebase Storage Rules
├── package.json                   # Frontend dependencies and Vite scripts
└── vite.config.js                 # Vite bundler configuration
```

---

## Prerequisites

- **Node.js:** >= 18.0.0
- **Package Manager:** npm
- **Git**
- **Firebase Project:** With Authentication and Cloud Firestore enabled.

Check your versions:
```bash
node -v
npm -v
```

---

## Firebase Project Setup

1. **Create Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. **Enable Authentication:** Navigate to Authentication > Sign-in method and enable **Email/Password**.
3. **Create Firestore Database:** Navigate to Firestore Database and create a database. Select a region close to your users (e.g., `asia-south1` for India). Start in **production mode**.
4. **Deploy Security Rules & Indexes:**
   To deploy the project's rules to your Firebase project, install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add <your-project-id>
   firebase deploy --only firestore:rules,firestore:indexes
   ```
5. **Get Admin Credentials for Backend:**
   - Go to Project Settings > Service Accounts.
   - Click **Generate new private key**.
   - Download the JSON file securely. You will need values from this file for the backend `.env`.

> **Note:** The SafeSignal frontend is not yet configured for a Firebase client SDK.

---

## Environment Variables

### Backend Environment Configuration
The backend requires an `.env` file at `backend/.env`.

Copy the example file:
```bash
cd backend
cp .env.example .env
```

**Required variables in `backend/.env`:**
| Variable | Required | Purpose | Example | Secret? |
|----------|----------|---------|---------|---------|
| `PORT` | Yes | API Port | `5000` | No |
| `NODE_ENV` | Yes | Environment mode | `development` | No |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID | `safesignal-12345` | No |
| `FIREBASE_CLIENT_EMAIL` | Yes | Service account email | `firebase-adminsdk-xyz@safesignal-12345.iam.gserviceaccount.com` | No |
| `FIREBASE_PRIVATE_KEY` | Yes | Service account private key | `"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANB...\n-----END PRIVATE KEY-----\n"` | **YES** |
| `ALLOWED_ORIGINS` | Yes | CORS allowed origins | `http://localhost:5173` | No |

*⚠️ Ensure the `FIREBASE_PRIVATE_KEY` retains its newline `\n` characters exactly as formatted in the JSON file.*

### Frontend Environment Configuration
Currently, the frontend relies on hardcoded mock data and does not require an `.env` file.

---

## Installation

**1. Install Frontend Dependencies (Root)**
```bash
npm install
```

**2. Install Backend Dependencies**
```bash
cd backend
npm install
```

---

## Running the Frontend

The frontend is a standalone React application currently operating on mock data.

1. Navigate to the project root.
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open the provided local URL (typically `http://localhost:5173`).
4. You can navigate through the prototype screens (Check, Admin, Reporting). *Note that all operations manipulate local React state mock data and do not persist to a database or contact the backend.*

---

## Running the Backend

The backend is a fully functional Express REST API.

1. Navigate to the `backend/` directory.
2. Ensure your `backend/.env` is fully configured with Firebase Admin credentials.
3. Start the development server (uses nodemon for hot-reloading):
   ```bash
   npm run dev
   ```
4. Verify the server is running by making a request to the health endpoint (if configured) or by observing the logs:
   ```
   [Firebase] Admin SDK initialised. Project: safesignal-12345
   [Server] Running in development mode on port 5000
   ```

**Database Seeding (Optional):**
To populate your Firestore database with mock UPI intelligence, users, and reports:
```bash
npm run seed
```
To clear the database:
```bash
npm run seed:clear
```

---

## Running Frontend and Backend Together

**Workflow for a New Developer:**
1. Configure Firebase and set up the `backend/.env`.
2. Open **Terminal 1** (Backend):
   ```bash
   cd backend
   npm run dev
   ```
3. Open **Terminal 2** (Frontend):
   ```bash
   npm run dev
   ```
4. Open the frontend in your browser.
5. **Important:** The frontend is not currently wired to the backend API. To test the backend API, use an API client like Postman or `curl`. You will need to manually generate a Firebase ID Token for a user to test authenticated backend routes.

---

## Database Schema and Collections

SafeSignal stores all data in Cloud Firestore.

- `users`: Contains user profiles, roles (`USER`, `MODERATOR`, `ADMIN`), and account statuses (`ACTIVE`, `BLOCKED`).
- `upi_profiles`: Stores risk intelligence on UPI IDs, including risk scores, risk levels, and blacklisting status.
- `reports`: Community-submitted fraud reports against specific UPI IDs, containing reporter UIDs, evidence, and moderation statuses (`PENDING`, `APPROVED`, `REJECTED`).
- `check_history`: Audit trails of risk checks performed by users on the platform.
- `analytics`: Aggregated daily metrics utilized by the administrative dashboards.
- `audit_logs`: Append-only, backend-generated logs tracking sensitive operations (role changes, blacklisting, banning).
- `system_config`: Global threshold weights and configuration for the risk engine.
- `device_reputation` / `ml_metadata`: Placeholder collections for future ML integrations.

Firestore Security Rules (`firestore.rules`) strictly govern client access. Almost all writes are securely deferred to the Backend API (Firebase Admin SDK).

---

## API Documentation

The backend exposes several modular APIs prefixed with `/api/v1`. 

Comprehensive Markdown API documentation is available in the `backend/docs/` directory:
- [Risk Engine API](backend/docs/risk-engine.md): `GET /api/v1/risk/check/:upiId`
- [Community Reporting API](backend/docs/community-reporting.md): `POST /api/v1/reports`, `GET /api/v1/reports`, etc.
- [Admin & Moderation API](backend/docs/admin-api.md): `GET /api/v1/admin/users`, `PATCH /api/v1/admin/upi/:upiId`, etc.

**Common Authorization:**
Most routes require an `Authorization: Bearer <Firebase_ID_Token>` header.

---

## Authentication and Authorization

1. **Authentication:** The backend verifies incoming Firebase ID Tokens utilizing the Firebase Admin SDK (`authenticateFirebase` middleware). It cross-references the token's UID with the Firestore `users` collection to ensure the user is `ACTIVE`.
2. **Authorization:** Privileged routes utilize the `authorizeRoles('ADMIN', 'MODERATOR')` middleware. This middleware reads the user's role directly from the Firestore document securely fetched during authentication, ensuring manipulated client tokens cannot escalate privileges.

| Role | Capabilities |
|------|--------------|
| **USER** | Can perform risk checks, submit reports, read own reports. |
| **MODERATOR** | Can read all reports, approve/reject reports, view moderation dashboards. |
| **ADMIN** | Can list/block users, change roles, globally blacklist UPIs, modify system risk configurations, read audit logs. |

---

## Testing and Code Quality

The backend contains a comprehensive Vitest testing suite covering business logic, risk scoring, validation, and RBAC endpoint protection.

To run the tests:
```bash
cd backend
npm test
```

To run linting (backend):
```bash
npm run lint
```

---

## Common Problems and Troubleshooting

- **Backend throws 401 Unauthorized:** Ensure you are passing a valid Firebase ID Token in the `Authorization: Bearer <token>` header. Tokens expire after 1 hour.
- **Backend tests fail with 'FirebaseAppError':** Ensure your `FIREBASE_PROJECT_ID` matches your configuration and that `FIREBASE_PRIVATE_KEY` has correct newline formatting (`\n`).
- **Frontend changes not saving:** The frontend is a static mock prototype. Changes made on the frontend will revert upon page reload as it does not yet communicate with the backend.
- **Cannot Demote Admin:** The backend enforces a safety rule preventing the demotion of the final active `ADMIN` in the system.

---

## Deployment

**Frontend:**
The project is configured for Firebase Hosting (`firebase.json`).
```bash
npm run build
firebase deploy --only hosting
```

**Backend:**
The backend is a standard Node.js Express application. It can be deployed to Google Cloud Run, Heroku, Render, or any standard containerized platform. Deployment configuration for the backend is pending. Ensure production environments populate all variables listed in `.env.example`.

---

## Security Guidelines

- **Never commit `.env` files.**
- **Never expose the `FIREBASE_PRIVATE_KEY` in the frontend or public repositories.**
- **Enforce Server-Side Authorization:** Never rely on frontend UI hiding for security. The backend `authorizeRoles` middleware must protect privileged endpoints.
- **Maintain Firestore Rules:** Ensure `firestore.rules` remains tightly locked down. Clients should generally only have `read`/`create` access to their own scoped data, while the Backend API handles complex mutations.

---

## Development Workflow and Contribution

1. Clone the repository.
2. Install frontend and backend dependencies.
3. Set up a dedicated development Firebase project.
4. Populate `backend/.env` with your development service account.
5. Create a feature branch: `git checkout -b feature/your-feature-name`.
6. Make changes. Ensure backend changes are covered by tests (`npm test`).
7. Ensure linting passes (`npm run lint`).
8. Submit a Pull Request.

---

## Project Status and Roadmap

- [x] **Backend Foundation & Database Architecture**
- [x] **Core Risk Engine API**
- [x] **Community Reporting & Moderation API**
- [x] **Admin Management API Layer**
- [ ] **Phase 6.5:** Wire React Frontend to Backend API & Firebase Auth
- [ ] **Phase 7:** Machine Learning Model Integration
- [ ] **Phase 8:** External API Integrations (I4C, Bank Registries)
