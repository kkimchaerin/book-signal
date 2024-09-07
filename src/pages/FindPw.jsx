import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {ErrorPopupPw} from '../components/ErrorPopup'; // 오류 팝업 컴포넌트 임포트
import '../css/findpw.css';

const FindPw = () => {
  const [memEmail, setMemEmail] = useState('');
  const [memId, setMemId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false); // 오류 팝업 표시 여부
  const navigate = useNavigate();
  
  const handleTitleClick = () => {
    navigate('/');
  };

  const handleFindPw = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3001/find-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mem_email: memEmail, mem_id: memId }),
      });

      if (response.ok) {
        // 비밀번호 찾기가 성공했을 때 mem_id를 함께 NewPw 페이지로 전달
        navigate('/newpw', { state: { mem_id: memId } });
      } else {
        // 오류 메시지 처리
        const data = await response.json();
        setErrorMessage(data.message);
        setShowErrorPopup(true);
      }
    } catch (err) {
      setErrorMessage('서버와의 통신 중 오류가 발생했습니다.');
      setShowErrorPopup(true);
      console.error(err);
    }
  };

  return (
    <div className="findpw-container">
      <div className='title-container' onClick={handleTitleClick} style={{ cursor: 'pointer' }}>
        <h1 className='title-book'>북</h1>
        <h1 className='title-signal'>시그널</h1>
      </div>
      <div className='findpw-form-container'>
        <h4 className='findpw-title'>비밀번호 찾기</h4>
        <hr />
        <br />
        <form className="findpw-form" onSubmit={handleFindPw}>
          <div className="input-group">
            <input
              type="text"
              className='input-field'
              id='memEmail'
              name='memEmail'
              placeholder='example@gmail.com'
              value={memEmail}
              onChange={(e) => setMemEmail(e.target.value)} />
          </div>
          <div className="input-group">
            <input
              type="text"
              className='input-field'
              id='memId'
              name='memId'
              placeholder='아이디'
              value={memId}
              onChange={(e) => setMemId(e.target.value)} />
          </div>
          <button type="submit" className="findpw-button">다음</button>
        </form>
      </div>
      <div className="findpw-footer">
        <Link to="/FindId">아이디 찾기</Link> | <Link to="/Login">로그인</Link> | <Link to="/Join">회원가입</Link>
      </div>
        {/* 오류 발생 시 팝업 표시 */}
        {showErrorPopup && (
        <ErrorPopupPw
          message={errorMessage} 
          onClose={() => setShowErrorPopup(false)} 
        />
      )}
    </div>
  );
}

export default FindPw;
