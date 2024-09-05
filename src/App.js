import React, { useState, createContext, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast";
import './App.css';
import './css/fonts.css';
import Home from './pages/Home';
import MyLib from './pages/MyLib';
import MyPage from './pages/MyPage';
import RootLayout from './pages/RootLayout';
import Chatbot from './components/Chatbot';
import Login from './pages/Login';
import Join from './pages/Join';
import BookViewTest from './pages/BookViewPDF';
import GetReview from './pages/GetReview';
import ErrorBoundary from './pages/ErrorBoundary';
import FindId from './pages/FindId';
import FindPw from './pages/FindPw';
import NewPw from './pages/NewPw';
import BookViewer from './pages/BookViewer';
import BookViewPDF from './pages/BookViewPDF';
import BookDetail from './pages/BookDetail';
import DeleteUser from './pages/DeleteUser';
import SearchReport from './pages/searchReport';
import RankingBookList from './pages/RankingBookList';
import Modal from './components/Modal';
import ReaderWrapper from '../src/containers/Reader';
import Reader from 'components/Reader';
import Epubjs from 'components/Epubjs';
import EyeGaze from 'pages/EyeGaze';

// 로그인 상태를 관리하기 위한 Context 생성
export const AuthContext = createContext();

const consoleWarn = console.warn;
console.warn = (...args) => {
  if (args[0].includes('ResizeObserver loop completed with undelivered notifications')) {
    return;
  }
  consoleWarn(...args);
};

function App() {
  const epubUrl = "files/김유정-동백꽃-조광.epub"; // ePub 파일 경로 설정
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // 로그인 상태 관리
  const [user, setUser] = useState(null);  // 로그인한 사용자 정보 관리

  useEffect(() => {
    const errorHandler = (e) => {
      if (
        e.message.includes("ResizeObserver loop completed with undelivered notifications") ||
        e.message.includes("ResizeObserver loop limit exceeded")
      ) {
        const resizeObserverErr = document.getElementById(
          "webpack-dev-server-client-overlay"
        );
        if (resizeObserverErr) {
          resizeObserverErr.style.display = "none";
        }
      }
    };
    
    window.addEventListener("error", errorHandler);
    
    return () => {
      window.removeEventListener("error", errorHandler);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser }}>
      <Toaster />
      <ErrorBoundary>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path='/mylib' element={<MyLib />} />
            <Route path='/mypage' element={<MyPage />} />
            <Route path='/chatbot' element={<Chatbot />} />
            <Route path="/bookviewtest" element={<BookViewTest />} />
            <Route path='/getreview' element={<GetReview />} />
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
          </Route>

          <Route path="/readerwrapper" element={<ReaderWrapper url={epubUrl} />} />
          <Route path='/login' element={<Login />} />
          <Route path='/join' element={<Join />} />
          <Route path="/findid" element={<FindId />} />
          <Route path="/findpw" element={<FindPw />} />
          <Route path="/newpw" element={<NewPw />} />
          <Route path="/bookviewer" element={<BookViewer />} />
          <Route path="/bookviewtest" element={<BookViewPDF />} />
          <Route path='/getreview' element={<GetReview />} />
          <Route path='/deleteuser' element={<DeleteUser />} />
          <Route path='/searchreport' element={<SearchReport />} />
        </Routes>
      </ErrorBoundary>
    </AuthContext.Provider>
  );
}

export default App;
