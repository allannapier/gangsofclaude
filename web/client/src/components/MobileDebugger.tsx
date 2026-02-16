import { useEffect, useRef } from 'react';
import { useGameStore } from '../store';

interface MobileDebuggerProps {
  className?: string;
}

export function MobileDebugger({ className = '' }: MobileDebuggerProps) {
  const { tasks, player } = useGameStore();

  useEffect(() => {
    console.log('=== MOBILE DEBUG ===');
    console.log('Tasks:', tasks.length);
    console.log('Actions:', tasks.filter(t => t.action).length);
    tasks.forEach((task, idx) => {
      if (task.action) {
        const action = task.action as any;
        console.log(`Task ${idx} skill:`, action.skill);
        console.log(`Task ${idx} args:`, action.args);
      }
    });
  }, [tasks]);

  if (process.env.NODE_ENV !== 'development') return null;

  return null; // Don't render anything, just log
}
