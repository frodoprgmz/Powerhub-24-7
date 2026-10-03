const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const payuService = require('../services/payuService');
const User = require('../models/User');

const router = express.Router();

// 1. Create a payment order
router.post('/order', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Nie znaleziono uzytkownika' });

    // Ensure we have an email for the buyer
    const buyerEmail = user.email || req.body.email || 'klient@powerhub.pl';
    
    const passType = req.body.type || 'monthly';
    let totalAmount = 10000; // 100 PLN in groszy
    let description = 'Karnet Miesieczny Powerhub 24/7';
    let productName = 'Karnet 30-dniowy';
    let passDuration = 30; // days

    if (passType === 'daily') {
      totalAmount = 2000; // 20 PLN in groszy
      description = 'Karnet Jednorazowy Powerhub 24/7';
      productName = 'Karnet 1-dniowy';
      passDuration = 1; // 1 day
    }
    
    // Generate unique order ID. We append the duration so the webhook knows how many days to add.
    const extOrderId = `PHUB_${Date.now()}_${user._id}_${passDuration}`;

    const orderData = {
      customerIp: req.ip || req.connection.remoteAddress || '127.0.0.1',
      description: description,
      totalAmount: totalAmount,
      extOrderId: extOrderId,
      buyer: {
        email: buyerEmail,
        language: 'pl'
      },
      products: [
        {
          name: productName,
          unitPrice: totalAmount,
          quantity: 1
        }
      ],
      // URL the user is redirected to after finishing payment
      continueUrl: 'https://powerhubappbackend.onrender.com/api/payu/success'
    };

    const orderResult = await payuService.createOrder(orderData);

    res.json({
      orderId: orderResult.orderId,
      redirectUri: orderResult.redirectUri,
      extOrderId: extOrderId
    });

  } catch (error) {
    res.status(500).json({ message: 'Blad przy tworzeniu zamowienia PayU', error: error.message });
  }
});

// 2. Webhook / Notification endpoint called by PayU server
const bodyParser = require('body-parser');
router.post('/notify', bodyParser.text({type: 'application/json'}), async (req, res) => {
  const signatureHeader = req.headers['openpayu-signature'];
  const bodyString = req.body; 

  if (!payuService.verifySignature(signatureHeader, bodyString)) {
    console.error('PayU Webhook: Invalid signature!');
    return res.status(400).send('Invalid signature');
  }

  try {
    const notification = JSON.parse(bodyString);
    const order = notification.order;

    if (order && order.status === 'COMPLETED') {
      console.log(`PayU Webhook: Order ${order.extOrderId} COMPLETED!`);
      
      // Parse the user ID and duration from extOrderId (PHUB_timestamp_userId_duration)
      const parts = order.extOrderId.split('_');
      const userId = parts[2];
      const duration = parseInt(parts[3]) || 30;

      if (userId) {
        // Extend user's pass
        const user = await User.findById(userId);
        if (user) {
          const now = new Date();
          let newExpiry = now;
          if (user.activePassExpiry && user.activePassExpiry > now) {
            newExpiry = new Date(user.activePassExpiry);
          }
          newExpiry.setDate(newExpiry.getDate() + duration);
          
          user.activePassExpiry = newExpiry;
          await user.save();
          console.log(`User ${user.email} pass extended by ${duration} days to ${newExpiry}`);
        }
      }
    }

    // Always respond 200 OK
    res.status(200).send('OK');
  } catch (error) {
    console.error('PayU Webhook Error:', error.message);
    res.status(500).send('Error processing notification');
  }
});

// Redirect endpoint to jump back into the app
router.get('/success', (req, res) => {
  res.send('<html><head><meta http-equiv="refresh" content="0;url=powerhub://payment-result" /></head><body>Powrot do aplikacji... <script>window.location.href="powerhub://payment-result";</script></body></html>');
});

module.exports = router;
