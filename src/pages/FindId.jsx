import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorPopup } from '../components/ErrorPopup';
import FindIdPopup from '../components/FindIdPopup';
import '../css/findid.css';

const FindId = () => {
  const [memEmail, setMemEmail] = useState('');
  const [memName, setMemName] = useState('');
  const [foundId, setFoundId] = useState(''); // 찾은 아이디를 저장
  const [showPopup, setShowPopup] = useState(false); // 팝업 표시 여부
  const [showErrorPopup, setShowErrorPopup] = useState(false); // 오류 팝업 표시 여부
  const [errorMessage, setErrorMessage] = useState(''); // 오류 메시지 저장

  const navigate = useNavigate();

  const FindId = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3001/find-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mem_email: memEmail, mem_name: memName }),
      });

      const data = await response.json();

      if (response.ok) {
        setFoundId(data.mem_id); // 찾은 아이디 설정
        setShowPopup(true); // 팝업 표시
      } else {
        setErrorMessage(data.message); // 오류 메시지 설정
        setShowErrorPopup(true); // 오류 팝업 표시
      }
    } catch (err) {
      setErrorMessage('서버와의 통신 중 오류가 발생했습니다.');
      setShowErrorPopup(true);
      console.error(err);
    }
  };

  // 타이틀 컨테이너 클릭 시 Home 페이지로 이동
  const handleTitleClick = () => {
    navigate('/');
  };

  return (
    <div className="findid-container">
      <div className='title-container' onClick={handleTitleClick}>
        <h1 className='title-book'>북</h1>
        <h1 className='title-signal'>시그널</h1>
      </div>
      <div className='findid-form-container'>
        <h4 className='findid-title'>아이디 찾기</h4>
        <hr />
        <br />
        <form className="findid-form">
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
              id='memName'
              name='memName'
              placeholder='홍길동'
              value={memName}
              onChange={(e) => setMemName(e.target.value)} />
          </div>
          <button type="submit" className="findid-button" onClick={FindId}>다음</button>
        </form>
      </div>
      <div className="findid-footer">
        <Link to="/FindPw">비밀번호 찾기</Link> | <Link to="/Login">로그인</Link> | <Link to="/Join">회원가입</Link>
      </div>
      {/* 아이디 찾기 성공 시 팝업 표시 */}
      {showPopup && (
        <FindIdPopup
          memName={memName}
          memId={foundId}
          onClose={() => setShowPopup(false)}
        />
      )}
      {/* 오류 발생 시 팝업 표시 */}
      {showErrorPopup && (
        <ErrorPopup
          message={errorMessage}
          onClose={() => setShowErrorPopup(false)}
        />
      )}
    </div>
  );
};

export default FindId;