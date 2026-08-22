import { Injectable, effect, signal } from '@angular/core';

export type ModoFondo = 'color' | 'imagen' | 'video';

const CLAVE = 'rubi.fondoWeb';

export interface ConfiguracionFondo {
  modo: ModoFondo;
  color: string;
  colorSecundario: string;
  imagen: string;
  video: string;
  posterVideo: string;
  opacidadMedio: number;
  velo: number;
  desenfoque: number;
  pausarQuieto: boolean;
}

export const FONDO_POR_DEFECTO: ConfiguracionFondo = {
  modo: 'color',
  color: '#fff7f2',
  colorSecundario: '#f9e7f1',
  imagen: '',
  video: '',
  posterVideo: '',
  opacidadMedio: 55,
  velo: 78,
  desenfoque: 0,
  pausarQuieto: true
};

/**
 * Fondo de la web pública: color sólido, imagen o video, con velo de las secciones
 * para que el contenido siga siendo legible. En el prototipo se guarda en el navegador.
 */
@Injectable({ providedIn: 'root' })
export class FondoService {
  config = signal<ConfiguracionFondo>(this.leer());

  constructor() {
    effect(() => this.aplicar(this.config()));
  }

  actualizar(cambios: Partial<ConfiguracionFondo>): void {
    const nuevo = { ...this.config(), ...cambios };
    this.config.set(nuevo);
    this.guardar(nuevo);
  }

  restablecer(): void {
    this.config.set({ ...FONDO_POR_DEFECTO });
    this.guardar(FONDO_POR_DEFECTO);
  }

  /** Verdadero cuando hay imagen o video activo y las secciones deben volverse translúcidas. */
  hayMedio(): boolean {
    const c = this.config();
    return (c.modo === 'imagen' && !!c.imagen) || (c.modo === 'video' && !!c.video);
  }

  private aplicar(c: ConfiguracionFondo): void {
    if (typeof document === 'undefined') { return; }
    const raiz = document.documentElement;
    raiz.style.setProperty('--velo', String(Math.min(Math.max(c.velo, 0), 100) / 100));
    raiz.classList.toggle('fondo-medios', this.hayMedio());

    if (c.modo === 'color') {
      raiz.style.setProperty('--fondo', c.color);
    } else {
      raiz.style.removeProperty('--fondo');
    }
  }

  private leer(): ConfiguracionFondo {
    try {
      const guardado = localStorage.getItem(CLAVE);
      return guardado
        ? { ...FONDO_POR_DEFECTO, ...(JSON.parse(guardado) as Partial<ConfiguracionFondo>) }
        : { ...FONDO_POR_DEFECTO };
    } catch {
      return { ...FONDO_POR_DEFECTO };
    }
  }

  private guardar(c: ConfiguracionFondo): void {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(c));
    } catch {
      // Un video o una imagen muy pesada puede superar el límite del navegador.
      // En producción esto se guardará en el backend.
    }
  }
}
