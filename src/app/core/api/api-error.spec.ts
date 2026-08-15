import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';

import { mapApiError } from './api-error';

describe('mapApiError', () => {
  it('maps a login 401 to invalid credentials', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: {
        statusCode: 401,
        errorCode: 'UNAUTHORIZED',
        message: 'Invalid email or password',
        path: '/auth/login',
      },
    });

    expect(mapApiError(error)).toEqual({
      code: 'invalid_credentials',
      message: 'Invalid email or password.',
    });
  });

  it('keeps an unrelated 401 as an expired session', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: {
        statusCode: 401,
        errorCode: 'UNAUTHORIZED',
        message: 'Unauthorized',
        path: '/users/me',
      },
    });

    expect(mapApiError(error)).toEqual({
      code: 'unauthorized',
      message: 'Your session has expired.',
    });
  });
});
