const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review');

// 특정 사용자의 리뷰 가져오기
router.get('/:mem_id', reviewController.getUserReviews);

// 리뷰 삭제하기
router.delete('/:reviewId', reviewController.deleteReview);

// 리뷰 등록 
router.post('/review', reviewController.addReview);


module.exports = router;