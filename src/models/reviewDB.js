const db = require('../config/database');

// 사용자가 작성한 리뷰와 도서 정보를 가져오는 함수
exports.getUserReviewsWithBooks = (mem_id) => {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT *
        FROM book_end
        WHERE mem_id = ? AND book_score IS NOT NULL AND book_review IS NOT NULL
    `;

    db.query(query, [mem_id], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
};


// 리뷰 삭제 기능
exports.deleteReview = (reviewId, mem_id) => {
  return new Promise((resolve, reject) => {
    // 먼저 해당 리뷰의 book_score과 book_review가 null이 아닌지 확인
    const checkReviewQuery = `SELECT book_score, book_review FROM book_end WHERE end_idx = ?`;

    db.query(checkReviewQuery, [reviewId], (err, results) => {
      if (err) {
        return reject(err);
      }

      const review = results[0];
      if (!review.book_score && !review.book_review) {
        return resolve({ message: '리뷰가 이미 삭제되었습니다.' });
      }

      const updateReviewQuery = `UPDATE book_end SET book_score = NULL, book_review = NULL WHERE end_idx = ?`;

      // 트랜잭션 시작
      db.beginTransaction((transactionErr) => {
        if (transactionErr) {
          return reject(transactionErr);
        }

        // 리뷰 정보 업데이트
        db.query(updateReviewQuery, [reviewId], (err, results) => {
          if (err) {
            return db.rollback(() => reject(err)); // 오류 발생 시 롤백
          }

          // 포인트 차감
          const updatePointsQuery = `UPDATE member SET mem_point = mem_point - 15 WHERE mem_id = ?`;

          db.query(updatePointsQuery, [mem_id], (updateErr, updateResults) => {
            if (updateErr) {
              return db.rollback(() => reject(updateErr)); // 오류 발생 시 롤백
            }

            // 트랜잭션 커밋
            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() => reject(commitErr)); // 커밋 오류 발생 시 롤백
              }

              resolve(updateResults); // 모든 작업이 성공적으로 완료됨
            });
          });
        });
      });
    });
  });
};

// 리뷰 데이터 삽입
exports.addReview = (data) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE book_end
      SET book_score = ?, book_review = ?
      WHERE mem_id = ? AND book_idx = ?
    `;
    db.query(sql, [data.book_score, data.book_review, data.mem_id, data.book_idx], (err, result) => {
      if (err) {
        reject(err); // 오류 발생 시 reject 호출
      } else if (result.affectedRows === 0) {
        // 조건에 맞는 행이 없어서 업데이트되지 않은 경우
        resolve({ message: '해당 도서에 대한 리뷰가 존재하지 않습니다.' });
      } else {
        resolve({ message: '리뷰가 성공적으로 업데이트되었습니다.' });
      }
    });
  });
};

// 기존 리뷰가 있는지 확인하는 함수
exports.getExistingReview = (mem_id, book_idx) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT book_score, book_review
      FROM book_end
      WHERE mem_id = ? AND book_idx = ?
    `;
    db.query(query, [mem_id, book_idx], (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results[0]); // 결과가 있으면 첫 번째 항목을 반환
    });
  });
};


// 포인트 업데이트
exports.updateMemberPoints = (mem_id, points) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE member SET mem_point = mem_point + ? WHERE mem_id = ?`;
    db.query(sql, [points, mem_id], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

