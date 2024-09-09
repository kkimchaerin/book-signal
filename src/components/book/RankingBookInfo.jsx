import React from 'react'
import { FaRegStar } from "react-icons/fa6";

const RankingBookInfo = ({ book, ranking, onClick }) => {
  return (
    <li className='flex flex-grow border rounded-xl shadow-lg cursor-pointer' onClick={onClick}>
      <div className='book-cover-wrapper w-[100px] h-[150px]'>
        <img src={book?.book_cover} alt={book?.book_name || "도서 이미지"} className='w-full h-full object-cover rounded-md'/>
      </div>
      <div className='book-info-contents flex flex-col text-md px-5 my-auto'>
        <p className='text-3xl font-bold italic text-primary'>{ranking}</p>
        <p className='text-xl font-semibold mb-5 truncate w-60'>{book?.book_name}</p>
        <div className='flex gap-3'>
          <p className='truncate w-50'>{book.book_writer}<span>저자</span></p>
          {/* <p className='before:content-["|"] before:mr-3'>홍길순<span>옮김</span></p> */}
        </div>
        <p className='flex items-center'>
          <span className='sr-only'>평점</span>
          <FaRegStar />
          <strong className='ml-1'>{book.book_avg}</strong>
        </p>
      </div>
    </li>
  )
}

export default RankingBookInfo