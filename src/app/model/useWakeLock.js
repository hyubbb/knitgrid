import { useEffect, useRef, useState } from 'react';

// 화면 꺼짐 방지(Screen Wake Lock). active가 true인 동안 화면이 켜진 상태를 유지한다.
// 브라우저가 탭을 백그라운드로 보내면 Wake Lock이 자동 해제되므로, 다시 보일 때 재요청한다.
export function useWakeLock(active) {
  const sentinelRef = useRef(null);
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  // idle | active | error
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (!supported || !active) {
      setStatus('idle');
      return undefined;
    }

    let cancelled = false;

    const request = async () => {
      if (cancelled || document.visibilityState !== 'visible') return;
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) {
          sentinel.release?.().catch(() => {});
          return;
        }
        sentinelRef.current = sentinel;
        setStatus('active');
        sentinel.addEventListener?.('release', () => {
          if (sentinelRef.current === sentinel) sentinelRef.current = null;
          if (!cancelled) setStatus((prev) => (prev === 'active' ? 'idle' : prev));
        });
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') request();
    };

    request();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      sentinel?.release?.().catch(() => {});
    };
  }, [active, supported]);

  return { supported, status };
}
