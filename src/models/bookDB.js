const conn = require('../config/database');

// 도서 정보 검색 함수
exports.searchBooks = async (searchQuery) => {
  try {
    const sql = `SELECT * FROM book_db WHERE book_name LIKE ?`;
    const formattedQuery = `%${searchQuery}%`;
    const [results] = await conn.query(sql, [formattedQuery]);

    const updatedResults = results.map(book => {
      book.book_cover = decodeURIComponent(book.book_cover);
      book.book_cover = book.book_cover ? `images/${book.book_cover}` : './files/default.jpg';
      return book;
    });

    return updatedResults;
  } catch (err) {
    console.error('도서 검색 중 오류 발생:', err);
    throw err;
  }
};

// book_path를 가져오는 함수
exports.getBookPath = async (bookName) => {
  try {
    const sql = `SELECT book_path FROM book_db WHERE book_path = ?`;
    const [results] = await conn.query(sql, [bookName]);

    if (results.length > 0) {
      return results[0].book_path;
    } else {
      throw new Error('책을 찾을 수 없습니다.');
    }
  } catch (err) {
    console.error('book_path를 가져오는 중 오류 발생:', err);
    throw err;
  }
};

/******************** 랭킹 도서 목록 ********************/
const getBooks = async (orderBy, limit = 12) => {
  try {
    const sql = `
        SELECT *
        FROM book_db
        ORDER BY ${orderBy}
        LIMIT ${limit}
      `;
    const [results] = await conn.query(sql);

    const updatedResults = results.map(book => {
      book.book_cover = decodeURIComponent(book.book_cover);
      book.book_cover = book.book_cover ? `/images/${book.book_cover}` : '/images/default.jpg';
      return book;
    });

    return updatedResults;
  } catch (err) {
    console.error('DB 쿼리 실행 중 오류 발생:', err);
    throw err;
  }
};

// 메인 인기 top6
exports.popularBooksMain = () => {
  return getBooks('book_views DESC', 6);
};

// 메인 평점 top6
exports.bestBooksMain = () => {
  return getBooks('book_avg DESC', 6);
};

// 메인 신작 top6
exports.newBooksMain = () => {
  return getBooks('book_published_at DESC', 6);
};

// 인기 랭킹 도서 목록
exports.popularBooks = () => {
  return getBooks('book_views DESC');
};

// 평점 베스트 도서 목록
exports.bestBooks = () => {
  return getBooks('book_avg DESC');
};

// 신작 도서 목록
exports.newBooks = () => {
  return getBooks('book_published_at DESC');
};

// 관련 도서 목록을 가져오는 함수
exports.sameBooksDetail = async (book_genre, book_idx) => {
  try {
    const sql = `
      SELECT *
      FROM book_db 
      WHERE book_genre = ? 
      AND book_idx != ? 
      ORDER BY RAND() 
      LIMIT 4
    `;
    const [results] = await conn.query(sql, [book_genre, book_idx]);

    const updatedResults = results.map(book => {
      book.book_cover = decodeURIComponent(book.book_cover);
      book.book_cover = book.book_cover ? `/images/${book.book_cover}` : '/images/default.jpg';
      return book;
    });

    return updatedResults;
  } catch (err) {
    console.error('관련 도서 목록을 가져오는 중 오류 발생:', err);
    throw err;
  }
};

/******************** 찜하기 ********************/
// 사용자가 이미 찜한 도서인지 확인
exports.checkWishlist = async (mem_id, book_idx) => {
  try {
    const sql = `SELECT COUNT(*) AS count FROM book_wishlist WHERE mem_id = ? AND book_idx = ?`;
    const [results] = await conn.query(sql, [mem_id, book_idx]);

    return results[0].count > 0;
  } catch (err) {
    console.error('찜한 도서 여부 확인 에러:', err);
    throw err;
  }
};

// 도서 찜하기 추가
exports.addWishlist = async (mem_id, book_idx) => {
  try {
    const sql = `INSERT INTO book_wishlist (mem_id, book_idx) VALUES (?, ?)`;
    await conn.query(sql, [mem_id, book_idx]);

    return { message: '도서가 찜 목록에 추가되었습니다.' };
  } catch (err) {
    console.error('도서 찜하기 에러:', err);
    throw err;
  }
};

// 찜한 도서 제거
exports.removeWishlist = async (mem_id, book_idx) => {
  try {
    const sql = `DELETE FROM book_wishlist WHERE mem_id = ? AND book_idx = ?`;
    await conn.query(sql, [mem_id, book_idx]);

    return { message: '도서가 찜 목록에서 제거되었습니다.' };
  } catch (err) {
    console.error('찜한 도서 제거 에러:', err);
    throw err;
  }
};

/******************** 시선 추적 시간 저장 ********************/
exports.saveGazeTime = async (book_idx, mem_id, book_text, gaze_duration) => {
  try {
    const sql = `
      INSERT INTO book_eyegaze (book_idx, mem_id, book_text, gaze_duration, gaze_recorded_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    await conn.query(sql, [book_idx, mem_id, book_text, gaze_duration]);

    return { message: '시선 추적 시간이 저장되었습니다.' };
  } catch (err) {
    console.error('Error saving gaze time:', err);
    throw err;
  }
};

// 북마크 저장 함수
exports.saveBookmark = async (book_name, book_idx, mem_id, cfi, page_text) => {
  try {
    const sql = `
      INSERT INTO book_reading (book_name, book_idx, mem_id,book_mark, book_text)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await conn.query(sql, [book_name, book_idx, mem_id, cfi, page_text]);

    return { message: '북마크가 저장되었습니다.', bookmarkId: result.insertId };
  } catch (err) {
    console.error('북마크 저장 중 오류 발생:', err);
    throw err;
  }
};

// 사용자의 북마크를 가져오는 함수
exports.getBookmarks = async (book_idx, mem_id) => {
  try {
    const sql = `
      SELECT book_mark, book_text
      FROM book_reading
      WHERE book_idx = ? AND mem_id = ?
      ORDER BY created_at DESC
    `;
    const [results] = await conn.query(sql, [book_idx, mem_id]);

    return results;
  } catch (err) {
    console.error('북마크를 가져오는 중 오류 발생:', err);
    throw err;
  }
};
