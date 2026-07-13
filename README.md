# Credentials Portal

An interactive student portal for the **Institute of Advanced Study** that authenticates users, verifies emails using real-time OTP codes, and automatically generates custom College IDs starting with `SIAZ`. Upon login, it compiles a landscape **Google AI Professional Certificate** PDF and dispatches it directly to the student's email inbox.

## Features

- **Scholastic College Design**: Golden-hour neoclassical college campus background with responsive frosted-glass panels.
- **Strict Login Checks**: Authenticates users against a persistent student database in `localStorage`.
- **Real OTP Verification**: Verifies email ownership by sending a 6-digit code via SMTP.
- **Auto College ID Generator**: Generates IDs starting with `SIAZ-2026-` after profile validation.
- **Real SMTP PDF Delivery**: Renders the credential on the client and emails the PDF attachment directly to the student.
- **Local Download Backup**: Students can also download a copy of the PDF directly on-screen.

---

## Getting Started

### 1. Prerequisites
You do **not** need Node.js, Python, or Docker to run this server. The server runs natively on macOS using its built-in **Ruby** runtime.

### 2. Configuration (`.env`)
Create a file named `.env` in the root folder (or rename the `.env` template if it exists) and fill in your SMTP credentials:

```env
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
FROM_EMAIL="Registrar <your_email@gmail.com>"
```

*Note: If you use Gmail, you must generate a 16-character **App Password** from your Google Account settings under Security. A normal password will be rejected by Google's SMTP servers.*

### 3. Run the Server
Open your terminal in the project directory and run:

```bash
ruby server.rb
```

You will see:
```text
Serving static credentials portal on http://localhost:3000
```

Open **`http://localhost:3000`** in your web browser to test the portal!
