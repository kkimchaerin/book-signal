require('dotenv').config({ path: './src/tts.env' });
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS); // 환경 변수 출력 확인
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const gazeRoutes = require('./routes/gazeRoutes');
const searchRoutes = require('./routes/searchRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const wishListRoutes = require('./routes/wishListRoutes');
const bookRoutes = require('./routes/bookRoutes');
const mainRoutes = require('./routes/mainRoutes');
const path = require('path');
const helmet = require('helmet');
const reviewRoutes = require('./routes/reviewRoutes');
const fs = require('fs'); // 파일 시스템 접근을 위한 모듈 추가
const tts = require('./tts'); // TTS 기능 추가
const textToSpeech = require('@google-cloud/text-to-speech');
const sameBookRoutes = require('./routes/sameBookRoutes');
const app = express();
const pool = require('./config/database');

const client = new textToSpeech.TextToSpeechClient();
const session = require('express-session');

// 세션 설정 (기본 설정)
app.use(session({
  secret: process.env.SESSION_SECRET || 'MyKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: null
  }
}));

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// 정적 파일 제공을 위한 경로 설정
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// 세션 상태 확인을 위한 엔드포인트
app.get('/check-session', (req, res) => {
  if (req.session.user) {
    res.status(200).json({ user: req.session.user });
  } else {
    res.status(401).json({ message: '로그인되지 않음' });
  }
});

app.use('/', userRoutes);
app.use('/gaze', gazeRoutes);
app.use('/api', searchRoutes);
app.use('/ranking', rankingRoutes);
app.use('/wishlist', wishListRoutes);
app.use('/getBookPath', bookRoutes);
app.use('/main', mainRoutes);
app.use('/review', reviewRoutes)
app.use('/sameBook', sameBookRoutes);

app.post('/tts', async (req, res) => {
  const { text, rate, gender } = req.body;

  const request = {
    input: { text: text },
    voice: {
      languageCode: 'ko-KR',
      ssmlGender: gender
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: rate
    },
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    res.set({
      'Content-Type': 'audio/mp3',
      'Content-Length': response.audioContent.length,
    });
    res.send(response.audioContent);
  } catch (err) {
    console.error('ERROR:', err);
    res.status(500).send('TTS 변환 실패');
  }
});

// 요약 생성 엔드포인트
app.post('/summarize', async (req, res) => {
  const { memId, bookIdx } = req.body;
  console.log('요약 요청 받음:', req.body);

  let connection;
  try {
    connection = await pool.getConnection();

    // book_eyegaze 테이블에서 gaze_duration이 가장 긴 상위 3개의 book_text 가져오기
    const [gazeRows] = await connection.query(`
      SELECT book_text
      FROM book_eyegaze 
      WHERE mem_id = ? AND book_idx = ? 
      ORDER BY gaze_duration DESC 
      LIMIT 3
    `, [memId, bookIdx]);

    if (gazeRows.length === 0) {
      return res.status(404).json({ error: '데이터를 찾을 수 없습니다.' });
    }

    // book_db 테이블에서 book_name 가져오기
    const [nameRows] = await connection.query('SELECT book_name FROM book_db WHERE book_idx = ?', [bookIdx]);

    if (nameRows.length === 0) {
      return res.status(404).json({ error: '해당 책 정보를 찾을 수 없습니다.' });
    }

    const bookName = nameRows[0].book_name;

    // 요약 및 이미지 저장을 위한 작업
    const summaries = [];
    const imagePaths = [];

    for (const row of gazeRows) {
      let selectedText = row.book_text;

      // 텍스트 길이 제한을 초과하지 않도록 자르기
      const maxPromptLength = 900; // 여유를 두어 길이 제한 설정
      if (selectedText.length > maxPromptLength) {
        const sentences = selectedText.split('.'); // 문장 단위로 나누기
        selectedText = '';
        for (const sentence of sentences) {
          if ((selectedText + sentence).length > maxPromptLength) break;
          selectedText += sentence + '.';
        }
      }

      // OpenAI API를 사용하여 요약 생성
      const summaryResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{
          role: "user",
          content: `책의 제목은 "${bookName}"입니다. 아래는 이 책의 한 부분입니다: "${selectedText}". 이 부분을 요약해 주세요. 요약은 주요 등장인물, 배경, 사건을 포함하고, 이 텍스트가 전달하는 주요 메시지나 테마를 간결하게 설명해 주세요.`
        }],
        max_tokens: 150,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });

      const summary = summaryResponse.data.choices[0].message.content.trim();
      summaries.push(summary);
      console.log('요약 생성 성공:', summary);

      // 요약을 기반으로 텍스트 프롬프트를 생성
      const promptForImage = `책 "${bookName}"의 한 부분의 요약입니다: "${summary}". 이 내용을 바탕으로, 주요 등장 인물의 외모와 의상, 배경의 색상과 분위기, 그리고 그들이 경험하는 주요 사건을 시각적으로 상상하고 구체적으로 묘사한 이미지를 생성해주세요. 이미지에는 다음 요소들이 포함되어야 합니다: [예시: "인물은 중세 의상을 입고 있으며, 배경은 성의 내부를 나타내며 어두운 조명과 긴장된 분위기가 감돌아야 합니다"].`;

      // DALL·E 이미지 생성
      const dalleResponse = await axios.post('https://api.openai.com/v1/images/generations', {
        prompt: promptForImage,
        n: 1,
        size: '1024x1024'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });

      console.log(`프롬프트: ${promptForImage}`);
      const dalleImageUrl = dalleResponse.data.data[0].url;
      const dalleImagePath = path.join(__dirname, '../public/dalle', `${bookIdx}_${summaries.length}.png`);

      const imageResponse = await axios.get(dalleImageUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(dalleImagePath, imageResponse.data);
      console.log('이미지 생성 및 저장 성공:', dalleImagePath);

      imagePaths.push(`/dalle/${bookIdx}_${summaries.length}.png`);

      // book_extract_data 테이블에 데이터 저장
      await connection.query('INSERT INTO book_extract_data (mem_id, book_idx, book_name, book_extract, dalle_path) VALUES (?, ?, ?, ?, ?)', [memId, bookIdx, bookName, summary, imagePaths[imagePaths.length - 1]]);
    }

    console.log('데이터베이스에 요약 및 이미지 경로 저장 성공');
    res.json({ summaries });

  } catch (err) {
    console.error('Error generating summary:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: '요약 생성에 실패했습니다.' });
  } finally {
    if (connection) connection.release();
  }
});


// 정적 파일 서빙
app.use(express.static('public'));

app.listen(3001, () => {
  console.log('서버 실행: http://localhost:3001');
});
