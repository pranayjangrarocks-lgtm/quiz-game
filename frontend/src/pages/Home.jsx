import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
      <h1>🎵 Guess the Song</h1>
      <p>Join a live quiz and race to name the song from a YouTube clip.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
        <Link to="/join">
          <button>Join a game</button>
        </Link>
        <Link to="/admin">
          <button>Admin</button>
        </Link>
      </div>
    </div>
  );
}
