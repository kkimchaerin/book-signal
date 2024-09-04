require('dotenv').config({ path: './src/tts.env' });
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const session = require('express-session');
const axios = require('axios'); // Axios 추가
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
const fs = require('fs');
const tts = require('./tts');
const textToSpeech = require('@google-cloud/text-to-speech');
const sameBookRoutes = require('./routes/sameBookRoutes');
const app = express();
const pool = require('./config/database'); 

const client = new textToSpeech.TextToSpeechClient();


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

app.use('/images', express.static(path.join(__dirname, '../public/images')));

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
app.use('/review', reviewRoutes);
app.use('/sameBook', sameBookRoutes);

// TTS 엔드포인트
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
      const selectedText = row.book_text;

      // 텍스트 길이 제한을 초과하지 않도록 처리
      const trimmedText = selectedText.length > 2000 ? selectedText.slice(0, 2000) : selectedText;

      // OpenAI API를 사용하여 요약 생성
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: "user", content: `다음 텍스트를 요약해줘: ${trimmedText}` }],
        max_tokens: 100,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });

      const summary = response.data.choices[0].message.content.trim();
      summaries.push(summary);
      console.log('요약 생성 성공:', summary);

      // DALL·E 이미지 생성
      const dalleResponse = await axios.post('https://api.openai.com/v1/images/generations', {
        prompt: summary,
        n: 1,
        size: '1024x1024'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });

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
