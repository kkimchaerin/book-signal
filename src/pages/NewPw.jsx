import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import NewPwPopup from '../components/NewPwPopup'
import { alertMessage } from "../../src/utils/alertMessage";

import '../css/newpw.css';

const NewPw = () => {
  const location = useLocation();
  const mem_id = location.state?.mem_id; // useLocation을 통해 mem_id 받기

  const [newPw, setNewPw] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');
  const [pwCheck, setPwCheck] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false); 

  useEffect(() => {
    if (confirmNewPw.length > 0) {
      if (newPw === confirmNewPw) {
        setPwCheck('success');
        setErrorMessage('');
      } else {
        setPwCheck('error');
        setErrorMessage('비밀번호가 일치하지 않습니다.');
      }
    } else {
      setPwCheck(null);
      setErrorMessage('');
    }
  }, [newPw, confirmNewPw]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pwCheck === 'success') {
      try {
        const response = await fetch('http://localhost:3001/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mem_id, newPw }), // mem_id를 직접 사용
        });

        if (response.ok) {
          setShowPopup(true); // 팝업 표시
        } else {
          const data = await response.json();
          alertMessage('비밀번호 재설정에 실패했습니다.','❗');
          // alert(data.message || '비밀번호 재설정에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error updating password:', error);
        alertMessage('서버 오류가 발생했습니다. 다시 시도해주세요.','❗');
      }
    } else {
      alertMessage('비밀번호가 일치하지 않습니다.','❗');
    }
  };
  return (
    <div className="newpw-container">
      <div className='title-container'>
        <h1 className='title-book'>북</h1>
        <h1 className='title-signal'>시그널</h1>
      </div>
      <div className='newpw-form-container'>
        <h4 className='newpw-title'>비밀번호 재설정</h4>
        <hr />
        <br />
        <form className="newpw-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input 
              type="password" 
              className='input-field' 
              id='newPw' 
              name='newPw' 
              placeholder='새 비밀번호 입력' 
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)} 
            />
          </div>
          <div className="input-group">
            <input 
              type="password" 
              className='input-field' 
              id='confirmNewPw' 
              name='confirmNewPw' 
              placeholder='비밀번호 확인' 
              value={confirmNewPw}
              onChange={(e) => setConfirmNewPw(e.target.value)} 
            />
            {pwCheck && (
              <span className="password-icon">
                {pwCheck === 'success' ? (
                  <FaCheckCircle color="green" />
                ) : (
                  <FaTimesCircle color="red" />
                )}
              </span>
            )}
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <button 
            type="submit" 
            className="newpw-button"
            // 비밀번호 불일치 시 버튼 비활성화
            disabled={pwCheck !== 'success'}
          >
            비밀번호 재설정
          </button>
        </form>
      </div>
      <div className="newpw-footer">
        <Link to="/FindId">아이디 찾기</Link> | <Link to="/Login">로그인</Link> | <Link to="/Join">회원가입</Link>
      </div>
      {/* 비밀번호 설정 완료 팝업 */}
      {showPopup &&(
          <NewPwPopup 
            message='비밀번호 재설정 완료'
            onClose={()=>setShowPopup(false)}
          />
        )}
    </div>
  );
}

export default NewPw;
