import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MapaSedeComponent } from '../../compartido/mapa-sede.component';
import { CITAS, ESPECIALISTAS, HABITACIONES, HORAS_SELECTOR, HOY_ISO, LOCALES, formatoHora12, soles } from '../../data/datos';
import { Habitacion, Local } from '../../data/modelos';
import { SubidasService } from '../../compartido/subidas.service';
import { ConfiguracionPanelService } from '../../compartido/configuracion-panel.service';

function localVacio(): Local {
  return {
    id: 0,
    uuidGlobal: `loc-${Date.now()}`,
    nombre: '',
    direccion: '',
    referencia: '',
    distrito: 'San Juan de Lurigancho, Lima',
    telefono: '945 189 720',
    horario: [{ dias: 'Todos los días', apertura: '09:00', cierre: '19:00' }],
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
          <label class="check check--247"><input type="checkbox" [checked]="es247()" (change)="alternar247()"> Local 24/7</label>
          @if (es247()) {
            <div class="local-form__247-label">Abierto todo el día, todos los días</div>
          } @else {
            <div class="campo"><label>Apertura</label><select [ngModel]="localForm().horario[0].apertura" (ngModelChange)="editarHorario('apertura', $event)" name="apertura">@for (h of horasSelector; track h.valor) { <option [value]="h.valor">{{ h.etiqueta }}</option> }</select></div>
            <div class="campo"><label>Cierre</label><select [ngModel]="localForm().horario[0].cierre" (ngModelChange)="editarHorario('cierre', $event)" name="cierre">@for (h of horasSelector; track h.valor) { <option [value]="h.valor">{{ h.etiqueta }}</option> }<option value="24:00">12:00 AM</option></select></div>
          }
          <div class="campo"><label>Latitud</label><input type="number" step="0.000001" [ngModel]="localForm().latitud" (ngModelChange)="editarLocal('latitud', Number($event))" name="latitud"></div>
          <div class="campo"><label>Longitud</label><input type="number" step="0.000001" [ngModel]="localForm().longitud" (ngModelChange)="editarLocal('longitud', Number($event))" name="longitud"></div>
          <div class="local-form__mapa">
            <span class="dato__label">Mapa visual</span>
            <app-mapa-sede [local]="localForm()" [editable]="true" (coordenadas)="actualizarCoordenadas($event)" />
            <small>Arrastra el mapa para ubicarte y haz clic en el punto exacto. El botón público de Google Maps se genera con estas coordenadas.</small>
          </div>
          <aside class="local-form__preview">
            <span class="dato__label">Vista previa pública</span>
            <article class="preview-local-card">
              <img [src]="localForm().imagen" [alt]="localForm().nombre || 'Local'">
              <div>
                <h4>{{ localForm().nombre || 'Nombre del local' }}</h4>
                <p>{{ localForm().direccion || 'Dirección del local' }}</p>
                <p>{{ localForm().referencia || 'Referencia para llegar' }} · {{ localForm().distrito }}</p>
                <div class="preview-local-card__meta">
                  <span>{{ localForm().telefono }}</span>
                  <span>{{ formatoHora(localForm().horario[0].apertura) }} - {{ formatoHora(localForm().horario[0].cierre) }}</span>
                </div>
                <a [href]="googleMapsLocal(localForm())" target="_blank" rel="noopener">Abrir en Google Maps</a>
              </div>
            </article>
          </aside>
          <div class="local-form__imagen">
            <span class="dato__label">Imagen del local</span>
            <img [src]="localForm().imagen" [alt]="localForm().nombre || 'Local'">
            <input [ngModel]="localForm().imagen" (ngModelChange)="editarLocal('imagen', $event)" name="imagenLocal" placeholder="img/local-1.jpg">
            <label class="btn btn--linea btn--sm">
              Subir foto
              <input type="file" accept="image/*" (change)="cargarImagenLocal($event)" hidden>
            </label>
          </div>
          @if (!localForm().id) {
            <div class="campo">
              <label>Cabinas iniciales</label>
              <input type="number" min="1" [(ngModel)]="cabinasIniciales" name="cabinasIniciales">
            </div>
          } @else {
            <div class="local-form__cabinas">
              <div class="local-form__cabinas-head">
                <div>
                  <span class="dato__label">Cabinas del local</span>
                  <strong>{{ cabinas(localForm().id).length }} cabinas registradas</strong>
                </div>
                <button type="button" class="btn btn--linea btn--sm" (click)="crearCabina(localForm().id)">Agregar cabina</button>
              </div>
              @for (c of cabinas(localForm().id); track c.id) {
                <div class="local-cabina-row">
                  <div><strong>{{ c.nombre }}</strong><span>{{ c.equipamiento || 'Sin equipamiento registrado' }}</span></div>
                  <label class="check"><input type="checkbox" [checked]="c.activa" (change)="alternarCabinaDesdeLocal(c)"> Habilitada</label>
                  <button type="button" class="boton-icono" (click)="editarCabinaExistente(c)">Editar</button>
                </div>
              }
            </div>
          }
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
            <button class="boton-icono boton-icono--peligro" (click)="quitarLocal(l)">
              {{ tieneCitas(l.id) ? 'Desactivar local' : 'Eliminar local' }}
            </button>
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
                @for (h of horariosLocal(l.id); track h.dias) {
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
            <div class="tabla-envoltura">
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
        </div>
      </section>
    }
  `,
  styles: [`
    .panel-form { margin-bottom: 22px; }
    .local-form { display: grid; grid-template-columns: repeat(3, minmax(150px, 1fr)) minmax(340px, .86fr); gap: 14px; padding: 20px 22px 24px; align-items: end; }
    .cabina-form { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 14px; padding: 20px 22px 24px; align-items: end; }
    .cabina-form__ancho { grid-column: span 2; }
    .local-form__ancho, .local-form__imagen, .local-form__mapa, .local-form__cabinas { grid-column: 1 / 4; }
    .local-form__247-label {
      min-height: 42px; display: flex; align-items: center; padding: 0 14px;
      border: 1px solid rgba(176, 27, 114, .22); border-radius: var(--radio); background: var(--rosa-50);
      color: var(--vino); font-weight: 700; font-size: .94rem;
    }
    .local-form__imagen { display: grid; grid-template-columns: 180px 1fr auto; gap: 12px; align-items: end; }
    .local-form__imagen img { width: 180px; height: 120px; object-fit: cover; border-radius: var(--radio); border: 1px solid var(--linea); background: var(--rosa-50); }
    .local-form__mapa { display: grid; gap: 8px; align-items: start; }
    .local-form__mapa small { color: var(--gris); font-size: .9rem; }
    .local-form__preview {
      grid-column: 4;
      grid-row: 1 / span 9;
      align-self: start;
      position: sticky;
      top: 86px;
      border: 1px solid var(--linea);
      border-radius: var(--radio-lg);
      padding: 14px;
      background: #fff;
      display: grid;
      gap: 12px;
    }
    .preview-local-card { border: 1px solid var(--linea); border-radius: var(--radio-lg); overflow: hidden; background: #fff; }
    .preview-local-card img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: var(--rosa-50); }
    .preview-local-card div { padding: 16px; }
    .preview-local-card h4 { margin-bottom: 6px; }
    .preview-local-card p { margin-bottom: 6px; font-size: .9rem; }
    .preview-local-card__meta { display: grid; gap: 4px; padding: 10px 0 !important; color: var(--vino); font-size: .9rem; }
    .preview-local-card a { display: inline-flex; margin-top: 8px; font-size: .82rem; letter-spacing: .14em; text-transform: uppercase; }
    .local-form__cabinas {
      border: 1px solid var(--linea);
      border-radius: var(--radio-lg);
      background: var(--rosa-50);
      padding: 14px;
      display: grid;
      gap: 10px;
    }
    .local-form__cabinas-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .local-form__cabinas-head strong { color: var(--vino); font-size: .96rem; }
    .local-cabina-row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 12px;
      align-items: center;
      border: 1px solid var(--linea);
      border-radius: var(--radio);
      padding: 10px;
      background: #fff;
    }
    .local-cabina-row div { display: flex; flex-direction: column; gap: 2px; }
    .local-cabina-row span { color: var(--gris); font-size: .9rem; }
    .check { display: flex; gap: 8px; align-items: center; color: var(--gris); font-size: .94rem; }
    .check--247 { min-height: 42px; }
    .local { margin-bottom: 20px; }
    .local__cabecera { display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; align-items: flex-start; }
    .local__cabecera h3 { margin: 0 0 4px; }
    .local__cabecera p { margin: 0; font-size: .94rem; }
    .local__coords { margin-top: 4px !important; font-size: .86rem !important; color: var(--gris-claro); }
    .local__acciones { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .boton-icono--peligro { color: var(--error); border-color: rgba(166,40,40,.28); }
    .boton-icono--peligro:hover { background: var(--error-bg); border-color: var(--error); color: var(--error); }
    .local__metricas { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin: 22px 0; padding: 18px 0; border-top: 1px dashed var(--linea); border-bottom: 1px dashed var(--linea); }
    .local__metricas div { display: flex; flex-direction: column; }
    .local__metricas strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.7rem; color: var(--vino); }
    .local__metricas span { font-size: .82rem; color: var(--gris-claro); letter-spacing: .08em; }
    .local__columnas { display: grid; grid-template-columns: .8fr 1.4fr; gap: 30px; }
    .tabla--simple { margin-top: 10px; }
    .tabla--simple td, .tabla--simple th { padding: 9px 10px; }
    .local__columnas > * { min-width: 0; }
    @media (max-width: 900px) {
      .tabla--simple { min-width: 0; }
      .tabla--simple th, .tabla--simple td { white-space: normal; }
    }
    @media (max-width: 1200px) {
      .local__metricas { grid-template-columns: repeat(2, 1fr); }
      .local__columnas, .local-form, .cabina-form { grid-template-columns: 1fr; }
      .local-form__imagen, .local-cabina-row { grid-template-columns: 1fr; }
      .local-form__imagen, .local-form__mapa, .local-form__cabinas, .local-form__preview { grid-column: 1; grid-row: auto; position: static; }
      .cabina-form__ancho { grid-column: auto; }
    }
  `]
})
export class LocalesAdminComponent {
  private subidas = inject(SubidasService);
  private configPanel = inject(ConfiguracionPanelService);
  Number = Number;
  soles = soles;
  horasSelector = HORAS_SELECTOR;
  formatoHora = formatoHora12;
  locales = signal(LOCALES.map(l => ({ ...l, horario: l.horario.map(h => ({ ...h })) })));
  habitaciones = signal(HABITACIONES.map(h => ({ ...h })));
  mostrarLocal = signal(false);
  mostrarCabina = signal(false);
  localForm = signal<Local>(localVacio());
  cabinaForm = signal<Habitacion>(cabinaVacia(1));
  cabinasIniciales = 5;
  private mes = HOY_ISO.slice(0, 7);

  nuevoLocal(): void {
    this.localForm.set(localVacio());
    this.cabinasIniciales = 5;
    this.mostrarLocal.set(true);
  }

  editarLocalExistente(local: Local): void {
    this.localForm.set({ ...local, horario: this.configPanel.obtenerHorariosLocal(local.id) });
    this.mostrarLocal.set(true);
  }

  guardarLocal(): void {
    const local = { ...this.localForm(), mapa: this.googleMapsLocal(this.localForm()) };
    const nuevo = !local.id;
    const nuevoId = local.id || this.locales().reduce((max, item) => Math.max(max, item.id), 0) + 1;
    this.locales.update(lista => local.id
      ? lista.map(item => item.id === local.id ? { ...local } : item)
      : [{ ...local, id: nuevoId }, ...lista]);
    if (nuevo) {
      this.crearCabinasIniciales(nuevoId);
    }
    this.configPanel.actualizarAgenda({
      atencion24h: this.configPanel.agenda().atencion24h && this.esHorario247(local.horario[0]),
      horariosPorLocal: {
        ...this.configPanel.agenda().horariosPorLocal,
        [nuevoId]: local.horario.map(h => ({ ...h }))
      }
    });
    this.mostrarLocal.set(false);
  }

  quitarLocal(local: Local): void {
    if (this.tieneCitas(local.id)) {
      if (!confirm(`"${local.nombre}" tiene citas registradas. Para conservar reportes se desactivará, no se borrará. ¿Continuar?`)) { return; }
      this.locales.update(lista => lista.map(item => item.id === local.id ? { ...item, activo: false } : item));
      if (this.localForm().id === local.id) { this.editarLocal('activo', false); }
      return;
    }

    if (!confirm(`¿Eliminar "${local.nombre}" y sus cabinas?`)) { return; }
    this.locales.update(lista => lista.filter(item => item.id !== local.id));
    this.habitaciones.update(lista => lista.filter(h => h.localId !== local.id));
    if (this.localForm().id === local.id) {
      this.mostrarLocal.set(false);
      this.localForm.set(localVacio());
    }
  }

  editarLocal<K extends keyof Local>(campo: K, valor: Local[K]): void {
    this.localForm.update(local => ({ ...local, [campo]: valor }));
  }

  actualizarCoordenadas(coordenadas: { latitud: number; longitud: number }): void {
    this.localForm.update(local => ({ ...local, ...coordenadas, mapa: this.googleMapsLocal({ ...local, ...coordenadas }) }));
  }

  editarHorario(campo: 'apertura' | 'cierre', valor: string): void {
    this.localForm.update(local => ({
      ...local,
      horario: [{ ...local.horario[0], [campo]: valor }]
    }));
  }

  es247(): boolean {
    const horario = this.localForm().horario[0];
    return horario.apertura === '00:00' && (horario.cierre === '24:00' || horario.cierre === '00:00');
  }

  alternar247(): void {
    if (this.es247()) {
      this.localForm.update(local => ({ ...local, horario: [{ ...local.horario[0], apertura: '09:00', cierre: '19:00' }] }));
      return;
    }
    this.localForm.update(local => ({ ...local, horario: [{ ...local.horario[0], apertura: '00:00', cierre: '24:00' }] }));
  }

  cargarImagenLocal(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) { return; }
    this.subidas.leer(archivo, 'Imagen').then(fuente => this.editarLocal('imagen', fuente)).catch(() => undefined);
  }

  private crearCabinasIniciales(localId: number): void {
    const cantidad = Math.max(1, Number(this.cabinasIniciales) || 1);
    this.habitaciones.update(lista => {
      let siguienteId = lista.reduce((max, h) => Math.max(max, h.id), 0);
      const nuevas = Array.from({ length: cantidad }, (_, i) => ({
        id: ++siguienteId,
        nombre: `Cabina ${i + 1}`,
        localId,
        equipamiento: '',
        activa: true
      }));
      return [...lista, ...nuevas];
    });
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

  alternarCabinaDesdeLocal(cabina: Habitacion): void {
    this.habitaciones.update(lista => lista.map(item => item.id === cabina.id ? { ...item, activa: !item.activa } : item));
  }

  cabinas(localId: number) { return this.habitaciones().filter(h => h.localId === localId); }
  tieneCitas(localId: number): boolean { return CITAS.some(c => c.localId === localId); }
  googleMapsLocal(local: Local): string { return `https://www.google.com/maps?q=${local.latitud},${local.longitud}`; }
  horariosLocal(localId: number) { return this.configPanel.obtenerHorariosLocal(localId); }
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

  private esHorario247(horario: Local['horario'][number]): boolean {
    return horario.apertura === '00:00' && (horario.cierre === '24:00' || horario.cierre === '00:00');
  }
}
