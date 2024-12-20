import nodemailer from "nodemailer";

// Create reusable transporter object using SMTP2GO credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587, // Standard SMTP port for TLS
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  try {
    const resetLink = `${process.env.NODE_ENV === 'production' 
      ? 'https://' 
      : 'http://'}${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Password Reset - Health Matters at Large",
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password for Health Matters at Large.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour for security reasons.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}
