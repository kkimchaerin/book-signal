import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Wrapper from 'components/header/Wrapper';
import Layout, { AutoLayout } from 'components/header/Layout';
import ControlBtn from 'components/header/ControlBtn';
import TTSManager from 'components/tts/TTSManager';
import TTSWrapper from 'components/tts/TTSWrapper';

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
  goToBookmark, // 추가된 prop
  onReadingComplete,
  onReadingQuit,
}) => {
  const [showTTSSettings, setShowTTSSettings] = useState(false);
  const [showBookmarkSettings, setShowBookmarkSettings] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [bookmarkMessage, setBookmarkMessage] = useState('');
  const [bookmarks, setBookmarks] = useState<{ book_mark: string; book_text: string }[]>([]); // 북마크 타입 지정

  const navigate = useNavigate();

  const handleSoundClick = () => {
    setShowTTSSettings(true);
  };

  const handleTTSSettingsClose = () => {
    setShowTTSSettings(false);
  };

  const handleBookmarkToggle = () => {
    setShowBookmarkSettings(!showBookmarkSettings);
  };

  const handleFontClick = () => {
    setShowFontSettings(!showFontSettings);
  };

  const handleFinishReading = () => {
    navigate('/detail', { state: { book } });
  };

  const handleReadingQuit = () => {
    if (onReadingQuit) {
      onReadingQuit();
    } else {
      navigate('/detail', { state: { book } });
    }
  };

  const handleBookmarkAdd = async () => {
    try {
      await onBookmarkAdd();
      setBookmarkMessage('북마크가 성공적으로 추가되었습니다.');
    } catch (error) {
      setBookmarkMessage('북마크 추가 중 오류가 발생했습니다.');
    }
  };

  const handleBookmarkClick = (book_mark: string) => {
    if (goToBookmark) { // goToBookmark가 정의되어 있는지 확인
      goToBookmark(book_mark);
    }
  };

  const handleFetchBookmarks = async () => {
    if (fetchBookmarks) { // fetchBookmarks가 정의되어 있는지 확인
      try {
        const bookmarks = await fetchBookmarks();
        setBookmarks(bookmarks);
      } catch (error) {
        setBookmarkMessage('북마크를 가져오는 중 오류가 발생했습니다.');
      }
    }
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

      <TTSWrapper show={showTTSSettings} onClose={handleTTSSettingsClose}>
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

      {showBookmarkSettings && (
        <div className="bookmark-settings">
          <button onClick={handleBookmarkAdd}>Add Current Page to Bookmarks</button>
          <br />
          <button onClick={handleFetchBookmarks}>View Bookmarks</button>
          {bookmarkMessage && <p>{bookmarkMessage}</p>}
          <div className="bookmark-list">
            {bookmarks.map((bookmark, index) => (
              <button key={index} onClick={() => handleBookmarkClick(bookmark.book_mark)}>
                {`Bookmark ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {showFontSettings && (
        <div className="font-settings">
          <button onClick={() => onFontChange('Arial')}>Arial</button>
          <button onClick={() => onFontChange('Georgia')}>Georgia</button>
          <button onClick={() => onFontChange('Times New Roman')}>Times New Roman</button>
          <button onClick={() => onFontChange('Courier New')}>Courier New</button>
        </div>
      )}
    </Wrapper>
  );
};

interface Props {
  onNavToggle: (value?: boolean) => void;
  onOptionToggle: (value?: boolean) => void;
  onLearningToggle: (value?: boolean) => void;
  onTTSToggle?: (settings: { rate: number; gender: 'MALE' | 'FEMALE' }) => void;
  onTTSStop?: () => void;
  onTTSPause?: () => void;
  onTTSResume?: () => void;
  onBookmarkAdd?: () => void;
  onFontChange?: (font: string) => void;
  rate: number;
  gender: 'MALE' | 'FEMALE';
  onRateChange: (rate: number) => void;
  onVoiceChange: (gender: 'MALE' | 'FEMALE') => void;
  setAudioSource: (audioUrl: string) => void;
  book?: { [key: string]: any };
  fetchBookmarks?: () => Promise<{ book_mark: string; book_text: string }[]>; // 이 부분 추가
  goToBookmark?: (cfi: string) => void; // 이 부분 추가
  onReadingComplete?: () => void;
  onReadingQuit?: () => void;
}

export default Header;
