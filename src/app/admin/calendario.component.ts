import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CITAS, DIAS_SEMANA, ESPECIALISTAS, HOY_ISO, LOCALES, MESES, aISO,
  formatoFechaLarga, habitacionPorId, localPorId, nombreEspecialista,
  pacientePorId, soles, tratamientoPorId
} from '../data/datos';
import { Cita } from '../data/modelos';

interface Celda {
  iso: string;
  dia: number;
  delMes: boolean;
  hoy: boolean;
  citas: number;
  monto: number;
  pendiente: boolean;
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.scss'
})
export class CalendarioComponent {
  soles = soles;
  meses = MESES;
  diasSemana = DIAS_SEMANA;
  locales = LOCALES;
  especialistas = ESPECIALISTAS;

  private hoy = new Date();
  mes = signal(this.hoy.getMonth());
  anio = signal(this.hoy.getFullYear());
  diaSeleccionado = signal(HOY_ISO);
  citaAbierta = signal<Cita | null>(null);

  filtroLocal = signal('Todos');
  filtroEspecialista = signal('Todas');
  filtroEstado = signal('Todos');
  filtroPago = signal('Todos');
  busqueda = signal('');

  estados = ['Todos', 'Pendiente', 'Confirmada', 'Pagada', 'Atendida', 'Cancelada', 'No asistió'];
  estadosPago = ['Todos', 'Pagado', 'Pago en local', 'Pendiente', 'Reembolsado'];

  titulo = computed(() => `${this.meses[this.mes()]} ${this.anio()}`);

  celdas = computed<Celda[]>(() => {
    const primero = new Date(this.anio(), this.mes(), 1);
    const desplazamiento = (primero.getDay() + 6) % 7; // lunes primero
    const inicio = new Date(primero);
    inicio.setDate(inicio.getDate() - desplazamiento);

    const salida: Celda[] = [];
    for (let i = 0; i < 42; i++) {
      const f = new Date(inicio);
      f.setDate(f.getDate() + i);
      const iso = aISO(f);
      const citas = this.citasDe(iso);
      salida.push({
        iso,
        dia: f.getDate(),
        delMes: f.getMonth() === this.mes(),
        hoy: iso === HOY_ISO,
        citas: citas.length,
        monto: citas.reduce((t, c) => t + c.montoTotal, 0),
        pendiente: citas.some(c => c.estadoPago !== 'Pagado' && c.estado !== 'Cancelada')
      });
    }
    return salida;
  });

  citasDelDia = computed<Cita[]>(() =>
    this.citasDe(this.diaSeleccionado()).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  );

  totalDia = computed(() => this.citasDelDia().filter(c => c.estado !== 'Cancelada').reduce((t, c) => t + c.montoTotal, 0));
  pagadoDia = computed(() => this.citasDelDia().filter(c => c.estado !== 'Cancelada').reduce((t, c) => t + c.montoPagado, 0));
  pendienteDia = computed(() => this.totalDia() - this.pagadoDia());
  canceladoDia = computed(() => this.citasDelDia().filter(c => c.estado === 'Cancelada').reduce((t, c) => t + c.montoTotal, 0));
  fechaLarga = computed(() => formatoFechaLarga(this.diaSeleccionado()));

  private citasDe(iso: string): Cita[] {
    const texto = this.busqueda().trim().toLowerCase();
    return CITAS.filter(c => {
      if (c.fecha !== iso) { return false; }
      if (this.filtroLocal() !== 'Todos' && localPorId(c.localId)?.nombre !== this.filtroLocal()) { return false; }
      if (this.filtroEspecialista() !== 'Todas' && nombreEspecialista(c.especialistaId) !== this.filtroEspecialista()) { return false; }
      if (this.filtroEstado() !== 'Todos' && c.estado !== this.filtroEstado()) { return false; }
      if (this.filtroPago() !== 'Todos' && c.estadoPago !== this.filtroPago()) { return false; }
      if (texto) {
        const p = pacientePorId(c.pacienteId);
        const blob = `${p?.nombre} ${p?.apellido} ${p?.dni} ${p?.celular} ${c.codigo}`.toLowerCase();
        if (!blob.includes(texto)) { return false; }
      }
      return true;
    });
  }

  mesAnterior(): void {
    if (this.mes() === 0) { this.mes.set(11); this.anio.set(this.anio() - 1); }
    else { this.mes.set(this.mes() - 1); }
  }

  mesSiguiente(): void {
    if (this.mes() === 11) { this.mes.set(0); this.anio.set(this.anio() + 1); }
    else { this.mes.set(this.mes() + 1); }
  }

  irHoy(): void {
    this.mes.set(this.hoy.getMonth());
    this.anio.set(this.hoy.getFullYear());
    this.diaSeleccionado.set(HOY_ISO);
  }

  paciente = pacientePorId;
  tratamiento = (id: number) => tratamientoPorId(id);
  especialista = nombreEspecialista;
  local = (id: number) => localPorId(id)?.nombre ?? '—';
  cabina = (id: number) => habitacionPorId(id)?.nombre ?? '—';

  claseEstado(estado: string): string {
    switch (estado) {
      case 'Atendida': return 'chip chip--ok';
      case 'Pagada':
      case 'Confirmada': return 'chip chip--info';
      case 'Pendiente': case 'Reprogramada': return 'chip chip--alerta';
      default: return 'chip chip--error';
    }
  }

  claseEstadoPago(estado: string): string {
    if (estado === 'Pagado') { return 'chip chip--ok chip--punto'; }
    if (estado === 'Reembolsado' || estado === 'Fallido') { return 'chip chip--error chip--punto'; }
    return 'chip chip--alerta chip--punto';
  }
}
