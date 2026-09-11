import { useLocation, useParams } from 'react-router-dom';
import LeaderboardList from '../components/Leaderboard.jsx';

export default function Leaderboard() {
  const { code } = useParams();
  const { state } = useLocation();
  const entries = state?.leaderboard || [];

  return (
    <div style={{ maxWidth: 480, margin: '80px auto' }}>
      <h2>🏆 Final Leaderboard — {code}</h2>
      <LeaderboardList entries={entries} />
    </div>
  );
}
