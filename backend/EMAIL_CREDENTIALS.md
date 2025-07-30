# Email Configuration - Copy these lines to your .env file
# Replace the placeholder values with your actual Gmail credentials

# Gmail SMTP Configuration for sending real emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=your-gmail-address@gmail.com
SMTP_SECURE=false

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Microsoft Azure AD (if using)
AZURE_CLIENT_ID=your-azure-client-id-here
AZURE_TENANT_ID=your-azure-tenant-id-here
AZURE_CLIENT_SECRET=your-azure-client-secret-here

# AI API Keys (if using)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here

## 🚀 Steps to Apply

### Step 1: Open .env File
Open this file in a text editor:
```
C:\Users\JyoshithaDhannapanen\Downloads\Genfuze (1)\Genfuze (1)\Genfuze\project.webapp\backend\.env
```

### Step 2: Add/Update Email Configuration
Add or update these lines in your .env file:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=your-gmail-address@gmail.com
SMTP_SECURE=false
FRONTEND_URL=http://localhost:5173
ENABLE_LOCAL_AUTH=true
```

### Step 3: Save and Restart
1. **Save the .env file**
2. **Restart the backend server**:
   ```bash
   npm start
   ```

### Step 4: Test Email Service
1. **Visit**: http://localhost:5000/test-email.html
2. **Enter email**: your-email@gmail.com
3. **Click**: "Send Test Email"
4. **Check your inbox** for the test email

## 🧪 Test Commands

### Test Email Status
```bash
curl http://localhost:5000/api/auth/email-status
```

### Test Password Reset
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password -H "Content-Type: application/json" -d "{\"email\":\"your-email@gmail.com\"}"
```

## 📧 Expected Results

### ✅ Success Indicators
- Backend console shows: "✅ SMTP email service configured"
- Test emails are sent to your inbox
- Password reset emails work from the UI
- Professional Genfuze.ai branded emails

### ❌ Still in Test Mode
- Backend console shows: "🧪 [EmailService] Using test mode"
- Emails are logged to console only
- Check your .env configuration

## 🔐 Important Notes

1. **App Passwords**: Use the 16-character app password, not your regular Gmail password
2. **2-Factor Authentication**: Must be enabled on Gmail account
3. **No Spaces**: Remove spaces from the app password in .env file
4. **Restart Required**: Always restart the backend server after changing .env

## 🆘 Troubleshooting

If you still get test mode:
1. **Check .env file** is in the correct location
2. **Verify credentials** are correct
3. **Restart backend server** after changes
4. **Check backend console** for error messages
5. **Test with email status endpoint**

The test credentials should work immediately for sending real emails! 🚀 