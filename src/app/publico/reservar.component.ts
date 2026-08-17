import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ESPECIALISTAS, HABITACIONES, LOCALES, TRATAMIENTOS, formatoFechaLarga, soles
} from '../data/datos';
import { Especialista, Local, Tratamiento } from '../data/modelos';
import { DisponibilidadService, Slot } from '../compartido/disponibilidad.service';
import { SesionService } from '../compartido/sesion.service';

@Component({
  selector: 'app-reservar',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './reservar.component.html',
  styleUrl: './reservar.component.scss'
})
export class ReservarComponent implements OnDestroy {
  private disponibilidad = inject(DisponibilidadService);
  private ruta = inject(ActivatedRoute);
  readonly sesion = inject(SesionService);

  soles = soles;
  formatoFechaLarga = formatoFechaLarga;

  locales = LOCALES;
  tratamientos = TRATAMIENTOS.filter(t => t.activo);
  dias = this.disponibilidad.proximosDias(14);

  paso = signal(1);
  local = signal<Local | null>(null);
  tratamiento = signal<Tratamiento | null>(null);
  especialista = signal<Especialista | null>(null);
  cualquierEspecialista = signal(false);
  fecha = signal<string>(this.dias[0].iso);
  slot = signal<Slot | null>(null);
  confirmado = signal(false);
  segundos = signal(600);
  private temporizador?: ReturnType<typeof setInterval>;

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
    { n: 3, titulo: 'Especialista' },
    { n: 4, titulo: 'Fecha y hora' },
    { n: 5, titulo: 'Tus datos' },
    { n: 6, titulo: 'Pago' }
  ];

  especialistasDisponibles = computed<Especialista[]>(() => {
    const l = this.local();
    const t = this.tratamiento();
    if (!l || !t) { return []; }
    return ESPECIALISTAS.filter(e => e.activa && e.locales.includes(l.id) && e.tratamientos.includes(t.id));
  });

  slots = computed<Slot[]>(() => {
    const l = this.local();
    const t = this.tratamiento();
    if (!l || !t) { return []; }
    return this.disponibilidad.slots(
      this.fecha(), l, t, this.especialistasDisponibles(), this.especialista()
    );
  });

  cabinaAsignada = computed(() => {
    const id = this.slot()?.habitacionId;
    return HABITACIONES.find(h => h.id === id) ?? null;
  });

  especialistaAsignada = computed<Especialista | null>(() => {
    if (this.especialista()) { return this.especialista(); }
    const id = this.slot()?.especialistaId;
    return ESPECIALISTAS.find(e => e.id === id) ?? null;
  });

  bloqueoTotal = computed(() => {
    const t = this.tratamiento();
    return t ? t.duracionMin + t.limpiezaMin : 0;
  });

  datosCompletos(): boolean {
    return !!(this.nombre && this.apellido && this.dni && this.celular);
  }

  cuentaRegresiva = computed(() => {
    const s = this.segundos();
    return `${`${Math.floor(s / 60)}`.padStart(2, '0')}:${`${s % 60}`.padStart(2, '0')}`;
  });

  constructor() {
    const q = this.ruta.snapshot.queryParamMap;
    const localId = Number(q.get('local'));
    const tratId = Number(q.get('tratamiento'));
    const espId = Number(q.get('especialista'));

    if (localId) { this.local.set(LOCALES.find(l => l.id === localId) ?? null); }
    if (tratId) { this.tratamiento.set(TRATAMIENTOS.find(t => t.id === tratId) ?? null); }
    if (espId) {
      const e = ESPECIALISTAS.find(x => x.id === espId) ?? null;
      this.especialista.set(e);
      if (e && !this.local()) { this.local.set(LOCALES.find(l => l.id === e.locales[0]) ?? null); }
    }
    if (this.local() && this.tratamiento()) { this.paso.set(this.especialista() ? 4 : 3); }
    else if (this.local()) { this.paso.set(2); }
  }

  ngOnDestroy(): void {
    this.detenerTemporizador();
  }

  elegirLocal(l: Local): void {
    this.local.set(l);
    this.especialista.set(null);
    this.slot.set(null);
    this.paso.set(2);
  }

  elegirTratamiento(t: Tratamiento): void {
    this.tratamiento.set(t);
    this.especialista.set(null);
    this.slot.set(null);
    this.paso.set(3);
  }

  elegirEspecialista(e: Especialista | null): void {
    this.especialista.set(e);
    this.cualquierEspecialista.set(e === null);
    this.slot.set(null);
    this.paso.set(4);
  }

  elegirFecha(iso: string): void {
    this.fecha.set(iso);
    this.slot.set(null);
    this.detenerTemporizador();
  }

  elegirSlot(s: Slot): void {
    if (!s.disponible) { return; }
    this.slot.set(s);
    this.iniciarTemporizador();
  }

  private iniciarTemporizador(): void {
    this.detenerTemporizador();
    this.segundos.set(600);
    this.temporizador = setInterval(() => {
      const restante = this.segundos() - 1;
      if (restante <= 0) {
        this.segundos.set(0);
        this.slot.set(null);
        this.detenerTemporizador();
      } else {
        this.segundos.set(restante);
      }
    }, 1000);
  }

  private detenerTemporizador(): void {
    if (this.temporizador) { clearInterval(this.temporizador); this.temporizador = undefined; }
  }

  irA(n: number): void {
    if (n < this.paso()) { this.paso.set(n); }
  }

  siguiente(): void { this.paso.set(Math.min(this.paso() + 1, 6)); }
  anterior(): void { this.paso.set(Math.max(this.paso() - 1, 1)); }

  confirmar(): void {
    this.confirmado.set(true);
    this.detenerTemporizador();
  }

  reiniciar(): void {
    this.confirmado.set(false);
    this.paso.set(1);
    this.local.set(null);
    this.tratamiento.set(null);
    this.especialista.set(null);
    this.slot.set(null);
    const u = this.sesion.usuario();
    this.nombre = u?.nombre ?? '';
    this.apellido = u?.apellido ?? '';
    this.dni = u?.dni ?? '';
    this.celular = u?.celular ?? '';
    this.correo = u?.correo ?? '';
    this.observaciones = '';
  }
}
