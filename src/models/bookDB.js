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
exports.popularBooksMain = async () => {
  return getBooks('book_views DESC', 6);
};

// 메인 평점 top6
exports.bestBooksMain = async () => {
  return getBooks('book_avg DESC', 6);
};

// 메인 신작 top6
exports.newBooksMain = async () => {
  return getBooks('book_published_at DESC', 6);
};

// 인기 랭킹 도서 목록
exports.popularBooks = async () => {
  return getBooks('book_views DESC');
};

// 평점 베스트 도서 목록
exports.bestBooks = async () => {
  return getBooks('book_avg DESC');
};

// 신작 도서 목록
exports.newBooks = async () => {
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
    throw new Error('관련 도서 목록을 가져오는 중 오류가 발생했습니다.');
  }
};

// 사용자가 이미 찜한 도서인지 확인
exports.checkWishlist = async (mem_id, book_idx) => {
  try {
    const sql = `SELECT COUNT(*) AS count FROM book_wishlist WHERE mem_id = ? AND book_idx = ?`;
    const [results] = await conn.query(sql, [mem_id, book_idx]);

    return results[0].count > 0;
  } catch (err) {
    console.error('찜한 도서 여부 확인 에러:', err);
    throw new Error('찜한 도서 여부 확인에 실패했습니다.');
  }
};

// 도서 찜하기 추가
exports.addWishlist = async (mem_id, book_idx) => {
  try {
    const sql = `INSERT INTO book_wishlist (mem_id, book_idx) VALUES (?, ?)`;
    const [result] = await conn.query(sql, [mem_id, book_idx]);

    return { message: '도서가 찜 목록에 추가되었습니다.' };
  } catch (err) {
    console.error('도서 찜하기 에러:', err);
    throw new Error('도서 찜하기에 실패했습니다.');
  }
};

// 찜한 도서 제거
exports.removeWishlist = async (mem_id, book_idx) => {
  try {
    const sql = `DELETE FROM book_wishlist WHERE mem_id = ? AND book_idx = ?`;
    const [result] = await conn.query(sql, [mem_id, book_idx]);

    return { message: '도서가 찜 목록에서 제거되었습니다.' };
  } catch (err) {
    console.error('찜한 도서 제거 에러:', err);
    throw new Error('찜한 도서 제거에 실패했습니다.');
  }
};

/******************** 시선 추적 시간 저장 ********************/
exports.saveGazeTime = (book_idx, mem_id, book_text, book_mark, gaze_duration) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO book_eyegaze (book_idx, mem_id, book_text, book_mark, gaze_duration, gaze_recorded_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    // const [result] = await conn.query(sql, [book_idx, mem_id, book_text, gaze_duration]);

    conn.query(sql, [book_idx, mem_id, book_text, book_mark, gaze_duration], (err, result) => {
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
exports.saveBookmark = async (book_name, book_idx, mem_id, cfi, page_text) => {
  try {
    const sql = `
      INSERT INTO book_reading (book_name, book_idx, mem_id, book_mark, book_text, book_latest)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    const [result] = await conn.query(sql, [book_name, book_idx, mem_id, cfi, page_text]);

    return { message: '북마크가 저장되었습니다.', bookmarkId: result.insertId };
  } catch (err) {
    console.error('북마크 저장 중 오류 발생:', err);
    throw new Error('북마크를 저장하는 중 오류가 발생했습니다.');
  }
};

// 사용자의 수동 북마크를 가져오는 함수
exports.getBookmarks = async (book_idx, mem_id) => {
  try {
    // book_reading 테이블에서 북마크 가져오기
    const sqlReading = `
      SELECT book_mark
      FROM book_reading
      WHERE book_idx = ? AND mem_id = ? AND book_text IS NOT NULL
      ORDER BY book_latest ASC
    `;
    const [readingResults] = await conn.query(sqlReading, [book_idx, mem_id]);

    // book_eyegaze 테이블에서 북마크 가져오기
    const sqlEyegaze = `
      SELECT book_mark
      FROM book_eyegaze
      WHERE book_idx = ? AND mem_id = ? AND book_text IS NOT NULL AND book_mark IS NOT NULL
      ORDER BY gaze_duration DESC
      LIMIT 1
    `;
    const [eyegazeResults] = await conn.query(sqlEyegaze, [book_idx, mem_id]);

    // 각 결과값을 배열에 담아 반환
    return {
      readingBookmarks: readingResults.length > 0 ? readingResults : [],
      eyegazeBookmark: eyegazeResults.length > 0 ? eyegazeResults[0] : null  // 이름을 통일하고 첫 번째 값을 반환
    };
  } catch (err) {
    console.error('북마크를 가져오는 중 오류 발생:', err);
    throw new Error('북마크를 가져오는 중 오류가 발생했습니다.');
  }
};


// 특정 사용자와 책의 북마크를 가져오는 함수
exports.getUserBookmarkForBook = async (book_idx, mem_id, isUploadBook, upload_idx) => {
  try {
    let bookmarkSql;
    let bookmarkParams;

    // 업로드 도서와 일반 도서에 따라 적절한 쿼리 설정
    if (isUploadBook) {
      bookmarkSql = `
        SELECT book_mark 
        FROM upload_reading 
        WHERE upload_idx = ? 
          AND mem_id = ? 
          AND book_mark IS NOT NULL 
        ORDER BY book_latest DESC 
        LIMIT 1
      `;
      bookmarkParams = [upload_idx, mem_id];
    } else {
      bookmarkSql = `
        SELECT book_mark 
        FROM book_reading 
        WHERE book_idx = ? 
          AND mem_id = ? 
          AND book_text IS NULL 
          AND book_mark LIKE 'epubcfi%' 
        ORDER BY book_latest DESC 
        LIMIT 1
      `;
      bookmarkParams = [book_idx, mem_id];
    }

    // 쿼리 실행
    const [bookmarkResults] = await conn.query(bookmarkSql, bookmarkParams);
    const bookmark = bookmarkResults.length > 0 ? bookmarkResults[0].book_mark : null;

    // 폰트 크기 쿼리
    const fontSizeSql = `
      SELECT font_size
      FROM setting
      WHERE mem_id = ?
    `;
    const [fontSizeResults] = await conn.query(fontSizeSql, [mem_id]);
    const fontSize = fontSizeResults.length > 0 ? fontSizeResults[0].font_size : null;

    // 북마크와 폰트 크기를 반환
    return { bookmark, fontSize };
  } catch (err) {
    console.error('북마크 또는 폰트 크기를 가져오는 중 오류 발생:', err);
    throw new Error('북마크 또는 폰트 크기를 가져오는 중 오류가 발생했습니다.');
  }
};

// 독서 종료 시 북마크 저장 함수
exports.saveEndReading = async (book_idx, mem_id, cfi, fontsize, isUploadBook, book_name, upload_idx) => {
  try {
    if (isUploadBook) {
      // 업로드된 도서일 경우 upload_reading 테이블에 북마크(cfi) 저장
      const saveUploadBookmarkSql = `
        INSERT INTO upload_reading (book_name, upload_idx, mem_id, book_mark, book_latest)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
          book_mark = VALUES(book_mark), 
          book_latest = NOW()
      `;
      const [uploadBookmarkResult] = await conn.query(saveUploadBookmarkSql, [book_name, upload_idx, mem_id, cfi]);

      if (uploadBookmarkResult.affectedRows === 0) {
        throw new Error('업로드된 도서의 북마크 저장에 실패했습니다.');
      }
    } else {
      // 일반 도서일 경우 book_reading 테이블에 북마크 저장
      const getBookNameSql = `
        SELECT book_name 
        FROM book_db 
        WHERE book_idx = ?
        LIMIT 1
      `;
      const [results] = await conn.query(getBookNameSql, [book_idx]);

      if (results.length === 0) {
        throw new Error('해당 book_idx에 대한 책을 찾을 수 없습니다.');
      }
      const book_name = results[0].book_name;

      const saveFontSizeSql = `
        UPDATE setting
        SET font_size = ?
        WHERE mem_id = ?
      `;
      const [fontSizeResult] = await conn.query(saveFontSizeSql, [fontsize, mem_id]);

      if (fontSizeResult.affectedRows === 0) {
        throw new Error('폰트 크기 업데이트에 실패했습니다.');
      }

      const saveBookmarkSql = `
        INSERT INTO book_reading (book_name, book_idx, mem_id, book_mark, book_latest)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
          book_mark = VALUES(book_mark), 
          book_latest = NOW()
      `;
      const [bookmarkResult] = await conn.query(saveBookmarkSql, [book_name, book_idx, mem_id, cfi]);

      if (bookmarkResult.affectedRows === 0) {
        throw new Error('북마크 저장에 실패했습니다.');
      }
    }

    return { message: '북마크와 폰트 크기가 성공적으로 저장되었습니다.' };
  } catch (err) {
    throw new Error('독서 종료 중 오류가 발생하여 저장에 실패했습니다.');
  }
};



// 북마크 삭제 함수
exports.removeBookmark = async (book_idx, mem_id, book_mark) => {
  try {
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
      throw new Error('삭제할 북마크를 찾지 못했습니다.'); // 북마크가 없는 경우 예외 처리
    }
  } catch (err) {
    console.error('북마크 삭제 중 오류 발생:', err);
    throw new Error('북마크 삭제에 실패했습니다.');
  }
};

// book_eyegaze 테이블에서 book_mark를 null로 설정하는 함수
exports.removeEyegazeBookmark = async (book_idx, mem_id) => {
  try {
    const sql = `
      UPDATE book_eyegaze
      SET book_mark = NULL
      WHERE book_idx = ? 
      AND mem_id = ?
    `;
    const [result] = await conn.query(sql, [book_idx, mem_id]);
    console.log(result);


    if (result.affectedRows > 0) {
      return { message: 'eyegaze 북마크가 삭제되었습니다.' };
    } else {
      throw new Error('eyegaze 북마크를 찾지 못했습니다.');
    }
  } catch (err) {
    console.error('eyegaze 북마크 삭제 중 오류 발생:', err);
    throw new Error('eyegaze 북마크 삭제에 실패했습니다.');
  }
};

// 업로드 책 경로 가져오기 함수 수정
exports.getBookUploadPath = async (upload_idx) => {
  try {
    // book_upload 테이블에서 book_path 가져오기
    const sql = `
      SELECT *
      FROM book_upload 
      WHERE upload_idx = ?
    `;
    const [results] = await conn.query(sql, [upload_idx]);
    const bookPath = results.length > 0 ? results[0].book_file_path : null;

    console.log(bookPath);

    // book_path 반환
    return bookPath;
  } catch (err) {
    console.error('업로드된 책의 경로를 가져오는 중 오류 발생:', err);
    throw new Error('업로드된 책의 경로를 가져오는 중 오류가 발생했습니다.');
  }
};

