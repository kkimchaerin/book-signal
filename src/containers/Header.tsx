import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // useNavigate import 추가
import Wrapper from "components/header/Wrapper";
import Layout, { AutoLayout } from "components/header/Layout";
import ControlBtn from "components/header/ControlBtn";
import TTSManager from "components/tts/TTSManager";
import TTSWrapper from "components/tts/TTSWrapper";
import { handleSummarize } from "../components/SummarizePage"; // handleSummarize 함수 import 추가

const Header = ({
  rate,
  gender,
  onRateChange,
  onVoiceChange,
  onTTSToggle,
  onTTSPause,
  onTTSStop,
  onTTSResume,
  onBookmarkAdd = () => {},
  onFontChange = () => {},
  setAudioSource,
  book,
  userInfo, // userInfo를 props로 받아야 합니다.
}: Props) => {
  // Props 확인 로그
  console.log("Header Props:", {
    rate,
    gender,
    onRateChange,
    onVoiceChange,
    onTTSToggle,
    onTTSPause,
    onTTSStop,
    onTTSResume,
    onBookmarkAdd,
    onFontChange,
    setAudioSource,
    book,
    userInfo,
  });
  const [showTTSSettings, setShowTTSSettings] = useState(false);
  const [showBookmarkSettings, setShowBookmarkSettings] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [bookmarkMessage, setBookmarkMessage] = useState(""); // 북마크 메시지 상태 추가

  const navigate = useNavigate(); // useNavigate 훅 초기화

  const handleSoundClick = () => {
    setShowTTSSettings(true);
  };

  const handleTTSSettingsClose = () => {
    setShowTTSSettings(false);
  };

  const handleBookmarkClick = () => {
    setShowBookmarkSettings(!showBookmarkSettings);
  };

  const handleFontClick = () => {
    setShowFontSettings(!showFontSettings);
  };

  // 독서 완료 처리 함수
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
      setBookmarkMessage("북마크가 성공적으로 추가되었습니다."); // 북마크 성공 메시지 설정
    } catch (error) {
      setBookmarkMessage("북마크 추가 중 오류가 발생했습니다."); // 실패 메시지 설정
    }
  };

  return (
    <Wrapper>
      <Layout>
        <AutoLayout>
          <div>
            {/* Sound 버튼 */}
            <ControlBtn message="Sound" onClick={handleSoundClick} />

            {/* Bookmark 버튼, Sound 버튼과 동일한 스타일로 적용 */}
            <ControlBtn message="Bookmark" onClick={handleBookmarkClick} />

            {/* Font Settings 버튼 */}
            <ControlBtn message="Font Settings" onClick={handleFontClick} />

            {/* 독서 완료 및 종료 버튼 */}
            <ControlBtn message="독서 완료" onClick={handleReadingComplete} />
            <ControlBtn message="독서 종료" onClick={handleReadingQuit} />
          </div>
        </AutoLayout>
      </Layout>

      {/* TTS 설정 창 */}
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

      {/* Bookmark 설정을 위한 모달 또는 드롭다운을 설정할 수 있습니다. */}
      {showBookmarkSettings && (
        <div className="bookmark-settings">
          <button onClick={handleBookmarkAdd}>
            Add Current Page to Bookmarks
          </button>
          {bookmarkMessage && <p>{bookmarkMessage}</p>}{" "}
          {/* 북마크 메시지 표시 */}
        </div>
      )}

      {/* Font 설정 창 */}
      {showFontSettings && (
        <div className="font-settings">
          <button onClick={() => onFontChange("Arial")}>Arial</button>
          <button onClick={() => onFontChange("Georgia")}>Georgia</button>
          <button onClick={() => onFontChange("Times New Roman")}>
            Times New Roman
          </button>
          <button onClick={() => onFontChange("Courier New")}>
            Courier New
          </button>
        </div>
      )}
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
  book?: { [key: string]: any }; // book 객체의 타입 추가 (적절한 타입으로 수정 가능)
  userInfo?: { mem_id: string }; // userInfo 객체의 타입 추가 (적절한 타입으로 수정 가능)
}

export default Header;
