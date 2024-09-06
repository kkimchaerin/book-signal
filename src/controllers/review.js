const reviewDB = require('../models/reviewDB');

// 리뷰 불러오기
exports.getUserReviews = async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const mem_id = req.session.user.mem_id;

    const reviews = await reviewDB.getUserReviewsWithBooks(mem_id);

    if (reviews.length > 0) {
      res.status(200).json(reviews);
    } else {
      res.status(404).json({ message: '작성된 리뷰가 없습니다.' });
    }
  } catch (err) {
    console.error('리뷰 데이터를 가져오는 중 오류 발생:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};


exports.deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const { mem_id,book_idx } = req.body; // 요청 바디에서 mem_id 가져오기

  try {
    const result = await reviewDB.deleteReview(reviewId, mem_id);

    if (result.message === '리뷰가 이미 삭제되었습니다.') {
      return res.status(400).json({ message: '이미 삭제된 리뷰입니다.' });
    }
    const book_idx = result.book_idx; // 반환된 book_idx를 사용

    if (!book_idx) {
      console.error('Book index not found after deletion.');
      return res.status(500).json({ message: 'Book index not found after deletion.' });
    }

    console.log('Recalculating average rating after deletion...');
    
    // 평균 평점 재계산 및 업데이트
    const newAverage = await reviewDB.calculateAverageRating(book_idx);
    await reviewDB.updateAverageRating(book_idx, newAverage); // 평균 평점을 book_db에 업데이트
    console.log('Average rating updated successfully after deletion.');
    
    res.status(200).json({ message: '리뷰가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('리뷰 삭제 중 오류 발생:', error);
    res.status(500).json({ message: '리뷰 삭제에 실패했습니다.' });
  }
};



// 리뷰 등록
exports.addReview = async (req, res) => {
  const { mem_id, book_idx, book_name, book_score, book_review } = req.body;

  if (!mem_id || !book_idx || !book_name || !book_score || !book_review) {
    console.log('필수 정보가 누락되었습니다.');
    return res.status(400).json({ message: '필수 정보가 누락되었습니다.' });
  }

  try {
    // 기존 리뷰 확인
    const existingReview = await reviewDB.getExistingReview(mem_id, book_idx);
    const isNewReview = !existingReview || (!existingReview.book_score && !existingReview.book_review);

    const result = await reviewDB.addReview({
      mem_id,
      book_idx,
      book_score,
      book_review,
    });

    if (result.message === '해당 도서에 대한 리뷰가 존재하지 않습니다.') {
      return res.status(404).json({ message: result.message });
    }

    // 기존에 리뷰가 없거나, 리뷰가 있지만 점수나 리뷰 내용이 없는 경우에만 포인트 추가
    let message = '리뷰가 성공적으로 업데이트되었습니다. (포인트는 추가되지 않았습니다.)';
    if (isNewReview) {
      await reviewDB.updateMemberPoints(mem_id, 15);
      message = '리뷰 등록 성공, 포인트가 15점 추가되었습니다.';
    }

    // 리뷰 등록 또는 업데이트 후 평균 평점 재계산
    console.log('Calculating new average rating...');
    const newAverage = await reviewDB.calculateAverageRating(book_idx);
    console.log('New average rating:', newAverage);

    await reviewDB.updateAverageRating(book_idx, newAverage); // 평균 평점을 book_db에 업데이트
    console.log('Average rating updated successfully.');

    // 최종적으로 한 번만 응답을 전송
    return res.status(200).json({ message: '리뷰와 평균 평점이 성공적으로 업데이트되었습니다.', newAverage });

  } catch (err) {
    console.error('리뷰 등록 중 오류:', err);
    return res.status(500).json({ message: '리뷰 등록에 실패했습니다.' });
  }
};
