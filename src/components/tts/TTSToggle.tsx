import React from 'react';
import styled from 'styled-components';

interface Props {
  isPlaying: boolean;
  isPaused: boolean; 
  onToggle: () => void;
  onStop: () => void;
}

const TTSToggle: React.FC<Props> = ({ isPlaying,isPaused, onToggle, onStop }) => {
  return (
    <Container>
      <Button onClick={onToggle}>
      {isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Play'}
      </Button>
      <Button onClick={onStop}>Stop</Button>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
`;

const Button = styled.button`
  margin: 0 8px;
  padding: 8px 16px;
  cursor: pointer;
`;

export default TTSToggle;
