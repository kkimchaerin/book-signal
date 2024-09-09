import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSearchCircle } from "react-icons/io5";

const Search = () => {

  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 검색어를 쿼리 파라미터로 전달하며 search_report 페이지로 이동
      navigate(`/searchReport?query=${encodeURIComponent(searchQuery)}`);
      setSearchQuery(''); // 검색 후 입력 필드 초기화
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2 mt-1">
      <input
        type="text"
        placeholder="도서명을 입력하세요"
        style={{
          width: '12rem',
          borderBottom: '1px solid black',
          backgroundColor: 'transparent',
          outline: 'none'
        }}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button type="button" onClick={handleSearch}><IoSearchCircle size={32} /></button>
    </form>
  )
}

export default Search;
