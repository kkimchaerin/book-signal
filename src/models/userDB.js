const db = require('../config/database'); // 데이터베이스 연결 설정

// 회원가입
exports.join = (data) => {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO member (mem_id, mem_pw, mem_name, mem_nick, mem_birth, mem_mail, mem_point, enroll_at) 
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
      [data.mem_id, data.mem_pw, data.mem_name, data.mem_nick, data.mem_birth, data.mem_mail],
      (err, result) => {
        if (err) {
          console.error('Database Error:', err);
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

// 회원 세팅 테이블 자동 생성
exports.createUserSetting = (mem_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO setting (mem_id, font, font_size, dark) VALUES (?, NULL, '16', 'light')`,
      [mem_id],
      (err, result) => {
        if (err) {
          console.error('Database Error:', err);
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

// 사용자 정보 조회
exports.getUser = (mem_id) => {
  return new Promise((resolve, reject) => {
    db.query(`SELECT * FROM member WHERE mem_id = ?`, [mem_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// 이메일 중복체크
exports.getUserByEmail = (mem_email) => {
  return new Promise((resolve, reject) => {
    db.query(`SELECT * FROM member WHERE mem_mail = ?`, [mem_email], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// 닉네임 중복체크
exports.getUserByNick = (mem_nick) => {
  return new Promise((resolve, reject) => {
    db.query(`SELECT * FROM member WHERE mem_nick = ?`, [mem_nick], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// 아이디 중복체크
exports.getUserId = (mem_id) => {
  return new Promise((resolve, reject) => {
    db.query(`SELECT * FROM member WHERE mem_id = ?`, [mem_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// 아이디 찾기 (이메일, 이름)
exports.getUserByEmailAndName = (mem_email, mem_name) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT mem_id FROM member WHERE mem_mail = ? AND mem_name = ?`,
      [mem_email, mem_name],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

// 회원탈퇴 - 연관된 데이터 삭제
exports.deleteRelatedData = (mem_id) => {
  return new Promise((resolve, reject) => {
    const queries = [
      `DELETE FROM book_end WHERE mem_id = ?`,
      `DELETE FROM book_extract_data WHERE mem_id = ?`,
      `DELETE FROM book_eyegaze WHERE mem_id = ?`,
      `DELETE FROM book_reading WHERE mem_id = ?`,
      `DELETE FROM book_wishlist WHERE mem_id = ?`,
      `DELETE FROM setting WHERE mem_id = ?`
    ];

    Promise.all(
      queries.map((query) => {
        return new Promise((resolve, reject) => {
          db.query(query, [mem_id], (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        });
      })
    )
      .then(() => resolve())
      .catch((err) => {
        console.error('관련 데이터 삭제 중 오류 발생:', err);
        reject(err);
      });
  });
};

// 사용자 삭제
exports.deleteUser = (mem_id) => {
  return new Promise((resolve, reject) => {
    db.query(`DELETE FROM member WHERE mem_id = ?`, [mem_id], (err, result) => {
      if (err) {
        console.error('사용자 삭제 중 오류 발생:', err);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// 비밀번호 찾기 (이메일, 아이디)
exports.getUserByEmailAndId = (mem_email, mem_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM member WHERE mem_mail = ? AND mem_id = ?`,
      [mem_email, mem_id],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

// 비밀번호 업데이트 함수
exports.updatePassword = (mem_id, newPw) => {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE member SET mem_pw = ? WHERE mem_id = ?`,
      [newPw, mem_id],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

// 찜한 도서를 가져오는 함수
exports.getWishlistBooks = (mem_id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT book_db.*
      FROM book_wishlist
      JOIN book_db ON book_wishlist.book_idx = book_db.book_idx
      WHERE book_wishlist.mem_id = ?;
    `;

    db.query(sql, [mem_id], (err, results) => {
      if (err) {
        console.error('찜한 도서 가져오기 에러:', err);
        reject(new Error('찜한 도서를 가져오는 중 오류가 발생했습니다.'));
      } else {
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
      }
    });
  });
};


// 최근 읽은 도서 가져오기
exports.getRecentBooks = (mem_id) => {
  return new Promise((resolve, reject) => {
    const query = `
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
    `;

    db.query(query, [mem_id], (err, results) => {
      if (err) {
        console.error('Error fetching recent books:', err);
        reject(err);
      } else {
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
      }
    });
  });
};

// 완독 도서를 가져오는 함수
exports.getCompletedBooks = (mem_id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT book_db.*
      FROM book_end
      JOIN book_db ON book_end.book_idx = book_db.book_idx
      WHERE book_end.mem_id = ?;
    `;

    db.query(sql, [mem_id], (err, results) => {
      if (err) {
        console.error('완독 도서 가져오기 에러:', err);
        reject(new Error('완독 도서를 가져오는 중 오류가 발생했습니다.'));
      } else {
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
      }
    });
  });
};

// 시그널 도서를 가져오는 함수
exports.getSignalBooks = (mem_id) => {
  return new Promise((resolve, reject) => {
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

    db.query(query, [mem_id], (err, results) => {
      if (err) {
        console.error('북 시그널 도서를 가져오는 중 오류 발생:', err);
        reject(new Error('북 시그널 도서를 가져오는 중 오류가 발생했습니다.'));
      } else {
        resolve(results);
      }
    });
  });
};

// 독서 기록을 추가하는 함수
exports.addReadingRecord = (mem_id, book_name) => {
  return new Promise((resolve, reject) => {
    const getBookIdxQuery = `
      SELECT book_idx FROM book_db WHERE book_name = ?;
    `;

    db.query(getBookIdxQuery, [book_name], (err, results) => {
      if (err) {
        console.error('book_idx 가져오기 에러:', err);
        reject(err);
      } else if (results.length === 0) {
        reject(new Error('해당 책을 찾을 수 없습니다.'));
      } else {
        const book_idx = results[0].book_idx;

        // book_reading 테이블에 조회 기록 추가 및 book_views 증가
        exports.incrementBookViews(mem_id, book_idx)
          .then(resolve)
          .catch(reject);
      }
    });
  });
};

// 책 조회수 증가 및 로그 기록
exports.incrementBookViews = (mem_id, book_idx) => {
  return new Promise((resolve, reject) => {
    const checkIfViewedQuery = `
      SELECT COUNT(*) AS count 
      FROM book_reading 
      WHERE mem_id = ? AND book_idx = ?
    `;

    db.query(checkIfViewedQuery, [mem_id, book_idx], (err, results) => {
      if (err) {
        console.error('책 조회 확인 중 오류 발생:', err);
        reject(new Error('책 조회 확인에 실패했습니다.'));
        return;
      }

      const hasViewed = results[0].count > 0;

      const incrementViewsQuery = hasViewed
        ? Promise.resolve()
        : new Promise((resolve, reject) => {
          const updateViewsQuery = `
              UPDATE book_db 
              SET book_views = book_views + 1 
              WHERE book_idx = ?
            `;

          db.query(updateViewsQuery, [book_idx], (err) => {
            if (err) {
              console.error('책 조회수 증가 중 오류 발생:', err);
              reject(new Error('책 조회수 증가에 실패했습니다.'));
            } else {
              resolve();
            }
          });
        });

      incrementViewsQuery
        .then(() => {
          const logViewQuery = `
            INSERT INTO book_reading (mem_id, book_idx, book_name, book_summ, book_latest, book_rp, book_mark)
            VALUES (?, ?, (SELECT book_name FROM book_db WHERE book_idx = ?), '', NOW(), 1, 1)
          `;

          db.query(logViewQuery, [mem_id, book_idx, book_idx], (err) => {
            if (err) {
              console.error('책 조회 로그 기록 중 오류 발생:', err);
              reject(new Error('책 조회 로그 기록에 실패했습니다.'));
            } else {
              resolve();
            }
          });
        })
        .catch(reject);
    });
  });
};
