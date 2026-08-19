import { Injectable, signal } from '@angular/core';
import { PLANES, aISO } from '../data/datos';
import { EstadoSesion, PlanSesiones, SesionPlan } from '../data/modelos';

/**
 * Seguimiento de las sesiones personalizadas. Cada plan se identifica con el DNI
 * de la paciente y avanza sesion por sesion segun el intervalo de dias indicado.
 */
@Injectable({ providedIn: 'root' })
export class PlanesService {
  private lista = signal<PlanSesiones[]>(PLANES.map(p => ({
    ...p,
    sesiones: p.sesiones.map(s => ({ ...s }))
  })));

  readonly planes = this.lista.asReadonly();

  buscar(texto: string): PlanSesiones[] {
    const q = texto.trim().toLowerCase();
    if (!q) { return this.lista(); }
    return this.lista().filter(p =>
      p.dni.includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      p.nombre.toLowerCase().includes(q)
    );
  }

  dePaciente(pacienteId: number): PlanSesiones[] {
    return this.lista().filter(p => p.pacienteId === pacienteId);
  }

  porDni(dni: string): PlanSesiones[] {
    return this.lista().filter(p => p.dni === dni);
  }

  atendidas(plan: PlanSesiones): number {
    return plan.sesiones.filter(s => s.estado === 'Atendida').length;
  }

  avance(plan: PlanSesiones): number {
    return Math.round((this.atendidas(plan) / plan.sesiones.length) * 100);
  }

  /** Primera sesion que aún no se atiende. */
  sesionActual(plan: PlanSesiones): SesionPlan | undefined {
    return plan.sesiones.find(s => s.estado !== 'Atendida');
  }

  cambiarEstadoSesion(planId: number, numero: number, estado: EstadoSesion): void {
    this.lista.update(lista => lista.map(p => {
      if (p.id !== planId) { return p; }
      const sesiones = p.sesiones.map(s => (s.numero === numero ? { ...s, estado } : s));
      const finalizado = sesiones.every(s => s.estado === 'Atendida');
      return { ...p, sesiones, estado: finalizado ? 'Finalizado' : p.estado };
    }));
  }

  /**
   * Programa la siguiente sesion pendiente sumando el intervalo del plan a la
   * fecha de la ultima sesion con fecha registrada.
   */
  programarSiguiente(planId: number): void {
    this.lista.update(lista => lista.map(p => {
      if (p.id !== planId) { return p; }
      const siguiente = p.sesiones.find(s => s.estado === 'Pendiente');
      if (!siguiente) { return p; }

      const conFecha = [...p.sesiones].reverse().find(s => !!s.fecha);
      const base = conFecha?.fecha ? new Date(`${conFecha.fecha}T12:00:00`) : new Date();
      base.setDate(base.getDate() + p.intervaloDias);

      const sesiones = p.sesiones.map(s => (s.numero === siguiente.numero
        ? { ...s, fecha: aISO(base), estado: 'Programada' as EstadoSesion }
        : s));
      return { ...p, sesiones, estado: 'En curso' as const };
    }));
  }

  programarSiguienteManual(planId: number, fecha: string, hora: string): void {
    this.lista.update(lista => lista.map(p => {
      if (p.id !== planId) { return p; }
      const siguiente = p.sesiones.find(s => s.estado === 'Pendiente' || s.estado === 'Reprogramada');
      if (!siguiente) { return p; }

      const sesiones = p.sesiones.map(s => (s.numero === siguiente.numero
        ? { ...s, fecha, hora, estado: 'Programada' as EstadoSesion }
        : s));
      return { ...p, sesiones, estado: 'En curso' as const };
    }));
  }

  registrarPago(planId: number, monto: number): void {
    this.lista.update(lista => lista.map(p => (p.id === planId
      ? { ...p, pagado: Math.min(p.pagado + monto, p.precioTotal) }
      : p)));
  }

  agregarSesion(planId: number, procedimiento: string, tratamientoId: number): void {
    this.lista.update(lista => lista.map(p => {
      if (p.id !== planId) { return p; }
      const numero = p.sesiones.reduce((max, s) => Math.max(max, s.numero), 0) + 1;
      return {
        ...p,
        estado: 'En curso' as const,
        sesiones: [...p.sesiones, { numero, tratamientoId, procedimiento, estado: 'Pendiente' as EstadoSesion }]
      };
    }));
  }

  crearPlan(plan: Omit<PlanSesiones, 'id' | 'codigo'>): void {
    this.lista.update(lista => {
      const id = lista.reduce((max, p) => Math.max(max, p.id), 0) + 1;
      const codigo = `PL-${3000 + id}`;
      return [...lista, { ...plan, id, codigo } as PlanSesiones];
    });
  }
}

