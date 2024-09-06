const bcrypt = require('bcrypt');
const userDB = require('../models/userDB');

const textToHash = async (text) => {
  const saltRounds = 12;
  try {
    const hash = await bcrypt.hash(text, saltRounds);
    return hash;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// 회원가입
exports.join = async (req, res) => {
  const { mem_id, mem_pw, mem_name, mem_nick, mem_birth, mem_mail } = req.body;

  if (!mem_id || !mem_pw || !mem_name || !mem_nick || !mem_birth || !mem_mail) {
    return res.status(400).json({ message: '모든 정보를 입력해주시기 바랍니다.' });
  }

  try {
    const getUser = await userDB.getUserId(mem_id);
    if (getUser.length) {
      res.status(401).json({ message: '이미 존재하는 아이디입니다.' });
      return;
    }

    const hash = await textToHash(mem_pw);
    const signUp = await userDB.join({
      mem_id,
      mem_pw: hash,
      mem_name,
      mem_nick,
      mem_birth,
      mem_mail,
      mem_point: 0,
      enroll_at: new Date()
    });

    // 회원가입이 완료된 후 기본 세팅값을 설정
    const settingResult = await userDB.createUserSetting(mem_id);
    if (!settingResult) {
      throw new Error('기본 세팅값 설정 중 오류가 발생했습니다.');
    }

    res.status(200).json({ message: '가입 성공' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
};

// 암호화 비교
const hashCompare = async (inputValue, hash) => {
  try {
    return await bcrypt.compare(inputValue, hash);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// 로그인
exports.login = async (req, res) => {
  const { mem_id, mem_pw, autologin } = req.body;

  try {
    const getUser = await userDB.getUser(mem_id);
    if (getUser.length === 0) {
      return res.status(401).json({ message: '*아이디 또는 비밀번호가 잘못되었습니다.<br />아이디와 비밀번호를 정확히 입력해주세요.' });
    }

    const isMatch = await hashCompare(mem_pw, getUser[0].mem_pw);
    if (!isMatch) {
      return res.status(401).json({ message: '*아이디 또는 비밀번호가 잘못되었습니다.<br />아이디와 비밀번호를 정확히 입력해주세요.' });
    }

    // 세션에 사용자 정보 저장
    req.session.user = {
      mem_id: getUser[0].mem_id,
      mem_nick: getUser[0].mem_nick,
      email: getUser[0].mem_mail,
      point: getUser[0].mem_point,
      name: getUser[0].mem_name,
    };

    // 자동 로그인 설정에 따른 세션 만료 시간 설정
    req.session.cookie.maxAge = autologin ? 1000 * 60 * 60 * 24 * 7 : null; // 7일간 유지 또는 브라우저 종료 시 세션 삭제
    req.session.cookie.expires = autologin ? null : null;

    res.status(200).json({ message: '로그인 성공', user: { mem_id: getUser[0].mem_id, mem_nick: getUser[0].mem_nick } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
};

// 이메일 중복 체크 함수
exports.getUserByEmail = async (mem_email) => {
  try {
    return await userDB.getUserByEmail(mem_email);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// 닉네임 중복 체크 함수
exports.getUserByNick = async (mem_nick) => {
  try {
    return await userDB.getUserByNick(mem_nick);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// 아이디 중복 체크 함수
exports.getUserId = async (mem_id) => {
  try {
    return await userDB.getUserId(mem_id);
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// 아이디 찾기
exports.findId = async (req, res) => {
  const { mem_email, mem_name } = req.body;

  try {
    const getUser = await userDB.getUserByEmailAndName(mem_email, mem_name);
    if (getUser.length === 0) {
      return res.status(404).json({ message: '해당 정보로 가입된 아이디를 찾을 수 없습니다.' });
    }

    res.status(200).json({ mem_id: getUser[0].mem_id, mem_name: getUser[0].mem_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
};

// 비밀번호 설정 페이지로 이동
exports.findPassword = async (req, res) => {
  const { mem_email, mem_id } = req.body;

  try {
    const getUser = await userDB.getUserByEmailAndId(mem_email, mem_id);
    if (getUser.length === 0) {
      return res.status(404).json({ message: '해당 이메일과 아이디에 일치하는 계정이 존재하지 않습니다.' });
    }

    res.status(200).json({ message: '비밀번호 재설정 페이지로 이동합니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류' });
  }
};

// 비밀번호 재설정
exports.resetPassword = async (req, res) => {
  const { mem_id, newPw } = req.body;

  try {
    const hashedPw = await bcrypt.hash(newPw, 12);
    await userDB.updatePassword(mem_id, hashedPw); // 비밀번호 업데이트

    res.status(200).json({ message: '비밀번호 재설정이 완료되었습니다.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '비밀번호 재설정에 실패했습니다.' });
  }
};

// 로그아웃
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: '로그아웃 실패' });
    }
    res.clearCookie('connect.sid'); // 세션 쿠키 삭제
    res.status(200).json({ message: '로그아웃 성공' });
  });
};

// 회원탈퇴 컨트롤러 함수
exports.deleteUser = async (req, res) => {
  const { mem_id, mem_pw } = req.body;

  try {
    const getUser = await userDB.getUser(mem_id);
    if (getUser.length === 0) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }

    const isMatch = await bcrypt.compare(mem_pw, getUser[0].mem_pw);
    if (!isMatch) {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못되었습니다.' });
    }

    await userDB.deleteRelatedData(mem_id); // 연관된 데이터 삭제
    await userDB.deleteUser(mem_id); // 사용자 삭제

    res.status(200).json({ message: '회원탈퇴가 완료되었습니다.' });
  } catch (err) {
    console.error('회원탈퇴 중 서버 오류:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

// 최근 읽은 도서 가져오기
exports.getRecentBooks = async (req, res) => {
  const mem_id = req.session.user.mem_id;

  try {
    const recentBooks = await userDB.getRecentBooks(mem_id);
    res.status(200).json(recentBooks);
  } catch (error) {
    console.error('최근 읽은 도서 가져오기 실패:', error);
    res.status(500).json({ message: '최근 읽은 도서를 가져오는 중 오류가 발생했습니다.' });
  }
};

// 찜한 도서 가져오기
exports.getWishlistBooks = async (req, res) => {
  const mem_id = req.session.user.mem_id;

  try {
    const wishlistBooks = await userDB.getWishlistBooks(mem_id);
    res.status(200).json(wishlistBooks);
  } catch (error) {
    console.error('찜한 도서 가져오기 실패:', error);
    res.status(500).json({ message: '찜한 도서를 가져오는 중 오류가 발생했습니다.' });
  }
};

// 완독 도서 가져오기
exports.getCompletedBooks = async (req, res) => {
  const mem_id = req.session.user.mem_id;

  try {
    const completedBooks = await userDB.getCompletedBooks(mem_id);
    res.status(200).json(completedBooks);
  } catch (error) {
    console.error('완독 도서 가져오기 실패:', error);
    res.status(500).json({ message: '완독 도서를 가져오는 중 오류가 발생했습니다.' });
  }
};


// 북 시그널 데이터를 가져오는 함수
exports.getSignalBooks = async (req, res) => {
  const mem_id = req.session.user.mem_id;

  try {
    const signalBooks = await userDB.getSignalBooks(mem_id);
    res.status(200).json(signalBooks);
  } catch (error) {
    console.error('북 시그널 도서를 가져오는 중 오류 발생:', error);
    res.status(500).json({ message: '북 시그널 도서를 가져오는 중 오류가 발생했습니다.' });
  }
};


// 독서 기록을 추가하는 컨트롤러 함수
exports.addReadingRecord = async (req, res) => {
  const { mem_id, book_name } = req.body;

  try {
    const result = await userDB.addReadingRecord(mem_id, book_name);
    res.status(200).json({ message: '독서 기록이 성공적으로 추가되었습니다.', result });
  } catch (error) {
    console.error('독서 기록 추가 에러:', error);
    res.status(500).json({ message: '독서 기록을 추가하는 중 오류가 발생했습니다.', error: error.message });
  }
};

// 사용자 정보 가져오기
exports.getUserInfo = async (req, res) => {
  const mem_id = req.params.mem_id;

  try {
    const userInfo = await userDB.getUser(mem_id);
    if (userInfo.length === 0) {
      return res.status(404).json({ message: '사용자 정보를 찾을 수 없습니다.' });
    }
    res.status(200).json(userInfo[0]);
  } catch (err) {
    console.error('사용자 정보 가져오기 오류:', err);
    res.status(500).json({ message: '서버 오류' });
  }
};


