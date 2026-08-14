import { HttpErrorResponse } from '@angular/common/http';

import { ApiErrorBody } from '../models/api.models';

export type AppErrorCode =
  | 'email_registered'
  | 'invalid_credentials'
  | 'invalid_token'
  | 'email_unverified'
  | 'onboarding_incomplete'
  | 'rate_limited'
  | 'unauthorized'
  | 'validation'
  | 'unknown';

export interface AppError {
  code: AppErrorCode;
  message: string;
}

const CODE_MAP: Record<string, AppErrorCode> = {
  EMAIL_ALREADY_REGISTERED: 'email_registered',
  INVALID_CREDENTIALS: 'invalid_credentials',
  INVALID_VERIFICATION_TOKEN: 'invalid_token',
  EMAIL_NOT_VERIFIED: 'email_unverified',
  ONBOARDING_INCOMPLETE: 'onboarding_incomplete',
};

export function mapApiError(error: unknown): AppError {
  if (!(error instanceof HttpErrorResponse)) {
    return { code: 'unknown', message: 'Something went wrong. Please try again.' };
  }

  const body = error.error as Partial<ApiErrorBody> | undefined;
  const code = body?.errorCode ? CODE_MAP[body.errorCode] : undefined;
  if (code) return { code, message: messageFor(code) };
  if (error.status === 401) return { code: 'unauthorized', message: 'Your session has expired.' };
  if (error.status === 409)
    return { code: 'email_registered', message: messageFor('email_registered') };
  if (error.status === 429) return { code: 'rate_limited', message: messageFor('rate_limited') };
  if (error.status === 400)
    return { code: 'validation', message: 'Check the highlighted values and try again.' };
  return { code: 'unknown', message: 'The radar is temporarily unavailable. Please try again.' };
}

function messageFor(code: AppErrorCode): string {
  const messages: Partial<Record<AppErrorCode, string>> = {
    email_registered: 'An account already exists for this email.',
    invalid_credentials: 'The email or password is incorrect.',
    invalid_token: 'This link is invalid or has expired.',
    email_unverified: 'Confirm your email before continuing.',
    onboarding_incomplete: 'Complete onboarding to build your radar.',
    rate_limited: 'Too many attempts. Please wait and try again.',
  };
  return messages[code] ?? 'Something went wrong. Please try again.';
}
