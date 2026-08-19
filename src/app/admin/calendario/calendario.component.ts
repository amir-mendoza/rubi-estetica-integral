import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DIAS_SEMANA, HOY_ISO, LOCALES, MESES, TRATAMIENTOS, aISO, cupoDeSede,
  formatoFechaLarga, localPorId, nombreCabina, nombreEspecialista,
  pacientePorId, soles, tratamientoPorId
} from '../../data/datos';
import { Cita, ESTADOS_CITA, EstadoCita, MetodoPago, Paciente } from '../../data/modelos';
import { AgendaService } from '../../compartido/agenda.service';
import { SesionService } from '../../compartido/sesion.service';

interface Celda {
  iso: string;
  dia: number;
  delMes: boolean;
  hoy: boolean;
  citas: number;
  monto: number;
  pendiente: boolean;
}

/** Cita con su posicion en la lista de atencion del dia. */
interface EnLista {
  orden: number;
  cita: Cita;
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.scss'
})
export class CalendarioComponent {
  private agenda = inject(AgendaService);
  private sesion = inject(SesionService);

  soles = soles;
  Number = Number;
  meses = MESES;
  diasSemana = DIAS_SEMANA;
  locales = LOCALES;
  tratamientosCatalogo = TRATAMIENTOS.filter(t => t.activo);
  estadosCita = ESTADOS_CITA;
  metodosPago: MetodoPago[] = ['Efectivo', 'Yape', 'Plin', 'Tarjeta POS', 'Transferencia'];

  private hoy = new Date();
  mes = signal(this.hoy.getMonth());
  anio = signal(this.hoy.getFullYear());
  diaSeleccionado = signal(HOY_ISO);
  citaAbierta = signal<number | null>(null);

  filtroLocal = signal('Todos');
  filtroEstado = signal('Todos');
  filtroPago = signal('Todos');
  busqueda = signal('');
  mostrarManual = signal(false);
  pacientesManuales = signal<Paciente[]>([]);
  pagoMetodo = signal<MetodoPago>('Efectivo');
  pagoMonto = signal<Record<number, number>>({});
  pagoCodigo = signal<Record<number, string>>({});

  manualDni = '';
  manualCelular = '';
  manualNombre = '';
  manualLocalId = LOCALES[0]?.id ?? 1;
  manualFecha = HOY_ISO;
  manualHora = '09:00';
  manualTratamientos = signal<number[]>([TRATAMIENTOS[0]?.id ?? 1]);
  manualTotal = TRATAMIENTOS[0]?.precio ?? 0;
  manualPagado = 0;
  manualMetodo: MetodoPago = 'Efectivo';

  estados = ['Todos', ...ESTADOS_CITA];
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

  /** Lista de atencion del dia: primero, segundo, tercero... por hora de llegada. */
  listaDelDia = computed<EnLista[]>(() =>
    this.citasDe(this.diaSeleccionado()).map((cita, i) => ({ orden: i + 1, cita }))
  );

  citasDelDia = computed<Cita[]>(() => this.listaDelDia().map(f => f.cita));

  /** Ocupacion por bloque horario, para ver si una hora esta al limite del cupo. */
  bloquesDelDia = computed(() => {
    const mapa = new Map<string, { hora: string; total: number; cupo: number }>();
    for (const c of this.citasDelDia()) {
      if (c.estado === 'Cancelada' || c.estado === 'No asistió') { continue; }
      const hora = `${c.horaInicio.slice(0, 2)}:00`;
      const clave = `${c.localId}-${hora}`;
      const actual = mapa.get(clave);
      if (actual) { actual.total += 1; }
      else { mapa.set(clave, { hora, total: 1, cupo: cupoDeSede(c.localId) }); }
    }
    return Array.from(mapa.values()).sort((a, b) => a.hora.localeCompare(b.hora));
  });

  totalDia = computed(() => this.citasDelDia().filter(c => c.estado !== 'Cancelada').reduce((t, c) => t + c.montoTotal, 0));
  pagadoDia = computed(() => this.citasDelDia().filter(c => c.estado !== 'Cancelada').reduce((t, c) => t + c.montoPagado, 0));
  pendienteDia = computed(() => this.totalDia() - this.pagadoDia());
  canceladoDia = computed(() => this.citasDelDia().filter(c => c.estado === 'Cancelada').reduce((t, c) => t + c.montoTotal, 0));
  fechaLarga = computed(() => formatoFechaLarga(this.diaSeleccionado()));

  private citasDe(iso: string): Cita[] {
    const texto = this.busqueda().trim().toLowerCase();
    return this.agenda.delDia(iso).filter(c => {
      if (this.filtroLocal() !== 'Todos' && localPorId(c.localId)?.nombre !== this.filtroLocal()) { return false; }
      if (this.filtroEstado() !== 'Todos' && c.estado !== this.filtroEstado()) { return false; }
      if (this.filtroPago() !== 'Todos' && c.estadoPago !== this.filtroPago()) { return false; }
      if (texto) {
        const p = this.paciente(c.pacienteId);
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

  cambiarEstado(c: Cita, estado: EstadoCita): void {
    this.agenda.cambiarEstado(c.id, estado, this.responsable());
  }

  registrarPagoEfectivo(c: Cita): void {
    this.agenda.registrarPagoEfectivo(c.id, this.responsable());
  }

  registrarPago(c: Cita): void {
    const monto = Number(this.pagoMonto()[c.id] ?? (c.montoTotal - c.montoPagado));
    this.agenda.registrarPago(c.id, this.responsable(), this.pagoMetodo(), monto, this.pagoCodigo()[c.id]);
    this.pagoMonto.update(m => ({ ...m, [c.id]: 0 }));
    this.pagoCodigo.update(m => ({ ...m, [c.id]: '' }));
  }

  setPagoMonto(id: number, monto: number): void {
    this.pagoMonto.update(v => ({ ...v, [id]: monto }));
  }

  setPagoCodigo(id: number, codigo: string): void {
    this.pagoCodigo.update(v => ({ ...v, [id]: codigo }));
  }

  agregarTratamientoManual(): void {
    this.manualTratamientos.update(ids => [...ids, this.tratamientosCatalogo[0]?.id ?? 1]);
    this.recalcularManual();
  }

  cambiarTratamientoManual(indice: number, id: number): void {
    this.manualTratamientos.update(ids => ids.map((item, i) => i === indice ? id : item));
    this.recalcularManual();
  }

  quitarTratamientoManual(indice: number): void {
    this.manualTratamientos.update(ids => ids.length === 1 ? ids : ids.filter((_, i) => i !== indice));
    this.recalcularManual();
  }

  recalcularManual(): void {
    this.manualTotal = this.manualTratamientos().reduce((total, id) => total + (tratamientoPorId(id)?.precio ?? 0), 0);
  }

  registrarCitaManual(): void {
    const [nombre, ...resto] = this.manualNombre.trim().split(/\s+/);
    const pacienteId = 9000 + this.pacientesManuales().length + 1;
    const paciente: Paciente = {
      id: pacienteId,
      nombre: nombre || 'Paciente',
      apellido: resto.join(' ') || '',
      dni: this.manualDni,
      celular: this.manualCelular,
      correo: '',
      fechaRegistro: HOY_ISO,
      observaciones: 'Registro creado desde recepción.',
      citasTotales: 1,
      ultimaVisita: this.manualFecha,
      totalGastado: Number(this.manualPagado)
    };
    this.pacientesManuales.update(lista => [paciente, ...lista]);
    const principal = this.manualTratamientos()[0];
    const duracion = Math.max(...this.manualTratamientos().map(id => tratamientoPorId(id)?.duracionMin ?? 60));
    const fin = this.sumarMinutos(this.manualHora, duracion);
    this.agenda.crearCita({
      fecha: this.manualFecha,
      horaInicio: this.manualHora,
      horaFin: fin,
      pacienteId,
      tratamientoId: principal,
      tratamientosIncluidos: [...this.manualTratamientos()],
      localId: Number(this.manualLocalId),
      estado: 'Programada',
      estadoPago: this.manualPagado >= this.manualTotal ? 'Pagado' : this.manualPagado > 0 ? 'Pago en local' : 'Pendiente',
      metodoPago: this.manualPagado > 0 ? this.manualMetodo : undefined,
      montoTotal: Number(this.manualTotal),
      montoPagado: Number(this.manualPagado),
      registradaPor: this.responsable(),
      confirmadaPor: this.manualPagado > 0 ? this.responsable() : undefined,
      codigoOperacion: this.manualPagado > 0 ? `${this.manualMetodo.toUpperCase().replace(/\s/g, '-')}-${Date.now().toString().slice(-5)}` : undefined,
      pagadaEl: this.manualPagado > 0 ? `${HOY_ISO} ${new Date().toTimeString().slice(0, 5)}` : undefined,
      origen: 'Recepción',
      notas: this.manualTratamientos().length > 1 ? 'Cita manual con varios tratamientos.' : undefined
    });
    this.diaSeleccionado.set(this.manualFecha);
    this.mostrarManual.set(false);
    this.manualDni = '';
    this.manualCelular = '';
    this.manualNombre = '';
    this.manualPagado = 0;
    this.manualTratamientos.set([TRATAMIENTOS[0]?.id ?? 1]);
    this.recalcularManual();
  }

  private responsable(): string {
    return this.sesion.nombreCompleto() || 'Recepción';
  }

  paciente = (id: number) => this.pacientesManuales().find(p => p.id === id) ?? pacientePorId(id);
  tratamiento = (id: number) => tratamientoPorId(id);
  tratamientosCita = (c: Cita) => (c.tratamientosIncluidos?.length ? c.tratamientosIncluidos : [c.tratamientoId])
    .map(id => tratamientoPorId(id)?.nombre ?? 'Tratamiento')
    .join(' + ');
  especialista = nombreEspecialista;
  local = (id: number) => localPorId(id)?.nombre ?? '—';
  cabina = nombreCabina;

  claseEstado(estado: EstadoCita): string {
    switch (estado) {
      case 'Atendida': return 'chip chip--ok';
      case 'En proceso': return 'chip chip--info';
      case 'En espera': return 'chip chip--info';
      case 'Programada': return 'chip chip--alerta';
      case 'Reprogramada': return 'chip chip--alerta';
      case 'Llegó tarde': return 'chip chip--alerta';
      default: return 'chip chip--error';
    }
  }

  claseEstadoPago(estado: string): string {
    if (estado === 'Pagado') { return 'chip chip--ok chip--punto'; }
    if (estado === 'Reembolsado' || estado === 'Fallido') { return 'chip chip--error chip--punto'; }
    return 'chip chip--alerta chip--punto';
  }

  private sumarMinutos(hora: string, minutos: number): string {
    const [h, m] = hora.split(':').map(Number);
    const total = h * 60 + m + minutos;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }
}
