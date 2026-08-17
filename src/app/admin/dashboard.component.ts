import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CITAS, ESPECIALISTAS, LOCALES, PAGOS, PRODUCTOS, TRATAMIENTOS,
  aISO, formatoFechaLarga, HOY_ISO, nombreEspecialista, nombrePaciente, soles, tratamientoPorId
} from '../data/datos';
import { Cita } from '../data/modelos';

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

  // ---- Dinero del día
  vendidoHoy = this.suma(this.citasHoy.filter(c => c.estado !== 'Cancelada'), c => c.montoTotal);
  pagadoHoy = this.suma(this.citasHoy.filter(c => c.estado !== 'Cancelada'), c => c.montoPagado);
  pendienteHoy = this.vendidoHoy - this.pagadoHoy;
  canceladoHoy = this.suma(this.citasHoy.filter(c => c.estado === 'Cancelada'), c => c.montoTotal);
  gananciaHoy = Math.round(this.pagadoHoy * 0.62);

  pagosOnlineHoy = this.suma(PAGOS.filter(p => p.fecha === HOY_ISO && p.canal === 'Online' && p.estado === 'Pagado'), p => p.monto);
  pagosLocalHoy = this.suma(PAGOS.filter(p => p.fecha === HOY_ISO && p.canal === 'En local' && p.estado === 'Pagado'), p => p.monto);
  reembolsosHoy = Math.abs(this.suma(PAGOS.filter(p => p.fecha === HOY_ISO && p.estado === 'Reembolsado'), p => p.monto));

  ingresoSemana = this.suma(this.citasSemana, c => c.montoPagado);
  ingresoMes = this.suma(this.citasMes, c => c.montoPagado);

  // ---- Conteos de citas de hoy
  atendidas = this.citasHoy.filter(c => c.estado === 'Atendida').length;
  confirmadas = this.citasHoy.filter(c => c.estado === 'Confirmada' || c.estado === 'Pagada').length;
  pendientes = this.citasHoy.filter(c => c.estado === 'Pendiente').length;
  canceladas = this.citasHoy.filter(c => c.estado === 'Cancelada' || c.estado === 'No asistió').length;

  // ---- Desgloses del mes
  porLocal: Fila[] = LOCALES.map(l => ({
    etiqueta: l.nombre,
    monto: this.suma(this.citasMes.filter(c => c.localId === l.id), c => c.montoPagado),
    detalle: `${this.citasMes.filter(c => c.localId === l.id).length} citas`
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
  pagosRecientes = PAGOS.slice(0, 6);
  stockBajo = PRODUCTOS.filter(p => p.stock <= 6).slice(0, 5);

  // ---- Serie de los últimos 7 días para el gráfico
  serie = this.ultimos(7).map(iso => {
    const monto = this.suma(CITAS.filter(c => c.fecha === iso), c => c.montoPagado);
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
      case 'Pagada':
      case 'Confirmada': return 'chip chip--info';
      case 'Pendiente': return 'chip chip--alerta';
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
