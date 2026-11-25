import type { TitleKind } from '../types';

export interface BuildMatchPatternsInput {
  title: string;
  videoUrl: string;
  kind: TitleKind;
  episodeName?: string;
  gti?: string;
}

const GTI_RE = /amzn1\.dv\.gti\.[a-f0-9-]+/i;

/**
 * Match patterns are GTI-only. Title/episode strings are metadata, not match keys.
 */
export function buildMatchPatterns(input: BuildMatchPatternsInput): string[] {
  const patterns = new Set<string>();
  const gti = input.gti?.trim() ?? '';

  if (gti && GTI_RE.test(gti)) {
    patterns.add(gti);
  }

  // Also accept a GTI embedded in videoUrl if provided
  const fromUrl = input.videoUrl.match(GTI_RE);
  if (fromUrl?.[0]) patterns.add(fromUrl[0]);

  return [...patterns];
}

export function slugifyTitleId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return slug || 'title';
}

export function displayTitle(
  title: string,
  kind: TitleKind,
  episodeName?: string
): string {
  if (kind === 'show' && episodeName?.trim()) {
    return `${title.trim()} — ${episodeName.trim()}`;
  }
  return title.trim();
}
