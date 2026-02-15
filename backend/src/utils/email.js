import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Initialize transporter (configured for Gmail or any email service)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'kasalashiva9392@gmail.com',
    // support both EMAIL_PASS and EMAIL_PASSWORD env var names
    pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || ''
  }
});

// Log transporter verification at startup to help debug configuration
transporter.verify()
  .then(() => console.log('Email transporter verified'))
  .catch((err) => console.warn('Email transporter verification failed:', err && err.message));

// Generate approval token
export const generateApprovalToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send request notification email to admin
export const sendRequestEmailToAdmin = async (meal, adminEmail, approveLink, rejectLink) => {
  const emailContent = `
    <h2>New Prasadam Request</h2>
    <p><strong>User:</strong> ${meal.userName}</p>
    <p><strong>Phone:</strong> ${meal.userPhone}</p>
    <p><strong>Department:</strong> ${meal.userTemple}</p>
    <p><strong>Date:</strong> ${meal.date}</p>
    <p><strong>Category:</strong> ${meal.category}</p>
    <p><strong>Morning Prasadam:</strong> ${meal.morningPrasadam}</p>
    <p><strong>Evening Prasadam:</strong> ${meal.eveningPrasadam}</p>
    <p><strong>Bill Amount:</strong> ₹${meal.billAmount}</p>
    
    <hr>
    <h3>Action Required</h3>
    <p>Click one of the buttons below to approve or reject this request:</p>
    
    <table style="margin: 20px 0;">
      <tr>
        <td style="padding-right: 20px;">
          <a href="${approveLink}" style="display: inline-block; padding: 12px 30px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            ✓ Approve Request
          </a>
        </td>
        <td>
          <a href="${rejectLink}" style="display: inline-block; padding: 12px 30px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            ✗ Reject Request
          </a>
        </td>
      </tr>
    </table>
    
    <p style="color: #666; font-size: 12px; margin-top: 30px;">
      This is an automated email. Please do not reply to this email.
    </p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@temple-meals.com',
      to: adminEmail,
      subject: `New Prasadam Request - ${meal.date} - ${meal.userName}`,
      html: emailContent
    });
    console.log('Request email sent to', adminEmail);
    return true;
  } catch (error) {
    console.error('Error sending request email to', adminEmail, ':', error && error.message);
    return false;
  }
};

// Send confirmation email to user
export const sendConfirmationEmailToUser = async (meal, userEmail, status) => {
  const statusText = status === 'approved' ? 'Approved' : 'Rejected';
  const statusColor = status === 'approved' ? '#10b981' : '#ef4444';
  
  const emailContent = `
    <h2>Prasadam Request ${statusText}</h2>
    <p>Dear ${meal.userName},</p>
    
    <p>Your prasadam request has been <strong style="color: ${statusColor};">${statusText}</strong>.</p>
    
    <h3>Request Details:</h3>
    <ul>
      <li><strong>Date:</strong> ${meal.date}</li>
      <li><strong>Category:</strong> ${meal.category}</li>
      <li><strong>Morning Prasadam:</strong> ${meal.morningPrasadam}</li>
      <li><strong>Evening Prasadam:</strong> ${meal.eveningPrasadam}</li>
      <li><strong>Bill Amount:</strong> ₹${meal.billAmount}</li>
    </ul>
    
    <p style="color: #666; font-size: 12px; margin-top: 30px;">
      This is an automated email. Please do not reply to this email.
    </p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@temple-meals.com',
      to: userEmail,
      subject: `Prasadam Request ${statusText} - ${meal.date}`,
      html: emailContent
    });
    console.log('Confirmation email sent to', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email to', userEmail, ':', error && error.message);
    return false;
  }
};

export default transporter;
