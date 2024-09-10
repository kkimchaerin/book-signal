const bcrypt = require('bcrypt');
const bookDB = require('../models/bookDB');

const textToHash = async (text) => {
    const saltRounds = 12;

    try {
        const hash = await bcrypt.hash(text, saltRounds);
        return hash;
    } catch (err) {
        console.error(err);
        throw err;
    }
};

const searchBooks = (req, res) => {
    const searchQuery = req.query.query;

    if (!searchQuery) {
        return res.status(400).json({ message: '검색어가 제공되지 않았습니다.' });
    }

    bookDB.searchBooks(searchQuery)
        .then(results => {
            if (results.all.length === 0) {
                return res.status(404).json({ message: '검색 결과가 없습니다.' });
            }
            // 전체, 도서, 장르로 나뉜 결과를 전달
            res.json({
                all: results.all,
                books: results.books,
                genres: results.genres
            });
        })
        .catch(err => {
            console.error('도서 검색 중 오류 발생:', err);
            res.status(500).json({ message: '서버 오류가 발생했습니다.' });
        });
};


module.exports = { searchBooks };
