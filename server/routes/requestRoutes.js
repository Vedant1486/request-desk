const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  listRequests,
  createRequest,
  getRequest,
  updateRequest,
  convertRequest,
  getActivities,
  getWorkItem,
} = require('../controllers/requestController');

router.use(auth);

router.get('/',          listRequests);
router.post('/',         createRequest);
router.get('/:id',       getRequest);
router.patch('/:id',     updateRequest);
router.post('/:id/convert',   convertRequest);
router.get('/:id/activities', getActivities);
router.get('/:id/work-item',  getWorkItem);

module.exports = router;
