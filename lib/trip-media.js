const fs = require('fs');
const path = require('path');
const multer = require('multer');

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 20 * 1024 * 1024;
const MAX_IMAGES = 12;
const MAX_VIDEOS = 3;

const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads', 'company-trips');

function ensureCompanyUploadDir(companyId) {
  const dir = path.join(uploadsRoot, String(companyId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function mediaKind(mimetype) {
  if (IMAGE_TYPES.has(mimetype)) return 'image';
  if (VIDEO_TYPES.has(mimetype)) return 'video';
  return null;
}

function parseMediaList(value, fallback = []) {
  if (!value) return [...fallback];
  if (Array.isArray(value)) return value.filter(Boolean);
  const raw = String(value).trim();
  if (!raw) return [...fallback];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch (error) {
    /* fall through */
  }
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const tripMediaUpload = multer({
  storage: multer.diskStorage({
    destination(req, _file, cb) {
      try {
        const companyId =
          req.session?.user?.role === 'admin'
            ? String(req.query.companyId || req.body?.companyId || '0')
            : req.session.user.companyId;
        const dir = ensureCompanyUploadDir(companyId);
        cb(null, dir);
      } catch (error) {
        cb(error);
      }
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeExt = ext && ext.length <= 8 ? ext : '';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
    },
  }),
  limits: {
    fileSize: VIDEO_MAX_BYTES,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    if (!mediaKind(file.mimetype)) {
      return cb(new Error('UNSUPPORTED_TYPE'));
    }
    cb(null, true);
  },
});

function validateUploadedFile(file) {
  const kind = mediaKind(file.mimetype);
  if (!kind) {
    return { ok: false, code: 'UNSUPPORTED_TYPE', message: 'Unsupported file type.' };
  }
  if (kind === 'image' && file.size > IMAGE_MAX_BYTES) {
    return { ok: false, code: 'IMAGE_TOO_LARGE', message: 'Each photo must be 5 MB or less.' };
  }
  if (kind === 'video' && file.size > VIDEO_MAX_BYTES) {
    return { ok: false, code: 'VIDEO_TOO_LARGE', message: 'Each video must be 20 MB or less.' };
  }
  return { ok: true, kind };
}

function publicUploadPath(companyId, filename) {
  return `/uploads/company-trips/${String(companyId || '0')}/${filename}`;
}

module.exports = {
  IMAGE_MAX_BYTES,
  VIDEO_MAX_BYTES,
  MAX_IMAGES,
  MAX_VIDEOS,
  IMAGE_TYPES,
  VIDEO_TYPES,
  tripMediaUpload,
  parseMediaList,
  validateUploadedFile,
  publicUploadPath,
  mediaKind,
};
