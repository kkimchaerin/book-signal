const BookReading = require('../../../src/models/BookReading');
const axios = require('axios');

// OpenAI API 키를 환경 변수에서 가져옴
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

exports.createSummary = async (req, res) => {
  const { memId, bookIdx } = req.body;

  try {
    const textToSummarize = await BookReading.findTextById(memId, bookIdx);

    if (!textToSummarize) {
      return res.status(404).json({ error: '요약할 텍스트가 없습니다.' });
    }

    // OpenAI API를 사용하여 한글로 요약 생성 요청
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: `다음 텍스트를 요약해줘: ${textToSummarize}` }],
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const summary = response.data.choices[0].message.content;
    res.json({ summary });
  } catch (error) {
    console.error('Error summarizing text:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: '요약 생성에 실패했습니다.' });
  }
};
