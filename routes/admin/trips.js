const express = require('express');
const c = require('../../controllers/admin/tripsController');

const router = express.Router();
router.get('/trips', c.list);
router.get('/trips/new', c.createForm);
router.post('/trips/media', c.uploadMedia);
router.post('/trips/new', c.create);
router.get('/trips/approvals', c.approvals);
router.get('/trips/:id/edit', c.editForm);
router.post('/trips/:id/edit', c.edit);
router.get('/trips/:id', c.detail);
router.post('/trips/:id/approve', c.approve);
router.post('/trips/:id/reject', c.reject);
router.post('/trips/:id/feature', c.feature);
router.post('/trips/:id/delete', c.remove);
router.post('/trips/bulk-approve', c.bulkApprove);
module.exports = router;
