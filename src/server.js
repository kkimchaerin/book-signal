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
const sameBookRoutes = require('./routes/sameBookRoutes')
const path = require('path');
const helmet = require('helmet');
const reviewRoutes = require('./routes/reviewRoutes');
const fs = require('fs'); // 파일 시스템 접근을 위한 모듈 추가
const tts = require('./tts'); // TTS 기능 추가
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();
const session = require('express-session');
const app = express();
const pool = require('./config/database');
const axios = require('axios');
const multer = require('multer');
const EPub = require('epub'); // 'epub' 패키지 사용

// 세션 설정 (기본 설정)
app.use(session({
  secret: process.env.SESSION_SECRET || 'MyKey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: null,
  }
}));

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// 정적 파일 제공을 위한 경로 설정
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Multer 설정 (파일을 서버의 'uploads' 폴더에 저장)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// EPUB 파일 업로드 및 파싱 엔드포인트
app.post('/upload-epub', upload.single('file'), (req, res) => {
  const filePath = req.file.path;

  // EPUB 파일을 파싱
  const epub = new EPub(filePath, "/imagewebroot/", "/articlewebroot/");
  
  epub.on("error", (err) => {
    console.error('EPUB 처리 중 오류:', err);
    return res.status(500).json({ error: 'EPUB 처리 중 오류가 발생했습니다.' });
  });

  epub.on("end", async () => {
    const metadata = epub.metadata;
    const bookName = metadata.title;
    const bookAuthor = metadata.creator;
    const bookPublishedAt = metadata.date || new Date().toISOString().split('T')[0]; // 기본적으로 오늘 날짜로 저장
    const bookGenre = metadata.subject || '미정'; // 책 장르 정보가 없을 경우 기본값 설정
    const bookpath = metadata.filePath;
    const bookExplanation = metadata.description || '설명이 제공되지 않았습니다.';
    const bookCover = epub.cover || ''; // 커버 이미지 경로

    // DB에 저장
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.query(
        `INSERT INTO book_upload 
          (book_name, book_writer, book_genre, book_file_path, book_explanation, book_published_at, book_cover) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [bookName, bookAuthor, bookGenre, filePath, bookExplanation, bookPublishedAt, bookCover]
      );
      connection.release();

      res.json({ message: '파일 업로드 및 DB 반영 성공', bookName, bookAuthor });
    } catch (error) {
      console.error('DB 저장 중 오류:', error);
      if (connection) connection.release();
      return res.status(500).json({ error: 'DB 저장 중 오류가 발생했습니다.' });
    }
  });

  epub.parse(); // EPUB 파일 파싱 시작
});

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

// 독서 완료 API 엔드포인트
app.post('/completeReading', async (req, res) => {
  const { memId, bookIdx, bookName } = req.body;
  
  let connection;
  try {
    connection = await pool.getConnection();

    // book_end 테이블에 정보 저장
    const [result] = await connection.query(`
      INSERT INTO book_end (mem_id, book_idx, book_name) 
      VALUES (?, ?, ?)
    `, [memId, bookIdx, bookName]);

    console.log('독서 완료 정보 저장 성공:', result);
    res.status(200).json({ success: true, message: '독서 완료 정보가 저장되었습니다.' });

  } catch (err) {
    console.error('Error saving complete reading data:', err.message);
    res.status(500).json({ success: false, error: '독서 완료 정보를 저장하는 중 오류가 발생했습니다.' });
  } finally {
    if (connection) connection.release();
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

      if (!selectedText) {
        console.error('Invalid book_text: null value encountered');
        continue;  // `null`일 경우 건너뜁니다.
      }

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

      try {
        // OpenAI API를 사용하여 대표 문장 추출
        const repreResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [{
            role: "user",
            content: `책의 제목은 "${bookName}"입니다. 아래는 이 책의 한 부분입니다: "${selectedText}". 이 부분에서 가장 중요한 대표 문장을 하나 뽑아 주세요.`
          }],
          max_tokens: 200,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        });

        const representativeSentence = repreResponse.data.choices[0].message.content.trim();
        console.log('대표 문장 생성 성공:', representativeSentence);

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

        let summary = summaryResponse.data.choices[0].message.content.trim();

        // 요약이 잘린 경우 적절히 처리
        if (!summary.endsWith('.') && summary.length >= 240) {
          summary += '...';
        }

        summaries.push(summary);
        console.log('요약 생성 성공:', summary);

        // 요약을 기반으로 텍스트 프롬프트를 생성
        const promptForImage = `
        책 "${bookName}"의 한 부분을 시각적으로 묘사한 이미지입니다. 
        이 책의 요약된 내용은 다음과 같습니다: "${summary}".
        이미지에는 다음의 요소들이 포함되어야 합니다:
        - 의상 스타일 (예: 중세 의상, 현대적 드레스 등)
        - 배경의 색상과 분위기 (예: 어두운 조명, 밝고 따뜻한 톤 등)
        - 발생하는 주요 사건이나 감정 (예: 긴장된 대치, 행복한 순간 등).
        이미지는 사실적이고 디테일이 풍부하며, ${bookName}의 특유의 분위기를 잘 반영해야 합니다.
        `;

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
        await connection.query('INSERT INTO book_extract_data (mem_id, book_idx, book_name, book_extract, dalle_path, book_repre) VALUES (?, ?, ?, ?, ?, ?)',
          [memId, bookIdx, bookName, summary, imagePaths[imagePaths.length - 1], representativeSentence]);

      } catch (err) {
        if (err.response && err.response.data.error.code === 'content_policy_violation') {
          console.error('요약 생성 중 안전 시스템에 의해 차단되었습니다. 프롬프트를 검토하고 수정하세요.');
        } else {
          console.error('Error during summary or image generation:', err.response ? err.response.data : err.message);
        }
      }
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
