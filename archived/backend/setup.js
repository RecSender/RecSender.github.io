const { exec } = require("child_process");

const deps = [
  "express",
  "cors",
  "nodemailer",
  "dotenv",
  "imap",
  "mailparser"
];

exec(`npm init -y && npm install ${deps.join(" ")}`, (err, stdout, stderr) => {
  if (err) {
    console.error(`Setup failed: ${err.message}`);
    return;
  }
  console.log(stdout);
});
