# Azure AD Setup Guide - Fix Microsoft Login

## 🚨 Current Issue
Your Microsoft login is failing with error: **AADSTS9002326: Cross-origin token redemption is permitted only for the 'Single-Page Application' client-type.**

This means your Azure AD app registration needs to be configured as a **Single-page application (SPA)** instead of a different client type.

## 🔧 Solution Steps

### Step 1: Access Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Find your app: **Genfuze.ai** (or the app with Client ID: `your-azure-client-id-here`)

### Step 2: Update Authentication Settings
1. Click on your app registration
2. Go to **Authentication** in the left sidebar
3. Under **Platform configurations**, click **Add a platform**
4. Select **Single-page application**
5. Add the following redirect URIs:
   - `http://localhost:5173`
   - `http://localhost:5173/`
   - `http://localhost:5173/auth/callback`
   - `http://localhost:5173/auth/callback/`

### Step 3: Remove Other Platform Types
1. If you see **Web** or **Mobile and desktop applications** platforms, remove them
2. Keep only the **Single-page application** platform
3. Save the changes

### Step 4: Update API Permissions
1. Go to **API permissions** in the left sidebar
2. Make sure you have these permissions:
   - **Microsoft Graph** → **User.Read** (Delegated)
   - **Microsoft Graph** → **openid** (Delegated)
   - **Microsoft Graph** → **profile** (Delegated)
   - **Microsoft Graph** → **email** (Delegated)

### Step 5: Grant Admin Consent
1. Click **Grant admin consent for [Your Organization]**
2. Confirm the permissions

### Step 6: Update Redirect URIs
Make sure these redirect URIs are configured:
```
http://localhost:5173
http://localhost:5173/
http://localhost:5173/auth/callback
http://localhost:5173/auth/callback/
```

## 🔍 Alternative: Create New App Registration

If the above doesn't work, create a new app registration:

### Step 1: Create New App
1. Go to **Azure Active Directory** → **App registrations**
2. Click **New registration**
3. Name: `Genfuze.ai Frontend`
4. **Account types**: Select appropriate option (Single tenant or Multi-tenant)
5. **Redirect URI**: Select **Single-page application (SPA)**
6. URI: `http://localhost:5173`
7. Click **Register**

### Step 2: Configure Authentication
1. Go to **Authentication**
2. Add these redirect URIs:
   - `http://localhost:5173`
   - `http://localhost:5173/`
   - `http://localhost:5173/auth/callback`

### Step 3: Configure API Permissions
1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph** → **Delegated permissions**
4. Add: `User.Read`, `openid`, `profile`, `email`
5. Click **Grant admin consent**

### Step 4: Update Frontend Configuration
Update your `.env` file with the new Client ID:

```env
VITE_REACT_APP_AZURE_CLIENT_ID=your-new-client-id
VITE_REACT_APP_AZURE_TENANT_ID=your-azure-tenant-id-here
```

## 🧪 Testing

After making these changes:

1. **Restart your frontend server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Clear browser cache** and try Microsoft login again

3. **Check browser console** for any new errors

## 📋 Common Issues & Solutions

### Issue: "AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application"
**Solution**: Make sure the redirect URI in your `.env` file matches exactly what's configured in Azure AD.

### Issue: "AADSTS7000218: The request body must contain the following parameter: 'client_assertion' or 'client_secret'"
**Solution**: This means your app is still configured as a "Web" application. Make sure it's configured as "Single-page application (SPA)".

### Issue: "AADSTS65001: The user or administrator has not consented to use the application"
**Solution**: Grant admin consent in the API permissions section.

## 🔗 Useful Links

- [Azure AD App Registration Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [MSAL.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications)
- [Single-page Application Setup](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration)

## 📞 Need Help?

If you're still having issues:
1. Check the Azure AD app registration configuration
2. Verify all redirect URIs are correct
3. Ensure the app is configured as "Single-page application (SPA)"
4. Grant admin consent for all permissions 