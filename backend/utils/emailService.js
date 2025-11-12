const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const emailTemplates = {
  applicationAccepted: (jobTitle, companyName) => ({
    subject: `Application Update: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5282;">Application Status Update</h2>
        <p>Dear Candidate,</p>
        <p>This is an automated notification from the SkillMatch platform regarding your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
        <p>We are pleased to inform you that your application has been accepted by ${companyName}!</p>
        <p><strong>Important:</strong> This is an automated notification from SkillMatch. The ${companyName} team will contact you directly with further details about the next steps in the hiring process.</p>
        <p>Best regards,<br>The SkillMatch Team</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This is an automated message from SkillMatch. Please do not reply to this email.</p>
        </div>
      </div>
    `
  }),

  applicationRejected: (jobTitle, companyName) => ({
    subject: `Application Update: ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5282;">Application Status Update</h2>
        <p>Dear Candidate,</p>
        <p>This is an automated notification from the SkillMatch platform regarding your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
        <p>After careful consideration, ${companyName} has decided to move forward with other candidates whose qualifications more closely match their current needs.</p>
        <p>We appreciate your interest in the position and encourage you to continue exploring other opportunities on our platform.</p>
        <p>Best regards,<br>The SkillMatch Team</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p>This is an automated message from SkillMatch. Please do not reply to this email.</p>
        </div>
      </div>
    `
  })
};

const sendEmail = async (to, template, data) => {
  try {
    const { subject, html } = template(data.jobTitle, data.companyName);
    const mailOptions = {
      from: `"SkillMatch Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  emailTemplates
};