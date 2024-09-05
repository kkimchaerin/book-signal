import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import zIndex from 'lib/styles/zIndex';
import palette from 'lib/styles/palette';
import * as styles from 'lib/styles/styles';

interface TTSWrapperProps {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;  // 제목을 prop으로 받음
}

const TTSWrapper: React.FC<TTSWrapperProps> = ({ show, onClose, children, title }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onClose();  // TTS 패널 바깥을 클릭하면 onClose 호출
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, onClose]);

  return (
    <Wrapper show={show} ref={wrapperRef}>
      <Header>
        <Title>{title}</Title>
        <CloseButton onClick={onClose}>✕</CloseButton>
      </Header>
      <Content>
        {children}
      </Content>
    </Wrapper>
  );
};

const Wrapper = styled.div<{ show: boolean }>`
  display: flex;
  flex-direction: column;
  position: fixed;
  width: 340px;
  max-width: 95vw;
  height: 100vh;
  top: 0;
  right: 0;
  z-index: ${zIndex.menu};
  box-shadow: -4px 0 8px 0 rgba(0,0,0,.16);
  background-color: ${palette.white};
  border-radius: 16px 0 0 16px;
  transform: ${({ show }) => show ? `translateX(0px) scale(1)` : `translateX(420px) scale(.9)`};
  transition: .4s ${styles.transition};
  overflow-y: auto;
  ${styles.scrollbar(0)};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${palette.gray2};
`;

const Title = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${palette.black};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: ${palette.black};

  &:hover {
    color: ${palette.red0};
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 16px;
`;

export default TTSWrapper;
