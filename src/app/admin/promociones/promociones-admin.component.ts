import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HOY_ISO, soles } from '../../data/datos';
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
                     [ngModel]="borrador().sesiones" (ngModelChange)="editar('sesiones', $event)" name="sesiones">
            </div>
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
            <span class="campo__ayuda">Imágenes referenciales del prototipo. Después se cargarán las fotos reales.</span>
          </div>

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
          <img class="img-cobertura" [src]="borrador().imagen" [alt]="borrador().titulo || 'Vista previa'">
          <div class="vista-previa__velo"></div>
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
    .interruptores { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; font-size: .84rem; color: var(--gris); }
    .interruptores label { display: flex; align-items: center; gap: 9px; }
    .vista-previa { position: relative; margin: 20px 22px 24px; height: 260px; border-radius: var(--radio-lg); overflow: hidden; }
    .vista-previa img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .vista-previa__velo { position: absolute; inset: 0; background: linear-gradient(100deg, rgba(77,13,39,.92), rgba(110,19,56,.35)); }
    .vista-previa__texto { position: relative; padding: 26px; color: #fff; }
    .vista-previa__texto h4 { color: #fff; margin-bottom: 6px; }
    .vista-previa__texto p { color: rgba(255,255,255,.8); font-size: .88rem; }
    .vista-previa__etiqueta {
      display: inline-block; border: 1px solid rgba(255,255,255,.5); border-radius: 999px;
      padding: 4px 12px; font-size: .64rem; letter-spacing: .16em; text-transform: uppercase; margin-bottom: 14px;
    }
    .vista-previa__precio { display: flex; align-items: baseline; gap: 10px; }
    .vista-previa__precio strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.7rem; }
    .vista-previa__precio s { color: rgba(255,255,255,.65); font-size: .84rem; }
    .fila-prod { display: flex; gap: 12px; align-items: center; }
    .fila-prod img { width: 52px; height: 40px; border-radius: var(--radio); object-fit: cover; background: var(--rosa-50); }
    .estados-promo { display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
    .tachado { display: block; text-decoration: line-through; color: var(--gris-claro); font-size: .74rem; }
    .boton-icono--peligro { color: var(--error); }
    .vacio { text-align: center; color: var(--gris-claro); padding: 26px 0; }
    @media (max-width: 1200px) { .kpis-4 { grid-template-columns: repeat(2, 1fr); } .promo-columnas { grid-template-columns: 1fr; } }
  `]
})
export class PromocionesAdminComponent {
  soles = soles;
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
    { nombre: 'Plasma rico en plaquetas', ruta: 'img/trat-plasma.jpg' }
  ];

  borrador = signal<Promocion>(promocionVacia());
  aviso = signal('');

  lista = computed(() => this.promociones.promociones());
  activas = computed(() => this.lista().filter(p => p.activa).length);
  destacadas = computed(() => this.lista().filter(p => p.activa && p.destacada).length);
  multisesion = computed(() => this.lista().filter(p => (p.sesiones || 1) > 1).length);

  constructor(public promociones: PromocionesService) {}

  editar<K extends keyof Promocion>(campo: K, valor: Promocion[K]): void {
    this.borrador.update(p => ({ ...p, [campo]: valor }));
  }

  nueva(): void {
    this.borrador.set(promocionVacia());
    this.aviso.set('');
  }

  cargar(p: Promocion): void {
    this.borrador.set({ ...p });
    this.aviso.set('');
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
