import { describe, expect, it } from 'vitest';
import { cleanMultiline, cleanText } from './sanitize.js';
import { getTrendingScore } from './trending.js';
import { postCreateSchema, reactionToggleSchema, voteSchema } from './validation.js';

describe('input safety', () => {
  it('strips html from single-line and multiline content', () => {
    expect(cleanText('  <script>alert(1)</script> Halo   dunia  ')).toBe('Halo dunia');
    expect(cleanMultiline('<b>Baris</b>\n\n\nkedua')).toBe('Baris\n\nkedua');
  });

  it('validates post, reaction, and vote payloads', () => {
    expect(
      postCreateSchema.parse({
        title: 'Opini kecil',
        body: 'Isi opini yang cukup panjang.',
        category: 'opini',
        displayMode: 'anonymous'
      }).category
    ).toBe('opini');

    expect(() => reactionToggleSchema.parse({ emoji: '😈' })).toThrow();
    expect(() => voteSchema.parse({ value: 2 })).toThrow();
  });
});

describe('trending score', () => {
  it('rewards interaction and discounts age', () => {
    const now = new Date('2026-04-22T12:00:00.000Z');
    const lively = getTrendingScore(
      {
        score: 5,
        commentCount: 8,
        reactionCount: 10,
        createdAt: new Date('2026-04-22T10:00:00.000Z')
      },
      now
    );
    const quiet = getTrendingScore(
      {
        score: 1,
        commentCount: 1,
        reactionCount: 1,
        createdAt: new Date('2026-04-21T10:00:00.000Z')
      },
      now
    );

    expect(lively).toBeGreaterThan(quiet);
  });
});
