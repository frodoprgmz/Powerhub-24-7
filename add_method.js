const fs = require('fs'); let code = fs.readFileSync('backend/services/ttlockService.js', 'utf8'); const m = 
  async getLockRecords(startDate = 0, endDate = 0, lockId = null) {
    const targetLockId = lockId || await this.getDefaultLockId();
    const token = await this.getToken();
    let allRecords = [];
    let pageNo = 1;
    while (true) {
      const params = new URLSearchParams({
        clientId: process.env.TTLOCK_CLIENT_ID,
        accessToken: token,
        lockId: targetLockId,
        pageNo: pageNo,
        pageSize: 100,
        startDate: startDate,
        endDate: endDate || Date.now(),
        date: Date.now()
      });
      const response = await axios.get('https://api.ttlock.com/v3/lockRecord/list?' + params.toString());
      if (response.data.errcode !== 0) break;
      const list = response.data.list || [];
      if (list.length === 0) break;
      allRecords = allRecords.concat(list);
      if (response.data.pages <= pageNo) break;
      pageNo++;
    }
    return allRecords;
  }
; code = code.replace(/async unlock\(lockId\) \{/, m + '\n  async unlock(lockId) {'); fs.writeFileSync('backend/services/ttlockService.js', code);
