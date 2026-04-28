export const POST_CATEGORIES = ['random', 'curhat', 'opini', 'sekolah', 'game', 'teknologi', 'cinta'] as const;
export const REACTION_EMOJIS = ['🔥', '😂', '💀', '❤️'] as const;

export type PostCategoryValue = (typeof POST_CATEGORIES)[number];
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];
