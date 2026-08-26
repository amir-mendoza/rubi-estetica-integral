import { Injectable, inject, signal } from '@angular/core';
import { HOY_ISO, PLANES, TRATAMIENTOS, aISO, tratamientoPorId } from '../data/datos';
import { Cita, DetallePago, EstadoSesion, MetodoPago, PlanSesiones, SesionPlan } from '../data/modelos';
import { AgendaService } from './agenda.service';

/**
 * Seguimiento de las sesiones personalizadas. Cada plan se identifica con el DNI
 * de la paciente y avanza sesion por sesion segun el intervalo de dias indicado.
 */
@Injectable({ providedIn: 'root' })
export class PlanesService {
  private agenda = inject(AgendaService);
  private lista = signal<PlanSesiones[]>(PLANES.map(p => ({
    ...p,
    pagosDetalle: p.pagosDetalle ? p.pagosDetalle.map(pago => ({ ...pago })) : undefined,
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
      const sesiones = p.sesiones.map(s => (s.numero === numero ? {
        ...s,
        estado,
        registradoPor: s.registradoPor || 'Recepción'
      } : s));
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
        ? { ...s, fecha, hora, estado: 'Programada' as EstadoSesion, registradoPor: 'Recepción' }
        : s));
      const planActualizado = { ...p, sesiones, estado: 'En curso' as const };
      this.sincronizarCitaDeSesion(planActualizado, siguiente.numero);
      return planActualizado;
    }));
  }

  registrarPago(planId: number, monto: number, metodo: MetodoPago = 'Efectivo', usuario = 'Recepción', canal: 'Recepción' | 'WhatsApp' = 'Recepción'): void {
    const hora = new Date().toTimeString().slice(0, 5);
    this.lista.update(lista => lista.map(p => (p.id === planId
      ? {
          ...p,
          pagado: Math.min(p.pagado + monto, p.precioTotal),
          fechaLiquidacion: Math.min(p.pagado + monto, p.precioTotal) >= p.precioTotal ? HOY_ISO : p.fechaLiquidacion,
          pagosDetalle: [
            ...(p.pagosDetalle ?? []),
            {
              metodo,
              monto,
              fecha: HOY_ISO,
              hora,
              canal,
              registradoPor: usuario,
              codigoOperacion: `${metodo.toUpperCase().replace(/\s/g, '-')}-${Date.now().toString().slice(-6)}`
            } satisfies DetallePago
          ]
        }
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

  crearPlan(plan: Omit<PlanSesiones, 'id' | 'codigo'>): PlanSesiones {
    let creado!: PlanSesiones;
    this.lista.update(lista => {
      const id = lista.reduce((max, p) => Math.max(max, p.id), 0) + 1;
      const codigo = `PL-${3000 + id}`;
      creado = {
        ...plan,
        id,
        codigo,
        pagosDetalle: plan.pagosDetalle ? plan.pagosDetalle.map(pago => ({ ...pago })) : []
      } as PlanSesiones;
      return [...lista, creado];
    });
    this.sincronizarSesionesProgramadas(creado);
    return creado;
  }

  puedeProgramarSiguiente(plan: PlanSesiones): boolean {
    const saldo = Math.max(plan.precioTotal - plan.pagado, 0);
    const yaAtendida = plan.sesiones.some(s => s.estado === 'Atendida');
    return !(saldo > 0 && yaAtendida);
  }

  resumenPendiente(plan: PlanSesiones): string {
    const saldo = Math.max(plan.precioTotal - plan.pagado, 0);
    if (!saldo) {
      return 'Plan liquidado: ya puedes seguir programando sesiones sin bloqueo de pago.';
    }
    if (plan.sesiones.some(s => s.estado === 'Atendida')) {
      return `Antes de programar la siguiente sesión debe cancelarse el saldo pendiente de S/ ${saldo}.`;
    }
    return `La primera sesión puede atenderse con adelanto. Saldo pendiente actual: S/ ${saldo}.`;
  }

  private sincronizarSesionesProgramadas(plan: PlanSesiones): void {
    plan.sesiones
      .filter(sesion => !!sesion.fecha && !!sesion.hora)
      .forEach(sesion => this.sincronizarCitaDeSesion(plan, sesion.numero));
  }

  private sincronizarCitaDeSesion(plan: PlanSesiones, numeroSesion: number): void {
    const sesion = plan.sesiones.find(item => item.numero === numeroSesion);
    if (!sesion?.fecha || !sesion.hora) { return; }

    const tratamiento = tratamientoPorId(sesion.tratamientoId) ?? TRATAMIENTOS[0];
    const duracion = tratamiento.duracionMin + tratamiento.limpiezaMin;
    const horaFin = this.sumarMinutos(sesion.hora, duracion);
    const saldoPendiente = Math.max(plan.precioTotal - plan.pagado, 0);
    const esPrimeraSesion = numeroSesion === 1;
    const montoPagado = esPrimeraSesion ? plan.pagado : 0;
    const cita: Omit<Cita, 'id' | 'codigo' | 'registradaEl'> & { planId: number; numeroSesionPlan: number } = {
      fecha: sesion.fecha,
      horaInicio: sesion.hora,
      horaFin,
      pacienteId: plan.pacienteId,
      tratamientoId: sesion.tratamientoId,
      tratamientosIncluidos: [sesion.tratamientoId],
      localId: plan.localId || 1,
      estado: sesion.estado === 'Atendida' ? 'Atendida' : 'Programada',
      estadoPago: saldoPendiente === 0 ? 'Pagado' : (montoPagado > 0 ? 'Pago en local' : 'Pendiente'),
      metodoPago: plan.pagosDetalle?.at(-1)?.metodo,
      montoTotal: tratamiento.precio,
      montoPagado,
      pagosDetalle: esPrimeraSesion ? plan.pagosDetalle : [],
      registradaPor: sesion.registradoPor || 'Recepción',
      confirmadaPor: montoPagado > 0 ? (sesion.registradoPor || 'Recepción') : undefined,
      codigoOperacion: plan.pagosDetalle?.at(-1)?.codigoOperacion,
      pagadaEl: plan.fechaLiquidacion,
      planId: plan.id,
      numeroSesionPlan: sesion.numero,
      origen: 'Recepción',
      zonaTratamiento: sesion.zona,
      notas: sesion.observaciones
    };
    this.agenda.upsertCitaDePlan(cita);
  }

  private sumarMinutos(hora: string, minutos: number): string {
    const [h, m] = hora.split(':').map(Number);
    const total = h * 60 + m + minutos;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
}

