require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const { getDb }  = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Init DB first, then start server
getDb().then(() => {
  const authRoutes = require('./routes/auth');
  const docRoutes  = require('./routes/documents');

  app.use('/api/auth',      authRoutes);
  app.use('/api/documents', docRoutes);
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('*', (_req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

  app.listen(PORT, () => {
    console.log(`🚀  Document Vault running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
