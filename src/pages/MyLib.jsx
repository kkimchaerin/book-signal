import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/mylib.css';
import axios from 'axios';
import Modal from '../components/Modal';
import GetReview from './GetReview'; // GetReview 컴포넌트 import
import html2canvas from 'html2canvas';

const MyLib = () => {
  const [activeTab, setActiveTab] = useState('recent'); // 기본 활성 탭
  const [userInfo, setUserInfo] = useState(undefined); // 세션 정보가 로드되지 않았을 때 undefined로 초기화
  const [recentBooks, setRecentBooks] = useState([]); // 최근 읽은 도서 상태
  const [wishlistBooks, setWishlistBooks] = useState([]); // 찜한 도서 상태
  const [completedBooks, setCompletedBooks] = useState([]); // 완독 도서 상태
  const [selectedBook, setSelectedBook] = useState(null); // 리뷰 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false); // 리뷰 모달 관련 상태
  const [backgroundImage, setBackgroundImage] = useState(''); // 리뷰 모달 배경 이미지 상태
  const [reviewModalOpen, setReviewModalOpen] = useState(false); // 리뷰 모달 상태
  const [signalBooks, setSignalBooks] = useState([]);
  const [signalTitle, setSignalTitle] = useState(null); // 시그널 모달 관련 상태
  const [signalText, setSignalText] = useState('');
  const [signalSumm, setSignalSumm] = useState('');
  const [isSignalOpen, setSignalOpen] = useState(false); // 시그널 모달 열림 닫힘
  const [signalBackground, setSignalBackground] = useState(''); // 시그널 모달 배경 이미지 상태

  const navigate = useNavigate();

  useEffect(() => {
    // 서버에서 세션 정보를 가져옴
    axios.get('http://localhost:3001/check-session', { withCredentials: true })
      .then(response => {
        setUserInfo(response.data.user); // 세션 정보를 설정
      })
      .catch(error => {
        if (error.response && error.response.status === 401) {
          // 로그인이 필요하면 로그인 페이지로 이동
          alert('로그인이 필요합니다.');
          navigate('/login');
        } else {
          console.error('', error);
        }
      });
  }, [navigate]);

  // 세션 확인 후 처리
  useEffect(() => {
    if (userInfo) {
      // 최근 읽은 도서 데이터를 가져옴
      axios.get('http://localhost:3001/recent-books', { withCredentials: true })
        .then(response => {
          setRecentBooks(response.data); // 서버에서 가져온 데이터를 상태에 저장
        })
        .catch(error => {
          console.error('최근 읽은 도서를 가져오는데 실패했습니다.', error);
        });

      // 찜한 도서 데이터를 가져옴
      axios.get('http://localhost:3001/wishlist-books', { withCredentials: true })
        .then(response => {
          setWishlistBooks(response.data); // 서버에서 가져온 데이터를 상태에 저장
        })
        .catch(error => {
          console.error('찜한 도서를 가져오는데 실패했습니다.', error);
        });

      // 완독 도서 데이터를 가져옴
      axios.get('http://localhost:3001/completed-books', { withCredentials: true })
        .then(response => {
          setCompletedBooks(response.data); // 서버에서 가져온 데이터를 상태에 저장
        })
        .catch(error => {
          console.error('완독 도서를 가져오는데 실패했습니다.', error);
        });

      // 북 시그널 도서 데이터를 가져옴
      axios.get(`http://localhost:3001/signal-books?mem_id=${userInfo.mem_id}`, { withCredentials: true })
        .then(response => {
          setSignalBooks(response.data); // 서버에서 가져온 데이터를 상태에 저장
        })
        .catch(error => {
          console.error('북 시그널 도서를 가져오는데 실패했습니다.', error);
        });
    }
  }, [userInfo]);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  const handleBookClick = (book) => {
    navigate(`/detail`, { state: { book } }); // 선택한 책의 전체 객체를 상태로 전달하여 이동
  };

  const openReviewModal = (book) => {
    setSelectedBook(book);
    setReviewModalOpen(true);
  };


  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedBook(null);
  };


  const handleSignalClick = (book, image, text, summ) => {
    if (activeTab === 'bookSignal') {
      setSignalTitle(book);
      setSignalBackground(image);
      setSignalText(text);
      setSignalSumm(summ);
      setSignalOpen(true);
    }
  }

  const handleDownload = () => {
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
      html2canvas(modalContent).then(canvas => {
        canvas.toBlob(blob => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${signalTitle}.jpg`;
          link.click();
          URL.revokeObjectURL(link.href);
        }, 'image/jpeg');
      });
    }
  };



  const renderContent = () => {
    switch (activeTab) {
      case 'recent':
        return (
          <div className="mylib-books-grid">
            {recentBooks.length > 0 ? (
              recentBooks.map((book, index) => (
                <div className="mylib-book-card" key={index} >
                  <img src={book.book_cover} alt={`${book.book_name} Cover`} className="mylib-book-cover" />
                  <div className="book-info">
                    <p className="book-title">{book.book_name}</p>
                    <p className="book-author">{book.book_writer}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="mylib-no-readingbooks-message">최근 읽은 도서가 없습니다.</p>
            )}
          </div>
        );
      case 'favorite':
        return (
          <div className="mylib-books-grid">
            {wishlistBooks.length > 0 ? (
              wishlistBooks.map((book, index) => (
                <div className="mylib-book-card" key={index} onClick={() => handleBookClick(book)}>
                  <img src={book.book_cover} alt={`${book.book_name} Cover`} className="mylib-book-cover" />
                  <div className="book-info">
                    <p className="book-title">{book.book_name}</p>
                    <p className="book-author">{book.book_writer}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="mylib-no-readingbooks-message">찜한 도서가 없습니다.</p>
            )}
          </div>
        );

      // 북시그널
      case 'bookSignal':
        return (
          <div className="signal-grid">
            {signalBooks.length > 0 ? (
              signalBooks.map((book, index) => (
                <div
                  key={index}
                  className="signal-card"
                  style={{ backgroundImage: `url(${book.dalle_path})` }}
                  onClick={() => handleSignalClick(book.book_name, book.dalle_path, book.book_repre, book.book_extract)}
                >
                  <p className='signalName'>{book.book_name}</p>
                  <br />
                  <p className='w-[1000px] signalRepre'>{book.book_repre}</p>
                </div>
              ))
            ) : (
              <p className="mylib-no-readingbooks-message">북 시그널 도서가 없습니다.</p>
            )}
          </div>
        );

      case 'completed':
        return (
          <div className="mylib-completed-books-grid">
            {completedBooks.length > 0 ? (
              completedBooks.map((book, index) => (
                <div className="mylib-book-item" key={index}>
                  <div className="mylib-completed-book-card" onClick={() => handleBookClick(book)}>
                    <img src={book.book_cover} alt={`${book.book_name} Cover`} className="mylib-book-cover" />
                    <div className="book-info">
                      <p className="book-title">{book.book_name}</p>
                      <p className="book-author">{book.book_writer}</p>
                    </div>
                  </div>
                  <button className="write-review-button" onClick={() => openReviewModal(book)}>
                    리뷰 작성 및 수정
                  </button>
                </div>
              ))
            ) : (
              <p className="mylib-no-readingbooks-message">완독한 도서가 없습니다.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mylib-container">
      <h1 className="mylib-title">{userInfo?.mem_nick} 님의 서재</h1>
      <div className="tabs">
        <div
          className={`tab ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => handleTabClick('recent')}
        >
          최근 읽은 도서
        </div>
        <div
          className={`tab ${activeTab === 'favorite' ? 'active' : ''}`}
          onClick={() => handleTabClick('favorite')}
        >
          찜한 도서
        </div>
        <div
          className={`tab ${activeTab === 'bookSignal' ? 'active' : ''}`}
          onClick={() => handleTabClick('bookSignal')}
        >
          북 시그널
        </div>
        <div
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => handleTabClick('completed')}
        >
          완독 도서
        </div>
      </div>

      {renderContent()}

      {/* GetReview 모달 */}
      {selectedBook && (
        <GetReview
          book={selectedBook}
          onReviewSubmit={closeReviewModal}
        />
      )}


      {/* bookSignal 모달 */}
      <Modal
        isOpen={isSignalOpen}
        onClose={() => setSignalOpen(false)}
        backgroundImage={signalBackground}
        onDownload={handleDownload}
      >
        <p>{signalTitle}</p>
        <p>{signalText}</p>
        <p>{signalSumm}</p>

      </Modal>
    </div>
  );
};

export default MyLib;
