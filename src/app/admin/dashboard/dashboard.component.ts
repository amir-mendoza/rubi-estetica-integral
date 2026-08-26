import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ESPECIALISTAS, LOCALES, PAGOS, PEDIDOS, PRODUCTOS, TRATAMIENTOS,
  aISO, formatoFechaLarga, HOY_ISO, nombreEspecialista, soles, tratamientoPorId
} from '../../data/datos';
import { Cita, DetallePago, MetodoPago } from '../../data/modelos';
import { AgendaService } from '../../compartido/agenda.service';
import { PacientesService } from '../../compartido/pacientes.service';
import { PlanesService } from '../../compartido/planes.service';

interface Fila { etiqueta: string; monto: number; detalle: string; }
interface MovimientoVista {
  id: string;
  hora: string;
  concepto: string;
  referencia: string;
  metodo: string;
  canal: string;
  monto: number;
  codigoOperacion: string;
}
interface SeguimientoVista {
  id: number;
  paciente: string;
  plan: string;
  saldo: number;
  pagado: number;
  total: number;
  proximaSesion: string;
  control: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private agenda = inject(AgendaService);
  private pacientes = inject(PacientesService);
  private planes = inject(PlanesService);

  soles = soles;
  hoyTexto = formatoFechaLarga(HOY_ISO);

  get citasHoy(): Cita[] {
    return this.agenda.citas().filter(c => c.fecha === HOY_ISO);
  }

  get citasSemana(): Cita[] {
    return this.agenda.citas().filter(c => this.enUltimos(c.fecha, 7));
  }

  get citasMes(): Cita[] {
    return this.agenda.citas().filter(c => c.fecha.slice(0, 7) === HOY_ISO.slice(0, 7));
  }

  get pagosCitas(): MovimientoVista[] {
    return this.agenda.citas().flatMap(cita =>
      (cita.pagosDetalle ?? []).map((pago, indice) => ({
        id: `${cita.id}-${indice}`,
        hora: pago.hora,
        concepto: `${this.tratamientosCita(cita)} · ${this.nombrePaciente(cita.pacienteId)}`,
        referencia: cita.codigo,
        metodo: pago.metodo,
        canal: pago.canal,
        monto: pago.monto,
        codigoOperacion: pago.codigoOperacion || '—'
      }))
    );
  }

  get pagosProductos(): MovimientoVista[] {
    return PAGOS
      .filter(p => p.origen === 'Producto')
      .map(p => ({
        id: `pedido-${p.id}`,
        hora: p.hora,
        concepto: p.concepto,
        referencia: p.referencia,
        metodo: p.metodo,
        canal: p.canal,
        monto: p.monto,
        codigoOperacion: p.codigoOperacion
      }));
  }

  get pagosPlanes(): MovimientoVista[] {
    return this.planes.planes().flatMap(plan =>
      (plan.pagosDetalle ?? [])
        .filter(pago => !pago.codigoOperacion || !this.codigoOperacionExisteEnCitas(pago.codigoOperacion))
        .map((pago, indice) => ({
          id: `plan-${plan.id}-${indice}`,
          hora: pago.hora,
          concepto: `${plan.nombre} · ${this.nombrePaciente(plan.pacienteId)}`,
          referencia: plan.codigo,
          metodo: pago.metodo,
          canal: pago.canal,
          monto: pago.monto,
          codigoOperacion: pago.codigoOperacion || '—'
        }))
    );
  }

  get pagosPagadosHoy(): MovimientoVista[] {
    return [...this.pagosCitas, ...this.pagosPlanes, ...this.pagosProductos]
      .filter(p => this.esMovimientoDeHoy(p) && p.monto > 0);
  }

  get cobradoHoy(): number {
    return this.suma(this.pagosPagadosHoy, p => p.monto);
  }

  get cobradoCitasHoy(): number {
    return this.suma([...this.pagosCitas, ...this.pagosPlanes].filter(p => this.esMovimientoDeHoy(p) && p.monto > 0), p => p.monto);
  }

  get cobradoProductosHoy(): number {
    return this.suma(this.pagosProductos.filter(p => this.esMovimientoDeHoy(p) && p.monto > 0), p => p.monto);
  }

  get pendienteHoy(): number {
    return this.suma(
      this.citasHoy.filter(c => c.estado !== 'Cancelada' && c.estado !== 'No asistió'),
      c => Math.max(c.montoTotal - c.montoPagado, 0)
    );
  }

  get canceladoHoy(): number {
    return this.suma(this.citasHoy.filter(c => c.estado === 'Cancelada' || c.estado === 'No asistió'), c => c.montoPagado);
  }

  get pagosOnlineHoy(): number {
    return this.suma(this.pagosPagadosHoy.filter(p => p.canal === 'Online'), p => p.monto);
  }

  get pagosLocalHoy(): number {
    return this.suma(this.pagosPagadosHoy.filter(p => p.canal === 'Recepción' || p.canal === 'WhatsApp'), p => p.monto);
  }

  get reembolsosHoy(): number {
    return Math.abs(this.suma(this.pagosCitas.filter(p => this.esMovimientoDeHoy(p) && p.monto < 0), p => p.monto));
  }

  get ingresoSemana(): number {
    return this.suma(
      [...this.pagosCitas, ...this.pagosPlanes, ...this.pagosProductos].filter(p => this.enUltimos(this.fechaMovimiento(p), 7) && p.monto > 0),
      p => p.monto
    );
  }

  get ingresoMes(): number {
    return this.suma(
      [...this.pagosCitas, ...this.pagosPlanes, ...this.pagosProductos].filter(p => this.fechaMovimiento(p).slice(0, 7) === HOY_ISO.slice(0, 7) && p.monto > 0),
      p => p.monto
    );
  }

  get atendidas(): number {
    return this.citasHoy.filter(c => c.estado === 'Atendida').length;
  }

  get enProceso(): number {
    return this.citasHoy.filter(c => c.estado === 'En proceso').length;
  }

  get programadas(): number {
    return this.citasHoy.filter(c => c.estado === 'Programada').length;
  }

  get canceladas(): number {
    return this.citasHoy.filter(c => c.estado === 'Cancelada' || c.estado === 'No asistió').length;
  }

  get porLocal(): Fila[] {
    return LOCALES.map(l => ({
      etiqueta: l.nombre,
      monto: this.suma(this.citasMes.filter(c => c.localId === l.id), c => c.montoPagado),
      detalle: `${this.citasMes.filter(c => c.localId === l.id).length} citas`
    })).sort((a, b) => b.monto - a.monto);
  }

  get porTratamiento(): Fila[] {
    return TRATAMIENTOS.map(t => ({
      etiqueta: t.nombre,
      monto: this.suma(this.citasMes.filter(c => (c.tratamientosIncluidos?.includes(t.id) || c.tratamientoId === t.id)), c => c.montoPagado),
      detalle: `${this.citasMes.filter(c => (c.tratamientosIncluidos?.includes(t.id) || c.tratamientoId === t.id)).length} registros`
    })).filter(f => f.monto > 0).sort((a, b) => b.monto - a.monto).slice(0, 6);
  }

  get porEspecialista(): Fila[] {
    return ESPECIALISTAS.map(e => ({
      etiqueta: `${e.nombre} ${e.apellido}`,
      monto: this.suma(this.citasMes.filter(c => c.especialistaId === e.id), c => c.montoPagado),
      detalle: `${this.citasMes.filter(c => c.especialistaId === e.id).length} atenciones`
    })).filter(f => f.monto > 0).sort((a, b) => b.monto - a.monto);
  }

  get maxLocal(): number {
    return Math.max(...this.porLocal.map(f => f.monto), 1);
  }

  get maxTratamiento(): number {
    return Math.max(...this.porTratamiento.map(f => f.monto), 1);
  }

  get maxEspecialista(): number {
    return Math.max(...this.porEspecialista.map(f => f.monto), 1);
  }

  get agendaHoy(): Cita[] {
    return [...this.citasHoy].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  }

  get pedidosHoy() {
    return PEDIDOS.filter(p => p.fecha === HOY_ISO);
  }

  get pagosRecientes(): MovimientoVista[] {
    return [...this.pagosCitas, ...this.pagosPlanes, ...this.pagosProductos]
      .sort((a, b) => `${this.fechaMovimiento(b)} ${b.hora}`.localeCompare(`${this.fechaMovimiento(a)} ${a.hora}`))
      .slice(0, 6);
  }

  get stockBajo() {
    return PRODUCTOS.filter(p => p.stock <= 6).slice(0, 5);
  }

  get seguimientosActivos(): SeguimientoVista[] {
    return this.planes.planes()
      .filter(plan => plan.estado !== 'Finalizado')
      .map(plan => {
        const siguiente = plan.sesiones.find(s => s.estado === 'Programada' || s.estado === 'Pendiente' || s.estado === 'Reprogramada');
        const proximaSesion = siguiente?.fecha
          ? `${siguiente.numero} · ${siguiente.fecha}${siguiente.hora ? ` ${siguiente.hora}` : ''}`
          : 'Recepción coordina siguiente fecha';
        const control = plan.precioTotal - plan.pagado > 0
          ? `Saldo pendiente ${soles(plan.precioTotal - plan.pagado)}`
          : 'Plan liquidado';
        return {
          id: plan.id,
          paciente: this.nombrePaciente(plan.pacienteId),
          plan: plan.nombre,
          saldo: Math.max(plan.precioTotal - plan.pagado, 0),
          pagado: plan.pagado,
          total: plan.precioTotal,
          proximaSesion,
          control
        };
      })
      .sort((a, b) => b.saldo - a.saldo)
      .slice(0, 6);
  }

  get serie() {
    return this.ultimos(7).map(iso => {
      const monto = this.suma(
        [...this.pagosCitas, ...this.pagosPlanes, ...this.pagosProductos].filter(p => this.fechaMovimiento(p) === iso && p.monto > 0),
        p => p.monto
      );
      const [, , d] = iso.split('-');
      return { iso, dia: d, monto };
    });
  }

  get maxSerie(): number {
    return Math.max(...this.serie.map(s => s.monto), 1);
  }

  nombrePaciente = (id: number) => {
    const paciente = this.pacientes.porId(id);
    return paciente ? `${paciente.nombre} ${paciente.apellido}` : '—';
  };
  nombreEspecialista = nombreEspecialista;
  tratamiento = (id: number) => tratamientoPorId(id)?.nombre ?? '—';
  tratamientosCita = (c: Cita) => (c.tratamientosIncluidos?.length ? c.tratamientosIncluidos : [c.tratamientoId])
    .map(id => tratamientoPorId(id)?.nombre ?? 'Tratamiento')
    .join(' + ');

  montoMetodo(c: Cita, metodo: MetodoPago): number {
    if (c.pagosDetalle?.length) {
      return c.pagosDetalle
        .filter(pago => pago.metodo === metodo)
        .reduce((total, pago) => total + pago.monto, 0);
    }
    return c.metodoPago === metodo ? c.montoPagado : 0;
  }

  claseEstado(c: Cita): string {
    switch (c.estado) {
      case 'Atendida': return 'chip chip--ok';
      case 'En proceso': return 'chip chip--info';
      case 'Programada': return 'chip chip--alerta';
      default: return 'chip chip--error';
    }
  }

  claseEstadoPago(c: Cita): string {
    if (c.estadoPago === 'Pagado') { return 'chip chip--ok chip--punto'; }
    if (c.estadoPago === 'Reembolsado' || c.estadoPago === 'Fallido') { return 'chip chip--error chip--punto'; }
    return 'chip chip--alerta chip--punto';
  }

  private fechaMovimiento(movimiento: MovimientoVista): string {
    const cita = this.pagosCitas.find(item => item.id === movimiento.id);
    if (cita) {
      return this.buscarFechaPagoCita(movimiento);
    }
    const pedido = PAGOS.find(item => `pedido-${item.id}` === movimiento.id);
    return pedido?.fecha ?? HOY_ISO;
  }

  private buscarFechaPagoCita(movimiento: MovimientoVista): string {
    const [citaId, indice] = movimiento.id.split('-').map(Number);
    const cita = this.agenda.citas().find(item => item.id === citaId);
    const pago = cita?.pagosDetalle?.[indice];
    return pago?.fecha ?? HOY_ISO;
  }

  private codigoOperacionExisteEnCitas(codigo: string): boolean {
    return this.agenda.citas().some(cita =>
      (cita.pagosDetalle ?? []).some(pago => pago.codigoOperacion === codigo)
    );
  }

  private esMovimientoDeHoy(movimiento: MovimientoVista): boolean {
    return this.fechaMovimiento(movimiento) === HOY_ISO;
  }

  private suma<T>(lista: T[], valor: (item: T) => number): number {
    return lista.reduce((t, i) => t + valor(i), 0);
  }

  private ultimos(dias: number): string[] {
    const salida: string[] = [];
    for (let i = dias - 1; i >= 0; i--) {
      const f = new Date();
      f.setDate(f.getDate() - i);
      salida.push(aISO(f));
    }
    return salida;
  }

  private enUltimos(iso: string, dias: number): boolean {
    return this.ultimos(dias).includes(iso);
  }
}
