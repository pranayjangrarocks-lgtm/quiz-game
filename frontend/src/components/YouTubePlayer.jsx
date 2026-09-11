import { useEffect, useRef } from 'react';

let apiLoadingPromise = null;
function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiLoadingPromise) return apiLoadingPromise;

  apiLoadingPromise = new Promise((resolve) => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
  });
  return apiLoadingPromise;
}

/**
 * Plays a YouTube clip starting at `startTime` for `duration` seconds.
 * `hideVideo` covers the visible player so the title/thumbnail can't spoil
 * the answer - only the audio (and any on-screen visuals) come through.
 */
export default function YouTubePlayer({ videoId, startTime = 0, duration = 20, hideVideo = true, onEnded }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const stopTimeoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !containerRef.current) return;

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          start: startTime,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (e) => {
            e.target.playVideo();
            stopTimeoutRef.current = setTimeout(() => {
              e.target.pauseVideo();
              onEnded?.();
            }, duration * 1000);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      if (playerRef.current?.destroy) playerRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, startTime, duration]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480, aspectRatio: '16/9' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {hideVideo && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            pointerEvents: 'none',
          }}
        >
          🎵
        </div>
      )}
    </div>
  );
}
