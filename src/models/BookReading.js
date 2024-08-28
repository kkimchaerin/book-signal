const conn = require('../config/database');

/******************** 도서 읽기 관련 기능 ********************/

// 도서 텍스트 검색 함수
exports.findTextById = (memId, bookIdx) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT book_summ FROM book_reading WHERE mem_id = ? AND book_idx = ?`;

        conn.query(sql, [memId, bookIdx], (err, results) => {
            if (err) {
                console.error('Error finding text:', err);
                reject(new Error('도서 텍스트 검색에 실패했습니다.'));
                return;
            }

            resolve(results[0]?.book_summ || null);
        });
    });
};

// 도서 텍스트 저장 함수
exports.saveBookText = (memId, bookIdx, text) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE book_reading SET book_summ = ? WHERE mem_id = ? AND book_idx = ?`;

        conn.query(sql, [text, memId, bookIdx], (err, result) => {
            if (err) {
                console.error('Error saving book text:', err);
                reject(new Error('도서 텍스트 저장에 실패했습니다.'));
                return;
            }

            resolve({ message: '도서 텍스트가 저장되었습니다.' });
        });
    });
};

/******************** 요약 관리 ********************/

// 요약을 위한 텍스트 검색
exports.getTextForSummary = (memId, bookIdx) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT book_summ FROM book_reading WHERE mem_id = ? AND book_idx = ?`;

        conn.query(sql, [memId, bookIdx], (err, results) => {
            if (err) {
                console.error('Error retrieving text for summary:', err);
                reject(new Error('요약할 텍스트 검색에 실패했습니다.'));
                return;
            }

            resolve(results[0]?.book_summ || null);
        });
    });
};

// 요약 저장
exports.saveSummary = (memId, bookIdx, summary) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO book_extract_data (mem_id, book_idx, book_name, book_extract) 
                     SELECT ?, ?, book_name, ? FROM book_db WHERE book_idx = ?`;

        conn.query(sql, [memId, bookIdx, summary, bookIdx], (err, result) => {
            if (err) {
                console.error('Error saving summary:', err);
                reject(new Error('요약 저장에 실패했습니다.'));
                return;
            }

            resolve({ message: '요약이 저장되었습니다.' });
        });
    });
};

/******************** 읽기 기록 관리 ********************/

// 읽기 기록 추가
exports.addReadingRecord = (memId, bookIdx, latestPage, bookMark) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO book_reading (mem_id, book_idx, book_latest, book_mark) VALUES (?, ?, ?, ?)`;

        conn.query(sql, [memId, bookIdx, latestPage, bookMark], (err, result) => {
            if (err) {
                console.error('Error adding reading record:', err);
                reject(new Error('읽기 기록 추가에 실패했습니다.'));
                return;
            }

            resolve({ message: '읽기 기록이 추가되었습니다.' });
        });
    });
};

// 읽기 기록 업데이트
exports.updateReadingRecord = (memId, bookIdx, latestPage, bookMark) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE book_reading SET book_latest = ?, book_mark = ? WHERE mem_id = ? AND book_idx = ?`;

        conn.query(sql, [latestPage, bookMark, memId, bookIdx], (err, result) => {
            if (err) {
                console.error('Error updating reading record:', err);
                reject(new Error('읽기 기록 업데이트에 실패했습니다.'));
                return;
            }

            resolve({ message: '읽기 기록이 업데이트되었습니다.' });
        });
    });
};

// 읽기 기록 삭제
exports.deleteReadingRecord = (memId, bookIdx) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM book_reading WHERE mem_id = ? AND book_idx = ?`;

        conn.query(sql, [memId, bookIdx], (err, result) => {
            if (err) {
                console.error('Error deleting reading record:', err);
                reject(new Error('읽기 기록 삭제에 실패했습니다.'));
                return;
            }

            resolve({ message: '읽기 기록이 삭제되었습니다.' });
        });
    });
};
