# TrumpSword - Political Promise Tracker Plugin for Meegle

TrumpSword is an intelligent plugin system that tracks political promises and workflows (Legislative, Executive Orders, Appointments) and syncs them as work items in [Meegle](https://www.meegle.com/).

## 🚀 Deployment Guide

### Prerequisites
1.  **GitHub Account**: To host the code.
2.  **Supabase Account**: For the database (PostgreSQL).
3.  **Vercel Account**: For hosting the application (Frontend + Backend Serverless).
4.  **OpenAI API Key**: For intelligent analysis of political texts.

---

### Step 1: Database Setup (Supabase)

1.  Create a new project on [Supabase](https://supabase.com/).
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  Copy the content of `migrations/20250211_init.sql` from this repository.
4.  Run the SQL script to create the necessary tables and security policies.
5.  Go to **Project Settings -> API** and copy:
    *   `Project URL`
    *   `anon` public key
    *   `service_role` secret (Optional, mostly for backend admin tasks)

### Step 2: GitHub Repository

1.  Create a new repository on GitHub (e.g., `trumpsword`).
2.  Push this code to your new repository:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/trumpsword.git
    git branch -M main
    git push -u origin main
    ```

### Step 3: Vercel Deployment

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..." -> "Project"**.
2.  Import your `trumpsword` GitHub repository.
3.  **Configure Project**:
    *   **Framework Preset**: Vite
    *   **Root Directory**: `./` (Leave default)
    *   **Build Command**: `npm run build` (or `tsc -b && vite build`)
    *   `Output Directory`: `dist`
4.  **Environment Variables**: Add the following variables:
    *   `VITE_SUPABASE_URL`: Your Supabase Project URL (Frontend)
    *   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key (Frontend)
    *   `SUPABASE_URL`: Your Supabase Project URL (Backend)
    *   `SUPABASE_SERVICE_ROLE_KEY`: **Required** - Your Supabase Service Role Secret (Backend Admin Access)
    *   `SUPABASE_KEY`: Your Supabase Anon Key (Fallback)
    *   `OPENAI_API_KEY`: Your DeepSeek/OpenAI API Key
    *   `OPENAI_BASE_URL`: (Optional) Custom LLM URL (e.g., https://api.deepseek.com/v1)
    *   `MEEGLE_PLUGIN_ID`: Your Meegle Plugin ID
    *   `MEEGLE_PLUGIN_SECRET`: Your Meegle Plugin Secret
5.  Click **Deploy**.

### Step 4: Verify Deployment

1.  Once deployed, Vercel will give you a domain (e.g., `trumpsword.vercel.app`).
2.  Open the URL. You should see the login page.
3.  Register a new account (or check database for manually created users).
4.  The backend API will be available at `/api/...`.

---

## 🛠️ Local Development

1.  Clone the repo.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file based on the example above.
4.  Run the development server:
    ```bash
    npm run dev
    ```
5.  Open `http://localhost:5173`.

## 🏗️ Architecture

*   **Frontend**: React, TailwindCSS, Lucide Icons, Zustand
*   **Backend**: Node.js (Express), Serverless ready (Vercel)
*   **Database**: Supabase (PostgreSQL)
*   **AI**: OpenAI (Text Analysis)
*   **Integration**: Meegle Open API
