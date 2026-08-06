# ClassHub — setup guide

A real, deployed version of the class site: login, live chat, groups, friends/DMs,
an arcade with uploadable `.zip` games, and an admin panel. Runs over normal
HTTPS (port 443), same as any other website, so it works from the school network.

This is a genuine multi-file project, not a single HTML file — follow the steps
in order. Budget about 30-45 minutes the first time.

---

## 0. What you'll need

- A free [Supabase](https://supabase.com) account (this is your database + file storage)
- A free [Vercel](https://vercel.com) account (this hosts the site)
- [Node.js](https://nodejs.org) installed on your computer (v18 or newer) — to test locally before deploying
- A GitHub account (Vercel deploys from a GitHub repo)

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick any name/region, set a database password (save it somewhere).
3. Wait ~2 minutes for it to provision.
4. Open **SQL Editor** → **New query**, paste the entire contents of
   `supabase/schema.sql` from this project, and click **Run**. This creates
   all the tables (users, messages, groups, friends, games) and the security
   policy that keeps DMs private.
5. Open **Storage** → **New bucket**. Name it exactly `games`, and toggle
   **Public bucket** ON (this is what lets the arcade iframe load game files
   directly). Click **Create bucket**.
6. Open **Settings → API**. You'll need three values from this page in step 3
   below:
   - `Project URL`
   - `anon` `public` key
   - `service_role` `secret` key (click "Reveal" to see it)

---

## 2. Get the code running locally

1. Unzip the project folder you downloaded.
2. Open a terminal in that folder and run:
   ```
   npm install
   ```
3. Copy the env template and fill it in:
   ```
   cp .env.local.example .env.local
   ```
   Open `.env.local` and paste in the values from Supabase step 1.6:
   - `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the `anon public` key
   - `SUPABASE_SERVICE_ROLE_KEY` = the `service_role secret` key
   - `SESSION_SECRET` = run `openssl rand -base64 48` in your terminal (or any
     long random string) and paste the result in

4. Start it:
   ```
   npm run dev
   ```
5. Open `http://localhost:3000` — you should see the login screen. Create the
   first account (it becomes admin automatically), then open the site in a
   second browser (or an incognito window) and create a second account to
   test chat between two people.

If something's broken, check the terminal output first — most issues at this
stage are a missing/mistyped value in `.env.local`.

---

## 3. Put the code on GitHub

1. Create a new empty repository on GitHub (don't initialize it with a README).
2. In your project folder:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
   (`.env.local` is already excluded via `.gitignore` — your keys never get
   pushed to GitHub, which is important since the repo may be public.)

---

## 4. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the
   GitHub repo you just pushed.
2. Vercel auto-detects Next.js — you don't need to change any build settings.
3. Before clicking Deploy, open **Environment Variables** and add the same
   five values from your `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`.
4. Click **Deploy**. After a minute or two you'll get a live URL like
   `https://your-project.vercel.app` — this is already served over HTTPS on
   port 443 by default, nothing extra to configure.
5. Open that URL from your phone on cellular data (not school wifi) first, to
   confirm the app itself works before testing the school network.

---

## 5. Test it on the school network

1. On school wifi, visit your `vercel.app` URL.
2. If it loads and you can sign up/log in — you're done, this is exactly the
   "if it works, we won't block it" scenario your IT department described.
3. If it's blocked, it's almost certainly the **domain category filter**
   flagging `vercel.app` generally (shared hosting domains sometimes get
   swept up) rather than anything about your specific site. Two options:
   - Ask IT to allowlist your specific `.vercel.app` URL.
   - Buy a cheap custom domain (e.g. from Namecheap, ~$10/year) and connect
     it in Vercel's **Domains** settings — a dedicated domain is far less
     likely to be caught by a category filter than a shared one, and Vercel
     issues it a free HTTPS certificate automatically.

---

## 6. Using the site

- The **first account ever created** becomes admin automatically. Make this
  your own account, first, before sharing the link with classmates.
- Admins get an extra 🛠️ tab: manage users (promote/demote/delete), delete
  any message anywhere, view every group and DM conversation, and manage
  arcade games.
- To add an arcade game: **Arcade → + Add game**, give it a name, and upload
  a `.zip` that contains an `index.html` at its root (or inside one wrapper
  folder) — that's the game's entry page. Simple HTML5/JS games (Scratch
  exports, itch.io HTML5 downloads, GameMaker HTML5 builds, etc.) all work
  this way. The uploaded game runs inside a sandboxed iframe so it can't
  access cookies or other games on the site.
- Tell your classmates plainly that admins can see private DMs and group
  chats for moderation — that's built in on purpose, and it's fair to be
  upfront about it before people start using it.

---

## 7. A few honest limitations to know about

- **Chat delivery**: global and group chat use Supabase Realtime, so messages
  appear near-instantly. DMs are deliberately *not* on the public realtime
  channel (to keep them private from the public API key) and instead refresh
  every 3 seconds — still fast, just not instant.
- **Zip uploads are capped at 40MB** and only accept web-safe file types
  (html/js/css/images/audio/fonts/wasm) — good for browser games, not for
  uploading arbitrary executables.
- **No password reset flow** — if a student forgets their password, an admin
  has to delete and recreate their account from the Admin → Users tab.
- **Supabase and Vercel free tiers** are generous for a single class but do
  have usage limits — fine for this use case, just something to know if the
  site somehow blows up in popularity.
