const express      = require('express');
const path         = require('path');
const fs           = require('fs');
const { get, run, all } = require('../config/db');
const auth         = require('../middleware/auth');
const upload       = require('../middleware/upload');

const router = express.Router();
router.use(auth);

// POST /api/documents/upload
router.post('/upload', (req, res) => {
  upload.single('document')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Upload error.' });
    if (!req.file) return res.status(400).json({ message: 'No file provided.' });
    try {
      const { originalname, filename, mimetype, size } = req.file;
      await run(
        'INSERT INTO documents (user_id, file_name, file_path, file_type, file_size) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, originalname, filename, mimetype, size]
      );
      return res.status(201).json({ message: 'File uploaded successfully.', fileName: originalname });
    } catch (dbErr) {
      console.error('Upload DB error:', dbErr);
      return res.status(500).json({ message: 'Database error.' });
    }
  });
});

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const docs = await all(
      'SELECT id, file_name, file_type, file_size, upload_date FROM documents WHERE user_id = $1 ORDER BY upload_date DESC',
      [req.user.id]
    );
    return res.json({ documents: docs });
  } catch (err) {
    return res.status(500).json({ message: 'Could not retrieve documents.' });
  }
});

// GET /api/documents/download/:id
router.get('/download/:id', async (req, res) => {
  try {
    const doc = await get(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!doc) return res.status(404).json({ message: 'Document not found.' });

    const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
    const filePath   = path.join(UPLOAD_DIR, doc.file_path);

    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: 'File missing from server.' });

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.file_name)}"`);
    res.setHeader('Content-Type', doc.file_type);
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(500).json({ message: 'Download failed.' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await get(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!doc) return res.status(404).json({ message: 'Document not found.' });

    const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
    const filePath   = path.join(UPLOAD_DIR, doc.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await run('DELETE FROM documents WHERE id = $1', [doc.id]);
    return res.json({ message: 'Document deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Deletion failed.' });
  }
});

module.exports = router;