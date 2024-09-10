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

const EpubReader = ({ url, book, location, from }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const viewerRef = useRef(null);
  const saveGazeTimeRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);
  const audioRef = useRef(new Audio());
  const [fontSize, setFontSize] = useState(16); // 기본 글씨 크기
  const { bookPath, setBookPath } = location.state || {};

  const [isCameraAvailable, setIsCameraAvailable] = useState(false); // 카메라 사용 가능 여부 상태

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const resizeObserverError = document.querySelector('[message*="ResizeObserver loop completed"]');
      if (resizeObserverError) {
        resizeObserverError.remove();
      }
    });
  
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  
    return () => observer.disconnect();
  }, []);
  

  // 카메라가 연결되어 있는지 확인하는 함수
  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      setIsCameraAvailable(videoDevices.length > 0);
    } catch (error) {
      console.error("카메라 확인 중 오류 발생:", error);
      setIsCameraAvailable(false);
    }
  };

  useEffect(() => {
    // 카메라 연결 여부를 확인
    checkCameraAvailability();

    // 전역 에러 처리
    const errorHandler = (event) => {
      if (
        event.message &&
        (event.message.includes("ResizeObserver") ||
          event.message.includes("Could not start video source") ||
          event.message.includes("Requested device not found"))
      ) {
        event.preventDefault();
        return true; // prevent the error from propagating
      }
    };
  
    // 전역 에러 리스너 등록
    window.addEventListener('error', errorHandler);
  
    // Promise rejection도 무시 (예: getUserMedia)
    const unhandledRejectionHandler = (event) => {
      if (
        event.reason &&
        (event.reason.message.includes("Requested device not found") ||
         event.reason.message.includes("Could not start video source"))
      ) {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
  
    // 콘솔 에러 무시
    const originalConsoleError = console.error;
    console.error = (message, ...args) => {
      if (
        message.includes(
          "ResizeObserver loop completed with undelivered notifications."
        ) ||
        message.includes("Could not start video source") ||
        message.includes("Requested device not found")
      ) {
        return;
      }
      originalConsoleError(message, ...args);
    };
  
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
      console.error = originalConsoleError; // Clean up: 콘솔 로그 원상 복구
    };
  }, []);

  useEffect(() => {
    if (isCameraAvailable) {
      // 카메라가 있을 때만 카메라 관련 작업 수행
      console.log("카메라가 연결되어 있습니다.");
    } else {
      console.log("카메라가 연결되어 있지 않습니다.");
    }
  }, [isCameraAvailable]);

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
  const [currentBookText, setCurrentBookText] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [bookmarkMessage, setBookmarkMessage] = useState(""); // 추가된 부분
  const [cfi, setCfi] = useState("");

  // 폰트 크기 증가 함수
  const increaseFontSize = () => {
    setFontSize((prevSize) => Math.min(prevSize + 2, 32)); // 최대 32px
  };

  // 폰트 크기 감소 함수
  const decreaseFontSize = () => {
    setFontSize((prevSize) => Math.max(prevSize - 2, 12)); // 최소 12px
  };

  // 폰트 크기 변경 함수
  const onFontSizeChange = (action) => {
    if (action === "increase") {
      increaseFontSize();
    } else if (action === "decrease") {
      decreaseFontSize();
    }
  };

  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.register("customTheme", {
        "*": {
          "font-size": `${fontSize}px !important`,
          "line-height": "1.5 !important",
        },
      });

      // 테마를 적용하고, 재렌더링 강제
      renditionRef.current.themes.fontSize(`${fontSize}px`);
    }
  }, [fontSize]); // fontSize가 변경될 때마다 테마 적용

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

  const fetchBookmarks = async () => {
    try {
      const isUploadBook = from === "upload"; // 업로드 도서 여부
      const upload_idx = isUploadBook ? book.upload_idx : null;
      console.log(book.upload_idx);

      const response = await axios.get(
        "http://localhost:3001/getBookPath/getUserBookmark",
        {
          params: {
            book_idx: book.book_idx,
            mem_id: userInfo.mem_id,
            isUploadBook,
            upload_idx,
          },
        }
      );

      console.log("API 응답:", response.data); // API 응답 값 확인
      return response.data; // 북마크와 폰트 크기를 반환
    } catch (error) {
      console.error("북마크를 가져오는 중 오류 발생:", error);
      return {};
    }
  };

  const handleBookmarkRemove = async (book_mark) => {
    const book_idx = book?.book_idx;
    try {
      // 서버에 북마크 삭제 요청 보내기
      const response = await axios.post(
        "http://localhost:3001/getBookPath/removeBookmark",
        {
          book_idx,
          mem_id: userInfo.mem_id,
          book_mark,
        }
      );

      if (response.status === 200) {
        // 북마크 삭제 후 상태 업데이트
        const updatedBookmarks = bookmarks.filter(
          (bookmark) => bookmark.book_mark !== book_mark
        );
        setBookmarks(updatedBookmarks);

        // 로컬 스토리지 업데이트
        localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));

        // 사용자에게 알림 메시지 표시
        setBookmarkMessage("북마크가 삭제되었습니다.");
        setTimeout(() => {
          setBookmarkMessage("");
        }, 2000);
      } else {
        throw new Error("북마크 삭제에 실패했습니다.");
      }
    } catch (error) {
      setBookmarkMessage("북마크 삭제 중 오류가 발생했습니다.");
      setTimeout(() => {
        setBookmarkMessage("");
      }, 2000);
    }
  };

  useEffect(() => {
    const loadBookmarkAndNavigate = async () => {
      try {
        const mem_id = userInfo?.mem_id;
        const isUploadBook = from === "upload"; // 업로드 도서 여부
        const book_idx = isUploadBook ? null : book?.book_idx;
        const upload_idx = isUploadBook ? book?.upload_idx : null;

        if (!mem_id || (!book_idx && !upload_idx)) {
          console.warn("사용자 정보 또는 책 정보가 없습니다.");
          return;
        }

        // 'recent' 또는 'upload'에서 넘어온 경우에만 북마크와 폰트 크기 가져오기
        if (
          location.state?.from === "mylib" ||
          location.state?.from === "upload"
        ) {
          const response = await axios.get(
            "http://localhost:3001/getBookPath/getUserBookmark",
            {
              params: { book_idx, mem_id, isUploadBook, upload_idx },
            }
          );

          const { bookmark, fontSize } = response.data;

          // 폰트 크기 설정
          if (fontSize) {
            setFontSize(fontSize);
          }

          // 책이 로드된 후 북마크 위치로 이동하도록 함
          renditionRef.current.display().then(() => {
            // 폰트 크기를 적용
            renditionRef.current.themes.fontSize(`${fontSize}px`);

            // 북마크 위치로 이동
            if (bookmark) {
              console.log("북마크 위치로 이동:", bookmark);
              renditionRef.current.display(bookmark); // DB에서 가져온 cfi로 이동
            } else {
              // 북마크가 없으면 첫 페이지로 이동
              console.log("북마크가 없으므로 첫 페이지로 이동합니다.");
              renditionRef.current.display();
            }
          });
        } else {
          // 메인 페이지에서 열면 항상 첫 페이지로 이동
          console.log("메인 페이지에서 열었으므로 첫 페이지로 이동합니다.");
          renditionRef.current.display();
        }
      } catch (error) {
        console.error("북마크를 로드하는 중 오류 발생:", error);
      }
    };

    if (viewerRef.current && userInfo && book) {
      // userInfo와 book이 로드된 후 실행
      setLoading(true);
      const bookInstance = ePub(url);
      bookRef.current = bookInstance;

      const rendition = bookInstance.renderTo(viewerRef.current, {
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
          console.log("현재 CFI 값:", location.start.cfi);
        }
      };

      rendition.on("rendered", updatePageInfo);
      rendition.on("relocated", updatePageInfo);

      rendition.display().then(() => updatePageInfo());

      // Cleanup
      return () => {
        stopTTS();
        bookInstance.destroy();
        rendition.off("rendered", updatePageInfo);
        rendition.off("relocated", updatePageInfo);
      };
    }
  }, [url, dispatch, userInfo, book, location.state]);

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

            // 페이지 이동 후 cfi 값 업데이트
            if (location && location.start) {
              setCfi(location.start.cfi);
              console.log("페이지 이동 후 CFI 값:", location.start.cfi);
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
      console.log("cfi!!!!!!!!!!!", cfi);

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
    summarizeCurrentPage(false); // 독서 완료 시는 3개 요약 생성

    if (userInfo && book) {
      const { mem_id } = userInfo;
      const { book_idx } = book;
      const fontsize = fontSize;

      // 상세 페이지로 네비게이션을 즉시 수행
      console.log("내 서재 페이지로 네비게이션 중...");
      navigate("/mylib", { state: { book } });

      // 요약 생성 요청을 비동기로 처리
      try {
        console.log("요약 생성 요청 중...");
        const summarizeResult = await handleSummarize(mem_id, book_idx);

        if (summarizeResult.success) {
          console.log("요약 생성 및 저장 성공:", summarizeResult.summary);
        } else {
          console.error("요약 생성 실패:", summarizeResult.error);
        }
      } catch (error) {
        console.error("요약 생성 중 오류 발생:", error);
      }
    } else {
      console.warn("사용자 정보 또는 책 정보가 없습니다.");
    }
  };

// 독서 종료
const handleReadingQuit = async () => {
  if (userInfo && book) {
    const mem_id = userInfo.mem_id;
    const book_idx = book.book_idx;
    const fontsize = fontSize;
    const isUploadBook = from === "upload"; // 업로드 도서 여부
    const upload_idx = isUploadBook ? book.upload_idx : null;
    const book_name = book.book_name;

    console.log({
      book_idx,
      mem_id,
      cfi,
      fontSize,
      isUploadBook,
      upload_idx,
    });

    const currentLocation = renditionRef.current?.currentLocation();
    if (currentLocation && currentLocation.start) {
      const cfi = currentLocation.start.cfi;
      try {
        await axios.post("http://localhost:3001/getBookPath/endReading", {
          mem_id,
          book_idx,
          cfi,
          fontsize,
          isUploadBook,
          book_name,
          upload_idx,
        });
        console.log("독서 중단 CFI가 DB에 저장되었습니다.", cfi);
      } catch (error) {
        console.error("독서 중단 CFI 저장 중 오류:", error);
      }
    }
  }
  
  setTimeout(() => {
    navigate("/mylib", { state: { book } });
  }, 1000); // 1000ms = 1초
};


  // 현재 페이지 텍스트를 요약하는 함수
  const summarizeCurrentPage = async (isBookSignal = false) => {
    const pageText = pageTextArray.join(" ");
    if (pageText) {
      try {
        const result = await handleSummarize(
          userInfo.mem_id,
          book.book_idx,
          pageText,
          isBookSignal
        );

        if (result.success) {
          console.log("요약 성공:", result.summaries);
        } else {
          console.log("요약 실패:", result.message);
        }
      } catch (error) {
        console.error("요약 중 오류:", error);
      }
    }
  };

  // BookSignal 버튼을 눌렀을 때 호출
  const handleBookSignal = () => {
    summarizeCurrentPage(true); // BookSignal 요청 시는 1개 요약 추가
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
        setIsPlaying(true); // 상태를 다시 true로 설정하여 TTS 재실행
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
          goToBookmark={goToBookmark} // 전달
          fetchBookmarks={fetchBookmarks} // 전달
          onReadingQuit={handleReadingQuit}
          book={book}
          userInfo={userInfo} // userInfo를 추가
          onBookmarkRemove={handleBookmarkRemove}
          onFontSizeChange={onFontSizeChange} // 폰트 크기 변경 함수 전달
          increaseFontSize={increaseFontSize} // 전달
          decreaseFontSize={decreaseFontSize} // 전달
          initialFontSize={fontSize}
          onSummarizePage={summarizeCurrentPage}
        />

        <div
          ref={viewerRef}
          className="viewer"
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
            <div
              key={index}
              className="bookmark-item"
              onClick={() => goToBookmark(bookmark.book_mark)}
            >
              <p>{bookmark.book_text}</p>
            </div>
          ))}
        </div>
      </ViewerWrapper>

      <Nav
        control={() => {}}
        onToggle={() => {}}
        onLocation={() => {}}
        ref={null}
      />

      <Snackbar />
      {isCameraAvailable && (
        <EyeGaze
          viewerRef={viewerRef}
          onSaveGazeTime={(saveGazeTime) => {
            saveGazeTimeRef.current = saveGazeTime;
          }}
          book={book} // book 객체 전달
          bookText={currentBookText}
          currentPage={currentPage}
          cfi={cfi}
        />
      )}
    </div>
  );
};

const Reader = () => {
  const location = useLocation();
  const { bookPath, book, from } = location.state || {};

  console.log("Reader 컴포넌트에서 전달된 book 객체:", book);

  if (!book) {
    console.error("Book object is undefined.");
    return <div>Error: Book data is missing.</div>;
  }

  const isUploadBook = from === "upload"; // 업로드된 책인지 확인
  let epubUrl;

  if (isUploadBook) {
    // 업로드된 책은 실제 서버에 저장된 경로에서 불러옴
    epubUrl = `uploads/${bookPath}.epub`; // bookPath를 직접 사용
  } else {
    // 일반 책의 경우 기본 경로를 사용
    epubUrl = `book_file/${book.book_path}.epub`;
  }

  return (
    <Provider store={store}>
      <EpubReader url={epubUrl} book={book} location={location} from={from} />
    </Provider>
  );
};

export default Reader;
