import React, { useEffect, useState } from 'react'
import RankingBookInfo from '../components/book/RankingBookInfo'
import SlideShow from '../components/SlideShow'
import axios from 'axios'
import SLIDES from "../data/slides"
import { useLocation, useNavigate  } from 'react-router-dom';

const RankingBookList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('popular');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let endpoint;

    switch (activeTab) {
      case 'best':
        endpoint = 'ranking/best';
        break;
      case 'new':
        endpoint = 'ranking/new';
        break;
      case 'popular':
      default:
        endpoint = 'ranking/popular';
    }

    axios.get(`http://localhost:3001/${endpoint}`)
      .then(response => {
        // console.log(response.data);

        if (Array.isArray(response.data)) {
          setBooks(response.data);
        } else {
          console.error('API 응답이 배열이 아닙니다.');
          setBooks([]);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('오류:', error);
        setLoading(false);
      });
  }, [activeTab]);

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (['popular', 'best', 'new'].includes(path)) {
      setActiveTab(path);
    }
  }, [location.pathname]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    navigate(`/ranking/${tab}`);
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  const handleBookClick = (book) => {
    navigate(`/detail`, { state: { book } }); // 도서 정보를 상태로 전달
  };


  return (
    <div className='max-w-screen-xl m-auto mb-16'>
      <SlideShow slides={SLIDES}/>
      <ul className='flex gap-5 text-lg font-semibold border-b py-5 mb-16 mt-20'>
      <li
          onClick={() => handleTabClick('popular')}
          className={`cursor-pointer ${activeTab === 'popular' ? 'text-primary border-b-2 border-b-primary' : ''}`}
        >
          인기 랭킹
        </li>
        <li
          onClick={() => handleTabClick('best')}
          className={`cursor-pointer ${activeTab === 'best' ? 'text-primary border-b-2 border-b-primary' : ''}`}
        >
          평점 베스트
        </li>
        <li
          onClick={() => handleTabClick('new')}
          className={`cursor-pointer ${activeTab === 'new' ? 'text-primary border-b-2 border-b-primary' : ''}`}
        >
          신작
        </li>
      </ul>
      <section>
        <h2 className='sr-only'>랭킹 도서 목록</h2>
        <ul className='flex flex-wrap justify-start gap-5'>
          {/* 도서 리스트 렌더링 */}
          {books.length > 0 ? (
            books.map((book, index) => (
              <RankingBookInfo key={index} book={book} ranking={index + 1} onClick={() => handleBookClick(book)}/>
            ))
          ) : (
            <p>결과가 없습니다.</p>
          )}
        </ul>
      </section>
    </div>
  )
}

export default RankingBookList