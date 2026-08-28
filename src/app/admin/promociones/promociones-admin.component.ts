import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HOY_ISO, TRATAMIENTOS, soles } from '../../data/datos';
import { CategoriaTratamiento, Promocion } from '../../data/modelos';
import { PromocionesService } from '../../compartido/promociones.service';
import { SubidasService } from '../../compartido/subidas.service';

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
    nombreImagen: 'Imagen de promoción',
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

    <section class="tabla-panel categorias-panel">
      <div class="tabla-panel__cabecera">
        <div>
          <h3>Categorías de promoción</h3>
          <span class="dato__label">Úsalas para ordenar promociones y filtros futuros</span>
        </div>
      </div>
      <div class="categorias-admin">
        <div class="categorias-admin__lista">
          @for (c of categorias(); track c) {
            <span class="categoria-chip">
              {{ c }}
              <button type="button" (click)="eliminarCategoria(c)" aria-label="Eliminar categoría">×</button>
            </span>
          }
        </div>
        <div class="categorias-admin__nuevo">
          <input placeholder="Nueva categoría" [(ngModel)]="nuevaCategoria" name="nuevaCategoriaPromo">
          <button type="button" class="btn btn--linea btn--sm" (click)="agregarCategoria()" [disabled]="!nuevaCategoria.trim()">Agregar categoría</button>
        </div>
      </div>
    </section>

    @if (formularioVisible()) {
    <div class="promo-columnas">
      <!-- ------------------------------------------------------ Formulario -->
      <section class="tabla-panel">
        <div class="tabla-panel__cabecera">
          <h3>{{ borrador().id ? 'Editar promoción' : 'Registrar promoción' }}</h3>
          <button class="boton-icono" (click)="cerrarFormulario()">Cerrar formulario</button>
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
                @for (c of categorias(); track c) { <option [value]="c">{{ c }}</option> }
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
              <label>Nombre interno de la imagen</label>
              <input placeholder="Ej. Promo lifting facial agosto"
                     [ngModel]="borrador().nombreImagen" (ngModelChange)="editar('nombreImagen', $event)" name="nombreImagen">
            </div>
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
      <section class="tabla-panel preview-panel">
        <div class="tabla-panel__cabecera">
          <h3>Vista previa</h3>
          <span class="dato__label">Inicio y carrusel antes de publicar</span>
        </div>

        <div class="preview-stack">
          <div class="preview-bloque">
            <div class="preview-bloque__cabecera">
              <div>
                <span class="dato__label">Inicio / carrusel principal</span>
                <p>Así se verá si la promoción queda destacada en la página de inicio.</p>
              </div>
            </div>

            <article class="preview-hero">
              <div class="preview-hero__media">
                <img [src]="borrador().imagen" [alt]="tituloPreview()">
                <span class="preview-hero__badge">{{ sesionesTexto() }}</span>
              </div>
              <div class="preview-hero__body">
                <span class="preview-pill">{{ etiquetaPreview() }}</span>
                <h4>{{ tituloPreview() }}</h4>
                <strong>{{ subtituloPreview() }}</strong>
                <p>{{ descripcionPreview() }}</p>

                <div class="preview-incluye">
                  <span class="dato__label">Incluye</span>
                  @for (s of sesionesPreview(); track $index; let i = $index) {
                    <div class="preview-incluye__item">
                      <span>{{ i + 1 }}</span>
                      <div>
                        <strong>{{ s.titulo || ('Sesión ' + (i + 1)) }}</strong>
                        @if (s.tratamientoId) { <small>{{ tratamientoNombre(s.tratamientoId) }}</small> }
                        @if (s.descripcion) { <p>{{ s.descripcion }}</p> }
                      </div>
                    </div>
                  }
                </div>

                <div class="preview-hero__meta">
                  <div>
                    <span class="dato__label">Precio especial</span>
                    <strong>{{ borrador().precio ? soles(borrador().precio || 0) : 'S/ 0' }}</strong>
                    @if (borrador().precioAntes) { <s>Antes {{ soles(borrador().precioAntes || 0) }}</s> }
                  </div>
                  <div>
                    <span class="dato__label">Vigente hasta</span>
                    <b>{{ borrador().vigenciaHasta || 'Por definir' }}</b>
                  </div>
                </div>

                <div class="preview-hero__acciones">
                  <span>Reservar promoción</span>
                  <span>Consultar por WhatsApp</span>
                </div>
              </div>
            </article>
          </div>

          <div class="preview-bloque preview-bloque--compacto">
            <div class="preview-bloque__cabecera">
              <div>
                <span class="dato__label">Tarjeta de promociones</span>
                <p>Así aparecerá en el listado o carrusel vertical de promociones.</p>
              </div>
            </div>

            <article class="preview-card">
              <img [src]="borrador().imagen" [alt]="tituloPreview()">
              <div class="preview-card__body">
                <span class="dato__label">{{ borrador().categoria || 'Categoría' }}</span>
                <h4>{{ tituloPreview() }}</h4>
                <p>{{ subtituloPreview() }}</p>
                <ul>
                  @for (s of sesionesPreview(); track $index) {
                    <li>{{ s.titulo || 'Sesión' }}</li>
                  }
                </ul>
                <div class="preview-card__pie">
                  <div>
                    @if (borrador().precioAntes) { <s>{{ soles(borrador().precioAntes || 0) }}</s> }
                    <strong>{{ borrador().precio ? soles(borrador().precio || 0) : 'S/ 0' }}</strong>
                  </div>
                  <span>Reservar</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
    }

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
    .categorias-panel { margin-bottom: 22px; }
    .categorias-admin { display: grid; grid-template-columns: 1fr minmax(280px, .5fr); gap: 16px; padding: 18px 22px 22px; align-items: start; }
    .categorias-admin__lista { display: flex; flex-wrap: wrap; gap: 8px; }
    .categoria-chip {
      display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--linea);
      border-radius: 999px; padding: 7px 10px 7px 13px; background: #fff; color: var(--gris); font-size: .86rem;
    }
    .categoria-chip button {
      border: 0; background: var(--rosa-50); color: var(--error); width: 20px; height: 20px;
      border-radius: 50%; cursor: pointer; line-height: 1;
    }
    .categorias-admin__nuevo { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
    .promo-columnas { display: grid; grid-template-columns: 1.25fr 1fr; gap: 22px; margin-bottom: 22px; align-items: start; }
    .promo-form { padding: 20px 22px 24px; }
    .promo-form__fila { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }
    .promo-form__acciones { display: flex; align-items: center; gap: 14px; margin-top: 18px; }
    .promo-form__aviso { font-size: .9rem; color: var(--ok); }
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
      background: var(--magenta); color: #fff; font-size: .9rem; font-weight: 700;
    }
    .sesion-edit__descripcion { grid-column: 2 / 4; }
    .sesiones-editor__vacio {
      border: 1px dashed var(--linea);
      border-radius: var(--radio);
      padding: 14px;
      color: var(--gris);
      font-size: .94rem;
      background: #fff;
    }
    .interruptores { display: flex; flex-direction: column; gap: 8px; margin-top: 14px; font-size: .9rem; color: var(--gris); }
    .interruptores label { display: flex; align-items: center; gap: 9px; }
    .preview-panel { position: sticky; top: 18px; }
    .preview-stack { display: grid; gap: 18px; padding: 20px 22px 24px; }
    .preview-bloque {
      border: 1px solid var(--linea);
      border-radius: var(--radio-lg);
      background: #fff;
      overflow: hidden;
    }
    .preview-bloque__cabecera {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      padding: 16px 18px 0;
    }
    .preview-bloque__cabecera p { margin: 4px 0 0; color: var(--gris); font-size: .9rem; }
    .preview-hero {
      display: grid;
      grid-template-columns: minmax(240px, .92fr) minmax(0, 1.08fr);
      min-height: 460px;
      background: #fff;
    }
    .preview-hero__media {
      position: relative;
      display: grid;
      place-items: center;
      padding: 28px 22px;
      background: linear-gradient(145deg, #fff7fb 0%, #f7e8ef 100%);
    }
    .preview-hero__media img {
      width: 100%;
      max-height: 360px;
      object-fit: contain;
      border-radius: var(--radio);
      background: #fff;
      box-shadow: 0 18px 45px rgba(116, 16, 55, .12);
    }
    .preview-hero__badge {
      position: absolute;
      right: 24px;
      bottom: 24px;
      width: 94px;
      height: 94px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      text-align: center;
      padding: 12px;
      background: var(--magenta);
      color: #fff;
      font-size: .76rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .08em;
      box-shadow: 0 16px 32px rgba(176, 27, 114, .24);
    }
    .preview-hero__body { padding: 28px 28px 30px; align-self: center; color: var(--tinta); }
    .preview-pill {
      display: inline-block;
      border: 1px solid rgba(176,27,114,.3);
      border-radius: 999px;
      padding: 5px 14px;
      font-size: .72rem;
      letter-spacing: .18em;
      text-transform: uppercase;
      margin-bottom: 16px;
      color: var(--magenta);
      font-weight: 700;
    }
    .preview-hero h4 {
      margin: 0 0 10px;
      color: var(--vino);
      font-size: clamp(2rem, 4vw, 3.6rem);
      line-height: .96;
    }
    .preview-hero__body > strong {
      display: block;
      color: var(--vino);
      font-size: 1.05rem;
      margin-bottom: 12px;
    }
    .preview-hero__body > p { color: var(--gris); line-height: 1.7; margin-bottom: 18px; }
    .preview-incluye {
      display: grid;
      gap: 10px;
      padding: 16px;
      border: 1px solid var(--linea);
      border-radius: var(--radio);
      background: var(--rosa-50);
      margin-bottom: 20px;
    }
    .preview-incluye__item { display: grid; grid-template-columns: 28px 1fr; gap: 10px; align-items: start; }
    .preview-incluye__item > span {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--magenta);
      color: #fff;
      font-size: .74rem;
      font-weight: 800;
    }
    .preview-incluye__item strong { display: block; color: var(--vino); font-size: .92rem; }
    .preview-incluye__item small { display: block; color: var(--gris); margin-top: 2px; }
    .preview-incluye__item p { margin: 3px 0 0; color: var(--gris); font-size: .84rem; line-height: 1.45; }
    .preview-hero__meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      padding-top: 18px;
      border-top: 1px solid var(--linea);
    }
    .preview-hero__meta strong {
      display: block;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 2.2rem;
      color: var(--magenta);
      line-height: 1;
    }
    .preview-hero__meta s { display: block; color: var(--gris-claro); margin-top: 6px; }
    .preview-hero__meta b { display: block; color: var(--vino); margin-top: 8px; }
    .preview-hero__acciones {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 22px;
    }
    .preview-hero__acciones span {
      border: 1px solid var(--vino);
      border-radius: var(--radio);
      padding: 12px 16px;
      color: var(--vino);
      font-size: .78rem;
      font-weight: 800;
      letter-spacing: .14em;
      text-transform: uppercase;
    }
    .preview-hero__acciones span:first-child { background: var(--magenta); border-color: var(--magenta); color: #fff; }
    .preview-card {
      margin: 18px;
      max-width: 360px;
      border: 1px solid var(--linea);
      border-radius: var(--radio-lg);
      overflow: hidden;
      background: #fff;
      box-shadow: 0 16px 34px rgba(116, 16, 55, .08);
    }
    .preview-card img { width: 100%; aspect-ratio: 1.35 / 1; object-fit: contain; background: var(--rosa-50); }
    .preview-card__body { padding: 18px; }
    .preview-card h4 { margin: 8px 0 8px; color: var(--vino); font-size: 1.3rem; line-height: 1.18; }
    .preview-card p { color: var(--gris); font-size: .9rem; line-height: 1.5; }
    .preview-card ul { margin: 14px 0; padding: 0 0 0 16px; color: var(--gris); font-size: .86rem; }
    .preview-card li { margin-bottom: 6px; }
    .preview-card li::marker { color: var(--magenta); }
    .preview-card__pie {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 12px;
      padding-top: 14px;
      border-top: 1px solid var(--linea);
    }
    .preview-card__pie s { display: block; color: var(--gris-claro); font-size: .82rem; }
    .preview-card__pie strong {
      display: block;
      font-family: 'Cormorant Garamond', Georgia, serif;
      color: var(--magenta);
      font-size: 1.8rem;
      line-height: 1;
    }
    .preview-card__pie span {
      color: var(--magenta);
      font-size: .76rem;
      font-weight: 800;
      letter-spacing: .16em;
      text-transform: uppercase;
    }
    .fila-prod { display: flex; gap: 12px; align-items: center; }
    .fila-prod img { width: 52px; height: 40px; border-radius: var(--radio); object-fit: cover; background: var(--rosa-50); }
    .estados-promo { display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
    .tachado { display: block; text-decoration: line-through; color: var(--gris-claro); font-size: .86rem; }
    .boton-icono--peligro { color: var(--error); }
    .vacio { text-align: center; color: var(--gris-claro); padding: 26px 0; }
    @media (max-width: 1200px) { .kpis-4 { grid-template-columns: repeat(2, 1fr); } .promo-columnas, .categorias-admin { grid-template-columns: 1fr; } }
    @media (max-width: 720px) {
      .preview-stack { padding: 16px; }
      .preview-hero { grid-template-columns: 1fr; }
      .preview-hero__body { padding: 22px; }
      .preview-hero__meta { grid-template-columns: 1fr; }
      .preview-card { max-width: none; }
    }
    @media (max-width: 760px) {
      .sesiones-editor__cabecera { align-items: flex-start; flex-direction: column; }
      .sesion-edit { grid-template-columns: 34px 1fr; }
      .sesion-edit__descripcion { grid-column: 2; }
    }
  `]
})
export class PromocionesAdminComponent {
  private subidas = inject(SubidasService);
  soles = soles;
  tratamientos = TRATAMIENTOS;
  categorias = signal<Categoria[]>(['Facial', 'Corporal', 'Aparatología', 'Medicina estética', 'General']);
  nuevaCategoria = '';

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
  formularioVisible = signal(false);

  lista = computed(() => this.promociones.promociones());
  activas = computed(() => this.lista().filter(p => p.activa).length);
  destacadas = computed(() => this.lista().filter(p => p.activa && p.destacada).length);
  multisesion = computed(() => this.lista().filter(p => (p.sesiones || 1) > 1).length);

  constructor(public promociones: PromocionesService) {}

  agregarCategoria(): void {
    const nombre = this.nuevaCategoria.trim();
    if (!nombre || this.categorias().some(c => c.toLowerCase() === nombre.toLowerCase())) { return; }
    this.categorias.update(lista => [...lista, nombre as Categoria]);
    this.editar('categoria', nombre as Categoria);
    this.nuevaCategoria = '';
  }

  eliminarCategoria(categoria: Categoria): void {
    const restantes = this.categorias().filter(c => c !== categoria);
    const reemplazo = (restantes[0] ?? 'General') as Categoria;
    this.categorias.set(restantes.length ? restantes : [reemplazo]);
    this.promociones.reasignarCategoria(categoria, reemplazo);
    if (this.borrador().categoria === categoria) {
      this.editar('categoria', reemplazo);
    }
  }

  categoriaUsada(categoria: Categoria): boolean {
    return this.lista().some(p => p.categoria === categoria);
  }

  editar<K extends keyof Promocion>(campo: K, valor: Promocion[K]): void {
    this.borrador.update(p => ({ ...p, [campo]: valor }));
  }

  sesionesDetalle(): NonNullable<Promocion['sesionesDetalle']> {
    return this.borrador().sesionesDetalle ?? [];
  }

  tituloPreview(): string {
    return this.borrador().titulo?.trim() || 'Título de la promoción';
  }

  subtituloPreview(): string {
    return this.borrador().subtitulo?.trim() || 'Subtítulo de la promoción';
  }

  descripcionPreview(): string {
    return this.borrador().descripcion?.trim() || 'Describe aquí qué incluye, para quién es y qué resultado promete esta promoción.';
  }

  etiquetaPreview(): string {
    return this.borrador().etiqueta?.trim() || 'Promoción del mes';
  }

  sesionesConteo(): number {
    return Math.max(Number(this.borrador().sesiones || this.sesionesPreview().length || 1), 1);
  }

  sesionesTexto(): string {
    const total = this.sesionesConteo();
    return `${total} ${total === 1 ? 'sesión' : 'sesiones'}`;
  }

  sesionesPreview(): NonNullable<Promocion['sesionesDetalle']> {
    const detalle = this.sesionesDetalle().filter(s => s.titulo?.trim() || s.descripcion?.trim() || s.tratamientoId);
    if (detalle.length) { return detalle; }
    const cantidad = Math.max(Number(this.borrador().sesiones || 1), 1);
    return Array.from({ length: cantidad }, (_, i) => ({
      titulo: `Sesión ${i + 1}`,
      descripcion: '',
      tratamientoId: undefined
    }));
  }

  tratamientoNombre(id?: number): string {
    if (!id) { return ''; }
    return this.tratamientos.find(t => t.id === Number(id))?.nombre ?? '';
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
    this.imagenPersonalizada.set('');
    this.aviso.set('');
    this.formularioVisible.set(true);
  }

  cerrarFormulario(): void {
    this.borrador.set(promocionVacia());
    this.imagenPersonalizada.set('');
    this.aviso.set('');
    this.formularioVisible.set(false);
  }

  cargar(p: Promocion): void {
    this.borrador.set({ ...p, sesionesDetalle: p.sesionesDetalle?.map(s => ({ ...s })) });
    this.imagenPersonalizada.set(p.imagen);
    this.aviso.set('');
    this.formularioVisible.set(true);
  }

  usarImagenPersonalizada(): void {
    this.editar('imagen', this.imagenPersonalizada().trim());
  }

  subirImagen(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) { return; }
    this.subidas.leer(archivo, 'Imagen')
      .then(imagen => {
        this.imagenPersonalizada.set(imagen);
        this.editar('imagen', imagen);
        this.editar('nombreImagen', archivo.name);
        this.aviso.set('Imagen cargada para vista previa. En producción se guardará en el servidor.');
      })
      .catch(() => undefined);
  }

  guardar(): void {
    const p = this.borrador();
    if (!p.titulo.trim()) { return; }
    this.promociones.guardar(p);
    this.aviso.set(p.id ? 'Promoción actualizada.' : 'Promoción registrada y publicada en el inicio.');
    this.borrador.set(promocionVacia());
    this.imagenPersonalizada.set('');
    this.formularioVisible.set(false);
  }

  eliminar(p: Promocion): void {
    this.promociones.eliminar(p.id);
    if (this.borrador().id === p.id) { this.nueva(); }
    this.aviso.set('Promoción eliminada.');
  }
}
