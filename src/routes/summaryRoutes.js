const express = require('express');
const router = express.Router();
const summaryController = require('../controllers/summary/summaryController');

// 요약 생성 라우트
router.post('/summarize', summaryController.createSummary);

module.exports = router;
