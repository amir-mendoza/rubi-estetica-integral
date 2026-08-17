import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { SesionService } from './sesion.service';

/** Bloquea el panel administrativo si la sesión no tiene una cuenta interna. */
export const adminGuard: CanMatchFn = (_ruta, segmentos) => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  if (sesion.esAdmin()) {
    return true;
  }
  const destino = '/' + segmentos.map(s => s.path).join('/');
  return router.createUrlTree(['/ingresar'], { queryParams: { volver: destino } });
};
