import { useEffect, useState } from 'react';
import { apiFetch } from './api';

export default function Dashboard() {
  const [capsules, setCapsules] = useState([]);
  const [form, setForm] = useState({ title: '', prompt: '' });
  const [editingId, setEditingId] = useState(null);

  const load = () => apiFetch('/api/capsules').then(r => r.json()).then(setCapsules).catch(() => window.location.href = '/login');

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await apiFetch(`/api/capsules/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
    } else {
      await apiFetch('/api/capsules', { method: 'POST', body: JSON.stringify(form) });
    }
    setForm({ title: '', prompt: '' });
    setEditingId(null);
    load();
  };

  const remove = async (id) => {
    await apiFetch(`/api/capsules/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <form onSubmit={submit}>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" required />
        <textarea value={form.prompt} onChange={e => setForm({ ...form, prompt: e.target.value })} placeholder="Prompt" required />
        <button type="submit">{editingId ? 'Update' : 'Create'}</button>
      </form>
      <ul>
        {capsules.map(c => (
          <li key={c.id}>
            <strong>{c.title}</strong>: {c.prompt}
            <button onClick={() => { setForm({ title: c.title, prompt: c.prompt }); setEditingId(c.id); }}>Edit</button>
            <button onClick={() => remove(c.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
