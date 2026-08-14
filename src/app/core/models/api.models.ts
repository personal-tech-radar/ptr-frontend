export type ExperienceLevel = 'junior' | 'middle' | 'senior';
export type TaxonomyKind = 'technology' | 'interest';
export type FeedbackType = 'useful' | 'not_useful';

export interface ApiErrorBody {
  statusCode: number;
  path?: string;
  message: string;
  errorCode?: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  timezone: string | null;
  githubUrl: string | null;
  level: ExperienceLevel | null;
  dailyDigestEnabled: boolean;
  weeklyDigestEnabled: boolean;
  emailVerifiedAt: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TaxonomyItem {
  id: string;
  kind: TaxonomyKind;
  name: string;
  aliases: string[];
}

export interface ContentStream {
  id: string;
  key: string;
  name: string;
  description: string | null;
  sortOrder: number;
  enabled: boolean;
}

export interface UserTaxonomy {
  level: ExperienceLevel | null;
  technologyInterests: TaxonomyItem[];
  contentStreams: ContentStream[];
  onboardingCompletedAt: string | null;
}

export interface SignalItem {
  articleId: string;
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string;
  shortSummary: string;
  complexityLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  materialType: string | null;
  streamId?: string | null;
  streamName?: string | null;
  score?: number;
  saved?: boolean;
  feedback?: FeedbackType | null;
}

export interface SignalDayGroup {
  date: string;
  articles: SignalItem[];
}

export interface FeedResponse {
  days: SignalDayGroup[];
}

export interface PipelineStatistics {
  period: string;
  activeSources: number;
  articlesCollected: number;
  articlesAnalyzed: number;
  selectedForRadar: number | null;
}

export interface PublicSignal {
  id: string;
  articleId?: string;
  title: string;
  originalUrl: string;
  publicRedirectUrl: string;
  source: unknown;
  author?: unknown;
  publishedAt?: string | null;
  summary?: string | null;
  longSummary?: string | null;
  technologies: { id: string; name: string }[];
  interests: { id: string; name: string }[];
  streams: { id: string; key: string; name: string }[];
  primaryStream?: { id: string; key: string; name: string };
  complexity?: string | null;
  qualityScore?: number | null;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PublicFeedResponse {
  data: PublicSignal[];
  meta: PageMeta;
}

export interface PreviewFeedResponse {
  data: SignalItem[];
  meta: PipelineStatistics;
}

export interface InfoPageListItem {
  id: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InfoPage extends InfoPageListItem {
  fullText: string;
}

export interface PublicFilterOption {
  id: string;
  name: string;
}

export interface OnboardingPayload {
  timezone: string;
  githubUrl: string | null;
  level: ExperienceLevel;
  technologyInterests: { kind: TaxonomyKind; name: string }[];
  contentStreamIds: string[];
}
