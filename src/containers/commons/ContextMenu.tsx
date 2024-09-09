import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
// components
import Wrapper from 'components/contextMenu/Wrapper';
import ColorItem from 'components/contextMenu/ColorItem';
import Item from 'components/contextMenu/Item';
// utils
import { getParagraphCfi } from 'lib/utils/commonUtil';
// slices
import { contextmenuWidth } from 'lib/styles/viewerLayout';
// types
import { RootState } from 'slices';
import Highlight, { Color } from 'types/highlight';
import Selection from 'types/selection';

const ContextMenu = ({
  active,
  viewerRef,
  selection,
  onAddHighlight,
  onRemoveHighlight,
  onUpdateHighlight,
  onContextmMenuRemove
}: Props) => {
  console.log('ContextMenu Rendered');
  console.log('Active:', active);
  console.log('Selection:', selection);

  const highlights = useSelector<RootState, Highlight[]>(state => state.book.highlights);
  const colorList = useSelector<RootState, Color[]>(state => state.book.colorList);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [display, setDisplay] = useState<boolean>(false);
  const [isEraseBtn, setIsEraseBtn] = useState<boolean>(false);
  const [isReverse, setIsReverse] = useState<boolean>(false);
  const [height, setHeight] = useState<number>(0);
  const [x, setX] = useState<number>(selection?.x || 0);  // 기본값 설정
  const [y, setY] = useState<number>(selection?.y || 0);  // 기본값 설정

  const ColorList = colorList.map(
    color => (
      <ColorItem
        key={color.code}
        name={color.name}
        color={color.code}
        onClick={selection?.update
          ? () => onUpdateHighlight(highlight, color.code)
          : () => onAddHighlight(color.code)
        }
      />
    )
  );

  /** Remove highlight */
  const onRemoveHighlight_ = useCallback(() => {
    if (!highlight) return;

    onRemoveHighlight(highlight.key, highlight.cfiRange);
    if (typeof onContextmMenuRemove === 'function') {
      onContextmMenuRemove();
    }

    setIsEraseBtn(false);
  }, [highlight, onRemoveHighlight, onContextmMenuRemove]);

  /** 
   * Remove contextmenu
   * @param e Mouse Event
   */
  const onRemove = useCallback((e: MouseEvent) => {
    if (!menuRef.current) return;

    const path = e.composedPath();

    if (path.includes(menuRef.current)) return;
    if (typeof onContextmMenuRemove === 'function') {
      onContextmMenuRemove();
    }
  }, [menuRef, onContextmMenuRemove]);

  /** 
   * Arrow event
   * @param e Keyboard Event
   * @param e.key
   */
  const onKeyPress = useCallback(({ key }: KeyboardEvent) => {
    if ((key === "ArrowLeft" || key === "ArrowRight") && typeof onContextmMenuRemove === 'function') {
      onContextmMenuRemove();
    }
  }, [onContextmMenuRemove]);

  /** Check whether the menu button is visible */
  useEffect(() => {
    console.log("Checking if ContextMenu should be displayed");
    if (!active) setIsEraseBtn(false);

    const paragraphCfi = getParagraphCfi(selection?.cfiRange || '');
    if (!paragraphCfi) return;

    const filtered = highlights.filter(highlight => highlight.key === paragraphCfi + (selection?.cfiRange || ''));

    if (!filtered.length) return;
    const highlight_ = filtered[0];
    setHighlight(highlight_);

    if (selection?.update) {
      setIsEraseBtn(true);
    } else {
      setIsEraseBtn(false);
    }
  }, [
    active,
    highlights,
    selection?.cfiRange,
    selection?.update
  ]);

  /** Register contextmenu events */
  useEffect(() => {
    console.log("Registering context menu events");
    if (!viewerRef.current) return;

    const iframe = document.querySelector('iframe');
    const node = iframe && iframe.contentWindow && iframe.contentWindow.document;
    const scrolledTarget = viewerRef.current.querySelector('div');

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      setX(event.clientX);
      setY(event.clientY);
      setDisplay(true);
    };

    if (active) {
      setDisplay(true);
      scrolledTarget && scrolledTarget.addEventListener('scroll', onContextmMenuRemove);
      node && node.addEventListener('mousedown', onRemove);
      node && node.addEventListener('keyup', onKeyPress);
      document.addEventListener('mousedown', onRemove);
      document.addEventListener('keyup', onKeyPress);
      document.addEventListener('contextmenu', handleContextMenu);  // 클릭 시 ContextMenu 실행
    } else {
      setDisplay(false);
      scrolledTarget && scrolledTarget.removeEventListener('scroll', onContextmMenuRemove);
      node && node.removeEventListener('mousedown', onRemove);
      node && node.removeEventListener('keyup', onKeyPress);
      document.removeEventListener('mousedown', onRemove);
      document.removeEventListener('keyup', onKeyPress);
      document.removeEventListener('contextmenu', handleContextMenu);  // 클릭 이벤트 제거
    }

    return () => {
      node && node.removeEventListener('mousedown', onContextmMenuRemove);
      node && node.removeEventListener('keyup', onKeyPress);
      document.removeEventListener('keyup', onKeyPress);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [
    viewerRef,
    active,
    onRemove,
    onContextmMenuRemove,
    onKeyPress
  ]);

  /** Set modified contextmenu height & whether menu is reverse */
  useEffect(() => {
    const menuPadding = 8;
    const itemHeight = 32;
    let itemCnt = ColorList.length;

    if (isEraseBtn) itemCnt += 1;

    const defaultHeight = itemCnt * itemHeight + menuPadding;
    const { innerHeight } = window;

    if (y + defaultHeight > innerHeight) {
      let newY = y - (selection?.height ?? 0) - defaultHeight; // 기본값 0 사용
      if (newY < 0) {
        setHeight(defaultHeight + newY - 8);
        newY = 8;
      } else {
        setHeight(defaultHeight);
      }
      setY(newY);
      setIsReverse(true);
    } else {
      setHeight(defaultHeight);
      setIsReverse(false);
    }

  }, [
    y,
    selection?.height,
    ColorList,
    isEraseBtn,
    setHeight
  ]);

  return (
    <>
      {display && (
        <Wrapper
          x={x}
          y={y}
          width={contextmenuWidth}
          height={height}
          isReverse={isReverse}
          ref={menuRef}
        >
          <div>
            {ColorList}
            {isEraseBtn && <Item text="Remove" onClick={onRemoveHighlight_} />}
          </div>
        </Wrapper>
      )}
    </>
  );
};

interface Props {
  active: boolean;
  viewerRef: any;
  selection: Selection | null;
  onAddHighlight: (color: string) => void;
  onRemoveHighlight: (key: string, cfiRange: string) => void;
  onUpdateHighlight: (highlight: Highlight | null, color: string) => void;
  onContextmMenuRemove: () => void; // This should remain a function type
}

export default ContextMenu;
