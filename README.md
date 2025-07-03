# 💬 Danu-WP WhatsApp Bot

A powerful, feature-rich WhatsApp bot built with [Baileys](https://github.com/WhiskeySockets/Baileys) + Node.js. Supports YouTube audio/video downloads, social media media grabbers, view-once media, stylish responses, and more!

---

## 🌟 Features

✅ YouTube Downloader  
✅ TikTok / Instagram / Facebook Video Downloader  
✅ View-Once Media Bypass  
✅ Group Participant Pings
✅ Stylish AI Responses  
✅ Auto Reaction & Emojis  
✅ Message Logger (Under maintenance)  
✅ Modular command support  
✅ Railway Hosting Ready 🚀

---

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kdineshharsha/Danu-WP.git
cd Danu-WP
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup `auth.json` for Login

- First run will generate QR to scan

```bash
node index.js
```

- Scan QR with your WhatsApp
- This will generate `auth.json` for sessions

### 4. Start the Bot

```bash
npm start
```

---

## 🚀 Deploy to Railway

### First-time Setup

```bash
railway login
railway init
```

### To Upload Updated Files

```bash
railway up
```

---

## 🎧 YouTube Usage

### `.yt <url>`

- Shows video info, duration, views, thumbnail
- Replies:
  - `1` → Audio
  - `2` → Video

### `.ytmp3 <url>`

- Direct YouTube MP3 download

### `.ytmp4 <url>`

- Direct YouTube MP4 download

---

## 📥 Other Commands

| Command          | Description                |
| ---------------- | -------------------------- |
| `.vv`            | View-once media fetch      |
| `.tagall`        | Tag all group members      |
| `.fb <url>`      | Download Facebook videos   |
| `.tt <url>`      | TikTok downloader          |
| `.ig <url>`      | Instagram video downloader |
| `.getdp <@user>` | Get profile picture        |

---

## 💡 Tips

- Use `yt-dlp` with `cookies.txt` to bypass age restrictions or region blocks
- Ensure `ffmpeg` is installed and correctly linked (Railway uses `/app/bin/ffmpeg`)
- Limit video size to 16MB for WhatsApp compatibility (already handled)

---

## 👨‍💻 Contributors

- 💖 [Dinesh Harsha](https://github.com/kdineshharsha)

---

## 📜 License

This bot is made for educational and personal use. Please respect WhatsApp's terms and services.
