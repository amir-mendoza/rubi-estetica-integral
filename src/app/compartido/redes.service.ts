import { Injectable, computed, signal } from '@angular/core';

export type RedSocial = 'instagram' | 'tiktok' | 'facebook' | 'whatsapp';

export interface RedConfig {
  red: RedSocial;
  nombre: string;
  url: string;
  visible: boolean;
}

export const REDES_DEFAULT: RedConfig[] = [
  { red: 'instagram', nombre: 'Instagram', url: 'https://www.instagram.com/rubiesteticaintegral346', visible: true },
  { red: 'tiktok', nombre: 'TikTok', url: 'https://www.tiktok.com/@rubiesteticaintegral', visible: true },
  { red: 'facebook', nombre: 'Facebook', url: 'https://www.facebook.com/share/1EmkVciVwj/', visible: true },
  { red: 'whatsapp', nombre: 'WhatsApp', url: 'https://wa.me/51945189720', visible: true }
];

const CLAVE = 'rubi.redes';

/**
 * Enlaces de redes sociales editables desde el panel: una sola fuente para el
 * banner de inicio, el pie y la página de contacto. Mientras no exista el
 * backend se guardan en localStorage; luego se reemplaza por el endpoint de
 * configuración del negocio.
 */
@Injectable({ providedIn: 'root' })
export class RedesService {
  redes = signal<RedConfig[]>(this.leer());

  /** Redes marcadas como visibles y con enlace configurado. */
  activas = computed(() => this.redes().filter(r => r.visible && !!r.url.trim()));

  /** Enlace de WhatsApp para el botón flotante; vacío si está oculto. */
  whatsapp = computed(() => this.activas().find(r => r.red === 'whatsapp')?.url ?? '');

  cambiarUrl(red: RedSocial, valor: string): void {
    this.actualizar(red, { url: this.normalizar(valor) });
  }

  cambiarVisibilidad(red: RedSocial, visible: boolean): void {
    this.actualizar(red, { visible });
  }

  restablecer(): void {
    const copia = REDES_DEFAULT.map(r => ({ ...r }));
    this.redes.set(copia);
    this.guardar(copia);
  }

  private actualizar(red: RedSocial, cambio: Partial<RedConfig>): void {
    const actualizado = this.redes().map(r => (r.red === red ? { ...r, ...cambio } : r));
    this.redes.set(actualizado);
    this.guardar(actualizado);
  }

  /** Acepta URL completa, dominio, @usuario o número de WhatsApp. */
  private normalizar(valor: string): string {
    const limpio = valor.trim();
    if (!limpio) return '';
    if (/^https?:\/\//i.test(limpio)) return limpio;
    if (/^\+?[\d\s()-]{6,}$/.test(limpio)) return `https://wa.me/${limpio.replace(/\D/g, '')}`;
    return `https://${limpio.replace(/^\/+/, '')}`;
  }

  private leer(): RedConfig[] {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (!guardado) return REDES_DEFAULT.map(r => ({ ...r }));
      const datos = JSON.parse(guardado) as Partial<RedConfig>[];
      return REDES_DEFAULT.map(base => {
        const propio = datos.find(d => d.red === base.red);
        return {
          ...base,
          url: typeof propio?.url === 'string' ? propio.url : base.url,
          visible: typeof propio?.visible === 'boolean' ? propio.visible : base.visible
        };
      });
    } catch {
      return REDES_DEFAULT.map(r => ({ ...r }));
    }
  }

  private guardar(valor: RedConfig[]): void {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(valor));
    } catch {
      // El prototipo no falla si el navegador bloquea el almacenamiento.
    }
  }
}
