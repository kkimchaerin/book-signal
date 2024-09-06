const express = require('express');
const router = express.Router();
const { getBookPath, saveBookmark, getBookmarks, saveEndReading, getUserBookmarkForBook, removeBookmark, removeEyegazeBookmark } = require('../models/bookDB');


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
        res.status(200).json({
            readingBookmarks: bookmarks.readingBookmarks,
            eyegazeBookmark: bookmarks.eyegazeBookmark
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve bookmarks.' });
    }
});


// 최근 읽은 도서용 북마크
router.get('/getUserBookmark', async (req, res) => {
    const { book_idx, mem_id } = req.query;

    try {
        const bookmark = await getUserBookmarkForBook(book_idx, mem_id);
        if (bookmark) {
            res.status(200).json({ bookmark });
        } else {
            res.status(404).json({ message: '북마크가 존재하지 않습니다.' });
        }
    } catch (error) {
        res.status(500).json({ error: '북마크를 가져오는 중 오류가 발생했습니다.' });
    }
});

// 독서 종료 API
router.post('/endReading', async (req, res) => {
    const { book_idx, mem_id, cfi } = req.body;

    try {
        const result = await saveEndReading(book_idx, mem_id, cfi);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
})

// 북마크 삭제 API
router.post('/removeBookmark', async (req, res) => {
    const { book_idx, mem_id, book_mark } = req.body;

    try {
        const result = await removeBookmark(book_idx, mem_id, book_mark);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: '북마크 삭제에 실패했습니다.' });
    }
});

// eyegaze 북마크 삭제 API
router.post('/removeEyegazeBookmark', async (req, res) => {
    const { book_idx, mem_id } = req.body;
    console.log(book_idx, mem_id);
    

    try {
        const result = await removeEyegazeBookmark(book_idx, mem_id);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'eyegaze 북마크 삭제에 실패했습니다.' });
    }
});

module.exports = router;