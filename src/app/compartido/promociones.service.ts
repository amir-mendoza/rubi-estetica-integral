import { Injectable, computed, signal } from '@angular/core';
import { PROMOCIONES } from '../data/datos';
import { Promocion } from '../data/modelos';

/**
 * Promociones del prototipo. El panel las crea, edita y elimina en memoria y la
 * pagina de inicio muestra las destacadas en el carrusel.
 */
@Injectable({ providedIn: 'root' })
export class PromocionesService {
  private lista = signal<Promocion[]>(PROMOCIONES.map(p => ({ ...p })));

  readonly promociones = this.lista.asReadonly();

  readonly activas = computed(() => this.lista().filter(p => p.activa));

  readonly carrusel = computed(() => this.lista().filter(p => p.activa && p.destacada));

  porId(id: number): Promocion | undefined {
    return this.lista().find(p => p.id === id);
  }

  guardar(promocion: Promocion): void {
    this.lista.update(lista => promocion.id
      ? lista.map(p => (p.id === promocion.id ? { ...promocion } : p))
      : [...lista, { ...promocion, id: this.siguienteId() }]);
  }

  eliminar(id: number): void {
    this.lista.update(lista => lista.filter(p => p.id !== id));
  }

  alternarActiva(id: number): void {
    this.lista.update(lista => lista.map(p => (p.id === id ? { ...p, activa: !p.activa } : p)));
  }

  alternarDestacada(id: number): void {
    this.lista.update(lista => lista.map(p => (p.id === id ? { ...p, destacada: !p.destacada } : p)));
  }

  private siguienteId(): number {
    return this.lista().reduce((max, p) => Math.max(max, p.id), 0) + 1;
  }
}
