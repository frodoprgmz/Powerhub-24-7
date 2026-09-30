const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const ttlockService = require('../services/ttlockService');
const User = require('../models/User');
const DoorLog = require('../models/DoorLog');

const router = express.Router();

// User or Admin can unlock
router.post('/unlock', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (req.user.role !== 'admin') {
    // Check if user has active pass
    if (!user.activePassExpiry || new Date(user.activePassExpiry) < new Date()) {
      return res.status(403).json({ message: 'Brak aktywnego karnetu. Kup karnet, aby otworzyÄ‡ zamek.' });
    }
  }

  try {
    const result = await ttlockService.unlock(); // Auto-uses default lock
    if (result.errcode === 0) {
      // Log success
      await DoorLog.create({
        userEmail: user.email,
        role: user.role,
        status: 'Sukces',
        details: 'Zamek otwarty pomyĹ›lnie'
      });
      res.json({ message: 'Zamek zostaĹ‚ otwarty!' });
    } else {
      // Log failure
      await DoorLog.create({
        userEmail: user.email,
        role: user.role,
        status: 'BĹ‚Ä…d',
        details: `TTLock Error: ${result.errmsg || result.errcode}`
      });
      res.status(400).json({ message: 'Nie udaĹ‚o siÄ™ otworzyÄ‡ zamka', error: result });
    }
  } catch (error) {
    res.status(500).json({ message: 'BĹ‚Ä…d serwera', error: error.message });
  }
});

// Log Bluetooth unlock from the app
router.post('/log', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.userId);
  try {
    await DoorLog.create({
      userEmail: user.email,
      role: user.role,
      status: 'Sukces',
      details: 'Zamek otwarty przez Bluetooth (Aplikacja)'
    });
    res.json({ message: 'Zalogowano pomyĹ›lnie' });
  } catch (error) {
    res.status(500).json({ message: 'BĹ‚Ä…d serwera', error: error.message });
  }
});

// Admin sends eKey
router.post('/sendEKey', authMiddleware, adminMiddleware, async (req, res) => {
  const { receiverUsername, startDate, endDate } = req.body;
  try {
    const result = await ttlockService.sendEKey(receiverUsername, startDate, endDate);
    if (result.errcode === 0) {
      res.json({ message: 'eKey wysĹ‚any pomyĹ›lnie!' });
    } else {
      res.status(400).json({ message: result.errmsg || 'BĹ‚Ä…d wysyĹ‚ania eKey' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin generates offline passcode
router.post('/getPasscode', authMiddleware, adminMiddleware, async (req, res) => {
  const { startDate, endDate } = req.body;
  try {
    const result = await ttlockService.getOfflinePasscode(startDate, endDate);
    if (result.errcode === 0) {
      res.json({ message: `Wygenerowano kod: ${result.keyboardPwd}`, passcode: result.keyboardPwd });
    } else {
      res.status(400).json({ message: result.errmsg || 'BĹ‚Ä…d generowania kodu' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin fetches lock status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const list = await ttlockService.getLockList();
    if (list && list.list && list.list.length > 0) {
      const lock = list.list[0];
      res.json({
        lockId: lock.lockId,
        lockAlias: lock.lockAlias,
        electricQuantity: lock.electricQuantity,
        lockData: lock.lockData,
        lockMac: lock.lockMac
      });
    } else {
      res.status(404).json({ message: 'Nie znaleziono zamkĂłw przypisanych do tego konta TTLock' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin fetches door logs
router.get('/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const logs = await DoorLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

