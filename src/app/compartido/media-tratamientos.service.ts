import { Injectable, signal } from '@angular/core';
import { TRATAMIENTOS } from '../data/datos';
import { Tratamiento } from '../data/modelos';

export interface MediaTratamiento {
  video: string;
  videoPoster: string;
  tiktokUrl: string;
  galeria: string[];
}

const CLAVE = 'rubi.media.tratamientos';

function vacia(): MediaTratamiento {
  return { video: '', videoPoster: '', tiktokUrl: '', galeria: [] };
}

/**
 * Guarda el video, la portada, el enlace de TikTok y las fotos extra de cada
 * tratamiento. Mientras no exista backend la información vive en localStorage,
 * de modo que lo que la administradora carga en el panel se ve en la web.
 */
@Injectable({ providedIn: 'root' })
export class MediaTratamientosService {
  private cambios = signal<Record<number, MediaTratamiento>>(this.leer());

  /** Media efectiva de un tratamiento: lo guardado en el panel o el dato base. */
  media(t: Tratamiento): MediaTratamiento {
    const propio = this.cambios()[t.id];

    return {
      video: propio?.video ?? t.video ?? '',
      videoPoster: propio?.videoPoster ?? t.videoPoster ?? '',
      tiktokUrl: propio?.tiktokUrl ?? t.tiktokUrl ?? '',
      galeria: propio?.galeria ?? t.galeria ?? []
    };
  }

  mediaPorId(id: number): MediaTratamiento {
    const base = TRATAMIENTOS.find(t => t.id === id);
    return base ? this.media(base) : { ...vacia(), ...this.cambios()[id] };
  }

  guardar(id: number, media: MediaTratamiento): void {
    const limpio: MediaTratamiento = {
      video: media.video.trim(),
      videoPoster: media.videoPoster.trim(),
      tiktokUrl: media.tiktokUrl.trim(),
      galeria: media.galeria.map(g => g.trim()).filter(Boolean)
    };

    const actualizado = { ...this.cambios(), [id]: limpio };
    this.cambios.set(actualizado);
    this.persistir(actualizado);
  }

  restablecer(id: number): void {
    const actualizado = { ...this.cambios() };
    delete actualizado[id];
    this.cambios.set(actualizado);
    this.persistir(actualizado);
  }

  private leer(): Record<number, MediaTratamiento> {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (!guardado) { return {}; }

      const datos = JSON.parse(guardado) as Record<string, Partial<MediaTratamiento>>;
      const salida: Record<number, MediaTratamiento> = {};

      for (const [id, valor] of Object.entries(datos)) {
        salida[Number(id)] = {
          video: typeof valor.video === 'string' ? valor.video : '',
          videoPoster: typeof valor.videoPoster === 'string' ? valor.videoPoster : '',
          tiktokUrl: typeof valor.tiktokUrl === 'string' ? valor.tiktokUrl : '',
          galeria: Array.isArray(valor.galeria) ? valor.galeria.filter(g => typeof g === 'string') : []
        };
      }

      return salida;
    } catch {
      return {};
    }
  }

  private persistir(valor: Record<number, MediaTratamiento>): void {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(valor));
    } catch {
      // El prototipo sigue funcionando si el navegador bloquea el almacenamiento.
    }
  }
}
