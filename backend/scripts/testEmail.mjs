import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

console.log('--- Email Configuration Test ---');
console.log('EMAIL_USER:', EMAIL_USER || '(NOT SET)');
console.log('EMAIL_PASS:', EMAIL_PASS ? '****' + EMAIL_PASS.slice(-4) : '(NOT SET)');

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('\nERROR: EMAIL_USER and EMAIL_PASS must be set in backend/.env');
  console.error('Create backend/.env with:\n');
  console.error('  EMAIL_USER=yourname@gmail.com');
  console.error('  EMAIL_PASS=your-16-char-app-password\n');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

console.log('\nStep 1: Verifying transporter connection...');
try {
  await transporter.verify();
  console.log('  OK - Transporter verified successfully!\n');
} catch (err) {
  console.error('  FAILED -', err.message);
  console.error('\nCommon fixes:');
  console.error('  - Make sure 2-Step Verification is ON in your Google Account');
  console.error('  - Generate an App Password at https://myaccount.google.com/apppasswords');
  console.error('  - Check that EMAIL_USER is correct');
  process.exit(1);
}

console.log('Step 2: Sending test email to', EMAIL_USER, '...');
try {
  const info = await transporter.sendMail({
    from: EMAIL_USER,
    to: EMAIL_USER,
    subject: 'Temple Meals - Email Test',
    html: `
      <h2>Email Setup Successful!</h2>
      <p>If you can read this, your Temple Meals email notifications are working correctly.</p>
      <p><strong>Timestamp:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
      <hr>
      <p style="color: #666; font-size: 12px;">This is a test email from your Temple Meals backend.</p>
    `
  });
  console.log('  OK - Email sent! Message ID:', info.messageId);
  console.log('\n--- SUCCESS ---');
  console.log('Check your inbox at', EMAIL_USER, 'for the test email.');
} catch (err) {
  console.error('  FAILED to send:', err.message);
  process.exit(1);
}

process.exit(0);
