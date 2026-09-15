const fs = require('fs');
const path = require('path');
const multer = require('multer');

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const DOC_TYPES = new Set(['application/pdf']);
const ALLOWED_TYPES = new Set([...IMAGE_TYPES, ...DOC_TYPES]);
const MAX_BYTES = 10 * 1024 * 1024;
const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads', 'finance-proofs');

function actorScope(req) {
  return req.session?.user?.id ? String(req.session.user.id) : 'admin';
}

function ensureUploadDir(scope) {
  const dir = path.join(uploadsRoot, String(scope));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function mapUploadedProof(req) {
  if (!req.file) return null;
  const scope = actorScope(req);
  const filename = path.basename(req.file.filename || req.file.path || '');
  return {
    url: `/uploads/finance-proofs/${scope}/${filename}`,
    name: req.file.originalname || filename,
    mime: req.file.mimetype,
    size: req.file.size,
  };
}

function presentProof(proof) {
  if (!proof?.url) return null;
  const name = proof.name || 'proof';
  return {
    ...proof,
    viewUrl: proof.url,
    downloadUrl: proof.url,
    downloadName: name,
    isImage: String(proof.mime || '').startsWith('image/'),
  };
}

function uploadErrorMessage(error) {
  if (error?.message === 'UNSUPPORTED_TYPE') return 'Unsupported file type. Use JPG, PNG, or PDF.';
  if (error?.code === 'LIMIT_FILE_SIZE') return 'Proof file must be 10 MB or less.';
  return error?.message || 'Upload failed.';
}

const financeProofUpload = multer({
  storage: multer.diskStorage({
    destination(req, _file, cb) {
      try {
        cb(null, ensureUploadDir(actorScope(req)));
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
    if (!ALLOWED_TYPES.has(file.mimetype)) return cb(new Error('UNSUPPORTED_TYPE'));
    cb(null, true);
  },
});

module.exports = {
  MAX_BYTES,
  financeProofUpload,
  mapUploadedProof,
  presentProof,
  uploadErrorMessage,
};
