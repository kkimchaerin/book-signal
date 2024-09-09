import React from 'react';
import Slider from 'components/option/Slider';

interface Props {
  rate: number;
  onChange: (value: number) => void;
}

const TTSRateControl: React.FC<Props> = ({ rate, onChange }) => {
  return (
    <Slider
      title="Speed"
      minValue={0.5}
      maxValue={2}
      defaultValue={rate}
      step={0.1}
      active={true}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
  );
};

export default TTSRateControl;
