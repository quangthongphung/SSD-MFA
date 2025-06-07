const express = require('express');
const app = express();
app.use(express.json());

const approvedUsers = {};
const requestLog = {}; // Lưu lịch sử thời gian gửi MFA của từng email
const MAX_REQUESTS = 3;
const TIME_WINDOW = 60 * 1000; // 60 giây

// Gửi yêu cầu MFA
app.post('/api/send-mfa', (req, res) => {
  const { email } = req.body;
  const now = Date.now();

  if (!requestLog[email]) {
    requestLog[email] = [];
  }

  requestLog[email] = requestLog[email].filter(timestamp => now - timestamp < TIME_WINDOW);

  if (requestLog[email].length >= MAX_REQUESTS) {
    return res.status(429).json({
      message: 'Too many MFA requests. Please wait before trying again.'
    });
  }

  // Ghi lại thời điểm gửi yêu cầu
  requestLog[email].push(now);

  console.log(`📨 MFA request sent to ${email}`);
  res.status(200).json({ message: 'MFA request sent. Waiting for approval.' });
});

// Người dùng nhấn "Approve"
app.post('/api/mfa-approve', (req, res) => {
  const { email } = req.body;
  approvedUsers[email] = true;

  console.log(`✅ ${email} approved MFA request`);
  res.status(200).json({ message: 'MFA approved.' });
});

// Truy cập tài nguyên nội bộ
app.get('/api/secure-data', (req, res) => {
  const email = req.query.email;

  if (approvedUsers[email]) {
    return res.status(200).json({
      message: '🔓 Access granted to protected data.',
      data: {
        dashboard: 'Internal data, Slack logs, finance',
        role: 'admin'
      }
    });
  } else {
    return res.status(403).json({ message: '⛔ Access denied. MFA not approved.' });
  }
});

app.listen(3000, () => {
  console.log('🚀 MFA Rate Limiting server running at http://localhost:3000');
});
