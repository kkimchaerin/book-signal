import {  useDispatch } from "react-redux";
import React, { useState, useRef, useEffect,useCallback } from "react";
import Header from "containers/Header";
import { Provider } from "react-redux";
import { useLocation } from "react-router-dom";
import ePub from "epubjs";
// containers
import Footer from "containers/Footer";
import Nav from "containers/menu/Nav";
import Snackbar from "containers/commons/Snackbar";
// components
import ViewerWrapper from "components/commons/ViewerWrapper";
// slices
import store from "slices";
import { updateCurrentPage } from "slices/book";

// styles
import "lib/styles/readerStyle.css";
import viewerLayout from "lib/styles/viewerLayout";
import LoadingView from "LoadingView";
import EyeGaze from "pages/EyeGaze";

const EpubReader = ({ url }) => {
  const dispatch = useDispatch();
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
  const [pageTextArray, setPageTextArray] = useState([]); // 현재 페이지의 모든 텍스트 상태
  const [currentTextIndex, setCurrentTextIndex] = useState(0); // 현재 읽고 있는 텍스트의 인덱스
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
  const [loading, setLoading] = useState(true); // 로딩 상태 관리
  const [firstVisibleCfi, setFirstVisibleCfi] = useState(null);
  const [shouldSaveCfi, setShouldSaveCfi] = useState(true);
  const [currentBookText, setCurrentBookText] = useState('');

  useEffect(() => {
    if (viewerRef.current) {
      setLoading(true); // 로딩 시작
      const book = ePub(url);
      bookRef.current = book;
      const rendition = book.renderTo(viewerRef.current, {
        width: "100%",
        height: "100%",
        flow: "paginated",
        spread: "none",
      });

   renditionRef.current = rendition;

      // 페이지 정보 업데이트 함수
      const updatePageInfo = () => {
        const location = renditionRef.current.currentLocation();
        if (location && location.start && location.start.displayed) {
          const page = location.start.displayed.page;
          const total = location.start.displayed.total;

          if (page !== currentPage || total !== totalPages) {
            setCurrentPage(page || 1);
            setTotalPages(total || 1);
            dispatch(updateCurrentPage({ currentPage: page || 1, totalPages: total || 1 }));
          }
          logCurrentPageText(); // 페이지 정보 업데이트 후 텍스트 가져오기
          setLoading(false); // 로딩 완료
        }
      };

      rendition.on("rendered", updatePageInfo);
      rendition.on("relocated", updatePageInfo);

      rendition.display().then(() => updatePageInfo());

      // Cleanup 함수에서 TTS 중지 및 이벤트 핸들러 제거
      return () => {
        stopTTS();  // 컴포넌트가 언마운트될 때 TTS를 중지
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
          .catch((err) => console.error("스타일 업데이트 또는 위치 생성 중 오류:", err));
      }
    }
  }, [fontSize, lineHeight, margin, fontFamily]);

  // 페이지 이동 핸들러
  const onPageMove = useCallback((type) => {
    if (saveGazeTimeRef.current) {
      saveGazeTimeRef.current(); // 페이지 이동 전 시선 추적 시간 저장
    }
    
    setShouldSaveCfi(false);
    if (renditionRef.current) {
      setLoading(true); // 페이지 이동 시 로딩 상태로 변경
      const updateAfterMove = () => {
        const location = renditionRef.current.currentLocation();
        if (location) {
          const page = location.start.displayed.page;
          const total = location.start.displayed.total;

          setCurrentPage(page || 1);
          setTotalPages(total || 1);

          dispatch(updateCurrentPage({ currentPage: page || 1, totalPages: total || 1 }));
          setLoading(false); // 페이지 이동 후 로딩 완료
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
  }, [dispatch]);

  // 페이지에 보이는 텍스트를 배열로 수집하는 함수
const logCurrentPageText = () => {
  if (renditionRef.current) {
    const contents = renditionRef.current.getContents();

    let allVisibleTexts = []; // 모든 텍스트를 담을 배열

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

  const addBookmark = () => {
    const currentLocation = renditionRef.current.currentLocation();
    if (currentLocation && currentLocation.start) {
      const newBookmarks = [...bookmarks, currentLocation.start.cfi];
      setBookmarks(newBookmarks);
      localStorage.setItem("bookmarks", JSON.stringify(newBookmarks));
    }
  };

  const handleFontChange = (font) => {
    setFontFamily(font);
    updateStyles();
  };

  // 북마크로 이동
  const goToBookmark = (cfi) => {
    if (renditionRef.current) {
      renditionRef.current.display(cfi).catch((err) => {
        console.error("북마크 이동 중 오류:", err);
      });
    }
  };

  // 북마크 제거
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
    return "0.00"; // 페이지 수가 0일 때는 0%로 표시
  };

  
 // TTS 관련 함수들
const handleTTS = async () => {
  if (!isPlaying) {
    setIsPlaying(true);
    setIsPaused(false);

    // TTS 시작 전에 현재 페이지의 텍스트 업데이트
    await logCurrentPageText(); // 텍스트 업데이트 완료를 기다림
  }
};

// TTS를 실행하는 useEffect
useEffect(() => {
  if (isPlaying && pageTextArray.length > 0) {
    (async () => {
      for (const text of pageTextArray) {
        console.log("TTS로 읽을 텍스트:", text);
        const textParts = splitText(text);

        for (const part of textParts) {
          try {
            const response = await fetch("http://localhost:3001/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: part, rate, gender }),
            });

            const audioContent = await response.arrayBuffer();
            const audioBlob = new Blob([audioContent], { type: "audio/mp3" });
            const audioUrl = URL.createObjectURL(audioBlob);

            if (!audioRef.current.paused) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }

            audioRef.current.src = audioUrl;
            audioRef.current.load();

            // 항상 설정된 배속으로 유지
            audioRef.current.onloadedmetadata = () => {
              audioRef.current.playbackRate = rate; // 항상 현재 설정된 배속 유지
              audioRef.current.play().catch((error) => {
                console.error("오디오 재생 중 오류:", error);
              });
            };


            console.log("재생 중");
            await new Promise((resolve) => {
              audioRef.current.onended = () => {
                resolve(); // 현재 TTS가 끝날 때까지 기다림
              };
            });
          } catch (error) {
            console.error("오디오 재생 중 오류:", error);
          }
        }
      }

      // TTS가 끝난 후 다음 페이지로 이동
      await moveToNextPage(); // 다음 페이지로 이동 후 TTS 실행
    })();
  }
}, [isPlaying, pageTextArray,gender,rate]);

// 배속 변경에 따른 효과 적용
useEffect(() => {
  if (audioRef.current) {
    audioRef.current.playbackRate = rate; // 항상 최신 배속으로 설정
    if (!audioRef.current.paused) {
      audioRef.current.play().catch((error) => {
        console.error("오디오 재생 중 오류:", error);
      });
    }
  }
}, [rate]); // 배속이 변경될 때마다 실행

// 성별 변경 시 효과 적용
useEffect(() => {
  if (isPlaying) {
    stopTTS();
    setTimeout(() => {
      handleTTS(); // 새로운 성별 설정으로 TTS 재생 시작
    }, 500); // 오디오가 멈추고 새로운 설정으로 로드할 시간을 주기 위해 딜레이 추가
  }
}, [gender]); // gender가 변경될 때마다 실행

// 오디오 소스가 변경될 때만 실행
useEffect(() => {
  if (audioSource && audioRef.current) {
    audioRef.current.src = audioSource;
    audioRef.current.play();
    audioRef.current.playbackRate = rate; // 배속 반영
    setIsPlaying(true);
    setIsPaused(false);
  }
}, [audioSource]); // 오디오 소스가 변경될 때만 실행

// 페이지 이동 후 텍스트를 추출하는 함수
const moveToNextPage = async () => {
  if (renditionRef.current) {
    await renditionRef.current.next();
    
    // 페이지 이동 후 텍스트를 다시 로드
    await logCurrentPageText();

    // 페이지 이동 후 TTS 재실행을 위해 isPlaying을 false로 설정 후 다시 true로 변경
    setIsPlaying(false); // 일시적으로 false로 설정하여 useEffect가 다시 트리거되도록 함
    setTimeout(() => {
      setIsPlaying(true);  // 상태를 다시 true로 설정하여 TTS 재실행
    }, 500); 
  }
};


  const stopTTS = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = ""; // 오디오 소스 리셋
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
          onTTSResume={resumeTTS}
          onTTSToggle={handleTTS}
          onTTSPause={pauseTTS}
          onTTSStop={stopTTS}
          onRateChange={setRate}
          onVoiceChange={setGender}
          onBookmarkAdd={addBookmark} // 북마크 추가 핸들러 전달
          onFontChange={handleFontChange} // 폰트 변경 핸들러 전달
          rate={rate}
          gender={gender}
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
        saveGazeTimeRef.current = saveGazeTime;}}
        bookText={currentBookText}
        />
    </div>
  );
};

const Reader = () => {
  const location = useLocation();
  const { bookPath } = location.state || {};

  const epubUrl = `book_file/${bookPath}.epub`;
  console.log(epubUrl);

  return (
    <Provider store={store}>
      <EpubReader url={epubUrl} />
    </Provider>
  );
};

export default Reader;
