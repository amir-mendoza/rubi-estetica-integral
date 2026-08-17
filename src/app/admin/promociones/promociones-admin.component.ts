import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HOY_ISO, TRATAMIENTOS, soles } from '../../data/datos';
import { CategoriaTratamiento, Promocion } from '../../data/modelos';
import { PromocionesService } from '../../compartido/promociones.service';

type Categoria = CategoriaTratamiento | 'General';

/** Formulario en blanco para registrar una promoción nueva. */
function promocionVacia(): Promocion {
  return {
    id: 0,
    titulo: '',
    subtitulo: '',
    descripcion: '',
    categoria: 'Facial',
    precioAntes: undefined,
    precio: undefined,
    sesiones: 1,
    vigenciaDesde: HOY_ISO,
    vigenciaHasta: HOY_ISO,
    imagen: 'img/trat-limpieza.jpg',
    etiqueta: 'Promoción del mes',
    destacada: true,
    activa: true
  };
}

@Component({
  selector: 'app-promociones-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Promociones</h1>
        <p>
          Las promociones activas y destacadas aparecen en el carrusel de la página de inicio,
          en el orden en que se registran.
        </p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--vino btn--sm" (click)="nueva()">Nueva promoción</button>
      </div>
    </div>

    <div class="kpis kpis-4">
      <div class="kpi">
        <span class="kpi__label">Registradas</span>
        <span class="kpi__valor">{{ lista().length }}</span>
        <span class="kpi__nota">Total en el catálogo</span>
      </div>
      <div class="kpi">
        <span class="kpi__label">Activas</span>
        <span class="kpi__valor">{{ activas() }}</span>
        <span class="kpi__nota">Visibles en la web</span>
      </div>
      <div class="kpi">
        <span class="kpi__label">En el carrusel</span>
        <span class="kpi__valor">{{ destacadas() }}</span>
        <span class="kpi__nota">Marcadas como destacadas</span>
      </div>
      <div class="kpi">
        <span class="kpi__label">Multisesión</span>
        <span class="kpi__valor">{{ multisesion() }}</span>
        <span class="kpi__nota">Con más de una sesión</span>
      </div>
    </div>

    <div class="promo-columnas">
      <!-- ------------------------------------------------------ Formulario -->
      <section class="tabla-panel">
        <div class="tabla-panel__cabecera">
          <h3>{{ borrador().id ? 'Editar promoción' : 'Registrar promoción' }}</h3>
          @if (borrador().id) {
            <button class="boton-icono" (click)="nueva()">Cancelar edición</button>
          }
        </div>

        <form class="promo-form" (ngSubmit)="guardar()">
          <div class="campo">
            <label>Título</label>
            <input required placeholder="Plan facial luminosidad"
                   [ngModel]="borrador().titulo" (ngModelChange)="editar('titulo', $event)" name="titulo">
          </div>

          <div class="campo">
            <label>Subtítulo</label>
            <input placeholder="4 sesiones personalizadas cada 15 días"
                   [ngModel]="borrador().subtitulo" (ngModelChange)="editar('subtitulo', $event)" name="subtitulo">
          </div>

          <div class="campo">
            <label>Descripción</label>
            <textarea rows="3" placeholder="Qué incluye la promoción"
                      [ngModel]="borrador().descripcion" (ngModelChange)="editar('descripcion', $event)" name="descripcion"></textarea>
          </div>

          <div class="promo-form__fila">
            <div class="campo">
              <label>Categoría</label>
              <select [ngModel]="borrador().categoria" (ngModelChange)="editar('categoria', $event)" name="categoria">
                @for (c of categorias; track c) { <option [value]="c">{{ c }}</option> }
              </select>
            </div>
            <div class="campo">
              <label>Etiqueta del carrusel</label>
              <input placeholder="Promoción del mes"
                     [ngModel]="borrador().etiqueta" (ngModelChange)="editar('etiqueta', $event)" name="etiqueta">
            </div>
          </div>

          <div class="promo-form__fila">
            <div class="campo">
              <label>Precio promocional (S/)</label>
              <input type="number" min="0"
                     [ngModel]="borrador().precio" (ngModelChange)="editar('precio', $event)" name="precio">
            </div>
            <div class="campo">
              <label>Precio regular (S/)</label>
              <input type="number" min="0"
                     [ngModel]="borrador().precioAntes" (ngModelChange)="editar('precioAntes', $event)" name="precioAntes">
            </div>
            <div class="campo">
              <label>Sesiones</label>
              <input type="number" min="1"
                     [ngModel]="borrador().sesiones" (ngModelChange)="actualizarCantidadSesiones($event)" name="sesiones">
            </div>
          </div>

          <div class="sesiones-editor">
            <div class="sesiones-editor__cabecera">
              <div>
                <span class="dato__label">Detalle de sesiones</span>
                <h4>Qué incluye cada sesión</h4>
              </div>
              <button type="button" class="btn btn--linea btn--sm" (click)="agregarSesion()">Agregar sesión</button>
            </div>

            @for (s of sesionesDetalle(); track $index; let i = $index) {
              <div class="sesion-edit">
                <div class="sesion-edit__numero">{{ i + 1 }}</div>
                <div class="campo">
                  <label>Título de la sesión</label>
                  <input [ngModel]="s.titulo" (ngModelChange)="editarSesion(i, 'titulo', $event)"
                         name="sesionTitulo_{{ i }}" placeholder="Sesión 1 · Hidrolipoclasia">
                </div>
                <div class="campo">
                  <label>Tratamiento relacionado</label>
                  <select [ngModel]="s.tratamientoId || 0" (ngModelChange)="editarSesionTratamiento(i, $event)"
                          name="sesionTratamiento_{{ i }}">
                    <option [value]="0">Sin tratamiento específico</option>
                    @for (t of tratamientos; track t.id) { <option [value]="t.id">{{ t.nombre }}</option> }
                  </select>
                </div>
                <div class="campo sesion-edit__descripcion">
                  <label>Breve descripción</label>
                  <textarea rows="2" [ngModel]="s.descripcion" (ngModelChange)="editarSesion(i, 'descripcion', $event)"
                            name="sesionDescripcion_{{ i }}" placeholder="Qué se realiza y para qué sirve"></textarea>
                </div>
                <button type="button" class="boton-icono boton-icono--peligro" (click)="eliminarSesion(i)">Eliminar</button>
              </div>
            } @empty {
              <div class="sesiones-editor__vacio">
                Agrega al menos una sesión si la promoción incluye pasos o tratamientos diferentes.
              </div>
            }
          </div>

          <div class="promo-form__fila">
            <div class="campo">
              <label>Vigente desde</label>
              <input type="date"
                     [ngModel]="borrador().vigenciaDesde" (ngModelChange)="editar('vigenciaDesde', $event)" name="desde">
            </div>
            <div class="campo">
              <label>Vigente hasta</label>
              <input type="date"
                     [ngModel]="borrador().vigenciaHasta" (ngModelChange)="editar('vigenciaHasta', $event)" name="hasta">
            </div>
          </div>

          <div class="campo">
            <label>Imagen</label>
            <select [ngModel]="borrador().imagen" (ngModelChange)="editar('imagen', $event)" name="imagen">
              @for (i of imagenes; track i.ruta) { <option [value]="i.ruta">{{ i.nombre }}</option> }
            </select>
            <span class="campo__ayuda">Puedes elegir una imagen guardada o pegar una ruta/URL. En Spring Boot esto será una subida real al servidor.</span>
          </div>

          <div class="promo-form__fila">
            <div class="campo">
              <label>Ruta o URL personalizada</label>
              <input placeholder="img/nueva-promo.jpg o https://..."
                     [ngModel]="imagenPersonalizada()" (ngModelChange)="imagenPersonalizada.set($event)" name="imagenPersonalizada">
            </div>
            <div class="campo">
              <label>Subir imagen de prueba</label>
              <input type="file" accept="image/*" (change)="subirImagen($event)">
            </div>
          </div>
          <button type="button" class="btn btn--linea btn--sm" (click)="usarImagenPersonalizada()" [disabled]="!imagenPersonalizada().trim()">
            Usar esta imagen
          </button>

          <div class="interruptores">
            <label>
              <input type="checkbox" [ngModel]="borrador().activa" (ngModelChange)="editar('activa', $event)" name="activa">
              Publicada en la web
            </label>
            <label>
              <input type="checkbox" [ngModel]="borrador().destacada" (ngModelChange)="editar('destacada', $event)" name="destacada">
              Mostrar en el carrusel de inicio
            </label>
          </div>

          <div class="promo-form__acciones">
            <button type="submit" class="btn btn--vino btn--sm" [disabled]="!borrador().titulo">
              {{ borrador().id ? 'Guardar cambios' : 'Registrar promoción' }}
            </button>
            @if (aviso()) { <span class="promo-form__aviso">{{ aviso() }}</span> }
          </div>
        </form>
      </section>

      <!-- ----------------------------------------------------- Vista previa -->
      <section class="tabla-panel">
        <div class="tabla-panel__cabecera">
          <h3>Vista previa</h3>
          <span class="dato__label">Así se verá en el carrusel</span>
        </div>
        <div class="vista-previa">
          <div class="vista-previa__imagen">
            <img [src]="borrador().imagen" [alt]="borrador().titulo || 'Vista previa'">
          </div>
          <div class="vista-previa__texto">
            <span class="vista-previa__etiqueta">{{ borrador().etiqueta || 'Etiqueta' }}</span>
            <h4>{{ borrador().titulo || 'Título de la promoción' }}</h4>
            <p>{{ borrador().subtitulo || 'Subtítulo de la promoción' }}</p>
            @if (borrador().precio) {
              <div class="vista-previa__precio">
                <strong>{{ soles(borrador().precio || 0) }}</strong>
                @if (borrador().precioAntes) { <s>{{ soles(borrador().precioAntes || 0) }}</s> }
              </div>
            }
          </div>
        </div>
      </section>
    </div>

    <!-- ----------------------------------------------------------- Listado -->
    <div class="tabla-panel">
      <div class="tabla-panel__cabecera">
        <h3>Promociones guardadas</h3>
        <span class="dato__label">{{ lista().length }} registros</span>
      </div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead>
            <tr>
              <th>N.°</th><th>Promoción</th><th>Categoría</th><th class="num">Precio</th>
              <th class="num">Sesiones</th><th>Vigencia</th><th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of lista(); track p.id; let i = $index) {
              <tr>
                <td class="num">{{ i + 1 }}</td>
                <td>
                  <div class="fila-prod">
                    <img class="img-cobertura" [src]="p.imagen" [alt]="p.titulo">
                    <div class="mini-dato"><strong>{{ p.titulo }}</strong><span>{{ p.subtitulo }}</span></div>
                  </div>
                </td>
                <td>{{ p.categoria }}</td>
                <td class="num">
                  {{ p.precio ? soles(p.precio) : '—' }}
                  @if (p.precioAntes) { <small class="tachado">{{ soles(p.precioAntes) }}</small> }
                </td>
                <td class="num">{{ p.sesiones || 1 }}</td>
                <td>{{ p.vigenciaDesde }} — {{ p.vigenciaHasta }}</td>
                <td>
                  <div class="estados-promo">
                    <span [class]="p.activa ? 'chip chip--ok chip--punto' : 'chip chip--error chip--punto'">
                      {{ p.activa ? 'Publicada' : 'Oculta' }}
                    </span>
                    @if (p.destacada) { <span class="chip chip--info">En carrusel</span> }
                  </div>
                </td>
                <td class="num">
                  <div class="acciones-fila">
                    <button class="boton-icono" (click)="cargar(p)">Editar</button>
                    <button class="boton-icono" (click)="promociones.alternarDestacada(p.id)">
                      {{ p.destacada ? 'Quitar del carrusel' : 'Al carrusel' }}
                    </button>
                    <button class="boton-icono" (click)="promociones.alternarActiva(p.id)">
                      {{ p.activa ? 'Ocultar' : 'Publicar' }}
                    </button>
                    <button class="boton-icono boton-icono--peligro" (click)="eliminar(p)">Eliminar</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="vacio">Aún no hay promociones registradas.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .kpis-4 { grid-template-columns: repeat(4, 1fr); margin-bottom: 22px; }
    .promo-columnas { display: grid; grid-template-columns: 1.25fr 1fr; gap: 22px; margin-bottom: 22px; align-items: start; }
    .promo-form { padding: 20px 22px 24px; }
    .promo-form__fila { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }
    .promo-form__acciones { display: flex; align-items: center; gap: 14px; margin-top: 18px; }
    .promo-form__aviso { font-size: .8rem; color: var(--ok); }
    .sesiones-editor {
      margin: 18px 0;
      padding: 18px;
      border: 1px solid var(--linea);
      border-radius: var(--radio-lg);
      background: var(--rosa-50);
    }
    .sesiones-editor__cabecera {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: center;
      margin-bottom: 14px;
    }
    .sesiones-editor__cabecera h4 { margin: 2px 0 0; }
    .sesion-edit {
      display: grid;
      grid-template-columns: 34px minmax(170px, 1fr) minmax(170px, .8fr) 72px;
      gap: 12px;
      align-items: end;
      padding: 14px 0;
      border-top: 1px dashed var(--linea);
    }
    .sesion-edit__numero {
      width: 30px; height: 30px; border-radius: 50%;
      display: grid; place-items: center; align-self: center;
      background: var(--magenta); color: #fff; font-size: .8rem; font-weight: 700;
    }
    .sesion-edit__descripcion { grid-column: 2 / 4; }
    .sesiones-editor__vacio {
      border: 1px dashed var(--linea);
      border-radius: var(--radio);
      padding: 14px;
      color: var(--gris);
      font-size: .86rem;
      background: #fff;
    }
    .interruptores { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; font-size: .84rem; color: var(--gris); }
    .interruptores label { display: flex; align-items: center; gap: 9px; }
    .vista-previa {
      display: grid;
      grid-template-columns: minmax(220px, .9fr) minmax(0, 1fr);
      gap: 0;
      margin: 20px 22px 24px;
      min-height: 300px;
      border: 1px solid var(--linea);
      border-radius: var(--radio-lg);
      overflow: hidden;
      background: #fff;
    }
    .vista-previa__imagen {
      display: grid;
      place-items: center;
      padding: 16px;
      background: var(--rosa-50);
    }
    .vista-previa img {
      width: 100%;
      max-height: 360px;
      object-fit: contain;
      border-radius: var(--radio);
      background: #fff;
    }
    .vista-previa__texto { padding: 28px; color: var(--tinta); align-self: center; }
    .vista-previa__texto h4 { color: var(--vino); margin-bottom: 6px; }
    .vista-previa__texto p { color: var(--gris); font-size: .88rem; }
    .vista-previa__etiqueta {
      display: inline-block; border: 1px solid rgba(176,27,114,.3); border-radius: 999px;
      padding: 4px 12px; font-size: .64rem; letter-spacing: .16em; text-transform: uppercase; margin-bottom: 14px;
      color: var(--magenta);
    }
    .vista-previa__precio { display: flex; align-items: baseline; gap: 10px; }
    .vista-previa__precio strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.7rem; color: var(--magenta); }
    .vista-previa__precio s { color: var(--gris-claro); font-size: .84rem; }
    .fila-prod { display: flex; gap: 12px; align-items: center; }
    .fila-prod img { width: 52px; height: 40px; border-radius: var(--radio); object-fit: cover; background: var(--rosa-50); }
    .estados-promo { display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
    .tachado { display: block; text-decoration: line-through; color: var(--gris-claro); font-size: .74rem; }
    .boton-icono--peligro { color: var(--error); }
    .vacio { text-align: center; color: var(--gris-claro); padding: 26px 0; }
    @media (max-width: 1200px) { .kpis-4 { grid-template-columns: repeat(2, 1fr); } .promo-columnas { grid-template-columns: 1fr; } }
    @media (max-width: 720px) { .vista-previa { grid-template-columns: 1fr; } }
    @media (max-width: 760px) {
      .sesiones-editor__cabecera { align-items: flex-start; flex-direction: column; }
      .sesion-edit { grid-template-columns: 34px 1fr; }
      .sesion-edit__descripcion { grid-column: 2; }
    }
  `]
})
export class PromocionesAdminComponent {
  soles = soles;
  tratamientos = TRATAMIENTOS;
  categorias: Categoria[] = ['Facial', 'Corporal', 'Aparatología', 'Medicina estética', 'General'];

  imagenes = [
    { nombre: 'Limpieza facial', ruta: 'img/trat-limpieza.jpg' },
    { nombre: 'HIFU 25D', ruta: 'img/trat-hifu.jpg' },
    { nombre: 'Hidrolipoclasia', ruta: 'img/trat-hidro.jpg' },
    { nombre: 'Botox', ruta: 'img/trat-botox.jpg' },
    { nombre: 'Peeling', ruta: 'img/trat-peeling.jpg' },
    { nombre: 'Radiofrecuencia', ruta: 'img/trat-radio.jpg' },
    { nombre: 'Drenaje linfático', ruta: 'img/trat-drenaje.jpg' },
    { nombre: 'Tens Booster', ruta: 'img/trat-tens.jpg' },
    { nombre: 'Dermapen', ruta: 'img/trat-dermapen.jpg' },
    { nombre: 'Plasma rico en plaquetas', ruta: 'img/trat-plasma.jpg' },
    { nombre: 'Promo Botox + HIFU', ruta: 'img/promo-botox-hifu.jpg' },
    { nombre: 'Promo reducción de medidas', ruta: 'img/promo-reduce-medidas.jpg' },
    { nombre: 'Promo HIFU + PDRN', ruta: 'img/promo-hifu-pdrn.jpg' },
    { nombre: 'Promo lifting 360', ruta: 'img/promo-lifting-360.jpg' },
    { nombre: 'Promo HIFU + cóctel', ruta: 'img/promo-hifu-coctel.jpg' },
    { nombre: 'Promo Tens Booster', ruta: 'img/promo-tens-booster.jpg' },
    { nombre: 'Promo limpieza profunda', ruta: 'img/promo-limpieza-profunda.jpg' },
    { nombre: 'Promo plasma + colágeno', ruta: 'img/promo-plasma-colageno.jpg' }
  ];

  borrador = signal<Promocion>(promocionVacia());
  aviso = signal('');
  imagenPersonalizada = signal('');

  lista = computed(() => this.promociones.promociones());
  activas = computed(() => this.lista().filter(p => p.activa).length);
  destacadas = computed(() => this.lista().filter(p => p.activa && p.destacada).length);
  multisesion = computed(() => this.lista().filter(p => (p.sesiones || 1) > 1).length);

  constructor(public promociones: PromocionesService) {}

  editar<K extends keyof Promocion>(campo: K, valor: Promocion[K]): void {
    this.borrador.update(p => ({ ...p, [campo]: valor }));
  }

  sesionesDetalle(): NonNullable<Promocion['sesionesDetalle']> {
    return this.borrador().sesionesDetalle ?? [];
  }

  actualizarCantidadSesiones(valor: string | number): void {
    const cantidad = Math.max(1, Number(valor) || 1);
    this.borrador.update(p => {
      const actuales = p.sesionesDetalle ?? [];
      const sesionesDetalle = Array.from({ length: cantidad }, (_, i) => actuales[i] ?? {
        titulo: `Sesión ${i + 1}`,
        descripcion: '',
        tratamientoId: undefined
      });
      return { ...p, sesiones: cantidad, sesionesDetalle };
    });
  }

  agregarSesion(): void {
    this.borrador.update(p => {
      const sesionesDetalle = [...(p.sesionesDetalle ?? []), {
        titulo: `Sesión ${(p.sesionesDetalle?.length ?? 0) + 1}`,
        descripcion: '',
        tratamientoId: undefined
      }];
      return { ...p, sesiones: sesionesDetalle.length, sesionesDetalle };
    });
  }

  eliminarSesion(index: number): void {
    this.borrador.update(p => {
      const sesionesDetalle = (p.sesionesDetalle ?? []).filter((_, i) => i !== index);
      return { ...p, sesiones: Math.max(1, sesionesDetalle.length || 1), sesionesDetalle };
    });
  }

  editarSesion(index: number, campo: 'titulo' | 'descripcion', valor: string): void {
    this.borrador.update(p => ({
      ...p,
      sesionesDetalle: (p.sesionesDetalle ?? []).map((s, i) => i === index ? { ...s, [campo]: valor } : s)
    }));
  }

  editarSesionTratamiento(index: number, valor: string | number): void {
    const tratamientoId = Number(valor) || undefined;
    this.borrador.update(p => ({
      ...p,
      sesionesDetalle: (p.sesionesDetalle ?? []).map((s, i) => i === index ? { ...s, tratamientoId } : s)
    }));
  }

  nueva(): void {
    this.borrador.set(promocionVacia());
    this.aviso.set('');
  }

  cargar(p: Promocion): void {
    this.borrador.set({ ...p, sesionesDetalle: p.sesionesDetalle?.map(s => ({ ...s })) });
    this.imagenPersonalizada.set(p.imagen);
    this.aviso.set('');
  }

  usarImagenPersonalizada(): void {
    this.editar('imagen', this.imagenPersonalizada().trim());
  }

  subirImagen(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) { return; }
    const lector = new FileReader();
    lector.onload = () => {
      const imagen = String(lector.result || '');
      this.imagenPersonalizada.set(imagen);
      this.editar('imagen', imagen);
      this.aviso.set('Imagen cargada para vista previa. En producción se guardará en el servidor.');
    };
    lector.readAsDataURL(archivo);
  }

  guardar(): void {
    const p = this.borrador();
    if (!p.titulo.trim()) { return; }
    this.promociones.guardar(p);
    this.aviso.set(p.id ? 'Promoción actualizada.' : 'Promoción registrada y publicada en el inicio.');
    this.borrador.set(promocionVacia());
  }

  eliminar(p: Promocion): void {
    this.promociones.eliminar(p.id);
    if (this.borrador().id === p.id) { this.nueva(); }
    this.aviso.set('Promoción eliminada.');
  }
}
