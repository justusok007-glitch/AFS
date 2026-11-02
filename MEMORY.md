# AFS project memory (for new Claude sessions)

Keep this file updated at the end of every work session: move finished items out of "Open", add new decisions and gotchas. Never write passwords, keys, tokens or private data here (public repo).

## Timeline (newest last)
- Built the web app (React/TS/Vite) with a local demo database, then connected Supabase (SQL files 001–013 in `supabase/`).
- Features added in order: accounts created by admin only, attendance + unlocks, fees/vouchers/payments, results, activity log, diary with photos (30-day photo purge), daily backup + restore, security fixes (009, 011 closes sign-up, 013 privacy), pull-to-refresh + auto refresh + speed fixes, new login page, parent Diary tab, phone Back-button stack, Web Push notifications, admin results overview, merge duplicate parent accounts.
- Oct 2026: Capacitor Android app (APK) built on GitHub Actions; fixed status-bar overlap (builds 4–5); offline note clears when internet returns (build 6); Firebase (FCM) notifications for the APK (build 7, works); app name **AFS Okara** and new icon (build 8); Admission No box in the student form (build 13); Fee breakdown reworked (builds 14–15): Previous arrears = charged/received/pending; New arrears (Oct 2026 to last month) = pending now + received this month; This month's fee charged = sum of active students' monthly fees (`getMonthlyFees`), received = receipts for this month and advances; Admission/Annual = received this month + pending on this month's bills (no charged).
- Owner created a Firebase project and put the Firebase service-account secret in Supabase himself. The send-push Edge Function is deployed by pasting code into the Supabase dashboard (Verify JWT off).

## Open problems (not solved yet)
1. **Keyboard language menu disappears in the APK only** (Gboard: long-press space bar shows the language list, it vanishes instantly; works in Chrome and in every field). Tried: window resize/inset changes (build 10). Test builds without the edge patch exist: run the Android workflow with input `stock=true` (publishes release `apk-test`) and `softinput=adjustPan|adjustResize`. Owner's result for those test builds was not reported yet. Ideas left: move the status-bar fix to a different mechanism (e.g. Capacitor `SystemBars`/`StatusBar` plugin or CSS `env(safe-area-inset-*)` instead of `MainActivity` padding), try `android:windowSoftInputMode="stateHidden|adjustNothing"`, check `capacitor.config` `android.webContentsDebuggingEnabled`, test on another phone brand.
2. **Splash screen feels slower in newer APK builds** (owner remark). Not investigated: check what runs at startup (bootstrap, sync pull, push registration, backup/purge checks) and the 2-second splash.
3. Owner mentioned "update 2" for the keyboard request but never sent it.

## Decisions and preferences
- Owner wants: simple steps, tests on his own Android phone, he runs SQL files and deploys the function himself.
- Sign-up is closed; only the admin creates accounts. Parents get accounts when students are admitted or via bulk import.
- Keep the repo public for now (the APK download link and GitHub Pages need it). Make it private only after the app is on the Play Store.
- Selling the app to other schools: each school needs its own Supabase project, its own Firebase project, its own package name and signing key. Plan: move school-specific values (name, logo, colours, Supabase URL/key, fee heads, classes, campuses) into one config place first. Not started.
- Deferred by owner: WhatsApp fee reminders, printable Urdu report cards / fee slips, "please update the app" check against a minimum version (offered, not requested).
- Old APKs keep working after updates; database changes must be additive so old builds do not break.

## Gotchas learned the hard way
- Fee breakdown bars follow the receipt: daily import saves `[by:...]` (fee type) and `[mon:YYYY-MM=amt]` (Fee For month) in remarks. Receipts without a month fill the most recent month first, then older. Re-uploading an old daily file adds a missing `[mon:]` tag (money unchanged).
- Admission numbers: before build 13 the form had no Admission No box and auto-made `AFS-B-2026-001` style numbers; fee CSV rows use the school's real number (e.g. 1112), so match failed. Fixed by adding the box.
- CI is the only typecheck; always push, wait for green, read annotations for `error TS`.
- Hooks must not use a state variable before it is declared (caused TS2448 once).
- Edge Function file needs `// @ts-nocheck` (Deno imports) or CI fails.
- Never re-render the whole role screen during pull-to-refresh: use the DOM-driven indicator and skip re-saving when data is unchanged.
- Repository calls must not have artificial delay in cloud mode and must read the in-memory cache, not re-parse localStorage.
- Inserting a tab shifts tab indexes: check parent tiles (Diary index 4, Messages 5).
- Blob/anchor downloads do not work in the Android WebView: use `saveBlobFile` (share sheet).
- `android.yml` edits `MainActivity.java` by writing a whole file from the workflow; if Capacitor changes the template, check that step.
- Sandbox cannot download Actions artifacts or set secrets; the workflow publishes releases (`apk-latest`, test builds `apk-test`) and the link is used instead.
- Android 13+ needs the notification permission prompt; it is requested after login in the APK.
- Supabase free plan pauses a project after about a week with no activity.

## How to ship a change
1. Edit code, commit, push to `main`; wait for the CI check `build` to pass (web preview deploys automatically).
2. If the database changes: add `supabase/0NN_name.sql` and tell the owner to run it (additive changes only).
3. If the Edge Function changes: tell the owner to paste `supabase/functions/send-push/index.ts` into the dashboard and deploy (JWT off).
4. If the app (APK) needs the change: trigger `android.yml`, wait for success, give the owner the link: https://github.com/justusok007-glitch/AFS/releases/download/apk-latest/AlFurqanSchool.apk
5. Update `MEMORY.md` and `CLAUDE.md` if something important changed.

## Play Store checklist (not started)
Developer account ($25), private upload/signing key (do not reuse the test key in `android-signing/`), privacy policy page (mention activity tracking, diary photos, push tokens), store listing text and screenshots, target API level requirements, internal testing track first.

## Test builds reference
- Normal: `apk-latest`. Keyboard test builds: `apk-test` (no edge patch, optional `softinput`).
- Build numbers equal the Android workflow run number; versionName is `1.0.<run number>`.
