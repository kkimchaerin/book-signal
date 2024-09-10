import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/mylib.css';
import axios from 'axios';
import Modal from '../components/Modal';
import GetReview from './GetReview'; // GetReview 컴포넌트 import
import html2canvas from 'html2canvas';
import { alertMessage } from "../../src/utils/alertMessage";

const MyLib = () => {
  const [activeTab, setActiveTab] = useState('recent'); // 기본 활성 탭
  const [userInfo, setUserInfo] = useState(undefined); // 세션 정보가 로드되지 않았을 때 undefined로 초기화
  const [recentBooks, setRecentBooks] = useState([]); // 최근 읽은 도서 상태
  const [wishlistBooks, setWishlistBooks] = useState([]); // 찜한 도서 상태
  const [completedBooks, setCompletedBooks] = useState([]); // 완독 도서 상태
  const [selectedBook, setSelectedBook] = useState(null); // 리뷰모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false); // 리뷰모달 관련 상태
  const [backgroundImage, setBackgroundImage] = useState(''); // 리뷰모달 배경 이미지 상태
  const [reviewModalOpen, setReviewModalOpen] = useState(false); // 리뷰모달 상태
  const [signalBooks, setSignalBooks] = useState([]);
  const [signalTitle, setSignalTitle] = useState(null); // 시그널 모달 관련 상태
  const [signalText, setSignalText] = useState('');
  const [signalSumm, setSignalSumm] = useState('');
  const [isSignalOpen, setSignalOpen] = useState(false); // 시그널 모달 열림 닫힘
  const [signalBackground, setSignalBackground] = useState(''); // 시그널 모달 배경 이미지 상태
  const [reviewExists, setReviewExists] = useState(false); // 리뷰 존재 여부 상태
  const [reviewStatus, setReviewStatus] = useState({}); // 각 책의 리뷰 여부를 저장하는 상태
  const [uploadedBooks, setUploadedBooks] = useState([]); // 업로드한 도서 상태

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // 업로드 모달 상태
  const [file, setFile] = useState(null); // 선택한 파일 상태

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);  // 선택한 파일을 상태에 저장
    console.log('거');
    
  };

  const handleFileUpload = async () => {
    console.log('지');
    
    if (!file) {
      alert('파일을 선택해주세요');
      return;
    }

    const formData = new FormData();  // FormData 생성
    formData.append('file', file);  // 선택한 파일을 추가

    try {
      // 서버로 파일 전송
      const response = await axios.post('http://localhost:3001/upload-epub', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',  // 멀티파트 데이터로 전송
        },
        withCredentials: true,  // 세션 정보 포함
      });

      // 서버로부터 응답을 받았을 때
      alert(response.data.message);  // 성공 메시지 표시
      console.log('같');
      
      setIsUploadModalOpen(false);  // 업로드 완료 후 모달 닫기
    } catch (error) {
      // 파일 업로드 실패 시 에러 처리
      console.error('파일 업로드 실패:', error);
      alert('파일 업로드에 실패했습니다.');
    }
  };


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
          alertMessage('로그인이 필요합니다.', '❗');
          navigate('/login');
        } else {
          console.error('', error);
        }
      });
  }, [navigate]);

  // 업로드한 도서
  const handleBookClickWithUploadPath = async (book) => {
    try {

      // upload_idx를 사용하여 서버에 요청
      const response = await axios.post('http://localhost:3001/getBookPath/getUploadBookPath', {
        upload_idx: book.upload_idx,  // upload_idx 사용
      });

      let bookPath = response.data.book_path || book.book_file_path; // 서버에서 경로를 못 가져오면 book_file_path 사용

      // 백슬래시(\)를 슬래시(/)로 변환하여 경로 수정
      bookPath = bookPath.replace(/\\/g, '/');

      // 확장자를 제거한 경로 생성
      const bookPathWithoutExtension = bookPath.replace(/\.epub$/, '');

      if (bookPathWithoutExtension) {
        // 업로드에서 왔다는 정보도 함께 넘겨줌
        navigate(`/reader`, { state: { book, bookPath: bookPathWithoutExtension, from: 'upload' } });
      } else {
        alertMessage('책 경로를 찾을 수 없습니다.', '❗');
      }
    } catch (error) {
      console.error('책 경로를 가져오는 중 오류가 발생했습니다.', error);
    }
  };


  // 업로드 도서 탭에서 이 함수로 책 클릭 처리
  const handleBookClickWithBookmark = (book) => {
    if (activeTab === 'upload') {
      // 업로드된 도서일 경우
      handleBookClickWithUploadPath(book);
    } else {
      // 나머지 탭에서도 reader 페이지로 이동
      navigate(`/reader`, { state: { book, from: 'mylib' } });
    }
  };


  // 리뷰 존재 여부 확인 함수
  const checkIfReviewExists = async (book) => {
    if (userInfo && book) {
      try {

        const response = await axios.get(`http://localhost:3001/review/check`, {
          params: { mem_id: userInfo.mem_id, book_idx: book.book_idx }, // 파라미터 전달
          withCredentials: true,
        });

        // 책 리스트에서 book.book_idx와 일치하는 객체를 찾음
        const bookData = response.data.find(item => item.book_idx === book.book_idx);

        if (bookData) {
          // 서버에서 받은 reviewExists 값 사용
          const reviewExists = bookData.book_score !== null || bookData.book_review !== null;

          // 상태 업데이트
          setReviewStatus(prevStatus => ({
            ...prevStatus,
            [book.book_idx]: reviewExists, // 책 별로 리뷰 존재 여부 저장
          }));
        } else {
        }

      } catch (error) {
        console.error('리뷰 확인 중 오류 발생:', error);
      }
    }
  };



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
        .then(async (response) => {
          const books = response.data;
          setCompletedBooks(books); // 서버에서 가져온 데이터를 상태에 저장

          // 각 책에 대해 리뷰 존재 여부 확인
          for (const book of books) {
            await checkIfReviewExists(book); // 리뷰 존재 여부 확인
          }
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

      // 사용자 업로드한 도서 데이터를 가져옴
      axios.get(`http://localhost:3001/upload-books?mem_id=${userInfo.mem_id}`, { withCredentials: true })
        .then(response => {
          setUploadedBooks(response.data); // 서버에서 가져온 데이터를 상태에 저장
        })
        .catch(error => {
          console.error('업로드한 도서를 가져오는데 실패했습니다.', error);
        });
    }
  }, [userInfo]);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  const handleBookClick = (book) => {
    navigate(`/detail`, { state: { book } }); // 선택한 책의 전체 객체를 상태로 전달하여 이동
  };

  // 리뷰 모달 열기 함수
  const openReviewModal = async (book) => {
    setSelectedBook(book);
    await checkIfReviewExists(book); // 리뷰 존재 여부 확인
    setReviewModalOpen(true);
  };

  // 리뷰 모달 닫기 함수
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
                <div className="mylib-book-card" key={index} onClick={() => handleBookClickWithBookmark(book)} >
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
                  <p className='w-[1000px] signalSumm'>{book.book_repre}</p>
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
                    {reviewStatus[book.book_idx] ? '리뷰 수정' : '리뷰 작성'}
                  </button>
                </div>
              ))
            ) : (
              <p className="mylib-no-readingbooks-message">완독한 도서가 없습니다.</p>
            )}
          </div>
        );

      case 'upload':
        return (
          <div className="mylib-books-grid">
            {uploadedBooks.length > 0 ? (
              uploadedBooks.map((book, index) => (
                <div className="mylib-book-card" key={index} onClick={() => handleBookClickWithBookmark(book)}>
                  <img src={book.book_cover} alt={`${book.book_name} Cover`} className="mylib-book-cover" />
                  <div className="book-info">
                    <p className="book-title">{book.book_name}</p>
                    <p className="book-author">{book.book_writer}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="mylib-no-readingbooks-message">업로드한 도서가 없습니다.</p>
            )}
          </div>
        )
      default:
        return null;
    }
  };

  return (
    <div className="mylib-container">
      <h1 className="mylib-title">{userInfo?.mem_nick} 님의 서재</h1>

      {/* 최근 읽은 도서 갯수에 따른 멘트 */}
      <p className="mylib-welcome-message">
        올해 {recentBooks.length}권을 읽으셨어요!
      </p>
      <br />

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
        <div
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => handleTabClick('upload')}
        >
          업로드한 도서
        </div>
      </div>

      {renderContent()}

      {/* 업로드한 도서 탭일 때만 + 버튼 렌더링 */}
      {activeTab === 'upload' && (
        <button
          className="upload-button"
          onClick={() => setIsUploadModalOpen(true)}
        >
          업로드
        </button>
      )}

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
        className={"signal-modal"}
        backgroundImage={signalBackground}
        onDownload={handleDownload}
      >
        <p>{signalTitle}</p>
        <p>{signalText}</p>
        <p>{signalSumm}</p>

      </Modal>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)} // 모달 닫기
        className="upload-modal"
      >
        <h2>EPUB 파일 업로드</h2>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleFileUpload}> 업로드</button>
      </Modal>
    </div>
  );
};

export default MyLib;
