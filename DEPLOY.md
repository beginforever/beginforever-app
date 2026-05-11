# Begin Forever — Deploy Checklist

**Never skip this. Every deploy. No exceptions.**

---

## Before You Start

- [ ] Working on a `feature/xyz` branch (NOT `main`)
- [ ] Latest `main` pulled: `git checkout main && git pull`
- [ ] Branch created: `git checkout -b feature/short-description`

---

## Code Safety Checks

### Form Field IDs (DO NOT RENAME)
- [ ] `waitlistForm`
- [ ] `fullName`
- [ ] `age`
- [ ] `gender`
- [ ] `religion`
- [ ] `denomination`
- [ ] `email`
- [ ] `phone`
- [ ] `state`
- [ ] `city`
- [ ] `registering_for`
- [ ] `candidate_name`

### Tracking & Analytics
- [ ] Meta Pixel block still inside `<head>`
- [ ] `fbq('track', 'Lead')` still fires inside `showSuccess()`
- [ ] Meta Pixel ID present: `1618369042614620`

### Script Loading Order
- [ ] `app.js` loaded BEFORE any inline `<script>` that calls its functions
- [ ] Cache-busting `?v=` parameter bumped on `app.js`

### Critical Integrations
- [ ] Supabase URL unchanged: `neftjxvovxocqabxjvme.supabase.co`
- [ ] Supabase anon key unchanged
- [ ] Razorpay key unchanged: `rzp_live_SausbldU6Vqpy0`
- [ ] WhatsApp number unchanged: `+91 97000 25345`

---

## Local Test

- [ ] Open `index.html` locally in browser (incognito)
- [ ] Page loads without console errors
- [ ] No red errors in DevTools Console
- [ ] No 404s in DevTools Network tab

---

## Staging Test (BEFORE production merge)

- [ ] Pushed branch: `git push origin feature/xyz`
- [ ] Merged to `staging`: `git checkout staging && git merge feature/xyz && git push`
- [ ] Opened staging URL in **incognito window**
- [ ] Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R`)

### Test these flows on staging:
- [ ] Landing page loads
- [ ] Waitlist form submits successfully
- [ ] Phone OTP login works end-to-end
- [ ] Discover screen loads profiles
- [ ] Profile view opens
- [ ] Send interest works
- [ ] Messages screen loads
- [ ] Admin panel accessible (if admin)
- [ ] Razorpay test payment completes

---

## Production Deploy

- [ ] All staging tests passed
- [ ] Run deploy script: `./deploy.sh "short description of change"`
- [ ] Wait 60 seconds for GitHub Pages / host to rebuild
- [ ] Open production URL in **incognito window**
- [ ] Verify the change is live
- [ ] Tag the release: `git tag v$(date +%Y.%m.%d.%H%M) && git push --tags`

---

## If Something Breaks (Rollback)

```bash
# Find last working tag
git tag --sort=-creatordate | head -5

# Revert to it
git checkout main
git reset --hard <tag-name>
git push --force origin main
```

**Or revert just the last commit:**
```bash
git revert HEAD
git push origin main
```

---

## Database Changes

- [ ] Snapshot taken: Supabase Dashboard → Database → Backups → "Take backup"
- [ ] Migration file added to `supabase/migrations/`
- [ ] Tested on a `_dev` schema or separate Supabase project first
- [ ] Schema documented in `schema.sql`

---

## Post-Deploy

- [ ] Notify team in WhatsApp / Slack
- [ ] Monitor Meta Pixel for `Lead` events firing
- [ ] Check Supabase logs for errors (Dashboard → Logs)
- [ ] Update `CHANGELOG.md` with what changed
