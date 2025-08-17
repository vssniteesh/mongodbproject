# 🔐 Two-Factor Authentication (2FA) Setup Guide

## Overview
The CareConnect application now supports Two-Factor Authentication using email verification codes. This guide will help you set up and test the 2FA functionality.

## 🚀 Quick Start

### 1. Email Configuration
The application uses **Ethereal Email** for development (automatic fallback). For production, configure a real SMTP service.

#### Option A: Use Ethereal (Development - Recommended)
- **No configuration needed** - automatically uses test email service
- Check server console for email preview URLs
- Perfect for testing and development

#### Option B: Configure Real SMTP (Production)
Create a `.env` file in the server directory with your email settings:

```env
# Gmail Example
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=CareConnect <your-email@gmail.com>

# Or Outlook Example
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
EMAIL_FROM=CareConnect <your-email@outlook.com>
```

### 2. Enable 2FA for a User

#### Method A: Using the Test Script
```bash
cd server
node test-2fa.js user@example.com
```

#### Method B: Using the API Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/test-enable-2fa \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### 3. Test the 2FA Flow

1. **Start the server:**
   ```bash
   cd server
   npm start
   ```

2. **Enable 2FA for a user** (see step 2 above)

3. **Login with the user:**
   - Go to `http://localhost:5173/login`
   - Enter user credentials
   - You should be redirected to the 2FA page

4. **Check for the verification code:**
   - **If using Ethereal:** Check the server console for the email preview URL
   - **If using real SMTP:** Check the user's email inbox

5. **Enter the verification code** on the 2FA page

## 🔧 Troubleshooting

### Email Not Sending
1. **Check server console** for error messages
2. **Verify email configuration** in `.env` file
3. **Check network connectivity** for SMTP services
4. **For Gmail:** Ensure you're using an App Password, not your regular password

### 2FA Not Triggering
1. **Verify 2FA is enabled** for the user:
   ```bash
   node test-2fa.js user@example.com
   ```
2. **Check user model** has `twoFactor.enabled: true`
3. **Restart server** after enabling 2FA

### OTP Not Working
1. **Check OTP expiration** (5 minutes)
2. **Verify OTP format** (6 digits)
3. **Check server logs** for OTP generation
4. **Try resending** the OTP using the "Resend Code" button

## 📧 Email Preview (Development)

When using Ethereal, the server console will show:
```
📧 Email Preview URL (Ethereal): https://ethereal.email/message/...
📧 Check this URL to see the email that was sent
```

Click the URL to view the email content and get the verification code.

## 🔒 Security Features

- **6-digit OTP** codes
- **5-minute expiration** for security
- **One-time use** - OTP is cleared after verification
- **Rate limiting** on resend attempts
- **Secure hashing** of OTP values

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/login` - Login (triggers 2FA if enabled)
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/resend-otp` - Resend verification code

### 2FA Management
- `POST /api/auth/toggle-2fa` - Enable/disable 2FA (requires auth)
- `POST /api/auth/test-enable-2fa` - Enable 2FA for testing (dev only)

## 📱 User Experience

### Login Flow
1. User enters credentials
2. If 2FA is enabled, they're redirected to `/two-factor`
3. User enters the 6-digit code from their email
4. Upon successful verification, user is logged in and redirected to their dashboard

### UI Features
- **Modern design** with gradient backgrounds
- **Real-time validation** of OTP format
- **Resend functionality** for missed emails
- **Clear error messages** for troubleshooting
- **Development mode indicators** for testing

## 🚨 Production Considerations

1. **Use real SMTP service** (Gmail, SendGrid, etc.)
2. **Set up proper email templates** with branding
3. **Implement rate limiting** for OTP requests
4. **Add monitoring** for email delivery failures
5. **Consider backup 2FA methods** (SMS, authenticator apps)

## 📞 Support

If you encounter issues:
1. Check the server console for detailed error messages
2. Verify your email configuration
3. Test with Ethereal first before configuring real SMTP
4. Ensure the user has 2FA enabled before testing

---

**Happy Testing! 🔐✨**
