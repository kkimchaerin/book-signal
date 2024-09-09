const express = require('express');
const router = express.Router();
const { saveGazeTime } = require('../models/bookDB');

// 시선 추적 시간 저장
router.post('/', async (req, res) => {
  const { book_idx, mem_id, book_text, gaze_duration } = req.body;

  try {
    await saveGazeTime(book_idx, mem_id, book_text, gaze_duration);
    res.status(200).json({ message: 'Gaze time saved successfully' });
  } catch (error) {
    console.error('Error saving gaze time:', error);
    res.status(500).json({ error: 'Error saving gaze time' });
  }
});

module.exports = router;
