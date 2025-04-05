const express = require('express');
const cors = require('cors');
const path = require('path');
const { sendRecommendationRequest, sendLetterToRecipient } = require('./mailer');
const startImapListener = require('./imapListener');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.use('/letters', express.static(path.join(__dirname, 'storage/uploadedLetters')));

app.post('/request-letter', async (req, res) => {
  const { recommenderName, recommenderEmail, userName } = req.body;
  try {
    await sendRecommendationRequest(recommenderName, recommenderEmail, userName);
    res.status(200).json({ message: 'Request email sent' });
  } catch (error) {
    console.error('Error sending request:', error);
    res.status(500).json({ message: 'Failed to send request email' });
  }
});

app.post('/send-letter', async (req, res) => {
  const { recipientEmail, letterFilePath } = req.body;
  try {
    await sendLetterToRecipient(recipientEmail, letterFilePath);
    res.status(200).json({ message: 'Letter sent successfully' });
  } catch (error) {
    console.error('Error sending letter:', error);
    res.status(500).json({ message: 'Failed to send letter' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startImapListener();
});
