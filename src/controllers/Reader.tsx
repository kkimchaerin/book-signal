import { useState, useRef,useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Provider } from 'react-redux'
// import { ReactEpubViewer } from 'react-epub-viewer'
// containers
import Header from 'containers/Header';
import Footer from 'containers/Footer';
import Nav from 'containers/menu/Nav';
import Option from 'containers/menu/Option';
import Learning from 'containers/menu/Note';
import ContextMenu from 'containers/commons/ContextMenu';
import Snackbar from 'containers/commons/Snackbar';
// components
import ViewerWrapper from 'components/commons/ViewerWrapper';
import LoadingView from 'LoadingView';
// slices
import store from 'slices';
import { updateBook, updateCurrentPage, updateToc } from 'slices/book';
// hooks
import useMenu from 'lib/hooks/useMenu';
import useHighlight from 'lib/hooks/useHighlight';
// styles
import 'lib/styles/readerStyle.css';
import viewerLayout from 'lib/styles/viewerLayout';
// types
import { RootState } from 'slices';
import { ViewerRef } from 'types';
import Book, { BookStyle, BookOption } from 'types/book';
import Page from 'types/page';
import Toc from 'types/toc';

const Reader = ({ url, loadingView }: Props) => {
  const dispatch = useDispatch();
  const currentLocation = useSelector<RootState, Page>(state => state.book.currentLocation);

  const viewerRef = useRef<ViewerRef | any>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const optionRef = useRef<HTMLDivElement | null>(null);
  const learningRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // 오디오 객체를 위한 ref

  const [isContextMenu, setIsContextMenu] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // TTS 상태 관리
  const [rate, setRate] = useState<number>(1); // TTS 배속 상태 관리
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE'); // TTS 음성 성별 상태 관리
  const [audioSource, setAudioSource] = useState<string | null>(null); // 오디오 소스 상태 관리


  const [bookStyle, setBookStyle] = useState<BookStyle>({
    fontFamily: 'Origin',
    fontSize: 30,
    lineHeight: 1.4,
    marginHorizontal: 15,
    marginVertical: 5
  });

  const [bookOption, setBookOption] = useState<BookOption>({
    flow: "paginated",
    resizeOnOrientationChange: true,
    spread: "none"
  });

  const [navControl, onNavToggle] = useMenu(navRef, 300);
  const [optionControl, onOptionToggle, emitEvent] = useMenu(optionRef, 300);
  const [learningControl, onLearningToggle] = useMenu(learningRef, 300);
  const {
    selection,
    onSelection,
    onClickHighlight,
    onAddHighlight,
    onRemoveHighlight,
    onUpdateHighlight
  } = useHighlight(viewerRef, setIsContextMenu, bookStyle, bookOption.flow);

 /**
   * TTS 실행 함수
   */
 const handleTTS = useCallback(({ rate, gender }: { rate: number, gender: 'MALE' | 'FEMALE' }) => {
    if (!isPlaying && viewerRef.current) {
      // TTS 시작 로직 구현
      setIsPlaying(true);
      console.log(`TTS started with rate: ${rate} and gender: ${gender}`);
    }
  }, [isPlaying]);

  /**
   * TTS 중지 함수
   */
  const stopTTS = useCallback(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause(); // 오디오 중지
      audioRef.current.currentTime = 0; // 오디오 재생 위치를 처음으로
      setIsPlaying(false);
      console.log('TTS stopped');
    }
  }, [isPlaying]);

  /**
   * TTS 일시 정지 함수
   */
  const pauseTTS = useCallback(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause(); // 오디오 일시 정지
      console.log('TTS paused');
    }
  }, [isPlaying]);

  /**
   * 오디오 소스 설정 함수
   */
  const handleAudioSourceChange = useCallback((source: string) => {
    setAudioSource(source);
    if (audioRef.current) {
      audioRef.current.src = source;
      audioRef.current.play();
      console.log('TTS playing');
    }
  }, []);

  /**
   * Change Epub book information
   * @param book Epub Book Info
   */
  const onBookInfoChange = (book: Book) => dispatch(updateBook(book));

  /**
   * Change Epub location
   * @param loc epubCFI or href
   */
  const onLocationChange = (loc: string) => {
    if (!viewerRef.current) return;
    viewerRef.current.setLocation(loc);
  };

  /**
   * Move page
   * @param type Direction
   */
  const onPageMove = (type: "PREV" | "NEXT") => {
    const node = viewerRef.current;
    if (!node || !node.prevPage || !node.nextPage) return;

    type === "PREV" && node.prevPage();
    type === "NEXT" && node.nextPage();
  };

  /**
   * Set toc
   * @param toc Table of Epub contents
   */
  const onTocChange = (toc: Toc[]) => dispatch(updateToc(toc));

  /** 
   * Set Epub viewer styles
   * @param bookStyle_ viewer style
   */
  const onBookStyleChange = (bookStyle_: BookStyle) => setBookStyle(bookStyle_);

  /** 
   * Set Epub viewer options
   * @param bookOption_ viewer option
   */
  const onBookOptionChange = (bookOption_: BookOption) => setBookOption(bookOption_);

  /**
   * Change current page
   * @param page Epub page
   */
  const onPageChange = (page: Page) => dispatch(updateCurrentPage(page));

  /** 
   * ContextMenu on 
   * @param cfiRange CfiRange
   */
  const onContextMenu = (cfiRange: string) => {
    const result = onSelection(cfiRange);
    setIsContextMenu(result);
  };

  /** ContextMenu off */
  const onContextmMenuRemove = () => setIsContextMenu(false);

  return (
    <>
      <ViewerWrapper>
        <Header
          onNavToggle={onNavToggle}
          onOptionToggle={onOptionToggle}
          onLearningToggle={onLearningToggle}
          onTTSToggle={handleTTS}       // TTS 실행 함수 전달
          onTTSStop={stopTTS}           // TTS 중지 함수 전달
          rate={rate}                   // TTS 배속 상태 전달
          gender={gender}               // TTS 음성 성별 상태 전달
          onRateChange={setRate}        // TTS 배속 변경 함수 전달
          onVoiceChange={setGender}     // TTS 음성 성별 변경 함수 전달
		  setAudioSource={handleAudioSourceChange} // 오디오 소스 설정 함수 전달
        />

        {/* <ReactEpubViewer 
          url={url}
          viewerLayout={viewerLayout}
          viewerStyle={bookStyle}
          viewerOption={bookOption}
          onBookInfoChange={onBookInfoChange}
          onPageChange={onPageChange}
          onTocChange={onTocChange}
          onSelection={onContextMenu}
          loadingView={loadingView || <LoadingView />}
          ref={viewerRef}
        /> */}

        <Footer 
          title={currentLocation.chapterName}
          nowPage={currentLocation.currentPage}
          totalPage={currentLocation.totalPage}
          onPageMove={onPageMove}
        />
      </ViewerWrapper>

      <Nav
        control={navControl}
        onToggle={onNavToggle}
        onLocation={onLocationChange}
        ref={navRef}
      />
      
      <Option 
        control={optionControl}
        bookStyle={bookStyle}
        bookOption={bookOption}
        bookFlow={bookOption.flow}
        onToggle={onOptionToggle} 
        emitEvent={emitEvent}
        onBookStyleChange={onBookStyleChange}
        onBookOptionChange={onBookOptionChange}
        ref={optionRef}
      />

      <Learning 
        control={learningControl}
        onToggle={onLearningToggle}
        onClickHighlight={onClickHighlight}
        emitEvent={emitEvent}
        viewerRef={viewerRef}
        ref={learningRef}
      />

      <ContextMenu
        active={isContextMenu}
        viewerRef={viewerRef}
        selection={selection}
        onAddHighlight={onAddHighlight}
        onRemoveHighlight={onRemoveHighlight}
        onUpdateHighlight={onUpdateHighlight}
        onContextmMenuRemove={onContextmMenuRemove}
      />

      <Snackbar />
    </>
  );
};

const ReaderWrapper = ({ url, loadingView }: Props) => {
  return (
    <Provider store={store}>
      <Reader url={url} loadingView={loadingView} />
    </Provider>
  );
};

// Props 인터페이스에 url 추가
interface Props {
	url: string; // url 추가
	loadingView?: React.ReactNode;
}

export default ReaderWrapper;
