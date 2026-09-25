import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import db from './db.js';
import capsulesRouter from './routes/capsules.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/auth/github', (req, res) => {
  const redirect = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user`;
  res.redirect(redirect);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const tokenRes = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }, { headers: { Accept: 'application/json' } });

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` },
    });

    const { id: githubId, login: username } = userRes.data;

    let user = db.prepare('SELECT * FROM users WHERE github_id = ?').get(String(githubId));
    if (!user) {
      const result = db.prepare('INSERT INTO users (github_id, username) VALUES (?, ?)').run(String(githubId), username);
      user = { id: result.lastInsertRowid, github_id: String(githubId), username };
    }

    const jwtToken = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', jwtToken, { httpOnly: true, sameSite: 'lax' });
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('OAuth failed');
  }
});

app.use('/api/capsules', capsulesRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

