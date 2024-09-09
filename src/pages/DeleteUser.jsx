import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/deleteuser.css';
import { AuthContext } from '../App'; // AuthContext 가져오기

const DeleteUser = () => {
  const [memId, setMemId] = useState('');
  const [memPw, setMemPw] = useState('');
  const [loading, setLoading] = useState(false); // 로딩 상태 추가
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useContext(AuthContext); // AuthContext에서 상태 업데이트 함수 가져오기

  const handleDeleteUser = async (e) => {
    e.preventDefault();

    // 폼 검증: 아이디와 비밀번호가 입력되었는지 확인
    if (!memId || !memPw) {
      alert('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true); // 로딩 상태 시작

    try {
      const response = await axios.post('http://localhost:3001/deleteuser', {
        mem_id: memId,
        mem_pw: memPw
      }, { withCredentials: true });

      if (response.status === 200) {
        alert('회원탈퇴가 완료되었습니다.');
        setIsAuthenticated(false); // 로그인 상태를 false로 설정
        setUser(null); // 사용자 정보를 null로 설정
        setMemId(''); // 아이디 필드 초기화
        setMemPw(''); // 비밀번호 필드 초기화
        navigate('/'); // 홈 페이지로 리디렉션
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert('아이디 또는 비밀번호가 잘못되었습니다.');
      } else {
        console.error('회원탈퇴 실패:', error);
        alert('서버 오류로 인해 회원탈퇴에 실패했습니다.');
      }
    } finally {
      setLoading(false); // 로딩 상태 종료
    }
  };

  return (
    <div className='deleteuser-page'>
      <div className='title-container'>
        <h1 className='title-book'>북</h1>
        <h1 className='title-signal'>시그널</h1>
      </div>
      <div className="form-container">
        <h4 className="deleteuser-title">회원탈퇴</h4>
        <hr />
        <br />
        <form className="deleteuser-form" onSubmit={handleDeleteUser}>
          <div className="input-group">
            <input
              type="text"
              className="input-field"
              id="memId"
              name="memId"
              placeholder="아이디 입력"
              value={memId}
              onChange={(e) => setMemId(e.target.value)}
              disabled={loading} // 로딩 중에는 입력 비활성화
            />
          </div>
          <div className="input-group">
            <input
              type="password"
              className="input-field"
              id="memPw"
              name="memPw"
              placeholder="비밀번호 입력"
              value={memPw}
              onChange={(e) => setMemPw(e.target.value)}
              disabled={loading} // 로딩 중에는 입력 비활성화
            />
          </div>
          <button type="submit" className="deleteuser-button" disabled={loading}>
            {loading ? '탈퇴 중...' : '회원탈퇴'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default DeleteUser;
