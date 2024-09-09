const mysql = require('mysql2');

// MySQL 연결 풀 설정
const pool = mysql.createPool({
    host: 'project-db-cgi.smhrd.com',
    user: 'book',
    password: '1234',
    port: 3307,
    database: 'book',
    waitForConnections: true,
    connectionLimit: 20, // 최대 연결 수
    queueLimit: 0        // 대기열의 최대 길이 (0은 무제한)
});

// 연결 테스트 (옵션)
pool.getConnection((err, connection) => {
    if (err) {
        console.error('데이터베이스 연결 실패:', err);
        return;
    }
    console.log('데이터베이스 연결 성공');
    connection.release(); // 연결 반환
});

module.exports = pool;
