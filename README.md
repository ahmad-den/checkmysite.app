# 🚀 Check My Site

Welcome to Check My Site - Your Ultimate Web Performance Debugger! 🌐✨

## 📊 Project Overview

Check My Site is a powerful tool designed to analyze and optimize website performance. It combines the robust capabilities of Python and Node.js backends with a sleek React frontend to deliver comprehensive performance reports and actionable optimization suggestions.

## 🏗️ Project Structure

Our project is built on three main pillars:

1. **🐍 Backend (Python API)**
   - Handles primary analysis logic
   - Runs on port 5000
   - Managed via Gunicorn

2. **💡 Lighthouse Backend (Node.js)**
   - Conducts performance audits using Lighthouse
   - Operates on port 5001
   - Managed with Bull queue and Redis

3. **⚛️ Frontend (React)**
   - Provides an intuitive UI for users
   - Runs on port 3000 in development
   - Built as static files for production

## 📂 Directory Structure

```
.
├── 🐍 backend
│   └── logs
├── ⚛️ frontend
│   ├── build
│   │   ├── assets
│   │   └── static
│   ├── public
│   │   └── assets
│   └── src
│       ├── assets
│       └── components
├── 💡 lighthouse-backend
│   └── reports
└── ⚙️ service-conf
```

## 🛠️ Setup and Installation

### 1. 🐍 Backend (Python API)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
gunicorn --workers 4 --bind 0.0.0.0:5000 app:app
```

### 2. 💡 Lighthouse Backend (Node.js)

```bash
cd lighthouse-backend
npm install
sudo systemctl start checkmysite-node
sudo systemctl enable checkmysite-node
```

### 3. ⚛️ Frontend (React)

```bash
cd frontend
npm install --omit=dev
# For development:
npm start
# For production:
npm run build --omit=dev
```

## 🖥️ Nginx and Systemd Configuration

All configuration files are located in the `service-conf/` folder.

### Nginx Setup

```bash
sudo cp service-conf/checkmysite2 /etc/nginx/sites-available/checkmysite2
sudo ln -s /etc/nginx/sites-available/checkmysite2 /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### Systemd Services

Two services are configured:
- `checkmysite-python.service`: Python backend
- `checkmysite-node.service`: Node.js backend

To start and enable:

```bash
sudo systemctl start checkmysite-python
sudo systemctl start checkmysite-node
sudo systemctl enable checkmysite-python
sudo systemctl enable checkmysite-node
```

## 🚀 Quick Command Reference

- Start Python backend: `sudo systemctl start checkmysite-python`
- Start Node.js backend: `sudo systemctl start checkmysite-node`
- Build frontend: `npm run build --omit=dev`
- Reload Nginx: `sudo systemctl reload nginx`

## 🌟 Enjoy Optimizing!

With Check My Site, you're now equipped to elevate your website's performance to new heights! Happy optimizing! 🎉🔧

---

📝 **Note**: For the most up-to-date information, always refer to the official documentation or contact the project maintainers.
