import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { Resend } from 'resend';

let _transporter = null;
let _resend = null;

const useResend = () => !!process.env.RESEND_API_KEY;

const getResend = () => {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
    console.log('[EMAIL] Using Resend HTTP API');
  }
  return _resend;
};

const getTransporter = () => {
  if (!_transporter) {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

    console.log('[EMAIL] Initializing SMTP transporter with user:', emailUser || '(NOT SET)');

    _transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: emailUser, pass: emailPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10000,
      socketTimeout: 10000
    });

    _transporter.verify()
      .then(() => console.log('SMTP transporter verified'))
      .catch((err) => console.warn('SMTP transporter verification failed:', err && err.message));
  }
  return _transporter;
};

async function sendEmail({ from, to, subject, html }) {
  if (useResend()) {
    const fromAddr = process.env.RESEND_FROM || 'Prasadam Portal <onboarding@resend.dev>';
    const { data, error } = await getResend().emails.send({
      from: fromAddr,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    });
    if (error) throw new Error(error.message);
    console.log('[EMAIL] Sent via Resend, id:', data?.id);
    return data;
  }

  return getTransporter().sendMail({ from, to, subject, html });
}

export const generateApprovalToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

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
    await sendEmail({
      from: process.env.EMAIL_USER,
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
    await sendEmail({
      from: process.env.EMAIL_USER,
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

export default getTransporter;
