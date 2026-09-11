const express = require('express');
const c = require('../../controllers/admin/supportController');

const router = express.Router();
router.get('/support', c.list);
router.get('/support/:globalId', c.detail);
router.post('/support/:globalId/reply', c.reply);
router.post('/support/:globalId/status', c.status);
router.post('/support/:globalId/priority', c.priority);
router.post('/support/:globalId/assign', c.assign);
module.exports = router;
