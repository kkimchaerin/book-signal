const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review');

// 특정 사용자의 리뷰 가져오기
router.get('/reviews/:mem_id', reviewController.getUserReviews);

// 리뷰 삭제하기
router.delete('/reviews/:reviewId', reviewController.deleteReview);

module.exports = router;