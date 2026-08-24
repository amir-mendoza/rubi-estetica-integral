import { Injectable, signal } from '@angular/core';

export type EstadoSubida = 'cargando' | 'listo' | 'error';

export interface SubidaArchivo {
  id: number;
  nombre: string;
  tamanoMb: number;
  porcentaje: number;
  estado: EstadoSubida;
  mensaje: string;
}

const FEMENINOS = ['imagen', 'foto', 'portada', 'galería', 'miniatura'];

/** Concordancia del aviso final: "Video subido" / "Imagen subida". */
function participio(etiqueta: string): string {
  return FEMENINOS.includes(etiqueta.trim().toLowerCase()) ? 'subida' : 'subido';
}

/**
 * Lectura de archivos con progreso visible (0–100 %) para el panel.
 * Mientras no exista el backend, el archivo se convierte a data URL; el avance
 * refleja la lectura real del navegador, así un video largo tarda más que una foto.
 */
@Injectable({ providedIn: 'root' })
export class SubidasService {
  subidas = signal<SubidaArchivo[]>([]);

  private contador = 0;

  /** Lee el archivo y devuelve su data URL cuando el progreso llega al 100 %. */
  leer(archivo: File, etiqueta = 'Archivo'): Promise<string> {
    const id = ++this.contador;
    const entrada: SubidaArchivo = {
      id,
      nombre: archivo.name,
      tamanoMb: Math.round((archivo.size / (1024 * 1024)) * 10) / 10,
      porcentaje: 0,
      estado: 'cargando',
      mensaje: `Cargando ${etiqueta.toLowerCase()}…`
    };
    this.subidas.update(lista => [...lista, entrada]);

    return new Promise<string>((resolver, rechazar) => {
      const lector = new FileReader();
      let objetivo = 5;
      let resultado = '';
      let terminado = false;

      const paso = setInterval(() => {
        const actual = this.porcentajeDe(id);
        if (actual >= objetivo) {
          if (terminado && actual >= 100) {
            clearInterval(paso);
            this.actualizar(id, {
              estado: 'listo',
              porcentaje: 100,
              mensaje: `${etiqueta} ${participio(etiqueta)} exitosamente`
            });
            this.retirar(id);
            resolver(resultado);
          }
          return;
        }
        const salto = Math.max(1, Math.round((objetivo - actual) / 4));
        this.actualizar(id, { porcentaje: Math.min(objetivo, actual + salto) });
      }, 90);

      lector.onprogress = evento => {
        if (evento.lengthComputable) {
          // Se reserva el último 10 % para el cierre de la lectura.
          objetivo = Math.min(90, Math.round((evento.loaded / evento.total) * 90));
        } else {
          objetivo = Math.min(90, objetivo + 5);
        }
      };

      lector.onload = () => {
        resultado = String(lector.result || '');
        objetivo = 100;
        terminado = true;
      };

      lector.onerror = () => {
        clearInterval(paso);
        this.actualizar(id, { estado: 'error', mensaje: 'No se pudo leer el archivo' });
        this.retirar(id, 5000);
        rechazar(new Error('lectura fallida'));
      };

      lector.readAsDataURL(archivo);
    });
  }

  private porcentajeDe(id: number): number {
    return this.subidas().find(s => s.id === id)?.porcentaje ?? 0;
  }

  private actualizar(id: number, cambios: Partial<SubidaArchivo>): void {
    this.subidas.update(lista => lista.map(s => (s.id === id ? { ...s, ...cambios } : s)));
  }

  private retirar(id: number, espera = 2800): void {
    setTimeout(() => {
      this.subidas.update(lista => lista.filter(s => s.id !== id));
    }, espera);
  }
}
