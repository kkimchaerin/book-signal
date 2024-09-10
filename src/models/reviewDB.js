const db = require('../config/database');

// 사용자가 작성한 리뷰와 도서 정보를 가져오는 함수
exports.getUserReviewsWithBooks = async (mem_id) => {
  try {
    const query = `
  SELECT book_end.*, book_db.book_cover,book_db.book_idx
  FROM book_end 
  JOIN book_db ON book_end.book_idx = book_db.book_idx 
  WHERE book_end.mem_id = ?;
      `;
    const [results] = await db.query(query, [mem_id]);
    return results;
  } catch (err) {
    throw err;
  }
};

// 특정 책의 리뷰를 가져오는 함수
exports.getReviewsByBookId = async (book_idx) => {
  try {
    const query = `
      SELECT book_end.*, member.mem_nick 
      FROM book_end
      JOIN member ON book_end.mem_id = member.mem_id 
      WHERE book_end.book_idx = ?;
    `;
    const [results] = await db.query(query, [book_idx]); 

    return results;
  } catch (err) {
    console.error('리뷰를 가져오는 중 오류 발생:', err);
    throw err;
  }
};

// 리뷰 삭제 기능
exports.deleteReview = async (reviewId, mem_id) => {

  const checkReviewQuery = `SELECT book_score, book_review,book_idx FROM book_end WHERE end_idx = ?`;
  const updateReviewQuery = `UPDATE book_end SET book_score = NULL, book_review = NULL WHERE end_idx = ?`;
  const updatePointsQuery = `UPDATE member SET mem_point = mem_point - 15 WHERE mem_id = ?`;

  let connection;

  try {
    // 연결 가져오기
    connection = await db.getConnection();

    // 트랜잭션 시작
    await connection.beginTransaction();

    // 먼저 해당 리뷰의 book_score과 book_review가 null이 아닌지 확인
    const [reviewResults] = await connection.query(checkReviewQuery, [reviewId]);
    const review = reviewResults[0];

    if (!review.book_score && !review.book_review) {
      return { message: '리뷰가 이미 삭제되었습니다.' };
    }

    const book_idx = review.book_idx; // book_idx 저장
    // 리뷰 정보 업데이트
    await connection.query(updateReviewQuery, [reviewId]);

    // 포인트 차감
    await connection.query(updatePointsQuery, [mem_id]);

    // 트랜잭션 커밋
    await connection.commit();


    // book_idx 반환
    return { message: '리뷰 삭제 및 포인트 차감이 성공적으로 완료되었습니다.', book_idx: review.book_idx };
  } catch (err) {
    if (connection) await connection.rollback(); // 오류 발생 시 롤백
    throw err;
  } finally {
    if (connection) connection.release(); // 연결 해제
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
    throw err;
  }
};

// 기존 리뷰가 있는지 확인하는 함수
exports.getExistingReview = async (mem_id, book_idx) => {
  try {
    console.log('getExistingReview 호출됨 - mem_id:', mem_id, 'book_idx:', book_idx); // 전달된 파라미터 확인

    const query = `
      SELECT book_score, book_review
      FROM book_end
      WHERE mem_id = ? AND book_idx = ?
    `;

    console.log('실행할 SQL 쿼리:', query); // 실행할 SQL 쿼리 확인
    const [results] = await db.query(query, [mem_id, book_idx]);

    console.log('쿼리 결과:', results); // 쿼리 결과 확인

    return results[0]; // 결과 반환
  } catch (err) {
    console.error('쿼리 실행 중 오류 발생:', err);
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
    throw err;
  }
};

// 도서의 평균 평점을 계산하는 함수
exports.calculateAverageRating = async (book_idx) => {
  try {
    console.log('Calculating average rating for book_idx:', book_idx);
    const query = `
        SELECT ROUND(AVG(book_score), 1) AS average_rating  -- 소수점 첫째 자리까지 반올림
        FROM book_end
        WHERE book_idx = ? AND book_score IS NOT NULL
      `;
    const [results] = await db.query(query, [book_idx]);
    console.log('Calculated average rating:', results[0].average_rating);
    return results[0].average_rating || 0; // 평균값이 없을 경우 0 반환
  } catch (err) {
    console.error('Error calculating average rating:', err);
    throw err;
  }
};

// 도서의 평균 평점을 업데이트하는 함수
exports.updateAverageRating = async (book_idx, averageRating) => {
  try {
    console.log('Updating average rating for book_idx:', book_idx, 'with new average:', averageRating);

    const updateQuery = `
        UPDATE book_db 
        SET book_avg = ROUND(?, 1)  -- 소수점 첫째 자리까지 반올림
        WHERE book_idx = ?
      `;

    await db.query(updateQuery, [averageRating, book_idx]);
    console.log('Average rating updated in book_db.');
  } catch (err) {
    console.error('Error updating average rating in book_db:', err);
    throw err;
  }
};

// 리뷰 존재 여부 확인 함수
exports.checkReviewExists = async (req, res) => {
  console.log('checkReviewExists 함수 호출됨'); // 함수가 호출되는지 확인

  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  // 클라이언트에서 전달된 파라미터 확인
  const { mem_id, book_idx } = req.query;
  console.log('mem_id:', mem_id); // mem_id 확인
  console.log('book_idx:', book_idx); // book_idx 확인

  try {
    // SQL 쿼리: 리뷰가 존재하는지 확인하는 쿼리에서 score나 review가 null이 아닌지 확인
    const query = `
      SELECT book_score, book_review 
      FROM book_end 
      WHERE mem_id = ? AND book_idx = ? AND (book_score IS NOT NULL OR book_review IS NOT NULL)
    `;

    const [results] = await db.query(query, [mem_id, book_idx]);

    // 리뷰가 존재하면 true, 존재하지 않으면 false 반환
    const reviewExists = results.length > 0;
    res.status(200).json({ reviewExists });

  } catch (error) {
    console.error('리뷰 존재 여부 확인 중 오류 발생:', error);
    res.status(500).json({ message: '리뷰 확인 중 오류가 발생했습니다.' });
  }
};





