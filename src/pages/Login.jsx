import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import '../css/login.css';

const Login = () => { // 'async' 키워드를 제거
  const [memId, setMemId] = useState('');
  const [memPw, setMemPw] = useState('');
  const [autologin, setAutoLogin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { setIsAuthenticated, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // 비동기 로그인 함수
  const login = async (e) => {
    e.preventDefault(); // 폼 제출 기본 동작 방지

    try {
      const response = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mem_id: memId, mem_pw: memPw, autologin }),
        credentials: 'include', // 쿠키 포함 설정
      });

      const data = await response.json(); // JSON 형식의 응답 데이터

      if (response.ok) {
        if (data.user) {
          // 로그인 성공 시
          setIsAuthenticated(true);
          setUser({ mem_id: data.user.mem_id, mem_nick: data.user.mem_nick });
          navigate('/'); // 메인 페이지로 이동
        } else {
          // 사용자 데이터가 없을 때 오류 메시지 설정
          setErrorMessage('로그인 정보가 잘못되었습니다.');
        }
      } else {
        // 응답이 실패했을 때 오류 메시지 설정
        setErrorMessage(data.message || '로그인 실패');
      }
    } catch (error) {
      console.error('Login Error:', error); // 콘솔에 오류 로그 출력
      setErrorMessage('서버 오류가 발생했습니다. 나중에 다시 시도해주세요.');
    }
  };

  return (
    <div className='page-container'>
      <div className='title-container'>
        <h1 className='title-book'>북</h1>
        <h1 className='title-signal'>시그널</h1>
      </div>
      <div className='login-container'>
        <h4 className='login-title'>로그인</h4>
        <hr />
        <br />
        <form className='login-form' onSubmit={login}>
          <div className='input-group'>
            <input
              type='text'
              id='memId'
              name='memId'
              placeholder='아이디'
              value={memId}
              onChange={(e) => setMemId(e.target.value)}
              required
            />
          </div>
          <div className='input-group'>
            <input
              type='password'
              id='memPw'
              name='memPw'
              placeholder='비밀번호'
              value={memPw}
              onChange={(e) => setMemPw(e.target.value)}
              required
            />
          </div>
          <div className='auto-login'>
            <input
              type='checkbox'
              id='autologin'
              checked={autologin}
              onChange={() => setAutoLogin(!autologin)}
            />
            <label htmlFor='autologin'>자동로그인</label>
          </div>
          {errorMessage && <p className='error-message'>{errorMessage}</p>}
          <button type='submit'>로그인</button>
        </form>
      </div>
      <div className='footer-wrapper'>
        <div className='login-footer'>
          <Link to='/find-id'>아이디 찾기</Link> | <Link to='/find-pw'>비밀번호 찾기</Link> | <Link to='/join'>회원가입</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
