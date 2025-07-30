# 📧 Gmail Email Configuration for Genfuze.ai

## 🎯 Location
Add these credentials to your `.env` file at:
```
C:\Users\JyoshithaDhannapanen\Downloads\Genfuze (1)\Genfuze (1)\Genfuze\project.webapp\backend\.env
```

## 🔧 Gmail Test Credentials

### Option 1: Use Your Own Gmail Account
If you have a Gmail account, follow these steps:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/security
   - Click "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Enter "Genfuze.ai" as the name
   - Click "Generate"
   - Copy the 16-character password

3. **Add to .env file**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-digit-app-password
SMTP_FROM=your-gmail@gmail.com
SMTP_SECURE=false
FRONTEND_URL=http://localhost:5173
ENABLE_LOCAL_AUTH=true
```

### Option 2: Test Gmail Account (Recommended for Testing)
Use these test credentials for immediate testing:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=genfuze.test@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=genfuze.test@gmail.com
SMTP_SECURE=false

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Enable Local Authentication
ENABLE_LOCAL_AUTH=true
```

## 📋 Complete .env File Example

Your complete `.env` file should look like this:

```env
# Database Configuration
DATABASE_PATH=./sessions.db

# Authentication
ENABLE_LOCAL_AUTH=true

# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=genfuze.test@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=genfuze.test@gmail.com
SMTP_SECURE=false

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Google OAuth (if using)
GOOGLE_CLIENT_ID=1003899655255-ib2ru0fiq7apqbgt4ifk48rmka88kqf0.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Microsoft Azure AD (if using)
AZURE_CLIENT_ID=3c591679-43ae-4b8a-8109-0b68ce86a2fc
AZURE_TENANT_ID=c16b04b5-b78c-4cce-b3f8-93686f221d09
AZURE_CLIENT_SECRET=6a7315fd-c63c-4acc-9429-1ba077e6f9d3

# AI API Keys (if using)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

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
SMTP_USER=genfuze.test@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=genfuze.test@gmail.com
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
2. **Enter email**: bharathkumartummaganti@gmail.com
3. **Click**: "Send Test Email"
4. **Check your inbox** for the test email

## 🧪 Test Commands

### Test Email Status
```bash
curl http://localhost:5000/api/auth/email-status
```

### Test Password Reset
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password -H "Content-Type: application/json" -d "{\"email\":\"bharathkumartummaganti@gmail.com\"}"
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