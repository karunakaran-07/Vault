# 🔒 DocVault — Secure Document Storage

A full-stack secure document vault using **Node.js, Express, SQLite, and vanilla HTML/CSS/JS**.
No MySQL or any database installation required — SQLite is a single file, created automatically on first run.

---

## 🚀 Quick Start (3 steps)

### Step 1 — Configure environment

```powershell
cd document-vault\backend
copy .env.example .env
```

Then open `.env` in any text editor and set your JWT secret:
```env
PORT=5000
JWT_SECRET=any_long_random_string_you_make_up_here
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE_MB=5
```

### Step 2 — Install dependencies

```powershell
npm install
```

### Step 3 — Start the server

```powershell
npm start
```

You'll see:
```
✅  SQLite database ready at: ...\database\vault.db
🚀  Document Vault server running at http://localhost:5000
```

Open **http://localhost:5000** in your browser. Done! ✅

---

## 📁 Project Structure

```
document-vault/
├── frontend/
│   ├── index.html        ← Home page
│   ├── register.html     ← Register
│   ├── login.html        ← Login
│   ├── dashboard.html    ← Dashboard
│   ├── upload.html       ← Upload files
│   ├── documents.html    ← My documents
│   ├── style.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/db.js      ← SQLite (auto-creates vault.db)
│   ├── middleware/
│   │   ├── auth.js       ← JWT middleware
│   │   └── upload.js     ← Multer middleware
│   └── routes/
│       ├── auth.js       ← Register & Login
│       └── documents.js  ← Upload, List, Download, Delete
├── uploads/              ← Your uploaded files live here
└── database/
    └── vault.db          ← Auto-created SQLite database file
```

---

## 🛡️ Security Features

| Feature | How |
|---------|-----|
| Password hashing | bcryptjs (12 rounds) |
| Authentication | JWT tokens |
| File type check | MIME whitelist (PDF, DOCX, images) |
| File size limit | 5 MB (server-side) |
| User isolation | Every query filters by user ID from JWT |

---

## 🔧 Troubleshooting

**`better-sqlite3` install fails**
Run in PowerShell as Administrator, or try:
```powershell
npm install --build-from-source
```
You may also need the Windows build tools:
```powershell
npm install --global windows-build-tools
```

**Port already in use**
Change `PORT=5001` in `.env` and update `API` in `frontend/app.js` to match.
Doc Vault Security Has been Increased 
