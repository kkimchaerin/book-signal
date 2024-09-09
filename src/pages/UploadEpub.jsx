import React, { useState } from 'react';
import axios from 'axios';

const UploadEpub = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("파일을 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post('http://localhost:3001/upload-epub', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true,  // 세션 쿠키를 포함하여 요청
      });
      console.log('업로드 성공:', response.data);
    } catch (error) {
      console.error('파일 업로드 중 오류 발생:', error);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>업로드</button>
    </div>
  );
};

export default UploadEpub;
