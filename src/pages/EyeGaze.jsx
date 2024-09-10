import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import EasySeeSo from 'seeso/easy-seeso';
import axios from 'axios';
import { alertMessage } from "../../src/utils/alertMessage";
import { AuthContext } from '../App';

const SEESO_API_KEY = process.env.REACT_APP_SEESO_API_KEY;
// console.log(SEESO_API_KEY);


const EyeGaze = ({ viewerRef, onSaveGazeTime, bookText, book, currentPage, cfi }) => {
  const { user } = useContext(AuthContext);
  const memId = user?.mem_id || null;
  // console.log('user!!!', user);
  
  // console.log('CFI 값:', cfi);

  const [calibrationData, setCalibrationData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false); // SDK 초기화 상태 관리
  const [hasShownWebcamWarning, setHasShownWebcamWarning] = useState(false); // 플래그 변수
  
  const canvasRef = useRef(null);
  const seesoRef = useRef(null);

  const gazeInsideTimeRef = useRef(0); // 영역 안에서 머문 시간
  const gazeOutsideTimeRef = useRef(0); // 영역 바깥에서 머문 시간

  const isGazeInsideRef = useRef(false);
  const insideTimerRef = useRef(null); // 영역 안에서의 30초 체크를 위한 타이머
  const outsideTimerRef = useRef(null); // 영역 밖에서의 10초 체크를 위한 타이머

  const [insideTimeTotal, setInsideTimeTotal] = useState(0);
  const insideTimeTotalRef = useRef(insideTimeTotal); // 최신 상태를 관리하기 위한 ref


  /******************** 화면 크기에 맞춰 canvas 크기 조정 ********************/
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const viewer = viewerRef.current;

    if (canvas && viewer) {
      const rect = viewer.getBoundingClientRect();
      // 부모 요소의 크기 확인 및 적용
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;  
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.left = `${rect.left}px`;
      canvas.style.top = `${rect.top}px`;

      // 시선추적 영역 확인용
      // const ctx = canvas.getContext('2d');
      // ctx.strokeStyle = '#800080'; // 보라색
      // ctx.lineWidth = 2;
      // ctx.clearRect(0, 0, canvas.width, canvas.height); 
      // ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
  }, [viewerRef]);


  useEffect(() => {
    resizeCanvas();
    
    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);
  
  
  /******************** 로컬 스토리지에서 교정 데이터 로드 ********************/
  useEffect(() => {
    const savedCalibrationData = localStorage.getItem('calibrationData');
    console.log('calibrationData 로컬스토리지', savedCalibrationData);
    
    if (savedCalibrationData) {
      setCalibrationData(savedCalibrationData);
    }
  }, []);


  /******************** 시선 추적 시간 계산 ********************/  
  function showGaze(gazeInfo) {

    // Gaze 정보 유효성 검증
  //   if (!gazeInfo || typeof gazeInfo.x === 'undefined' || typeof gazeInfo.y === 'undefined' ||
  //     typeof gazeInfo.screen_x === 'undefined' || typeof gazeInfo.screen_y === 'undefined') {
  //     console.error('왜?', gazeInfo);
  //   return;
  // }

    // Gaze 정보를 콘솔에 출력
    // console.log(`[좌표] X: ${gazeInfo.x}, Y: ${gazeInfo.y}`);
    
    const canvas = canvasRef.current;
    const viewer = document.querySelector('iframe');

    if (canvas && viewer) {
      const rect = viewer.getBoundingClientRect();
      const ctx = canvas.getContext('2d');

      if (ctx) {
          // Canvas 내 좌표로 변환
          const x = gazeInfo.x - rect.left;
          const y = gazeInfo.y - rect.top;
          const isGazeInside = x >= 0 && y >= 0 && x <= canvas.width && y <= canvas.height;

          if (isGazeInside) {
              if (!isGazeInsideRef.current) {
                  if (gazeOutsideTimeRef.current) {  // 시선이 영역 안으로 들어왔을 때
                      // 시선이 바깥에 머문 시간 계산
                      const outsideDuration = Date.now() - gazeOutsideTimeRef.current;
                      console.log(`영역 밖 머문 시간: ${outsideDuration/1000}초`);
                  }

                  // 타이머 제거 및 바깥 머문 시간 초기화
                  clearInterval(outsideTimerRef.current);
                  outsideTimerRef.current = null;
                  gazeOutsideTimeRef.current = 0;

                  // 시선이 영역 안으로 들어왔을 때의 시간을 기록
                  gazeInsideTimeRef.current = Date.now();
                  isGazeInsideRef.current = true;

                  // 영역 안에서의 30초 체크를 위한 타이머 설정
                  insideTimerRef.current = setTimeout(() => {
                    alertMessage('너무 오래 읽는 것 같은데?!','🤨');
                    clearTimeout(insideTimerRef.current); // 알림 후 타이머 해제
                  }, 30000); // 30초 후에 알림
              }
          } else {
            if (isGazeInsideRef.current) {
              // 시선이 영역 밖으로 나갔을 때 영역 안에 머문 시간을 계산하고 누적
              const timeSpentInside = Date.now() - gazeInsideTimeRef.current;

            if (timeSpentInside > 0 && timeSpentInside < 30000) { // 비정상적으로 큰 값 방지
              setInsideTimeTotal(prevTime => {
                const newTotal = prevTime + timeSpentInside;
                insideTimeTotalRef.current = newTotal;
                console.log(`영역 안 머문 누적 시간: ${newTotal / 1000}초`);
                return newTotal;
              });
            } 
            // else {
            //   console.error("잘못된 시간 계산 감지됨:", timeSpentInside);
            // }

              // 시선이 영역 밖으로 나갔으므로 바깥에 머문 시간 기록 시작
              gazeOutsideTimeRef.current = Date.now();
              isGazeInsideRef.current = false;

              // 안에서의 30초 타이머 제거
              clearTimeout(insideTimerRef.current);
              insideTimerRef.current = null;

              // 10초 체크를 위한 타이머 설정
              outsideTimerRef.current = setInterval(() => {
                const outsideDuration = Date.now() - gazeOutsideTimeRef.current;
                if (outsideDuration >= 10000) { // 10초 이상 머물렀다면
                  alertMessage("집중!집중!", "👀");
                  clearInterval(outsideTimerRef.current); // 알림 후 타이머 해제
                }
              }, 1000);
            }
          }
      }
  }
}


  /******************** 시선추적 초기화 및 교정 데이터 적용 ********************/  
  async function afterInitialized() {
    console.log('SeeSo SDK 초기화 성공!');
    const seeso = seesoRef.current;
    seeso.setMonitorSize(16);
    seeso.setFaceDistance(50);
    seeso.setCameraPosition(window.outerWidth / 2, true);

      // 카메라 위치 설정 (window.outerWidth / 2가 제대로 동작하지 않으면 기본 값을 사용)
  try {
    // 혹시 오류가 발생하는지 확인
    seeso.setCameraPosition(0, true); // X 좌표를 0으로 설정하고, flip 카메라를 true로 설정
    console.log('카메라 위치 설정 완료');
  } catch (error) {
    console.error('카메라 위치 설정 중 오류 발생:', error);
  }

    // 시선 교정
    // calibrationData = parseCalibrationDataInQueryString();
    // console.log('cal', calibrationData);
    
  //   if (calibrationData){
  //     const seeSo = new EasySeeSo();
  //     await seeSo.init(SEESO_API_KEY,
  //         async () => {        
  //             await seeSo.startTracking(onGaze, onDebug)
  //             await seeSo.setCalibrationData(calibrationData)
  //             console.log("시선 교정 적용 완료");
  //         }, // callback when init succeeded.
  //         () => console.log("callback when init failed.") // callback when init failed.
  //     )
  // }
    if (calibrationData) {
      seeso.setCalibrationData(calibrationData);
      console.log("시선 교정 적용 완료");
    }

    // seeso.startTracking(onGaze, onDebug);
    setIsInitialized(true); // SDK 초기화 완료 상태로 설정
  }

  function afterFailed() {
    console.log('SeeSo SDK 초기화 실패!');
    if (!hasShownWebcamWarning) {
      alertMessage("웹캠이 감지되지 않았습니다. 기능을 사용하려면 웹캠을 연결하세요.", "⚠️");
      setHasShownWebcamWarning(true); // 경고 메시지를 표시한 상태로 설정
    }
  }

  function onGaze(gazeInfo) {
    // if (!gazeInfo || typeof gazeInfo.screen_x === 'undefined' || typeof gazeInfo.screen_y === 'undefined') {
    //   console.error('Invalid gazeInfo:', gazeInfo);
    //   return;
    // }

    showGaze(gazeInfo);

    // if (seesoRef.current) {
    //     showGaze(gazeInfo);
    // } else {
    //     console.error('SeeSo SDK is not initialized properly.');
    // }
  }

  function onDebug(FPS, latency_min, latency_max, latency_avg) {
    // console.log("Debug Info:", FPS, latency_min, latency_max, latency_avg);
  }


   /******************** SDK 초기화 및 시선 추적 시작 ********************/
  useEffect(() => {
    const initializeSeeso = async () => {
      const seeso = new EasySeeSo();
      seesoRef.current = seeso;

      try {
        await seeso.init(SEESO_API_KEY, afterInitialized, afterFailed);
      } catch (error) {
        console.error('SDK 초기화 중 오류 발생:', error);
      }
    };

    initializeSeeso();

    /******************** 컴포넌트 언마운트 시 모든 타이머와 시선 추적 중지 ********************/
    return () => {
      clearInterval(insideTimerRef.current);
      clearInterval(outsideTimerRef.current);
      
      if (seesoRef.current) {
        seesoRef.current.stopTracking(); 
        console.log("Eye tracking stopped.");
      }
    };
  }, [calibrationData]);


  /******************** 시선 추적 시작 (초기화 완료 후) ********************/
  useEffect(() => {
    if (isInitialized && seesoRef.current) {
      seesoRef.current.startTracking(onGaze, onDebug);
    }
  }, [isInitialized]);

  /******************** 페이지 이동 시 시선 추적 중단 후 재시작 ********************/
useEffect(() => {
  if (seesoRef.current) {
    seesoRef.current.stopTracking(); // 페이지 이동 전 시선 추적 중단
    seesoRef.current.startTracking(onGaze, onDebug); // 페이지 이동 후 시선 추적 재시작
  }
}, [currentPage]);


  /******************** 시선 추적 시간 저장 ********************/
  const bookIdx = book?.book_idx; 
  // 임의로 지정된 값들(테스트용)
  // const bookIdx = 1; 
  // memId = 'zzang';
  // bookText = '텍스트';

  const saveGazeTime = () => {
    const duration = insideTimeTotalRef.current / 1000; // ref에서 최신 상태 값을 가져옴

    if (duration > 0) {
      console.log('저장할 gazeTime:', duration);
    //   console.log('으아아아아',{
    //     book_idx: bookIdx,
    //     mem_id: memId,
    //     book_text: bookText,
    //     book_mark: cfi,
    //     gaze_duration: duration
    // });
  
      axios.post('http://localhost:3001/gaze', {
        book_idx: bookIdx,
        mem_id: memId,
        book_text: bookText,
        book_mark: cfi,
        gaze_duration: duration
      })
      .then(response => {
        console.log('gazeTime 저장 성공:', response.data);
        gazeInsideTimeRef.current = 0;  // 저장 후 시간 초기화
        setInsideTimeTotal(0); // 상태를 0으로 설정
        if (onSaveGazeTime) onSaveGazeTime();
      })
      .catch(error => {
        console.error('gazeTime 저장 실패:', error);
        gazeInsideTimeRef.current = 0;
        setInsideTimeTotal(0);
      });
    } else {
      console.log('gazeTime이 0이거나 없음');
      gazeInsideTimeRef.current = 0;
      setInsideTimeTotal(0);
    }
  };

  useEffect(() => {
    if (onSaveGazeTime) {
      onSaveGazeTime(saveGazeTime);
    }
  }, [onSaveGazeTime]);

    // userInfo가 null일 때 로딩 상태를 표시
    // if (!userInfo) {
    //   return <div>로딩 중...</div>;
    // }

  return (
    <>
      <canvas ref={canvasRef} className="absolute pointer-events-none"></canvas>
    </>
  );
};

export default EyeGaze;
