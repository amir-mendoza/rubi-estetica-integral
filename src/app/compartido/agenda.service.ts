import { Injectable, signal } from '@angular/core';
import { CITAS, HOY_ISO } from '../data/datos';
import { Cita, EstadoCita, MetodoPago } from '../data/modelos';

/**
 * Estado mock de la agenda para el panel administrativo: recepcion cambia el
 * avance de cada paciente y registra los cobros en efectivo. Los cambios viven
 * en memoria mientras dure la sesion del navegador.
 */
@Injectable({ providedIn: 'root' })
export class AgendaService {
  private lista = signal<Cita[]>(CITAS.map(c => ({ ...c })));

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
    const nueva: Cita = {
      ...cita,
      id,
      codigo: `CT-${1000 + id}`,
      registradaEl: `${HOY_ISO} ${new Date().toTimeString().slice(0, 5)}`
    };
    this.lista.update(lista => [nueva, ...lista]);
    return nueva;
  }

  /** Cobro presencial: recepcion confirma el monto recibido con el metodo elegido. */
  registrarPago(id: number, usuario: string, metodo: MetodoPago, monto?: number, codigo?: string): void {
    const hora = new Date().toTimeString().slice(0, 5);
    this.lista.update(lista => lista.map(c => c.id === id ? {
      ...c,
      estadoPago: Math.min(c.montoPagado + (monto ?? (c.montoTotal - c.montoPagado)), c.montoTotal) >= c.montoTotal ? 'Pagado' : 'Pago en local',
      metodoPago: metodo,
      montoPagado: Math.min(c.montoPagado + (monto ?? (c.montoTotal - c.montoPagado)), c.montoTotal),
      confirmadaPor: usuario,
      pagadaEl: `${HOY_ISO} ${hora}`,
      codigoOperacion: codigo || c.codigoOperacion || `${metodo.toUpperCase().replace(/\s/g, '-')}-${1000 + c.id}`
    } : c));
  }

  registrarPagoEfectivo(id: number, usuario: string): void {
    this.registrarPago(id, usuario, 'Efectivo');
  }
}
