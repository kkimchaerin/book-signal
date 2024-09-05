import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import zIndex from 'lib/styles/zIndex';
import palette from 'lib/styles/palette';
import * as styles from 'lib/styles/styles';
import Slider from 'components/option/Slider'; // Slider 컴포넌트 가져오기

interface FontSettingsWrapperProps {
  show: boolean;
  onClose: () => void;
  onFontSizeChange: (size: number) => void; // 폰트 크기 변경 함수
  fontSize: number; // 현재 폰트 크기 상태
  children: React.ReactNode;
}

const FontSettingsWrapper: React.FC<FontSettingsWrapperProps> = ({
  show,
  onClose,
  onFontSizeChange,
  fontSize,
  children
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onClose();
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
        <Title>Font Settings</Title>
        <CloseButton onClick={onClose}>✕</CloseButton>
      </Header>
      <Content>
        {children}
        {/* 폰트 크기 조절 슬라이더 추가 */}
        <Slider
          active={true}
          title="Font Size"
          minValue={10}
          maxValue={40}
          defaultValue={fontSize}
          step={1}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
        />
        {/* 폰트 선택 버튼 */}
        <div className="font-settings">
          <button onClick={() => onFontSizeChange(12)}>Arial</button>
          <button onClick={() => onFontSizeChange(16)}>Georgia</button>
          <button onClick={() => onFontSizeChange(18)}>Times New Roman</button>
          <button onClick={() => onFontSizeChange(24)}>Courier New</button>
        </div>
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

export default FontSettingsWrapper;
