import axios from 'axios';

// Python 서버에서 추천 데이터를 가져오는 함수
export const fetchRecommendations = async (memId) => {
  try {
    const response = await axios.post('http://localhost:5000/get-recommendations', { mem_id: memId });
    return response.data;
  } catch (error) {
    console.error('추천 도서 가져오기 실패:', error);
    throw error;
  }
};
