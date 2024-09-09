const express = require('express');
const router = express.Router();
const bookDB = require('../models/bookDB'); // bookDB 모듈 경로

// 사용자가 이미 찜한 도서인지 확인
router.post('/check', async (req, res) => {
    const { mem_id, book_idx } = req.body;

    try {
        const isWishlisted = await bookDB.checkWishlist(mem_id, book_idx);
        res.status(200).json({ isWishlisted });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 도서 찜하기
router.post('/', async (req, res) => {
    const { mem_id, book_idx } = req.body;

    if (!mem_id || !book_idx) {
        return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
    }

    try {
        const result = await bookDB.addWishlist(mem_id, book_idx);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.error('도서 찜하기 실패:', error);
    }
});

// 찜한 도서 제거
router.post('/remove', async (req, res) => {
    const { mem_id, book_idx } = req.body;

    try {
        const result = await bookDB.removeWishlist(mem_id, book_idx);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
