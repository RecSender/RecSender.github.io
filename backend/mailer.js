const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function sendRecommendationRequest(recommenderName, recommenderEmail, studentName) {
  const mailOptions = {
    from: `"RecSend Submission" <${process.env.EMAIL_USER}>`,
    to: recommenderEmail,
    subject: `Recommendation Letter Request from ${studentName}`,
    text: `Dear ${recommenderName},\n\n${studentName} has requested a recommendation letter from you. Please reply to this email with the PDF letter attached.\n\nThank you!`
  };

  return transporter.sendMail(mailOptions);
}

function sendLetterToRecipient(recipientEmail, letterFilePath) {
  const mailOptions = {
    from: `"RecSend Submission" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: 'Recommendation Letter Submission',
    text: `Please find the attached recommendation letter.`,
    attachments: [
      {
        path: letterFilePath
      }
    ]
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendRecommendationRequest, sendLetterToRecipient };
