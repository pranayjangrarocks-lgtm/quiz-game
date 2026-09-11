import { useState } from 'react';

export default function Question({ onSubmit, disabled, feedback }) {
  const [value, setValue] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type the song name..."
        disabled={disabled}
        style={{ flex: 1, padding: '10px 12px', fontSize: 16 }}
      />
      <button type="submit" disabled={disabled}>
        Submit
      </button>
      {feedback && (
        <span style={{ color: feedback.correct ? '#4caf50' : '#e53935', marginLeft: 8, whiteSpace: 'nowrap' }}>
          {feedback.correct ? `+${feedback.pointsAwarded} pts` : 'Wrong'}
        </span>
      )}
    </form>
  );
}
