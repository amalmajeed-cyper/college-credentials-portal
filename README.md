# Student Credentials Portal

> 🚀 **[Click Here to Open the Live Website](https://amalmajeed-cyper.github.io/college-credentials-portal/)**

An interactive student credentials portal for the **Institute of Advanced Study** that simulates student registration, OTP verification, and custom College ID generation (starting with `SIAZ-2026-`). Once registered, the portal automatically compiles and downloads an official landscape **Google AI Professional Certificate** PDF directly to the student's device.

---

## Key Features

- **Scholastic Campus Theme**: A beautiful golden-hour neoclassical campus background with responsive frosted-glass panels.
- **Persistent Student Database**: Uses browser `localStorage` to securely save student profiles. You can sign up, log out, and log back in, and it will remember your profile.
- **Simulated Mailbox (Demo Mode)**: When registering, an interactive mock inbox slides into view on-screen, showing the verification email and the 6-digit OTP code to copy.
- **Auto College ID Generator**: Automatically assigns a unique college ID (e.g., `SIAZ-2026-9041`) upon registration.
- **Direct PDF Compiler**: Converts the certificate layout into a high-quality PDF using client-side `html2pdf.js` and downloads it directly to your device.

---

## How to Test

1. Click the **[Live Link](https://amalmajeed-cyper.github.io/college-credentials-portal/)** at the top.
2. Click **Sign Up**, enter any test email and password, and submit.
3. Look directly below the signup card: read the email in the **Simulated Mailbox** and copy the 6-digit code.
4. Paste the code into the verification fields and click **Verify**.
5. Enter your full name, click **Generate College ID**, and log in.
6. Watch the system automatically compile and download your official certificate PDF!
