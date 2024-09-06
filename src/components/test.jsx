import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import EasySeeSo from 'seeso/easy-seeso';
import axios from 'axios';
import { alertMessage } from "../../src/utils/alertMessage";
import { AuthContext } from '../App';

const SEESO_API_KEY = process.env.REACT_APP_SEESO_API_KEY;

const EyeGaze = ({ viewerRef, onSaveGazeTime, bookText, book }) => {
  const { user } = useContext(AuthContext);
  const memId = user?.mem_id || null;
  const [calibrationData, setCalibrationData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const canvasRef = useRef(null);
  const seesoRef = useRef(null);

  const gazeInsideTimeRef = useRef(0);
  const gazeOutsideTimeRef = useRef(0);

  const isGazeInsideRef = useRef(false);
  const insideTimerRef = useRef(null);
  const outsideTimerRef = useRef(null);

  const [insideTimeTotal, setInsideTimeTotal] = useState(0);
  const insideTimeTotalRef = useRef(insideTimeTotal);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const viewer = viewerRef.current;

    if (canvas && viewer) {
      const rect = viewer.getBoundingClientRect();
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;  
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.left = `${rect.left}px`;
      canvas.style.top = `${rect.top}px`;
    }
  }, [viewerRef]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);
  
  useEffect(() => {
    const savedCalibrationData = localStorage.getItem('calibrationData');
    if (savedCalibrationData) {
      setCalibrationData(savedCalibrationData);
    }
  }, []);

  function showGaze(gazeInfo) {
    const canvas = canvasRef.current;
    const viewer = document.querySelector('iframe');

    if (canvas && viewer) {
      const rect = viewer.getBoundingClientRect();
      const ctx = canvas.getContext('2d');

      if (ctx) {
          const x = gazeInfo.x - rect.left;
          const y = gazeInfo.y - rect.top;
          const isGazeInside = x >= 0 && y >= 0 && x <= canvas.width && y <= canvas.height;

          if (isGazeInside) {
              if (!isGazeInsideRef.current) {
                  if (gazeOutsideTimeRef.current) {
                      const outsideDuration = Date.now() - gazeOutsideTimeRef.current;
                      console.log(`영역 밖 머문 시간: ${outsideDuration/1000}초`);
                  }

                  clearInterval(outsideTimerRef.current);
                  outsideTimerRef.current = null;
                  gazeOutsideTimeRef.current = 0;

                  gazeInsideTimeRef.current = Date.now();
                  isGazeInsideRef.current = true;

                  insideTimerRef.current = setTimeout(() => {
                    alertMessage('너무 오래 읽는 것 같은데?!','🤨');
                    clearTimeout(insideTimerRef.current);
                  }, 30000);
              }
          } else {
            if (isGazeInsideRef.current) {
              const timeSpentInside = Date.now() - gazeInsideTimeRef.current;

            if (timeSpentInside > 0 && timeSpentInside < 30000) {
              setInsideTimeTotal(prevTime => {
                const newTotal = prevTime + timeSpentInside;
                insideTimeTotalRef.current = newTotal;
                console.log(`영역 안 머문 누적 시간: ${newTotal / 1000}초`);
                return newTotal;
              });
            }

              gazeOutsideTimeRef.current = Date.now();
              isGazeInsideRef.current = false;

              clearTimeout(insideTimerRef.current);
              insideTimerRef.current = null;

              outsideTimerRef.current = setInterval(() => {
                const outsideDuration = Date.now() - gazeOutsideTimeRef.current;
                if (outsideDuration >= 10000) {
                  alertMessage("집중!집중!", "👀");
                  clearInterval(outsideTimerRef.current);
                }
              }, 1000);
            }
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2, true);
          ctx.fill();
      }
    }
  }

  async function afterInitialized() {
    const seeso = seesoRef.current;
    seeso.setMonitorSize(16);
    seeso.setFaceDistance(50);
    seeso.setCameraPosition(window.outerWidth / 2, true);

    try {
      seeso.setCameraPosition(0, true);
    } catch (error) {
      console.error('카메라 위치 설정 중 오류 발생:', error);
    }

    if (calibrationData) {
      seeso.setCalibrationData(calibrationData);
    }

    setIsInitialized(true);
  }

  function onGaze(gazeInfo) {
    showGaze(gazeInfo);
  }

  function onDebug(FPS, latency_min, latency_max, latency_avg) {}

  useEffect(() => {
    const initializeSeeso = async () => {
      const seeso = new EasySeeSo();
      seesoRef.current = seeso;

      try {
        await seeso.init(SEESO_API_KEY, afterInitialized, () => console.error('SeeSo SDK 초기화 실패!'));
      } catch (error) {
        console.error('SDK 초기화 중 오류 발생:', error);
      }
    };

    initializeSeeso();

    return () => {
      clearInterval(insideTimerRef.current);
      clearInterval(outsideTimerRef.current);
      if (seesoRef.current) {
        seesoRef.current.stopTracking(); 
      }
    };
  }, [calibrationData]);

  useEffect(() => {
    if (isInitialized && seesoRef.current) {
      seesoRef.current.startTracking(onGaze, onDebug);
    }
  }, [isInitialized]);

  const saveGazeTime = () => {
    const duration = insideTimeTotalRef.current / 1000;

    if (duration > 0) {
      axios.post('http://localhost:3001/gaze', {
        book_idx: book?.book_idx,
        mem_id: memId,
        book_text: bookText,
        gaze_duration: duration
      })
      .then(response => {
        gazeInsideTimeRef.current = 0;
        setInsideTimeTotal(0);
        if (onSaveGazeTime) onSaveGazeTime();
      })
      .catch(error => {
        gazeInsideTimeRef.current = 0;
        setInsideTimeTotal(0);
      });
    } else {
      gazeInsideTimeRef.current = 0;
      setInsideTimeTotal(0);
    }
  };

  useEffect(() => {
    if (onSaveGazeTime) {
      onSaveGazeTime(saveGazeTime);
    }
  }, [onSaveGazeTime]);

  return <canvas ref={canvasRef} className="absolute pointer-events-none"></canvas>;
};

export default EyeGaze;
