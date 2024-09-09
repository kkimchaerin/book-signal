import Dropdown from 'components/option/Dropdown';

const TTSVoiceControl = ({ gender, onSelect }: { gender: "MALE" | "FEMALE"; onSelect: (gender: "MALE" | "FEMALE") => void; }) => {
    const voiceOptions: ("MALE" | "FEMALE")[] = ["MALE", "FEMALE"];

  return (
    <Dropdown
      title="Select Voice"
      defaultValue={gender}
      valueList={voiceOptions}
      onSelect={onSelect}
    />
  );
};

export default TTSVoiceControl;