const express = require('express');
const c = require('../../controllers/admin/auditController');

const router = express.Router();
router.get('/audit', c.page);
module.exports = router;
