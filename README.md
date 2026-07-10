# CodeAlpha Social Media Platform 🚀
`CodeAlpha_SocialMediaPlatform`

A modern, highly polished, full-stack developer social network platform built to fulfill the criteria of a high-quality **CodeAlpha Full-Stack Development Internship Portfolio Project**. Inspired by clean, responsive user interfaces, this platform allows engineers, creators, and developers to share accomplishments, discuss technical trends, send secure direct messages, and build professional networks.

---

## 🎨 Design Concept & Visuals
- **Typography**: Paired **Inter** (optimized for general UI clarity and data density) with **Space Grotesk** (for tech-forward display typography and headers).
- **Layout**: Fluid dual-column desktop canvas with a left sticky workspace navigation sidebar and right sticky recommendations pane. Mobile designs collapse cleanly into top headers and thumb-optimized bottom rails.
- **Micro-Animations**: Features smooth button hover feedback, scale animations driven by `motion`, and optimistic engagement updates (such as zero-latency liking).

---

## 🛠️ Technology Stack

### Frontend (Client SPA)
* **Framework**: React 19 (Vite compilation engine)
* **Routing**: React Router DOM (protected navigation, deep-linking, search queries)
* **Styling**: Tailwind CSS (fully responsive layout grids and utility controls)
* **Animations**: Motion (`motion/react` layout transitions)
* **Icons**: Lucide React (modern, minimalist vector shapes)
* **State Management**: React Context API & Custom Hooks (Auth state sync & Custom Toast alerts)

### Backend (REST API Server)
* **Runtime**: Node.js & Express (modular controller structures)
* **Database**: MongoDB Atlas with Mongoose ORM (integrated with a zero-configuration Local JSON file-based database engine fallback for seamless sandbox previews)
* **Security & Auth**: JWT (JSON Web Tokens) with custom Authorization header verification, bcryptjs password salt hashing, and client-side route shields
* **Utility**: CORS handles multi-origin headers; expanded JSON-body size limits (50MB) allow direct base64 media uploads

---

## 📁 Folder Structure

```text
CodeAlpha_SocialMediaPlatform/
├── server.ts               # Full-Stack entry point (Express Server + Vite SPA middleware)
├── package.json            # Managed scripts and npm packages
├── metadata.json           # Application profile and frame permissions
├── db.json                 # Automatic local JSON database file (active fallback)
├── server/                 # Backend REST Controllers & Services
│   ├── db.ts               # Dual-driver DB manager (Mongoose + JSON File) & Auto-Seed
│   ├── routes.ts           # REST API Endpoint Routers
│   └── middleware.ts       # Secure JWT verification middleware
└── src/                    # Frontend React SPA
    ├── main.tsx            # DOM mounting entry point
    ├── App.tsx             # Route declarations and context providers
    ├── index.css           # Tailwind style entry & Google Typography imports
    ├── types.ts            # Client-side shared TypeScript interfaces
    ├── utils.ts            # Base64 file loaders & Time-ago dates formatting
    ├── components/         # Reusable interactive UI components
    │   ├── Layout.tsx      # Responsive navigation shell (Sidebar & Mobile rails)
    │   ├── PostCard.tsx    # Live Post element with optimistic Likes & quick Comments
    │   └── SuggestedUsers.tsx # Followers recommendation panel
    └── pages/              # Primary route pages
        ├── Landing.tsx     # Product feature showcase page
        ├── Login.tsx       # Auth login view with validations
        ├── Register.tsx    # Auth signup view with credential validation
        ├── Home.tsx        # News feed with active post composer
        ├── Profile.tsx     # Cover banner, bios, stats, and own posts grid
        ├── EditProfile.tsx # Profile picture, banner, and password changes
        ├── PostDetails.tsx # Scrollable comments list and comment forms
        ├── Search.tsx      # Users directory searching by query
        ├── Notifications.tsx # Likes, comments, and followers events
        ├── Messages.tsx    # Direct Messaging chat engine with periodic polling
        ├── Settings.tsx    # Security settings, change password, and logs
        └── NotFound.tsx    # Responsive interactive 404 handler
```

---

## 🔗 REST API Documentation

All API endpoints are hosted relative to `/api/*` and return standard structured JSON payloads.

### 🔐 Authentication Endpoints
* **`POST /api/auth/register`**: Registers a new user. Expects `{ name, username, email, password }`. Generates a JWT token.
* **`POST /api/auth/login`**: Authenticates a user. Expects `{ usernameOrEmail, password }`. Returns JWT token and safe user details.
* **`GET /api/auth/profile`**: Returns the safe profile data of the currently logged-in user. *(Requires Bearer Token)*
* **`PUT /api/auth/profile`**: Updates profile fields: display name, username, biography, profile photo, cover banner, or passwords. *(Requires Bearer Token)*

### 👥 User Directory Endpoints
* **`GET /api/users`**: Retrieves 5 recommended user profiles. Excludes the authenticated caller. *(Requires Bearer Token)*
* **`GET /api/users/search?q=term`**: Filters profiles by search term inside names or handles. *(Requires Bearer Token)*
* **`GET /api/users/:id`**: Retrieves full stats, profile settings, and posts for a specific user ID. *(Requires Bearer Token)*
* **`PUT /api/users/follow/:id`**: Establishes a follower-following connection. Dispatches follow notifications to the target. *(Requires Bearer Token)*
* **`PUT /api/users/unfollow/:id`**: Tears down follower-following connections. *(Requires Bearer Token)*

### 📝 Post & News Feed Endpoints
* **`GET /api/posts`**: Compiles the global chronological feed populated with author records. *(Requires Bearer Token)*
* **`GET /api/posts/:id`**: Retrives full metadata, media attachments, and comments list for a single post. *(Requires Bearer Token)*
* **`POST /api/posts`**: Publishes a post. Expects `{ caption, image }` (supports base64 image strings). *(Requires Bearer Token)*
* **`PUT /api/posts/:id`**: Updates post caption or media. Restricted to the post's author. *(Requires Bearer Token)*
* **`DELETE /api/posts/:id`**: Permanently deletes a post and clears nested comment references. *(Requires Bearer Token)*
* **`PUT /api/posts/like/:id`**: Adds a user's ID to a post's likes list. Sends notifications. *(Requires Bearer Token)*
* **`PUT /api/posts/unlike/:id`**: Removes user likes. *(Requires Bearer Token)*

### 💬 Thread Comments Endpoints
* **`POST /api/comments/:postId`**: Appends a comment to a specific post. Expects `{ comment }`. Sends comment alerts. *(Requires Bearer Token)*
* **`DELETE /api/comments/:commentId`**: Removes a comment from its post. Accessible to either the comment author or post author. *(Requires Bearer Token)*

### 🔔 Notifications Feed
* **`GET /api/notifications`**: Lists all follow, like, or comment notification alerts for the caller. *(Requires Bearer Token)*
* **`PUT /api/notifications/read`**: Marks all notifications of the caller as read. *(Requires Bearer Token)*

### ✉️ Private Messaging
* **`GET /api/messages/:userId`**: Retrives the complete chronological message log history with a specific peer. *(Requires Bearer Token)*
* **`POST /api/messages`**: Sends a message to a teammate. Expects `{ receiverId, text }`. *(Requires Bearer Token)*

---

## 🔐 Environment Variables Configuration

Copy `.env.example` into a local `.env` file to customize parameters:

```env
# Port & Network Bindings
PORT=3000

# Security Signatures
JWT_SECRET=codealpha_secret_key_2026

# MongoDB Atlas Credentials
# [Optional]: If omitted, the app will gracefully activate the Local JSON file DB (db.json) fallback
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.abc.mongodb.net/codealpha?retryWrites=true&w=majority
```

---

## ⚡ Setup & Installation

### Prerequisite Dependencies
- Ensure **Node.js (v18+)** is installed.

### Step 1: Install packages
```bash
npm install
```

### Step 2: Configure Environment
Create `.env` based on `.env.example`. You can leave `MONGO_URI` blank to test immediately with our zero-configuration seedable Local Database!

### Step 3: Run in Development
```bash
npm run dev
```
Open your browser to `http://localhost:3000` to interact with the system.

---

## 🚀 Deployment Workflows

This full-stack codebase has been compiled with modular separation and is fully prepared to deploy onto major cloud runtimes.

### Frontend (SPA static serve)
* Build the static client:
  ```bash
  npm run build
  ```
* Direct Vercel or Netlify to serve the static bundle folder inside `./dist/` using single page application (SPA) rewrite path settings (`/index.html`).

### Backend (Production NodeJS Container)
* Launch using:
  ```bash
  npm run start
  ```
* Host on cloud runners like Render, Heroku, or Google Cloud Run. 

---

## 💎 Automatic database Seeding
The application has a smart seed runner located in `/server/db.ts`. If the database (either MongoDB or JSON DB) is detected to be empty on server boot, it will automatically populate **10 rich users** (all realistic developer identities) and **30 rich sample posts** (fitted with comments, follower relations, notification records, and direct messages) from Unsplash tech workspaces. No manual database insert scripts are required!
