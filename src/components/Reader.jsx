import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Provider } from "react-redux";
import { ReactEpubViewer } from "react-epub-viewer";
import Header from "containers/Header";
import Footer from "containers/Footer";
import Nav from "containers/menu/Nav";
import Option from "containers/menu/Option";
import Learning from "containers/menu/Note";
import ContextMenu from "containers/commons/ContextMenu";
import Snackbar from "containers/commons/Snackbar";
import ViewerWrapper from "components/commons/ViewerWrapper";
import LoadingView from "LoadingView";
import store from "slices";
import { updateBook, updateCurrentPage, updateToc } from "slices/book";
import useMenu from "lib/hooks/useMenu";
import useHighlight from "lib/hooks/useHighlight";
import "lib/styles/readerStyle.css";
import viewerLayout from "lib/styles/viewerLayout";

const EpubReader = ({ url }) => {
  const dispatch = useDispatch();
  const currentLocation = useSelector((state) => state.book.currentLocation);

  const viewerRef = useRef(null);
  const navRef = useRef(null);
  const optionRef = useRef(null);
  const learningRef = useRef(null);

  const [isContextMenu, setIsContextMenu] = useState(false);
  const [bookStyle, setBookStyle] = useState({
    fontFamily: "Arial",
    fontSize: 16,
    lineHeight: 1.6,
  });

  const [bookOption, setBookOption] = useState({
    flow: "paginated",
    resizeOnOrientationChange: true,
    spread: "auto",
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
    onUpdateHighlight,
  } = useHighlight(viewerRef, setIsContextMenu, bookStyle, bookOption.flow);

  const onBookInfoChange = (book) => dispatch(updateBook(book));
  const onLocationChange = (loc) =>
    viewerRef.current && viewerRef.current.setLocation(loc);

  // 텍스트를 추출하는 함수
  const getTextFromViewer = () => {
    if (viewerRef.current) {
      try {
        const rendition = viewerRef.current.getRendition(); // 뷰어의 rendition 접근
        const contents = rendition ? rendition.getContents() : []; // rendition의 contents 가져오기

        if (contents && contents.length > 0) {
          const iframe = contents[0].document; // iFrame 내용 접근
          const text = iframe.body.innerText; // 페이지의 전체 텍스트 추출
          console.log('Extracted Text:', text); // 텍스트 로그 출력
          return text;
        }
      } catch (error) {
        console.error('Error accessing viewer content:', error);
      }
    }
    return "";
  };

  const saveTextToDatabase = async (text) => {
    try {
      const response = await fetch('http://localhost:3001/api/save-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memId: '사용자 ID', // 사용자 ID
          bookIdx: '책 인덱스', // 책 인덱스
          text: text, // 추출된 텍스트
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save text');
      }

      console.log('Text saved successfully');
    } catch (error) {
      console.error('Error saving text:', error);
    }
  };

  const onPageMove = (type) => {
    const node = viewerRef.current;
    if (node) {
      // 페이지 이동
      type === "PREV" ? node.prevPage() : node.nextPage();

      // 현재 페이지의 텍스트 추출 후 서버에 저장
      const text = getTextFromViewer();
      saveTextToDatabase(text);
    }
  };

  const onTocChange = (toc) => dispatch(updateToc(toc));
  const onBookStyleChange = (bookStyle_) => setBookStyle(bookStyle_);
  const onBookOptionChange = (bookOption_) => setBookOption(bookOption_);
  const onPageChange = (page) => dispatch(updateCurrentPage(page));
  const onContextMenu = (cfiRange) => {
    const result = onSelection(cfiRange);
    setIsContextMenu(result);
  };
  const onContextMenuRemove = () => setIsContextMenu(false);

  return (
    <div>
      <ViewerWrapper>
        <Header
          onNavToggle={onNavToggle}
          onOptionToggle={onOptionToggle}
          onLearningToggle={onLearningToggle}
        />

        <ReactEpubViewer
          url={url}
          viewerLayout={viewerLayout}
          viewerStyle={bookStyle}
          viewerOption={bookOption}
          onBookInfoChange={onBookInfoChange}
          onPageChange={onPageChange}
          onTocChange={onTocChange}
          onSelection={onContextMenu}
          loadingView={<LoadingView />}
          ref={viewerRef}
        />

        <Footer
          title={currentLocation?.chapterName || ""}
          nowPage={currentLocation?.currentPage || 0}
          totalPage={currentLocation?.totalPage || 0}
          onPageMove={onPageMove} // 페이지 이동 기능 연결
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
        onContextMenuRemove={onContextMenuRemove}
      />

      <Snackbar />
    </div>
  );
};

const Reader = () => {
  const epubUrl = "files/김유정-동백꽃-조광.epub"; // EPUB 파일 경로 설정

  return (
    <Provider store={store}>
      <EpubReader url={epubUrl} /> {/* ReaderWrapper 컴포넌트에 URL 전달 */}
    </Provider>
  );
};

export default Reader;
