export default function Leaderboard({ entries = [], highlightId }) {
  return (
    <ol style={{ padding: 0, listStyle: 'none' }}>
      {entries.map((p, i) => (
        <li
          key={p.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: p.id === highlightId ? '#2d2d2d' : 'transparent',
            borderRadius: 6,
            marginBottom: 4,
          }}
        >
          <span>
            {i + 1}. {p.name}
          </span>
          <strong>{p.score}</strong>
        </li>
      ))}
    </ol>
  );
}
