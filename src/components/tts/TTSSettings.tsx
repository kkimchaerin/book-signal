import React from 'react';
import TTSRateControl from './TTSRateControl';
import TTSVoiceControl from './TTSVoiceControl';

interface TTSSettingsProps {
    rate: number;
    gender: 'MALE' | 'FEMALE'; // 타입을 'MALE' | 'FEMALE'로 수정
    onRateChange: (rate: number) => void;
    onVoiceChange: (gender: 'MALE' | 'FEMALE') => void;
  }
  
  const TTSSettings: React.FC<TTSSettingsProps> = ({ rate, gender, onRateChange, onVoiceChange }) => {
    return (
      <div>
        <TTSRateControl rate={rate} onChange={onRateChange} />
        <TTSVoiceControl gender={gender} onSelect={onVoiceChange} />
      </div>
    );
  };
  
  export default TTSSettings;