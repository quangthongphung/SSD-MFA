const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors');

app.use(cors());
app.use(express.json());

const loginAttempts = {};
const MAX_ATTEMPTS = 5;
const BLOCK_TIME_MS = 30000; // 30 giây

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Missing credentials' });
    }

    const now = Date.now();
    if (!loginAttempts[username]) {
        loginAttempts[username] = { count: 0, firstAttempt: now };
    }

    const userData = loginAttempts[username];

    if (now - userData.firstAttempt < BLOCK_TIME_MS) {
        userData.count++;
        if (userData.count > MAX_ATTEMPTS) {
            return res.status(429).json({
                message: 'Too many MFA requests. Please wait before trying again.'
            });
        }
    } else {
        // Reset sau BLOCK_TIME_MS
        loginAttempts[username] = { count: 1, firstAttempt: now };
    }

    if (password === 'secret') {
        return res.json({ status: 'success', message: 'Login successful' });
    }

    return res.status(401).json({ message: 'Invalid credentials' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
