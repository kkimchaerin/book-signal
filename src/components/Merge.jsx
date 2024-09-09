import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Provider } from "react-redux";
import { useLocation } from "react-router-dom";
import ePub from "epubjs";
// containers
import Footer from "containers/Footer";
import Nav from "containers/menu/Nav";
import Snackbar from "containers/commons/Snackbar";
import Header from "containers/Header";
// components
import ViewerWrapper from "components/commons/ViewerWrapper";
// slices
import store from "slices";
import { updateBook, updateCurrentPage, updateToc } from "slices/book";

// styles
import "lib/styles/readerStyle.css";

const EpubReader = ({ url }) => {
  const dispatch = useDispatch();
  const viewerRef = useRef(null);
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
  const [firstVisibleCfi, setFirstVisibleCfi] = useState(null);
  const [shouldSaveCfi, setShouldSaveCfi] = useState(true);

  useEffect(() => {
    if (viewerRef.current) {
      const book = ePub(url);
      bookRef.current = book;
      const rendition = book.renderTo(viewerRef.current, {
        width: "100%",
        height: "100%",
        flow: bookOption.flow,
        spread: bookOption.spread,
      });

      renditionRef.current = rendition;

      rendition.display().then(() => {
        if (firstVisibleCfi) {
          renditionRef.current.display(firstVisibleCfi).catch((err) => {
            console.error(
              "Error displaying first visible CFI after initial load:",
              err
            );
          });
        } else {
          logCurrentPageText();
        }
      });

      const generateLocations = () => {
        book.ready
          .then(() => {
            book.locations.generate().then(() => {
              setTotalPages(book.locations.length());
            });
          })
          .catch((err) => {
            console.error("Error generating locations:", err);
          });
      };

      generateLocations();

      rendition.on("relocated", (location) => {
        const currentPage = location.start.displayed.page;
        const totalPages = location.start.displayed.total;

        setCurrentPage(currentPage);
        setTotalPages(totalPages);

        if (shouldSaveCfi) {
          setFirstVisibleCfi(location.start.cfi);
        }

        console.log(`Current Page: ${currentPage}, Total Pages: ${totalPages}`);

        dispatch(updateCurrentPage({ currentPage, totalPages }));

        logCurrentPageText();
      });

      const handleResize = () => {
        setShouldSaveCfi(true);
        if (renditionRef.current) {
          renditionRef.current.resize();
          generateLocations().then(() => {
            if (firstVisibleCfi) {
              renditionRef.current.display(firstVisibleCfi).catch((err) => {
                console.error(
                  "Error displaying first visible CFI after resize:",
                  err
                );
              });
            }
          });
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        book.destroy();
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [url, dispatch, firstVisibleCfi]);

  const updateStyles = () => {
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
      renditionRef.current.themes.fontSize(fontSize);

      if (bookRef.current) {
        bookRef.current.locations
          .generate()
          .then(() => {
            setTotalPages(bookRef.current.locations.length());

            if (firstVisibleCfi) {
              renditionRef.current.display(firstVisibleCfi).catch((err) => {
                console.error(
                  "Error displaying first visible CFI after style change:",
                  err
                );
              });
            }
          })
          .catch((err) => {
            console.error(
              "Error regenerating locations after style change:",
              err
            );
          });
      }
    }
  };

  useEffect(updateStyles, [fontSize, lineHeight, margin, fontFamily]);

  const onPageMove = (type) => {
    setShouldSaveCfi(false);
    if (renditionRef.current) {
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
  };

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

  const goToBookmark = (cfi) => {
    if (renditionRef.current) {
      renditionRef.current.display(cfi).catch((err) => {
        console.error("Error displaying bookmark:", err);
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
    if (totalPages > 1) {
      return ((currentPage / totalPages) * 100).toFixed(2);
    }
    return 0;
  };

  // TTS 관련 함수들
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

  useEffect(() => {
    // 배속 변경될 때 오디오 설정만 업데이트
    if (audioRef.current) {
      audioRef.current.playbackRate = rate; // 실시간 배속 반영
    }
  }, [rate]); // 배속 또는 성별이 변경될 때만 실행

  // 성별 변경 시 효과 적용
  useEffect(() => {
    if (isPlaying) {
      // 성별 변경 시 현재 재생 중인 오디오를 멈추고, 새로운 설정으로 재생
      stopTTS();
      resumeTTS();
    }
  }, [gender]); // gender가 변경될 때마다 실행

  useEffect(() => {
    if (audioSource && audioRef.current) {
      audioRef.current.src = audioSource;
      audioRef.current.play();
      audioRef.current.playbackRate = rate; // 배속 반영
      setIsPlaying(true);
      setIsPaused(false);
    }
  }, [audioSource]); // 오디오 소스가 변경될 때만 실행

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

  return (
    <div>
      <ViewerWrapper>
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
    </div>
  );
};

const Reader = () => {
  const location = useLocation();
  const { bookPath } = location.state || {};

  const epubUrl = `files/무정.epub`;
  console.log(epubUrl);

  return (
    <Provider store={store}>
      <EpubReader url={epubUrl} />
    </Provider>
  );
};

export default Reader;
