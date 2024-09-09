import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Wrapper from 'components/header/Wrapper';
import Layout, { AutoLayout } from 'components/header/Layout';
import ControlBtn from 'components/header/ControlBtn';
import TTSManager from 'components/tts/TTSManager';
import TTSWrapper from 'components/tts/TTSWrapper';
import '../css/ReaderHeader.css';
import { handleSummarize } from 'components/SummarizePage';
import axios from 'axios';


const Header: React.FC<Props> = ({
  rate,
  gender,
  onRateChange,
  onVoiceChange,
  onTTSToggle,
  onTTSPause,
  onTTSStop,
  onTTSResume,
  onBookmarkAdd = () => { },
  setAudioSource,
  book,
  userInfo, // userInfo를 props로 받아야 합니다.
  fetchBookmarks,
  goToBookmark,
  onReadingComplete,
  onReadingQuit,
  onBookmarkRemove,
  onFontSizeChange,  // 폰트 크기 변경 함수
}: Props) => {
  const [showTTSSettings, setShowTTSSettings] = useState(false);
  const [showBookmarkSettings, setShowBookmarkSettings] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [fontSize, setFontSize] = useState(16); // 초기값 16
  const [bookmarkMessage, setBookmarkMessage] = useState('');
  const [bookmarks, setBookmarks] = useState<{ book_mark: string; book_text: string }[]>([]);
  const [showBookmarksList, setShowBookmarksList] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Noto Sans KR'); // 기본 폰트: Noto Sans KR
  const [eyegazeBookmark, setEyegazeBookmark] = useState<{ book_mark: string; book_text: string } | null>(null);

  const navigate = useNavigate();

  // 폰트 크기 증가 함수
  const increaseFontSize = () => {
    if (fontSize < 32) {
      setFontSize((prev) => {
        const newSize = prev + 2;
        if (onFontSizeChange) onFontSizeChange('increase');
        return newSize;
      });
    }
  };

  // 폰트 크기 감소 함수
  const decreaseFontSize = () => {
    if (fontSize > 12) {
      setFontSize((prev) => {
        const newSize = prev - 2;
        if (onFontSizeChange) onFontSizeChange('decrease');
        return newSize;
      });
    }
  };

  // 슬라이더 값 변경 함수
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setFontSize(value);
    if (onFontSizeChange) {
      if (value > fontSize) {
        onFontSizeChange('increase');
      } else {
        onFontSizeChange('decrease');
      }
    }
  };

  const handleSoundClick = () => {
    setShowTTSSettings(true);
    setShowBookmarkSettings(false);
    setShowFontSettings(false);
  };

  const handleBookmarkToggle = () => {
    setShowBookmarkSettings(true);
    setShowTTSSettings(false);
    setShowFontSettings(false);
  };

  const handleFontClick = () => {
    setShowFontSettings(true);
    setShowTTSSettings(false);
    setShowBookmarkSettings(false);
  };

  const handleClose = () => {
    setShowTTSSettings(false);
    setShowBookmarkSettings(false);
    setShowFontSettings(false);
  };

  const handleFinishReading = () => {
    navigate('/detail', { state: { book } });
    setShowFontSettings(!showFontSettings);
  };

  // 독서 완료 처리 함수
  // api 호출
  const handleReadingComplete = async () => {
    console.log("독서 완료 처리 시작"); // 함수 호출 시작 로그

    if (userInfo && book) {
      const { mem_id } = userInfo;
      const { book_idx, book_name } = book;

      console.log("사용자 정보:", { mem_id }); // 사용자 ID 로그
      console.log("책 정보:", { book_idx }); // 책 인덱스 로그

      // 상세 페이지로 네비게이션
      console.log("상세 페이지로 네비게이션 중...");
      navigate("/detail", { state: { book } });

      // 페이지 이동 후에 비동기로 데이터 저장 및 요약 생성 요청
      setTimeout(async () => {
        try {
          // 서버에 독서 완료 정보 저장 요청
          await axios.post('http://localhost:3001/completeReading', {
            memId: mem_id,
            bookIdx: book_idx,
            bookName: book_name
          });

          console.log("독서 완료 정보가 저장되었습니다."); // 저장 성공 로그

          // 요약 생성 요청
          console.log("요약 생성 요청 중..."); // 요약 요청 시작 로그
          const summarizeResult = await handleSummarize(mem_id, book_idx);

          if (summarizeResult.success) {
            console.log("요약 생성 및 저장 성공:", summarizeResult.summary); // 성공 로그
          } else {
            console.error("요약 생성 실패:", summarizeResult.error); // 실패 로그
          }
        } catch (error) {
          console.error("독서 완료 처리 중 오류 발생:", error);
        }
      }, 1000); // 페이지 이동 후 약간의 지연을 두고 작업 시작
    } else {
      console.warn("사용자 정보 또는 책 정보가 없습니다."); // 사용자 또는 책 정보가 없을 때 경고 로그
    }
  };


  const handleReadingQuit = () => {
    console.log("독서 중단 처리"); // 함수 호출 시작 로그
    console.log("상세 페이지로 네비게이션 중...", { book }); // 페이지 이동 로그
    navigate("/detail", { state: { book } });
  };

  // 북마크 추가 함수
  const handleBookmarkAdd = async () => {
    try {
      await onBookmarkAdd();
      setBookmarkMessage('북마크가 성공적으로 추가되었습니다.');
      setTimeout(() => setBookmarkMessage(''), 2000);
    } catch {
      setBookmarkMessage('북마크 추가 중 오류가 발생했습니다.');
      setTimeout(() => setBookmarkMessage(''), 2000);
    }
  };

  const handleBookmarkClick = (book_mark: string) => {
    if (goToBookmark) {
      goToBookmark(book_mark);
    }
  };

  const handleFetchBookmarks = async () => {
    if (fetchBookmarks) {
      try {
        const bookmarks = await fetchBookmarks();  // 객체로 반환된 데이터를 처리
        setBookmarks(bookmarks.readingBookmarks);  // book_reading 테이블 북마크 설정
        setEyegazeBookmark(bookmarks.eyegazeBookmark);  // book_eyegaze 테이블 북마크 설정
        setShowBookmarksList((prev) => !prev);
      } catch {
        setBookmarkMessage('북마크를 가져오는 중 오류가 발생했습니다.');
      }
    }
  };

  const handleBookmarkRemove = async (book_mark: string) => {
    // 수동 북마크 삭제 로직 (DB에 반영)
    if (bookmarks.some((bookmark) => bookmark.book_mark === book_mark)) {
      if (onBookmarkRemove) {
        try {
          // DB에서 수동 북마크 삭제
          await onBookmarkRemove(book_mark);
          // UI에서도 북마크 삭제
          setBookmarks((prevBookmarks) =>
            prevBookmarks.filter((bookmark) => bookmark.book_mark !== book_mark)
          );
          setBookmarkMessage('북마크가 삭제되었습니다.');
        } catch (error) {
          console.error('북마크 삭제 중 오류 발생:', error);
          setBookmarkMessage('북마크 삭제 중 오류가 발생했습니다.');
        }
      }
    }
  };

  // eyegaze 북마크 삭제 API 호출 함수
  const handleEyegazeBookmarkRemove = async () => {
    if (eyegazeBookmark && book && userInfo) {
      try {
        const response = await fetch('http://localhost:3001/getBookPath/removeEyegazeBookmark', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            book_idx: book.book_idx,
            mem_id: userInfo.mem_id,
          }),
        });

        if (response.ok) {
          setEyegazeBookmark(null);  // UI에서 eyegaze 북마크 삭제
          setBookmarkMessage('eyegaze 북마크가 삭제되었습니다.');
          setTimeout(() => setBookmarkMessage(''), 2000);
        } else {
          throw new Error('서버 오류');
        }
      } catch (error) {
        console.error('eyegaze 북마크 삭제 중 오류 발생:', error);
        setBookmarkMessage('eyegaze 북마크 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <Wrapper style={{ fontFamily: selectedFont }} key={selectedFont}> {/* 선택한 폰트를 전체 Wrapper에 적용 */}
      <Layout>
        <AutoLayout>
          <div>
            <ControlBtn message="Sound" onClick={handleSoundClick} />
            <ControlBtn message="Bookmark" onClick={handleBookmarkToggle} />
            <ControlBtn message="Font Settings" onClick={handleFontClick} />
            <ControlBtn message="독서 완료" onClick={handleReadingComplete} />
            <ControlBtn message="독서 종료" onClick={handleReadingQuit} />
          </div>
        </AutoLayout>
      </Layout>

      <TTSWrapper show={showTTSSettings} onClose={handleClose} title="Sound">
        <TTSManager
          onTTSToggle={onTTSToggle}
          onTTSStop={onTTSStop}
          onTTSPause={onTTSPause}
          onTTSResume={onTTSResume}
          rate={rate}
          gender={gender}
          onRateChange={onRateChange}
          onVoiceChange={onVoiceChange}
          setAudioSource={setAudioSource}
        />
      </TTSWrapper>

      {/* 북마크 UI */}
      <TTSWrapper show={showBookmarkSettings} onClose={() => setShowBookmarkSettings(false)} title="Bookmark">
        <div className="Header-bookmark-settings">
          <button className="Header-custom-button" onClick={handleBookmarkAdd}>Add Current Page to Bookmarks</button>
          <br />
          <button className="Header-custom-button" onClick={handleFetchBookmarks}>
            {showBookmarksList ? 'Hide Bookmarks' : 'View Bookmarks'}
          </button>
          {bookmarkMessage && <p>{bookmarkMessage}</p>}
          {showBookmarksList && (
            <div className="Header-bookmark-list">
              {/* Book Reading Bookmarks */}
              <h4>Book Reading Bookmarks</h4>
              {bookmarks && bookmarks.length > 0 ? (
                bookmarks.map((bookmark, index) => (
                  <div key={index} className="Header-bookmark-item">
                    <button className="Header-custom-button" onClick={() => handleBookmarkClick(bookmark.book_mark)}>
                      {`Bookmark ${index + 1}`}
                    </button>
                    <button className="Header-remove-button" onClick={() => handleBookmarkRemove(bookmark.book_mark)}>
                      -
                    </button>
                  </div>
                ))
              ) : (
                <p>No Book Reading Bookmarks</p>
              )}

              {/* Eye Gaze Bookmark */}
              <h4>Eye Gaze Bookmark</h4>
              {eyegazeBookmark ? (
                <div className="Header-bookmark-item">
                  <button className="Header-custom-button" onClick={() => handleBookmarkClick(eyegazeBookmark.book_mark)}>
                    Eye Gaze Bookmark
                  </button>
                  <button className="Header-remove-button" onClick={handleEyegazeBookmarkRemove}>
                    -
                  </button>
                </div>
              ) : (
                <p>No Eye Gaze Bookmark</p>
              )}
            </div>
          )}

        </div>
      </TTSWrapper>

      <TTSWrapper show={showFontSettings} onClose={handleClose} title="Font Settings">
        <div className="Header-font-settings">
          <div className="slider-container">
            <label htmlFor="font-size-slider">Font Size</label>
            <br />
            <div className="font-size-control">
              <p className='current-font'>{fontSize}</p> {/* 현재 선택된 폰트 크기 표시 */}
              <button className="font-minus" onClick={decreaseFontSize} disabled={fontSize <= 12}>-</button>
              <input
                type="range"
                id="font-size-slider"
                min="12"
                max="32"
                value={fontSize}
                onChange={handleSliderChange}
                className="font-size-slider"
              />
              <button className="font-plus" onClick={increaseFontSize} disabled={fontSize >= 32}>+</button>
            </div>
          </div>
        </div>
      </TTSWrapper>
    </Wrapper>
  );
};

interface Props {
  onNavToggle: (value?: boolean) => void;
  onOptionToggle: (value?: boolean) => void;
  onLearningToggle: (value?: boolean) => void;
  onTTSToggle?: (settings: { rate: number; gender: "MALE" | "FEMALE" }) => void;
  onTTSStop?: () => void;
  onTTSPause?: () => void;
  onTTSResume?: () => void;
  onBookmarkAdd?: () => void;
  onFontChange?: (font: string) => void;
  rate: number;
  gender: "MALE" | "FEMALE";
  onRateChange: (rate: number) => void;
  onVoiceChange: (gender: "MALE" | "FEMALE") => void;
  setAudioSource: (audioUrl: string) => void;
  book?: { [key: string]: any };
  userInfo?: { mem_id: string };
  fetchBookmarks?: () => Promise<{ readingBookmarks: { book_mark: string; book_text: string }[], eyegazeBookmark: { book_mark: string; book_text: string } | null }>;
  goToBookmark?: (cfi: string) => void;
  onReadingComplete?: () => void;
  onReadingQuit?: () => void;
  onBookmarkRemove?: (book_mark: string) => void;
  onFontSizeChange?: (action: 'increase' | 'decrease') => void;
}

export default Header;
