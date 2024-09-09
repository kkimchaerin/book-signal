import React, { useState } from 'react';
import axios from 'axios';

const UploadEpub = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:3001/upload-epub', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('서버 응답:', response.data);
      alert('파일 업로드 성공');
    } catch (err) {
      console.error('파일 업로드 중 오류 발생:', err);
      alert('파일 업로드 실패');
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept=".epub" />
      <button onClick={handleFileUpload}>업로드</button>
    </div>
  );
};

export default UploadEpub;
