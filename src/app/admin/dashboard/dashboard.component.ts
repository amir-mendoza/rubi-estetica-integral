import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CITAS, ESPECIALISTAS, LOCALES, PAGOS, PEDIDOS, PRODUCTOS, TRATAMIENTOS,
  aISO, formatoFechaLarga, HOY_ISO, nombreEspecialista, nombrePaciente, soles, tratamientoPorId
} from '../../data/datos';
import { Cita } from '../../data/modelos';

interface Fila { etiqueta: string; monto: number; detalle: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  soles = soles;
  hoyTexto = formatoFechaLarga(HOY_ISO);

  private citasHoy = CITAS.filter(c => c.fecha === HOY_ISO);
  private citasSemana = CITAS.filter(c => this.enUltimos(c.fecha, 7));
  private citasMes = CITAS.filter(c => c.fecha.slice(0, 7) === HOY_ISO.slice(0, 7));

  // ---- Caja real del día: solo dinero efectivamente cobrado.
  private pagosPagadosHoy = PAGOS.filter(p => p.fecha === HOY_ISO && p.estado === 'Pagado');
  cobradoHoy = this.suma(this.pagosPagadosHoy, p => p.monto);
  cobradoCitasHoy = this.suma(this.pagosPagadosHoy.filter(p => p.origen === 'Cita'), p => p.monto);
  cobradoProductosHoy = this.suma(this.pagosPagadosHoy.filter(p => p.origen === 'Producto'), p => p.monto);
  pendienteHoy = this.suma(
    this.citasHoy.filter(c => c.estado !== 'Cancelada' && c.estado !== 'No asistió'),
    c => Math.max(c.montoTotal - c.montoPagado, 0)
  );
  canceladoHoy = this.suma(this.citasHoy.filter(c => c.estado === 'Cancelada' || c.estado === 'No asistió'), c => c.montoPagado);

  pagosOnlineHoy = this.suma(this.pagosPagadosHoy.filter(p => p.canal === 'Online'), p => p.monto);
  pagosLocalHoy = this.suma(this.pagosPagadosHoy.filter(p => p.canal === 'Recepción' || p.canal === 'WhatsApp'), p => p.monto);
  reembolsosHoy = Math.abs(this.suma(PAGOS.filter(p => p.fecha === HOY_ISO && p.estado === 'Reembolsado'), p => p.monto));

  ingresoSemana = this.suma(PAGOS.filter(p => this.enUltimos(p.fecha, 7) && p.estado === 'Pagado'), p => p.monto);
  ingresoMes = this.suma(PAGOS.filter(p => p.fecha.slice(0, 7) === HOY_ISO.slice(0, 7) && p.estado === 'Pagado'), p => p.monto);

  // ---- Conteos de citas de hoy
  atendidas = this.citasHoy.filter(c => c.estado === 'Atendida').length;
  enProceso = this.citasHoy.filter(c => c.estado === 'En proceso').length;
  programadas = this.citasHoy.filter(c => c.estado === 'Programada').length;
  canceladas = this.citasHoy.filter(c => c.estado === 'Cancelada' || c.estado === 'No asistió').length;

  // ---- Desgloses del mes
  porLocal: Fila[] = LOCALES.map(l => ({
    etiqueta: l.nombre,
    monto: this.suma(PAGOS.filter(p => p.localId === l.id && p.fecha.slice(0, 7) === HOY_ISO.slice(0, 7) && p.estado === 'Pagado'), p => p.monto),
    detalle: `${PAGOS.filter(p => p.localId === l.id && p.fecha.slice(0, 7) === HOY_ISO.slice(0, 7) && p.estado === 'Pagado').length} cobros`
  })).sort((a, b) => b.monto - a.monto);

  porTratamiento: Fila[] = TRATAMIENTOS.map(t => ({
    etiqueta: t.nombre,
    monto: this.suma(this.citasMes.filter(c => c.tratamientoId === t.id), c => c.montoPagado),
    detalle: `${this.citasMes.filter(c => c.tratamientoId === t.id).length} sesiones`
  })).filter(f => f.monto > 0).sort((a, b) => b.monto - a.monto).slice(0, 6);

  porEspecialista: Fila[] = ESPECIALISTAS.map(e => ({
    etiqueta: `${e.nombre} ${e.apellido}`,
    monto: this.suma(this.citasMes.filter(c => c.especialistaId === e.id), c => c.montoPagado),
    detalle: `${this.citasMes.filter(c => c.especialistaId === e.id).length} atenciones`
  })).filter(f => f.monto > 0).sort((a, b) => b.monto - a.monto);

  maxLocal = Math.max(...this.porLocal.map(f => f.monto), 1);
  maxTratamiento = Math.max(...this.porTratamiento.map(f => f.monto), 1);
  maxEspecialista = Math.max(...this.porEspecialista.map(f => f.monto), 1);

  agendaHoy = [...this.citasHoy].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  pedidosHoy = PEDIDOS.filter(p => p.fecha === HOY_ISO);
  pagosRecientes = [...PAGOS].sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`)).slice(0, 6);
  stockBajo = PRODUCTOS.filter(p => p.stock <= 6).slice(0, 5);

  // ---- Serie de los últimos 7 días para el gráfico
  serie = this.ultimos(7).map(iso => {
    const monto = this.suma(PAGOS.filter(p => p.fecha === iso && p.estado === 'Pagado'), p => p.monto);
    const [, , d] = iso.split('-');
    return { iso, dia: d, monto };
  });
  maxSerie = Math.max(...this.serie.map(s => s.monto), 1);

  nombrePaciente = nombrePaciente;
  nombreEspecialista = nombreEspecialista;
  tratamiento = (id: number) => tratamientoPorId(id)?.nombre ?? '—';

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
