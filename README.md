# 🐛 BugSnap — AI-Powered Bug Report Enhancer

> Drop a screenshot. Get a Jira ticket. That simple.

BugSnap is a local web application that lets QA engineers drag-and-drop a screenshot of a bug, analyze it with AI vision, and automatically create a structured Jira Bug ticket — all in under 30 seconds.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Jira](https://img.shields.io/badge/Jira-0052CC?style=for-the-badge&logo=jira&logoColor=white)

---

## ✨ Features

- **📸 Drag & Drop** — Drop a screenshot or click to browse
- **🤖 AI Analysis** — Groq's LLaMA 4 Scout Vision model analyzes the screenshot and generates a structured bug report (summary, steps to reproduce, expected vs actual, severity)
- **🎫 One-Click Jira** — Automatically creates a Bug ticket in your Jira project
- **🔗 Test Connections** — Verify Jira and Groq connectivity before submitting
- **🔒 Local Only** — Everything runs on your machine; no data stored in the cloud
- **⚡ Fast** — Screenshot to Jira ticket in under 30 seconds

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vite + TypeScript + Vanilla CSS |
| **Backend** | Express.js + TypeScript |
| **AI Model** | Groq SDK — `meta-llama/llama-4-scout-17b-16e-instruct` (free) |
| **Issue Tracker** | Jira Cloud REST API v3 |
| **File Upload** | Multer |

---

## 📁 Project Structure

```
BugSnap/
├── package.json                    # Root: runs both servers via concurrently
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                # Express server (port 3001)
│       ├── routes/
│       │   ├── settings.ts         # GET/POST /api/settings
│       │   ├── test-connection.ts  # POST /api/test/jira & /api/test/groq
│       │   ├── analyze.ts          # POST /api/analyze (Groq vision)
│       │   └── create-ticket.ts    # POST /api/create-ticket (Jira)
│       └── utils/
│           └── settings-store.ts   # Local JSON settings persistence
├── client/
│   ├── index.html
│   ├── vite.config.ts              # Dev proxy /api → localhost:3001
│   └── src/
│       ├── main.ts                 # SPA router
│       ├── styles.css              # Dark theme design system
│       ├── api.ts                  # API client
│       └── pages/
│           ├── main-page.ts        # Drag-drop + analyze UI
│           └── settings-page.ts    # Config + test connections
└── settings.json                   # Auto-created on first save (gitignored)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+  
- **Jira Cloud** account with an [API token](https://id.atlassian.com/manage-profile/security/api-tokens)
- **Groq API key** (free at [console.groq.com](https://console.groq.com))

### Installation

```bash
# Clone the repo
git clone https://github.com/SathishQASelenium/BugSnap.git
cd BugSnap

# Install all dependencies (root + server + client)
npm run install:all
```

### Run

```bash
npm run dev
```

This starts:
- **Frontend** → http://localhost:5173  
- **Backend** → http://localhost:3001

Open http://localhost:5173 in Chrome.

---

## ⚙️ Configuration

1. Click **Settings** in the top-right
2. Fill in your **Jira Connection Details**:
   - **Project Key** — e.g. `VWO`, `BUG`
   - **Email** — your Atlassian account email
   - **API Key** — your Jira API token
   - **JIRA URL** — e.g. `https://your-domain.atlassian.net`
   - **Issue Type** — defaults to `Bug`
3. Add your **Groq API Key**
4. Click **Save Settings**
5. Use **Test Jira Connection** and **Test Groq Connection** to verify ✅

---

## 📋 Usage

1. Go to the **Main Page**
2. **Drag & drop** a screenshot of the bug (or click to browse)
3. Add **Additional Notes** — describe the context, steps, or anything the AI should know
4. Click **"Analyze and push to JIRA"**
5. Review the AI-generated bug report
6. Click **"Push to JIRA"** → your ticket is created with a direct link 🎉

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/settings` | Load saved settings (API keys masked) |
| `POST` | `/api/settings` | Save Jira + Groq configuration |
| `POST` | `/api/test/jira` | Test Jira connection |
| `POST` | `/api/test/groq` | Test Groq connection |
| `POST` | `/api/analyze` | Upload screenshot + notes → AI analysis |
| `POST` | `/api/create-ticket` | Create Jira Bug ticket |
| `GET` | `/api/health` | Server health check |

---

## 🤖 AI Model

Uses **Groq's** free API with the `meta-llama/llama-4-scout-17b-16e-instruct` vision model. The model receives the screenshot as a base64 image and generates:

- **Summary** — one-line bug title
- **Description** — detailed issue description
- **Steps to Reproduce** — inferred from the screenshot
- **Expected vs Actual Result**
- **Severity** — Critical / Major / Minor / Trivial
- **Environment** — any details visible in the screenshot

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a PR.

---

**Built with ❤️ for QA Engineers who value their time.**
