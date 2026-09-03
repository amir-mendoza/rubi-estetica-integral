import { Injectable, signal } from '@angular/core';
import { CITAS, HOY_ISO, PLANES, TRATAMIENTOS, tratamientoPorId } from '../data/datos';
import { Cita, EstadoCita, EstadoSesion, MetodoPago, PlanSesiones, SesionPlan } from '../data/modelos';

function clonarCita(cita: Cita): Cita {
  return {
    ...cita,
    tratamientosIncluidos: cita.tratamientosIncluidos ? [...cita.tratamientosIncluidos] : undefined,
    pagosDetalle: cita.pagosDetalle ? cita.pagosDetalle.map(pago => ({ ...pago })) : undefined
  };
}

function sumarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function estadoCitaDeSesion(estado: EstadoSesion): EstadoCita {
  if (estado === 'Atendida') { return 'Atendida'; }
  if (estado === 'En proceso') { return 'En proceso'; }
  if (estado === 'Reprogramada') { return 'Reprogramada'; }
  if (estado === 'No asistió') { return 'No asistió'; }
  return 'Programada';
}

function citaDesdeSesionPlan(plan: PlanSesiones, sesion: SesionPlan, id: number): Cita {
  const tratamiento = tratamientoPorId(sesion.tratamientoId) ?? TRATAMIENTOS[0];
  const pago = plan.pagosDetalle?.at(-1);
  const saldo = Math.max(plan.precioTotal - plan.pagado, 0);
  return {
    id,
    codigo: `CT-${1000 + id}`,
    fecha: sesion.fecha!,
    horaInicio: sesion.hora!,
    horaFin: sumarMinutos(sesion.hora!, tratamiento.duracionMin + tratamiento.limpiezaMin),
    pacienteId: plan.pacienteId,
    tratamientoId: sesion.tratamientoId,
    tratamientosIncluidos: [sesion.tratamientoId],
    localId: plan.localId || 1,
    estado: estadoCitaDeSesion(sesion.estado),
    estadoPago: saldo === 0 ? 'Pagado' : (plan.pagado > 0 ? 'Pago en local' : 'Pendiente'),
    metodoPago: pago?.metodo,
    montoTotal: plan.precioTotal,
    montoPagado: plan.pagado,
    pagosDetalle: plan.pagosDetalle ? plan.pagosDetalle.map(detalle => ({ ...detalle })) : undefined,
    registradaPor: sesion.registradoPor || 'Recepción',
    registradaEl: `${HOY_ISO} 08:00`,
    confirmadaPor: plan.pagado > 0 ? (pago?.registradoPor || sesion.registradoPor || 'Recepción') : undefined,
    codigoOperacion: pago?.codigoOperacion,
    pagadaEl: plan.fechaLiquidacion,
    planId: plan.id,
    numeroSesionPlan: sesion.numero,
    origen: 'Recepción',
    zonaTratamiento: sesion.zona,
    notas: sesion.observaciones
  };
}

function citasConPlanesSincronizados(): Cita[] {
  const citas = CITAS.map(clonarCita);
  let siguienteId = citas.reduce((max, cita) => Math.max(max, cita.id), 0) + 1;

  for (const plan of PLANES) {
    for (const sesion of plan.sesiones.filter(item => item.fecha && item.hora)) {
      const existente = citas.find(cita =>
        (cita.planId === plan.id && cita.numeroSesionPlan === sesion.numero) ||
        (!cita.planId &&
          cita.pacienteId === plan.pacienteId &&
          cita.fecha === sesion.fecha &&
          cita.horaInicio === sesion.hora &&
          cita.tratamientoId === sesion.tratamientoId)
      );

      if (existente) {
        existente.planId = plan.id;
        existente.numeroSesionPlan = sesion.numero;
        existente.notas = existente.notas || sesion.observaciones || `Sesión ${sesion.numero} del plan ${plan.codigo}.`;
      } else {
        citas.push(citaDesdeSesionPlan(plan, sesion, siguienteId++));
      }
    }
  }

  return citas.sort((a, b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`) || a.id - b.id);
}

/**
 * Estado mock de la agenda para el panel administrativo: recepcion cambia el
 * avance de cada paciente y registra los cobros en efectivo. Los cambios viven
 * en memoria mientras dure la sesion del navegador.
 */
@Injectable({ providedIn: 'root' })
export class AgendaService {
  private lista = signal<Cita[]>(citasConPlanesSincronizados());

  readonly citas = this.lista.asReadonly();

  /** Citas de un dia ordenadas por hora de llegada y luego por orden de registro. */
  delDia(fechaISO: string): Cita[] {
    return this.lista()
      .filter(c => c.fecha === fechaISO)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio) || a.id - b.id);
  }

  cambiarEstado(id: number, estado: EstadoCita, usuario: string): void {
    this.lista.update(lista => lista.map(c => {
      if (c.id !== id) { return c; }
      let notas = c.notas;
      if (estado === 'En espera') {
        notas = `Llegada registrada por ${usuario}. Pendiente de asignación de cabina.`;
      }
      if (estado === 'En proceso') {
        notas = `Ingreso a atención registrado por ${usuario}.`;
      }
      if (estado === 'Llegó tarde') {
        notas = `Paciente llegó tarde. Mantiene su reserva, pero queda en espera hasta que recepción pueda asignar una cabina disponible.`;
      }
      return { ...c, estado, notas };
    }));
  }

  crearCita(cita: Omit<Cita, 'id' | 'codigo' | 'registradaEl'>): Cita {
    const id = this.lista().reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const ahora = new Date();
    const hora = ahora.toTimeString().slice(0, 5);
    const nueva: Cita = {
      ...cita,
      id,
      codigo: `CT-${1000 + id}`,
      registradaEl: `${HOY_ISO} ${hora}`,
      tratamientosIncluidos: cita.tratamientosIncluidos ? [...cita.tratamientosIncluidos] : undefined,
      pagosDetalle: cita.montoPagado > 0 && cita.metodoPago
        ? [{
            metodo: cita.metodoPago,
            monto: cita.montoPagado,
            fecha: HOY_ISO,
            hora,
            canal: cita.origen === 'Web' ? 'Online' : cita.origen,
            registradoPor: cita.confirmadaPor || cita.registradaPor,
            codigoOperacion: cita.codigoOperacion
          }]
        : cita.pagosDetalle
    };
    this.lista.update(lista => [nueva, ...lista]);
    return nueva;
  }

  upsertCitaDePlan(cita: Omit<Cita, 'id' | 'codigo' | 'registradaEl'> & { planId: number; numeroSesionPlan: number }): Cita {
    const existente = this.lista().find(item =>
      item.planId === cita.planId &&
      item.numeroSesionPlan === cita.numeroSesionPlan
    );

    if (!existente) {
      return this.crearCita(cita);
    }

    const actualizada: Cita = {
      ...existente,
      ...cita,
      id: existente.id,
      codigo: existente.codigo,
      registradaEl: existente.registradaEl,
      pagosDetalle: cita.pagosDetalle ?? existente.pagosDetalle
    };

    this.lista.update(lista => lista.map(item => item.id === existente.id ? actualizada : item));
    return actualizada;
  }

  actualizarFechaHora(id: number, fecha: string, horaInicio: string, horaFin: string, usuario: string): void {
    this.lista.update(lista => lista.map(c => c.id === id ? {
      ...c,
      fecha,
      horaInicio,
      horaFin,
      estado: c.estado === 'Cancelada' ? c.estado : 'Reprogramada',
      notas: `Fecha y hora actualizadas por ${usuario}. Llegada: ${fecha} ${horaInicio}.`
    } : c));
  }

  vincularPlan(id: number, planId: number, numeroSesionPlan = 1, usuario = 'Recepción'): void {
    this.lista.update(lista => lista.map(c => c.id === id ? {
      ...c,
      planId,
      numeroSesionPlan,
      notas: c.notas || `Cita convertida a multisesiones por ${usuario}. Recepción podrá agregar y reprogramar sesiones desde el seguimiento.`
    } : c));
  }

  desvincularPlan(id: number, usuario = 'Recepción'): void {
    this.lista.update(lista => lista.map(c => c.id === id ? {
      ...c,
      planId: undefined,
      numeroSesionPlan: undefined,
      notas: `Multisesiones desactivadas por ${usuario}. La cita queda como atención simple.`
    } : c));
  }

  /** Cobro presencial: recepcion confirma el monto recibido con el metodo elegido. */
  registrarPago(id: number, usuario: string, metodo: MetodoPago, monto?: number, codigo?: string): void {
    const hora = new Date().toTimeString().slice(0, 5);
    this.lista.update(lista => lista.map(c => c.id === id ? {
      ...c,
      estadoPago: Math.min(c.montoPagado + (monto ?? (c.montoTotal - c.montoPagado)), c.montoTotal) >= c.montoTotal ? 'Pagado' : 'Pago en local',
      metodoPago: metodo,
      montoPagado: Math.min(c.montoPagado + (monto ?? (c.montoTotal - c.montoPagado)), c.montoTotal),
      pagosDetalle: [
        ...(c.pagosDetalle ?? []),
        {
          metodo,
          monto: monto ?? (c.montoTotal - c.montoPagado),
          fecha: HOY_ISO,
          hora,
          canal: 'Recepción',
          registradoPor: usuario,
          codigoOperacion: codigo || c.codigoOperacion || `${metodo.toUpperCase().replace(/\s/g, '-')}-${1000 + c.id}`
        }
      ],
      confirmadaPor: usuario,
      pagadaEl: `${HOY_ISO} ${hora}`,
      codigoOperacion: codigo || c.codigoOperacion || `${metodo.toUpperCase().replace(/\s/g, '-')}-${1000 + c.id}`
    } : c));
  }

  registrarPagoEfectivo(id: number, usuario: string): void {
    this.registrarPago(id, usuario, 'Efectivo');
  }
}
