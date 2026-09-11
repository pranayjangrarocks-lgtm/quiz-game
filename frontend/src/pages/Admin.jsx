import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { socket } from '../socket.js';

const emptyQuestion = () => ({
  youtubeUrl: '',
  startTime: 0,
  duration: 20,
  answer: '',
  altAnswers: '',
  points: 1000,
});

export default function Admin() {
  const [adminSecret, setAdminSecret] = useState(sessionStorage.getItem('adminSecret') || '');
  const [quizzes, setQuizzes] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [game, setGame] = useState(null);
  const [status, setStatus] = useState('');
  const [answeredCount, setAnsweredCount] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listQuizzes().then(setQuizzes).catch(() => {});
  }, []);

  useEffect(() => {
    sessionStorage.setItem('adminSecret', adminSecret);
  }, [adminSecret]);

  useEffect(() => {
    function onAnswerReceived(payload) {
      setAnsweredCount(payload.answeredCount);
    }
    socket.on('answer:received', onAnswerReceived);
    return () => socket.off('answer:received', onAnswerReceived);
  }, []);

  const updateQuestion = (i, field, value) => {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, [field]: value } : q)));
  };

  const addQuestionRow = () => setQuestions((qs) => [...qs, emptyQuestion()]);
  const removeQuestionRow = (i) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const createQuiz = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        title,
        description,
        questions: questions.map((q) => ({
          ...q,
          startTime: Number(q.startTime) || 0,
          duration: Number(q.duration) || 20,
          points: Number(q.points) || 1000,
          altAnswers: q.altAnswers
            ? q.altAnswers.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
        })),
      };
      const quiz = await api.createQuiz(payload, adminSecret);
      setQuizzes((qs) => [quiz, ...qs]);
      setTitle('');
      setDescription('');
      setQuestions([emptyQuestion()]);
    } catch (err) {
      setError(err.message);
    }
  };

  const createGame = async () => {
    setError('');
    try {
      const g = await api.createGame(selectedQuizId, adminSecret);
      setGame(g);
      setStatus('WAITING');
      socket.emit('admin:join', { code: g.code, secret: adminSecret }, (res) => {
        if (res?.error) setError(res.error);
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const nextQuestion = () => {
    setAnsweredCount(0);
    setStatus('ACTIVE');
    socket.emit('admin:next_question', { code: game.code, secret: adminSecret });
  };

  const endGame = () => {
    setStatus('FINISHED');
    socket.emit('admin:end_game', { code: game.code, secret: adminSecret });
  };

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', paddingBottom: 80 }}>
      <h2>Admin</h2>
      <label>
        Admin secret:{' '}
        <input type="password" value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} />
      </label>

      {error && <p style={{ color: '#e53935' }}>{error}</p>}

      <hr />
      <h3>Create Quiz</h3>
      <form onSubmit={createQuiz} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Quiz title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {questions.map((q, i) => (
          <fieldset key={i} style={{ border: '1px solid #444', padding: 12 }}>
            <legend>Question {i + 1}</legend>
            <input
              placeholder="YouTube URL"
              value={q.youtubeUrl}
              onChange={(e) => updateQuestion(i, 'youtubeUrl', e.target.value)}
              required
              style={{ width: '100%', marginBottom: 6 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                placeholder="Start time (s)"
                value={q.startTime}
                onChange={(e) => updateQuestion(i, 'startTime', e.target.value)}
              />
              <input
                type="number"
                placeholder="Duration (s)"
                value={q.duration}
                onChange={(e) => updateQuestion(i, 'duration', e.target.value)}
              />
              <input
                type="number"
                placeholder="Points"
                value={q.points}
                onChange={(e) => updateQuestion(i, 'points', e.target.value)}
              />
            </div>
            <input
              placeholder="Correct answer (song name)"
              value={q.answer}
              onChange={(e) => updateQuestion(i, 'answer', e.target.value)}
              required
              style={{ width: '100%', marginTop: 6 }}
            />
            <input
              placeholder="Alternate answers, comma separated (optional)"
              value={q.altAnswers}
              onChange={(e) => updateQuestion(i, 'altAnswers', e.target.value)}
              style={{ width: '100%', marginTop: 6 }}
            />
            {questions.length > 1 && (
              <button type="button" onClick={() => removeQuestionRow(i)} style={{ marginTop: 6 }}>
                Remove
              </button>
            )}
          </fieldset>
        ))}
        <button type="button" onClick={addQuestionRow}>
          + Add question
        </button>
        <button type="submit">Create quiz</button>
      </form>

      <hr />
      <h3>Start a Game</h3>
      <select value={selectedQuizId} onChange={(e) => setSelectedQuizId(e.target.value)}>
        <option value="">Select a quiz…</option>
        {quizzes.map((q) => (
          <option key={q.id} value={q.id}>
            {q.title}
          </option>
        ))}
      </select>
      <button onClick={createGame} disabled={!selectedQuizId} style={{ marginLeft: 8 }}>
        Create game
      </button>

      {game && (
        <div style={{ marginTop: 20 }}>
          <h3>
            Game code: <span style={{ fontFamily: 'monospace' }}>{game.code}</span>
          </h3>
          <p>Status: {status}</p>
          <p>Answers received this question: {answeredCount}</p>
          <button onClick={nextQuestion} disabled={status === 'FINISHED'}>
            Next question
          </button>
          <button onClick={endGame} disabled={status === 'FINISHED'} style={{ marginLeft: 8 }}>
            End game
          </button>
        </div>
      )}
    </div>
  );
}
