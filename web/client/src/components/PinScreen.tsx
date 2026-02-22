import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface PinScreenProps {
  mode: 'setup' | 'verify';
  onSuccess: () => void;
  onSetupComplete: (token: string) => void;
  onVerifyComplete: (token: string) => void;
}

const API_BASE = `http://${window.location.hostname}:3456`;

export function PinScreen({ mode, onSetupComplete, onVerifyComplete }: PinScreenProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const pin = digits.join('');

  async function submit(pinValue: string) {
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === 'setup' ? '/api/auth/setup' : '/api/auth/verify';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue }),
      });
      const data = await res.json();
      if (data.token) {
        if (mode === 'setup') onSetupComplete(data.token);
        else onVerifyComplete(data.token);
      } else {
        setError(data.error || 'Something went wrong.');
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Could not reach the server. Is it running?');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return; // only digits
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when last digit filled
    if (value && index === 5) {
      const fullPin = newDigits.join('');
      if (fullPin.length === 6) submit(fullPin);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
      submit(pasted);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      {/* Background image */}
      <div
        className="fixed inset-0 z-0 opacity-[0.07] bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: 'url(/gangs1.png)' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full">
        {/* Icon + title */}
        <div className="flex flex-col items-center gap-3">
          <img src="/gangsofclaude_icon.png" alt="Gangs of Claude" className="w-20 h-12 object-contain rounded" />
          <h1 className="text-2xl font-bold tracking-widest text-zinc-100 uppercase">Gangs of Claude</h1>
        </div>

        {/* Card */}
        <div className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-8 flex flex-col items-center gap-6 shadow-2xl">
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl mb-1">🔐</div>
            <h2 className="text-lg font-semibold text-zinc-100">
              {mode === 'setup' ? 'Create Access PIN' : 'Enter Access PIN'}
            </h2>
            <p className="text-sm text-zinc-400 text-center">
              {mode === 'setup'
                ? 'Choose a 6-digit PIN to secure your game. You\'ll need this every time you play.'
                : 'Enter your 6-digit PIN to continue.'}
            </p>
          </div>

          {/* PIN input boxes */}
          <div className="flex gap-3" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                className={`
                  w-12 h-14 text-center text-xl font-bold rounded-lg border-2 outline-none
                  bg-zinc-800 text-zinc-100 caret-transparent
                  transition-colors
                  ${digit ? 'border-yellow-500 bg-zinc-700' : 'border-zinc-600'}
                  focus:border-yellow-400
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 text-center bg-red-950/40 border border-red-800 rounded-lg px-4 py-2 w-full">
              {error}
            </p>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verifying…
            </div>
          )}

          <p className="text-xs text-zinc-600 text-center">
            {mode === 'setup'
              ? 'PIN is stored securely on this machine only.'
              : 'PIN auto-submits when all 6 digits are entered.'}
          </p>
        </div>
      </div>
    </div>
  );
}
