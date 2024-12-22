import nodemailer from "nodemailer";
import type { TransportOptions } from "nodemailer";

// Check required environment variables
const hasSmtpConfig = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].every(key => !!process.env[key]);
if (!hasSmtpConfig) {
  console.warn('SMTP configuration is incomplete. Email functionality will be disabled.');
}

// Create reusable transporter object using SMTP2GO credentials
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    debug: process.env.NODE_ENV !== 'production',
  };

  return nodemailer.createTransport(config);
};

let transporter = createTransporter();

// Verify SMTP connection on startup but don't block
(async () => {
  try {
    await transporter.verify();
    console.log('SMTP server is ready to send emails');
  } catch (error) {
    console.error('SMTP Connection Error:', error);
    console.warn('Email functionality may be limited');
  }
})();

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  if (!hasSmtpConfig) {
    throw new Error('Email functionality is not configured. Please contact support.');
  }

  try {
    console.log(`Attempting to send password reset email to: ${email}`);
    
    // Get the correct Replit URL for the deployment
    const baseUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.repl.co`
      : 'http://localhost:5000';
    
    // Encode the token for URL safety and construct the full URL
    const safeToken = encodeURIComponent(resetToken);
    const encodedResetLink = `${baseUrl}/reset-password?token=${safeToken}`;
    
    console.log('Reset password link:', encodedResetLink);

    const mailOptions = {
      from: {
        name: 'Health Matters at Large',
        address: 'terry@caltrax.online'
      },
      to: email,
      subject: "Password Reset - Health Matters at Large",
      text: `
Reset your password for Health Matters at Large

You requested to reset your password. Click or copy the following link to reset your password:

${encodedResetLink}

If you didn't request this, please ignore this email.
This link will expire in 1 hour for security reasons.
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Password Reset Request</h1>
          <p>You requested to reset your password for Health Matters at Large.</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${encodedResetLink}"
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;
                      font-family: Arial, sans-serif;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="margin: 10px 0; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${encodedResetLink}
          </p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', info.messageId);
      return true;
    } catch (emailError) {
      console.error('Failed to send email, attempting to reconnect...', emailError);
      // Attempt to recreate the transporter
      transporter = createTransporter();
      // Try sending one more time
      const info = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully after reconnect:', info.messageId);
      return true;
    }
  } catch (error) {
    console.error("Error sending password reset email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to send password reset email: ${errorMessage}. Please try again later or contact support.`);
  }
}
