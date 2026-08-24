import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIAS_TRATAMIENTO, CITAS, TRATAMIENTOS, soles } from '../../data/datos';
import { CategoriaTratamiento, Tratamiento } from '../../data/modelos';
import { MediaTratamientosService } from '../../compartido/media-tratamientos.service';

function tratamientoVacio(): Tratamiento {
  return {
    id: 0,
    nombre: '',
    categoria: 'Facial',
    etiquetas: [],
    resumen: '',
    descripcion: '',
    beneficios: [''],
    recomendaciones: [''],
    duracionMin: 60,
    limpiezaMin: 15,
    precio: 0,
    imagen: 'img/trat-limpieza.jpg',
    nombreImagen: 'Imagen del tratamiento',
    video: '',
    videoPoster: '',
    tiktokUrl: '',
    galeria: [],
    destacado: false,
    activo: true
  };
}

@Component({
  selector: 'app-tratamientos-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Tratamientos</h1>
        <p>Catálogo, precios, duración y tiempo de preparación de cabina. Nada está fijo en el código.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--linea btn--sm" (click)="mostrarAjuste.set(!mostrarAjuste())">Actualizar precios</button>
        <button class="btn btn--vino btn--sm" (click)="nuevo()">Nuevo tratamiento</button>
      </div>
    </div>

    <section class="tabla-panel categorias-panel">
      <div class="tabla-panel__cabecera">
        <div>
          <h3>Categorías de tratamiento</h3>
          <span class="dato__label">Crea una categoría nueva si el tratamiento no encaja en las actuales</span>
        </div>
      </div>
      <div class="categorias-admin">
        <div class="categorias-admin__lista">
          @for (c of categorias(); track c) {
            <span class="categoria-chip">
              {{ c }}
              @if (c !== 'Todos') {
                <button type="button" (click)="eliminarCategoria(c)" aria-label="Eliminar categoría">×</button>
              }
            </span>
          }
        </div>
        <div class="categorias-admin__nuevo">
          <input placeholder="Nueva categoría" [(ngModel)]="nuevaCategoria" name="nuevaCategoriaTratamiento">
          <button type="button" class="btn btn--linea btn--sm" (click)="agregarCategoria()" [disabled]="!nuevaCategoria.trim()">Agregar categoría</button>
        </div>
      </div>
    </section>

    @if (mostrarAjuste()) {
      <div class="tabla-panel panel-form">
        <div class="tabla-panel__cabecera">
          <h3>Actualización rápida de precios</h3>
          <span class="dato__label">Aplica un porcentaje al catálogo filtrado</span>
        </div>
        <div class="form-rapido">
          <div class="campo">
            <label>Ajuste (%)</label>
            <input type="number" [(ngModel)]="porcentajeAjuste" placeholder="10 para subir, -10 para bajar">
          </div>
          <button class="btn btn--vino btn--sm" (click)="aplicarAjuste()">Aplicar a {{ lista().length }} tratamientos</button>
        </div>
      </div>
    }

    @if (mostrarFormulario()) {
      <div class="tabla-panel panel-form">
        <div class="tabla-panel__cabecera">
          <h3>{{ borrador().id ? 'Editar tratamiento' : 'Nuevo tratamiento' }}</h3>
          <button class="boton-icono" (click)="cerrarFormulario()">Cancelar</button>
        </div>
        <form class="trat-form" (ngSubmit)="guardar()">
          <div class="campo"><label>Nombre</label><input required [ngModel]="borrador().nombre" (ngModelChange)="editar('nombre', $event)" name="nombre"></div>
          <div class="campo">
            <label>Categoría</label>
            <select [ngModel]="borrador().categoria" (ngModelChange)="editar('categoria', $event)" name="categoria">
              @for (c of categoriasSinTodos(); track c) { <option [value]="c">{{ c }}</option> }
            </select>
          </div>
          <div class="campo"><label>Precio (S/)</label><input type="number" min="0" [ngModel]="borrador().precio" (ngModelChange)="editar('precio', Number($event))" name="precio"></div>
          <div class="campo"><label>Sesión (min)</label><input type="number" min="5" [ngModel]="borrador().duracionMin" (ngModelChange)="editar('duracionMin', Number($event))" name="duracion"></div>
          <div class="campo"><label>Limpieza cabina (min)</label><input type="number" min="0" [ngModel]="borrador().limpiezaMin" (ngModelChange)="editar('limpiezaMin', Number($event))" name="limpieza"></div>
          <div class="campo">
            <label>Imagen</label>
            <input [ngModel]="borrador().imagen" (ngModelChange)="editar('imagen', $event)" name="imagen" placeholder="img/trat-limpieza.jpg">
            <input type="file" accept="image/*" (change)="cargarImagen($event)">
          </div>
          <div class="campo"><label>Nombre interno de imagen</label><input [ngModel]="borrador().nombreImagen" (ngModelChange)="editar('nombreImagen', $event)" name="nombreImagen" placeholder="Ej. Foto HIFU agosto"></div>
          <div class="campo trat-form__ancho"><label>Resumen</label><input [ngModel]="borrador().resumen" (ngModelChange)="editar('resumen', $event)" name="resumen"></div>
          <div class="campo trat-form__ancho"><label>Descripción</label><textarea rows="3" [ngModel]="borrador().descripcion" (ngModelChange)="editar('descripcion', $event)" name="descripcion"></textarea></div>
          <div class="trat-form__preview">
            <span class="dato__label">Vista previa pública</span>
            <article class="preview-trat-card">
              <div class="preview-trat-card__media">
                <img [src]="borrador().imagen" [alt]="borrador().nombre || 'Tratamiento'">
                <span>{{ borrador().categoria || 'Categoría' }}</span>
              </div>
              <div class="preview-trat-card__body">
                <h4>{{ borrador().nombre || 'Nombre del tratamiento' }}</h4>
                <p>{{ borrador().resumen || 'Resumen breve que verá la paciente en la lista.' }}</p>
                <div class="precio">
                  <span class="precio__actual">{{ soles(borrador().precio || 0) }}</span>
                </div>
              </div>
            </article>
            <div class="preview-trat-detail">
              <strong>Detalle al abrir</strong>
              <p>{{ borrador().descripcion || 'Aquí se verá en qué consiste el tratamiento.' }}</p>
              <ul>
                @for (b of beneficiosPreview(); track $index) { <li>{{ b }}</li> }
              </ul>
            </div>
          </div>
          <div class="lista-editor">
            <div class="lista-editor__cabecera">
              <div><span class="dato__label">Beneficios</span><strong>Qué gana la paciente</strong></div>
              <button type="button" class="btn btn--linea btn--sm" (click)="agregarItem('beneficios')">Agregar beneficio</button>
            </div>
            @for (b of borrador().beneficios; track $index; let i = $index) {
              <div class="lista-editor__fila">
                <input [ngModel]="b" (ngModelChange)="editarItem('beneficios', i, $event)" name="beneficio{{ i }}" placeholder="Ej. Redefine el contorno facial">
                <button type="button" class="boton-icono boton-icono--peligro" (click)="quitarItem('beneficios', i)">Quitar</button>
              </div>
            }
          </div>
          <div class="lista-editor">
            <div class="lista-editor__cabecera">
              <div><span class="dato__label">Recomendaciones posteriores</span><strong>Cuidados luego del tratamiento</strong></div>
              <button type="button" class="btn btn--linea btn--sm" (click)="agregarItem('recomendaciones')">Agregar recomendación</button>
            </div>
            @for (r of borrador().recomendaciones; track $index; let i = $index) {
              <div class="lista-editor__fila">
                <input [ngModel]="r" (ngModelChange)="editarItem('recomendaciones', i, $event)" name="recomendacion{{ i }}" placeholder="Ej. Usar protector solar SPF 50">
                <button type="button" class="boton-icono boton-icono--peligro" (click)="quitarItem('recomendaciones', i)">Quitar</button>
              </div>
            }
          </div>
          <div class="media-editor trat-form__ancho">
            <div class="media-editor__cabecera">
              <div>
                <span class="dato__label">Multimedia del tratamiento</span>
                <strong>Video, portada y fotos adicionales</strong>
              </div>
              <button type="button" class="btn btn--linea btn--sm" (click)="limpiarMedia()">Quitar multimedia</button>
            </div>
            <p class="media-editor__aviso">
              El video se muestra primero en el detalle del tratamiento; la paciente puede cambiar a las
              fotos con las miniaturas. Recomendado: MP4 H.264 vertical 1080×1920, 10–30 s, menos de 15 MB.
            </p>

            <div class="media-editor__campos">
              <div class="campo">
                <label>Video (ruta o enlace .mp4)</label>
                <input [ngModel]="borrador().video" (ngModelChange)="editar('video', $event)" name="video" placeholder="video/trat-limpieza.mp4">
                <input type="file" accept="video/*" (change)="cargarVideo($event)">
              </div>
              <div class="campo">
                <label>Portada del video</label>
                <input [ngModel]="borrador().videoPoster" (ngModelChange)="editar('videoPoster', $event)" name="videoPoster" placeholder="video/trat-limpieza-poster.jpg">
                <input type="file" accept="image/*" (change)="cargarPoster($event)">
              </div>
              <div class="campo">
                <label>Enlace del video en TikTok</label>
                <input [ngModel]="borrador().tiktokUrl" (ngModelChange)="editar('tiktokUrl', $event)" name="tiktokUrl" placeholder="https://www.tiktok.com/@rubiesteticaintegral/video/...">
              </div>
            </div>

            <div class="lista-editor">
              <div class="lista-editor__cabecera">
                <div><span class="dato__label">Fotos adicionales</span><strong>Se muestran junto al video</strong></div>
                <button type="button" class="btn btn--linea btn--sm" (click)="agregarFoto()">Agregar foto</button>
              </div>
              @for (g of galeria(); track $index; let i = $index) {
                <div class="lista-editor__fila">
                  <input [ngModel]="g" (ngModelChange)="editarFoto(i, $event)" name="galeria{{ i }}" placeholder="img/trat-peeling.jpg">
                  <button type="button" class="boton-icono boton-icono--peligro" (click)="quitarFoto(i)">Quitar</button>
                </div>
              }
              <input type="file" accept="image/*" multiple (change)="cargarFotos($event)">
            </div>

            @if (borrador().video) {
              <div class="media-editor__preview">
                <span class="dato__label">Vista previa del video</span>
                <video [src]="borrador().video" [poster]="borrador().videoPoster || null" controls muted playsinline></video>
              </div>
            }
          </div>
          <label class="check"><input type="checkbox" [ngModel]="borrador().activo" (ngModelChange)="editar('activo', $event)" name="activo"> Activo en la web</label>
          <button class="btn btn--vino btn--sm" type="submit" [disabled]="!borrador().nombre || !borrador().precio">Guardar tratamiento</button>
        </form>
      </div>
    }

    <div class="barra-filtros">
      <div class="campo barra-filtros__crecer">
        <label>Buscar</label>
        <input type="search" placeholder="Nombre del tratamiento" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
      </div>
      <div class="campo">
        <label>Categoría</label>
        <select [ngModel]="categoria()" (ngModelChange)="categoria.set($event)">
          @for (c of categorias(); track c) { <option>{{ c }}</option> }
        </select>
      </div>
    </div>

    <div class="tabla-panel">
      <div class="tabla-panel__cabecera">
        <h3>Catálogo de tratamientos</h3>
        <span class="dato__label">{{ lista().length }} registros</span>
      </div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead>
            <tr>
              <th>Tratamiento</th><th>Categoría</th><th class="num">Sesión</th><th class="num">Cabina</th>
              <th class="num">Bloqueo total</th><th class="num">Precio</th><th class="num">Sesiones del mes</th>
              <th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (t of lista(); track t.id) {
              <tr>
                <td>
                  <div class="fila-trat">
                    <img class="img-cobertura" [src]="t.imagen" [alt]="t.nombre">
                    <div class="mini-dato">
                      <strong>{{ t.nombre }}</strong>
                      <span>{{ t.resumen }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ t.categoria }}</td>
                <td class="num">{{ t.duracionMin }} min</td>
                <td class="num">{{ t.limpiezaMin }} min</td>
                <td class="num"><strong>{{ t.duracionMin + t.limpiezaMin }} min</strong></td>
                <td class="num">{{ soles(t.precio) }}</td>
                <td class="num">{{ sesiones(t.id) }}</td>
                <td>
                  <span [class]="t.activo ? 'chip chip--ok chip--punto' : 'chip chip--error chip--punto'">
                    {{ t.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="num">
                  <div class="acciones-fila">
                    <button class="boton-icono" (click)="editarTratamiento(t)">Editar</button>
                    <button class="boton-icono" (click)="alternar(t)">{{ t.activo ? 'Desactivar' : 'Activar' }}</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .media-editor {
      min-width: 0; padding: 18px 4%; border: 1px solid var(--linea);
      border-radius: var(--radio-lg); background: var(--rosa-50);
      display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px;
    }
    .media-editor__cabecera {
      display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;
    }
    .media-editor > * { grid-column: 1; min-width: 0; }
    .media-editor__cabecera .dato__label { display: block; }
    .media-editor__cabecera > div { min-width: 0; }
    .media-editor__aviso { margin: 0; color: var(--gris-claro); font-size: .9rem; }
    .media-editor__campos {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 14px;
    }
    .media-editor__campos .campo { min-width: 0; }
    .media-editor__campos input { max-width: 100%; }
    .media-editor__preview { min-width: 0; }
    .media-editor__preview video {
      width: 100%; max-width: min(100%, 320px); margin-top: 8px;
      border-radius: var(--radio); background: #120309; display: block;
    }
    .panel-form, .categorias-panel { margin-bottom: 22px; }
    .categorias-admin { display: grid; grid-template-columns: 1fr minmax(280px, .5fr); gap: 16px; padding: 18px 22px 22px; align-items: start; }
    .categorias-admin__lista { display: flex; flex-wrap: wrap; gap: 8px; }
    .categoria-chip { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--linea); border-radius: 999px; padding: 7px 10px 7px 13px; background: #fff; color: var(--gris); font-size: .86rem; }
    .categoria-chip button { border: 0; background: var(--rosa-50); color: var(--error); width: 20px; height: 20px; border-radius: 50%; cursor: pointer; line-height: 1; }
    .categorias-admin__nuevo { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
    .form-rapido {
      display: flex;
      gap: 14px;
      align-items: end;
      padding: 20px 22px 24px;
    }
    .trat-form {
      display: grid;
      grid-template-columns: repeat(2, minmax(170px, 1fr)) minmax(320px, .85fr);
      gap: 14px;
      padding: 20px 22px 24px;
      align-items: end;
    }
    .trat-form__ancho, .lista-editor { grid-column: 1 / 3; }
    .trat-form__preview {
      grid-column: 3;
      grid-row: 1 / span 8;
      display: grid;
      gap: 12px;
      align-items: start;
      align-self: start;
      position: sticky;
      top: 86px;
      border: 1px solid var(--linea);
      border-radius: var(--radio-lg);
      padding: 14px;
      background: #fff;
    }
    .preview-trat-card { border: 1px solid var(--linea); border-radius: var(--radio-lg); overflow: hidden; background: #fff; }
    .preview-trat-card__media { position: relative; aspect-ratio: 4 / 3; background: var(--rosa-50); }
    .preview-trat-card__media img { width: 100%; height: 100%; object-fit: cover; }
    .preview-trat-card__media span {
      position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,.94); color: var(--vino);
      font-size: .78rem; letter-spacing: .14em; text-transform: uppercase; padding: 5px 10px; border-radius: 2px;
    }
    .preview-trat-card__body { padding: 16px; }
    .preview-trat-card__body h4 { margin-bottom: 6px; }
    .preview-trat-card__body p, .preview-trat-detail p { font-size: .9rem; margin-bottom: 8px; }
    .preview-trat-detail {
      border: 1px dashed var(--linea);
      border-radius: var(--radio);
      padding: 12px;
      background: var(--rosa-50);
    }
    .preview-trat-detail strong { color: var(--vino); font-size: .96rem; }
    .preview-trat-detail ul { margin: 8px 0 0; padding-left: 18px; color: var(--gris); font-size: .9rem; }
    .lista-editor { border: 1px solid var(--linea); border-radius: var(--radio); padding: 14px; background: var(--rosa-50); display: grid; gap: 10px; }
    .lista-editor__cabecera { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    .lista-editor__cabecera strong { display: block; color: var(--vino); font-size: .96rem; }
    .lista-editor__fila { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
    .check { display: flex; gap: 8px; align-items: center; color: var(--gris); font-size: .94rem; }
    .boton-icono--peligro { color: var(--error); }
    .fila-trat { display: flex; gap: 12px; align-items: center; max-width: 380px; }
    .fila-trat img { width: 46px; height: 46px; border-radius: var(--radio); object-fit: cover; }
    .fila-trat .mini-dato span { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    @media (max-width: 1000px) {
      .trat-form, .categorias-admin { grid-template-columns: 1fr; }
      .trat-form__ancho, .lista-editor, .trat-form__preview { grid-column: 1; grid-row: auto; position: static; }
      .form-rapido, .lista-editor__fila, .categorias-admin__nuevo { display: grid; grid-template-columns: 1fr; }
    }
  `]
})
export class TratamientosAdminComponent {
  Number = Number;
  soles = soles;
  categorias = signal<string[]>([...CATEGORIAS_TRATAMIENTO]);
  categoriasSinTodos = computed(() => this.categorias().filter(c => c !== 'Todos'));
  tratamientos = signal(TRATAMIENTOS.map(t => ({ ...t })));
  busqueda = signal('');
  categoria = signal('Todos');
  mostrarFormulario = signal(false);
  mostrarAjuste = signal(false);
  borrador = signal<Tratamiento>(tratamientoVacio());
  porcentajeAjuste = 0;
  nuevaCategoria = '';

  private mediaTratamientos = inject(MediaTratamientosService);

  galeria = computed(() => this.borrador().galeria ?? []);

  lista = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.tratamientos().filter(t =>
      (this.categoria() === 'Todos' || t.categoria === this.categoria()) &&
      (!texto || t.nombre.toLowerCase().includes(texto))
    );
  });

  categoriaUsada(categoria: string): boolean {
    return this.tratamientos().some(t => t.categoria === categoria);
  }

  agregarCategoria(): void {
    const nombre = this.nuevaCategoria.trim();
    if (!nombre || this.categorias().some(c => c.toLowerCase() === nombre.toLowerCase())) { return; }
    this.categorias.update(lista => [...lista, nombre]);
    this.editar('categoria', nombre as CategoriaTratamiento);
    this.nuevaCategoria = '';
  }

  eliminarCategoria(categoria: string): void {
    if (categoria === 'Todos') { return; }
    const restantes = this.categorias().filter(c => c !== categoria);
    const reemplazo = (restantes.find(c => c !== 'Todos') ?? 'Facial') as CategoriaTratamiento;
    this.categorias.set(restantes.some(c => c !== 'Todos') ? restantes : ['Todos', reemplazo]);
    this.tratamientos.update(lista => lista.map(t => t.categoria === categoria ? { ...t, categoria: reemplazo } : t));
    if (this.borrador().categoria === categoria) { this.editar('categoria', reemplazo); }
    if (this.categoria() === categoria) { this.categoria.set('Todos'); }
  }

  beneficiosPreview(): string[] {
    const lista = this.borrador().beneficios.map(b => b.trim()).filter(Boolean);
    return lista.length ? lista.slice(0, 3) : ['Beneficio principal del tratamiento'];
  }

  sesiones(id: number): number {
    const mes = new Date().toISOString().slice(0, 7);
    return CITAS.filter(c => c.tratamientoId === id && c.fecha.slice(0, 7) === mes).length;
  }

  nuevo(): void {
    this.borrador.set(tratamientoVacio());
    this.mostrarFormulario.set(true);
  }

  editarTratamiento(t: Tratamiento): void {
    const media = this.mediaTratamientos.media(t);
    this.borrador.set({
      ...t,
      video: media.video,
      videoPoster: media.videoPoster,
      tiktokUrl: media.tiktokUrl,
      galeria: [...media.galeria],
      etiquetas: [...t.etiquetas],
      beneficios: t.beneficios.length ? [...t.beneficios] : [''],
      recomendaciones: t.recomendaciones.length ? [...t.recomendaciones] : ['']
    });
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    this.borrador.set(tratamientoVacio());
  }

  editar<K extends keyof Tratamiento>(campo: K, valor: Tratamiento[K]): void {
    this.borrador.update(t => ({ ...t, [campo]: valor }));
  }

  agregarItem(campo: 'beneficios' | 'recomendaciones'): void {
    this.borrador.update(t => ({ ...t, [campo]: [...t[campo], ''] }));
  }

  editarItem(campo: 'beneficios' | 'recomendaciones', index: number, valor: string): void {
    this.borrador.update(t => ({ ...t, [campo]: t[campo].map((item, i) => i === index ? valor : item) }));
  }

  quitarItem(campo: 'beneficios' | 'recomendaciones', index: number): void {
    this.borrador.update(t => ({ ...t, [campo]: t[campo].length === 1 ? [''] : t[campo].filter((_, i) => i !== index) }));
  }

  guardar(): void {
    const t = this.borrador();
    const limpio = {
      ...t,
      beneficios: t.beneficios.map(v => v.trim()).filter(Boolean),
      recomendaciones: t.recomendaciones.map(v => v.trim()).filter(Boolean),
      galeria: (t.galeria ?? []).map(v => v.trim()).filter(Boolean)
    };
    let idGuardado = limpio.id;
    this.tratamientos.update(lista => {
      if (limpio.id) {
        return lista.map(item => item.id === limpio.id ? { ...limpio } : item);
      }
      idGuardado = lista.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      return [{ ...limpio, id: idGuardado }, ...lista];
    });

    this.mediaTratamientos.guardar(idGuardado, {
      video: limpio.video ?? '',
      videoPoster: limpio.videoPoster ?? '',
      tiktokUrl: limpio.tiktokUrl ?? '',
      galeria: limpio.galeria
    });
    this.cerrarFormulario();
  }

  limpiarMedia(): void {
    this.borrador.update(t => ({ ...t, video: '', videoPoster: '', tiktokUrl: '', galeria: [] }));
  }

  agregarFoto(): void {
    this.borrador.update(t => ({ ...t, galeria: [...(t.galeria ?? []), ''] }));
  }

  editarFoto(index: number, valor: string): void {
    this.borrador.update(t => ({
      ...t,
      galeria: (t.galeria ?? []).map((item, i) => i === index ? valor : item)
    }));
  }

  quitarFoto(index: number): void {
    this.borrador.update(t => ({ ...t, galeria: (t.galeria ?? []).filter((_, i) => i !== index) }));
  }

  cargarVideo(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) { return; }
    const lector = new FileReader();
    lector.onload = () => this.editar('video', String(lector.result || ''));
    lector.readAsDataURL(archivo);
  }

  cargarPoster(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) { return; }
    const lector = new FileReader();
    lector.onload = () => this.editar('videoPoster', String(lector.result || ''));
    lector.readAsDataURL(archivo);
  }

  cargarFotos(evento: Event): void {
    const archivos = Array.from((evento.target as HTMLInputElement).files ?? []);
    archivos.forEach(archivo => {
      const lector = new FileReader();
      lector.onload = () => {
        const fuente = String(lector.result || '');
        this.borrador.update(t => ({ ...t, galeria: [...(t.galeria ?? []), fuente] }));
      };
      lector.readAsDataURL(archivo);
    });
  }

  alternar(t: Tratamiento): void {
    this.tratamientos.update(lista => lista.map(item => item.id === t.id ? { ...item, activo: !item.activo } : item));
  }

  aplicarAjuste(): void {
    const factor = 1 + (Number(this.porcentajeAjuste) / 100);
    if (!factor || factor <= 0) { return; }
    const ids = new Set(this.lista().map(t => t.id));
    this.tratamientos.update(lista => lista.map(t => ids.has(t.id) ? { ...t, precio: Math.round(t.precio * factor) } : t));
    this.mostrarAjuste.set(false);
    this.porcentajeAjuste = 0;
  }

  cargarImagen(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) { return; }
    const lector = new FileReader();
    lector.onload = () => {
      this.editar('imagen', String(lector.result || ''));
      this.editar('nombreImagen', archivo.name);
    };
    lector.readAsDataURL(archivo);
  }
}
