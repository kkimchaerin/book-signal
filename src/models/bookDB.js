const db = require('../config/database'); // Promise 기반 DB 모듈 사용

// 도서 정보 검색 함수
exports.searchBooks = async (searchQuery) => {
  let conn;
  try {
    conn = await db.getConnection();
    const sql = `SELECT * FROM book_db WHERE book_name LIKE ?`;
    const formattedQuery = `%${searchQuery}%`;

    const [results] = await conn.query(sql, [formattedQuery]);

    const updatedResults = results.map(book => {
      book.book_cover = decodeURIComponent(book.book_cover);
      book.book_cover = book.book_cover ? `images/${book.book_cover}` : './files/default.jpg'; // 기본 이미지 경로 설정
      return book;
    });

    return updatedResults;
  } catch (err) {
    console.error('Error searching books:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

// book_path를 가져오는 함수
exports.getBookPath = async (bookName) => {
  let conn;
  try {
    conn = await db.getConnection();
    const sql = `SELECT book_path FROM book_db WHERE book_name = ?`;
    const [results] = await conn.query(sql, [bookName]);

    if (results.length > 0) {
      return results[0].book_path;
    } else {
      throw new Error('책을 찾을 수 없습니다.');
    }
  } catch (err) {
    console.error('book_path를 가져오는 중 오류 발생:', err);
    throw new Error('book_path를 가져오지 못했습니다.');
  } finally {
    if (conn) conn.release();
  }
};

// 랭킹 도서 목록
const getBooks = async (orderBy, limit = 12) => {
  let conn;
  try {
    conn = await db.getConnection();
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
  } finally {
    if (conn) conn.release();
  }
};

// 메인 인기 top6
exports.popularBooksMain = () => getBooks('book_views DESC', 6);

// 메인 평점 top6
exports.bestBooksMain = () => getBooks('book_avg DESC', 6);

// 메인 신작 top6
exports.newBooksMain = () => getBooks('book_published_at DESC', 6);

// 인기 랭킹 도서 목록
exports.popularBooks = () => getBooks('book_views DESC');

// 평점 베스트 도서 목록
exports.bestBooks = () => getBooks('book_avg DESC');

// 신작 도서 목록
exports.newBooks = () => getBooks('book_published_at DESC');

// 관련 도서 목록을 가져오는 함수
exports.sameBooksDetail = async (book_genre, book_idx) => {
  let conn;
  try {
    conn = await db.getConnection();
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
    throw new Error('관련 도서 목록을 가져오는 중 오류가 발생했습니다.');
  } finally {
    if (conn) conn.release();
  }
};

// 사용자가 이미 찜한 도서인지 확인
exports.checkWishlist = async (mem_id, book_idx) => {
  let conn;
  try {
    conn = await db.getConnection();
    const sql = `SELECT COUNT(*) AS count FROM book_wishlist WHERE mem_id = ? AND book_idx = ?`;
    const [results] = await conn.query(sql, [mem_id, book_idx]);

    return results[0].count > 0;
  } catch (err) {
    console.error('찜한 도서 여부 확인 에러:', err);
    throw new Error('찜한 도서 여부 확인에 실패했습니다.');
  } finally {
    if (conn) conn.release();
  }
};

// 도서 찜하기 추가
exports.addWishlist = async (mem_id, book_idx) => {
  let conn;
  try {
    conn = await db.getConnection();
    const sql = `INSERT INTO book_wishlist (mem_id, book_idx) VALUES (?, ?)`;
    await conn.query(sql, [mem_id, book_idx]);

    return { message: '도서가 찜 목록에 추가되었습니다.' };
  } catch (err) {
    console.error('도서 찜하기 에러:', err);
    throw new Error('도서 찜하기에 실패했습니다.');
  } finally {
    if (conn) conn.release();
  }
};

// 찜한 도서 제거
exports.removeWishlist = async (mem_id, book_idx) => {
  let conn;
  try {
    conn = await db.getConnection();
    const sql = `DELETE FROM book_wishlist WHERE mem_id = ? AND book_idx = ?`;
    const [result] = await conn.query(sql, [mem_id, book_idx]);

    if (result.affectedRows > 0) {
      return { message: '도서가 찜 목록에서 제거되었습니다.' };
    } else {
      throw new Error('삭제할 도서를 찾지 못했습니다.');
    }
  } catch (err) {
    console.error('찜한 도서 제거 에러:', err);
    throw new Error('찜한 도서 제거에 실패했습니다.');
  } finally {
    if (conn) conn.release();
  }
};

// 시선 추적 시간 저장
exports.saveGazeTime = async (book_idx, mem_id, book_text, gaze_duration) => {
  let conn;
  try {
    conn = await db.getConnection();
    const sql = `
      INSERT INTO book_eyegaze (book_idx, mem_id, book_text, gaze_duration, gaze_recorded_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    const [result] = await conn.query(sql, [book_idx, mem_id, book_text, gaze_duration]);

    return result;
  } catch (err) {
    console.error('Error saving gaze time:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

// 북마크 저장 함수
exports.saveBookmark = async (book_name, book_idx, mem_id, cfi, page_text) => {
  let conn;
  try {
    conn = await db.getConnection();
    const sql = `
      INSERT INTO book_reading (book_name, book_idx, mem_id, book_mark, book_text, book_latest)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await conn.query(sql, [book_name, book_idx, mem_id, cfi, page_text]);

    return { message: '북마크가 저장되었습니다.', bookmarkId: result.insertId };
  } catch (err) {
    console.error('북마크 저장 중 오류 발생:', err);
    throw new Error('북마크를 저장하는 중 오류가 발생했습니다.');
  } finally {
    if (conn) conn.release();
  }
};

// 사용자의 북마크를 가져오는 함수
exports.getBookmarks = async (book_idx, mem_id) => {
  let conn;
  try {
    conn = await db.getConnection();
    const sql = `
      SELECT book_mark
      FROM book_reading
      WHERE book_idx = ? AND mem_id = ? 
      AND book_text IS NOT NULL
      ORDER BY book_latest ASC
    `;
    const [results] = await conn.query(sql, [book_idx, mem_id]);

    return results.length > 0 ? results : []; // 결과가 비어 있는 경우 빈 배열 반환
  } catch (err) {
    console.error('북마크를 가져오는 중 오류 발생:', err);
    throw new Error('북마크를 가져오는 중 오류가 발생했습니다.');
  } finally {
    if (conn) conn.release();
  }
};

// 특정 사용자와 책의 북마크를 가져오는 함수
exports.getUserBookmarkForBook = async (book_idx, mem_id) => {
  let conn;
  try {
    conn = await db.getConnection();
    const sql = `
      SELECT book_mark
      FROM book_reading
      WHERE book_idx = ? 
        AND mem_id = ?
        AND book_text IS NULL
        AND book_mark LIKE 'epubcfi%'
      ORDER BY book_latest DESC
      LIMIT 1
    `;
    const [results] = await conn.query(sql, [book_idx, mem_id]);

    return results.length > 0 ? results[0].book_mark : null;
  } catch (err) {
    console.error('북마크를 가져오는 중 오류 발생:', err);
    throw new Error('북마크를 가져오는 중 오류가 발생했습니다.');
  } finally {
    if (conn) conn.release();
  }
};

// 북마크 저장 함수
exports.saveEndReading = async (book_idx, mem_id, cfi) => {
  let conn;
  try {
    conn = await db.getConnection();
    const getBookNameSql = `
      SELECT book_name 
      FROM book_reading 
      WHERE book_idx = ?
      LIMIT 1
    `;
    const [results] = await conn.query(getBookNameSql, [book_idx]);

    if (results.length === 0) {
      throw new Error('해당 book_idx에 대한 책을 찾을 수 없습니다.');
    }

    const book_name = results[0].book_name;

    const saveBookmarkSql = `
      INSERT INTO book_reading (book_idx, mem_id, book_mark, book_name, book_latest)
      VALUES (?, ?, ?, ?, NOW())
    `;
    const [result] = await conn.query(saveBookmarkSql, [book_idx, mem_id, cfi, book_name]);

    return { message: '북마크가 저장되었습니다.', bookmarkId: result.insertId };
  } catch (err) {
    console.error('독서 종료 중 북마크 저장 오류 발생:', err);
    throw new Error('독서 종료 중 북마크 저장에 실패했습니다.');
  } finally {
    if (conn) conn.release();
  }
};

// 북마크 삭제 함수
exports.removeBookmark = async (book_idx, mem_id, book_mark) => {
  let conn;
  try {
    conn = await db.getConnection();
    const sql = `
      DELETE FROM book_reading 
      WHERE book_idx = ? 
      AND mem_id = ? 
      AND book_mark = ?
    `;
    const [result] = await conn.query(sql, [book_idx, mem_id, book_mark]);

    if (result.affectedRows > 0) {
      return { message: '북마크가 삭제되었습니다.' };
    } else {
      throw new Error('삭제할 북마크를 찾지 못했습니다.');
    }
  } catch (err) {
    console.error('북마크 삭제 중 오류 발생:', err);
    throw new Error('북마크 삭제에 실패했습니다.');
  } finally {
    if (conn) conn.release();
  }
};
