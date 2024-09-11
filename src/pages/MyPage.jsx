import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/mypage.css';
import { VscPreview } from "react-icons/vsc";
import { BsPersonCircle } from "react-icons/bs";
import { MdEmail } from "react-icons/md";
import { PiHandCoinsDuotone } from "react-icons/pi";
import axios from 'axios';
import CalibrationButton from '../components/book/CalibrationButton';
import { alertMessage } from "../../src/utils/alertMessage";

const MyPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [reviews, setReviews] = useState([]); // 리뷰 데이터를 저장하는 상태
  const navigate = useNavigate();

  useEffect(() => {
    // 사용자 정보와 리뷰 정보를 가져오는 함수
    const fetchData = async () => {
      try {
        const sessionResponse = await axios.get('http://localhost:3001/check-session', { withCredentials: true });
        if (sessionResponse.data.user) {
          const userInfoResponse = await axios.get(`http://localhost:3001/user-info/${sessionResponse.data.user.mem_id}`, { withCredentials: true });
          setUserInfo(userInfoResponse.data);

          const reviewsResponse = await axios.get(`http://localhost:3001/review/${sessionResponse.data.user.mem_id}`, { withCredentials: true });
          setReviews(reviewsResponse.data);
        } else {
          throw new Error('로그인되지 않음');
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          alertMessage('로그인이 필요합니다.', '❗');
          navigate('/login');
        } else if (error.response && error.response.status === 404) {
          console.log('리뷰가 존재하지 않습니다.');
        } else {
          console.error('데이터를 가져오는데 실패했습니다.', error);
        }
      }
    };

    fetchData();
  }, [navigate]);

  const handleDeleteUser = () => {
    navigate('/deleteuser'); // 회원탈퇴 페이지로 이동
  };

  const handleDeleteReview = async (reviewId, book_idx) => {
    const mem_id = userInfo.mem_id;

    try {
      await axios.delete(`http://localhost:3001/review/${reviewId}`, {
        data: { mem_id, book_idx },
        withCredentials: true
      });
      setReviews(prevReviews => prevReviews.filter(review => review.end_idx !== reviewId));

      // 최신 유저 데이터 다시 가져오기 (이전 방식)
      // const updatedUserInfo = await axios.get('http://localhost:3001/user-info/' + mem_id, { withCredentials: true });
      // if (updatedUserInfo.data) {
      //   setUserInfo(updatedUserInfo.data); // 최신 포인트 반영
      // }


      // 포인트를 즉시 업데이트 (포인트 차감 15 적용)
      setUserInfo(prevUserInfo => ({
        ...prevUserInfo,
        mem_point: prevUserInfo.mem_point - 15
      }));


      // 최신 유저 데이터 다시 가져오기
      const updatedUserInfo = await axios.get('http://localhost:3001/user-info/' + mem_id, { withCredentials: true });
      if (updatedUserInfo.data) {
        setUserInfo(updatedUserInfo.data); // 최신 포인트 반영
      }
      alertMessage('리뷰가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('리뷰 삭제에 실패했습니다.', error);
    }
  };

  if (!userInfo) {
    return <p>로딩 중...</p>;
  }

  return (
    <div className="mypage-container">
      <div className="user-info">
        <h2>{userInfo.mem_nick} 님</h2>
        <br />
        <div className='info-group'>
          <BsPersonCircle className='icon' />
          <p>아이디: {userInfo.mem_id}</p>
        </div>
        <br />
        <div className='info-group'>
          <MdEmail className='icon' />
          <p>이메일: {userInfo.mem_mail}</p>
        </div>
        <br />
        <div className='info-group'>
          <PiHandCoinsDuotone className='icon' />
          <p>포인트: <span className="points">{userInfo.mem_point}</span>점</p>
        </div>
        <CalibrationButton />
        <br />
        <button onClick={handleDeleteUser}>회원탈퇴</button>
      </div>
      <div className="review-section">
        <h3>내가 작성한 리뷰</h3>
        <br />
        {reviews.length === 0 ? (
          <div className="review-placeholder">
            <VscPreview className="preview-icon" />
            <br />
            <p>아직 작성된 리뷰가 없어요</p>
            <p>책을 읽고 리뷰를 작성해 포인트를 쌓아보세요!</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews
              .filter((review) => review.book_score !== null && review.book_review !== null) // 리뷰가 있는 도서만 렌더링
              .map((review) => {

                return (
                  <div key={review.end_idx} className="review-item">
                    <img src={`/images/${review.book_cover}`} alt={review.book_name} className="book-cover" />
                    <div className="review-content">
                      <h4>{review.book_name}</h4>
                      <p>★ {review.book_score}</p>
                      <h5>리뷰: {review.book_review}</h5>
                      <button onClick={() => handleDeleteReview(review.end_idx, review.book_idx)}>삭제하기</button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPage;
