import { useDispatch } from "react-redux";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Provider } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import ePub from "epubjs";
import axios from "axios";
// containers
import Header from "containers/Header";
import Footer from "containers/Footer";
import Nav from "containers/menu/Nav";
import Snackbar from "containers/commons/Snackbar";
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

const EpubReader = ({ url, book, location }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const viewerRef = useRef(null);
  const saveGazeTimeRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const audioRef = useRef(new Audio());
  const [fontSize, setFontSize] = useState(16); // 기본 글씨 크기

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
  const [lineHeight, setLineHeight] = useState("1.5");
  const [margin, setMargin] = useState("0");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [loading, setLoading] = useState(true);
  const [firstVisibleCfi, setFirstVisibleCfi] = useState(null);
  const [shouldSaveCfi, setShouldSaveCfi] = useState(true);
  const [currentBookText, setCurrentBookText] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [bookmarkMessage, setBookmarkMessage] = useState('');  // 추가된 부분
  const [cfi, setCfi] = useState('');

  // 폰트 크기 변경 함수
  const onFontSizeChange = (action) => {
    if (action === 'increase') {
      increaseFontSize();
    } else if (action === 'decrease') {
      decreaseFontSize();
    }
  };

  // 폰트 크기를 증가시키는 함수
  const increaseFontSize = () => {
    console.log('in');
    
    setFontSize((prevSize) => Math.min(prevSize + 2, 32)); // 최대 32px
  };

  // 폰트 크기를 감소시키는 함수
  const decreaseFontSize = () => {
    console.log('de');
    
    setFontSize((prevSize) => Math.max(prevSize - 2, 12)); // 최소 12px
  };

  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.register("customTheme", {
        "*": {
          "font-size": `${fontSize}px !important`,
          "line-height": "1.5 !important",
        },
      });
      renditionRef.current.themes.override("customTheme");
    }
  }, [fontSize]); // fontSize가 변경될 때마다 적용

  useEffect(() => {
    axios.get('http://localhost:3001/check-session', { withCredentials: true })
      .then(response => {
        setUserInfo(response.data.user);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          alert('로그인이 필요합니다.');
          navigate('/login');
        } else {
          console.error("세션 정보 확인 중 오류 발생:", error);
        }
      });
  }, [navigate]);

  const fetchBookmarks = async () => {
    try {
      const response = await axios.get('http://localhost:3001/getBookPath/getBookmarks', {
        params: { book_idx: book.book_idx, mem_id: userInfo.mem_id },
      });
      console.log('Fetched bookmarks:', response.data); // 이 부분에서 데이터 구조를 확인하세요
      return response.data; // 성공적으로 북마크를 가져오면 반환
    } catch (error) {
      console.error('북마크를 가져오는 중 오류 발생:', error);
      return [];
    }
  };

  const handleBookmarkRemove = async (book_mark) => {
    const book_idx = book?.book_idx;
    try {
      // 서버에 북마크 삭제 요청 보내기
      const response = await axios.post('http://localhost:3001/getBookPath/removeBookmark', {
        book_idx,
        mem_id: userInfo.mem_id,
        book_mark
      });


      if (response.status === 200) {
        // 북마크 삭제 후 상태 업데이트
        const updatedBookmarks = bookmarks.filter((bookmark) => bookmark.book_mark !== book_mark);
        setBookmarks(updatedBookmarks);

        // 로컬 스토리지 업데이트
        localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));

        // 사용자에게 알림 메시지 표시
        setBookmarkMessage('북마크가 삭제되었습니다.');
        setTimeout(() => {
          setBookmarkMessage('');
        }, 2000);
      } else {
        throw new Error('북마크 삭제에 실패했습니다.');
      }
    } catch (error) {
      setBookmarkMessage('북마크 삭제 중 오류가 발생했습니다.');
      setTimeout(() => {
        setBookmarkMessage('');
      }, 2000);
    }
  };

  useEffect(() => {
    const loadBookmarkAndNavigate = async () => {
      try {
        const mem_id = userInfo?.mem_id;
        const book_idx = book?.book_idx;

        if (!mem_id || !book_idx) {
          console.warn("사용자 정보 또는 책 정보가 없습니다.");
          return;
        }

        // 'mylib'에서 넘어온 경우에만 북마크 가져오기
        if (location.state?.from === 'mylib') {
          const response = await axios.get('http://localhost:3001/getBookPath/getUserBookmark', {
            params: { book_idx, mem_id },
          });

          const bookmark = response.data.bookmark;

          if (bookmark) {
            console.log("북마크 위치로 이동:", bookmark);
            renditionRef.current.display(bookmark); // 북마크 위치로 이동
            return; // 북마크로 이동 후 return
          }
        }
        // 북마크가 없거나 'mylib'에서 오지 않은 경우 첫 페이지로 이동
        console.log("북마크가 없거나 mylib에서 오지 않았습니다. 첫 페이지로 이동합니다.");
        renditionRef.current.display();

      } catch (error) {
        console.error("북마크를 로드하는 중 오류 발생:", error);
      }
    };

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

      // 책이 로드된 후 북마크를 로드하고 이동
      rendition.display().then(() => {
        loadBookmarkAndNavigate(); // 북마크 로드 및 이동 함수 호출
      });

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
          logCurrentPageText();
          setLoading(false);
        }
        // cfi 값을 업데이트
        if (location && location.start) {
          setCfi(location.start.cfi);
          console.log('현재 CFI 값:', location.start.cfi);
        }
      };

      rendition.on("rendered", updatePageInfo);
      rendition.on("relocated", updatePageInfo);

      rendition.display().then(() => updatePageInfo());

      // Cleanup
      return () => {
        stopTTS();
        book.destroy();
        rendition.off("rendered", updatePageInfo);
        rendition.off("relocated", updatePageInfo);

        // window.removeEventListener("resize", handleResize);
      };
    }
  }, [url, dispatch, userInfo, location.state]);

  const onPageMove = useCallback((type) => {
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

          dispatch(updateCurrentPage({ currentPage: page || 1, totalPages: total || 1 }));
          setLoading(false);

          // 페이지 이동 후에 canvas 사이즈와 위치만 업데이트
          // if (EyeGazeRef.current) {
          //   EyeGazeRef.current.resizeCanvas(); // canvas 크기만 조정
          // }

          // if (seesoRef.current) {
          //   seesoRef.current.stopTracking();
          //   seesoRef.current.startTracking(onGaze, onDebug);
          // }
          // 페이지 이동 후 cfi 값 업데이트
          if (location && location.start) {
            setCfi(location.start.cfi);
            console.log('페이지 이동 후 CFI 값:', location.start.cfi);
          }
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
      console.log('cfi!!!!!!!!!!!', cfi);

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

  const goToBookmark = (cfi) => {
    if (renditionRef.current) {
      renditionRef.current.display(cfi).catch((err) => {
        console.error("북마크 이동 중 오류:", err);
      });
    }
  };

  const removeBookmark = (cfi) => {
    const newBookmarks = bookmarks.filter((bookmark) => bookmark.cfi !== cfi);
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

  const handleReadingQuit = async () => {

    if (userInfo && book) {
      // userInfo와 book의 구조에 따라 접근
      const mem_id = userInfo.mem_id;  // userInfo가 { mem_id: 'user123' }인 경우
      const book_idx = book.book_idx; // book이 { book_idx: 1, book_name: 'Sample Book' }인 경우

      // 독서 중단 시 CFI 저장
      const currentLocation = renditionRef.current?.currentLocation();
      if (currentLocation && currentLocation.start) {
        const cfi = currentLocation.start.cfi;
        try {
          await axios.post("http://localhost:3001/getBookPath/endReading", {
            mem_id,
            book_idx,
            cfi,
          });
          console.log("독서 중단 CFI가 DB에 저장되었습니다.", cfi);
        } catch (error) {
          console.error("독서 중단 CFI 저장 중 오류:", error);
        }
      }
    }
    navigate('/detail', { state: { book } });
  };

  const handleTTS = async () => {
    if (viewerRef.current && !isPlaying) {
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
  }, [isPlaying, pageTextArray, gender, rate]);

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

  // 배속 변경에 따른 효과 적용
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate; // 배속 변경 시 항상 최신 배속을 적용
      if (!audioRef.current.paused) {
        audioRef.current.play(); // 현재 재생 중이면 재생 상태를 유지하면서 배속 변경
      }
    }
  }, [rate]); // 배속이 변경될 때마다 실행


  useEffect(() => {
    if (audioSource && audioRef.current) {
      audioRef.current.src = audioSource;
      audioRef.current.play();
      audioRef.current.playbackRate = rate; // 배속 반영
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, [audioSource]); // 오디오 소스가 변경될 때만 실행


  const stopTTS = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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
          onReadingComplete={handleReadingComplete}
          goToBookmark={goToBookmark}  // 전달
          fetchBookmarks={fetchBookmarks}  // 전달
          onReadingQuit={handleReadingQuit}
          book={book}
          userInfo={userInfo} // userInfo를 추가
          onBookmarkRemove={handleBookmarkRemove}
          onFontSizeChange={onFontSizeChange} // 폰트 크기 변경 함수 전달
          increaseFontSize={increaseFontSize}  // 전달
          decreaseFontSize={decreaseFontSize}  // 전달
        />

        <div
          ref={viewerRef} className="viewer"
          style={{ width: "100%", height: "100%", border: "1px solid #ccc" }}
        />

        <Footer
          title="Chapter Title"
          nowPage={currentPage}
          totalPage={totalPages}
          onPageMove={onPageMove}
          loading={loading}
        />

        {/* 북마크 목록을 추가 */}
        <div className="bookmark-list">
          {bookmarks.map((bookmark, index) => (
            <div key={index} className="bookmark-item" onClick={() => goToBookmark(bookmark.book_mark)}>
              <p>{bookmark.book_text}</p>
            </div>
          ))}
        </div>
      </ViewerWrapper>

      <Nav
        control={() => { }}
        onToggle={() => { }}
        onLocation={() => { }}
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
        currentPage={currentPage}
        cfi={cfi}
      // onStopGazeTracking={(stopGazeTracking) => {
      //   stopGazeTrackingRef.current = stopGazeTracking;
      // }}
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

  return (
    <Provider store={store}>
      <EpubReader url={epubUrl} book={book} location={location} />
    </Provider>
  );
};

export default Reader;
