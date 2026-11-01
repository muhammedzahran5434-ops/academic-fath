# FATH MATES — Campus Portal

Static multi-file website for **Darul Hasanath Islamic College**: feed, stories, chat, awards, leaderboard, notices, CCE marks, member management — with **live cross-device sync through Firebase Firestore**.

This is the multi-file edition of the app (same features as the single-file `fath-mates.html`, split into a real project structure).

## Project structure (19 files)

```
fath-mates/
├── index.html          page shell: head, fonts, splash, script loading order
├── favicon.svg         FM monogram icon
├── .nojekyll           makes GitHub Pages serve everything as-is
├── README.md
├── css/
│   ├── base.css        design tokens, layout, buttons/inputs, navbar
│   ├── screens.css     landing, auth, feed, stories, chat, awards, admin, profile, modals
│   └── animations.css  keyframes (all transitions/animations)
└── js/                 loaded in this order (order matters):
    ├── utils.js        storage shim (LS), helpers, icons, formatters
    ├── data.js         local database mirror, session, media (IndexedDB), modals/toasts
    ├── shell.js        landing page, login/register screens, app shell + navigation
    ├── feed.js         dashboard + feed (posts, likes, comments, media)
    ├── status-chat.js  status/stories viewer + private chat
    ├── awards.js       achievements, approvals, leaderboard, notices
    ├── members.js      member management, profile, settings, academic marks, media vault
    ├── router.js       screen routing + app rendering
    ├── actions.js      all button handlers (single delegated click handler)
    ├── sync.js         Firebase sync engine (diff-push, live onSnapshot updates)
    ├── boot.js         startup, watchdog, fatal-error screen
    └── firebase.js     Firebase SDK init (module) → exposes window.FBS
```

## Run locally

The app is a static site — **don't double-click `index.html`** (browsers block module scripts on `file://`). Serve the folder instead:

```bash
# any one of these:
python3 -m http.server 8080        # then open http://localhost:8080
npx serve .
# or use the "Live Server" extension in VS Code
```

## Deploy to GitHub Pages

1. Push/upload **all files in this folder** to your repository (e.g. `academic-fath`), replacing the old single `index.html` — keep the `css/` and `js/` folders next to it.
2. GitHub repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main` / `/ (root)` → Save.
3. Your site goes live at `https://<username>.github.io/<repo>/` (all paths are relative, so sub-folder hosting works out of the box).

## Deploy to Vercel (alternative)

Import the repo at vercel.com → framework preset **Other** → deploy. No build step, output directory = repo root.

## Firebase (live sync)

- Project: `academic-fath-portal` — config already wired in `js/firebase.js`.
- Data lives in Firestore collections `fm_users`, `fm_posts`, `fm_stories`, `fm_messages`, `fm_achievements`, `fm_announcements`, `fm_notifications`, `fm_skills`, `fm_subjects`, `fm_marks`, `fm_files` (+ `fm_meta`).
- Every device sees posts/chats/status changes within ~1 second; sessions and settings stay device-local.
- Firestore Rules must allow read/write while the club app is in use (Console → Firestore → Rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

- If the network/Firebase is unreachable, the app still boots from its local mirror and re-syncs when back online (green/gray dot in the header shows sync state).

## Accounts

Accounts are managed inside the app (member IDs + passwords, hashed with SHA-256; the Administrator can add admissions, reset passwords, disable accounts). Use the credentials you already have.
