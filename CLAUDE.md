# AFS – Al Furqan School Okara app (project guide for Claude)

Read this first. It is the memory of the project, so the owner does not have to re-explain it.

## Owner and how to work with him
- Owner: **Saqib Khalil** (teacher at Al Furqan College Okara), justusok007@gmail.com, Okara, Pakistan. Not a programmer: explain in plain, short steps, one thing at a time.
- He tests every change on his **Android phone** and runs **SQL files himself** in the Supabase SQL editor. He cannot run commands. So: always say exactly what he must do (run which SQL file, deploy which function, install which APK).
- Discuss first when he says "discuss"; otherwise just do the work. Keep answers short. He writes English; the app is English + Urdu (RTL).
- Reply with the download link after a new APK. Do not paste long code at him unless he asks.

## What the app is
Bilingual (English / Urdu RTL) school management app for **Al Furqan School Okara** (Boys and Girls campuses).
Roles: **Parent, Teacher, Principal, Vice Principal, Accountant, Admin, Attendance Coordinator.**
Features: attendance (marking, unlocks, corrections), fees and vouchers/receipts, exam results (with admin cross-class overview), diary (text + photos), notices, messages, activity log, daily backup and restore, push notifications, merging duplicate parent accounts, pull-to-refresh and auto refresh, offline viewing.
Accounts are created **only by the admin** (public sign-up is closed by a database trigger). Passwords: minimum 6 characters.

## Stack and places
- React 19 + TypeScript + Vite + Tailwind 4 + recharts. `vite.config.ts` uses `base: './'`.
- Backend: **Supabase** (free plan), project URL `https://szekjxewhuffqspmlbmb.supabase.co` (REST helpers, no supabase-js in the app).
- Repo: `justusok007-glitch/AFS` (public). Work on `main`. Working copy used by Claude: `/home/claude/afs`.
- Web preview (GitHub Pages, auto-deploys after CI): https://justusok007-glitch.github.io/AFS/
- Android: **Capacitor 7** wraps the same web build. App name **AFS Okara**, app id **`pk.alfurqan.okara`** (never change: permanent for the Play Store).
- APK download (always the latest build): https://github.com/justusok007-glitch/AFS/releases/download/apk-latest/AlFurqanSchool.apk
- Firebase project `alfurqanschool-ok` (FCM for Android notifications); `firebase/google-services.json` and `firebase/app-icon.png` live in the repo.

## Code map
- `src/App.tsx` – shell, splash, back-button handling (browser popstate and native Capacitor back), exit logic.
- `src/ui/screens/` – `LoginScreen`, `RoleHomeScreen` (tabs, pull-to-refresh, refresh listeners, push sync, open-tab-from-notification), `SettingsScreen`, and folders per role: `parent`, `teacher`, `principal`, `accountant`, `admin`, `diary`, `exams`, `comms`.
- `src/ui/navigation/backStack.ts` – `useBackHandler(active, fn, priority)`: phone Back closes inner screens first, then previous tab, then exits.
- `src/data/repository/FakeRepositories.ts` – the local data layer (in-memory cache `dbCache` over localStorage `afs_okara_local_db_v2`); `repositories.ts` – interfaces.
- `src/data/supabase/` – `client.ts` (REST: rpc, selectAll, insertRows, patchRows, deleteWhere, tokens), `sync.ts` (pullAll, diff push, `forceRefresh`, `refreshIfIdle`, `restoreUnsentEdits`, refresh listeners), `baselineStore.ts` (IndexedDB baseline of last synced), `diary.ts`, `backup.ts`, `push.ts`, `activity.ts`, `SupabaseAuthRepository.ts`, `mode.ts` (`CLOUD_ENABLED`).
- `src/data/nativeFiles.ts` – `IS_NATIVE_APP` and `saveBlobFile` (share sheet in the Android app; anchor download in the browser). Use it for any file download.
- `src/res/strings.ts` – ALL texts: add the key to the `StringKey` union AND to both the English and Urdu objects.
- `public/sw.js`, `public/manifest.webmanifest` – web push service worker and PWA manifest (relative paths).
- `supabase/001…013_*.sql` – run in order (all already run). New database changes = a new numbered file; the owner runs it.
- `supabase/functions/send-push/index.ts` – Edge Function (Deno) that sends Web Push (VAPID) and Android FCM. Deployed by the owner by pasting the code in the Supabase dashboard, **Verify JWT OFF**.

## How data and sync work
- Hybrid: a local copy for speed and offline viewing + Supabase as the truth. `pullAll` fetches, edits are diff-pushed. Unsent edits survive closing the app. When nothing changed, a refresh does not re-render.
- Row Level Security everywhere; helpers `app_role()`, `is_role()`, `my_sections()`, `my_children()`, `visible_students()`, etc. Parents see only their own children, teachers and class info as limited by `013_privacy.sql`.
- Diary photos: private `diary` storage bucket, compressed on the phone (~350 KB), purged after 30 days (admin opening the app triggers `purgeOldDiaryPhotos`). One stored copy serves all parents.
- Backups: `ensure_daily_backup()`, `backup_now()`, `list_backups()`, `restore_backup()` (admin; restore asks the user to type RESTORE and downloads a safety file first).
- Offline: opens and shows the last data; edits queue; refresh shows "Could not refresh. Check internet."; on the `online` event the app clears that note and catches up.

## Notifications
- Triggers (statement-level, pg_net) → `push_send()` → Edge Function `send-push`. Kinds: absent, late, leave (today only), voucher, result, diary. Tap opens the matching tab (diary→diary, voucher→fees, result→results, absent/late/leave→attendance).
- Table `push_subscriptions(endpoint, user_id, p256dh, auth)`. Browser rows have a web-push endpoint; **Android rows have `endpoint = 'fcm:<token>'`** with p256dh/auth = `'fcm'`. `register_push` / `unregister_push` RPCs.
- Edge Function secrets (set by owner in Supabase): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `PUSH_SECRET`, `FIREBASE_SERVICE_ACCOUNT` (the whole Firebase service-account JSON). Never put secret values in the repo or in chat.
- In the Android app the PushCard is hidden; the permission prompt appears after login (`nativeSync` in `push.ts`).

## Build, CI and release
- `.github/workflows/ci.yml` runs on every push: `npm install`, `tsc --noEmit`, `vite build`. **CI is the typecheck** (the sandbox usually has no node_modules/npm access). Check results with `gh api repos/justusok007-glitch/AFS/commits/$sha/check-runs`; for errors read the annotations (`error TS`).
- `pages.yml` deploys the web preview after CI. `e2e.yml` is a manual end-to-end test.
- **`android.yml` (manual: workflow_dispatch)** builds the APK: web build → `cap add android` → patches (icons from `firebase/app-icon.png`, Firebase, notification permission/icon, status-bar inset fix in `MainActivity`, version = run number) → `assembleRelease` → signs with the test keystore (`android-signing/`) → publishes the release `apk-latest`. Trigger: `gh api -X POST repos/justusok007-glitch/AFS/actions/workflows/android.yml/dispatches -f ref=main`, wait for success, then tell the owner the link. The sandbox cannot download Actions artifacts (blocked); use the release link.
- The test signing key is public in the repo on purpose: **do not use it for the Play Store**; create a private upload key first.
- Sandbox limits: network allowlist blocks the Supabase hosts, GitHub GraphQL, and Actions secrets API; use `gh api` REST. Strings are edited by inserting into `strings.ts` (escape quotes).

## Known limits and decisions
- The APK contains the web files: **every app change needs a new APK** (data changes do not). Web version updates automatically.
- Printing (window.print) may not work inside the Android WebView; not tested.
- Deferred by the owner: WhatsApp fee reminders, printable Urdu report cards / fee slips.
- Free Supabase plan pauses after about a week of no use; consider upgrading before launch.
- The in-app name on the login page still reads "Al Furqan School Okara"; phone name is "AFS Okara".

## Next steps (owner's plan)
1. Pilot with a few teachers and parents, collect problems.
2. Play Store: $25 developer fee, privacy policy page (include the activity-tracking line), private signing key, store listing and screenshots.
3. Later ideas: offline banner with last-updated time, more reports.

## Working rules
- Make small safe changes; push; wait for CI green before telling the owner it is done.
- After any change the app needs, say clearly: "run SQL file X", "deploy function", or "install new APK".
- Commit messages end with the standard attribution lines requested by the session.
