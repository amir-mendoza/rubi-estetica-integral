import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DIAS_SEMANA, HOY_ISO, LOCALES, MESES, TRATAMIENTOS, aISO,
  formatoFechaLarga, localPorId, nombreCabina, nombreEspecialista,
  soles, tratamientoPorId
} from '../../data/datos';
import { Cita, ESTADOS_CITA, EstadoCita, MetodoPago } from '../../data/modelos';
import { AgendaService } from '../../compartido/agenda.service';
import { SesionService } from '../../compartido/sesion.service';
import { ConfiguracionPanelService } from '../../compartido/configuracion-panel.service';
import { PacientesService } from '../../compartido/pacientes.service';
import { PlanesService } from '../../compartido/planes.service';

interface Celda {
  iso: string;
  dia: number;
  delMes: boolean;
  hoy: boolean;
  citas: number;
  monto: number;
  pendiente: boolean;
}

interface EnLista {
  orden: number;
  cita: Cita;
}

interface ManualSesionForm {
  tratamientoId: number;
  fecha: string;
  hora: string;
  zona: string;
  observaciones: string;
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
  private configPanel = inject(ConfiguracionPanelService);
  private pacientes = inject(PacientesService);
  private planes = inject(PlanesService);

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
  reprogramando = signal<number | null>(null);

  filtroLocal = signal('Todos');
  filtroEstado = signal('Todos');
  filtroPago = signal('Todos');
  busqueda = signal('');
  mostrarManual = signal(false);
  pagoMetodo = signal<MetodoPago>('Efectivo');
  pagoMonto = signal<Record<number, number>>({});
  pagoCodigo = signal<Record<number, string>>({});
  editFecha = signal<Record<number, string>>({});
  editHora = signal<Record<number, string>>({});
  manualPacienteEncontrado = signal(this.pacientes.porDni('') ?? null);

  manualDni = '';
  manualCelular = '';
  manualNombre = '';
  manualCorreo = '';
  manualLocalId = LOCALES[0]?.id ?? 1;
  manualFecha = '';
  manualHora = '';
  manualTratamientos = signal<number[]>([TRATAMIENTOS[0]?.id ?? 1]);
  manualZona = '';
  manualNotas = '';
  manualTotal = TRATAMIENTOS[0]?.precio ?? 0;
  manualPagado = 0;
  manualMetodo: MetodoPago = 'Efectivo';
  manualOrigen: 'Recepción' | 'WhatsApp' = 'Recepción';
  manualMultisesion = false;
  manualPlanNombre = '';
  manualSesiones = signal<ManualSesionForm[]>([]);

  estados = ['Todos', ...ESTADOS_CITA];
  estadosPago = ['Todos', 'Pagado', 'Pago en local', 'Pendiente', 'Reembolsado'];

  titulo = computed(() => `${this.meses[this.mes()]} ${this.anio()}`);
  saldoManual = computed(() => Math.max(this.manualTotal - this.manualPagado, 0));

  celdas = computed<Celda[]>(() => {
    const primero = new Date(this.anio(), this.mes(), 1);
    const desplazamiento = (primero.getDay() + 6) % 7;
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

  listaDelDia = computed<EnLista[]>(() =>
    this.citasDe(this.diaSeleccionado()).map((cita, i) => ({ orden: i + 1, cita }))
  );

  citasDelDia = computed<Cita[]>(() => this.listaDelDia().map(f => f.cita));

  bloquesDelDia = computed(() => {
    const mapa = new Map<string, { hora: string; total: number; cupo: number }>();
    for (const c of this.citasDelDia()) {
      if (c.estado === 'Cancelada' || c.estado === 'No asistió') { continue; }
      const hora = `${c.horaInicio.slice(0, 2)}:00`;
      const clave = `${c.localId}-${hora}`;
      const actual = mapa.get(clave);
      if (actual) { actual.total += 1; }
      else { mapa.set(clave, { hora, total: 1, cupo: this.configPanel.obtenerCupoLocal(c.localId) }); }
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

  activarMultisesion(valor: boolean): void {
    this.manualMultisesion = valor;
    if (valor && !this.manualSesiones().length) {
      this.manualSesiones.set([this.crearSesionManualVacia(true)]);
    }
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

  agregarSesionManual(): void {
    this.manualSesiones.update(lista => [...lista, this.crearSesionManualVacia(false)]);
    this.recalcularManualDesdeSesiones();
  }

  quitarSesionManual(indice: number): void {
    this.manualSesiones.update(lista => lista.length === 1 ? lista : lista.filter((_, i) => i !== indice));
    this.recalcularManualDesdeSesiones();
  }

  actualizarSesionManual(indice: number, campo: keyof ManualSesionForm, valor: string | number): void {
    this.manualSesiones.update(lista => lista.map((sesion, i) => i === indice ? {
      ...sesion,
      [campo]: campo === 'tratamientoId' ? Number(valor) : valor
    } : sesion));
    if (campo === 'tratamientoId') {
      this.recalcularManualDesdeSesiones();
    }
  }

  recalcularManual(): void {
    this.manualTotal = this.manualTratamientos().reduce((total, id) => total + (tratamientoPorId(id)?.precio ?? 0), 0);
  }

  recalcularManualDesdeSesiones(): void {
    this.manualTotal = this.manualSesiones().reduce((total, sesion) => total + (tratamientoPorId(sesion.tratamientoId)?.precio ?? 0), 0);
  }

  buscarPacienteManual(dni: string): void {
    this.manualDni = dni.replace(/\D/g, '').slice(0, 8);
    if (this.manualDni.length < 8) {
      this.manualPacienteEncontrado.set(null);
      return;
    }

    const paciente = this.pacientes.porDni(this.manualDni) ?? null;
    this.manualPacienteEncontrado.set(paciente);
    if (paciente) {
      this.manualNombre = `${paciente.nombre} ${paciente.apellido}`.trim();
      this.manualCelular = paciente.celular;
      this.manualCorreo = paciente.correo;
    }
  }

  registrarCitaManual(): void {
    if (this.manualMultisesion) {
      this.registrarPlanMultisesion();
      return;
    }
    this.registrarCitaSimple();
  }

  abrirReprogramacion(cita: Cita): void {
    const abierta = this.reprogramando() === cita.id ? null : cita.id;
    this.reprogramando.set(abierta);
    if (abierta) {
      this.editFecha.update(v => ({ ...v, [cita.id]: cita.fecha }));
      this.editHora.update(v => ({ ...v, [cita.id]: cita.horaInicio }));
    }
  }

  setEditFecha(id: number, fecha: string): void {
    this.editFecha.update(v => ({ ...v, [id]: fecha }));
  }

  setEditHora(id: number, hora: string): void {
    this.editHora.update(v => ({ ...v, [id]: hora }));
  }

  guardarFechaHora(cita: Cita): void {
    const fecha = this.editFecha()[cita.id];
    const hora = this.editHora()[cita.id];
    if (!fecha || !hora) {
      return;
    }
    const duracion = this.minutosEntre(cita.horaInicio, cita.horaFin)
      || this.tratamiento(cita.tratamientoId)?.duracionMin
      || 60;
    this.agenda.actualizarFechaHora(cita.id, fecha, hora, this.sumarMinutos(hora, duracion), this.responsable());
    this.diaSeleccionado.set(fecha);
    this.reprogramando.set(null);
  }

  private registrarCitaSimple(): void {
    if (!this.manualFecha || !this.manualHora) {
      return;
    }
    const paciente = this.pacientes.registrarOActualizar({
      dni: this.manualDni,
      nombreCompleto: this.manualNombre,
      celular: this.manualCelular,
      correo: this.manualCorreo,
      observaciones: this.manualNotas.trim()
    });

    const principal = this.manualTratamientos()[0];
    const duracion = Math.max(...this.manualTratamientos().map(id => tratamientoPorId(id)?.duracionMin ?? 60));
    const fin = this.sumarMinutos(this.manualHora, duracion);
    this.agenda.crearCita({
      fecha: this.manualFecha,
      horaInicio: this.manualHora,
      horaFin: fin,
      pacienteId: paciente.id,
      tratamientoId: principal,
      tratamientosIncluidos: [...this.manualTratamientos()],
      localId: Number(this.manualLocalId),
      estado: 'Programada',
      estadoPago: this.manualPagado >= this.manualTotal ? 'Pagado' : this.manualPagado > 0 ? 'Pago en local' : 'Pendiente',
      metodoPago: this.manualPagado > 0 ? this.manualMetodo : undefined,
      montoTotal: Number(this.manualTotal),
      montoPagado: Number(this.manualPagado),
      registradaPor: this.manualOrigen === 'WhatsApp' ? `WhatsApp · ${this.responsable()}` : this.responsable(),
      confirmadaPor: this.manualPagado > 0 ? this.responsable() : undefined,
      codigoOperacion: this.manualPagado > 0 ? `${this.manualMetodo.toUpperCase().replace(/\s/g, '-')}-${Date.now().toString().slice(-5)}` : undefined,
      pagadaEl: this.manualPagado > 0 ? `${HOY_ISO} ${new Date().toTimeString().slice(0, 5)}` : undefined,
      origen: this.manualOrigen,
      zonaTratamiento: this.manualZona.trim() || undefined,
      notas: this.notaCitaSimple()
    });

    this.pacientes.registrarAtencion(paciente.id, this.manualFecha, Number(this.manualPagado));
    this.cerrarFormularioManual(this.manualFecha);
  }

  private registrarPlanMultisesion(): void {
    const sesionesValidas = this.manualSesiones().filter((sesion, indice) =>
      indice === 0 || sesion.fecha || sesion.hora || sesion.zona || sesion.observaciones
    );
    if (!sesionesValidas.length || !sesionesValidas[0].fecha || !sesionesValidas[0].hora) {
      return;
    }

    const paciente = this.pacientes.registrarOActualizar({
      dni: this.manualDni,
      nombreCompleto: this.manualNombre,
      celular: this.manualCelular,
      correo: this.manualCorreo,
      observaciones: this.manualNotas.trim()
    });

    const pagoRegistrado = this.manualPagado > 0 ? [{
      metodo: this.manualMetodo,
      monto: this.manualPagado,
      fecha: HOY_ISO,
      hora: new Date().toTimeString().slice(0, 5),
      canal: this.manualOrigen,
      registradoPor: this.responsable(),
      codigoOperacion: `${this.manualMetodo.toUpperCase().replace(/\s/g, '-')}-${Date.now().toString().slice(-6)}`
    }] : [];

    const plan = this.planes.crearPlan({
      pacienteId: paciente.id,
      dni: this.manualDni,
      nombre: this.manualPlanNombre.trim() || `Plan ${this.manualNombre}`,
      localId: Number(this.manualLocalId),
      intervaloDias: 7,
      inicio: sesionesValidas[0].fecha,
      precioTotal: Number(this.manualTotal),
      pagado: Number(this.manualPagado),
      pagosDetalle: pagoRegistrado,
      fechaLiquidacion: this.manualPagado >= this.manualTotal ? HOY_ISO : undefined,
      estado: 'En curso',
      notas: this.notaPlanMultisesion(),
      sesiones: sesionesValidas.map((sesion, indice) => ({
        numero: indice + 1,
        tratamientoId: sesion.tratamientoId,
        procedimiento: tratamientoPorId(sesion.tratamientoId)?.nombre ?? 'Tratamiento',
        fecha: indice === 0 || this.manualPagado >= this.manualTotal ? (sesion.fecha || undefined) : undefined,
        hora: indice === 0 || this.manualPagado >= this.manualTotal ? (sesion.hora || undefined) : undefined,
        zona: sesion.zona.trim() || undefined,
        estado: indice === 0 ? 'Programada' : 'Pendiente',
        observaciones: sesion.observaciones.trim() || undefined,
        registradoPor: this.responsable()
      }))
    });

    this.pacientes.registrarAtencion(paciente.id, sesionesValidas[0].fecha, Number(this.manualPagado));
    this.cerrarFormularioManual(sesionesValidas[0].fecha);
    this.busqueda.set(plan.codigo);
  }

  private cerrarFormularioManual(fecha: string): void {
    this.diaSeleccionado.set(fecha);
    this.mostrarManual.set(false);
    this.manualDni = '';
    this.manualCelular = '';
    this.manualNombre = '';
    this.manualCorreo = '';
    this.manualPacienteEncontrado.set(null);
    this.manualFecha = '';
    this.manualHora = '';
    this.manualZona = '';
    this.manualNotas = '';
    this.manualPagado = 0;
    this.manualOrigen = 'Recepción';
    this.manualMetodo = 'Efectivo';
    this.manualMultisesion = false;
    this.manualPlanNombre = '';
    this.manualTratamientos.set([TRATAMIENTOS[0]?.id ?? 1]);
    this.manualSesiones.set([]);
    this.recalcularManual();
  }

  private notaCitaSimple(): string {
    const zona = this.manualZona.trim() ? `Zona indicada: ${this.manualZona.trim()}. ` : '';
    const notas = this.manualNotas.trim() ? `Notas de recepción: ${this.manualNotas.trim()}. ` : '';
    const varios = this.manualTratamientos().length > 1 ? 'Incluye más de un tratamiento en una sola atención. ' : '';
    return `${varios}${zona}${notas}`.trim();
  }

  private notaPlanMultisesion(): string {
    const saldo = Math.max(this.manualTotal - this.manualPagado, 0);
    const pago = saldo > 0
      ? `Se atendió con adelanto inicial. Antes de la segunda sesión debe cancelar el saldo restante de ${soles(saldo)}.`
      : 'Plan pagado completo desde el registro inicial.';
    const notas = this.manualNotas.trim() ? ` ${this.manualNotas.trim()}` : '';
    return `${pago}${notas}`.trim();
  }

  private crearSesionManualVacia(esPrimera: boolean): ManualSesionForm {
    return {
      tratamientoId: this.tratamientosCatalogo[0]?.id ?? 1,
      fecha: esPrimera ? (this.manualFecha || HOY_ISO) : '',
      hora: esPrimera ? (this.manualHora || '09:00') : '',
      zona: '',
      observaciones: ''
    };
  }

  private responsable(): string {
    return this.sesion.nombreCompleto() || 'Recepción';
  }

  paciente = (id: number) => this.pacientes.porId(id);
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

  private minutosEntre(inicio: string, fin: string): number {
    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fin.split(':').map(Number);
    return (hf * 60 + mf) - (hi * 60 + mi);
  }
}
