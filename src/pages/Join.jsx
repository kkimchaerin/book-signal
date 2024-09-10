import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import '../css/join.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import JoinPopup from '../components/JoinPopup'; // 팝업 컴포넌트 불러오기
import { alertMessage } from "../../src/utils/alertMessage";

const Join = () => {
  const [memId, setMemId] = useState('');
  const [memPw, setMemPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [memName, setMemName] = useState('');
  const [memNick, setMemNick] = useState('');
  const [memBirth, setMemBirth] = useState('');
  const [memEmail, setMemEmail] = useState('');
  const [emailCheck, setEmailCheck] = useState(null);
  const [nickCheck, setNickCheck] = useState(null);
  const [idCheck, setIdCheck] = useState(null);
  const [pwCheck, setPwCheck] = useState(null);
  const [errors, setErrors] = useState({});
  const [fieldsError, setFieldsError] = useState(false); // 모든 항목 입력 메시지 상태
  const [joinComplete, setJoinComplete] = useState(false); // 회원가입 완료 상태
  const [emailValid, setEmailValid] = useState(''); // 이메일 형식 오류 상태
  const [idCheckClicked, setIdCheckClicked] = useState(false); // 아이디 중복 체크 클릭 여부
  const [nickCheckClicked, setNickCheckClicked] = useState(false); // 닉네임 중복 체크 클릭 여부
  const [emailCheckClicked, setEmailCheckClicked] = useState(false); // 이메일 중복 체크 클릭 여부
  const navigate = useNavigate();

  // 이메일 검증 함수
  const validEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 이메일 중복 체크
  const checkEmail = async () => {
    if (!memEmail) {
      setEmailCheck({ status: 'error', message: '이메일을 입력해주세요.' });
      return;
    }
    if (!validEmail(memEmail)) {
      setEmailValid('이메일에 @를 포함한 올바른 이메일 형식을 입력해주세요.');
      return;
    }
    setEmailValid(''); // 오류 메시지 초기화
    try {
      const res = await fetch(`http://localhost:3001/check-email?mem_email=${memEmail}`);
      const data = await res.json();

      if (data.exists) {
        setEmailCheck({ status: 'error', message: '이미 사용중인 이메일 입니다.' });
        setEmailCheckClicked(false); // 중복 확인 실패
      } else {
        setEmailCheck({ status: 'success', message: '사용 가능한 이메일 입니다.' });
        setEmailCheckClicked(true); // 중복 확인 성공
      }
    } catch (err) {
      console.error('Error checking Email:', err);
    }
  };

  // 닉네임 중복 체크
  const checkNick = async () => {
    if (!memNick) {
      setNickCheck({ status: 'error', message: '닉네임을 입력해주세요.' });
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/check-nick?mem_nick=${memNick}`);
      const data = await res.json();

      if (data.exists) {
        setNickCheck({ status: 'error', message: '이미 사용중인 닉네임 입니다.' });
        setNickCheckClicked(false); // 중복 확인 실패
      } else {
        setNickCheck({ status: 'success', message: '사용 가능한 닉네임 입니다.' });
        setNickCheckClicked(true); // 중복 확인 성공
      }
    } catch (err) {
      console.error('Error checking Nick:', err);
    }
  };

  // 아이디 중복 체크
  const checkId = async () => {
    if (!memId) {
      setIdCheck({ status: 'error', message: '아이디를 입력해주세요.' });
      return;
    }
    try {
      const res = await fetch(`http://localhost:3001/check-id?mem_id=${memId}`);
      const data = await res.json();

      if (data.exists) {
        setIdCheck({ status: 'error', message: '이미 사용중인 아이디 입니다.' });
        setIdCheckClicked(false); // 중복 확인 실패
      } else {
        setIdCheck({ status: 'success', message: '사용 가능한 아이디 입니다.' });
        setIdCheckClicked(true); // 중복 확인 성공
      }
    } catch (err) {
      console.error('Error checking ID:', err);
    }
  };

  // 사용자가 입력값을 바꾸면 중복 체크 상태를 초기화
  useEffect(() => {
    setIdCheck(null);
    setIdCheckClicked(false);
  }, [memId]);

  useEffect(() => {
    setNickCheck(null);
    setNickCheckClicked(false);
  }, [memNick]);

  useEffect(() => {
    setEmailCheck(null);
    setEmailCheckClicked(false);
  }, [memEmail]);

  // 비밀번호 확인
  useEffect(() => {
    if (confirmPw.length > 0) {
      if (memPw === confirmPw) {
        setPwCheck('success');
      } else {
        setPwCheck('error');
      }
    } else {
      setPwCheck(null); // 비밀번호 확인 입력 값이 없을 때는 아이콘을 숨김
    }
  }, [memPw, confirmPw]);

  // 폼 제출 시 오류 확인
  const validateForm = () => {
    const newErrors = {};
    if (!memEmail) newErrors.memEmail = '이메일을 입력해주세요';
    if (!memName) newErrors.memName = '이름을 입력해주세요';
    if (!memNick) newErrors.memNick = '닉네임을 입력해주세요';
    if (!memId) newErrors.memId = '아이디를 입력해주세요';
    if (!memPw) newErrors.memPw = '비밀번호를 입력해주세요';
    if (!confirmPw) newErrors.confirmPw = '비밀번호 확인을 입력해주세요';
    if (!memBirth) newErrors.memBirth = '생년월일을 입력해주세요';

    setErrors(newErrors);

    // 모든 필드가 채워져 있지 않다면 "모든 항목을 입력해주세요" 메시지 표시
    setFieldsError(Object.keys(newErrors).length > 0);

    return Object.keys(newErrors).length === 0;
  };

  const submitBtn = async (e) => {
    e.preventDefault();

    if (!validateForm()) return; // 입력값 검증 후 오류가 있다면 제출 중단

    if (memPw !== confirmPw) {
      setErrors({ ...errors, confirmPw: '비밀번호가 일치하지 않습니다.' });
      setFieldsError(true); // 전체 오류 메시지 표시
      return;
    }

    // 중복 확인을 완료하지 않았을 때 처리
    if (!idCheckClicked || !nickCheckClicked || !emailCheckClicked) {
      alertMessage('중복 확인을 완료해주세요.','❗');
      return;
    }

    if (
      idCheck?.status === 'error' ||
      nickCheck?.status === 'error' ||
      emailCheck?.status === 'error'
    ) {
      alertMessage('중복 확인을 완료해주세요.','❗');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/join', {
        method: 'POST',
        body: JSON.stringify({
          mem_id: memId,
          mem_pw: memPw,
          mem_name: memName,
          mem_nick: memNick,
          mem_birth: memBirth,
          mem_mail: memEmail,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '가입 요청에 실패했습니다.');
      }

      // 회원가입 성공 시 팝업 창 띄우기
      setJoinComplete(true);
    } catch (err) {
      console.log(err);
      alertMessage('회원가입에 실패했습니다. 입력한 정보를 확인해 주세요','❗');
    }
  };

  const loginRedirect = () => {
    navigate('/login');
  };

  // 타이틀 컨테이너 클릭 시 Home 페이지로 이동
  const handleTitleClick = () => {
    navigate('/');
  };

  return (
    <div className="page-container">
      <div className="title-container" onClick={handleTitleClick} style={{ cursor: 'pointer' }}>
        <h1 className="title-book">북</h1>
        <h1 className="title-signal">시그널</h1>
      </div>
      <div className="join-container">
        <h4 className="join-title">회원가입</h4>
        <hr />
        <br />
        <form className="join-form">
          <div className={`input-group ${errors.memEmail ? 'error-border' : ''}`}>
            <input
              type="text"
              id="memEmail"
              name="memEmail"
              placeholder={errors.memEmail || "example@gmail.com"}
              value={memEmail}
              className={errors.memEmail || emailValid ? 'error-input' : ''}
              onChange={(e) => {
                setMemEmail(e.target.value);
                setErrors({ ...errors, memEmail: '' });
                setEmailValid(''); // 입력 시 이메일 형식 오류 초기화
                setFieldsError(false); // 입력 시 전체 오류 메시지 숨김
              }}
            />
            <button type="button" className="check-button" onClick={checkEmail}>
              중복확인
            </button>
          </div>
          {emailValid && <p className="emailvalid">{emailValid}</p>}
          {emailCheck && (
            <p className={`check-result ${emailCheck.status}`}>
              {emailCheck.status === 'error' ? <FaTimesCircle /> : <FaCheckCircle />}
              {emailCheck.message}
            </p>
          )}
          <div className={`input-group ${errors.memName ? 'error-border' : ''}`}>
            <input
              type="text"
              id="memName"
              name="memName"
              placeholder={errors.memName || "홍길동"}
              value={memName}
              className={errors.memName ? 'error-input' : ''}
              onChange={(e) => {
                setMemName(e.target.value);
                setErrors({ ...errors, memName: '' });
                setFieldsError(false);
              }}
            />
          </div>
          <div className={`input-group ${errors.memNick ? 'error-border' : ''}`}>
            <input
              type="text"
              id="memNick"
              name="memNick"
              placeholder={errors.memNick || "닉네임   ex) 바나나알러지원숭이"}
              value={memNick}
              className={errors.memNick ? 'error-input' : ''}
              onChange={(e) => {
                setMemNick(e.target.value);
                setErrors({ ...errors, memNick: '' });
                setFieldsError(false);
              }}
            />
            <button type="button" className="check-button" onClick={checkNick}>
              중복확인
            </button>
          </div>
          {nickCheck && (
            <p className={`check-result ${nickCheck.status}`}>
              {nickCheck.status === 'error' ? <FaTimesCircle /> : <FaCheckCircle />}
              {nickCheck.message}
            </p>
          )}
          <div className={`input-group ${errors.memId ? 'error-border' : ''}`}>
            <input
              type="text"
              id="memId"
              name="memId"
              placeholder={errors.memId || "아이디 입력"}
              value={memId}
              className={errors.memId ? 'error-input' : ''}
              onChange={(e) => {
                setMemId(e.target.value);
                setErrors({ ...errors, memId: '' });
                setFieldsError(false);
              }}
            />
            <button type="button" className="check-button" onClick={checkId}>
              중복확인
            </button>
          </div>
          {idCheck && (
            <p className={`check-result ${idCheck.status}`}>
              {idCheck.status === 'error' ? <FaTimesCircle /> : <FaCheckCircle />}
              {idCheck.message}
            </p>
          )}
          <div className={`join-input-group ${errors.memPw ? 'error-border' : ''}`}>
            <input
              type="password"
              id="memPw"
              name="memPw"
              placeholder={errors.memPw || "비밀번호 입력"}
              value={memPw}
              className={errors.memPw ? 'error-input' : ''}
              onChange={(e) => {
                setMemPw(e.target.value);
                setErrors({ ...errors, memPw: '' });
                setFieldsError(false);
              }}
            />
          </div>
          <div className={`join-input-group ${errors.confirmPw ? 'error-border' : ''}`}>
            <input
              type="password"
              id="confirmPw"
              name="confirmPw"
              placeholder={errors.confirmPw || "비밀번호 확인"}
              value={confirmPw}
              className={errors.confirmPw ? 'error-input' : ''}
              onChange={(e) => {
                setConfirmPw(e.target.value);
                setErrors({ ...errors, confirmPw: '' });
                setFieldsError(false);
              }}
            />
            {pwCheck && (
              <span className="password-icon">
                {pwCheck === 'error' ? <FaTimesCircle color="red" /> : <FaCheckCircle color="green" />}
              </span>
            )}
          </div>
          <div className={`join-input-group ${errors.memBirth ? 'error-border' : ''}`}>
            <label htmlFor="memBirth" className="input-label">생년월일</label>
            <input
              type="date"
              id="memBirth"
              name="memBirth"
              placeholder={errors.memBirth || "YYYY-MM-DD"}
              value={memBirth}
              className={errors.memBirth ? 'error-input' : ''}
              onChange={(e) => {
                setMemBirth(e.target.value);
                setErrors({ ...errors, memBirth: '' });
                setFieldsError(false);
              }}
            />
          </div>
          {/* 모든 항목을 입력해주세요 메시지 */}
          {fieldsError && (
            <p className="all-fields-error">*모든 항목을 확인 해주세요.</p>
          )}
          <button type="submit" onClick={submitBtn}>
            회원가입
          </button>
        </form>
      </div>
      <div className="footer-wrapper">
        <div className="login-footer">
          <Link to="/Login">이미 회원이신가요?</Link>
        </div>
      </div>
      {/* 회원가입 완료 팝업 */}
      {joinComplete && (
        <JoinPopup
          message="회원가입 완료"
          buttonText="로그인"
          onButtonClick={loginRedirect}
        />
      )}
    </div>
  );
};

export default Join;