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
  userInfo,
  fetchBookmarks,
  goToBookmark,
  onReadingComplete,
  onReadingQuit,
  onBookmarkRemove,
}: Props) => {
  const [showTTSSettings, setShowTTSSettings] = useState(false);
  const [showBookmarkSettings, setShowBookmarkSettings] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [bookmarkMessage, setBookmarkMessage] = useState('');
  const [bookmarks, setBookmarks] = useState<{ book_mark: string; book_text: string }[]>([]);
  const [showBookmarksList, setShowBookmarksList] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Noto Sans KR'); // 기본 폰트: Noto Sans KR
  const [eyegazeBookmark, setEyegazeBookmark] = useState<{ book_mark: string; book_text: string } | null>(null);

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

  const handleReadingComplete = async () => {
    if (userInfo && book) {
      const { mem_id } = userInfo;
      const { book_idx } = book;

      const summarizeResult = await handleSummarize(mem_id, book_idx);

      if (summarizeResult.success) {
        console.log("요약 생성 및 저장 성공:", summarizeResult.summary);
      } else {
        console.error("요약 생성 실패:", summarizeResult.error);
      }

      navigate("/detail", { state: { book } });
    } else {
      console.warn("사용자 정보 또는 책 정보가 없습니다.");
    }
  };

  const handleReadingQuit = () => {
    navigate("/detail", { state: { book } });
  };

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

  // 폰트 변경 처리 함수
  const handleFontChange = (font: string) => {
    setSelectedFont(font);  // 선택한 폰트 상태 업데이트
    console.log(`폰트 변경됨: ${font}`);  // 폰트 변경 로그

    if (onFontChange) {
      onFontChange(font);  // EpubReader로 폰트 변경 알림
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
          <button onClick={() => handleFontChange('FreeSerif')}>FreeSerif</button>
          <button onClick={() => handleFontChange('FreeSerifBold')}>FreeSerifBold</button>
          <button onClick={() => handleFontChange('FreeSerifItalic')}>FreeSerifItalic</button>
          <button onClick={() => handleFontChange('FreeSerifBoldItalic')}>FreeSerifBoldItalic</button>
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
}

export default Header;
