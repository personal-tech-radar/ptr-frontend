import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { FrontendApiService } from '../../core/api/frontend-api.service';
import { InfoPage } from '../../core/models/api.models';

export const infoPageResolver: ResolveFn<InfoPage> = (route) => {
  return inject(FrontendApiService).infoPage(route.paramMap.get('id') ?? '');
};
