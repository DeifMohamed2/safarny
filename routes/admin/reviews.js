const express = require('express');
const c = require('../../controllers/admin/reviewsController');

const router = express.Router();
router.get('/reviews', c.list);
router.post('/reviews/:id/publish', c.publish);
router.post('/reviews/:id/hide', c.hide);
router.post('/reviews/:id/delete', c.remove);
module.exports = router;
