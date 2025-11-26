# Magic Link Authentication Troubleshooting

## Issue
Getting "Authentication failed" error when clicking magic link.

## Root Cause
Supabase uses PKCE (Proof Key for Code Exchange) flow for magic links, which sends a `code` parameter instead of `token_hash`. The callback handler has been updated to use `exchangeCodeForSession()`.

## Required Supabase Configuration

### 1. Check Redirect URLs
Go to your Supabase Dashboard → Authentication → URL Configuration

Add these URLs to "Redirect URLs":
```
http://localhost:3002/auth/callback
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

### 2. Verify Email Templates
Go to Supabase Dashboard → Authentication → Email Templates

The magic link template should contain:
```
{{ .ConfirmationURL }}
```

This generates the proper callback URL with the code parameter.

### 3. Check Auth Settings
Go to Supabase Dashboard → Authentication → Settings

Ensure:
- **Enable email provider** is turned ON
- **Enable email confirmations** is turned ON
- **Secure email change** is turned ON (optional but recommended)

## Testing Steps

### Step 1: Clear Everything
1. Close all browser tabs with your app
2. Clear browser cookies for localhost:3002
3. Delete any old user accounts in Supabase Dashboard if needed

### Step 2: Request New Magic Link
1. Go to http://localhost:3002/login
2. Enter your email: `eric.franlund@eliteprospects.com`
3. Click "Send Magic Link"
4. Check your email inbox

### Step 3: Check the Email Link
The magic link URL should look like:
```
http://localhost:3002/auth/callback?code=XXXXX-XXXXX-XXXXX
```

**NOT** like:
```
http://localhost:3002/auth/callback?token_hash=XXXXX&type=email
```

If you see `token_hash`, then PKCE flow is not enabled in your Supabase project.

### Step 4: Click the Link
Click the magic link in your email. You should be:
1. Redirected to `/auth/callback?code=...`
2. Code exchanged for session
3. User profile created/updated
4. Redirected to `/trees`

## Common Issues

### Issue: Still getting auth_failed
**Solution:** Check browser console and network tab for errors. The callback route logs errors to console.

### Issue: Link says "expired"
**Solution:** Magic links expire after 1 hour by default. Request a new one.

### Issue: Link has token_hash instead of code
**Solution:** Update your Supabase email template to use `{{ .ConfirmationURL }}` instead of custom links.

### Issue: Redirect loop
**Solution:** Check that `/auth/callback` is NOT protected by middleware (it's not in the current setup).

## Debug Mode

Add this to your `.env.local` to see auth debug logs:
```
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

Then check browser console when clicking the magic link.

## Current User Status

Your account exists:
- Email: eric.franlund@eliteprospects.com
- User ID: 3c8d0b1f-925e-4f69-a26e-f3fb90f9fa72
- Email Confirmed: Yes
- Created: 2025-11-25

You should be able to log in. Just request a fresh magic link and click it.

## Alternative: Direct Database Sign-in (Emergency Only)

If magic links continue to fail, you can temporarily use password auth:

1. Set a password via Supabase Dashboard
2. Use the dashboard's "Set password" feature for your user
3. Then you can add back a password field to LoginForm.tsx temporarily

But magic link SHOULD work with the updated callback handler!

