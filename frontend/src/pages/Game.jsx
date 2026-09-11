import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../socket.js';
import YouTubePlayer from '../components/YouTubePlayer.jsx';
import Timer from '../components/Timer.jsx';
import Question from '../components/Question.jsx';
import LeaderboardList from '../components/Leaderboard.jsx';

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null); // current question payload from server
  const [ended, setEnded] = useState(null); // { correctAnswer, leaderboard }
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [waiting, setWaiting] = useState(true);
  const participantId = sessionStorage.getItem('participantId');

  useEffect(() => {
    function onQuestionStart(payload) {
      setQuestion(payload);
      setEnded(null);
      setAnswered(false);
      setFeedback(null);
      setWaiting(false);
    }
    function onQuestionEnd(payload) {
      setEnded(payload);
    }
    function onGameEnd(payload) {
      navigate(`/leaderboard/${code}`, { state: payload });
    }

    socket.on('question:start', onQuestionStart);
    socket.on('question:end', onQuestionEnd);
    socket.on('game:end', onGameEnd);

    return () => {
      socket.off('question:start', onQuestionStart);
      socket.off('question:end', onQuestionEnd);
      socket.off('game:end', onGameEnd);
    };
  }, [code, navigate]);

  const submitAnswer = (answer) => {
    socket.emit('submit_answer', { code, answer }, (res) => {
      if (res?.error) return;
      setAnswered(true);
      setFeedback(res);
    });
  };

  if (waiting || !question) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
        <h2>Waiting for the host to start the next question…</h2>
        <p>Game code: {code}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <p>
        Question {question.index + 1} / {question.total}
      </p>
      <YouTubePlayer videoId={question.videoId} startTime={question.startTime} duration={question.duration} />
      <Timer durationSeconds={question.duration} startedAt={question.serverTime} />

      {!ended && <Question onSubmit={submitAnswer} disabled={answered} feedback={feedback} />}

      {ended && (
        <div style={{ marginTop: 20 }}>
          <h3>Answer: {ended.correctAnswer}</h3>
          <LeaderboardList entries={ended.leaderboard} highlightId={participantId} />
          <p>Waiting for the host to continue…</p>
        </div>
      )}
    </div>
  );
}
