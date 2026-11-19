import filtersData from '../data/filters.json';
import type { TitleFilterConfig } from '../types';

const titles = filtersData.titles as TitleFilterConfig[];

export function getAllTitles(): TitleFilterConfig[] {
  return titles;
}

export function getTitleById(titleId: string): TitleFilterConfig | undefined {
  return titles.find((t) => t.titleId === titleId);
}

export function findTitleByPattern(query: string): TitleFilterConfig | undefined {
  const normalized = query.toLowerCase();
  return titles.find((t) =>
    t.matchPatterns.some((pattern) =>
      normalized.includes(pattern.toLowerCase())
    )
  );
}

export function validateFilterConfig(config: TitleFilterConfig): string[] {
  const errors: string[] = [];

  if (!config.titleId) errors.push('titleId is required');
  if (!config.title) errors.push('title is required');
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
