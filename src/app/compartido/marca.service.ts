import { Injectable, signal } from '@angular/core';

const LOGO_DEFAULT = 'img/marca-rubi-logo-magenta.png';
const LOGO_ADMIN_DEFAULT = 'img/marca-rubi-logo-blanco.png';
const FAVICON_DEFAULT = 'img/marca-rubi-favicon-magenta.png';
const FAVICON_OSCURO_DEFAULT = 'img/marca-rubi-favicon-blanco.png';
const LOGOS_WEB_ANTERIORES = new Set([
  'img/logo-rubi-oficial.png',
  'img/logo-rubi-transparente.png',
  'img/logo-rubi-web-transparente.png',
  'img/logo-rubi-horizontal-magenta.png'
]);
const LOGOS_ADMIN_ANTERIORES = new Set([
  'img/logo-rubi-panel-transparente.png',
  'img/logo-rubi-horizontal-blanco.png'
]);
const FAVICONES_ANTERIORES = new Set(['favicon.svg']);

@Injectable({ providedIn: 'root' })
export class MarcaService {
  private logoKey = 'rubi.logoSitio';
  private logoAdminKey = 'rubi.logoAdmin';
  private faviconKey = 'rubi.faviconSitio';
  private temaOscuro?: MediaQueryList;

  logoSitio = signal(this.leer(this.logoKey, LOGO_DEFAULT));
  logoAdmin = signal(this.leer(this.logoAdminKey, LOGO_ADMIN_DEFAULT));
  faviconSitio = signal(this.leer(this.faviconKey, FAVICON_DEFAULT));

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.temaOscuro = window.matchMedia('(prefers-color-scheme: dark)');
      this.temaOscuro.addEventListener('change', () => this.actualizarFavicon(this.faviconSitio()));
    }
    this.actualizarFavicon(this.faviconSitio());
  }

  cambiarLogo(valor: string): void {
    const ruta = valor.trim() || LOGO_DEFAULT;
    this.logoSitio.set(ruta);
    this.guardar(this.logoKey, ruta);
  }

  cambiarLogoAdmin(valor: string): void {
    const ruta = valor.trim() || LOGO_ADMIN_DEFAULT;
    this.logoAdmin.set(ruta);
    this.guardar(this.logoAdminKey, ruta);
  }

  cambiarFavicon(valor: string): void {
    const ruta = valor.trim() || FAVICON_DEFAULT;
    this.faviconSitio.set(ruta);
    this.guardar(this.faviconKey, ruta);
    this.actualizarFavicon(ruta);
  }

  restablecer(): void {
    this.cambiarLogo(LOGO_DEFAULT);
    this.cambiarLogoAdmin(LOGO_ADMIN_DEFAULT);
    this.cambiarFavicon(FAVICON_DEFAULT);
  }

  private leer(clave: string, fallback: string): string {
    try {
      const valor = localStorage.getItem(clave);
      if (!valor) {
        return fallback;
      }
      if (clave === this.logoKey && LOGOS_WEB_ANTERIORES.has(valor)) {
        return fallback;
      }
      if (clave === this.logoAdminKey && LOGOS_ADMIN_ANTERIORES.has(valor)) {
        return fallback;
      }
      if (clave === this.faviconKey && FAVICONES_ANTERIORES.has(valor)) {
        return fallback;
      }
      return valor;
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
      const favicon = this.resolverFavicon(ruta);
      link.href = favicon;
      const esSvg = favicon.endsWith('.svg');
      link.type = esSvg ? 'image/svg+xml' : 'image/png';
    }
  }

  private resolverFavicon(ruta: string): string {
    if (ruta === FAVICON_DEFAULT || FAVICONES_ANTERIORES.has(ruta)) {
      return this.temaOscuro?.matches ? FAVICON_OSCURO_DEFAULT : FAVICON_DEFAULT;
    }
    return ruta;
  }
}
