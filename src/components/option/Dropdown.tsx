import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
// components
import OptionWrapper from 'components/option/OptionWrapper';
import OptionTitle from 'components/option/OptionTitle';
import DropdownValue from 'components/option/DropdownValue';
import DropdownItemWrapper from 'components/option/DropdownItemWrapper';
import DropdownItem from 'components/option/DropdownItem';

interface Props<T extends string> {  // 제네릭 타입 T를 문자열로 제한
  title: string;
  defaultValue: T;
  valueList: T[];
  onSelect: (value: T) => void;
}

const Dropdown = <T extends string>({ title, defaultValue, valueList, onSelect }: Props<T>) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const value = defaultValue;

  /** Toggle dropdown */
  const onToggle = useCallback(() => setVisible(!visible), [visible]);

  /** Close dropdown */
  const onClose = useCallback((e: MouseEvent) => {
    if (!ref.current) return;

    const path = e.composedPath();
    if (!path.includes(ref.current)) {
      onToggle();
    }
  }, [ref, onToggle]);

  const Items = valueList.map((font, index) => 
    <DropdownItem key={index} value={font} onClick={() => {
      onSelect(font);
      onToggle();
    }} />
  );

  /** Register dropdown close event */
  useEffect(() => {
    if (visible) {
      document.addEventListener('click', onClose);
    } else {
      document.removeEventListener('click', onClose);
    }
    return () => {
      document.removeEventListener('click', onClose);
    }
  }, [visible, onClose]);

  return (
    <OptionWrapper>
      <OptionTitle>{title}</OptionTitle>

      <DropdownWrapper ref={ref}>
        <DropdownValue value={value}  // value를 그대로 전달
                       isDropdown={visible} 
                       onClick={onToggle} />
        <DropdownItemWrapper show={visible}>
          {Items}
        </DropdownItemWrapper>
      </DropdownWrapper>
    </OptionWrapper>
  );
}

const DropdownWrapper = styled.div`
  position: relative;
`;

export default Dropdown;
