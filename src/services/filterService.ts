import fs from 'fs';
import path from 'path';
import type {
  CreateTitleRequest,
  FilterInterval,
  PublishTitleRequest,
  TitleFilterConfig,
  TitleKind,
} from '../types';
import {
  buildMatchPatterns,
  displayTitle,
  slugifyTitleId,
} from '../utils/matchPatterns';

const DATA_PATH = path.resolve(__dirname, '../data/filters.json');

interface FiltersFile {
  titles: TitleFilterConfig[];
}

let titles: TitleFilterConfig[] = loadFromDisk();

function loadFromDisk(): TitleFilterConfig[] {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as FiltersFile;
    if (!parsed || !Array.isArray(parsed.titles)) {
      console.warn('[filterService] filters.json missing titles array; starting empty');
      return [];
    }
    return parsed.titles.map(normalizeLoadedTitle);
  } catch (err) {
    console.error('[filterService] Failed to read filters.json', err);
    return [];
  }
}

function normalizeLoadedTitle(raw: TitleFilterConfig): TitleFilterConfig {
  const kind: TitleKind =
    raw.kind === 'movie' || raw.kind === 'show'
      ? raw.kind
      : raw.episodeName?.trim()
        ? 'show'
        : 'movie';

  return {
    ...raw,
    kind,
    episodeName:
      kind === 'show' ? raw.episodeName?.trim() || undefined : undefined,
  };
}

function persist(): void {
  const payload: FiltersFile = { titles };
  fs.writeFileSync(DATA_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function nextUniqueTitleId(baseTitle: string): string {
  const base = slugifyTitleId(baseTitle);
  let candidate = base;
  let n = 1;
  while (titles.some((t) => t.titleId === candidate)) {
    candidate = `${base}-${n++}`.slice(0, 64);
  }
  return candidate;
}

function normalizeFilters(filters: FilterInterval[]): FilterInterval[] {
  return filters.map((filter, index) => {
    const id =
      typeof filter.id === 'string' && filter.id.trim()
        ? filter.id.trim()
        : `filter-${String(index + 1).padStart(3, '0')}`;

    const start = Number(filter.start);
    const end = Number(filter.end);
    const action = filter.action === 'skip' ? 'skip' : 'mute';
    const label =
      typeof filter.label === 'string' && filter.label.trim()
        ? filter.label.trim()
        : undefined;

    return { id, start, end, action, label };
  });
}

function matchesQuery(config: TitleFilterConfig, query: string): boolean {
  const normalized = query.toLowerCase();
  const queryGti = normalized.match(/amzn1\.dv\.gti\.[a-f0-9-]+/i)?.[0];
  if (!queryGti) return false;

  const configGti = config.gti?.trim().toLowerCase();
  if (configGti && configGti === queryGti) return true;

  return config.matchPatterns.some((pattern) => {
    const patternGti = pattern.toLowerCase().match(/amzn1\.dv\.gti\.[a-f0-9-]+/i)?.[0];
    return patternGti === queryGti;
  });
}

export function getAllTitles(): TitleFilterConfig[] {
  return titles;
}

export function getTitleById(titleId: string): TitleFilterConfig | undefined {
  return titles.find((t) => t.titleId === titleId);
}

export function findTitleByPattern(query: string): TitleFilterConfig | undefined {
  return titles.find((t) => matchesQuery(t, query));
}

export function createTitle(input: CreateTitleRequest): TitleFilterConfig {
  const title = input.title.trim();
  const videoUrl = input.videoUrl.trim();
  const kind: TitleKind = input.kind === 'movie' ? 'movie' : 'show';
  const episodeName =
    kind === 'show' ? input.episodeName?.trim() || '' : undefined;

  if (!title) {
    throw new Error('title is required');
  }
  if (!videoUrl) {
    throw new Error('videoUrl is required');
  }
  if (kind === 'show' && !episodeName) {
    throw new Error('episodeName is required for shows');
  }

  const gti = input.gti?.trim() || undefined;
  if (!gti || !/amzn1\.dv\.gti\./i.test(gti)) {
    throw new Error('gti (amzn1.dv.gti.… ) is required');
  }

  let matchPatterns =
    Array.isArray(input.matchPatterns) && input.matchPatterns.length > 0
      ? input.matchPatterns
          .map((p) => p.trim())
          .filter((p) => /amzn1\.dv\.gti\./i.test(p))
      : buildMatchPatterns({ title, videoUrl, kind, episodeName, gti });

  if (matchPatterns.length === 0) {
    matchPatterns = [gti];
  }

  const idSource =
    kind === 'show' && episodeName
      ? displayTitle(title, kind, episodeName)
      : title;

  const config: TitleFilterConfig = {
    titleId: nextUniqueTitleId(idSource),
    title,
    kind,
    ...(episodeName ? { episodeName } : {}),
    gti,
    provider: 'prime-video',
    videoUrl,
    matchPatterns,
    filters: [],
  };

  titles = [...titles, config];
  persist();
  return config;
}

export function publishTitle(
  titleId: string,
  input: PublishTitleRequest
): TitleFilterConfig {
  const index = titles.findIndex((t) => t.titleId === titleId);
  if (index === -1) {
    throw new Error(`No title found for titleId: ${titleId}`);
  }

  const current = titles[index];
  const title =
    typeof input.title === 'string' && input.title.trim()
      ? input.title.trim()
      : current.title;
  const kind: TitleKind =
    input.kind === 'movie' || input.kind === 'show' ? input.kind : current.kind;
  const episodeName =
    kind === 'show'
      ? (typeof input.episodeName === 'string' && input.episodeName.trim()
          ? input.episodeName.trim()
          : current.episodeName)
      : undefined;
  const videoUrl =
    typeof input.videoUrl === 'string' && input.videoUrl.trim()
      ? input.videoUrl.trim()
      : current.videoUrl;
  const gti =
    typeof input.gti === 'string' && input.gti.trim()
      ? input.gti.trim()
      : current.gti;

  if (!gti || !/amzn1\.dv\.gti\./i.test(gti)) {
    throw new Error('gti (amzn1.dv.gti.… ) is required');
  }
  if (kind === 'show' && !episodeName?.trim()) {
    throw new Error('episodeName is required for shows');
  }

  let matchPatterns = (current.matchPatterns || []).filter((p) =>
    /amzn1\.dv\.gti\./i.test(p)
  );
  if (Array.isArray(input.matchPatterns) && input.matchPatterns.length > 0) {
    matchPatterns = input.matchPatterns
      .map((p) => p.trim())
      .filter((p) => /amzn1\.dv\.gti\./i.test(p));
  } else if (
    videoUrl !== current.videoUrl ||
    title !== current.title ||
    kind !== current.kind ||
    episodeName !== current.episodeName ||
    gti !== current.gti
  ) {
    matchPatterns = buildMatchPatterns({
      title,
      videoUrl: videoUrl || '',
      kind,
      episodeName,
      gti,
    });
  }
  if (!matchPatterns.includes(gti)) {
    matchPatterns = [...matchPatterns, gti];
  }

  if (!Array.isArray(input.filters)) {
    throw new Error('filters must be an array');
  }

  const filters = normalizeFilters(input.filters);

  const updated: TitleFilterConfig = {
    ...current,
    title,
    kind,
    episodeName,
    gti,
    videoUrl,
    matchPatterns,
    filters,
  };

  if (kind === 'movie') {
    delete updated.episodeName;
  }

  const validationErrors = validateFilterConfig(updated);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join('; '));
  }

  titles = titles.map((t, i) => (i === index ? updated : t));
  persist();
  return updated;
}

export function validateFilterConfig(config: TitleFilterConfig): string[] {
  const errors: string[] = [];

  if (!config.titleId) errors.push('titleId is required');
  if (!config.title) errors.push('title is required');
  if (config.kind !== 'movie' && config.kind !== 'show') {
    errors.push('kind must be "movie" or "show"');
  }
  if (config.kind === 'show' && !config.episodeName?.trim()) {
    errors.push('episodeName is required for shows');
  }
  if (!Array.isArray(config.matchPatterns)) {
    errors.push('matchPatterns must be an array');
  }
  if (!Array.isArray(config.filters)) {
    errors.push('filters must be an array');
    return errors;
  }

  for (const filter of config.filters) {
    if (!filter.id) errors.push('Each filter requires an id');
    if (typeof filter.start !== 'number' || filter.start < 0) {
      errors.push(`Filter ${filter.id}: start must be a non-negative number`);
    }
    if (typeof filter.end !== 'number' || filter.end <= filter.start) {
      errors.push(`Filter ${filter.id}: end must be greater than start`);
    }
    if (filter.action !== 'mute' && filter.action !== 'skip') {
      errors.push(`Filter ${filter.id}: action must be "mute" or "skip"`);
    }
  }

  return errors;
}

/** Reload from disk (useful after external edits / tests). */
export function reloadFromDisk(): TitleFilterConfig[] {
  titles = loadFromDisk();
  return titles;
}
