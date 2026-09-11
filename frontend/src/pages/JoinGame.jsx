import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket.js';

export default function JoinGame() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  const join = (e) => {
    e.preventDefault();
    setError('');
    setJoining(true);
    const trimmedCode = code.trim().toUpperCase();

    socket.emit('join_game', { code: trimmedCode, name: name.trim() }, (res) => {
      setJoining(false);
      if (res?.error) {
        setError(res.error);
        return;
      }
      sessionStorage.setItem('participantId', res.participant.id);
      sessionStorage.setItem('participantName', res.participant.name);
      navigate(`/game/${trimmedCode}`);
    });
  };

  return (
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h2>Join Game</h2>
      <form onSubmit={join} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="Game code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          required
        />
        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          required
        />
        <button type="submit" disabled={joining}>
          {joining ? 'Joining...' : 'Join'}
        </button>
      </form>
      {error && <p style={{ color: '#e53935' }}>{error}</p>}
    </div>
  );
}
