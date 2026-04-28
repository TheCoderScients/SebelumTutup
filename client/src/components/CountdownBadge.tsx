import { Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCountdownParts } from '../lib/time';

export function CountdownBadge({ closeAt, compact = false }: { closeAt: string; compact?: boolean }) {
  const [parts, setParts] = useState(() => getCountdownParts(closeAt));

  useEffect(() => {
    const timer = window.setInterval(() => setParts(getCountdownParts(closeAt)), 1000);
    return () => window.clearInterval(timer);
  }, [closeAt]);

  if (parts.done) {
    return (
      <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-ember/40 bg-ember/10 px-2.5 py-1.5 text-xs text-ember sm:gap-2 sm:px-3 sm:text-sm">
        <Clock3 className="h-4 w-4" />
        Demo sudah ditutup
      </span>
    );
  }

  const text = compact
    ? `${parts.days}h ${parts.hours}j ${parts.minutes}m`
    : `${parts.days} hari ${parts.hours} jam ${parts.minutes} menit ${parts.seconds} detik`;

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-aqua/30 bg-aqua/10 px-2.5 py-1.5 text-xs text-aqua shadow-[0_0_26px_rgba(70,180,255,0.12)] sm:gap-2 sm:px-3 sm:text-sm">
      <Clock3 className="h-4 w-4" />
      {text}
    </span>
  );
}
