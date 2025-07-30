# Quick Email Setup - Send Real Password Reset Emails

## Current Issue
Your password reset is showing success messages but not sending real emails. This guide will fix that.

## Immediate Solution

### Step 1: Set up Gmail App Password
1. Go to https://myaccount.google.com/security
2. Enable **2-Factor Authentication** on your Gmail account
3. Go to **App passwords**
4. Select **Mail** and **Other (Custom name)**
5. Name it "Genfuze.ai" and click **Generate**
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update your .env file
Open `backend/.env` and replace the email configuration section with:

```env
# Email Configuration - Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=your-gmail@gmail.com
```

**Replace:**
- `your-gmail@gmail.com` with your actual Gmail address
- `your-16-character-app-password` with the app password you generated

### Step 3: Test the configuration
Run this command to test your email setup:
```bash
cd backend
node test-email-config.js
```

### Step 4: Restart your server
```bash
# Stop current server (Ctrl+C)
node server.js
```

## What This Fixes

✅ **Real emails sent** to the email address users enter  
✅ **Password reset links** that actually work  
✅ **Professional email templates** with your branding  
✅ **Secure token-based** password reset system  

## Testing

After setup:
1. Go to "Forgot Password" page
2. Enter any email address
3. Check if you receive the actual email (not just success message)

## Alternative: SendGrid (Production)

For production use, consider SendGrid:
1. Create account at https://sendgrid.com/ (free tier: 100 emails/day)
2. Add to `.env`:
```env
SENDGRID_API_KEY=your-sendgrid-api-key
SMTP_FROM=your-verified-email@yourdomain.com
```

## Troubleshooting

- **"Authentication failed"**: Use App Password, not regular password
- **"Connection timeout"**: Check internet and SMTP settings
- **Emails in spam**: Check spam folder, add sender to contacts

## Files Created

- `setup-email.js` - Interactive setup script
- `test-email-config.js` - Test your configuration
- `EMAIL_SETUP_GUIDE.md` - Detailed setup guide
- `email-config-template.env` - Template for .env file 