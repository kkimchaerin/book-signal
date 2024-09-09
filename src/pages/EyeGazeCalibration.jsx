import React, { useRef, useEffect, useState } from 'react';
import EasySeeSo from 'seeso/easy-seeso';

const SEESO_API_KEY = process.env.REACT_APP_SEESO_API_KEY;

const EyeGazeCalibration = () => {
  const seesoRef = useRef(null);
  const [calibrationRunning, setCalibrationRunning] = useState(false);

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

    return () => {
      const seeso = seesoRef.current;
      if (seeso) {
        seeso.stopTracking();
      }
    };
  }, []);

  const startCalibration = () => {
    const seeso = seesoRef.current;
    if (seeso) {
      setCalibrationRunning(true);
      seeso.startCalibration(onCalibrationResult);
    }
  };

  const onCalibrationResult = (result) => {
    setCalibrationRunning(false);
    if (result) {
      console.log('Calibration successful:', result);
    } else {
      console.log('Calibration failed. Please try again.');
    }
  };

  const afterInitialized = () => {
    console.log('SDK 초기화 성공!');
    // 필요에 따라 바로 교정 시작 가능
    // startCalibration();
  };

  const afterFailed = () => {
    console.log('SDK 초기화 실패!');
  };

  return (
    <div>
      {calibrationRunning ? (
        <p>Calibration in progress...</p>
      ) : (
        <button onClick={startCalibration}>Start Calibration</button>
      )}
    </div>
  );
};

export default EyeGazeCalibration;
