import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { loggingInterceptor } from './app/interceptors/logging.interceptor';
import { errorHandlingInterceptor } from './app/interceptors/error-handling.interceptor';
import { timeoutInterceptor } from './app/interceptors/timeout.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: 'md'
    }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(
      withInterceptors([
        timeoutInterceptor,
        loggingInterceptor,
        errorHandlingInterceptor
      ])
    ),
  ],
});
