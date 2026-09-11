const fs = require('fs');
const path = require('path');
const multer = require('multer');

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads', 'company-logos');

function ensureCompanyLogoDir(companyId) {
  const dir = path.join(uploadsRoot, String(companyId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const companyLogoUpload = multer({
  storage: multer.diskStorage({
    destination(req, _file, cb) {
      try {
        const dir = ensureCompanyLogoDir(req.session.user.companyId);
        cb(null, dir);
      } catch (error) {
        cb(error);
      }
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeExt = ext && ext.length <= 8 ? ext : '.png';
      cb(null, `logo-${Date.now()}${safeExt}`);
    },
  }),
  limits: {
    fileSize: LOGO_MAX_BYTES,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    if (!IMAGE_TYPES.has(file.mimetype)) {
      return cb(new Error('UNSUPPORTED_TYPE'));
    }
    cb(null, true);
  },
});

function validateLogoFile(file) {
  if (!IMAGE_TYPES.has(file.mimetype)) {
    return { ok: false, code: 'UNSUPPORTED_TYPE', message: 'Use JPG, PNG, WEBP, or GIF.' };
  }
  if (file.size > LOGO_MAX_BYTES) {
    return { ok: false, code: 'LOGO_TOO_LARGE', message: 'Logo must be 2 MB or less.' };
  }
  return { ok: true };
}

function publicLogoPath(companyId, filename) {
  return `/uploads/company-logos/${String(companyId)}/${filename}`;
}

module.exports = {
  LOGO_MAX_BYTES,
  IMAGE_TYPES,
  companyLogoUpload,
  validateLogoFile,
  publicLogoPath,
};
