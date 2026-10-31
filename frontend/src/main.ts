import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * Punto de entrada del frontend: arranca la aplicación standalone con el
 * componente raíz {@link App} y la configuración de {@link appConfig}.
 */
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
