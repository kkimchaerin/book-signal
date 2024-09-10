import React from 'react';
import '../css/modal.css';
import { FaArrowDown } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";

const Modal = ({ isOpen, onClose, onDownload, backgroundImage, children, className }) => {
  if (!isOpen) return null;

  // children을 배열로 취급합니다.
  const childrenArray = React.Children.toArray(children);

  // 첫 번째 p 태그는 일반 텍스트로 표시하고, 두 번째 p 태그는 하단으로 이동
  const title = childrenArray[0]; // h2 태그
  const text = childrenArray[1]; // 첫 번째 p 태그
  const summ = childrenArray[2]; // 두 번째 p 태그 (하단으로 이동할 내용)

  return (
    <div className={`modal-overlay ${className}`} onClick={onClose}>
      <div className='modal-polaroid'>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {className !== 'upload-modal' && (
            <button className="modal-download" onClick={onDownload}><FaArrowDown /></button>
          )}
          <button className="modal-close" onClick={onClose}><RxCross2 /></button>
          <div className="modal-signal">
            <div className='modal-title'>{title}</div>
            <div className='modal-text'>{text}</div>
          </div>
        </div>
        <div className='modal-summ'>
          <p>{summ}</p>
        </div>
      </div>
    </div>
  );
};

export default Modal;
