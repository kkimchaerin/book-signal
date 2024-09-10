import React, { useState, createContext, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast";
import './App.css';
import './css/fonts.css';
import Home from './pages/Home';
import MyLib from './pages/MyLib';
import MyPage from './pages/MyPage';
import RootLayout from './pages/RootLayout';
import Login from './pages/Login';
import Join from './pages/Join';
import BookViewTest from './pages/BookViewPDF';
import GetReview from './pages/GetReview';
import ErrorBoundary from './pages/ErrorBoundary';
import FindId from './pages/FindId';
import FindPw from './pages/FindPw';
import NewPw from './pages/NewPw';
import BookViewer from './pages/BookViewer';
import BookDetail from './pages/BookDetail';
import DeleteUser from './pages/DeleteUser';
import SearchReport from './pages/searchReport';
import RankingBookList from './pages/RankingBookList';
import Modal from './components/Modal';
import ReaderWrapper from '../src/containers/Reader';
import Reader from 'components/Reader';
import Epubjs from 'components/Epubjs';
import EyeGaze from 'pages/EyeGaze';
import axios from 'axios';
import UploadEpub from 'pages/UploadEpub';

// 로그인 상태를 관리하기 위한 Context 생성
export const AuthContext = createContext();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // 로그인 상태 관리
  const [user, setUser] = useState(null);  // 로그인한 사용자 정보 관리
  const [userInfo, setUserInfo] = useState(null); // check-session으로 가져오는 사용자 정보
  

  // 로그아웃 처리
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setUserInfo(null);  // 세션 정보도 초기화
    localStorage.removeItem('user');  // 로컬 스토리지에서 사용자 정보 제거
  };

  // 로그인 상태 확인 (AuthContext)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // check-session을 통해 사용자 정보 가져오기
  useEffect(() => {
    if (isAuthenticated) {
      axios.get('http://localhost:3001/check-session', { withCredentials: true })
        .then((response) => {
          if (response.data && response.data.user) {
            setUserInfo(response.data.user); // 사용자 정보 업데이트
          }
        })
        .catch((error) => {
          console.error('check-session 요청 중 오류 발생:', error);
        });
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser, handleLogout, userInfo }}>
      <Toaster />
      <ErrorBoundary>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path='/mylib' element={<MyLib />} />
            <Route path='/mypage' element={<MyPage />} />
            <Route path="/bookviewtest" element={<BookViewTest />} />
            <Route path='/deleteuser' element={<DeleteUser />} />
            <Route path='/searchreport' element={<SearchReport />} />
            <Route path='/ranking' element={<RankingBookList />} />
            <Route path="/ranking/popular" element={<RankingBookList />} />
            <Route path="/ranking/best" element={<RankingBookList />} />
            <Route path="/ranking/new" element={<RankingBookList />} />
            <Route path="/detail" element={<BookDetail />} />
            <Route path="/modal" element={<Modal />} />
            <Route path="/reader" element={<Reader />} />
            <Route path="/epubjs" element={<Epubjs />} />
            <Route path='/eyegaze' element={<EyeGaze />} />
            <Route path='/uploadepub' element={<UploadEpub />} />
          </Route>

          <Route path="/readerwrapper" element={<ReaderWrapper url="files/김유정-동백꽃-조광.epub" />} />
          <Route path='/login' element={<Login />} />
          <Route path='/join' element={<Join />} />
          <Route path="/findid" element={<FindId />} />
          <Route path="/findpw" element={<FindPw />} />
          <Route path="/newpw" element={<NewPw />} />
          <Route path="/bookviewer" element={<BookViewer />} />
          <Route path='/getreview' element={<GetReview />} />
        </Routes>
      </ErrorBoundary>
    </AuthContext.Provider>
  );
}

export default App;
