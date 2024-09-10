import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import GetReview from './GetReview'; // GetReview 컴포넌트를 import
import '../css/bookDetail.css';
import { IoMdHeartEmpty } from "react-icons/io";
import { TiStarFullOutline } from "react-icons/ti";
import '../css/sameBook.css';
import { alertMessage } from "../../src/utils/alertMessage";

const BookDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { book } = location.state || {};
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [memId, setMemId] = useState(null);
  const [sameBooks, setSameBooks] = useState([]);
  const [reviews, setReviews] = useState([]); // 리뷰 상태 추가
  const [modalIsOpen, setModalIsOpen] = useState(false); // 모달 상태 추가

  useEffect(() => {
    if (!book) {
      console.error("책 정보가 전달되지 않았습니다.");
      navigate('/');  // 책 정보가 없으면 홈으로 리다이렉트
      return;
    }

    axios.get('http://localhost:3001/check-session', { withCredentials: true })
      .then(response => {
        if (response.status === 200) {
          setIsLoggedIn(true);
          setMemId(response.data.user.mem_id);
          checkWishlistStatus(response.data.user.mem_id, book.book_idx);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(error => {
        console.error('로그인 상태 확인 중 오류 발생:', error);
        setIsLoggedIn(false);
      });
  }, [book, navigate]);

  useEffect(() => {
    axios.get('http://localhost:3001/sameBook', {
      params: { genre: book.book_genre, idx: book.book_idx }
    })
    .then(response => {
        const { sameBooks } = response.data;
        setSameBooks(sameBooks);
      })
      .catch(error => {
        console.error('오류:', error.response ? error.response.data : error.message);
      });
  }, [book.book_genre, book.book_idx]);

  const checkWishlistStatus = async (memId, bookIdx) => {
    try {
      const response = await axios.post('http://localhost:3001/wishlist/check', { mem_id: memId, book_idx: bookIdx });
      setIsWishlisted(response.data.isWishlisted);
    } catch (error) {
      console.error('찜한 도서 상태 확인 실패:', error);
    }
  };

  const handleWishList = async () => {
    if (!isLoggedIn) {
      alertMessage('로그인이 필요합니다.','❗');
      navigate('/login');
      return;
    }

    try {
      if (isWishlisted) {
        await axios.post('http://localhost:3001/wishlist/remove', { mem_id: memId, book_idx: book.book_idx });

        alertMessage('찜한 도서에서 제거되었습니다.','❤');
      } else {
        await axios.post('http://localhost:3001/wishlist', { mem_id: memId, book_idx: book.book_idx });
        alertMessage('찜한 도서에 추가되었습니다.','❤');
      }
      setIsWishlisted(!isWishlisted);
    } catch (error) {
      console.error('찜한 도서 처리 실패:', error);
    }
  };

  const handleReadBook = async () => {
    if (!isLoggedIn) {
      alertMessage('로그인이 필요합니다.','❗');
      navigate('/login');
      return;
    }

    try {
      await axios.post('http://localhost:3001/addReadingRecord', { mem_id: memId, book_name: book.book_name });

      const bookNameWithoutSpaces = book.book_name.replace(/\s+/g, '');

      const response = await axios.post('http://localhost:3001/getBookPath', {
        book_name: encodeURIComponent(bookNameWithoutSpaces)
      });

      const bookPath = response.data.book_path;

      navigate('/reader', { state: { book: { ...book, bookPath } } });

      // 책 읽기 완료 후 모달을 여는 코드
      setModalIsOpen(true);
    } catch (error) {
      console.error('책 읽기 처리 중 에러:', error);
      alertMessage('책을 읽는 중에 문제가 발생했습니다.','❗');
    }
  };

  const handleModalClose = () => {
    setModalIsOpen(false);
    // 페이지를 다시 로드하거나, 다른 로직 추가 가능
  };

  // 리뷰 가져오기 API 호출 수정
  useEffect(() => {
    if (!book || !book.book_idx) {
      console.error('유효한 책 정보가 없습니다.');
      return;
    }
  
    // 백엔드 요청 URL을 올바르게 설정
    axios.get(`http://localhost:3001/review/book/${book.book_idx}`)
      .then(response => {
        const { reviews } = response.data;
        setReviews(reviews); // 리뷰 데이터를 상태에 저장
      })
      .catch(error => {
        console.error('리뷰 데이터 가져오기 실패:', error);
      });
  }, [book]);

  return (
    <div className='book-info-wrapper flex flex-col gap-10 max-w-screen-xl m-auto'>
      <section className='flex gap-6 w-30 h-96 justify-between'>
        <h2 className='sr-only'>도서 정보</h2>
        <div className='book-cover-wrapper w-[250px] aspect-w-2 aspect-h-3'>
          <img src={book?.book_cover} alt={book?.book_name || "도서 이미지"} className='w-full h-full object-cover rounded-xl' />
        </div>
        <div className='border rounded-xl grow flex flex-col justify-between'>
          <div className='book-info-contents flex flex-col gap-2 text-md p-6'>
            <p className='text-[14px] text-gray-500 mt-2'>{book.book_genre}</p>
            <p className='text-3xl font-semibold mb-4'>{book.book_name}</p>
            <div className='flex gap-3'>
              <p className='text-[16px]'>{book?.book_writer}<span>저자</span></p>
            </div>
            <p className='mb-4 text-[16px]'>{book.book_published_at}<span>출간</span></p>
            <div className='flex ml-[-6px] mb-2'>
              <span className='mr-2 text-[16px]'>이 책을 읽은 독자</span>
              <p className='text-[16px] text-black'>{book.book_views}</p>
            </div>
            <div>
              <p className='flex items-center text-[16px] justify-start mb-2'>
                <span className='sr-only'>평점</span>
                <TiStarFullOutline className='mt-[2px]' />
                <strong className='ml-1 text-[16px]'>{book.book_avg}</strong>
              </p>
            </div>
          </div>
          <div className='book-info-button flex'>
            <button onClick={handleReadBook} className='border-t border-r rounded-bl-xl flex-1 text-primary'>바로 읽기</button>
            <button onClick={handleWishList} className={`border-t flex items-center justify-center rounded-br-xl flex-1 ${isWishlisted ? 'bg-primary text-white' : 'text-primary'}`}>
              <IoMdHeartEmpty size={22} className='mr-2' />내 서재에 찜하기
            </button>
          </div>
        </div>
      </section>
      <section>
        <h2 className='text-2xl text-black'>책 소개</h2>
        <div className='bg-background p-6 mt-3 rounded-xl'>
          <h3 className='text-xl mb-3 '>도서 정보</h3>
          <p className='font-normal'>{book.book_explanation}</p>
        </div>
      </section>
      <section>
        <h2 className='text-2xl text-black'>리뷰</h2>
        <div className='review-container bg-background p-6 mt-3 rounded-xl overflow-y-auto'>
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <div key={index} className='review-item mb-4 p-4 border rounded'>
                <p className='review-content text-md'>{review.book_review}</p>
                <p className='review-author text-sm text-gray-500'>작성자: {review.mem_nick}</p>
                <p className='review-score text-xs text-yellow-500'>평점: {review.book_score}</p>
                <p className='review-date text-xs text-gray-400'>작성일: {new Date(review.end_at).toLocaleDateString()}</p>
                
              </div>
            ))
          ) : (
            <p className='text-gray-500'>아직 리뷰가 없습니다.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className='text-2xl mb-6 text-black'>관련 도서</h2>
        <div className='flex gap-4'>
          {sameBooks.map((sameBook) => (
            <div
              className="same-book-card"
              key={sameBook.book_idx}
              onClick={() => navigate(`/detail`, { state: { book: sameBook } })}
              style={{ cursor: 'pointer' }}
            >
              <div className='book-cover-wrapper w-[200px] aspect-w-2 aspect-h-3'>
                <img src={sameBook.book_cover} alt={sameBook.book_name} className='w-[180px] h-[260px] rounded-lg object-cover' />
              </div>
              <div className="main-book-info w-[180px]">
                <p className="main-book-title">{sameBook.book_name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className='h-40 text-right'>
        <hr />
        <div className='h-5'></div>
        <span className='text-gray-400'>b:ook</span>
        <div className='h-10'></div>
      </div>
    </div>
  );
};

export default BookDetail;
