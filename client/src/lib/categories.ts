import type { PostCategory, PostSort } from '../types/api';

export const categories: Array<{ value: PostCategory; label: string }> = [
  { value: 'random', label: 'Random' },
  { value: 'curhat', label: 'Curhat' },
  { value: 'opini', label: 'Opini' },
  { value: 'sekolah', label: 'Sekolah' },
  { value: 'game', label: 'Game' },
  { value: 'teknologi', label: 'Teknologi' },
  { value: 'cinta', label: 'Cinta' }
];

export const sortOptions: Array<{ value: PostSort; label: string }> = [
  { value: 'new', label: 'Terbaru' },
  { value: 'trending', label: 'Trending' },
  { value: 'active', label: 'Paling ramai' }
];

export const reactions = ['🔥', '😂', '💀', '❤️'];
