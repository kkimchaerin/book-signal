const db = require('../config/database'); // 이미 promise 기반으로 설정된 database.js 모듈을 사용

// 회원가입
exports.join = async (data) => {
  try {
    const [result] = await db.query(
      `INSERT INTO member (mem_id, mem_pw, mem_name, mem_nick, mem_birth, mem_mail, mem_point, enroll_at) 
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
      [data.mem_id, data.mem_pw, data.mem_name, data.mem_nick, data.mem_birth, data.mem_mail]
    );
    return result;
  } catch (err) {
    console.error('Database Error:', err);
    throw err;
  }
};

// 회원 세팅 테이블 자동 생성
exports.createUserSetting = async (mem_id) => {
  try {
    const [result] = await db.query(
      `INSERT INTO setting (mem_id, font, font_size, dark) VALUES (?, NULL, '16', 'light')`,
      [mem_id]
    );
    return result;
  } catch (err) {
    console.error('Database Error:', err);
    throw err;
  }
};

// 사용자 정보 조회
exports.getUser = async (mem_id) => {
  try {
    const [rows] = await db.query(`SELECT * FROM member WHERE mem_id = ?`, [mem_id]);
    return rows;
  } catch (err) {
    throw err;
  }
};

// 이메일 중복체크
exports.getUserByEmail = async (mem_email) => {
  try {
    const [rows] = await db.query(`SELECT * FROM member WHERE mem_mail = ?`, [mem_email]);
    return rows;
  } catch (err) {
    throw err;
  }
};

// 닉네임 중복체크
exports.getUserByNick = async (mem_nick) => {
  try {
    const [rows] = await db.query(`SELECT * FROM member WHERE mem_nick = ?`, [mem_nick]);
    return rows;
  } catch (err) {
    throw err;
  }
};

// 아이디 중복체크
exports.getUserId = async (mem_id) => {
  try {
    const [rows] = await db.query(`SELECT * FROM member WHERE mem_id = ?`, [mem_id]);
    return rows;
  } catch (err) {
    throw err;
  }
};

// 아이디 찾기 (이메일, 이름)
exports.getUserByEmailAndName = async (mem_email, mem_name) => {
  try {
    const [rows] = await db.query(
      `SELECT mem_id FROM member WHERE mem_mail = ? AND mem_name = ?`,
      [mem_email, mem_name]
    );
    return rows;
  } catch (err) {
    throw err;
  }
};

// 회원탈퇴 - 연관된 데이터 삭제
exports.deleteRelatedData = async (mem_id) => {
  const queries = [
    `DELETE FROM book_end WHERE mem_id = ?`,
    `DELETE FROM book_extract_data WHERE mem_id = ?`,
    `DELETE FROM book_eyegaze WHERE mem_id = ?`,
    `DELETE FROM book_reading WHERE mem_id = ?`,
    `DELETE FROM book_wishlist WHERE mem_id = ?`,
    `DELETE FROM setting WHERE mem_id = ?`
  ];

  try {
    for (const query of queries) {
      await db.query(query, [mem_id]);
    }
  } catch (err) {
    console.error('관련 데이터 삭제 중 오류 발생:', err);
    throw err;
  }
};

// 사용자 삭제
exports.deleteUser = async (mem_id) => {
  try {
    const [result] = await db.query(`DELETE FROM member WHERE mem_id = ?`, [mem_id]);
    return result;
  } catch (err) {
    console.error('사용자 삭제 중 오류 발생:', err);
    throw err;
  }
};

// 비밀번호 찾기 (이메일, 아이디)
exports.getUserByEmailAndId = async (mem_email, mem_id) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM member WHERE mem_mail = ? AND mem_id = ?`,
      [mem_email, mem_id]
    );
    return rows;
  } catch (err) {
    throw err;
  }
};

// 비밀번호 업데이트 함수
exports.updatePassword = async (mem_id, newPw) => {
  try {
    const [result] = await db.query(
      `UPDATE member SET mem_pw = ? WHERE mem_id = ?`,
      [newPw, mem_id]
    );
    return result;
  } catch (err) {
    throw err;
  }
};

// 찜한 도서를 가져오는 함수
exports.getWishlistBooks = async (mem_id) => {
  try {
    const [rows] = await db.query(`
      SELECT book_db.*
      FROM book_wishlist
      JOIN book_db ON book_wishlist.book_idx = book_db.book_idx
      WHERE book_wishlist.mem_id = ?;
    `, [mem_id]);

    const updatedResults = rows.map(book => {
      book.book_cover = decodeURIComponent(book.book_cover);
      if (book.book_cover) {
        book.book_cover = `/images/${book.book_cover}`;
      } else {
        book.book_cover = '/images/default.jpg';
      }
      return book;
    });
    return updatedResults;
  } catch (err) {
    console.error('찜한 도서 가져오기 에러:', err);
    throw new Error('찜한 도서를 가져오는 중 오류가 발생했습니다.');
  }
};

// 최근 읽은 도서 가져오기
exports.getRecentBooks = async (mem_id) => {
  try {
    const [rows] = await db.query(`
      SELECT 
          book_db.*,
          MAX(book_reading.book_latest) AS book_latest
      FROM 
          book_reading 
      JOIN 
          book_db 
      ON 
          book_reading.book_idx = book_db.book_idx
      WHERE 
          book_reading.mem_id = ?
      GROUP BY 
          book_db.book_idx
      ORDER BY 
          book_latest DESC
    `, [mem_id]);

    const updatedResults = rows.map(book => {
      book.book_cover = decodeURIComponent(book.book_cover);
      if (book.book_cover) {
        book.book_cover = `/images/${book.book_cover}`;
      } else {
        book.book_cover = '/images/default.jpg';
      }
      return book;
    });
    return updatedResults;
  } catch (err) {
    console.error('Error fetching recent books:', err);
    throw err;
  }
};

// 완독 도서를 가져오는 함수
exports.getCompletedBooks = async (mem_id) => {
  try {
    const [rows] = await db.query(`
      SELECT book_db.*
      FROM book_end
      JOIN book_db ON book_end.book_idx = book_db.book_idx
      WHERE book_end.mem_id = ?;
    `, [mem_id]);

    const updatedResults = rows.map(book => {
      book.book_cover = decodeURIComponent(book.book_cover);
      if (book.book_cover) {
        book.book_cover = `/images/${book.book_cover}`;
      } else {
        book.book_cover = '/images/default.jpg';
      }
      return book;
    });
    return updatedResults;
  } catch (err) {
    console.error('완독 도서 가져오기 에러:', err);
    throw new Error('완독 도서를 가져오는 중 오류가 발생했습니다.');
  }
};

// 독서 기록을 추가하는 함수
exports.addReadingRecord = async (mem_id, book_name) => {
  try {
    const [rows] = await db.query(`
      SELECT book_idx FROM book_db WHERE book_name = ?;
    `, [book_name]);

    if (rows.length === 0) {
      throw new Error('해당 책을 찾을 수 없습니다.');
    }

    const book_idx = rows[0].book_idx;
    await exports.incrementBookViews(mem_id, book_idx);
  } catch (err) {
    console.error('book_idx 가져오기 에러:', err);
    throw err;
  }
};

// 독서 기록을 추가하는 함수
exports.addReadingRecord = async (mem_id, book_name) => {
  try {
    const getBookIdxQuery = `SELECT book_idx FROM book_db WHERE book_name = ?;`;
    const [results] = await db.query(getBookIdxQuery, [book_name]);

    if (results.length === 0) {
      throw new Error('해당 책을 찾을 수 없습니다.');
    }

    const book_idx = results[0].book_idx;

    // book_reading 테이블에 조회 기록 추가 및 book_views 증가
    await exports.incrementBookViews(mem_id, book_idx);
  } catch (err) {
    console.error('독서 기록 추가 중 오류 발생:', err);
    throw err;
  }
};

// 책 조회수 증가 및 로그 기록
exports.incrementBookViews = async (mem_id, book_idx) => {
  try {
    const [rows] = await db.query(`
      SELECT COUNT(*) AS count 
      FROM book_reading 
      WHERE mem_id = ? AND book_idx = ?
    `, [mem_id, book_idx]);

    const hasViewed = rows[0].count > 0;

    if (!hasViewed) {
      await db.query(`
        UPDATE book_db 
        SET book_views = book_views + 1 
        WHERE book_idx = ?
      `, [book_idx]);
    }

    await db.query(`
      INSERT INTO book_reading (mem_id, book_idx, book_name, book_summ, book_latest, book_rp, book_mark)
      VALUES (?, ?, (SELECT book_name FROM book_db WHERE book_idx = ?), '', NOW(), 1, 1)
    `, [mem_id, book_idx, book_idx]);

  } catch (err) {
    console.error('책 조회 로그 기록 중 오류 발생:', err);
    throw new Error('책 조회 로그 기록에 실패했습니다.');
  }
};

// 시그널 도서를 가져오는 함수
exports.getSignalBooks = async (mem_id) => {
  try {
    const query = `
      SELECT *
      FROM book_extract_data AS b1
      WHERE b1.mem_id = ?
      AND b1.saved_at = (
        SELECT MAX(b2.saved_at)
        FROM book_extract_data AS b2
        WHERE b2.book_name = b1.book_name
        AND b2.mem_id = b1.mem_id
      )
      ORDER BY b1.saved_at DESC;
    `;

    const [results] = await db.query(query, [mem_id]);
    return results;
  } catch (err) {
    console.error('북 시그널 도서를 가져오는 중 오류 발생:', err);
    throw new Error('북 시그널 도서를 가져오는 중 오류가 발생했습니다.');
  }
};

// 업로드한 도서를 가져오는 함수
exports.getUploadBooks = async (mem_id) => {
  try {
    const [rows] = await db.query(`
      SELECT *
      FROM book_upload
      WHERE mem_id = ?;
    `, [mem_id]);

    const updatedResults = rows.map(book => {
      // null이나 undefined 또는 빈 문자열일 경우 기본 이미지 경로 설정
      if (!book.book_cover) {
        book.book_cover = '/images/default.png';
      } else {
        book.book_cover = `/images/${book.book_cover}`;  // book_cover가 존재하면 경로 추가
      }
      return book;
    });

    return updatedResults;
  } catch (err) {
    console.error('업로드한 도서 가져오기 에러:', err);
    throw new Error('업로드한 도서를 가져오는 중 오류가 발생했습니다.');
  }
};



