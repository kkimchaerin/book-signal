import { useState, useEffect, useCallback } from 'react';

/**
 * Epub Reader 메뉴를 컨트롤 하는 hook
 */
function useMenu(ref: { current: any }, delay: number) {
  const [eventSignal, setEventSignal] = useState<boolean>(true);
  const [control, setControl] = useState<MenuControl>({
    display: false,
    open: false
  });

  /** Menu 토글 */
  const onToggle = useCallback(() => {
    let event: any = null;
    window.clearTimeout(event);
    if (!control.display) {
      setControl({ display: true, open: false });
      event = window.setTimeout(() => setControl({ display: true, open: true }), 0);
    } else {
      setControl({ display: true, open: false });
      event = window.setTimeout(() => setControl({ display: false, open: false }), delay - 50);
    }
  }, [control.display, delay]);

  /** 
   * 메뉴 닫기 
   */
  const onClose = useCallback((e: any) => {
    if (!ref.current) return;

    // 이벤트 경로가 ref.current를 포함하는지 확인
    const path = e.composedPath && e.composedPath();
    if (path && !path.includes(ref.current)) {
      onToggle();
    }
  }, [ref, onToggle]);

  /** 
   * 이벤트 재등록
   */
  const emitEvent = useCallback(() => {
    window.setTimeout(() => setEventSignal(true), 300);
  }, [setEventSignal]);

  /** 
   * 목차 닫기 이벤트 등록 
   */
  useEffect(() => {
    if (!eventSignal && !control.display) return;

    const epubIframe = document.querySelector('iframe');

    if (control.display) {
      document.addEventListener('click', onClose, true); // 캡처링 단계에서 이벤트 잡기
      if (epubIframe && epubIframe.contentWindow) {
        epubIframe.contentWindow.document.addEventListener('click', onClose, true);
      }
    } else {
      document.removeEventListener('click', onClose, true);
      if (epubIframe && epubIframe.contentWindow) {
        epubIframe.contentWindow.document.removeEventListener('click', onClose, true);
      }
    }

    setEventSignal(false);

    return () => {
      document.removeEventListener('click', onClose, true);
      if (epubIframe && epubIframe.contentWindow) {
        epubIframe.contentWindow.document.removeEventListener('click', onClose, true);
      }
    }
  }, [control.display, onClose, eventSignal]);

  return [control, onToggle, emitEvent] as const;
}

export type MenuControl = {
  display: boolean;
  open: boolean;
}

export default useMenu;
