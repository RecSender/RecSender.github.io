const Imap = require('imap');
const fs = require('fs');
const path = require('path');
const { simpleParser } = require('mailparser');
require('dotenv').config();

function startImapListener() {
  const imap = new Imap({
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true
  });

  function openInbox(cb) {
    imap.openBox('INBOX', false, cb);
  }

  imap.once('ready', () => {
    openInbox((err, box) => {
      if (err) throw err;

      setInterval(() => {
        imap.search(['UNSEEN'], (err, results) => {
          if (err || !results || results.length === 0) return;

          const f = imap.fetch(results, { bodies: '', markSeen: true });

          f.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (parsed.attachments.length > 0) {
                  const attachment = parsed.attachments[0];
                  const outputPath = path.join(__dirname, 'storage/uploadedLetters', attachment.filename);

                  fs.writeFileSync(outputPath, attachment.content);
                  console.log(`✅ Saved: ${attachment.filename}`);
                }
              });
            });
          });

          f.once('end', () => {
            console.log('✅ Checked for new emails.');
          });
        });
      }, 10000); // Every 10 seconds
    });
  });

  imap.once('error', (err) => {
    console.error('IMAP error:', err);
  });

  imap.connect();
}

module.exports = startImapListener;
