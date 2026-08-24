import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ETIQUETAS_TRATAMIENTO, LOCALES, TRATAMIENTOS, formatoFechaLarga, soles
} from '../../data/datos';
import { CategoriaTratamiento, Local, Promocion, Tratamiento } from '../../data/modelos';
import { Bloque, DisponibilidadService } from '../../compartido/disponibilidad.service';
import { SesionService } from '../../compartido/sesion.service';
import { PromocionesService } from '../../compartido/promociones.service';
import { PagosOnlineService } from '../../compartido/pagos-online.service';
import { RedesEnlacesComponent } from '../../compartido/redes-enlaces.component';
import { RedesService } from '../../compartido/redes.service';

const CATEGORIAS: (CategoriaTratamiento | 'Todos')[] = [
  'Todos', 'Facial', 'Corporal', 'Aparatología', 'Medicina estética'
];

@Component({
  selector: 'app-reservar',
  standalone: true,
  imports: [RouterLink, FormsModule, RedesEnlacesComponent],
  templateUrl: './reservar.component.html',
  styleUrl: './reservar.component.scss'
})
export class ReservarComponent {
  private disponibilidad = inject(DisponibilidadService);
  private ruta = inject(ActivatedRoute);
  readonly sesion = inject(SesionService);
  private promociones = inject(PromocionesService);
  private pagosOnline = inject(PagosOnlineService);
  readonly redes = inject(RedesService);

  soles = soles;
  formatoFechaLarga = formatoFechaLarga;

  locales = LOCALES;
  categorias = CATEGORIAS;
  etiquetas = ETIQUETAS_TRATAMIENTO;
  dias = this.disponibilidad.proximosDias(14);

  paso = signal(1);
  local = signal<Local | null>(null);
  tratamiento = signal<Tratamiento | null>(null);
  promocion = signal<Promocion | null>(null);
  categoria = signal<CategoriaTratamiento | 'Todos'>('Todos');
  etiqueta = signal<string>('Todas');
  busqueda = signal('');
  fecha = signal<string>(this.dias[0].iso);
  bloque = signal<Bloque | null>(null);
  confirmado = signal(false);
  procesandoPago = signal(false);
  mensajePago = signal('');
  codigoOperacion = signal<string | null>(null);
  codigoReserva = signal('CT-1042');
  tiempoReservaSeg = signal(0);
  mostrarExtension = signal(false);
  cuentaExtensionSeg = signal(30);
  avisoReserva = signal('');
  private temporizadorReserva?: ReturnType<typeof setInterval>;
  private temporizadorExtension?: ReturnType<typeof setInterval>;

  // Datos de la paciente: se precargan si hay una sesión iniciada.
  nombre = this.sesion.usuario()?.nombre ?? '';
  apellido = this.sesion.usuario()?.apellido ?? '';
  dni = this.sesion.usuario()?.dni ?? '';
  celular = this.sesion.usuario()?.celular ?? '';
  correo = this.sesion.usuario()?.correo ?? '';
  observaciones = '';
  metodoPago: 'Izipay' | 'Local' = 'Izipay';

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
        return total + (t?.duracionMin ?? 0);
      }, 0) || this.tratamiento()?.duracionMin || 0;
    }
    const t = this.tratamiento();
    return t ? t.duracionMin : 0;
  });

  totalReserva = computed(() => this.promocion()?.precio ?? this.tratamiento()?.precio ?? 0);

  nombreReserva = computed(() => this.promocion()?.titulo ?? this.tratamiento()?.nombre ?? '—');

  sesionesPromo = computed(() => this.promocion()?.sesionesDetalle ?? []);

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
        const tratamientoId = promo.sesionesDetalle?.find(s => !!s.tratamientoId)?.tratamientoId;
        const tratamiento = tratamientoId ? TRATAMIENTOS.find(t => t.id === tratamientoId) : undefined;
        if (tratamiento) {
          this.tratamiento.set(tratamiento);
          this.categoria.set(tratamiento.categoria);
        }
      }
    }

    if (localId) { this.local.set(LOCALES.find(l => l.id === localId) ?? null); }
    if (tratId) { this.tratamiento.set(TRATAMIENTOS.find(t => t.id === tratId) ?? null); }
    if (this.local() && (this.tratamiento() || this.promocion())) { this.paso.set(3); }
    else if (this.local()) { this.paso.set(this.promocion() ? 3 : 2); }
  }

  elegirLocal(l: Local): void {
    this.disponibilidad.liberarRetencionActiva();
    this.detenerTemporizadores();
    this.local.set(l);
    this.bloque.set(null);
    this.avisoReserva.set('');
    this.paso.set(this.promocion() ? 3 : 2);
  }

  elegirTratamiento(t: Tratamiento): void {
    this.disponibilidad.liberarRetencionActiva();
    this.detenerTemporizadores();
    this.tratamiento.set(t);
    this.promocion.set(null);
    this.bloque.set(null);
    this.avisoReserva.set('');
    this.paso.set(3);
  }

  elegirCategoria(c: CategoriaTratamiento | 'Todos'): void {
    this.categoria.set(c);
    this.etiqueta.set('Todas');
  }

  elegirEtiqueta(e: string): void {
    this.etiqueta.set(this.etiqueta() === e ? 'Todas' : e);
  }

  elegirFecha(iso: string): void {
    this.disponibilidad.liberarRetencionActiva();
    this.detenerTemporizadores();
    this.fecha.set(iso);
    this.bloque.set(null);
    this.avisoReserva.set('');
  }

  elegirBloque(b: Bloque): void {
    if (!b.disponible) { return; }
    const l = this.local();
    if (!l) { return; }
    const retencion = this.disponibilidad.retenerBloque(this.fecha(), l, b, 8);
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
        this.disponibilidad.liberarRetencionActiva();
        this.detenerTemporizadores();
        this.bloque.set(null);
      }
      this.paso.set(n);
    }
  }

  siguiente(): void {
    const actual = this.paso();
    this.paso.set(this.promocion() && actual === 1 ? 3 : Math.min(actual + 1, 5));
  }

  anterior(): void {
    const actual = this.paso();
    const siguiente = this.promocion() && actual === 3 ? 1 : Math.max(actual - 1, 1);
    if (siguiente < 3) {
      this.disponibilidad.liberarRetencionActiva();
      this.detenerTemporizadores();
      this.bloque.set(null);
    }
    this.paso.set(siguiente);
  }

  confirmar(): void {
    if (!this.bloque()) {
      this.avisoReserva.set('Tu bloque de atención ya no está retenido. Elige otra hora para continuar.');
      this.paso.set(3);
      return;
    }
    if (this.metodoPago === 'Izipay') {
      this.procesarPagoOnline();
      return;
    }
    this.disponibilidad.confirmarRetencionActiva();
    this.detenerTemporizadores();
    this.codigoOperacion.set(null);
    this.confirmado.set(true);
  }

  reiniciar(): void {
    this.disponibilidad.liberarRetencionActiva();
    this.detenerTemporizadores();
    this.confirmado.set(false);
    this.paso.set(1);
    this.local.set(null);
    this.tratamiento.set(null);
    this.promocion.set(null);
    this.bloque.set(null);
    this.categoria.set('Todos');
    this.etiqueta.set('Todas');
    this.busqueda.set('');
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
    const extendida = this.disponibilidad.extenderRetencionActiva(5);
    if (!extendida.ok || !extendida.expiraEn) {
      this.cerrarReservaPorTiempo();
      return;
    }
    this.mostrarExtension.set(false);
    this.cuentaExtensionSeg.set(30);
    this.avisoReserva.set('Tu hora quedó retenida 5 minutos más para que termines la reserva.');
    this.iniciarTemporizadorReserva(extendida.expiraEn);
  }

  cancelarExtensionReserva(): void {
    this.cerrarReservaPorTiempo();
  }

  whatsappReserva(): string {
    const promo = this.promocion();
    const t = this.tratamiento();
    const detalle = promo ? `la promocion ${promo.titulo}` : `el tratamiento ${t?.nombre ?? ''}`;
    const texto = `Hola, quiero reservar ${detalle}. Mi nombre es ${this.nombre || ''} ${this.apellido || ''}.`;
    return `https://wa.me/51945189720?text=${encodeURIComponent(texto)}`;
  }

  private procesarPagoOnline(): void {
    if (this.procesandoPago()) { return; }
    this.procesandoPago.set(true);
    this.mensajePago.set('Preparando pago seguro con Izipay...');

    this.pagosOnline.iniciarPago({
      tipo: 'Cita',
      referencia: this.codigoReserva(),
      descripcion: `Reserva ${this.nombreReserva()}`,
      monto: this.totalReserva(),
      moneda: 'PEN',
      localId: this.local()?.id,
      cliente: {
        nombre: this.nombre,
        apellido: this.apellido,
        dni: this.dni,
        celular: this.celular,
        correo: this.correo
      },
      items: [{
        id: this.promocion()?.id ? `PROMO-${this.promocion()?.id}` : this.tratamiento()?.id ?? 'TRAT',
        nombre: this.nombreReserva(),
        cantidad: 1,
        precioUnitario: this.totalReserva()
      }],
      metadata: {
        fecha: this.fecha(),
        hora: this.bloque()?.inicio ?? null,
        promocionId: this.promocion()?.id ?? null,
        tratamientoId: this.tratamiento()?.id ?? null
      }
    }).subscribe({
      next: resultado => {
        this.procesandoPago.set(false);
        this.mensajePago.set(resultado.mensaje);
        if (resultado.aprobado) {
          this.disponibilidad.confirmarRetencionActiva();
          this.detenerTemporizadores();
          this.codigoOperacion.set(resultado.codigoOperacion ?? null);
          this.confirmado.set(true);
        }
      },
      error: () => {
        this.procesandoPago.set(false);
        this.mensajePago.set('No se pudo iniciar el pago online. Puedes intentar otra vez o pagar en el local.');
      }
    });
  }

  private iniciarTemporizadorReserva(expiraEn: number): void {
    this.detenerTemporizadores();
    this.actualizarTiempoReserva(expiraEn);
    this.temporizadorReserva = setInterval(() => {
      this.actualizarTiempoReserva(expiraEn);
    }, 1000);
  }

  private actualizarTiempoReserva(expiraEn: number): void {
    const restante = Math.max(0, Math.ceil((expiraEn - Date.now()) / 1000));
    this.tiempoReservaSeg.set(restante);
    if (restante > 0) {
      return;
    }
    this.mostrarExtension.set(true);
    this.cuentaExtensionSeg.set(30);
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
    this.disponibilidad.liberarRetencionActiva();
    this.detenerTemporizadores();
    this.bloque.set(null);
    this.paso.set(3);
    this.avisoReserva.set('Tu tiempo para completar la reserva terminó y la hora volvió a quedar disponible.');
  }

  private detenerTemporizadores(): void {
    clearInterval(this.temporizadorReserva);
    clearInterval(this.temporizadorExtension);
    this.temporizadorReserva = undefined;
    this.temporizadorExtension = undefined;
    this.mostrarExtension.set(false);
    this.cuentaExtensionSeg.set(30);
    this.tiempoReservaSeg.set(0);
  }
}
