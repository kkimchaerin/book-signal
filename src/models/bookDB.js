const conn = require('../config/database');


// 도서 정보 검색 함수
exports.searchBooks = (searchQuery) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM book_db WHERE book_name LIKE ?`;
    const formattedQuery = `%${searchQuery}%`;

    conn.query(sql, [formattedQuery], (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      const updatedResults = results.map(book => {
        book.book_cover = decodeURIComponent(book.book_cover);
        if (book.book_cover) {
          book.book_cover = `images/${book.book_cover}`;
        } else {
          book.book_cover = './files/default.jpg'; // 기본 이미지 경로 설정
        }
        return book;
      });

      resolve(updatedResults);
    });
  });
};


// book_path를 가져오는 함수
exports.getBookPath = (bookName) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT book_path FROM book_db WHERE book_path = ?`;

    conn.query(sql, [bookName], (err, results) => {
      if (err) {
        console.error('book_path를 가져오는 중 오류 발생:', err);
        reject(new Error('book_path를 가져오지 못했습니다.'));
        return;
      }

      if (results.length > 0) {
        resolve(results[0].book_path);
      } else {
        reject(new Error('책을 찾을 수 없습니다.'));
      }
    });
  });
};


/******************** 랭킹 도서 목록 ********************/
const getBooks = (orderBy, limit = 12) => {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT *
        FROM book_db
        ORDER BY ${orderBy}
        LIMIT ${limit}
      `;

    conn.query(sql, (err, results) => {
      if (err) {
        console.error('DB 쿼리 실행 중 오류 발생:', err);
        reject(err);
        return;
      }
      resolve(results);
      const updatedResults = results.map(book => {
        book.book_cover = decodeURIComponent(book.book_cover);
        if (book.book_cover) {
          book.book_cover = `/images/${book.book_cover}`;
        } else {
          book.book_cover = '/images/default.jpg';
        }
        return book;
      });
      resolve(updatedResults);
    });
  });
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
exports.sameBooksDetail = (book_genre, book_idx) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT *
      FROM book_db 
      WHERE book_genre = ? 
      AND book_idx != ? 
      ORDER BY RAND() 
      LIMIT 4
    `;
    conn.query(sql, [book_genre, book_idx], (err, results) => {
      if (err) {
        console.error('관련 도서 목록을 가져오는 중 오류 발생:', err);
        reject(new Error('관련 도서 목록을 가져오는 중 오류가 발생했습니다.'));
        return;
      }

      const updatedResults = results.map(book => {
        book.book_cover = decodeURIComponent(book.book_cover);
        if (book.book_cover) {
          book.book_cover = `/images/${book.book_cover}`;
        } else {
          book.book_cover = '/images/default.jpg';
        }
        return book;
      });

      resolve(updatedResults);
    });
  });
};

/******************** 찜하기 ********************/
// 사용자가 이미 찜한 도서인지 확인
exports.checkWishlist = (mem_id, book_idx) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT COUNT(*) AS count FROM book_wishlist WHERE mem_id = ? AND book_idx = ?`;

    conn.query(sql, [mem_id, book_idx], (err, results) => {
      if (err) {
        console.error('찜한 도서 여부 확인 에러:', err);
        reject(new Error('찜한 도서 여부 확인에 실패했습니다.'));
        return;
      }

      resolve(results[0].count > 0);
    });
  });
};

// 도서 찜하기 추가
exports.addWishlist = (mem_id, book_idx) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO book_wishlist (mem_id, book_idx) VALUES (?, ?)`;

    conn.query(sql, [mem_id, book_idx], (err, result) => {
      if (err) {
        console.error('도서 찜하기 에러:', err);
        reject(new Error('도서 찜하기에 실패했습니다.'));
        return;
      }

      resolve({ message: '도서가 찜 목록에 추가되었습니다.' });
    });
  });
};

// 찜한 도서 제거
exports.removeWishlist = (mem_id, book_idx) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM book_wishlist WHERE mem_id = ? AND book_idx = ?`;

    conn.query(sql, [mem_id, book_idx], (err, result) => {
      if (err) {
        console.error('찜한 도서 제거 에러:', err);
        reject(new Error('찜한 도서 제거에 실패했습니다.'));
        return;
      }

      resolve({ message: '도서가 찜 목록에서 제거되었습니다.' });
    });
  });
};

/******************** 시선 추적 시간 저장 ********************/
exports.saveGazeTime = (book_idx, mem_id, book_text, gaze_duration) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO book_eyegaze (book_idx, mem_id, book_text, gaze_duration, gaze_recorded_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    conn.query(sql, [book_idx, mem_id, book_text, gaze_duration], (err, result) => {
      if (err) {
        console.error('Error saving gaze time:', err);
        reject(err);
        return;
      }

      resolve(result);
    });
  });
};


// 북마크 저장 함수
exports.saveBookmark = (book_name, book_idx, mem_id, cfi, page_text) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO book_reading (book_name, book_idx, mem_id, book_mark, book_text, book_latest)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    conn.query(sql, [book_name, book_idx, mem_id, cfi, page_text], (err, result) => {
      if (err) {
        console.error('북마크 저장 중 오류 발생:', err);
        reject(new Error('북마크를 저장하는 중 오류가 발생했습니다.'));
        return;
      }

      resolve({ message: '북마크가 저장되었습니다.', bookmarkId: result.insertId });
    });
  });
};

// 사용자의 북마크를 가져오는 함수
exports.getBookmarks = (book_idx, mem_id) => {

  return new Promise((resolve, reject) => {
    const sql = `
      SELECT book_mark
      FROM book_reading
      WHERE book_idx = ? AND mem_id = ? AND book_text IS NOT NULL
      ORDER BY book_latest ASC
    `;

    conn.query(sql, [book_idx, mem_id], (err, results) => {
      if (err) {
        console.error('북마크를 가져오는 중 오류 발생:', err);
        reject(new Error('북마크를 가져오는 중 오류가 발생했습니다.'));
        return;
      }

      resolve(results.length > 0 ? results : []); // 결과가 비어 있는 경우 빈 배열 반환F
    });
  });
};
