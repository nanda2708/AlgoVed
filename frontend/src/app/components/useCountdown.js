'use client';

import { useEffect, useState } from 'react';

// Milliseconds remaining until `target`, updated every second.
export default function useCountdown(target) {
  const [remaining, setRemaining] = useState(() => (target ? new Date(target) - Date.now() : 0));

  useEffect(() => {
    if (!target) return undefined;
    const tick = () => setRemaining(new Date(target) - Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target]);

  return remaining;
}
