const express = require('express');
const router = express.Router();
const { newBooksMain, bestBooksMain, popularBooksMain } = require('../models/bookDB');

// 메인 책 불러오기
router.get('/', (req, res) => {
    Promise.all([newBooksMain(), bestBooksMain(), popularBooksMain()])
      .then(results => {
        const [newBooks, bestBooks, popularBooks] = results;
        res.json({ newBooks, bestBooks, popularBooks });
      })
      .catch(error => {
        console.error('도서 목록을 가져오는 중 오류 발생:', error);
        res.status(500).json({ error: '서버 오류' });
      });
});

// 라우터 모듈을 외부로 내보냄
module.exports = router;
