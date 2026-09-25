import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM capsules WHERE user_id = ?').all(req.user.id);
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { title, prompt } = req.body;
  const result = db.prepare('INSERT INTO capsules (user_id, title, prompt) VALUES (?, ?, ?)').run(req.user.id, title, prompt);
  res.json({ id: result.lastInsertRowid, title, prompt });
});

router.put('/:id', requireAuth, (req, res) => {
  const { title, prompt } = req.body;
  db.prepare('UPDATE capsules SET title = ?, prompt = ? WHERE id = ? AND user_id = ?').run(title, prompt, req.params.id, req.user.id);
  res.json({ id: req.params.id, title, prompt });
});

router.delete('/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

export default router;