import { Injectable, signal } from '@angular/core';

export type EstiloCargador =
  | 'anillo'
  | 'puntos'
  | 'petalos'
  | 'barras'
  | 'orbita'
  | 'segmentos';

export interface OpcionCargador {
  estilo: EstiloCargador;
  nombre: string;
  descripcion: string;
}

export const ESTILOS_CARGADOR: OpcionCargador[] = [
  { estilo: 'anillo', nombre: 'Anillo', descripcion: 'Aro con punto que gira, sobrio y elegante.' },
  { estilo: 'puntos', nombre: 'Puntos', descripcion: 'Doce puntos que se encienden en círculo.' },
  { estilo: 'petalos', nombre: 'Pétalos', descripcion: 'Pétalos girando, acorde al concepto spa.' },
  { estilo: 'barras', nombre: 'Barras', descripcion: 'Líneas radiales clásicas de carga.' },
  { estilo: 'orbita', nombre: 'Órbita', descripcion: 'Dos aros en sentidos opuestos.' },
  { estilo: 'segmentos', nombre: 'Segmentos', descripcion: 'Rueda partida en cuatro segmentos.' }
];

export interface ConfiguracionCargador {
  estilo: EstiloCargador;
  /** Duración de un giro completo en milisegundos: valores altos = animación más suave. */
  velocidadMs: number;
  /** Tiempo mínimo que se mantiene el velo entre páginas para evitar parpadeos. */
  minimoMs: number;
  mostrarPorcentaje: boolean;
  mensaje: string;
}

export const CARGADOR_POR_DEFECTO: ConfiguracionCargador = {
  estilo: 'anillo',
  velocidadMs: 1400,
  minimoMs: 420,
  mostrarPorcentaje: true,
  mensaje: 'Preparando tu experiencia'
};

const CLAVE = 'rubi.cargador';

/**
 * Estilo del indicador de carga (navegación entre páginas y subidas del panel).
 * Se guarda en el navegador mientras no exista el backend de configuración.
 */
@Injectable({ providedIn: 'root' })
export class CargadorService {
  config = signal<ConfiguracionCargador>(this.leer());

  readonly opciones = ESTILOS_CARGADOR;

  actualizar(cambios: Partial<ConfiguracionCargador>): void {
    const nuevo = { ...this.config(), ...cambios };
    this.config.set(nuevo);
    this.guardar(nuevo);
  }

  restablecer(): void {
    this.config.set({ ...CARGADOR_POR_DEFECTO });
    this.guardar(CARGADOR_POR_DEFECTO);
  }

  private leer(): ConfiguracionCargador {
    try {
      const guardado = localStorage.getItem(CLAVE);
      return guardado
        ? { ...CARGADOR_POR_DEFECTO, ...(JSON.parse(guardado) as Partial<ConfiguracionCargador>) }
        : { ...CARGADOR_POR_DEFECTO };
    } catch {
      return { ...CARGADOR_POR_DEFECTO };
    }
  }

  private guardar(c: ConfiguracionCargador): void {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(c));
    } catch {
      // El prototipo no falla si el navegador bloquea el almacenamiento.
    }
  }
}
