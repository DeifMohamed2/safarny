const fs = require('fs');
const path = require('path');
const multer = require('multer');

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DOC_TYPES = new Set(['application/pdf']);
const ALLOWED_TYPES = new Set([...IMAGE_TYPES, ...DOC_TYPES]);
const MAX_BYTES = 10 * 1024 * 1024;
const DOC_FIELDS = [
  { name: 'commercialRegister', maxCount: 1 },
  { name: 'taxCard', maxCount: 1 },
];

const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads', 'company-docs');

function docsScope(req) {
  const companyId = req.session?.user?.companyId;
  if (companyId) return String(companyId);
  if (!req._companyDocsTempId) {
    req._companyDocsTempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return req._companyDocsTempId;
}

function ensureUploadDir(scope) {
  const dir = path.join(uploadsRoot, String(scope));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function isAllowed(mimetype) {
  return ALLOWED_TYPES.has(mimetype);
}

function fileFromField(req, field) {
  return req.files?.[field]?.[0] || null;
}

function mapDoc(file, companyId) {
  if (!file) return null;
  const filename = path.basename(file.filename || file.path || '');
  return {
    url: `/uploads/company-docs/${companyId}/${filename}`,
    name: file.originalname || filename,
    mime: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  };
}

function moveFileToCompany(file, companyId) {
  if (!file) return null;
  const destDir = ensureUploadDir(companyId);
  const filename = path.basename(file.filename || file.path || '');
  const dest = path.join(destDir, filename);
  if (path.resolve(file.path) !== path.resolve(dest)) {
    try {
      fs.renameSync(file.path, dest);
    } catch (err) {
      if (err.code !== 'EXDEV') throw err;
      fs.copyFileSync(file.path, dest);
      fs.unlinkSync(file.path);
    }
    const leftover = path.dirname(file.path);
    try {
      if (leftover.startsWith(uploadsRoot) && leftover !== destDir) fs.rmdirSync(leftover);
    } catch {
      /* ignore non-empty temp dirs */
    }
  }
  file.path = dest;
  return mapDoc(file, companyId);
}

function finalizeUploadedDocs(req, companyId) {
  return {
    commercialRegister: moveFileToCompany(fileFromField(req, 'commercialRegister'), companyId),
    taxCard: moveFileToCompany(fileFromField(req, 'taxCard'), companyId),
  };
}

function removeUploadedFiles(req) {
  const groups = req.files && typeof req.files === 'object' ? Object.values(req.files) : [];
  groups.flat().forEach((file) => {
    if (!file?.path) return;
    try {
      fs.unlinkSync(file.path);
    } catch {
      /* ignore */
    }
  });
}

function hasBothDocs(docs = {}) {
  return Boolean(docs.commercialRegister?.url && docs.taxCard?.url);
}

function isImageDoc(doc) {
  return Boolean(doc?.mime && IMAGE_TYPES.has(doc.mime));
}

function uploadErrorMessage(error) {
  if (error?.message === 'UNSUPPORTED_TYPE') {
    return 'Use JPG, PNG, WEBP, or PDF for verification documents.';
  }
  if (error?.code === 'LIMIT_FILE_SIZE') {
    return 'Each document must be 10 MB or less.';
  }
  return error?.message || 'Document upload failed.';
}

const companyDocsUpload = multer({
  storage: multer.diskStorage({
    destination(req, _file, cb) {
      try {
        cb(null, ensureUploadDir(docsScope(req)));
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
  limits: { fileSize: MAX_BYTES, files: 2 },
  fileFilter(_req, file, cb) {
    if (!isAllowed(file.mimetype)) return cb(new Error('UNSUPPORTED_TYPE'));
    cb(null, true);
  },
});

module.exports = {
  MAX_BYTES,
  DOC_FIELDS,
  companyDocsUpload,
  fileFromField,
  finalizeUploadedDocs,
  removeUploadedFiles,
  hasBothDocs,
  isImageDoc,
  uploadErrorMessage,
};
