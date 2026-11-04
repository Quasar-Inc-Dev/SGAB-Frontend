import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Depois que a primeira tela abre, as outras são baixadas em segundo plano:
    // o carregamento inicial fica leve e a navegação continua instantânea
    provideRouter(routes, withPreloading(PreloadAllModules)), provideClientHydration(),
    // withFetch: recomendado quando o app usa SSR/hidratação
    provideHttpClient(withFetch(), withInterceptors([authInterceptor]))
  ]
};
