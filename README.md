# CyberGuard360 🛡️

**Your all-in-one cybersecurity toolkit for safe browsing.** Protect yourself with a browser extension and Discord bot powered by real-time threat analysis and community-driven intelligence.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/00Ajax00/CyberGuard360?style=social)](https://github.com/00Ajax00/CyberGuard360/stargazers)
[![Build Status](https://img.shields.io/github/workflow/status/00Ajax00/CyberGuard360/CI)](https://github.com/00Ajax00/CyberGuard360/actions)
[![Code Coverage](https://img.shields.io/codecov/c/github/00Ajax00/CyberGuard360)](https://codecov.io/gh/00Ajax00/CyberGuard360)
[![Contributors](https://img.shields.io/github/contributors/00Ajax00/CyberGuard360)](https://github.com/00Ajax00/CyberGuard360/graphs/contributors)

CyberGuard360 is a robust cybersecurity platform combining a browser extension, a Discord bot, and a scalable backend API to detect vulnerabilities, analyze phishing risks, and foster community-driven threat intelligence.

---

## ✨ Features

- **Browser Extension**: Real-time scanning for outdated JavaScript libraries, vulnerabilities, and phishing risks.
- **Discord Bot**: Automatically scans URLs in designated channels and delivers instant security reports.
- **Security Scoring**: Assigns a 0-100 score to websites based on detected threats.
- **Vulnerability Reports**: Detailed reports with severity levels (Critical, High, Medium, Low) and CVE identifiers.
- **Community Intelligence**: Users can report suspicious websites to enhance the threat database.
- **Secure Backend**: Built with Node.js, Express, and MongoDB, secured with JWT and API keys.
- **Cross-Platform**: Supports Chrome, Edge, Firefox, and Discord.

---

## 🚀 Getting Started

### Live Demo
- **API Status**: [https://cyberguard360-api.onrender.com](https://cyberguard360-api.onrender.com)
- **Browser Extension**: *(Coming soon to Chrome Web Store and Firefox Add-ons)*
- **Discord Bot**: *(Invite link available upon deployment)*

### Installation

#### Prerequisites
- **Node.js**: v18.x or later
- **npm**: v9.x or later
- **MongoDB Atlas**: For database storage
- **Discord Account**: For bot setup
- **Browser**: Chrome, Edge, or Firefox

#### Project Structure
CyberGuard360/<br>
├── server/                    # Backend API<br>
│   ├── src/                   # Source code<br>
│   ├── tests/                 # Unit and integration tests<br>
│   ├── .env.example<br>
│   ├── package.json<br>
│   └── server.js<br>
├── extension/                 # Browser extension<br>
│   ├── src/                   # Extension scripts<br>
│   ├── icons/                 # Extension icons<br>
│   ├── manifest.json<br>
│   ├── popup.html<br>
│   ├── popup.css<br>
│   └── popup.js<br>
├── cyberguard-bot/            # Discord bot<br>
│   ├── src/                   # Bot scripts<br>
│   ├── .env.example<br>
│   ├── deploy-commands.js<br>
│   ├── bot.js<br>
│   └── package.json<br>
├── docs/                      # Documentation<br>
└── README.md<br>


#### 1. Backend Setup (`/server`)

cd server
npm install
cp .env.example .env
# Add MONGO_URI, JWT_SECRET, BOT_API_KEY to .env
npm start 

API runs at http://localhost:3000.
2. Browser Extension Setup (/extension)

Open chrome://extensions or edge://extensions.
Enable Developer Mode.
Click Load Unpacked and select the extension folder.
Update API_BASE_URL in src/background.js and host_permissions in manifest.json to http://localhost:3000.

3. Discord Bot Setup (/cyberguard-bot)
cd cyberguard-bot
npm install
cp .env.example .env
# Add DISCORD_TOKEN, API_URL, SCAN_CHANNEL_ID, BOT_API_KEY to .env
node deploy-commands.js
node bot.js

🛠️ Tech Stack

Backend: Node.js, Express.js, MongoDB (Mongoose)
Browser Extension: JavaScript (ES6+), HTML5, CSS3
Discord Bot: Node.js, discord.js v14
Security: retire.js (vulnerability scanning), bcrypt.js (hashing), jsonwebtoken (authentication)
Infrastructure:

API: Render
Bot: Railway
Database: MongoDB Atlas

🧪 Testing
Run backend tests:
bashcd server
npm test
Uses Jest and Supertest for API and database testing.

🤝 Contributing

Fork the repository.<br>
Create a feature branch (git checkout -b feature/your-feature).<br>
Commit changes (git commit -m 'Add your feature').<br>
Push to the branch (git push origin feature/your-feature).<br>
Open a Pull Request.

See CONTRIBUTING.md for details.

📜 License
MIT License

👨‍💻 Author

GitHub: @00Ajax00
Email: (Add contact email if desired)
Built with 💻 and ☕ by the CyberGuard360 team.

