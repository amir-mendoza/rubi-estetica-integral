import { Injectable, signal } from '@angular/core';

const LOGO_DEFAULT = 'img/logo-rubi-transparente.png';
const FAVICON_DEFAULT = 'favicon.svg';

@Injectable({ providedIn: 'root' })
export class MarcaService {
  private logoKey = 'rubi.logoSitio';
  private faviconKey = 'rubi.faviconSitio';

  logoSitio = signal(this.leer(this.logoKey, LOGO_DEFAULT));
  faviconSitio = signal(this.leer(this.faviconKey, FAVICON_DEFAULT));

  constructor() {
    this.actualizarFavicon(this.faviconSitio());
  }

  cambiarLogo(valor: string): void {
    const ruta = valor.trim() || LOGO_DEFAULT;
    this.logoSitio.set(ruta);
    this.guardar(this.logoKey, ruta);
  }

  cambiarFavicon(valor: string): void {
    const ruta = valor.trim() || FAVICON_DEFAULT;
    this.faviconSitio.set(ruta);
    this.guardar(this.faviconKey, ruta);
    this.actualizarFavicon(ruta);
  }

  restablecer(): void {
    this.cambiarLogo(LOGO_DEFAULT);
    this.cambiarFavicon(FAVICON_DEFAULT);
  }

  private leer(clave: string, fallback: string): string {
    try {
      return localStorage.getItem(clave) || fallback;
    } catch {
      return fallback;
    }
  }

  private guardar(clave: string, valor: string): void {
    try {
      localStorage.setItem(clave, valor);
    } catch {
      // En producción se guardará en backend. En el prototipo puede fallar si el navegador bloquea storage.
    }
  }

  private actualizarFavicon(ruta: string): void {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) {
      link.href = ruta;
      const esSvg = ruta.endsWith('.svg');
      link.type = esSvg ? 'image/svg+xml' : 'image/png';
    }
  }
}
