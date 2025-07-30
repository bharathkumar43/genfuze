# Email Setup Guide

## Current Issue
The password reset functionality is currently running in "test mode" - it shows success messages but doesn't actually send emails. This guide will help you set up real email sending.

## Option 1: Gmail SMTP (Recommended for testing)

### Step 1: Prepare Your Gmail Account
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to https://myaccount.google.com/security
   - Click on "2-Step Verification"
   - Scroll down and click "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Name it "Genfuze.ai" and click "Generate"
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update .env File
Replace the email configuration in your `.env` file with:

```env
# Email Configuration - Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=your-gmail@gmail.com
```

**Important**: 
- Replace `your-gmail@gmail.com` with your actual Gmail address
- Replace `your-16-character-app-password` with the app password you generated
- Remove spaces from the app password

### Step 3: Restart the Server
After updating the .env file, restart your backend server:
```bash
# Stop the current server (Ctrl+C)
# Then restart it
node server.js
```

## Option 2: SendGrid (Recommended for production)

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com/
2. Create a free account (allows 100 emails/day)
3. Verify your sender email address
4. Create an API key

### Step 2: Update .env File
```env
# Email Configuration - SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key
SMTP_FROM=your-verified-email@yourdomain.com
```

## Option 3: Other SMTP Providers

You can use any SMTP provider. Common options:
- **Outlook/Hotmail**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Your own email server

## Testing Email Configuration

After setup, you can test the email configuration by:

1. **Using the test endpoint**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/send-test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@example.com"}'
   ```

2. **Using the password reset form**:
   - Go to the "Forgot Password" page
   - Enter your email address
   - Check if you receive the actual email

## Troubleshooting

### Common Issues:

1. **"Authentication failed"**:
   - Make sure you're using an App Password, not your regular Gmail password
   - Ensure 2-Factor Authentication is enabled

2. **"Connection timeout"**:
   - Check your internet connection
   - Verify the SMTP host and port are correct

3. **"Sender not verified"** (SendGrid):
   - Verify your sender email address in SendGrid

4. **Emails going to spam**:
   - Check your spam folder
   - Add the sender email to your contacts

### Debug Information:
Check the server console for email-related logs:
- `📧 [EmailService] Initializing email service...`
- `✅ SMTP email service configured`
- `✅ SMTP connection verified successfully`

## Security Notes

1. **Never commit your .env file** to version control
2. **Use App Passwords** instead of your main password
3. **Rotate API keys** regularly
4. **Monitor email sending** for abuse

## Next Steps

1. Choose an email provider (Gmail recommended for testing)
2. Follow the setup steps above
3. Update your `.env` file
4. Restart the server
5. Test the password reset functionality 