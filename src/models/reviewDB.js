const db = require('../config/database');

// 사용자가 작성한 리뷰와 도서 정보를 가져오는 함수
exports.getUserReviewsWithBooks = async (mem_id) => {
  try {
    const query = `
        SELECT *
        FROM book_end
        WHERE mem_id = ? AND book_score IS NOT NULL AND book_review IS NOT NULL
    `;
    const [results] = await db.query(query, [mem_id]);
    return results;
  } catch (err) {
    console.error('리뷰와 도서 정보를 가져오는 중 오류 발생:', err);
    throw err;
  }
};

// 리뷰 삭제 기능
exports.deleteReview = async (reviewId, mem_id) => {
  const connection = await db.getConnection(); // 트랜잭션을 위한 연결 생성
  try {
    await connection.beginTransaction();

    // 먼저 해당 리뷰의 book_score과 book_review가 null이 아닌지 확인
    const checkReviewQuery = `SELECT book_score, book_review FROM book_end WHERE end_idx = ?`;
    const [results] = await connection.query(checkReviewQuery, [reviewId]);

    const review = results[0];
    if (!review.book_score && !review.book_review) {
      await connection.release();
      return { message: '리뷰가 이미 삭제되었습니다.' };
    }

    // 리뷰 정보 업데이트
    const updateReviewQuery = `UPDATE book_end SET book_score = NULL, book_review = NULL WHERE end_idx = ?`;
    await connection.query(updateReviewQuery, [reviewId]);

    // 포인트 차감
    const updatePointsQuery = `UPDATE member SET mem_point = mem_point - 15 WHERE mem_id = ?`;
    await connection.query(updatePointsQuery, [mem_id]);

    await connection.commit(); // 트랜잭션 커밋
    return { message: '리뷰가 성공적으로 삭제되고 포인트가 차감되었습니다.' };
  } catch (err) {
    await connection.rollback(); // 오류 발생 시 롤백
    console.error('리뷰 삭제 중 오류 발생:', err);
    throw err;
  } finally {
    await connection.release(); // 연결 반환
  }
};

// 리뷰 데이터 삽입
exports.addReview = async (data) => {
  try {
    const sql = `
      UPDATE book_end
      SET book_score = ?, book_review = ?
      WHERE mem_id = ? AND book_idx = ?
    `;
    const [result] = await db.query(sql, [data.book_score, data.book_review, data.mem_id, data.book_idx]);

    if (result.affectedRows === 0) {
      return { message: '해당 도서에 대한 리뷰가 존재하지 않습니다.' };
    } else {
      return { message: '리뷰가 성공적으로 업데이트되었습니다.' };
    }
  } catch (err) {
    console.error('리뷰 데이터 삽입 중 오류 발생:', err);
    throw err;
  }
};

// 기존 리뷰가 있는지 확인하는 함수
exports.getExistingReview = async (mem_id, book_idx) => {
  try {
    const query = `
      SELECT book_score, book_review
      FROM book_end
      WHERE mem_id = ? AND book_idx = ?
    `;
    const [results] = await db.query(query, [mem_id, book_idx]);

    return results[0]; // 결과가 있으면 첫 번째 항목을 반환
  } catch (err) {
    console.error('기존 리뷰 확인 중 오류 발생:', err);
    throw err;
  }
};

// 포인트 업데이트
exports.updateMemberPoints = async (mem_id, points) => {
  try {
    const sql = `UPDATE member SET mem_point = mem_point + ? WHERE mem_id = ?`;
    const [result] = await db.query(sql, [points, mem_id]);
    return result;
  } catch (err) {
    console.error('포인트 업데이트 중 오류 발생:', err);
    throw err;
  }
};
