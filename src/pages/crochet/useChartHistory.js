import { useCallback, useState } from 'react';

const LIMIT = 120;

/** 차트 스냅샷 기반 실행 취소/다시 실행 */
export function useChartHistory(initial) {
  const [history, setHistory] = useState(() => ({ past: [], present: initial, future: [] }));

  const commit = useCallback((updater) => {
    setHistory((h) => {
      const next = typeof updater === 'function' ? updater(h.present) : updater;
      if (!next || next === h.present) return h;
      return { past: [...h.past, h.present].slice(-LIMIT), present: next, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.past.length) return h;
      return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (!h.future.length) return h;
      return { past: [...h.past, h.present].slice(-LIMIT), present: h.future[0], future: h.future.slice(1) };
    });
  }, []);

  const reset = useCallback((chart) => setHistory({ past: [], present: chart, future: [] }), []);

  return {
    chart: history.present,
    commit,
    undo,
    redo,
    reset,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
}
