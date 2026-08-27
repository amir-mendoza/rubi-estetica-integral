import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  fecha: string;
  hora: string;
  zona: string;
  observaciones: string;
}

interface ManualTratamientoSeguimiento {
  tratamientoId: number;
  multisesion: boolean;
  sesiones: ManualSesionForm[];
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
  private router = inject(Router);

  soles = soles;
  Number = Number;
  meses = MESES;
  diasSemana = DIAS_SEMANA;
  locales = LOCALES;
  tratamientosCatalogo = TRATAMIENTOS;
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
  manualNotas = '';
  manualTotal = TRATAMIENTOS[0]?.precio ?? 0;
  manualPagado = 0;
  manualMetodo: MetodoPago = 'Efectivo';
  manualOrigen: 'Recepción' | 'WhatsApp' = 'Recepción';
  manualPlanNombre = '';
  manualSeguimientos = signal<ManualTratamientoSeguimiento[]>([{
    tratamientoId: TRATAMIENTOS[0]?.id ?? 1,
    multisesion: false,
    sesiones: [{
      fecha: HOY_ISO,
      hora: '09:00',
      zona: '',
      observaciones: ''
    }]
  }]);

  estados = ['Todos', ...ESTADOS_CITA];
  estadosPago = ['Todos', 'Pagado', 'Pago en local', 'Pendiente', 'Reembolsado'];

  titulo = computed(() => `${this.meses[this.mes()]} ${this.anio()}`);
  saldoManual(): number {
    return Math.max(this.totalManualSeguro() - this.pagadoManualSeguro(), 0);
  }

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
    if (c.planId && c.numeroSesionPlan) {
      this.planes.cambiarEstadoSesion(c.planId, c.numeroSesionPlan, this.estadoCitaASesion(estado));
    }
  }

  registrarPago(c: Cita): void {
    const monto = Number(this.pagoMonto()[c.id] ?? (c.montoTotal - c.montoPagado));
    this.agenda.registrarPago(c.id, this.responsable(), this.pagoMetodo(), monto, this.pagoCodigo()[c.id]);
    if (c.planId) {
      this.planes.registrarPago(c.planId, monto, this.pagoMetodo(), this.responsable(), 'Recepción');
    }
    this.pagoMonto.update(m => ({ ...m, [c.id]: 0 }));
    this.pagoCodigo.update(m => ({ ...m, [c.id]: '' }));
  }

  setPagoMonto(id: number, monto: number): void {
    this.pagoMonto.update(v => ({ ...v, [id]: monto }));
  }

  setPagoCodigo(id: number, codigo: string): void {
    this.pagoCodigo.update(v => ({ ...v, [id]: codigo }));
  }

  agregarSeguimientoManual(): void {
    this.manualSeguimientos.update(lista => [...lista, this.crearSeguimientoManualVacio(false)]);
    this.recalcularManualDesdeSeguimientos();
  }

  quitarSeguimientoManual(indice: number): void {
    this.manualSeguimientos.update(lista => lista.length === 1 ? lista : lista.filter((_, i) => i !== indice));
    this.recalcularManualDesdeSeguimientos();
  }

  cambiarTratamientoSeguimiento(indice: number, tratamientoId: number): void {
    this.manualSeguimientos.update(lista => lista.map((item, i) => i === indice ? { ...item, tratamientoId } : item));
    this.recalcularManualDesdeSeguimientos();
  }

  alternarMultisesionTratamiento(indice: number, multisesion: boolean): void {
    this.manualSeguimientos.update(lista => lista.map((item, i) => {
      if (i !== indice) { return item; }
      return {
        ...item,
        multisesion,
        sesiones: multisesion ? item.sesiones : [item.sesiones[0] ?? this.crearSesionManualVacia(true)]
      };
    }));
  }

  agregarSesionTratamiento(indiceTratamiento: number): void {
    this.manualSeguimientos.update(lista => lista.map((item, i) => i === indiceTratamiento
      ? { ...item, multisesion: true, sesiones: [...item.sesiones, this.crearSesionManualVacia(false)] }
      : item
    ));
  }

  quitarSesionTratamiento(indiceTratamiento: number, indiceSesion: number): void {
    this.manualSeguimientos.update(lista => lista.map((item, i) => {
      if (i !== indiceTratamiento || item.sesiones.length === 1) { return item; }
      const sesiones = item.sesiones.filter((_, s) => s !== indiceSesion);
      return { ...item, sesiones, multisesion: sesiones.length > 1 ? item.multisesion : false };
    }));
  }

  actualizarSesionTratamiento(indiceTratamiento: number, indiceSesion: number, campo: keyof ManualSesionForm, valor: string): void {
    this.manualSeguimientos.update(lista => lista.map((item, i) => i === indiceTratamiento ? {
      ...item,
      sesiones: item.sesiones.map((sesion, s) => s === indiceSesion ? { ...sesion, [campo]: valor } : sesion)
    } : item));
  }

  seguimientoManualValido(): boolean {
    return this.manualSeguimientos().length > 0 &&
      this.manualSeguimientos().every(item => !!item.tratamientoId && !!item.sesiones[0]?.fecha && !!item.sesiones[0]?.hora);
  }

  recalcularManualDesdeSeguimientos(): void {
    this.manualTotal = this.manualSeguimientos().reduce((total, item) => total + (tratamientoPorId(item.tratamientoId)?.precio ?? 0), 0);
    this.manualPagado = this.pagadoManualSeguro();
  }

  marcarPagoCompletoManual(): void {
    this.manualPagado = Number(this.manualTotal || 0);
  }

  limpiarPagoManual(): void {
    this.manualPagado = 0;
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
    this.registrarPlanMultisesion();
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

  abrirSeguimiento(cita: Cita): void {
    const plan = cita.planId ? this.planes.porId(cita.planId) : undefined;
    this.router.navigate(['/admin/sesiones'], { queryParams: { buscar: plan?.codigo ?? cita.codigo } });
  }

  private registrarPlanMultisesion(): void {
    const seguimientos = this.manualSeguimientos();
    const sesionesValidas = seguimientos.flatMap((item, grupoIndice) => item.sesiones
      .map((sesion) => ({ ...sesion, tratamientoId: item.tratamientoId, grupoTratamiento: grupoIndice + 1 }))
    );
    const faltaPrimeraSesion = seguimientos.some(item => !item.sesiones[0]?.fecha || !item.sesiones[0]?.hora);
    if (!sesionesValidas.length || faltaPrimeraSesion) {
      return;
    }

    const paciente = this.pacientes.registrarOActualizar({
      dni: this.manualDni,
      nombreCompleto: this.manualNombre,
      celular: this.manualCelular,
      correo: this.manualCorreo,
      observaciones: this.manualNotas.trim()
    });

    const total = this.totalManualSeguro();
    const pagado = this.pagadoManualSeguro();
    const pagoRegistrado = pagado > 0 ? [{
      metodo: this.manualMetodo,
      monto: pagado,
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
      precioTotal: total,
      pagado,
      pagosDetalle: pagoRegistrado,
      fechaLiquidacion: pagado >= total && total > 0 ? HOY_ISO : undefined,
      estado: 'En curso',
      notas: this.notaPlanMultisesion(),
      sesiones: sesionesValidas.map((sesion, indice) => ({
        numero: indice + 1,
        tratamientoId: sesion.tratamientoId,
        grupoTratamiento: sesion.grupoTratamiento,
        procedimiento: tratamientoPorId(sesion.tratamientoId)?.nombre ?? 'Tratamiento',
        fecha: sesion.fecha || undefined,
        hora: sesion.hora || undefined,
        zona: sesion.zona.trim() || undefined,
        estado: sesion.fecha && sesion.hora ? 'Programada' as const : 'Pendiente' as const,
        observaciones: sesion.observaciones.trim() || undefined,
        registradoPor: this.responsable()
      }))
    });

    this.pacientes.registrarAtencion(paciente.id, sesionesValidas[0].fecha, pagado);
    this.cerrarFormularioManual(sesionesValidas[0].fecha);
    this.busqueda.set('');
  }

  private cerrarFormularioManual(fecha: string): void {
    this.diaSeleccionado.set(fecha);
    this.mostrarManual.set(false);
    this.manualDni = '';
    this.manualCelular = '';
    this.manualNombre = '';
    this.manualCorreo = '';
    this.manualPacienteEncontrado.set(null);
    this.manualNotas = '';
    this.manualPagado = 0;
    this.manualOrigen = 'Recepción';
    this.manualMetodo = 'Efectivo';
    this.manualPlanNombre = '';
    this.manualSeguimientos.set([this.crearSeguimientoManualVacio(true)]);
    this.recalcularManualDesdeSeguimientos();
  }

  private notaPlanMultisesion(): string {
    const saldo = this.saldoManual();
    const pago = saldo > 0
      ? `Se atendió con adelanto inicial. Antes de la segunda sesión debe cancelar el saldo restante de ${soles(saldo)}.`
      : 'Plan pagado completo desde el registro inicial.';
    const notas = this.manualNotas.trim() ? ` ${this.manualNotas.trim()}` : '';
    return `${pago}${notas}`.trim();
  }

  private crearSesionManualVacia(esPrimera: boolean): ManualSesionForm {
    return {
      fecha: esPrimera ? HOY_ISO : '',
      hora: esPrimera ? '09:00' : '',
      zona: '',
      observaciones: ''
    };
  }

  private totalManualSeguro(): number {
    return Math.max(Number(this.manualTotal || 0), 0);
  }

  private pagadoManualSeguro(): number {
    return Math.min(Math.max(Number(this.manualPagado || 0), 0), this.totalManualSeguro());
  }

  private crearSeguimientoManualVacio(esPrimero: boolean): ManualTratamientoSeguimiento {
    return {
      tratamientoId: this.tratamientosCatalogo[0]?.id ?? 1,
      multisesion: false,
      sesiones: [this.crearSesionManualVacia(esPrimero)]
    };
  }

  private estadoCitaASesion(estado: EstadoCita) {
    if (estado === 'Atendida') { return 'Atendida' as const; }
    if (estado === 'En proceso') { return 'En proceso' as const; }
    if (estado === 'No asistió') { return 'No asistió' as const; }
    if (estado === 'Reprogramada' || estado === 'Llegó tarde') { return 'Reprogramada' as const; }
    return 'Programada' as const;
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
