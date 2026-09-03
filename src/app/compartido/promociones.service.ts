import { Injectable, computed, signal } from '@angular/core';
import { PROMOCIONES } from '../data/datos';
import { Promocion } from '../data/modelos';

/**
 * Promociones del prototipo. El panel las crea, edita y elimina en memoria y la
 * pagina de inicio muestra las destacadas en el carrusel.
 */
@Injectable({ providedIn: 'root' })
export class PromocionesService {
  private readonly clave = 'rubi.promociones';
  private lista = signal<Promocion[]>(this.cargarInicial());

  readonly promociones = this.lista.asReadonly();

  readonly activas = computed(() => this.lista().filter(p => p.activa));

  readonly carrusel = computed(() => this.lista().filter(p => p.activa && p.destacada));

  porId(id: number): Promocion | undefined {
    return this.lista().find(p => p.id === id);
  }

  guardar(promocion: Promocion): void {
    this.actualizar(lista => promocion.id
      ? lista.map(p => (p.id === promocion.id ? { ...promocion } : p))
      : [...lista, { ...promocion, id: this.siguienteId() }]);
  }

  eliminar(id: number): void {
    this.actualizar(lista => lista.filter(p => p.id !== id));
  }

  alternarActiva(id: number): void {
    this.actualizar(lista => lista.map(p => (p.id === id ? { ...p, activa: !p.activa } : p)));
  }

  alternarDestacada(id: number): void {
    this.actualizar(lista => lista.map(p => (p.id === id ? { ...p, destacada: !p.destacada } : p)));
  }

  reasignarCategoria(categoria: Promocion['categoria'], reemplazo: Promocion['categoria']): void {
    this.actualizar(lista => lista.map(p => p.categoria === categoria ? { ...p, categoria: reemplazo } : p));
  }

  private siguienteId(): number {
    return this.lista().reduce((max, p) => Math.max(max, p.id), 0) + 1;
  }

  private actualizar(mutador: (lista: Promocion[]) => Promocion[]): void {
    const actualizada = mutador(this.lista()).map(p => ({ ...p, sesionesDetalle: p.sesionesDetalle?.map(s => ({ ...s })) }));
    this.lista.set(actualizada);
    this.persistir(actualizada);
  }

  private cargarInicial(): Promocion[] {
    if (typeof localStorage === 'undefined') {
      return this.copiarBase();
    }
    try {
      const guardado = localStorage.getItem(this.clave);
      if (!guardado) { return this.copiarBase(); }
      const promociones = JSON.parse(guardado) as Promocion[];
      return Array.isArray(promociones) && promociones.length ? promociones.map(p => ({
        ...p,
        sesionesDetalle: p.sesionesDetalle?.map(s => ({ ...s }))
      })) : this.copiarBase();
    } catch {
      return this.copiarBase();
    }
  }

  private persistir(lista: Promocion[]): void {
    if (typeof localStorage === 'undefined') { return; }
    localStorage.setItem(this.clave, JSON.stringify(lista));
  }

  private copiarBase(): Promocion[] {
    return PROMOCIONES.map(p => ({ ...p, sesionesDetalle: p.sesionesDetalle?.map(s => ({ ...s })) }));
  }
}
