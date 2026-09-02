# Contact Form Setup & Backend Architecture

This document describes the end-to-end architecture, environment variable configuration, security features, and deployment instructions for the **"Send a Message"** contact form on the Engelbert Morales e-Portfolio.

---

## 1. System Architecture

```text
Visitor (Browser)
   │
   ▼
[ Contact Form Component ] (index.html + css/style.css + js/main.js)
   │  • Client-side RFC validation (Name, Email, Subject, Message)
   │  • Live keystroke error clearing & accessible ARIA states
   │  • Duplicate-click prevention & animated loading state
   │
   ▼ POST /api/contact (JSON payload)
[ Backend API ] (server/index.js or api/contact.js)
   │  • IP-based sliding window rate limiter (max 5 submissions / 15 min)
   │  • Hidden honeypot spam detection (_gotcha trap)
   │  • Server-side payload validation & HTML sanitization
   │  • Secret credentials kept strictly server-side
   │
   ▼
[ Transactional Email Provider ] (Resend API or SMTP Transport)
   │  • Subject: "Portfolio Contact: [Visitor Subject]"
   │  • Reply-To: "[Visitor Name] <[Visitor Email]>"
   │
   ▼
Engelbert Morales' Inbox (engelbert17dm@gmail.com)
```

---

## 2. Environment Variables Catalog

Create a `.env` file in the project root based on `.env.example`.

> [!CAUTION]
> **NEVER** commit `.env` or expose API keys/passwords in client-side code or public repositories. `.env` is already configured in `.gitignore`.

| Variable | Description | Example / Default | Required? |
|---|---|---|---|
| `PORT` | Local backend server port | `3001` | No (defaults to 3001) |
| `CONTACT_EMAIL` | Destination inbox where messages arrive | `engelbert17dm@gmail.com` | Yes |
| `EMAIL_FROM` | Verified sender address or domain | `Engelbert Portfolio <onboarding@resend.dev>` | Yes |
| `RESEND_API_KEY` | Resend API Key (Option A - Recommended) | `re_123456789...` | If using Resend |
| `SMTP_HOST` | SMTP Host (Option B) | `smtp.gmail.com` | If using SMTP |
| `SMTP_PORT` | SMTP Port | `587` | If using SMTP |
| `SMTP_SECURE` | Use SSL (`true` for 465, `false` for 587) | `false` | If using SMTP |
| `SMTP_USER` | SMTP Username / Email | `your-email@gmail.com` | If using SMTP |
| `SMTP_PASS` | SMTP Password / App Password | `abcd efgh ijkl mnop` | If using SMTP |
| `ALLOWED_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173,https://yourdomain.com` | Production |
| `RATE_LIMIT_MAX` | Max submissions per IP per time window | `5` | No (defaults to 5) |
| `RATE_LIMIT_WINDOW_MINUTES` | Rate limit window in minutes | `15` | No (defaults to 15) |

---

## 3. Email Provider Configuration

### Option A: Resend API (Recommended)
1. Sign up for free at [Resend](https://resend.com).
2. Generate an API Key under **API Keys**.
3. In your `.env` (or hosting dashboard):
   ```env
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=Engelbert Portfolio <onboarding@resend.dev>
   CONTACT_EMAIL=engelbert17dm@gmail.com
   ```
4. *Optional for production*: Verify your custom domain in Resend to send from `contact@yourdomain.com`.

### Option B: Gmail / Standard SMTP
1. For Gmail, enable 2-Factor Authentication and generate a **Google App Password** at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
2. In your `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-16-char-app-password
   EMAIL_FROM=Engelbert Portfolio <your-gmail@gmail.com>
   CONTACT_EMAIL=engelbert17dm@gmail.com
   ```

---

## 4. Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure `.env`**:
   ```bash
   cp .env.example .env
   # Add your RESEND_API_KEY or SMTP credentials in .env
   ```

3. **Run both Frontend and Backend concurrently**:
   - Terminal 1 (Backend API):
     ```bash
     npm run server
     ```
   - Terminal 2 (Vite Frontend):
     ```bash
     npm run dev
     ```

4. Open `http://localhost:5173` in your browser, scroll to the Contact section, and send a message. Vite automatically proxies `/api` calls to `http://localhost:3001`.

---

## 5. Production Deployment

### Deploying to Vercel (Frontend + Serverless Functions)
- Vercel automatically deploys the static files and detects [api/contact.js](file:///Users/engelbertmorales/Documents/Portfolio/api/contact.js) as a Serverless API endpoint.
- In your Vercel Dashboard -> **Project Settings** -> **Environment Variables**:
  - Add `RESEND_API_KEY` (or SMTP credentials).
  - Add `CONTACT_EMAIL=engelbert17dm@gmail.com`.
  - Add `EMAIL_FROM=Engelbert Portfolio <onboarding@resend.dev>` (or your verified domain).
  - Add `ALLOWED_ORIGIN=https://your-portfolio-domain.vercel.app`.

### Deploying to Render / Railway / Node VPS
- Set the build command to `npm run build`.
- Set the start command to `node server/index.js`.
- Add environment variables in the host control panel.
- Serve the `dist/` folder statically via Express or reverse proxy (Nginx).

---

## 6. Security & Anti-Abuse Measures

1. **Server-Side Validation**: All fields (`name`, `email`, `subject`, `message`) are sanitized and validated on the backend.
2. **Honeypot Trap**: Invisible field `_gotcha` traps automated spam bots without requiring intrusive CAPTCHAs.
3. **Sliding-Window Rate Limiting**: Restricts requests per IP (5 requests per 15 minutes by default) to prevent spam floods.
4. **Body Size Limits**: JSON request bodies are limited to 10kb to prevent payload flooding.
5. **Direct Reply-To**: Incoming emails set `Reply-To: Visitor Name <visitor@email.com>`, allowing instant one-click replies from your email client.
