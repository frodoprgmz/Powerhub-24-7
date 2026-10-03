const axios = require('axios');
const crypto = require('crypto');

// Use sandbox by default if not specified
const PAYU_URL = process.env.PAYU_ENVIRONMENT === 'production' 
  ? 'https://secure.payu.com' 
  : 'https://secure.snd.payu.com';

const POS_ID = process.env.PAYU_POS_ID || '300746'; // Sandbox default
const CLIENT_ID = process.env.PAYU_CLIENT_ID || '300746'; // Sandbox default
const CLIENT_SECRET = process.env.PAYU_CLIENT_SECRET || '2ee86a66e5d97e3fadc400c9f19b065d'; // Sandbox default
const SECOND_KEY = process.env.PAYU_SECOND_KEY || 'b6ca15b0d1020e809c5e065d1f1cea68'; // Sandbox default

let accessToken = null;
let tokenExpiry = null;

class PayUService {
  async getToken() {
    if (accessToken && tokenExpiry && tokenExpiry > Date.now()) {
      return accessToken;
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    });

    try {
      const response = await axios.post(`${PAYU_URL}/pl/standard/user/oauth/authorize`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      accessToken = response.data.access_token;
      // Expires_in is in seconds. Subtract 60 seconds for safety.
      tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
      
      return accessToken;
    } catch (error) {
      console.error('PayU Token Error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with PayU');
    }
  }

  async createOrder(orderRequest) {
    const token = await this.getToken();
    
    // Default order properties required by PayU
    const order = {
      merchantPosId: POS_ID,
      currencyCode: 'PLN',
      customerIp: orderRequest.customerIp || '127.0.0.1',
      description: orderRequest.description || 'Karnet Powerhub',
      totalAmount: orderRequest.totalAmount, // In grosze (e.g. 100.00 PLN = 10000)
      extOrderId: orderRequest.extOrderId, // Our internal unique order ID
      buyer: orderRequest.buyer, // { email, firstName, lastName, language: 'pl' }
      products: orderRequest.products, // [{ name, unitPrice, quantity }]
      continueUrl: orderRequest.continueUrl, // URL to redirect user after payment
      notifyUrl: process.env.PAYU_NOTIFY_URL || 'https://powerhubappbackend.onrender.com/api/payu/notify',
    };

    try {
      const response = await axios.post(`${PAYU_URL}/api/v2_1/orders`, order, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // PayU redirects automatically to payment page, but we want JSON response
        maxRedirects: 0 
      });

      return response.data; // Includes orderId and redirectUri
    } catch (error) {
      // Axios treats 302 Found (PayU redirect) as error if maxRedirects is 0, but PayU returns 200 OK or 201 Created for REST API calls
      if (error.response && (error.response.status === 201 || error.response.status === 200 || error.response.status === 302)) {
        return error.response.data;
      }
      console.error('PayU Create Order Error:', error.response?.data || error.message);
      throw new Error('Failed to create PayU order');
    }
  }

  verifySignature(signatureHeader, bodyString) {
    // signatureHeader looks like: "sender=300746;signature=1a2b3c...;algorithm=MD5"
    if (!signatureHeader) return false;
    
    const parts = signatureHeader.split(';');
    let incomingSignature = '';
    
    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key === 'signature') incomingSignature = value;
    });

    if (!incomingSignature) return false;

    // Calculate our own hash: MD5(body + SECOND_KEY)
    const expectedSignature = crypto.createHash('md5')
      .update(bodyString + SECOND_KEY, 'utf8')
      .digest('hex');

    return incomingSignature === expectedSignature;
  }
}

module.exports = new PayUService();
