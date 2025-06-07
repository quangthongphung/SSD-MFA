const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let currentPendingEmail = null;
let approvedUsers = {};

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Missing credentials' });
    }

    if (password !== 'secret') {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    currentPendingEmail = email;
    approvedUsers[email] = false;

    console.log(`⏳ ${email} passed login. Waiting for MFA approval...`);
    res.status(202).json({ message: 'Waiting for MFA approval' });
});

app.post('/api/mfa-approve', (req, res) => {
    if (!currentPendingEmail) {
        return res.status(404).json({ message: 'No pending MFA request.' });
    }

    approvedUsers[currentPendingEmail] = true;
    console.log(`✅ ${currentPendingEmail} approved MFA request`);
    res.status(200).json({ message: 'MFA approved.' });
});

app.post('/api/mfa-cancel', (req, res) => {
    if (!currentPendingEmail) {
        return res.status(404).json({ message: 'No pending MFA request to cancel.' });
    }

    console.log(`❌ ${currentPendingEmail} denied MFA request`);
    delete approvedUsers[currentPendingEmail];
    currentPendingEmail = null;

    res.status(200).json({ message: 'MFA request has been canceled.' });
});

app.get('/verify-mfa', (req, res) => {
    if (currentPendingEmail && approvedUsers[currentPendingEmail]) {
        const approvedEmail = currentPendingEmail;
        currentPendingEmail = null;
        delete approvedUsers[approvedEmail];

        return res.status(200).json({ message: 'MFA verified. Login complete.' });
    }

    return res.status(403).json({ message: 'MFA not yet approved.' });
});

app.listen(port, () => {
    console.log(`🔐 MFA server running at http://localhost:${port}`);
});
