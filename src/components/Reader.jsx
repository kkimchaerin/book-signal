// reader.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Provider } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import ePub from "epubjs";
import axios from "axios";
// containers
import Footer from "containers/Footer";
import Nav from "containers/menu/Nav";
import Snackbar from "containers/commons/Snackbar";
import Header from "containers/Header";
// components
import ViewerWrapper from "components/commons/ViewerWrapper";
// slices
import store from "slices";
import { updateCurrentPage } from "slices/book";
import { handleSummarize } from "./SummarizePage"; // handleSummarize 함수 import

// styles
import "lib/styles/readerStyle.css";
import LoadingView from "LoadingView";
import EyeGaze from "pages/EyeGaze";

const EpubReader = ({ url, book }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const viewerRef = useRef(null);
  const saveGazeTimeRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [gender, setGender] = useState("MALE");
  const [isPaused, setIsPaused] = useState(false);
  const [audioSource, setAudioSource] = useState(null);
  const [isContextMenu, setIsContextMenu] = useState(false);
  const [pageTextArray, setPageTextArray] = useState([]);
  const [bookStyle, setBookStyle] = useState({
    fontFamily: "Arial",
    fontSize: 16,
    lineHeight: 1.6,
    marginHorizontal: 50,
    marginVertical: 5,
  });

  const [bookOption, setBookOption] = useState({
    flow: "paginated",
    resizeOnOrientationChange: true,
    spread: "none",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bookmarks, setBookmarks] = useState([]);
  const [fontSize, setFontSize] = useState("100%");
  const [lineHeight, setLineHeight] = useState("1.5");
  const [margin, setMargin] = useState("0");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [loading, setLoading] = useState(true);
  const [firstVisibleCfi, setFirstVisibleCfi] = useState(null);
  const [shouldSaveCfi, setShouldSaveCfi] = useState(true);
  const [currentBookText, setCurrentBookText] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  // 사용자 정보를 상태로 관리
  useEffect(() => {
    axios
      .get("http://localhost:3001/check-session", { withCredentials: true })
      .then((response) => {
        setUserInfo(response.data.user);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          alert("로그인이 필요합니다.");
          navigate("/login");
        } else {
          console.error("세션 정보 확인 중 오류 발생:", error);
        }
      });
  }, [navigate]);

  useEffect(() => {
    if (viewerRef.current) {
      setLoading(true);
      const book = ePub(url);
      bookRef.current = book;

      const rendition = book.renderTo(viewerRef.current, {
        width: "100%",
        height: "100%",
        flow: "paginated",
        spread: "none",
      });

      renditionRef.current = rendition;

      const updatePageInfo = () => {
        const location = renditionRef.current.currentLocation();
        if (location && location.start && location.start.displayed) {
          const page = location.start.displayed.page;
          const total = location.start.displayed.total;

          if (page !== currentPage || total !== totalPages) {
            setCurrentPage(page || 1);
            setTotalPages(total || 1);
            dispatch(
              updateCurrentPage({
                currentPage: page || 1,
                totalPages: total || 1,
              })
            );
          }
          setLoading(false);
        }
      };

      rendition.on("rendered", updatePageInfo);
      rendition.on("relocated", updatePageInfo);

      rendition.display().then(() => updatePageInfo());

      return () => {
        stopTTS();
        book.destroy();
        rendition.off("rendered", updatePageInfo);
        rendition.off("relocated", updatePageInfo);
      };
    }
  }, [url, dispatch]);

  const updateStyles = useCallback(() => {
    setShouldSaveCfi(true);
    if (renditionRef.current) {
      renditionRef.current.themes.default({
        body: {
          "font-size": fontSize,
          "line-height": lineHeight,
          margin: margin,
          "font-family": fontFamily,
        },
      });

      if (bookRef.current) {
        bookRef.current.ready
          .then(() => bookRef.current.locations.generate())
          .catch((err) =>
            console.error("스타일 업데이트 또는 위치 생성 중 오류:", err)
          );
      }
    }
  }, [fontSize, lineHeight, margin, fontFamily]);

  // 페이지 이동 핸들러
  const onPageMove = useCallback(
    (type) => {
      if (saveGazeTimeRef.current) {
        saveGazeTimeRef.current();
      }

      setShouldSaveCfi(false);
      if (renditionRef.current) {
        setLoading(true);
        const updateAfterMove = () => {
          const location = renditionRef.current.currentLocation();
          if (location) {
            const page = location.start.displayed.page;
            const total = location.start.displayed.total;

            setCurrentPage(page || 1);
            setTotalPages(total || 1);

            dispatch(
              updateCurrentPage({
                currentPage: page || 1,
                totalPages: total || 1,
              })
            );
            setLoading(false);
          }
        };

        renditionRef.current.off("relocated", updateAfterMove);
        renditionRef.current.on("relocated", updateAfterMove);

        if (type === "PREV") {
          renditionRef.current.prev().then(() => {
            logCurrentPageText();
          });
        } else if (type === "NEXT") {
          renditionRef.current.next().then(() => {
            logCurrentPageText();
          });
        }
      }
    },
    [dispatch]
  );

  const logCurrentPageText = () => {
    if (renditionRef.current) {
      const contents = renditionRef.current.getContents();

      let allVisibleTexts = [];

      contents.forEach((content) => {
        const iframeDoc = content.document;
        if (iframeDoc) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                allVisibleTexts.push(
                  entry.target.innerText || entry.target.textContent
                );
              }
            });

            setPageTextArray(allVisibleTexts);

            const combinedText = allVisibleTexts.join(" ");
            setCurrentBookText(combinedText);

            console.log("All Visible Texts on Current Page:", allVisibleTexts);
          });

          const textElements = iframeDoc.querySelectorAll(
            "p, span, div, h1, h2, h3, h4, h5, h6"
          );
          textElements.forEach((element) => observer.observe(element));
        } else {
          console.warn("Could not access iframe content.");
        }
      });
    } else {
      console.warn("Rendition is not available.");
    }
  };

  const addBookmark = async () => {
    const currentLocation = renditionRef.current.currentLocation();
    if (currentLocation && currentLocation.start) {
      const cfi = currentLocation.start.cfi;
      const pageText = pageTextArray.join(" ");
      const newBookmarks = [...bookmarks, { cfi, pageText }];
      setBookmarks(newBookmarks);
      localStorage.setItem("bookmarks", JSON.stringify(newBookmarks));

      try {
        await axios.post("http://localhost:3001/getBookPath/saveBookmark", {
          book_name: book.book_name,
          book_idx: book.book_idx,
          mem_id: userInfo.mem_id,
          cfi,
          page_text: pageText,
        });
        console.log("북마크가 DB에 저장되었습니다.");
      } catch (error) {
        console.error("북마크 저장 중 오류:", error);
      }
    }
  };

  const handleFontChange = (font) => {
    setFontFamily(font);
    updateStyles();
  };

  const goToBookmark = (cfi) => {
    if (renditionRef.current) {
      renditionRef.current.display(cfi).catch((err) => {
        console.error("북마크 이동 중 오류:", err);
      });
    }
  };

  const removeBookmark = (cfi) => {
    const newBookmarks = bookmarks.filter((bookmark) => bookmark !== cfi);
    setBookmarks(newBookmarks);
    localStorage.setItem("bookmarks", JSON.stringify(newBookmarks));
  };

  useEffect(() => {
    const storedBookmarks = localStorage.getItem("bookmarks");
    if (storedBookmarks) {
      setBookmarks(JSON.parse(storedBookmarks));
    }
  }, []);

  const calculateReadingProgress = () => {
    if (totalPages > 0 && currentPage > 0) {
      return ((currentPage / totalPages) * 100).toFixed(2);
    }
    return "0.00";
  };

  // 독서 완료 처리
  // 페이지 이동 후 api호출
  const handleReadingComplete = async () => {
    console.log("독서 완료 처리 시작");
  
    if (userInfo && book) {
      const { mem_id } = userInfo;
      const { book_idx } = book;
  
      // 상세 페이지로 네비게이션
      console.log("상세 페이지로 네비게이션 중...");
      navigate("/detail", {
        state: {
          book,
          showReviewModal: true,
        },
      });
  
      // 페이지 이동 후 비동기로 요약 생성 요청
      setTimeout(async () => {
        try {
          console.log("요약 생성 요청 중...");
          const summarizeResult = await handleSummarize(mem_id, book_idx);
  
          if (summarizeResult.success) {
            console.log("요약 생성 및 저장 성공:", summarizeResult.summary);
          } else {
            console.error("요약 생성 실패:", summarizeResult.error);
          }
        } catch (error) {
          console.error("요약 및 이미지 생성 중 오류 발생:", error);
        }
      }, 1000); // 페이지가 완전히 로드된 후에 작업을 시작하도록 약간의 지연을 둠
    } else {
      console.warn("사용자 정보 또는 책 정보가 없습니다.");
    }
  };
  

  const handleReadingQuit = () => {
    console.log("독서 중단 처리"); // 함수 호출 시작 로그
    console.log("상세 페이지로 네비게이션 중...", { book }); // 페이지 이동 로그
    navigate("/detail", { state: { book } });
  };

  const handleTTS = async () => {
    if (viewerRef.current && !isPlaying) {
      setIsPlaying(true);
      setIsPaused(false);

      for (const text of pageTextArray) {
        console.log("TTS로 읽을 텍스트:", text);
        const textParts = splitText(text);

        for (const part of textParts) {
          await fetch("http://localhost:3001/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: part, rate, gender }),
          })
            .then((response) => response.arrayBuffer())
            .then((audioContent) => {
              const audioBlob = new Blob([audioContent], { type: "audio/mp3" });
              const audioUrl = URL.createObjectURL(audioBlob);
              audioRef.current.src = audioUrl;
              audioRef.current.playbackRate = rate;
              audioRef.current.play();
              console.log("재생중");
              return new Promise((resolve) => {
                audioRef.current.onended = () => resolve();
              });
            });
        }
      }

      setIsPlaying(false);

      if (renditionRef.current) {
        renditionRef.current.next();
      }
    }
  };

  const stopTTS = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      console.log("tts 정지");
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  const pauseTTS = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeTTS = () => {
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    }
  };

  function splitText(text, maxBytes = 5000) {
    const textParts = [];
    let currentPart = "";

    for (const char of text) {
      const charByteLength = new Blob([char]).size;

      if (new Blob([currentPart + char]).size > maxBytes) {
        textParts.push(currentPart);
        currentPart = char;
      } else {
        currentPart += char;
      }
    }

    if (currentPart) {
      textParts.push(currentPart);
    }

    return textParts;
  }

  return (
    <div className="max-w-screen-xl m-auto">
      <ViewerWrapper className="m-auto">
        <Header
          rate={rate}
          gender={gender}
          onTTSResume={resumeTTS}
          onTTSToggle={handleTTS}
          onTTSPause={pauseTTS}
          onTTSStop={stopTTS}
          onRateChange={setRate}
          onVoiceChange={setGender}
          onBookmarkAdd={addBookmark}
          onFontChange={handleFontChange}
          onReadingComplete={handleReadingComplete}
          onReadingQuit={handleReadingQuit}
          book={book}
          userInfo={userInfo} // userInfo를 추가
        />

        <div
          ref={viewerRef}
          style={{ width: "100%", height: "100%", border: "1px solid #ccc" }}
        />

        <Footer
          title="Chapter Title"
          nowPage={currentPage}
          totalPage={totalPages}
          onPageMove={onPageMove}
          loading={loading}
        />
      </ViewerWrapper>

      <Nav
        control={() => {}}
        onToggle={() => {}}
        onLocation={() => {}}
        ref={null}
      />

      <Snackbar />
      <EyeGaze
        viewerRef={viewerRef}
        onSaveGazeTime={(saveGazeTime) => {
          saveGazeTimeRef.current = saveGazeTime;
        }}
        book={book} // book 객체 전달
        bookText={currentBookText}
      />
    </div>
  );
};

const Reader = () => {
  const location = useLocation();
  const { bookPath, book } = location.state || {};

  if (!book) {
    console.error("Book object is undefined.");
    return <div>Error: Book data is missing.</div>;
  }

  const epubUrl = `book_file/${book.book_path}.epub`;
  console.log(epubUrl);

  return (
    <Provider store={store}>
      <EpubReader url={epubUrl} book={book} />
    </Provider>
  );
};

export default Reader;
