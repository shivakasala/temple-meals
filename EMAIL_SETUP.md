# Email Notification Feature - Setup Guide

## Overview
When a user submits a prasadam request, an automated email is sent to the admin with secure approval/rejection links. The admin can approve or reject the request directly from the email without logging into the portal.

## Features

### 1. **Automatic Email Notification**
- When a user makes a prasadam request, an email is automatically sent to all admins
- Email contains:
  - User details (name, phone, department)
  - Request details (date, category, portions, bill amount)
  - **Approve** button (green)
  - **Reject** button (red)

### 2. **Email-Based Approval/Rejection**
- Admin can click the approval or rejection link directly in the email
- No need to log into the portal
- Secure token-based verification ensures only authorized links work

### 3. **Automatic User Confirmation**
- When admin approves/rejects via email, a confirmation email is sent to the user
- Tells them if their request was approved or rejected

## Setup Instructions

### Step 1: Configure Email Service

#### For Gmail:
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated password

3. Update `.env` file in `backend/` folder:
```
EMAIL_SERVICE="gmail"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
FRONTEND_URL="http://localhost:5173"  # or production URL
```

#### For Other Email Services (Office 365, SendGrid, etc.):
Update the `backend/src/utils/email.js` file with your service credentials.

### Step 2: Update User Email Addresses

Users need email addresses in the system. Update via:
- Database migration
- Admin panel (add email field to user creation)
- Or manually via MongoDB

Example:
```bash
db.users.updateOne(
  { username: "admin" },
  { $set: { email: "admin@temple.com" } }
)
```

### Step 3: Test the Feature

1. Create a prasadam booking as a user
2. Check the admin's email inbox
3. Click the **Approve** or **Reject** button in the email
4. The request status updates automatically
5. User receives confirmation email

## API Endpoints

### Email Approval (GET - from email link)
```
GET /api/meals/{mealId}/approve?token={approvalToken}
```
- Updates meal status to "approved"
- Sends confirmation email to user
- Returns success message

### Email Rejection (GET - from email link)
```
GET /api/meals/{mealId}/reject?token={rejectionToken}
```
- Updates meal status to "rejected"
- Sends confirmation email to user
- Returns success message

## Database Schema Changes

### User Model
Added new field:
```javascript
email: { type: String, unique: true, sparse: true }
```

### MealCount Model
Added new fields:
```javascript
approvalToken: String,          // Token for email approval
rejectionToken: String,         // Token for email rejection
emailSent: Boolean,             // Track if notification sent
adminEmail: String              // Admin who received the email
```

## Email Templates

### Admin Notification Email
- User details
- Request information
- Two action buttons (Approve/Reject)
- Secure token-based links

### User Confirmation Email
- Status (Approved/Rejected)
- Request details
- Professional template

## Security Considerations

1. **Token-Based Verification**: Each approval/rejection link has a unique token that's validated before processing
2. **Email Validation**: Only valid, verified emails send notifications
3. **Rate Limiting**: Consider implementing rate limiting for email endpoints (optional)
4. **HTTPS Only**: In production, email links must use HTTPS

## Troubleshooting

### Emails Not Sending?
1. Check `.env` variables are correct
2. Verify email credentials (especially for Gmail app password)
3. Check backend logs for error messages
4. Test with a simple email sending script

### Tokens Invalid?
1. Ensure tokens are being generated and saved to database
2. Verify the link includes the correct token parameter
3. Check MongoDB to ensure tokens are stored

### User Not Receiving Confirmation?
1. Check user email in database
2. Verify email service credentials
3. Check spam/junk folder

## Environment Variables Reference

```env
# Email Configuration
EMAIL_SERVICE=gmail                           # Email service provider
EMAIL_USER=your-email@gmail.com              # Sender email
EMAIL_PASSWORD=your-app-password             # Service password/app key

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173           # For local
# FRONTEND_URL=https://temple-meals-frontend.onrender.com  # For production
```

## Next Steps

1. ✅ Install nodemailer
2. ✅ Configure email credentials in .env
3. ✅ Add email addresses to user accounts
4. ✅ Test with actual email address
5. ✅ Deploy to production with production email credentials
6. (Optional) Add email field to admin user creation form

## Support

For issues or questions:
1. Check backend logs
2. Verify all .env variables are set
3. Test email credentials separately
4. Ensure MongoDB is updated with email schema changes
