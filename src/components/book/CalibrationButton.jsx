import { useContext, useEffect } from 'react';
import EasySeeSo from 'seeso/easy-seeso';
import { AuthContext } from '../../App';

const SEESO_API_KEY = process.env.REACT_APP_SEESO_API_KEY;

const CalibrationButton = () => {
  const { user } = useContext(AuthContext);
  const memId = user?.mem_id || null;
  // console.log('흐아ㅏㅇ', memId);
  

  const startCalibration = () => {
    const redirectUrl = window.location.href;
    const calibrationPoint = 5;
    EasySeeSo.openCalibrationPage(SEESO_API_KEY, memId, redirectUrl, calibrationPoint);
  };

  function parseCalibrationDataInQueryString () {
    const href = window.location.href
    const decodedURI = decodeURI(href)
    const queryString = decodedURI.split('?')[1];
    if (!queryString) return undefined
    const jsonString = queryString.slice("calibrationData=".length, queryString.length)
    return jsonString
}

  useEffect(() => {
    const calibrationData = parseCalibrationDataInQueryString();

    if (calibrationData) {
      // 로컬 스토리지에 교정 데이터 저장
      localStorage.setItem('calibrationData', calibrationData);
      console.log('Calibration data saved to localStorage');
    }
  }, []);

  return (
    <button onClick={startCalibration}>
      시선 교정
    </button>
  );
};

export default CalibrationButton;
