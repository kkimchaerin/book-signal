const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review');

// 특정 책의 리뷰 가져오기
router.get('/book/:book_idx', reviewController.getReviewsByBookId);

// 특정 사용자의 리뷰 가져오기
router.get('/:mem_id', reviewController.getUserReviews);

// 리뷰 삭제하기
router.delete('/:reviewId', reviewController.deleteReview);

// 리뷰 등록 
router.post('/addReview', reviewController.addReview);

// 리뷰가 있는지 확인하기
router.get('/check', reviewController.checkReviewExists);


module.exports = router;