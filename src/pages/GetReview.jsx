import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import Rating from 'react-rating-stars-component';
import axios from 'axios';
import '../css/getreview.css';

const GetReview = ({ book, onReviewSubmit }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);

  // Modal의 app element를 설정
  Modal.setAppElement('#root');

  // 컴포넌트가 마운트될 때 모달을 자동으로 열기
  useEffect(() => {
    setModalIsOpen(true);
  }, []);

  const closeModal = () => {
    setModalIsOpen(false);
    onReviewSubmit(); // 모달을 닫을 때 부모 컴포넌트에서 전달된 콜백 함수 호출 (예: 페이지 이동)
  };

  const handleSubmit = async () => {
    try {
      // 세션 정보에서 사용자 ID 가져오기
      const sessionResponse = await axios.get('http://localhost:3001/check-session', { withCredentials: true });
      const mem_id = sessionResponse.data.user.mem_id; // 세션에서 사용자 ID 가져오기

      await axios.post('http://localhost:3001/review', {
        mem_id, // 세션에서 가져온 사용자 ID
        book_idx: book.book_idx, // 부모 컴포넌트에서 전달된 책 정보
        book_name: book.book_name, // 부모 컴포넌트에서 전달된 책 정보
        book_score: rating,
        book_review: review,
      });

      alert('리뷰가 성공적으로 등록되었습니다.');
      closeModal(); // 리뷰 등록 후 모달 닫기
    } catch (error) {
      console.error('리뷰 등록 실패:', error);
      alert('리뷰 등록에 실패했습니다.');
    }
  };

  return (
    <div>
      {/* 모달 창 */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="리뷰와 별점 남기기"
        className="review-modal"
        overlayClassName="review-modal-overlay"
      >
        <button className="modal-close-button" onClick={closeModal}>X</button>
        <h2 className="modal-title">별점과 리뷰 작성하기</h2>
        <p className="book-title">{book.book_name}</p>

        {/* 별점 컴포넌트 */}
        <div className='rating-container'>
          <Rating
            count={5}
            value={rating}
            onChange={(newRating) => setRating(newRating)}
            size={40}
            activeColor="#ffd700"
          />
        </div>

        {/* 리뷰 입력 필드 */}
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="독서는 어떠셨나요? 리뷰를 작성해주세요 :)"
          rows={4}
          className="review-textarea"
        />

        {/* 제출 버튼 */}
        <button className="submit-button" onClick={handleSubmit}>등록하기</button>
      </Modal>
    </div>
  );
};

export default GetReview;
