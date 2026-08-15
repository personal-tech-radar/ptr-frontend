import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { FrontendApiService } from '../../core/api/frontend-api.service';
import { PublicSignal } from '../../core/models/api.models';
export const signalResolver: ResolveFn<PublicSignal> = (route) =>
  inject(FrontendApiService).publicSignal(route.paramMap.get('id')!);
