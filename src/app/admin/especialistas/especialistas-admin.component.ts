import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CITAS, ESPECIALISTAS, HOY_ISO, LOCALES, TRATAMIENTOS, soles } from '../../data/datos';
import { Especialista } from '../../data/modelos';

function especialistaVacia(): Especialista {
  return {
    id: 0,
    nombre: '',
    apellido: '',
    especialidad: '',
    colegiatura: '',
    bio: '',
    foto: 'img/esp-1.jpg',
    locales: [1],
    tratamientos: [1],
    horario: 'Lunes a sábado · 09:00 a 18:00',
    activa: true
  };
}

@Component({
  selector: 'app-especialistas-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Especialistas</h1>
        <p>Equipo profesional, sedes asignadas, tratamientos habilitados y carga de trabajo.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--vino btn--sm" (click)="nueva()">Nueva especialista</button>
      </div>
    </div>

    @if (mostrarFormulario()) {
      <div class="tabla-panel panel-form">
        <div class="tabla-panel__cabecera">
          <h3>{{ borrador().id ? 'Editar especialista' : 'Nueva especialista' }}</h3>
          <button class="boton-icono" (click)="cerrar()">Cancelar</button>
        </div>
        <form class="esp-form" (ngSubmit)="guardar()">
          <div class="esp-form__foto">
            <img [src]="borrador().foto" [alt]="borrador().nombre || 'Especialista'">
            <label class="btn btn--linea btn--sm">
              Subir foto
              <input type="file" accept="image/*" (change)="cargarFoto($event)" hidden>
            </label>
          </div>
          <div class="campo"><label>Nombres</label><input required [ngModel]="borrador().nombre" (ngModelChange)="editar('nombre', $event)" name="nombre"></div>
          <div class="campo"><label>Apellidos</label><input required [ngModel]="borrador().apellido" (ngModelChange)="editar('apellido', $event)" name="apellido"></div>
          <div class="campo"><label>Especialidad</label><input [ngModel]="borrador().especialidad" (ngModelChange)="editar('especialidad', $event)" name="especialidad"></div>
          <div class="campo"><label>Colegiatura / código</label><input [ngModel]="borrador().colegiatura" (ngModelChange)="editar('colegiatura', $event)" name="colegiatura"></div>
          <div class="campo"><label>Horario visible</label><input [ngModel]="borrador().horario" (ngModelChange)="editar('horario', $event)" name="horario"></div>
          <div class="campo esp-form__ancho"><label>Bio / notas internas</label><textarea rows="3" [ngModel]="borrador().bio" (ngModelChange)="editar('bio', $event)" name="bio"></textarea></div>
          <div class="selector-lista">
            <span class="dato__label">Sedes donde atiende</span>
            @for (l of locales; track l.id) {
              <label><input type="checkbox" [checked]="borrador().locales.includes(l.id)" (change)="alternarLocal(l.id)"> {{ l.nombre }}</label>
            }
          </div>
          <div class="selector-lista esp-form__ancho">
            <span class="dato__label">Tratamientos habilitados</span>
            <div class="checks-grid">
              @for (t of tratamientosCatalogo; track t.id) {
                <label><input type="checkbox" [checked]="borrador().tratamientos.includes(t.id)" (change)="alternarTratamiento(t.id)"> {{ t.nombre }}</label>
              }
            </div>
          </div>
          <label class="check"><input type="checkbox" [ngModel]="borrador().activa" (ngModelChange)="editar('activa', $event)" name="activa"> Activa para agenda</label>
          <button class="btn btn--vino btn--sm" type="submit" [disabled]="!borrador().nombre || !borrador().apellido">Guardar especialista</button>
        </form>
      </div>
    }

    <div class="grid-esp">
      @for (e of especialistas(); track e.id) {
        <article class="panel tarjeta-esp-admin">
          <header>
            <img class="img-cobertura" [src]="e.foto" [alt]="e.nombre">
            <div>
              <h3>{{ e.nombre }} {{ e.apellido }}</h3>
              <span class="dato__label">{{ e.especialidad }}</span>
              <span [class]="e.activa ? 'chip chip--ok chip--punto' : 'chip chip--error chip--punto'">
                {{ e.activa ? 'Activa' : 'Inactiva' }}
              </span>
            </div>
          </header>

          <div class="tarjeta-esp-admin__datos">
            <div><span class="dato__label">Colegiatura</span><span>{{ e.colegiatura || 'Sin dato' }}</span></div>
            <div><span class="dato__label">Horario</span><span>{{ e.horario }}</span></div>
            <div><span class="dato__label">Sedes</span><span>{{ sedes(e.locales) }}</span></div>
          </div>

          <div class="tarjeta-esp-admin__metricas">
            <div><strong>{{ citasHoy(e.id) }}</strong><span>Citas hoy</span></div>
            <div><strong>{{ citasMes(e.id) }}</strong><span>Citas del mes</span></div>
            <div><strong>{{ soles(ingresos(e.id)) }}</strong><span>Ingresos cobrados del mes</span></div>
          </div>

          <div class="tarjeta-esp-admin__trats">
            <span class="dato__label">Tratamientos habilitados</span>
            <div class="etiquetas">
              @for (t of tratamientos(e.tratamientos); track t) { <span class="chip">{{ t }}</span> }
            </div>
          </div>

          <div class="acciones-fila" style="justify-content:flex-start">
            <button class="boton-icono" (click)="editarEspecialista(e)">Editar perfil</button>
            <button class="boton-icono" (click)="alternarActiva(e)">{{ e.activa ? 'Desactivar' : 'Activar' }}</button>
          </div>
        </article>
      }
    </div>
  `,
  styles: [`
    .panel-form { margin-bottom: 22px; }
    .esp-form { display: grid; grid-template-columns: 150px repeat(3, minmax(150px, 1fr)); gap: 14px; padding: 20px 22px 24px; align-items: end; }
    .esp-form__foto { grid-row: span 3; display: grid; gap: 10px; align-content: start; }
    .esp-form__foto img { width: 126px; height: 126px; object-fit: cover; border-radius: 50%; border: 1px solid var(--linea); background: var(--rosa-50); }
    .esp-form__ancho { grid-column: 2 / -1; }
    .selector-lista { display: grid; gap: 8px; align-content: start; color: var(--gris); font-size: .86rem; }
    .checks-grid { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 8px 14px; }
    .check { display: flex; gap: 8px; align-items: center; color: var(--gris); font-size: .86rem; }
    .grid-esp { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
    .tarjeta-esp-admin header { display: flex; gap: 16px; align-items: center; margin-bottom: 20px; }
    .tarjeta-esp-admin header img { width: 68px; height: 68px; border-radius: 50%; object-fit: cover; }
    .tarjeta-esp-admin header h3 { margin: 0 0 2px; font-size: 1.25rem; }
    .tarjeta-esp-admin header .chip { margin-top: 8px; }
    .tarjeta-esp-admin__datos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding-bottom: 16px; border-bottom: 1px dashed var(--linea); }
    .tarjeta-esp-admin__datos div { display: flex; flex-direction: column; gap: 2px; }
    .tarjeta-esp-admin__datos span:last-child { font-size: .85rem; color: var(--tinta); }
    .tarjeta-esp-admin__metricas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding: 16px 0; }
    .tarjeta-esp-admin__metricas div { display: flex; flex-direction: column; }
    .tarjeta-esp-admin__metricas strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.6rem; color: var(--vino); }
    .tarjeta-esp-admin__metricas span { font-size: .7rem; color: var(--gris-claro); letter-spacing: .08em; }
    .tarjeta-esp-admin__trats { margin-bottom: 18px; }
    .etiquetas { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    @media (max-width: 1200px) {
      .grid-esp { grid-template-columns: 1fr; }
      .tarjeta-esp-admin__datos { grid-template-columns: 1fr; }
      .esp-form { grid-template-columns: 1fr 1fr; }
      .esp-form__foto, .esp-form__ancho { grid-column: 1 / -1; }
    }
    @media (max-width: 720px) { .esp-form, .checks-grid { grid-template-columns: 1fr; } }
  `]
})
export class EspecialistasAdminComponent {
  soles = soles;
  locales = LOCALES;
  tratamientosCatalogo = TRATAMIENTOS;
  especialistas = signal(ESPECIALISTAS.map(e => ({ ...e, locales: [...e.locales], tratamientos: [...e.tratamientos] })));
  mostrarFormulario = signal(false);
  borrador = signal<Especialista>(especialistaVacia());
  private mes = HOY_ISO.slice(0, 7);

  nueva(): void {
    this.borrador.set(especialistaVacia());
    this.mostrarFormulario.set(true);
  }

  editarEspecialista(e: Especialista): void {
    this.borrador.set({ ...e, locales: [...e.locales], tratamientos: [...e.tratamientos] });
    this.mostrarFormulario.set(true);
  }

  cerrar(): void {
    this.borrador.set(especialistaVacia());
    this.mostrarFormulario.set(false);
  }

  editar<K extends keyof Especialista>(campo: K, valor: Especialista[K]): void {
    this.borrador.update(e => ({ ...e, [campo]: valor }));
  }

  guardar(): void {
    const e = this.borrador();
    this.especialistas.update(lista => e.id
      ? lista.map(item => item.id === e.id ? { ...e } : item)
      : [{ ...e, id: lista.reduce((max, item) => Math.max(max, item.id), 0) + 1 }, ...lista]);
    this.cerrar();
  }

  alternarActiva(e: Especialista): void {
    this.especialistas.update(lista => lista.map(item => item.id === e.id ? { ...item, activa: !item.activa } : item));
  }

  alternarLocal(id: number): void {
    this.borrador.update(e => ({
      ...e,
      locales: e.locales.includes(id) ? e.locales.filter(item => item !== id) : [...e.locales, id]
    }));
  }

  alternarTratamiento(id: number): void {
    this.borrador.update(e => ({
      ...e,
      tratamientos: e.tratamientos.includes(id) ? e.tratamientos.filter(item => item !== id) : [...e.tratamientos, id]
    }));
  }

  cargarFoto(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) { return; }
    const lector = new FileReader();
    lector.onload = () => this.editar('foto', String(lector.result || ''));
    lector.readAsDataURL(archivo);
  }

  sedes(ids: number[]): string {
    return ids.map(id => LOCALES.find(l => l.id === id)?.nombre ?? '').filter(Boolean).join(' · ');
  }

  tratamientos(ids: number[]): string[] {
    return ids.map(id => TRATAMIENTOS.find(t => t.id === id)?.nombre ?? '').filter(Boolean);
  }

  citasHoy(id: number): number {
    return CITAS.filter(c => c.especialistaId === id && c.fecha === HOY_ISO).length;
  }

  citasMes(id: number): number {
    return CITAS.filter(c => c.especialistaId === id && c.fecha.slice(0, 7) === this.mes).length;
  }

  ingresos(id: number): number {
    return CITAS.filter(c => c.especialistaId === id && c.fecha.slice(0, 7) === this.mes)
      .reduce((t, c) => t + c.montoPagado, 0);
  }
}
