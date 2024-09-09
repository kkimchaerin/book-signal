import axios from 'axios';

// 요약을 생성하고 DB에 저장하는 함수
export const handleSummarize = async (memId, bookIdx) => {
    console.log('요약 요청 시작:', { memId, bookIdx }); // 요청 시작 시 로그

    try {
        console.log('서버에 요약 요청 전송 중...'); // 요청 전송 중 로그

        const response = await axios.post('http://localhost:3001/summarize', {
            memId,
            bookIdx,
        });

        console.log('서버 응답 상태:', response.status); // 응답 상태 로그
        console.log('서버 응답 데이터:', response.data); // 응답 데이터 로그

        if (response.status === 200) {
            console.log('요약 및 이미지 생성 요청 성공:', response.data); // 성공 로그
            return { success: true, summary: response.data.summary };
        } else {
            console.error('서버 오류:', response.data.error || '서버 응답 오류'); // 오류 로그
            return { success: false, error: response.data.error || '요약 생성에 실패했습니다. 다시 시도해 주세요.' };
        }
    } catch (error) {
        console.error('요약 요청 중 오류 발생:', error.response ? error.response.data : error.message); // 에러 로그
        return { success: false, error: '요약 생성에 실패했습니다. 다시 시도해 주세요.' };
    }
};
