# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the Genfuze application.

## Prerequisites

1. A Google Cloud Platform account
2. Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google Identity Services

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace account)
3. Fill in the required information:
   - App name: "Genfuze.ai"
   - User support email: Your email
   - Developer contact information: Your email
4. Add the following scopes:
   - `openid`
   - `profile`
   - `email`
5. Add test users if needed (for external apps)

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - `http://localhost:3000` (if using different port)
   - Your production domain (when deploying)
5. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - Your production domain (when deploying)
6. Click "Create"

## Step 4: Configure Environment Variables

### Frontend (.env file in project.webapp directory)

Add your Google Client ID to the frontend environment variables:

```env
VITE_REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Backend (.env file in backend directory)

Add your Google OAuth credentials to the backend environment variables:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Step 5: Test the Integration

1. Start both the frontend and backend servers
2. Navigate to the login page
3. Click "Sign in with Google"
4. Complete the Google OAuth flow
5. Verify that you're successfully logged in

## Troubleshooting

### Common Issues

1. **"Invalid client" error**: Make sure your Google Client ID is correct and the OAuth consent screen is properly configured.

2. **"Redirect URI mismatch" error**: Ensure the redirect URI in your Google Cloud Console matches your application's URL.

3. **"Access blocked" error**: Check if your app is in testing mode and add your email as a test user.

4. **CORS errors**: Make sure your backend CORS configuration allows requests from your frontend domain.

### Security Notes

- Never commit your Google Client Secret to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your OAuth credentials
- Monitor your OAuth usage in Google Cloud Console

## Production Deployment

When deploying to production:

1. Update the OAuth consent screen with your production domain
2. Add your production domain to authorized origins and redirect URIs
3. Update environment variables with production values
4. Ensure HTTPS is enabled (required for OAuth in production)
5. Consider implementing additional security measures like CSRF protection

## Support

If you encounter issues:

1. Check the browser console for JavaScript errors
2. Check the backend server logs for authentication errors
3. Verify your Google Cloud Console configuration
4. Ensure all environment variables are properly set 