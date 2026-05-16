# Deploy: Critical Fixes v2

## What's fixed
1. ✅ **Bleed bug** — admin profile list won't bleed into Home tab anymore
2. ✅ **Hamburger redesign** — compact, "My Account" / "Help & Info" / "Manage Account" sections, includes Subscription link
3. ✅ **Registration "Thank You" screen** — proper welcome flow with what-happens-next timeline
4. ⚠️ **Email name bug** — needs Supabase Edge Function fix (see below)

## Files in zip
- `index.html` (hamburger + pending screen rewrite)
- `js/ui.js` (bleed fix)

## Deploy command block (copy-paste all at once)

After extracting the zip and copying files into your repo folder:

```bash
cd ~/Documents/beginforever/beginforever-app && git checkout main && git pull origin main && git checkout -b fix/v2-critical && cp -r ~/Downloads/v2-fixes/* . && git add -A && git commit -m "fix: bleed bug + hamburger redesign + thank you screen" && git push -u origin fix/v2-critical && git checkout staging && git merge fix/v2-critical --no-edit && git push origin staging
```

Wait 60 sec, test on Netlify staging URL.

If good, push to production:

```bash
git checkout main && git merge staging --no-edit && git push origin main
```

## ⚠️ Email name bug — Supabase fix needed

The frontend correctly sends `full_name` to your edge function. The bug is in the **Supabase edge function template** itself.

To fix:
1. Supabase Dashboard → Edge Functions → `smart-function`
2. Look in the function code for where email body is built — find where it says "Hi" without the name
3. Change something like `"Hi,"` to `"Hi ${full_name},"` or `"Hi " + body.full_name + ","`

If you paste the edge function code here, I can give you the exact fix.

## Rollback if anything breaks
```bash
git reset --hard v-baseline-20260511 && git push --force origin main
```
