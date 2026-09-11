import { useEffect, useState } from 'react';

export default function Timer({ durationSeconds, startedAt }) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setRemaining(Math.max(0, durationSeconds - elapsed));
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [durationSeconds, startedAt]);

  const pct = Math.max(0, (remaining / durationSeconds) * 100);

  return (
    <div style={{ width: '100%', marginTop: 8 }}>
      <div style={{ background: '#333', borderRadius: 8, overflow: 'hidden', height: 12 }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: pct > 30 ? '#4caf50' : '#e53935',
            transition: 'width 0.2s linear',
          }}
        />
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, marginTop: 4 }}>{remaining.toFixed(1)}s</div>
    </div>
  );
}
