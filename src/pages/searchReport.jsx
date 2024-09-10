import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../css/searchreport.css';
import { BiSearchAlt } from "react-icons/bi";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SearchReport = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('query');

    // 탭 상태 관리 (전체, 도서, 장르)
    const [activeTab, setActiveTab] = useState('all'); // 기본 활성 탭을 '전체'로 설정
    const [allBooks, setAllBooks] = useState([]);  // 전체 검색 결과 저장할 상태
    const [books, setBooks] = useState([]);  // 도서 검색 결과 저장할 상태
    const [genres, setGenres] = useState([]);  // 장르 검색 결과 저장할 상태
    const [loading, setLoading] = useState(true);  // 로딩 상태

    const navigate = useNavigate();

    useEffect(() => {
        if (searchQuery) {
            setLoading(true); // 새로운 검색어 입력 시 로딩 상태 설정

            axios.get(`http://localhost:3001/api/search?query=${searchQuery}`)
                .then(response => {
                    setAllBooks(response.data.all);  // 전체 결과
                    setBooks(response.data.books);   // 도서 결과
                    setGenres(response.data.genres); // 장르 결과
                    setLoading(false);  // 로딩 상태 해제
                })
                .catch(() => {
                    setAllBooks([]);
                    setBooks([]);
                    setGenres([]);
                    setLoading(false);  // 로딩 상태 해제
                });
        } else {
            setAllBooks([]);
            setBooks([]);
            setGenres([]);
            setLoading(false);  // 검색어가 없을 경우에도 로딩 상태 해제
        }
    }, [searchQuery]); // searchQuery가 변경될 때마다 이 효과가 실행됩니다.

    const handleBookClick = (book) => {
        navigate(`/detail`, { state: { book } }); // 선택한 책의 전체 객체를 상태로 전달하여 이동
    };

    // 탭 클릭 시 탭 상태 변경
    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
    };

    // 탭에 따른 검색 결과 렌더링 함수
    const renderContent = () => {
        switch (activeTab) {
            case 'all':
                return (
                    <div className="books-grid">
                        {loading ? (
                            <div>로딩 중...</div>
                        ) : allBooks.length > 0 ? (
                            allBooks.map((book, index) => (
                                <div key={index} className="book-card" onClick={() => handleBookClick(book)}>
                                    <img src={book.book_cover} alt={book.book_name} className="search-book-cover" />
                                    <div className="book-info">
                                        <p className="search-book-title">&lt;{book.book_name}&gt;</p>
                                        <p className="book-author">{book.book_writer} 저자</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div>검색 결과가 없습니다.</div>
                        )}
                    </div>
                );
            case 'books':
                return (
                    <div className="books-grid">
                        {loading ? (
                            <div>로딩 중...</div>
                        ) : books.length > 0 ? (
                            books.map((book, index) => (
                                <div key={index} className="book-card" onClick={() => handleBookClick(book)}>
                                    <img src={book.book_cover} alt={book.book_name} className="search-book-cover" />
                                    <div className="book-info">
                                        <p className="search-book-title">&lt;{book.book_name}&gt;</p>
                                        <p className="book-author">{book.book_writer} 저자</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div>검색 결과가 없습니다.</div>
                        )}
                    </div>
                );
            case 'genres':
                return (
                    <div className="books-grid">
                        {loading ? (
                            <div>로딩 중...</div>
                        ) : genres.length > 0 ? (
                            genres.map((book, index) => (
                                <div key={index} className="book-card" onClick={() => handleBookClick(book)}>
                                    <img src={book.book_cover} alt={book.book_name} className="search-book-cover" />
                                    <div className="book-info">
                                        <p className="search-book-title">&lt;{book.book_name}&gt;</p>
                                        <p className="book-author">{book.book_writer} 저자</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div>검색 결과가 없습니다.</div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="search-report-container">
            <h1>검색 결과</h1>
            <hr />
            <br />
            {searchQuery && (
                <div className="search-summary">
                    <BiSearchAlt size={24} />
                    <p>{searchQuery}</p>
                </div>
            )}
            <hr />

            {/* 탭 UI */}
            <div className="tabs">
                <div
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => handleTabClick('all')}
                >
                    전체
                </div>
                <div
                    className={`tab ${activeTab === 'books' ? 'active' : ''}`}
                    onClick={() => handleTabClick('books')}
                >
                    도서
                </div>
                <div
                    className={`tab ${activeTab === 'genre' ? 'active' : ''}`}
                    onClick={() => handleTabClick('genres')}
                >
                    장르
                </div>
            </div>

            {renderContent()}
        </div>
    );
};

export default SearchReport;
