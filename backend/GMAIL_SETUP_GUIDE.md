# 📧 Gmail SMTP Setup Guide for Genfuze.ai

## 🎯 Goal
Set up Gmail SMTP to send real password reset emails instead of test mode.

## 📋 Prerequisites
- Gmail account
- 2-Factor Authentication enabled on Gmail
- Access to Gmail settings

## 🔧 Step-by-Step Setup

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on "Security" in the left sidebar
3. Find "2-Step Verification" and click "Get started"
4. Follow the setup process (phone verification, etc.)
5. **Important**: Complete the 2FA setup before proceeding

### Step 2: Generate App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click on "Security" in the left sidebar
3. Find "App passwords" (under "2-Step Verification")
4. Click "App passwords"
5. Select "Mail" as the app
6. Select "Other (Custom name)" as device
7. Enter "Genfuze.ai" as the name
8. Click "Generate"
9. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update Environment Variables
1. Open your `.env` file in the backend directory
2. Add or update these lines:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-digit-app-password
SMTP_FROM=your-gmail@gmail.com
SMTP_SECURE=false

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Enable Local Authentication
ENABLE_LOCAL_AUTH=true
```

**Replace:**
- `your-gmail@gmail.com` with your actual Gmail address
- `your-16-digit-app-password` with the app password from Step 2

### Step 4: Test the Configuration
1. Restart your backend server
2. Go to: `http://localhost:5000/test-email.html`
3. Enter your email address
4. Click "Send Test Email"
5. Check your inbox for the test email

## 🧪 Testing Commands

### Test Email Service Status
```bash
curl http://localhost:5000/api/auth/email-status
```

### Test Password Reset
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

## 🔍 Troubleshooting

### Error: "Username and Password not accepted"
**Solution**: 
- Make sure 2-Factor Authentication is enabled
- Use the App Password, not your regular Gmail password
- Remove spaces from the app password in .env file

### Error: "Invalid login"
**Solution**:
- Double-check the app password is correct
- Ensure SMTP_PORT=587 and SMTP_SECURE=false
- Try generating a new app password

### Error: "Connection timeout"
**Solution**:
- Check your internet connection
- Ensure firewall isn't blocking port 587
- Try using SMTP_PORT=465 and SMTP_SECURE=true

## 📧 Expected Results

### ✅ Success
- Backend console shows: "✅ SMTP email service configured"
- Test emails are sent to your inbox
- Password reset emails work from the UI
- Professional Genfuze.ai branded emails

### ❌ Still in Test Mode
- Backend console shows: "🧪 [EmailService] Using test mode"
- Emails are logged to console only
- Check your .env configuration

## 🔐 Security Notes
- App passwords are more secure than regular passwords
- Each app password is unique and can be revoked
- Never share your app password
- You can revoke app passwords from Google Account settings

## 📞 Support
If you're still having issues:
1. Check the backend console for detailed error messages
2. Verify all environment variables are set correctly
3. Test with the email status endpoint
4. Ensure the backend server is running on port 5000 