import { Component, OnDestroy, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ETIQUETAS_TRATAMIENTO, LOCALES, TRATAMIENTOS, formatoFechaLarga, formatoHora12, soles
} from '../../data/datos';
import { CategoriaTratamiento, Local, Promocion, Tratamiento } from '../../data/modelos';
import { Bloque, DisponibilidadService } from '../../compartido/disponibilidad.service';
import { SesionService } from '../../compartido/sesion.service';
import { PromocionesService } from '../../compartido/promociones.service';
import { PagosOnlineService } from '../../compartido/pagos-online.service';
import { RedesEnlacesComponent } from '../../compartido/redes-enlaces.component';
import { RedesService } from '../../compartido/redes.service';
import { ConfiguracionPanelService } from '../../compartido/configuracion-panel.service';
import { AgendaService } from '../../compartido/agenda.service';
import { PacientesService } from '../../compartido/pacientes.service';

const MINUTOS_RESERVA_PROCESO = 8;
const MINUTOS_EXTENSION_RESERVA = 5;
const SEGUNDOS_RESPUESTA_EXTENSION = 30;
const CLAVE_PROCESO_RESERVA = 'rubi.reserva-en-proceso';

const CATEGORIAS: (CategoriaTratamiento | 'Todos')[] = [
  'Todos', 'Facial', 'Corporal', 'Aparatología', 'Medicina estética'
];

@Component({
  selector: 'app-reservar',
  standalone: true,
  imports: [RouterLink, FormsModule, RedesEnlacesComponent],
  templateUrl: './reservar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './reservar.component.scss'
})
export class ReservarComponent implements OnDestroy {
  private disponibilidad = inject(DisponibilidadService);
  private ruta = inject(ActivatedRoute);
  readonly sesion = inject(SesionService);
  private promociones = inject(PromocionesService);
  private pagosOnline = inject(PagosOnlineService);
  readonly redes = inject(RedesService);
  readonly configPanel = inject(ConfiguracionPanelService);
  private agenda = inject(AgendaService);
  private pacientes = inject(PacientesService);

  soles = soles;
  formatoFechaLarga = formatoFechaLarga;
  formatoHora = formatoHora12;
  adelantoPorcentaje = computed(() => this.configPanel.adelantoReservaPorcentaje());

  locales = LOCALES;
  categorias = CATEGORIAS;
  etiquetas = ETIQUETAS_TRATAMIENTO;
  dias = this.disponibilidad.proximosDias(14);

  paso = signal(1);
  local = signal<Local | null>(null);
  promocion = signal<Promocion | null>(null);
  categoria = signal<CategoriaTratamiento | 'Todos'>('Todos');
  etiqueta = signal<string>('Todas');
  busqueda = signal('');
  fecha = signal<string>(this.dias[0].iso);
  bloque = signal<Bloque | null>(null);
  tratamientosIds = signal<number[]>([]);
  confirmado = signal(false);
  procesandoPago = signal(false);
  mensajePago = signal('');
  codigoOperacion = signal<string | null>(null);
  codigoReserva = signal('—');
  tiempoReservaSeg = signal(0);
  reservaExpiraEn = signal<number | null>(null);
  mostrarExtension = signal(false);
  cuentaExtensionSeg = signal(SEGUNDOS_RESPUESTA_EXTENSION);
  avisoReserva = signal('');
  private temporizadorReserva?: ReturnType<typeof setInterval>;
  private temporizadorExtension?: ReturnType<typeof setInterval>;

  // Datos del cliente.
  nombre = this.sesion.usuario()?.nombre ?? '';
  apellido = this.sesion.usuario()?.apellido ?? '';
  dni = this.sesion.usuario()?.dni ?? '';
  celular = this.sesion.usuario()?.celular ?? '';
  correo = this.sesion.usuario()?.correo ?? '';
  observaciones = '';
  metodoPago = signal<'Izipay' | 'Local'>('Izipay');
  modalidadPagoOnline = signal<'total' | 'adelanto'>('total');

  pasos = [
    { n: 1, titulo: 'Sede' },
    { n: 2, titulo: 'Tratamiento' },
    { n: 3, titulo: 'Fecha y hora' },
    { n: 4, titulo: 'Tus datos' },
    { n: 5, titulo: 'Pago' }
  ];

  pasosVisibles = computed(() => this.promocion()
    ? this.pasos.filter(p => p.n !== 2)
    : this.pasos
  );

  tratamientosFiltrados = computed<Tratamiento[]>(() => {
    const cat = this.categoria();
    const etq = this.etiqueta();
    const texto = this.busqueda().trim().toLowerCase();
    return TRATAMIENTOS.filter(t => {
      if (!t.activo) { return false; }
      if (cat !== 'Todos' && t.categoria !== cat) { return false; }
      if (etq !== 'Todas' && !t.etiquetas.includes(etq)) { return false; }
      if (texto && !`${t.nombre} ${t.resumen}`.toLowerCase().includes(texto)) { return false; }
      return true;
    });
  });

  tratamientosSeleccionados = computed<Tratamiento[]>(() =>
    this.tratamientosIds()
      .map(id => TRATAMIENTOS.find(t => t.id === id))
      .filter((t): t is Tratamiento => !!t)
  );

  bloques = computed<Bloque[]>(() => {
    const l = this.local();
    return l ? this.disponibilidad.bloques(this.fecha(), l) : [];
  });

  cupoSede = computed(() => {
    const l = this.local();
    return l ? this.disponibilidad.cupo(l) : 0;
  });

  cabinasSede = computed(() => {
    const l = this.local();
    return l ? this.disponibilidad.cabinas(l) : 0;
  });

  duracionEstimada = computed(() => {
    const promo = this.promocion();
    if (promo) {
      return promo.sesionesDetalle?.reduce((total, s) => {
        const t = s.tratamientoId ? TRATAMIENTOS.find(item => item.id === s.tratamientoId) : undefined;
        return total + ((t?.duracionMin ?? 0) + (t?.limpiezaMin ?? 0));
      }, 0) || 0;
    }
    return this.tratamientosSeleccionados().reduce((total, t) => total + t.duracionMin + t.limpiezaMin, 0);
  });

  totalReserva = computed(() => {
    if (this.promocion()) {
      return this.promocion()?.precio ?? 0;
    }
    return this.tratamientosSeleccionados().reduce((total, t) => total + t.precio, 0);
  });

  nombreReserva = computed(() => {
    if (this.promocion()) { return this.promocion()?.titulo ?? 'Promoción'; }
    const tratamientos = this.tratamientosSeleccionados();
    if (tratamientos.length === 0) { return '—'; }
    if (tratamientos.length === 1) { return tratamientos[0].nombre; }
    return `${tratamientos.length} tratamientos seleccionados`;
  });

  resumenTratamientos = computed(() => {
    if (this.promocion()) {
      return this.promocion()?.sesionesDetalle?.map(s => s.titulo) ?? [];
    }
    return this.tratamientosSeleccionados().map(t => t.nombre);
  });

  sesionesPromo = computed(() => this.promocion()?.sesionesDetalle ?? []);

  montoPagoOnline = computed(() => {
    const total = this.totalReserva();
    if (this.metodoPago() !== 'Izipay') { return total; }
    if (this.modalidadPagoOnline() === 'adelanto') {
      const porcentaje = this.adelantoPorcentaje();
      return porcentaje > 0 ? Math.max(1, Math.round(total * (porcentaje / 100))) : total;
    }
    return total;
  });

  saldoPendiente = computed(() => Math.max(this.totalReserva() - this.montoPagoOnline(), 0));

  datosCompletos(): boolean {
    return !!(this.nombre && this.apellido && this.dni && this.celular);
  }

  constructor() {
    const q = this.ruta.snapshot.queryParamMap;
    const localId = Number(q.get('local'));
    const tratId = Number(q.get('tratamiento'));
    const promoId = Number(q.get('promo'));

    if (promoId) {
      const promo = this.promociones.porId(promoId);
      if (promo) {
        this.promocion.set(promo);
      }
    }

    if (tratId) {
      this.tratamientosIds.set([tratId]);
    }

    if (localId) {
      this.local.set(LOCALES.find(l => l.id === localId) ?? null);
    }

    if (!this.local()) {
      this.paso.set(1);
    } else if (this.promocion() || this.tratamientosSeleccionados().length) {
      this.paso.set(3);
    } else {
      this.paso.set(2);
    }
  }

  elegirLocal(l: Local): void {
    this.local.set(l);
    this.limpiarBloqueRetenido();
    this.avisoReserva.set('');
    this.paso.set(this.promocion() || this.tratamientosSeleccionados().length ? 3 : 2);
  }

  alternarTratamiento(t: Tratamiento): void {
    this.promocion.set(null);
    this.tratamientosIds.update(ids => ids.includes(t.id)
      ? ids.filter(id => id !== t.id)
      : [...ids, t.id]
    );
  }

  tratamientoSeleccionado(id: number): boolean {
    return this.tratamientosIds().includes(id);
  }

  elegirCategoria(c: CategoriaTratamiento | 'Todos'): void {
    this.categoria.set(c);
    this.etiqueta.set('Todas');
  }

  elegirEtiqueta(e: string): void {
    this.etiqueta.set(this.etiqueta() === e ? 'Todas' : e);
  }

  elegirFecha(iso: string): void {
    this.fecha.set(iso);
    this.limpiarBloqueRetenido();
    this.avisoReserva.set('');
  }

  elegirBloque(b: Bloque): void {
    if (!b.disponible) { return; }
    const l = this.local();
    if (!l) { return; }

    const expiraEnProceso = this.reservaExpiraEn() ?? (Date.now() + MINUTOS_RESERVA_PROCESO * 60_000);
    const retencion = this.disponibilidad.retenerBloque(this.fecha(), l, b, MINUTOS_RESERVA_PROCESO, expiraEnProceso);
    if (!retencion.ok || !retencion.expiraEn) {
      this.avisoReserva.set(retencion.motivo ?? 'La hora elegida ya no está disponible. Elige otra.');
      this.bloque.set(null);
      return;
    }

    this.avisoReserva.set('');
    this.bloque.set({ ...b, retenidoPorMi: true, vencimientoRetencion: retencion.expiraEn });
    this.iniciarTemporizadorReserva(retencion.expiraEn);
  }

  irA(n: number): void {
    if (n < this.paso()) {
      if (n < 3) {
        this.limpiarBloqueRetenido();
      }
      this.paso.set(n);
    }
  }

  siguiente(): void {
    const actual = this.paso();
    if (actual === 2 && !this.promocion() && !this.tratamientosSeleccionados().length) {
      return;
    }
    this.paso.set(this.promocion() && actual === 1 ? 3 : Math.min(actual + 1, 5));
  }

  anterior(): void {
    const actual = this.paso();
    const siguiente = this.promocion() && actual === 3 ? 1 : Math.max(actual - 1, 1);
    if (siguiente < 3) {
      this.limpiarBloqueRetenido();
    }
    this.paso.set(siguiente);
  }

  confirmar(): void {
    if (!this.bloque()) {
      this.avisoReserva.set('Tu hora ya no está retenida. Vuelve a elegir fecha y hora para continuar.');
      this.paso.set(3);
      return;
    }
    if (this.metodoPago() === 'Izipay') {
      this.procesarPagoOnline();
      return;
    }

    const cita = this.registrarReservaConfirmada();
    this.disponibilidad.confirmarRetencionActiva();
    this.detenerTemporizadores();
    this.codigoOperacion.set(null);
    this.codigoReserva.set(cita.codigo);
    this.confirmado.set(true);
  }

  reiniciar(): void {
    this.limpiarBloqueRetenido();
    this.confirmado.set(false);
    this.paso.set(1);
    this.local.set(null);
    this.promocion.set(null);
    this.bloque.set(null);
    this.tratamientosIds.set([]);
    this.categoria.set('Todos');
    this.etiqueta.set('Todas');
    this.busqueda.set('');
    this.codigoReserva.set('—');
    const u = this.sesion.usuario();
    this.nombre = u?.nombre ?? '';
    this.apellido = u?.apellido ?? '';
    this.dni = u?.dni ?? '';
    this.celular = u?.celular ?? '';
    this.correo = u?.correo ?? '';
    this.observaciones = '';
  }

  ngOnDestroy(): void {
    this.detenerTemporizadores();
  }

  tiempoReservaTexto(): string {
    const total = this.tiempoReservaSeg();
    const minutos = Math.floor(total / 60);
    const segundos = total % 60;
    return `${`${minutos}`.padStart(2, '0')}:${`${segundos}`.padStart(2, '0')}`;
  }

  aceptarExtensionReserva(): void {
    const expiraEn = Date.now() + MINUTOS_EXTENSION_RESERVA * 60_000;
    const tieneBloqueRetenido = !!this.disponibilidad.retencionActiva();
    if (tieneBloqueRetenido) {
      const extendida = this.disponibilidad.extenderRetencionActiva(MINUTOS_EXTENSION_RESERVA, expiraEn);
      if (!extendida.ok || !extendida.expiraEn) {
        this.cerrarReservaPorTiempo();
        return;
      }
    }
    this.mostrarExtension.set(false);
    this.cuentaExtensionSeg.set(SEGUNDOS_RESPUESTA_EXTENSION);
    this.avisoReserva.set('Tu hora sigue retenida. Te dimos 5 minutos más para terminar la reserva.');
    this.iniciarTemporizadorReserva(expiraEn);
  }

  cancelarExtensionReserva(): void {
    this.cerrarReservaPorTiempo();
  }

  whatsappReserva(): string {
    const detalle = this.promocion()
      ? `la promoción ${this.promocion()?.titulo}`
      : this.resumenTratamientos().join(', ');
    const texto = `Hola, quiero reservar ${detalle}. Mi nombre es ${this.nombre || ''} ${this.apellido || ''}.`;
    return `https://wa.me/51945189720?text=${encodeURIComponent(texto)}`;
  }

  mensajeSeguimiento(): string {
    if (this.promocion() || this.tratamientosSeleccionados().length > 1) {
      return 'Hoy se agenda tu primera atención. Al terminar, recepción coordinará contigo la fecha y hora de tu siguiente sesión o del siguiente tratamiento pendiente.';
    }
    return 'Tu tratamiento se atenderá con normalidad en la fecha y hora elegidas.';
  }

  private procesarPagoOnline(): void {
    if (this.procesandoPago()) { return; }
    this.procesandoPago.set(true);
    this.mensajePago.set('Preparando pago seguro con Izipay...');

    this.pagosOnline.iniciarPago({
      tipo: 'Cita',
      referencia: this.codigoReservaTemporal(),
      descripcion: `Reserva ${this.nombreReserva()}`,
      monto: this.montoPagoOnline(),
      moneda: 'PEN',
      localId: this.local()?.id,
      cliente: {
        nombre: this.nombre,
        apellido: this.apellido,
        dni: this.dni,
        celular: this.celular,
        correo: this.correo
      },
      items: this.itemsPagoOnline(),
      metadata: {
        fecha: this.fecha(),
        hora: this.bloque()?.inicio ?? null,
        promocionId: this.promocion()?.id ?? null,
        tratamientoIds: this.tratamientosIds().join(','),
        tipoCobro: this.modalidadPagoOnline(),
        montoTotal: this.totalReserva(),
        montoPagadoOnline: this.montoPagoOnline(),
        saldoPendiente: this.saldoPendiente()
      }
    }).subscribe({
      next: resultado => {
        this.procesandoPago.set(false);
        this.mensajePago.set(resultado.mensaje);
        if (resultado.aprobado) {
          this.codigoOperacion.set(resultado.codigoOperacion ?? null);
          const cita = this.registrarReservaConfirmada();
          this.disponibilidad.confirmarRetencionActiva();
          this.detenerTemporizadores();
          this.codigoReserva.set(cita.codigo);
          this.confirmado.set(true);
        }
      },
      error: () => {
        this.procesandoPago.set(false);
        this.mensajePago.set('No se pudo iniciar el pago online. Puedes intentar otra vez o pagar en el local.');
      }
    });
  }

  private registrarReservaConfirmada() {
    const paciente = this.pacientes.registrarOActualizar({
      dni: this.dni.trim(),
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      celular: this.celular.trim(),
      correo: this.correo.trim(),
      observaciones: this.observaciones.trim()
    });

    const tratamientos = this.tratamientosSeleccionados();
    const tratamientoPrincipal = this.promocion()
      ? (this.promocion()?.sesionesDetalle?.find(s => !!s.tratamientoId)?.tratamientoId ?? tratamientos[0]?.id ?? 1)
      : (tratamientos[0]?.id ?? 1);

    const montoPagado = this.metodoPago() === 'Izipay' ? this.montoPagoOnline() : 0;
    const cita = this.agenda.crearCita({
      fecha: this.fecha(),
      horaInicio: this.bloque()?.inicio ?? '09:00',
      horaFin: this.bloque()?.fin ?? '10:00',
      pacienteId: paciente.id,
      tratamientoId: tratamientoPrincipal,
      tratamientosIncluidos: this.promocion() ? this.promocion()!.sesionesDetalle?.map(s => s.tratamientoId).filter((id): id is number => !!id) : this.tratamientosIds(),
      promocionId: this.promocion()?.id,
      localId: this.local()?.id ?? LOCALES[0].id,
      estado: 'Programada',
      estadoPago: this.metodoPago() === 'Izipay'
        ? (montoPagado >= this.totalReserva() ? 'Pagado' : 'Pago en local')
        : 'Pendiente',
      metodoPago: this.metodoPago() === 'Izipay' ? 'Izipay' : undefined,
      montoTotal: this.totalReserva(),
      montoPagado,
      registradaPor: 'Web',
      confirmadaPor: this.metodoPago() === 'Izipay' ? 'Izipay (automático)' : undefined,
      codigoOperacion: this.codigoOperacion() ?? undefined,
      pagadaEl: this.metodoPago() === 'Izipay' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : undefined,
      origen: 'Web',
      notas: this.notaReserva(),
      zonaTratamiento: undefined
    });

    this.pacientes.registrarAtencion(paciente.id, this.fecha(), montoPagado);
    return cita;
  }

  private notaReserva(): string {
    const base = this.observaciones.trim();
    const seguimiento = this.promocion() || this.tratamientosSeleccionados().length > 1
      ? 'Recepción coordina la siguiente sesión o tratamiento pendiente al finalizar la primera atención.'
      : 'Atención simple agendada desde la web.';
    return [seguimiento, base].filter(Boolean).join(' ');
  }

  private itemsPagoOnline() {
    if (this.promocion()) {
      return [{
        id: `PROMO-${this.promocion()?.id}`,
        nombre: this.promocion()?.titulo ?? 'Promoción',
        cantidad: 1,
        precioUnitario: this.montoPagoOnline()
      }];
    }

    const tratamientos = this.tratamientosSeleccionados();
    if (this.modalidadPagoOnline() === 'adelanto' && tratamientos.length > 1) {
      return [{
        id: 'ADELANTO-CITA',
        nombre: `Adelanto de reserva · ${tratamientos.length} tratamientos`,
        cantidad: 1,
        precioUnitario: this.montoPagoOnline()
      }];
    }

    return tratamientos.map(t => ({
      id: t.id,
      nombre: t.nombre,
      cantidad: 1,
      precioUnitario: this.modalidadPagoOnline() === 'total' ? t.precio : 0
    })).filter(item => item.precioUnitario > 0);
  }

  private codigoReservaTemporal(): string {
    return `WEB-${Date.now().toString().slice(-8)}`;
  }

  private iniciarTemporizadorReserva(expiraEn: number): void {
    this.detenerTemporizadores(false);
    this.reservaExpiraEn.set(expiraEn);
    this.guardarProcesoReserva(expiraEn);
    this.actualizarTiempoReserva(expiraEn);
    this.temporizadorReserva = setInterval(() => {
      this.actualizarTiempoReserva(expiraEn);
    }, 1000);
  }

  private actualizarTiempoReserva(expiraEn: number): void {
    const restante = Math.max(0, Math.ceil((expiraEn - Date.now()) / 1000));
    this.reservaExpiraEn.set(expiraEn);
    this.tiempoReservaSeg.set(restante);
    if (restante > 0) {
      return;
    }
    this.mostrarExtension.set(true);
    this.cuentaExtensionSeg.set(SEGUNDOS_RESPUESTA_EXTENSION);
    this.temporizadorReserva && clearInterval(this.temporizadorReserva);
    this.temporizadorReserva = undefined;
    this.temporizadorExtension = setInterval(() => {
      const siguiente = this.cuentaExtensionSeg() - 1;
      this.cuentaExtensionSeg.set(siguiente);
      if (siguiente <= 0) {
        this.cerrarReservaPorTiempo();
      }
    }, 1000);
  }

  private cerrarReservaPorTiempo(): void {
    this.limpiarBloqueRetenido();
    this.bloque.set(null);
    this.paso.set(3);
    this.avisoReserva.set('El tiempo para terminar la reserva se acabó. La hora se liberó y debes elegir otra vez fecha y hora para continuar.');
  }

  private limpiarBloqueRetenido(): void {
    this.disponibilidad.liberarRetencionActiva();
    this.detenerTemporizadores();
  }

  private detenerTemporizadores(limpiarProceso = true): void {
    clearInterval(this.temporizadorReserva);
    clearInterval(this.temporizadorExtension);
    this.temporizadorReserva = undefined;
    this.temporizadorExtension = undefined;
    this.mostrarExtension.set(false);
    this.cuentaExtensionSeg.set(SEGUNDOS_RESPUESTA_EXTENSION);
    if (limpiarProceso) {
      this.reservaExpiraEn.set(null);
      this.tiempoReservaSeg.set(0);
      this.limpiarProcesoReservaGuardado();
    }
  }

  private guardarProcesoReserva(expiraEn: number): void {
    try {
      sessionStorage.setItem(CLAVE_PROCESO_RESERVA, String(expiraEn));
    } catch {
      // Si el navegador bloquea sessionStorage, el prototipo sigue funcionando en memoria.
    }
  }

  private limpiarProcesoReservaGuardado(): void {
    try {
      sessionStorage.removeItem(CLAVE_PROCESO_RESERVA);
    } catch {
      // No rompemos el flujo si el navegador restringe el almacenamiento.
    }
  }
}
