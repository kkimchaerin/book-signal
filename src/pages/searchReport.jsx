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
    const [books, setBooks] = useState([]);  // 검색 결과를 저장할 상태
    const [loading, setLoading] = useState(true);  // 로딩 상태

    const navigate = useNavigate();

    useEffect(() => {
        if (searchQuery) {
            setLoading(true); // 새로운 검색어 입력 시 로딩 상태 설정

            axios.get(`http://localhost:3001/api/search?query=${searchQuery}`)
                .then(response => {
                    setBooks(response.data);
                    setLoading(false);  // 로딩 상태 해제
                })
                .catch(() => {
                    setBooks([]);  // 에러 발생 시 빈 배열로 설정하여 '검색 결과가 없습니다' 메시지를 표시
                    setLoading(false);  // 로딩 상태 해제
                });
        } else {
            setBooks([]);  // 검색어가 없을 때 검색 결과 초기화
            setLoading(false);  // 검색어가 없을 경우에도 로딩 상태 해제
        }
    }, [searchQuery]); // searchQuery가 변경될 때마다 이 효과가 실행됩니다.

    const handleBookClick = (book) => {
        navigate(`/detail`, { state: { book } }); // 선택한 책의 전체 객체를 상태로 전달하여 이동
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

            <div className="book-results">
                <h2>도서</h2>
                <div className="books-grid">
                    {loading ? (
                        <div>로딩 중...</div>
                    ) : books.length > 0 ? (
                        books.map((book, index) => (
                            <div key={index} className="book-card" onClick={() => handleBookClick(book)} >
                                <img src={book.book_cover} alt={book.book_name} className="search-book-cover" />

                                <div className="book-info">
                                    <p className="search-book-title">&lt;{book.book_name}&gt;</p>
                                    <p className="book-author">{book.book_writer} 저자</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div>
                            <p>검색 결과가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchReport;
