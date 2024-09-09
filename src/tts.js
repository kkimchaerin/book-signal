require('dotenv').config(); // dotenv 패키지를 로드 환경변수 사용
const textToSpeech = require('@google-cloud/text-to-speech');

// Google Cloud TTS 클라이언트 생성 (환경변수를 사용하여 JSON 키 파일 경로 설정)
const client = new textToSpeech.TextToSpeechClient({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
  

// 텍스트를 음성으로 변환하는 함수
async function convertTextToSpeech(text) {
  const request = {
    input: { text: text },
    voice: { languageCode: 'ko-KR', ssmlGender: 'MALE' },
    audioConfig: { audioEncoding: 'MP3' },
  };


  try {
    const [response] = await client.synthesizeSpeech(request);
    // 음성 데이터 (response.audioContent)를 그대로 반환
    return response.audioContent;
} catch (err) {
    console.error('ERROR:', err);
    throw err;  // 에러를 호출자에게 전달
}
}

module.exports = { convertTextToSpeech };
