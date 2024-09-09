const express = require('express');
const router = express.Router();
const { getBookPath, saveBookmark, getBookmarks } = require('../models/bookDB');


router.post('/', async (req, res) => {
    const bookName = decodeURIComponent(req.body.book_name);

    try {
        const bookPath = await getBookPath(bookName);
        if (!bookPath) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.status(200).json({ book_path: bookPath });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 북마크 저장 API
router.post('/saveBookmark', async (req, res) => {
    const { book_name, book_idx, mem_id, cfi, page_text } = req.body;

    try {
        const result = await saveBookmark(book_name, book_idx, mem_id, cfi, page_text);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 북마크 가져오기 API
router.get('/getBookmarks', async (req, res) => {
    const { book_idx, mem_id } = req.query;

    try {
        const bookmarks = await getBookmarks(book_idx, mem_id);
        res.status(200).json(bookmarks); // 북마크가 없으면 빈 배열을 반환
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve bookmarks.' });
    }
});

module.exports = router;
