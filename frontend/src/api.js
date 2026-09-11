const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', body, adminSecret } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(adminSecret ? { 'x-admin-secret': adminSecret } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listQuizzes: () => request('/quizzes'),
  getQuiz: (id) => request(`/quizzes/${id}`),
  createQuiz: (data, adminSecret) => request('/quizzes', { method: 'POST', body: data, adminSecret }),
  deleteQuiz: (id, adminSecret) => request(`/quizzes/${id}`, { method: 'DELETE', adminSecret }),
  createGame: (quizId, adminSecret) =>
    request('/games', { method: 'POST', body: { quizId }, adminSecret }),
  getGame: (code) => request(`/games/${code}`),
};
