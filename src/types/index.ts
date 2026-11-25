export type FilterAction = 'mute' | 'skip';
export type TitleKind = 'movie' | 'show';

export interface FilterInterval {
  id: string;
  start: number;
  end: number;
  action: FilterAction;
  label?: string;
}

export interface TitleFilterConfig {
  titleId: string;
  title: string;
  kind: TitleKind;
  /** Required when kind is "show" */
  episodeName?: string;
  /** Amazon Prime GTI (amzn1.dv.gti.…); preferred match key */
  gti?: string;
  provider: 'prime-video';
  /** Source video / detail URL used when authoring the title */
  videoUrl?: string;
  /** Substrings matched against page URL or document title */
  matchPatterns: string[];
  filters: FilterInterval[];
}

export interface CreateTitleRequest {
  title: string;
  kind: TitleKind;
  episodeName?: string;
  /** Required Amazon GTI (amzn1.dv.gti.…) */
  gti: string;
  videoUrl: string;
  provider?: 'prime-video';
  matchPatterns?: string[];
}

export interface PublishTitleRequest {
  title?: string;
  kind?: TitleKind;
  episodeName?: string;
  gti?: string;
  videoUrl?: string;
  matchPatterns?: string[];
  filters: FilterInterval[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: string[];
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthResponse {
  success: true;
  message: string;
}
