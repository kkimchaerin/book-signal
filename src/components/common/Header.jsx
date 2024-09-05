import React, { useContext } from 'react';
import Search from './Search';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, setIsAuthenticated, setUser } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3001/logout', {
        method: 'POST',
        credentials: 'include', // 세션 쿠키를 포함하여 전송
      });

      if (response.ok) {
        // 로그아웃 성공 시 전역 상태 업데이트
        setIsAuthenticated(false);
        setUser(null);
        navigate('/');
      } else {
        console.error('로그아웃 실패');
      }
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    }
  };

  return (
    <header className=' mt-6 max-w-screen-xl mx-auto mb-4 flex justify-between items-center px-2 py-5 font-semibold'>
      <h1 className='text-4xl font-bold font-logo'>
        <Link to="/"><span className='text-primary'>북 </span>시그널</Link>
      </h1>
      <div className='flex flex-1 items-center'>
        <ul className='flex gap-6 ml-[50px] text-xl'>
          <li>
            <NavLink
              to="/mylib"
              className={({ isActive }) =>
                isActive ? 'text-primary' : 'hover:text-primary'
              }
            >
              내 서재
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/mypage"
              className={({ isActive }) =>
                isActive ? 'text-primary' : 'hover:text-primary'
              }
            >
              마이페이지
            </NavLink>
          </li>
        </ul>
        <div className='flex-grow' style={{ minWidth: '200px' }}></div> {/* 유동적인 간격 */}
        <Search />
        <div className='mr-4'></div>
      </div>
      <div className='text-xl'>
        {!isAuthenticated ? (
          <>
            <button type='button' onClick={() => navigate('/join')} className='mr-5'>회원가입</button>
            <button type='button' onClick={() => navigate('/login')}>로그인</button>
          </>
        ) : (
          <>
            <span className='mr-5 text-[#f57e53]'>{user?.mem_nick}</span><span className='ml-[-15px] mr-4'>님</span>
            <button type='button' onClick={handleLogout}>로그아웃</button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;