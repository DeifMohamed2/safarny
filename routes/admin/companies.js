const express = require('express');
const c = require('../../controllers/admin/companiesController');

const router = express.Router();
router.get('/companies', c.list);
router.get('/companies/new', c.createForm);
router.post('/companies/new', c.create);
router.get('/companies/:id', c.detail);
router.get('/companies/:id/edit', c.editForm);
router.post('/companies/:id/edit', c.edit);
router.post('/companies/:id/verify', c.verify);
router.post('/companies/:id/reject', c.reject);
router.post('/companies/:id/suspend', c.suspend);
router.post('/companies/:id/reactivate', c.reactivate);
router.post('/companies/:id/commission', c.commission);
module.exports = router;
