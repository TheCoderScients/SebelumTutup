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
      <span className="inline-flex items-center gap-2 rounded-full border border-ember/40 bg-ember/10 px-3 py-1 text-sm text-ember">
        <Clock3 className="h-4 w-4" />
        Demo sudah ditutup
      </span>
    );
  }

  const text = compact
    ? `${parts.days}h ${parts.hours}j ${parts.minutes}m`
    : `${parts.days} hari ${parts.hours} jam ${parts.minutes} menit ${parts.seconds} detik`;

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-aqua/30 bg-aqua/10 px-3 py-1 text-sm text-aqua">
      <Clock3 className="h-4 w-4" />
      {text}
    </span>
  );
}
