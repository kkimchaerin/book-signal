import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Wrapper from 'components/header/Wrapper';
import Layout, { AutoLayout } from 'components/header/Layout';
import ControlBtn from 'components/header/ControlBtn';
import TTSManager from 'components/tts/TTSManager';
import TTSWrapper from 'components/tts/TTSWrapper';
import '../css/ReaderHeader.css';
import { handleSummarize } from 'components/SummarizePage';

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
  onFontChange = () => { },
  setAudioSource,
  book,
  fetchBookmarks,
  goToBookmark,
  onReadingComplete,
  onReadingQuit,
  onBookmarkRemove,
  userInfo, // userInfo를 props로 받아야 합니다.
}: Props) => {
  const [showTTSSettings, setShowTTSSettings] = useState(false);
  const [showBookmarkSettings, setShowBookmarkSettings] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [bookmarkMessage, setBookmarkMessage] = useState('');
  const [bookmarks, setBookmarks] = useState<{ book_mark: string; book_text: string }[]>([]);
  const [showBookmarksList, setShowBookmarksList] = useState(false); // 북마크 리스트 보여주기 상태 추가

  const navigate = useNavigate();

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
  };


  // 독서 완료 처리 함수
  // api 호출
  const handleReadingComplete = async () => {
    console.log("독서 완료 처리 시작"); // 함수 호출 시작 로그

    if (userInfo && book) {
      const { mem_id } = userInfo;
      const { book_idx } = book;

      console.log("사용자 정보:", { mem_id }); // 사용자 ID 로그
      console.log("책 정보:", { book_idx }); // 책 인덱스 로그

      // 요약 생성 요청
      console.log("요약 생성 요청 중..."); // 요약 요청 시작 로그
      const summarizeResult = await handleSummarize(mem_id, book_idx);

      if (summarizeResult.success) {
        console.log("요약 생성 및 저장 성공:", summarizeResult.summary); // 성공 로그
      } else {
        console.error("요약 생성 실패:", summarizeResult.error); // 실패 로그
      }

      console.log("상세 페이지로 네비게이션 중..."); // 페이지 이동 로그
      navigate("/detail", { state: { book } });
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

      // 일정 시간 후에 메시지를 지우기 위해 setTimeout 사용
      setTimeout(() => {
        setBookmarkMessage('');
      }, 2000); // 2000ms (2초) 후에 메시지 사라짐
    } catch (error) {
      setBookmarkMessage('북마크 추가 중 오류가 발생했습니다.');

      // 오류 메시지도 일정 시간 후에 사라지도록 설정
      setTimeout(() => {
        setBookmarkMessage('');
      }, 2000); // 2000ms (2초) 후에 메시지 사라짐
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
        const bookmarks = await fetchBookmarks();
        setBookmarks(bookmarks);
        setShowBookmarksList((prev) => !prev); // 리스트 보여주기 상태를 토글
      } catch (error) {
        setBookmarkMessage('북마크를 가져오는 중 오류가 발생했습니다.');
      }
    }
  };


  const handleBookmarkRemove = (book_mark: string) => {
    if (onBookmarkRemove) {
      onBookmarkRemove(book_mark);  // 여기서 props로 전달된 onBookmarkRemove를 호출
    }
    setBookmarks((prevBookmarks) =>
      prevBookmarks.filter((bookmark) => bookmark.book_mark !== book_mark)
    );
    setBookmarkMessage('북마크가 삭제되었습니다.');

    setTimeout(() => {
      setBookmarkMessage('');
    }, 2000); // 2000ms (2초) 후에 메시지 사라짐
  };



  return (
    <Wrapper>
      <Layout>
        <AutoLayout>
          <div>
            <ControlBtn message="Sound" onClick={handleSoundClick} />
            <ControlBtn message="Bookmark" onClick={handleBookmarkToggle} />
            <ControlBtn message="Font Settings" onClick={handleFontClick} />
            <ControlBtn message="독서 완료" onClick={handleFinishReading} />
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

      <TTSWrapper show={showBookmarkSettings} onClose={handleClose} title="Bookmark">
        <div className="Header-bookmark-settings">
          <button className="Header-custom-button" onClick={handleBookmarkAdd}>Add Current Page to Bookmarks</button>
          <br />
          <button className="Header-custom-button" onClick={handleFetchBookmarks}>
            {showBookmarksList ? 'Hide Bookmarks' : 'View Bookmarks'}
          </button>
          {bookmarkMessage && <p>{bookmarkMessage}</p>}
          {showBookmarksList && (
            <div className="Header-bookmark-list">
              {bookmarks.map((bookmark, index) => (
                <div key={index} className="Header-bookmark-item">
                  <button className="Header-custom-button" onClick={() => handleBookmarkClick(bookmark.book_mark)}>
                    {`Bookmark ${index + 1}`}
                  </button>
                  <button className="Header-remove-button" onClick={() => handleBookmarkRemove(bookmark.book_mark)}>  {/* 여기 수정 */}
                    -
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </TTSWrapper>

      <TTSWrapper show={showFontSettings} onClose={handleClose} title="Font Settings">
        <div className="Header-font-settings">
          <button onClick={() => onFontChange('Arial')}>Arial</button>
          <button onClick={() => onFontChange('Georgia')}>Georgia</button>
          <button onClick={() => onFontChange('Times New Roman')}>Times New Roman</button>
          <button onClick={() => onFontChange('Courier New')}>Courier New</button>
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
  fetchBookmarks?: () => Promise<{ book_mark: string; book_text: string }[]>;
  goToBookmark?: (cfi: string) => void;
  onReadingComplete?: () => void;
  onReadingQuit?: () => void;
  onBookmarkRemove?: (book_mark: string) => void;
}

export default Header;
