import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Personal Tech Radar',
    loadComponent: () =>
      import('./features/home/ui/pages/home-page/home-page.component').then(
        (module) => module.HomePageComponent,
      ),
  },
];
