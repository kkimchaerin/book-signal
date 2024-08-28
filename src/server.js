require('dotenv').config(); // 환경 변수 로드
const express = require('express');
const cors = require('cors'); // CORS 패키지 임포트
const userRoutes = require('./routes/userRoutes');
const searchRoutes = require('./routes/searchRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const wishListRoutes = require('./routes/wishListRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

// 세션 설정
app.use(session({
    secret: 'MyKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // HTTPS 사용 시 true로 설정
        maxAge: null // 기본 설정은 세션 종료 시 쿠키 만료
    }
}));

// CORS 설정
app.use(cors({
    origin: 'http://localhost:3000', // React 개발 서버의 주소
    credentials: true, // 자격 증명 (쿠키, 인증 헤더 등)을 허용
}));

// JSON 파싱 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// 세션 상태 확인 엔드포인트
app.get('/check-session', (req, res) => {
    if (req.session.user) {
        res.status(200).json({ user: req.session.user });
    } else {
        res.status(401).json({ message: '로그인되지 않음' });
    }
});

// 라우팅 설정
app.use('/', userRoutes);
app.use('/api', searchRoutes);
app.use('/ranking', rankingRoutes);
app.use('/wishlist', wishListRoutes);
app.use('/summary', summaryRoutes);
app.use('/', reviewRoutes);

// 보안 설정 (Cross-Origin Isolation)
app.use(helmet.crossOriginOpenerPolicy({ policy: 'same-origin' }));
app.use(helmet.crossOriginEmbedderPolicy({ policy: 'require-corp' }));

// 정적 파일 서빙
app.use(express.static('public'));

// 서버 실행
app.listen(3001, () => {
    console.log('서버 실행: http://localhost:3001');
});
