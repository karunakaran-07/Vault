const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const { getDb, get, run, all } = require('../../lib/db');
const authMiddleware = require('../../lib/auth');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed. Only PDF, DOCX, and images accepted.'));
  },
});

function uploadToCloudinary(buffer, originalName, mimetype) {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith('image/') ? 'image' : 'raw';
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'docvault', resource_type: resourceType },
      (err, result) => { if (err) reject(err); else resolve(result); }
    );
    uploadStream.end(buffer);
  });
}

function runAuth(req, res) {
  return new Promise((resolve, reject) => {
    authMiddleware(req, res, (err) => { if (err) reject(err); else resolve(); });
  });
}

function runMulter(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('document')(req, res, (err) => { if (err) reject(err); else resolve(); });
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await getDb();
    await runAuth(req, res);

    const path = req.url.replace(/\?.*$/, '');

    if (req.method === 'POST' && path.endsWith('/upload')) {
      try { await runMulter(req, res); }
      catch (err) { return res.status(400).json({ message: err.message || 'Upload error.' }); }

      if (!req.file) return res.status(400).json({ message: 'No file provided.' });

      const { originalname, buffer, mimetype, size } = req.file;

      let cloudResult;
      try { cloudResult = await uploadToCloudinary(buffer, originalname, mimetype); }
      catch (err) {
        console.error('Cloudinary error:', err);
        return res.status(500).json({ message: 'Failed to upload file to storage.' });
      }

      await run(
        'INSERT INTO documents (user_id, file_name, file_path, file_url, file_type, file_size) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.user.id, originalname, cloudResult.public_id, cloudResult.secure_url, mimetype, size]
      );
      return res.status(201).json({ message: 'File uploaded successfully.', fileName: originalname });
    }

    if (req.method === 'GET' && (path.endsWith('/documents') || path.match(/\/documents\/?$/))) {
      const docs = await all(
        'SELECT id, file_name, file_type, file_size, upload_date, file_url FROM documents WHERE user_id = $1 ORDER BY upload_date DESC',
        [req.user.id]
      );
      return res.json({ documents: docs });
    }

    if (req.method === 'GET' && path.includes('/download/')) {
      const id  = path.split('/download/')[1];
      const doc = await get('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [id, req.user.id]);
      if (!doc) return res.status(404).json({ message: 'Document not found.' });
      return res.redirect(302, doc.file_url);
    }

    if (req.method === 'DELETE') {
      const id  = path.split('/').pop();
      const doc = await get('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [id, req.user.id]);
      if (!doc) return res.status(404).json({ message: 'Document not found.' });

      try {
        const resourceType = doc.file_type.startsWith('image/') ? 'image' : 'raw';
        await cloudinary.uploader.destroy(doc.file_path, { resource_type: resourceType });
      } catch (err) { console.warn('Cloudinary delete warning:', err.message); }

      await run('DELETE FROM documents WHERE id = $1', [doc.id]);
      return res.json({ message: 'Document deleted successfully.' });
    }

    return res.status(404).json({ message: 'Route not found.' });
  } catch (err) {
    console.error('Documents error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};
