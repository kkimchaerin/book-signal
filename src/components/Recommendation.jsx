import React from 'react';

const Recommendation = ({ books }) => {
  return (
    <div className="recommendation-container">
      <h2>추천 도서 목록</h2>
      <ul>
        {books.map((book, index) => (
          <li key={index}>
            <span>{book.book_name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Recommendation;
