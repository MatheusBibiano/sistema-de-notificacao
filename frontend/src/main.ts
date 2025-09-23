declare global {
  interface Window {
    NG_APP_API_URL?: string;
    NG_APP_WS_URL?: string;
  }
}
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
