import React, { useEffect, useContext, useState } from 'react';
import SlideShow from '../components/SlideShow';
import SLIDES from '../data/slides';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/fonts.css';
import '../css/main.css';
import { AuthContext } from '../App'; // AuthContext import

const Home = () => {
  const { isAuthenticated } = useContext(AuthContext); // 로그인 상태 가져오기
  const [newBooks, setNewBooks] = useState([]);
  const [bestBooks, setBestBooks] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [userInfo, setUserInfo] = useState(null); // 사용자 정보를 저장할 상태
  const [recommendedBooks, setRecommendedBooks] = useState([]); // Python 추천 도서 목록
  const [userId, setUserId] = useState(null); // 사용자 ID 저장
  const navigate = useNavigate();

  // 세션 정보에서 사용자 ID를 가져오는 함수
  useEffect(() => {
    axios
      .get("http://localhost:3001/check-session", { withCredentials: true })
      .then((response) => {
        const mem_id = response.data.user.mem_id;
        setUserId(mem_id); // 사용자 ID 설정
      })
      .catch((error) => {
        console.error("세션 정보를 가져오는 중 오류 발생:", error);
        setUserId(null); // 세션 정보가 없을 경우 null로 설정
      });
  }, []);

  // 세션 정보를 가져오는 useEffect (로그인된 상태일 때만)
  useEffect(() => {
    if (isAuthenticated) {
      axios.get('http://localhost:3001/check-session', { withCredentials: true })
        .then(response => {
          if (response.data && response.data.user) {
            setUserInfo(response.data.user); // 로그인된 유저 정보를 설정
          }
        })
        .catch(error => {
          console.error('세션 정보를 가져오는 중 오류 발생:', error);
          setUserInfo(null); // 오류 시 userInfo를 null로 설정
        });
    }
  }, [isAuthenticated]); // isAuthenticated 상태가 변경될 때마다 실행

  // 메인 데이터 (신작, 인기작, 베스트) 가져오는 useEffect
  useEffect(() => {
    axios.get('http://localhost:3001/main')
      .then(response => {
        const { newBooks, bestBooks, popularBooks } = response.data;
        setNewBooks(newBooks);
        setBestBooks(bestBooks);
        setPopularBooks(popularBooks);
      })
      .catch(error => {
        console.error('오류:', error.response ? error.response.data : error.message);
      });
  }, []);

  // 추천 도서 가져오는 useEffect (로그인된 경우에만 실행)
  useEffect(() => {
    if (userId) {
      axios
        .post("http://localhost:5000/get-recommendations", { mem_id: userId })
        .then((response) => {
          setRecommendedBooks(response.data); // 추천 도서 설정
        })
        .catch((error) => {
          console.error("추천 도서 가져오기 오류:", error);
          setRecommendedBooks([]); // 오류 발생 시 빈 배열로 설정
        });
    }
  }, [userId]);

  const handleBookClick = (book) => {
    navigate(`/detail`, { state: { book } });
  };

  return (
    <div className="main-div">
      <SlideShow slides={SLIDES} />
      <br />
      <br />
      <br />
      <br />

      {/* 인기top5 */}
      <h2 className="main-title">
        지금, 많이 읽은 그 작품
        <a href="/ranking/popular" className="main-link">
          더보기
        </a>
      </h2>
      <br />
      <div className="main-book-container">
        {popularBooks.map((book, index) => (
          <div
            key={index}
            className="main-book-card"
            onClick={() => handleBookClick(book)}
          >
            <div className="main-book-cover">
              <img
                src={book.book_cover}
                alt={`${book.book_name} Cover`}
                className="h-full w-full rounded-md shadow-lg"
              />
            </div>
            <div className="main-book-info">
              <p className="main-book-title">{book.book_name}</p>
              <p className="main-book-author">{book.book_writer}</p>
            </div>
          </div>
        ))}
      </div>
      <br />

      {/* 평점 top5 */}
      <h2 className="main-title">
        평점, BEST!
        <a href="/ranking/best" className="main-link">
          더보기
        </a>
      </h2>
      <br />
      <div className="main-book-container">
        {bestBooks.map((book, index) => (
          <div
            key={index}
            className="main-book-card"
            onClick={() => handleBookClick(book)}
          >
            <div className="main-book-cover">
              <img
                src={book.book_cover}
                alt={`${book.book_name} Cover`}
                className="h-full w-full rounded-md shadow-lg"
              />
            </div>
            <div className="main-book-info">
              <p className="main-book-title">{book.book_name}</p>
              <p className="main-book-author">{book.book_writer}</p>
            </div>
          </div>
        ))}
      </div>
      <br />

      {/* 신작 top5 */}
      <h2 className="main-title">
        갓 나온 신작
        <a href="/ranking/new" className="main-link">
          더보기
        </a>
      </h2>
      <br />
      <div className="main-book-container">
        {newBooks.map((book, index) => (
          <div
            key={index}
            className="main-book-card"
            onClick={() => handleBookClick(book)}
          >
            <div className="main-book-cover">
              <img
                src={book.book_cover}
                alt={`${book.book_name} Cover`}
                className="h-full w-full rounded-md shadow-lg"
              />
            </div>
            <div className="main-book-info">
              <p className="main-book-title">{book.book_name}</p>
              <p className="main-book-author">{book.book_writer}</p>
            </div>
          </div>
        ))}
      </div>
      <br />
      <br />
      <br />

      {/* 추천시그널 - 로그인한 경우에만 표시 */}
      {isAuthenticated && userInfo && (
        <>
          <h2 className='main-title'>
            {`${userInfo.mem_nick} 님에게 보내는`} 추천 시그널
          </h2>
          <br />
          <div className="bg-[#FFEEE4] h-auto pt-3 pb-5 rounded-xl">
            <br />
            {recommendedBooks.length > 0 ? (
              <div className='flex justify-center gap-4 max-w-5xl mx-auto'>
                {recommendedBooks.map((book, index) => (
                  <div
                    key={index}
                    className="relative flex flex-col items-center hover:transform hover:-translate-y-2 transition-transform duration-300"
                    style={{ width: '380px' }}
                    onClick={() => handleBookClick(book)}
                  >
                    <img
                      src={book.book_cover}
                      alt={`${book.book_name} Cover`}
                      className="z-20 rounded-lg shadow-lg"
                      style={{ width: '230px', height: '310px' }}
                    />
                    <div className="opacity-75 relative z-10 -mt-7 w-[300px] h-auto min-h-44 max-h-48 bg-white p-4 rounded-lg shadow-lg text-center break-words">
                      <p className="font-semibold text-lg pt-6 pb-2">{book.book_name}</p>
                      <p className="text-sm text-gray-600 break-words">{book.book_writer}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                읽은 책에 대한 정보가 없어 당신의 취향을 모르겠어요. 책을 더 읽어주세요!
              </div>
            )}
            <br />
          </div>
        </>
      )}

      <div className="h-40 text-right">
        <div className="h-28"></div>
        <hr />
        <div className="h-5"></div>
        <span className="text-gray-400">b:ook</span>
        <div className="h-10"></div>
      </div>
    </div>
  );
};

export default Home;
