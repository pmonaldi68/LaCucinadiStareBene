import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Bell, X, Volume2 } from 'lucide-react';
import { playTimerChime } from '../utils/helpers';

interface CookingTimerProps {
  initialMinutes: number;
  label?: string;
  onClose?: () => void;
}

export function CookingTimer({ initialMinutes, label, onClose }: CookingTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setTotalSeconds(initialMinutes * 60);
    setIsRunning(false);
    setIsDone(false);
  }, [initialMinutes]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTotalSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setIsDone(true);
            playTimerChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const toggleRun = () => {
    if (isDone) {
      setTotalSeconds(initialMinutes * 60);
      setIsDone(false);
    }
    setIsRunning(!isRunning);
  };

  const reset = () => {
    setIsRunning(false);
    setIsDone(false);
    setTotalSeconds(initialMinutes * 60);
  };

  const addTime = (minutes: number) => {
    setTotalSeconds((prev) => Math.max(0, prev + minutes * 60));
    setIsDone(false);
  };

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className={`rounded-2xl p-4 border transition-all ${
      isDone
        ? 'bg-[#ffebe6] border-[#e07558] animate-pulse shadow-md'
        : 'bg-[#faf6ee] border-[#ebdccb] shadow-xs'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8a4a35]">
          <Bell className="w-3.5 h-3.5" />
          <span>{label || 'Timer da cucina'}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-[#8c7b6b] hover:text-[#2c241d]"
            aria-label="Chiudi timer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="font-mono text-3xl font-bold tracking-tight text-[#2c241d]">
          {timeFormatted}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleRun}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white font-medium shadow-xs active:scale-95 transition-all ${
              isRunning ? 'bg-[#706456]' : 'bg-[#c25e3f] hover:bg-[#a94f34]'
            }`}
            aria-label={isRunning ? 'Pausa' : 'Avvia'}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>

          <button
            onClick={reset}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-white border border-[#ebdccb] text-[#5c4a3b] hover:bg-[#f2ecdf] active:scale-95 transition-all"
            aria-label="Azzera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isDone && (
        <div className="mt-2.5 flex items-center justify-between text-xs font-medium text-[#b33a1e]">
          <span className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5" /> Tempo scaduto!
          </span>
          <button
            onClick={() => {
              playTimerChime();
            }}
            className="underline text-[11px]"
          >
            Suona di nuovo
          </button>
        </div>
      )}

      <div className="mt-2.5 pt-2 border-t border-[#ebdccb]/60 flex items-center gap-2">
        <span className="text-[10px] text-[#8c7b6b]">Aggiungi:</span>
        <button
          onClick={() => addTime(1)}
          className="px-2 py-0.5 rounded-md text-[11px] bg-white border border-[#ebdccb] text-[#5c4a3b] hover:bg-[#f2ecdf]"
        >
          +1 min
        </button>
        <button
          onClick={() => addTime(5)}
          className="px-2 py-0.5 rounded-md text-[11px] bg-white border border-[#ebdccb] text-[#5c4a3b] hover:bg-[#f2ecdf]"
        >
          +5 min
        </button>
        <button
          onClick={() => addTime(10)}
          className="px-2 py-0.5 rounded-md text-[11px] bg-white border border-[#ebdccb] text-[#5c4a3b] hover:bg-[#f2ecdf]"
        >
          +10 min
        </button>
      </div>
    </div>
  );
}
