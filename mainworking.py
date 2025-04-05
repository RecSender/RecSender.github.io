import os
import smtplib
import imaplib
import email
import sqlite3
from flask import Flask, request, render_template, redirect
from cryptography.fernet import Fernet
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from email.utils import parseaddr

KEY_FILE = "secret.key"
if not os.path.exists(KEY_FILE):
    with open(KEY_FILE, "wb") as key_file:
        key_file.write(Fernet.generate_key())

def load_key():
    return open(KEY_FILE, "rb").read()

cipher_suite = Fernet(load_key())

app = Flask(__name__)

DB_FILE = "letters.db"
conn = sqlite3.connect(DB_FILE, check_same_thread=False)
cursor = conn.cursor()
cursor.execute("""
CREATE TABLE IF NOT EXISTS letters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student TEXT,
    recommender TEXT,
    email TEXT,
    filename TEXT,
    encrypted_data BLOB,
    status TEXT DEFAULT 'pending'
)
""")
conn.commit()

EMAIL = "letterofrec.submission@gmail.com"
PASSWORD = "exzr blpv sqqv tbyp"
IMAP_SERVER = "imap.gmail.com"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

@app.route("/")
def index():
    cursor.execute("SELECT student, recommender, status FROM letters")
    rows = cursor.fetchall()
    letters = [
        {"student": row[0], "recommender": row[1], "status": row[2]} for row in rows
    ]
    return render_template("index.html", letters=letters)

@app.route("/request", methods=["POST"])
def request_letter():
    student_name = request.form["student_name"]
    recommender_name = request.form["recommender_name"]
    recommender_email = request.form["recommender_email"]

    cursor.execute("INSERT INTO letters (student, recommender, email, status) VALUES (?, ?, ?, 'pending')",
                   (student_name, recommender_name, recommender_email))
    conn.commit()

    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.starttls()
    server.login(EMAIL, PASSWORD)

    msg = MIMEMultipart()
    msg["From"] = EMAIL
    msg["To"] = recommender_email
    msg["Subject"] = f"Recommendation Letter Request for {student_name}"

    body = f"Dear {recommender_name},\n\nPlease submit a recommendation letter for {student_name} by replying to this email and attaching a PDF.\n\nThank you!"
    msg.attach(MIMEText(body, "plain"))
    server.send_message(msg)
    server.quit()

    return redirect("/")

@app.route("/sync", methods=["GET"])
def sync():
    mail = imaplib.IMAP4_SSL(IMAP_SERVER)
    mail.login(EMAIL, PASSWORD)
    mail.select("inbox")

    result, data = mail.search(None, "UNSEEN")
    mail_ids = data[0].split()

    for num in mail_ids:
        result, msg_data = mail.fetch(num, "(RFC822)")
        raw_email = msg_data[0][1]
        msg = email.message_from_bytes(raw_email)

        sender_email = parseaddr(msg["From"])[1]
        filename = None
        file_data = None

        for part in msg.walk():
            if part.get_content_maintype() == "multipart":
                continue
            if part.get("Content-Disposition") is None:
                continue

            filename = part.get_filename()
            if filename:
                file_data = part.get_payload(decode=True)
                break

        if file_data and filename:
            encrypted_data = cipher_suite.encrypt(file_data)

            cursor.execute("""
                SELECT id, student, recommender FROM letters
                WHERE email = ? AND status = 'pending'
                ORDER BY id DESC LIMIT 1
            """, (sender_email,))
            row = cursor.fetchone()

            if row:
                letter_id, student_name, recommender_name = row
                cursor.execute("""
                    UPDATE letters SET filename=?, encrypted_data=?, status='submitted'
                    WHERE id=?
                """, (filename, encrypted_data, letter_id))
                conn.commit()

                # Send confirmation email
                confirmation = MIMEMultipart()
                confirmation["From"] = EMAIL
                confirmation["To"] = sender_email
                confirmation["Subject"] = "Letter Received"
                body = f"Hi {recommender_name},\n\nWe have received your letter for {student_name} and marked it as complete.\n\nThank you!"
                confirmation.attach(MIMEText(body, "plain"))

                server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
                server.starttls()
                server.login(EMAIL, PASSWORD)
                server.send_message(confirmation)
                server.quit()

    mail.logout()
    return redirect("/")

@app.route("/forward", methods=["POST"])
def forward():
    recipient = request.form["recipient_email"]
    cursor.execute("SELECT student, recommender, filename, encrypted_data FROM letters WHERE status='submitted'")
    letters = cursor.fetchall()

    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.starttls()
    server.login(EMAIL, PASSWORD)

    for student, recommender, filename, encrypted_data in letters:
        decrypted_data = cipher_suite.decrypt(encrypted_data)
        msg = MIMEMultipart()
        msg["From"] = EMAIL
        msg["To"] = recipient
        msg["Subject"] = f"Letter of Recommendation for {student}"
        body = f"Attached is a letter written by {recommender} for {student}."
        msg.attach(MIMEText(body, "plain"))

        attachment = MIMEBase("application", "octet-stream")
        attachment.set_payload(decrypted_data)
        encoders.encode_base64(attachment)
        attachment.add_header("Content-Disposition", f"attachment; filename={filename}")
        msg.attach(attachment)

        server.send_message(msg)

    server.quit()
    return redirect("/")

if __name__ == "__main__":
    app.run(debug=True)
