const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// DES key và IV cố định (8 bytes mỗi cái)
const DES_KEY = Buffer.from("12345678", "utf8");   // 8-byte key
const DES_IV  = Buffer.from("87654321", "utf8");   // 8-byte IV

const users = {}; // email: { encryptedPassword }

function sha1Hash(text) {
  return crypto.createHash('sha1').update(text).digest('hex');
}

function encryptDES(text) {
  const cipher = crypto.createCipheriv('des-cbc', DES_KEY, DES_IV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptDES(encrypted) {
  const decipher = crypto.createDecipheriv('des-cbc', DES_KEY, DES_IV);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Đăng ký
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const sha1 = sha1Hash(password);
  const encrypted = encryptDES(sha1);

  users[email] = { encryptedPassword: encrypted };

  res.json({
    message: "User registered successfully (DES + SHA1).",
    sha1_hash: sha1,
    encrypted_password: encrypted,
  });
});

// Đăng nhập
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users[email];
  if (!user) return res.status(401).json({ message: "User not found." });

  const hashedInput = sha1Hash(password);
  const decryptedStored = decryptDES(user.encryptedPassword);

  if (hashedInput === decryptedStored) {
    return res.json({ message: "Login successful." });
  } else {
    return res.status(401).json({ message: "Incorrect password." });
  }
});

app.listen(3000, () => {
  console.log("🔐 DES server running at http://localhost:3000");
});
