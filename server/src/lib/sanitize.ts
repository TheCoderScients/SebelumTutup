import sanitizeHtml from 'sanitize-html';

export function cleanText(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  })
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanMultiline(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  })
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function makeDisplayName(nickname: string | null | undefined, isAnonymous: boolean) {
  if (isAnonymous || !nickname) return 'Anonim';
  return nickname;
}
