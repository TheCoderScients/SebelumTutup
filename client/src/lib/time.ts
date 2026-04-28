export function relativeTime(value: string) {
  const date = new Date(value);
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });

  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1]
  ];

  for (const [unit, amount] of divisions) {
    if (Math.abs(diffSeconds) >= amount || unit === 'second') {
      return formatter.format(Math.round(diffSeconds / amount), unit);
    }
  }

  return 'baru saja';
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('id', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function getCountdownParts(targetIso: string) {
  const diff = Math.max(0, new Date(targetIso).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, done: diff <= 0 };
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat('id', { notation: 'compact' }).format(value);
}
