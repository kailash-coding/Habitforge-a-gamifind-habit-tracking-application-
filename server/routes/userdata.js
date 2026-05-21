const express = require('express');
const userDataStore = require('../services/userDataStore');

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await userDataStore.getUserData(userId);
    res.json({ userId, data: data || {} });
  } catch (error) {
    console.error('User data fetch error:', error);
    res.status(500).json({ message: 'Could not load user data.' });
  }
});

router.patch('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ message: 'Invalid user data payload.' });
    }
    const data = await userDataStore.setUserData(userId, payload);
    res.json({ userId, data });
  } catch (error) {
    console.error('User data save error:', error);
    res.status(500).json({ message: 'Could not save user data.' });
  }
});

module.exports = router;
