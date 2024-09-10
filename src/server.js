require('dotenv').config({ path: './src/tts.env' });
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

// Multer 설정 (파일을 임시 이름으로 서버의 'uploads' 폴더에 저장)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath); // 폴더가 없으면 생성
    }
    cb(null, uploadPath); // 업로드 경로 설정
  },
  filename: (req, file, cb) => {
    // 파일을 먼저 임시 이름으로 저장
    const tempFileName = Date.now() + path.extname(file.originalname);
    cb(null, tempFileName);
  }
});

const upload = multer({ storage });

// EPUB 파일 업로드 및 파싱 엔드포인트
app.post('/upload-epub', upload.single('file'), (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const filePath = req.file.path;

  // EPUB 파일을 파싱
  const epub = new EPub(filePath, "/imagewebroot/", "/articlewebroot/");
  
  epub.on("error", (err) => {
    console.error('EPUB 처리 중 오류:', err);
    return res.status(500).json({ error: 'EPUB 처리 중 오류가 발생했습니다.' });
  });

  epub.on("end", async () => {
    const metadata = epub.metadata;
    const bookName = metadata.title || '제목 없음';
    const bookAuthor = metadata.creator || '저자 없음';

    const memId = req.session.user.mem_id; // 세션에서 사용자 ID 가져오기

    // 책 제목을 파일명으로 사용할 수 있도록 특수문자와 공백 제거
    const safeBookName = bookName.replace(/[^a-zA-Z0-9가-힣]/g, '_'); // 특수문자는 '_'로 치환
    const newFileName = `${safeBookName}${path.extname(req.file.originalname)}`;
    const newFilePath = path.join('public/uploads', newFileName);

    // 파일명을 책 제목으로 변경
    fs.rename(filePath, newFilePath, async (err) => {
      if (err) {
        console.error('파일 이름 변경 중 오류:', err);
        return res.status(500).json({ error: '파일 이름 변경 중 오류가 발생했습니다.' });
      }

      // DB에 저장
      let connection;
      try {
        connection = await pool.getConnection();
        await connection.query(
          'INSERT INTO book_upload (mem_id, book_name, book_writer, book_file_path) VALUES (?, ?, ?, ?)',
          [memId, bookName, bookAuthor, newFilePath]
        );
        connection.release();

        res.json({ message: '파일 업로드 및 DB 반영 성공', bookName, bookAuthor });
      } catch (error) {
        console.error('DB 저장 중 오류:', error);
        if (connection) connection.release();
        return res.status(500).json({ error: 'DB 저장 중 오류가 발생했습니다.' });
      }
    });
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

    // 먼저 mem_id와 book_idx가 같은 레코드가 있는지 확인
    const [existingRecord] = await connection.query(`
      SELECT * FROM book_end WHERE mem_id = ? AND book_idx = ?
    `, [memId, bookIdx]);

    if (existingRecord.length > 0) {
      // 이미 존재하는 경우, update 실행 (book_name과 end_at 업데이트)
      const [result] = await connection.query(`
        UPDATE book_end
        SET book_name = ?, end_at = now()
        WHERE mem_id = ? AND book_idx = ?
      `, [bookName, memId, bookIdx]);

      console.log('독서 완료 정보 업데이트 성공:', result);
      res.status(200).json({ success: true, message: '독서 완료 정보가 업데이트되었습니다.' });
    } else {
      // 존재하지 않는 경우, insert 실행
      const [result] = await connection.query(`
        INSERT INTO book_end (mem_id, book_idx, book_name, end_at)
        VALUES (?, ?, ?, now())
      `, [memId, bookIdx, bookName]);

      console.log('독서 완료 정보 저장 성공:', result);
      res.status(200).json({ success: true, message: '독서 완료 정보가 저장되었습니다.' });
    }

  } catch (err) {
    console.error('Error handling complete reading data:', err.message);
    res.status(500).json({ success: false, error: '독서 완료 정보를 처리하는 중 오류가 발생했습니다.' });
  } finally {
    if (connection) connection.release();
  }
});



// 요약 생성 엔드포인트
app.post('/summarize', async (req, res) => {
  const { memId, bookIdx, isBookSignal } = req.body; // isBookSignal 플래그로 BookSignal 요약인지 구분
  console.log('요약 요청 받음:', req.body);

  let connection;
  try {
    connection = await pool.getConnection();

    // book_extract_data 테이블에서 현재 저장된 요약의 개수를 확인
    const [existingSummaries] = await connection.query(`
      SELECT COUNT(*) as count FROM book_extract_data 
      WHERE mem_id = ? AND book_idx = ?`, [memId, bookIdx]);

    let nextImageIndex = existingSummaries[0].count + 1; // 현재 개수 + 1로 파일 이름 생성

    // 새로운 요약을 생성할 텍스트를 가져옴
    let gazeRows;
    if (isBookSignal) {
      // BookSignal 요약 요청 시에는 하나의 페이지 요약
      [gazeRows] = await connection.query(`
        SELECT book_text
        FROM book_eyegaze 
        WHERE mem_id = ? AND book_idx = ? 
        ORDER BY gaze_duration DESC 
        LIMIT 1
      `, [memId, bookIdx]);
    } else {
      // 독서 완료 시에는 3개의 페이지 요약
      [gazeRows] = await connection.query(`
        SELECT book_text
        FROM book_eyegaze 
        WHERE mem_id = ? AND book_idx = ? 
        ORDER BY gaze_duration DESC 
        LIMIT 3
      `, [memId, bookIdx]);
    }

    if (gazeRows.length === 0) {
      return res.status(404).json({ error: '요약할 데이터가 없습니다.' });
    }

    const [nameRows] = await connection.query('SELECT book_name FROM book_db WHERE book_idx = ?', [bookIdx]);

    if (nameRows.length === 0) {
      return res.status(404).json({ error: '해당 책 정보를 찾을 수 없습니다.' });
    }

    const bookName = nameRows[0].book_name;

    let summaries = [];
    let imagePaths = [];
    for (const row of gazeRows) {
      const selectedText = row.book_text;
      try {
        // OpenAI API를 사용하여 요약 생성
        const summaryResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [{
            role: "user",
            content: `책의 제목은 "${bookName}"입니다. 아래는 이 책의 한 부분입니다: "${selectedText}". 이 부분을 요약해 주세요.`
          }],
          max_tokens: 1000,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          }
        });

        const summary = summaryResponse.data.choices[0].message.content.trim();
        summaries.push(summary);

        // 요약을 기반으로 텍스트 프롬프트를 생성
        const promptForImage = `
        책 "${bookName}"의 한 부분을 시각적으로 묘사한 이미지입니다. 
        이 책의 요약된 내용은 다음과 같습니다: "${summary}".
        이미지에는 다음의 요소들이 포함되어야 합니다:
        - 의상 스타일 (예: 중세 의상, 현대적 드레스 등)
        - 배경의 색상과 분위기 (예: 어두운 조명, 밝고 따뜻한 톤 등)
        - 발생하는 주요 사건이나 감정 (예: 긴장된 대치, 행복한 순간 등).
        이미지는 사실적이고 디테일이 풍부하며, ${bookName}의 특유의 분위기를 잘 반영해야 합니다.
        이미지는 동화풍으로 만들어 주세요.
        만약 이 문장이 content_policy_violation에 위반되더라도 이미지를 생성해주세요.
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
        const dalleImagePath = path.join(__dirname, '../public/dalle', `${bookIdx}_${nextImageIndex}.png`); // 새 이미지 번호로 파일 이름 설정

        const imageResponse = await axios.get(dalleImageUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(dalleImagePath, imageResponse.data);
        console.log('이미지 생성 및 저장 성공:', dalleImagePath);

        imagePaths.push(`/dalle/${bookIdx}_${nextImageIndex}.png`);
        nextImageIndex++; // 다음 이미지를 위해 이미지 인덱스 증가

        // 생성된 요약과 이미지를 book_extract_data 테이블에 삽입
        await connection.query(`
          INSERT INTO book_extract_data (mem_id, book_idx, book_name, book_extract, dalle_path, book_repre)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [memId, bookIdx, bookName, summary, imagePaths[imagePaths.length - 1], null]); // 대표 문장은 null 처리

      } catch (err) {
        console.error('요약 또는 이미지 생성 중 오류 발생:', err.response ? err.response.data : err.message);
        return res.status(500).json({ error: '요약 생성 또는 이미지 생성에 실패했습니다.' });
      }
    }

    console.log('새로운 요약 및 이미지가 book_extract_data 테이블에 추가되었습니다.');
    res.json({ success: true, summaries, imagePaths });

  } catch (err) {
    console.error('요약 생성 중 오류 발생:', err.response ? err.response.data : err.message);
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
