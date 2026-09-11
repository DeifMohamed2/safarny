const fs = require('fs');
const path = require('path');
const multer = require('multer');

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const DOC_TYPES = new Set(['application/pdf']);
const ALLOWED_TYPES = new Set([...IMAGE_TYPES, ...DOC_TYPES]);
const MAX_BYTES = 10 * 1024 * 1024;

const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads', 'booking-payments');

function userScope(req) {
  const user = req.session?.user;
  return user?.id ? String(user.id) : 'guest';
}

function ensureUploadDir(userId) {
  const dir = path.join(uploadsRoot, String(userId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function isAllowed(mimetype) {
  return ALLOWED_TYPES.has(mimetype);
}

function mapUploadedProof(req) {
  if (!req.file) return null;
  const userId = userScope(req);
  const filename = path.basename(req.file.filename || req.file.path || '');
  return {
    url: `/uploads/booking-payments/${userId}/${filename}`,
    name: req.file.originalname || filename,
    mime: req.file.mimetype,
    size: req.file.size,
  };
}

function uploadErrorResponse(error, res) {
  if (error.message === 'UNSUPPORTED_TYPE') {
    return res.status(400).json({ ok: false, message: 'Unsupported file type. Use JPG, PNG, or PDF.' });
  }
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ ok: false, message: 'Proof file must be 10 MB or less.' });
  }
  return res.status(400).json({ ok: false, message: error.message || 'Upload failed.' });
}

const paymentProofUpload = multer({
  storage: multer.diskStorage({
    destination(req, _file, cb) {
      try {
        cb(null, ensureUploadDir(userScope(req)));
      } catch (err) {
        cb(err);
      }
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeExt = ext && ext.length <= 8 ? ext : '';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
    },
  }),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (!isAllowed(file.mimetype)) return cb(new Error('UNSUPPORTED_TYPE'));
    cb(null, true);
  },
});

module.exports = {
  MAX_BYTES,
  paymentProofUpload,
  mapUploadedProof,
  uploadErrorResponse,
  ensureUploadDir,
};
