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
    
    // In a real app, amount comes from a verified price list, not directly from frontend.
    // Assuming 1-month pass is 139 PLN = 13900 groszy
    const totalAmount = 13900; 
    
    // Generate unique order ID
    const extOrderId = `PHUB_${Date.now()}_${user._id}`;

    const orderData = {
      customerIp: req.ip || req.connection.remoteAddress || '127.0.0.1',
      description: 'Miesieczny Karnet Powerhub 24/7',
      totalAmount: totalAmount,
      extOrderId: extOrderId,
      buyer: {
        email: buyerEmail,
        language: 'pl'
      },
      products: [
        {
          name: 'Karnet 30-dniowy',
          unitPrice: totalAmount,
          quantity: 1
        }
      ],
      // URL the user is redirected to after finishing payment (success or error)
      // Since it's a mobile app, this should be a deep link to the app (e.g., powerhub://payment-result)
      continueUrl: 'powerhub://payment-result'
    };

    const orderResult = await payuService.createOrder(orderData);
    
    // Create a pending payment record in DB (optional, but good practice)
    // await Payment.create({ extOrderId, userId: user._id, status: 'PENDING', amount: totalAmount });

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
// We MUST parse the raw body to correctly verify the signature
const bodyParser = require('body-parser');
router.post('/notify', bodyParser.text({type: 'application/json'}), async (req, res) => {
  const signatureHeader = req.headers['openpayu-signature'];
  const bodyString = req.body; // Raw string body

  if (!payuService.verifySignature(signatureHeader, bodyString)) {
    console.error('PayU Webhook: Invalid signature!');
    return res.status(400).send('Invalid signature');
  }

  try {
    const notification = JSON.parse(bodyString);
    const order = notification.order;

    if (order && order.status === 'COMPLETED') {
      console.log(`PayU Webhook: Order ${order.extOrderId} COMPLETED!`);
      
      // Parse the user ID from the extOrderId (format: PHUB_timestamp_userId)
      const parts = order.extOrderId.split('_');
      const userId = parts[2];

      if (userId) {
        // Extend user's pass by 30 days
        const user = await User.findById(userId);
        if (user) {
          const now = new Date();
          let newExpiry = now;
          if (user.activePassExpiry && user.activePassExpiry > now) {
            newExpiry = new Date(user.activePassExpiry);
          }
          newExpiry.setDate(newExpiry.getDate() + 30);
          
          user.activePassExpiry = newExpiry;
          await user.save();
          console.log(`User ${user.email} pass extended to ${newExpiry}`);
        }
      }
    }

    // Always respond 200 OK so PayU doesn't retry
    res.status(200).send('OK');
  } catch (error) {
    console.error('PayU Webhook Error:', error.message);
    res.status(500).send('Error processing notification');
  }
});

module.exports = router;
