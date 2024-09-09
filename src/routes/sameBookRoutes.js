const express = require('express');
const router = express.Router();
const { sameBooksDetail } = require('../models/bookDB');

// 관련 도서 목록
router.get('/', (req, res) => {
    
    const { genre, idx } = req.query;
    Promise.all([sameBooksDetail(genre, idx)])
    .then(results => {
      const [sameBooks] = results;
      res.json({ sameBooks });
    })
    .catch(error => {
      console.error('관련 도서 목록을 가져오는 중 오류 발생:', error);
      res.status(500).json({ error: '서버 오류' });
    });
});
// 라우터 모듈을 외부로 내보냄
module.exports = router;