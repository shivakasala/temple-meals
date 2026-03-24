import nodemailer from 'nodemailer';
import crypto from 'crypto';

let _transporter = null;

const getTransporter = () => {
  if (!_transporter) {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

    console.log('[EMAIL] Initializing transporter with user:', emailUser || '(NOT SET)');
    console.log('[EMAIL] Password configured:', emailPass ? 'YES' : 'NO');

    _transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: { family: 4 }
    });

    _transporter.verify()
      .then(() => console.log('Email transporter verified'))
      .catch((err) => console.warn('Email transporter verification failed:', err && err.message));
  }
  return _transporter;
};

// Send request notification email to admin
export const sendRequestEmailToAdmin = async (meal, adminEmail, approveLink, rejectLink) => {
  const emailContent = `
    Hare Krishna!<br><br>
    A Prasadam request requires your approval.<br><br>
    <b>Details of the Request:</b>
    <ul>
      <li><b>Submitted By:</b> ${meal.userName}</li>
      <li><b>Phone:</b> ${meal.userPhone}</li>
      <li><b>Department:</b> ${meal.userTemple}</li>
      <li><b>Date:</b> ${meal.date}</li>
      <li><b>Category:</b> ${meal.category}</li>
      <li><b>Morning Prasadam:</b> ${meal.morningPrasadam}</li>
      <li><b>Evening Prasadam:</b> ${meal.eveningPrasadam}</li>
      <li><b>Bill Amount:</b> ₹${meal.billAmount}</li>
    </ul>
    <p>Please take action by clicking one of the links below:</p>
    <a href="${approveLink}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px; margin-right: 10px; min-width: 170px;">Approve Request</a>&nbsp;&nbsp;&nbsp;<a href="${rejectLink}" style="background-color: #f44336; color: white; padding: 14px 25px; text-align: center; text-decoration: none; display: inline-block; border-radius: 8px; min-width: 170px;">Reject Request</a>
    <br><br><p>This is an automated notification.</p>
  `;

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `Approval Required: Prasadam Request for ${meal.date} - ${meal.userName}`,
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
  const isApproved = status === 'approved';
  const statusText = isApproved ? 'Approved' : 'Rejected';
  
  const emailContent = `
    Hare Krishna, ${meal.userName},<br><br>
    This is to notify you that your Prasadam request has been <b>${statusText.toLowerCase()}</b>.<br><br>
    <b>Request Details:</b>
    <ul>
      <li><b>Date:</b> ${meal.date}</li>
      <li><b>Category:</b> ${meal.category}</li>
      <li><b>Morning Prasadam:</b> ${meal.morningPrasadam}</li>
      <li><b>Evening Prasadam:</b> ${meal.eveningPrasadam}</li>
      <li><b>Bill Amount:</b> ₹${meal.billAmount}</li>
    </ul>
    <br>
    <p>If you have any questions, please contact the management.</p>
    <br><p>This is an automated notification.</p>
  `;

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Request Update: Your Prasadam request for ${meal.date} has been ${statusText.toLowerCase()}`,
      html: emailContent
    });
    console.log('Confirmation email sent to', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email to', userEmail, ':', error && error.message);
    return false;
  }
};

// Send acknowledgement email to user when request is submitted
export const sendAcknowledgementEmailToUser = async (meal, userEmail) => {
  const emailContent = `
    Hare Krishna, ${meal.userName},<br><br>
    This is an acknowledgement that your Prasadam request has been successfully <b>submitted</b> and is currently pending approval.<br><br>
    <b>Request Details:</b>
    <ul>
      <li><b>Date:</b> ${meal.date}</li>
      <li><b>Category:</b> ${meal.category}</li>
      <li><b>Morning Prasadam:</b> ${meal.morningPrasadam}</li>
      <li><b>Evening Prasadam:</b> ${meal.eveningPrasadam}</li>
      <li><b>Estimated Bill Amount:</b> ₹${meal.billAmount}</li>
    </ul>
    <br>
    <p>You will receive another email once your request has been approved or rejected.</p>
    <br><p>This is an automated notification.</p>
  `;

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: `Request Submitted: Prasadam Request for ${meal.date}`,
      html: emailContent
    });
    console.log('Acknowledgement email sent to', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending acknowledgement email to', userEmail, ':', error && error.message);
    return false;
  }
};

export default getTransporter;
