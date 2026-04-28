import { MessageSquareText } from 'lucide-react';

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/20 bg-white/[0.035] px-6 py-10 text-center backdrop-blur-xl">
      <MessageSquareText className="mx-auto h-9 w-9 text-mint/70" />
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{body}</p>
    </div>
  );
}
