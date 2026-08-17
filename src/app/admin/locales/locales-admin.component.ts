import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MapaSedeComponent } from '../../compartido/mapa-sede.component';
import { CITAS, ESPECIALISTAS, HABITACIONES, HOY_ISO, LOCALES, soles } from '../../data/datos';
import { Habitacion, Local } from '../../data/modelos';

function localVacio(): Local {
  return {
    id: 0,
    uuidGlobal: `loc-${Date.now()}`,
    nombre: '',
    direccion: '',
    referencia: '',
    distrito: 'San Juan de Lurigancho, Lima',
    telefono: '945 189 720',
    horario: [{ dias: 'Todos los días', apertura: '08:00', cierre: '22:00' }],
    imagen: 'img/local-1.jpg',
    mapa: 'https://www.google.com/maps',
    latitud: -12.0042,
    longitud: -77.0119,
    activo: true
  };
}

function cabinaVacia(localId: number): Habitacion {
  return { id: 0, nombre: 'Cabina nueva', localId, equipamiento: '', activa: true };
}

@Component({
  selector: 'app-locales-admin',
  standalone: true,
  imports: [FormsModule, MapaSedeComponent],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Locales y cabinas</h1>
        <p>Sedes, horarios y cabinas disponibles para ordenar la agenda sin volverla complicada.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--linea btn--sm" (click)="nuevaCabina()">Nueva cabina</button>
        <button class="btn btn--vino btn--sm" (click)="nuevoLocal()">Nuevo local</button>
      </div>
    </div>

    @if (mostrarLocal()) {
      <div class="tabla-panel panel-form">
        <div class="tabla-panel__cabecera">
          <h3>{{ localForm().id ? 'Editar local' : 'Nuevo local' }}</h3>
          <button class="boton-icono" (click)="mostrarLocal.set(false)">Cancelar</button>
        </div>
        <form class="local-form" (ngSubmit)="guardarLocal()">
          <div class="campo"><label>Nombre visible</label><input required [ngModel]="localForm().nombre" (ngModelChange)="editarLocal('nombre', $event)" name="nombre"></div>
          <div class="campo"><label>Dirección</label><input required [ngModel]="localForm().direccion" (ngModelChange)="editarLocal('direccion', $event)" name="direccion"></div>
          <div class="campo"><label>Referencia</label><input [ngModel]="localForm().referencia" (ngModelChange)="editarLocal('referencia', $event)" name="referencia"></div>
          <div class="campo"><label>Distrito</label><input [ngModel]="localForm().distrito" (ngModelChange)="editarLocal('distrito', $event)" name="distrito"></div>
          <div class="campo"><label>Teléfono / WhatsApp</label><input [ngModel]="localForm().telefono" (ngModelChange)="editarLocal('telefono', $event)" name="telefono"></div>
          <div class="campo"><label>Apertura</label><input type="time" [ngModel]="localForm().horario[0].apertura" (ngModelChange)="editarHorario('apertura', $event)" name="apertura"></div>
          <div class="campo"><label>Cierre</label><input type="time" [ngModel]="localForm().horario[0].cierre" (ngModelChange)="editarHorario('cierre', $event)" name="cierre"></div>
          <div class="campo"><label>Latitud</label><input type="number" step="0.000001" [ngModel]="localForm().latitud" (ngModelChange)="editarLocal('latitud', Number($event))" name="latitud"></div>
          <div class="campo"><label>Longitud</label><input type="number" step="0.000001" [ngModel]="localForm().longitud" (ngModelChange)="editarLocal('longitud', Number($event))" name="longitud"></div>
          <label class="check"><input type="checkbox" [ngModel]="localForm().activo" (ngModelChange)="editarLocal('activo', $event)" name="activo"> Local operativo</label>
          <button class="btn btn--vino btn--sm" type="submit" [disabled]="!localForm().nombre || !localForm().direccion">Guardar local</button>
        </form>
      </div>
    }

    @if (mostrarCabina()) {
      <div class="tabla-panel panel-form">
        <div class="tabla-panel__cabecera">
          <h3>{{ cabinaForm().id ? 'Editar cabina' : 'Nueva cabina' }}</h3>
          <button class="boton-icono" (click)="mostrarCabina.set(false)">Cancelar</button>
        </div>
        <form class="cabina-form" (ngSubmit)="guardarCabina()">
          <div class="campo">
            <label>Local</label>
            <select [ngModel]="cabinaForm().localId" (ngModelChange)="editarCabina('localId', Number($event))" name="localId">
              @for (l of locales(); track l.id) { <option [value]="l.id">{{ l.nombre }}</option> }
            </select>
          </div>
          <div class="campo"><label>Nombre de cabina</label><input required [ngModel]="cabinaForm().nombre" (ngModelChange)="editarCabina('nombre', $event)" name="nombreCabina"></div>
          <div class="campo cabina-form__ancho"><label>Equipamiento</label><input [ngModel]="cabinaForm().equipamiento" (ngModelChange)="editarCabina('equipamiento', $event)" name="equipamiento"></div>
          <label class="check"><input type="checkbox" [ngModel]="cabinaForm().activa" (ngModelChange)="editarCabina('activa', $event)" name="activa"> Habilitada para atención</label>
          <button class="btn btn--vino btn--sm" type="submit" [disabled]="!cabinaForm().nombre">Guardar cabina</button>
        </form>
      </div>
    }

    @for (l of locales(); track l.id) {
      <section class="panel local">
        <header class="local__cabecera">
          <div>
            <h3>{{ l.nombre }}</h3>
            <p>{{ l.direccion }} · {{ l.referencia }} · {{ l.distrito }}</p>
            <p class="local__coords">Coordenadas: {{ l.latitud }}, {{ l.longitud }}</p>
          </div>
          <div class="local__acciones">
            <span [class]="l.activo ? 'chip chip--ok chip--punto' : 'chip chip--error chip--punto'">
              {{ l.activo ? 'Operativo' : 'Cerrado' }}
            </span>
            <button class="boton-icono" (click)="editarLocalExistente(l)">Editar datos</button>
            <button class="boton-icono" (click)="crearCabina(l.id)">Agregar cabina</button>
          </div>
        </header>

        <div class="local__metricas">
          <div><strong>{{ cabinas(l.id).length }}</strong><span>Cabinas</span></div>
          <div><strong>{{ especialistas(l.id) }}</strong><span>Especialistas asignadas</span></div>
          <div><strong>{{ citasHoy(l.id) }}</strong><span>Citas hoy</span></div>
          <div><strong>{{ soles(ingresosMes(l.id)) }}</strong><span>Ingresos cobrados del mes</span></div>
          <div><strong>{{ ocupacion(l.id) }} %</strong><span>Uso de cabinas hoy</span></div>
        </div>

        <div class="local__columnas">
          <div>
            <span class="dato__label">Ubicación</span>
            <app-mapa-sede [local]="l" />

            <span class="dato__label" style="margin-top:20px;display:block">Horario de atención</span>
            <table class="tabla tabla--simple">
              <tbody>
                @for (h of l.horario; track h.dias) {
                  <tr>
                    <td>{{ h.dias }}</td>
                    <td class="num">{{ h.apertura }} - {{ h.cierre }}</td>
                    <td class="num"><button class="boton-icono" (click)="editarLocalExistente(l)">Cambiar</button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div>
            <span class="dato__label">Cabinas</span>
            <table class="tabla tabla--simple">
              <thead><tr><th>Cabina</th><th>Equipamiento</th><th class="num">Citas hoy</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                @for (c of cabinas(l.id); track c.id) {
                  <tr>
                    <td><strong>{{ c.nombre }}</strong></td>
                    <td>{{ c.equipamiento }}</td>
                    <td class="num">{{ citasCabina(c.id) }}</td>
                    <td>
                      <span [class]="c.activa ? 'chip chip--ok chip--punto' : 'chip chip--alerta chip--punto'">
                        {{ c.activa ? 'Habilitada' : 'En mantenimiento' }}
                      </span>
                    </td>
                    <td class="num"><button class="boton-icono" (click)="editarCabinaExistente(c)">Editar</button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    .panel-form { margin-bottom: 22px; }
    .local-form, .cabina-form { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 14px; padding: 20px 22px 24px; align-items: end; }
    .cabina-form__ancho { grid-column: span 2; }
    .check { display: flex; gap: 8px; align-items: center; color: var(--gris); font-size: .86rem; }
    .local { margin-bottom: 20px; }
    .local__cabecera { display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; align-items: flex-start; }
    .local__cabecera h3 { margin: 0 0 4px; }
    .local__cabecera p { margin: 0; font-size: .88rem; }
    .local__coords { margin-top: 4px !important; font-size: .78rem !important; color: var(--gris-claro); }
    .local__acciones { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .local__metricas { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin: 22px 0; padding: 18px 0; border-top: 1px dashed var(--linea); border-bottom: 1px dashed var(--linea); }
    .local__metricas div { display: flex; flex-direction: column; }
    .local__metricas strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.7rem; color: var(--vino); }
    .local__metricas span { font-size: .7rem; color: var(--gris-claro); letter-spacing: .08em; }
    .local__columnas { display: grid; grid-template-columns: .8fr 1.4fr; gap: 30px; }
    .tabla--simple { margin-top: 10px; }
    .tabla--simple td, .tabla--simple th { padding: 9px 10px; }
    @media (max-width: 1200px) {
      .local__metricas { grid-template-columns: repeat(2, 1fr); }
      .local__columnas, .local-form, .cabina-form { grid-template-columns: 1fr; }
      .cabina-form__ancho { grid-column: auto; }
    }
  `]
})
export class LocalesAdminComponent {
  Number = Number;
  soles = soles;
  locales = signal(LOCALES.map(l => ({ ...l, horario: l.horario.map(h => ({ ...h })) })));
  habitaciones = signal(HABITACIONES.map(h => ({ ...h })));
  mostrarLocal = signal(false);
  mostrarCabina = signal(false);
  localForm = signal<Local>(localVacio());
  cabinaForm = signal<Habitacion>(cabinaVacia(1));
  private mes = HOY_ISO.slice(0, 7);

  nuevoLocal(): void {
    this.localForm.set(localVacio());
    this.mostrarLocal.set(true);
  }

  editarLocalExistente(local: Local): void {
    this.localForm.set({ ...local, horario: local.horario.map(h => ({ ...h })) });
    this.mostrarLocal.set(true);
  }

  guardarLocal(): void {
    const local = this.localForm();
    this.locales.update(lista => local.id
      ? lista.map(item => item.id === local.id ? { ...local } : item)
      : [{ ...local, id: lista.reduce((max, item) => Math.max(max, item.id), 0) + 1 }, ...lista]);
    this.mostrarLocal.set(false);
  }

  editarLocal<K extends keyof Local>(campo: K, valor: Local[K]): void {
    this.localForm.update(local => ({ ...local, [campo]: valor }));
  }

  editarHorario(campo: 'apertura' | 'cierre', valor: string): void {
    this.localForm.update(local => ({
      ...local,
      horario: [{ ...local.horario[0], [campo]: valor }]
    }));
  }

  nuevaCabina(): void { this.crearCabina(this.locales()[0]?.id ?? 1); }

  crearCabina(localId: number): void {
    this.cabinaForm.set(cabinaVacia(localId));
    this.mostrarCabina.set(true);
  }

  editarCabinaExistente(cabina: Habitacion): void {
    this.cabinaForm.set({ ...cabina });
    this.mostrarCabina.set(true);
  }

  guardarCabina(): void {
    const cabina = this.cabinaForm();
    this.habitaciones.update(lista => cabina.id
      ? lista.map(item => item.id === cabina.id ? { ...cabina } : item)
      : [{ ...cabina, id: lista.reduce((max, item) => Math.max(max, item.id), 0) + 1 }, ...lista]);
    this.mostrarCabina.set(false);
  }

  editarCabina<K extends keyof Habitacion>(campo: K, valor: Habitacion[K]): void {
    this.cabinaForm.update(cabina => ({ ...cabina, [campo]: valor }));
  }

  cabinas(localId: number) { return this.habitaciones().filter(h => h.localId === localId); }
  especialistas(localId: number) { return ESPECIALISTAS.filter(e => e.locales.includes(localId)).length; }
  citasHoy(localId: number) { return CITAS.filter(c => c.localId === localId && c.fecha === HOY_ISO).length; }
  citasCabina(habId: number) { return CITAS.filter(c => c.habitacionId === habId && c.fecha === HOY_ISO).length; }

  ingresosMes(localId: number): number {
    return CITAS.filter(c => c.localId === localId && c.fecha.slice(0, 7) === this.mes)
      .reduce((t, c) => t + c.montoPagado, 0);
  }

  ocupacion(localId: number): number {
    const cabinas = this.cabinas(localId).filter(c => c.activa).length || 1;
    const minutos = CITAS.filter(c => c.localId === localId && c.fecha === HOY_ISO)
      .reduce((t, c) => t + this.minutos(c.horaFin) - this.minutos(c.horaInicio), 0);
    const disponible = cabinas * 11 * 60;
    return Math.round((minutos / disponible) * 100);
  }

  private minutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }
}
