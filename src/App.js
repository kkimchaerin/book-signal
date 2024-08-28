import './App.css';
import Chatbot from './components/Chatbot';
<<<<<<< Updated upstream
=======
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
import EyeGazeTest from './pages/EyeGazeTest';
import Modal from './components/Modal';
import ReaderWrapper from '../src/containers/Reader';
import Reader from 'components/Reader';
import SummarizePage from 'components/SummarizePage';

// ResizeObserver loop limit exceeded 오류 해결
window.addEventListener('error', (e) => {
  if (e.message.includes('ResizeObserver loop limit exceeded')) {
    const aDiv = document.getElementById('webpack-dev-server-client-overlay-div');
    const a = document.getElementById('webpack-dev-server-client-overlay');

    if (aDiv) aDiv.setAttribute('style', 'display: none');
    if (a) a.setAttribute('style', 'display: none');
  }
});


// 로그인 상태를 관리하기 위한 Context 생성
export const AuthContext = createContext();
>>>>>>> Stashed changes

function App() {
  return (
<<<<<<< Updated upstream
    <div className="App">
      <div>프로젝트 시작</div>
      <Chatbot></Chatbot>
    </div>
=======
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser }}>
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
            <Route path="/summarizepage" element={<SummarizePage />} />

          </Route>

          <Route path="/readerwrapper" element={<ReaderWrapper />} />
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
          <Route path='/test' element={<EyeGazeTest />} />
        </Routes>
      </ErrorBoundary>
    </AuthContext.Provider>
>>>>>>> Stashed changes
  );
}

export default App;
