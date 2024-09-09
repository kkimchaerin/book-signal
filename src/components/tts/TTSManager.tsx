import React, { useState, useRef } from 'react';
import TTSSettings from './TTSSettings';
import TTSToggle from './TTSToggle';

interface TTSManagerProps {
  onTTSToggle?: (settings: { rate: number; gender: 'MALE' | 'FEMALE' }) => void;
  onTTSPause?: () => void;
  onTTSStop?: () => void;
  onTTSResume?: () => void;
  rate: number;
  gender: 'MALE' | 'FEMALE';
  onRateChange: (rate: number) => void;
  onVoiceChange: (gender: 'MALE' | 'FEMALE') => void;
  setAudioSource: (audioUrl: string) => void; // setAudioSource 함수 추가
}

const TTSManager: React.FC<TTSManagerProps> = ({
  onTTSToggle,
  onTTSPause,
  onTTSStop,    
  rate,
  gender,
  onRateChange,
  onVoiceChange,
  onTTSResume,
  setAudioSource,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleToggle = () => {
    if (isPlaying && !isPaused) {
      if (onTTSPause) {
        onTTSPause(); // 일시정지 함수 호출
      }
      setIsPaused(true);
    } else if (isPlaying && isPaused) {
      if (onTTSResume) {
        onTTSResume(); // 재개 함수 호출
      }
      setIsPaused(false);
    } else {
      if (onTTSToggle) {
        onTTSToggle({ rate, gender });
      }
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (onTTSStop) {
      onTTSStop();
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div>
      <TTSSettings
        rate={rate}
        gender={gender}
        onRateChange={onRateChange}
        onVoiceChange={onVoiceChange}
      />
      <TTSToggle isPlaying={isPlaying} onToggle={handleToggle} onStop={handleStop} isPaused={isPaused} />
    </div>
  );
};

export default TTSManager;
