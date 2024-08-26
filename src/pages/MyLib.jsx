import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/mylib.css';
import axios from 'axios';
import Modal from '../components/Modal'; // 사용자 정의 Modal 가져오기

const MyLib = () => {
  const [activeTab, setActiveTab] = useState('recent'); // 기본 활성 탭
  const [userInfo, setUserInfo] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null); // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 관련 상태
  const [backgroundImage, setBackgroundImage] = useState(''); // 모달 배경 이미지 상태
  const navigate = useNavigate();

  useEffect(() => {
    // 서버에서 세션 정보를 가져옴
    axios.get('http://localhost:3001/check-session', { withCredentials: true })
      .then(response => {
        if (response.data.user) {
          setUserInfo(response.data.user);  // 사용자 정보가 있으면 저장
        } else {
          setUserInfo(null);  // 사용자 정보가 없으면 null로 설정
        }
      })
      .catch(error => {
        console.error('세션 정보를 가져오는데 실패했습니다.', error);
        setUserInfo(null);  // 에러 발생 시 null로 설정
      });
  }, []);

  useEffect(() => {
    if (userInfo === null) {
      alert('로그인이 필요합니다.');
      navigate('/login'); // 로그인 페이지로 이동
    }
  }, [userInfo, navigate]);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  const handleBookClick = (book, image) => {
    if (activeTab === 'bookSignal') {
      setSelectedBook(book);
      setBackgroundImage(image);
      setIsModalOpen(true);
    }
  };

  const renderContent = () => {
    if (userInfo === undefined) {
      return <div>로딩 중...</div>;  // userInfo가 undefined일 때 로딩 메시지 표시
    }

    switch (activeTab) {
      case 'recent':
        return (
          <div className="books-grid">
            <div className="book-card">
              <img src="" alt="Book Cover" className="book-cover" />
              <div className="book-info">
                <p className="book-title">&lt;최근 읽은 책 제목&gt;</p>
                <p className="book-author">저자 이름</p>
              </div>
            </div>
          </div>
        );
      case 'favorite':
        return (
          <div className="books-grid">
            <div className="book-card">
              <img src="" alt="Book Cover" className="book-cover" />
              <div className="book-info">
                <p className="book-title">&lt;찜한 책 제목&gt;</p>
                <p className="book-author">저자 이름</p>
              </div>
              <div className="book-heart">❤️</div>
            </div>
          </div>
        );
      case 'bookSignal':
        return (
          <div className="signal-grid">
            <div
              className="signal-card"
              style={{ backgroundImage: `url('/path/to/image1.png')` }}
              onClick={() => handleBookClick('북 시그널 책 제목 1', '/path/to/image1.png')}
            >
              <div className="signal-text">
                <p>시간은 흐르고,<br/>우리는 그 속에서 끊임없이 변화한다.</p>
                <p>홍길동, {'<나의 눈부신 친구>'}</p>
              </div>
            </div>
            <div
              className="signal-card"
              style={{ backgroundImage: `url('/path/to/image2.png')` }}
              onClick={() => handleBookClick('북 시그널 책 제목 2', '/path/to/image2.png')}
            >
              <div className="signal-text">
                <p>시간은 흐르고,<br/>우리는 그 속에서 끊임없이 변화한다.</p>
                <p>홍길동, {'<나의 눈부신 친구>'}</p>
              </div>
            </div>
            <div
              className="signal-card"
              style={{ backgroundImage: `url('/path/to/image3.png')` }}
              onClick={() => handleBookClick('북 시그널 책 제목 3', '/path/to/image3.png')}
            >
              <div className="signal-text">
                <p>시간은 흐르고,<br/>우리는 그 속에서 끊임없이 변화한다.</p>
                <p>홍길동, {'<나의 눈부신 친구>'}</p>
              </div>
            </div>
          </div>
        );
      case 'completed':
        return (
          <div className="books-grid">
            <div className="book-card">
              <img src="" alt="Book Cover" className="book-cover" />
              <div className="book-info">
                <p className="book-title">&lt;완독한 책 제목&gt;</p>
                <p className="book-author">저자 이름</p>
              </div>
            </div>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        backgroundImage={backgroundImage}
      >
        <h2>{selectedBook}</h2>
        <p>책 세부 정보 표시</p>
      </Modal>
    </div>
  );
};

export default MyLib;
