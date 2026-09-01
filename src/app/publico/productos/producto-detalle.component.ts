import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PRODUCTOS, productoPorId, soles } from '../../data/datos';
import { CarritoService } from '../../compartido/carrito.service';
import { RedesEnlacesComponent } from '../../compartido/redes-enlaces.component';
import { RedesService } from '../../compartido/redes.service';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [RouterLink, RedesEnlacesComponent],
  template: `
    @if (producto(); as p) {
      <section class="seccion seccion--compacta detalle-prod-seccion">
        <div class="contenedor">
          <div class="detalle-prod__navegacion">
            <a routerLink="/productos" class="volver-link">← Volver a productos</a>
            <div class="miga">
              <a routerLink="/">Inicio</a> / <a routerLink="/productos">Productos</a> / {{ p.nombre }}
            </div>
          </div>

          <div class="detalle-prod">
            <figure class="detalle-prod__imagen"><img class="img-cobertura" [src]="p.imagen" [alt]="p.nombre"></figure>
            <div class="detalle-prod__contenido">
              <span class="eyebrow">{{ p.marca }} · {{ p.categoria }}</span>
              <h1 style="font-size:2.4rem">{{ p.nombre }}</h1>
              <p class="lead">{{ p.descripcion }}</p>

              <div class="precio" style="margin:24px 0">
                @if (p.precioAntes) { <span class="precio__antes">{{ soles(p.precioAntes) }}</span> }
                <span class="precio__actual" style="font-size:2.2rem">{{ soles(p.precio) }}</span>
              </div>

              @if (p.stock > 0) {
                <span class="chip chip--ok chip--punto">Disponible · {{ p.stock }} unidades</span>
              } @else {
                <span class="chip chip--error chip--punto">Sin stock por ahora</span>
              }

              <div class="detalle-prod__acciones">
                <button class="btn btn--primario" [disabled]="p.stock === 0" (click)="carrito.agregar(p)">
                  Agregar al carrito
                </button>
                <a routerLink="/carrito" class="btn btn--linea">Ver carrito ({{ carrito.cantidad() }})</a>
              </div>

              <div class="detalle-prod__entrega">
                <h4>Entrega del producto</h4>
                <ul>
                  <li>Recojo en Sede Las Flores 1522 sin costo</li>
                  <li>Recojo en Sede Las Flores 1544 sin costo</li>
                  <li>Por ahora no realizamos envíos a domicilio</li>
                </ul>
              </div>

              @if (redes.activas().length) {
                <div class="detalle-prod__redes">
                  <span>Síguenos</span>
                  <app-redes-enlaces />
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <section class="seccion detalle-prod-info">
        <div class="contenedor detalle-prod-info__grid">
          <div>
            <span class="eyebrow">Información del producto</span>
            <h2>Cómo ayuda en tu rutina</h2>
            <div class="filete"></div>
            <p>{{ p.descripcion }}</p>
          </div>

          <div class="detalle-prod-info__bloques">
            @if (p.beneficios?.length) {
              <article>
                <h3>Beneficios</h3>
                <ul>@for (b of p.beneficios; track b) { <li>{{ b }}</li> }</ul>
              </article>
            }
            @if (p.modoUso?.length) {
              <article>
                <h3>Modo de uso</h3>
                <ul>@for (u of p.modoUso; track u) { <li>{{ u }}</li> }</ul>
              </article>
            }
            @if (p.recomendaciones?.length) {
              <article>
                <h3>Recomendaciones</h3>
                <ul>@for (r of p.recomendaciones; track r) { <li>{{ r }}</li> }</ul>
              </article>
            }
          </div>
        </div>
      </section>

      <section class="seccion seccion--rosa">
        <div class="contenedor">
          <div class="encabezado-seccion"><h2>Otros productos</h2><div class="filete"></div></div>
          <div class="grid grid-4 catalogo-compacto catalogo-productos">
            @for (o of relacionados(); track o.id) {
              <article class="tarjeta-prod">
                <a [routerLink]="['/productos', o.id]" class="tarjeta-prod__imagen"><img class="img-cobertura" [src]="o.imagen" [alt]="o.nombre"></a>
                <div class="tarjeta-prod__cuerpo">
                  <span class="tarjeta-prod__marca">{{ o.marca }}</span>
                  <h4>{{ o.nombre }}</h4>
                  <div class="precio"><span class="precio__actual">{{ soles(o.precio) }}</span></div>
                </div>
              </article>
            }
          </div>
        </div>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    .detalle-prod__redes {
      display: flex; align-items: center; flex-wrap: wrap; gap: 14px; min-width: 0;
      margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--linea);
    }
    .detalle-prod__redes > span {
      font-size: .82rem; letter-spacing: .16em; text-transform: uppercase; color: var(--gris-claro);
    }
    .detalle-prod__navegacion {
      display: grid;
      gap: 8px;
      margin-bottom: 24px;
    }
    .detalle-prod__navegacion .miga {
      margin-bottom: 0;
      overflow-wrap: anywhere;
    }
    .detalle-prod { display: grid; grid-template-columns: 1fr 1.1fr; gap: 64px; align-items: center; }
    .detalle-prod__contenido { min-width: 0; }
    .volver-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
      color: var(--vino);
      font-size: .94rem;
      font-weight: 600;
    }
    .volver-link:hover { color: var(--magenta); }
    .detalle-prod__imagen { margin: 0; border-radius: var(--radio-lg); overflow: hidden; background: var(--rosa-50); }
    .detalle-prod__imagen img { width: 100%; aspect-ratio: 1/1; object-fit: cover; }
    .detalle-prod__acciones { display: flex; gap: 14px; margin: 28px 0; flex-wrap: wrap; }
    .detalle-prod__entrega { border-top: 1px solid var(--linea); padding-top: 22px; }
    .detalle-prod__entrega ul, .detalle-prod-info ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    .detalle-prod__entrega li, .detalle-prod-info li { font-size: .96rem; color: var(--gris); padding-left: 18px; position: relative; }
    .detalle-prod__entrega li::before, .detalle-prod-info li::before { content: ''; position: absolute; left: 0; top: 10px; width: 6px; height: 6px; border-radius: 50%; background: var(--magenta-300); }
    .detalle-prod-info { padding-top: 0; }
    .detalle-prod-info__grid { display: grid; grid-template-columns: .82fr 1.18fr; gap: 60px; align-items: start; }
    .detalle-prod-info__bloques { display: grid; gap: 18px; }
    .detalle-prod-info article {
      border: 1px solid var(--linea);
      border-radius: var(--radio-lg);
      padding: 24px;
      background: #fff;
    }
    .detalle-prod-info h3 { font-size: 1.3rem; margin-bottom: 12px; }
    @media (max-width: 960px) {
      .detalle-prod-seccion { padding-top: 34px; }
      .detalle-prod {
        grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
        gap: 32px;
        align-items: start;
      }
      .detalle-prod__navegacion { margin-bottom: 18px; }
      .detalle-prod__imagen img { aspect-ratio: 4 / 3; }
      .detalle-prod-info__grid { grid-template-columns: 1fr; gap: 28px; }
    }
    @media (max-width: 700px) {
      .detalle-prod { grid-template-columns: 1fr; gap: 22px; }
      .detalle-prod__imagen img {
        aspect-ratio: 16 / 10;
        max-height: 330px;
      }
    }
    @media (max-width: 640px) {
      .detalle-prod-seccion { padding-top: 28px; }
      .detalle-prod__imagen { border-radius: 6px; }
      .detalle-prod__navegacion .miga {
        font-size: .78rem;
        line-height: 1.7;
        letter-spacing: .12em;
      }
      .detalle-prod__contenido h1 { font-size: 2rem !important; }
    }
  `]
})
export class ProductoDetalleComponent {
  private ruta = inject(ActivatedRoute);
  private parametros = toSignal(this.ruta.paramMap, { initialValue: this.ruta.snapshot.paramMap });
  carrito = inject(CarritoService);
  readonly redes = inject(RedesService);
  soles = soles;

  producto = computed(() => productoPorId(Number(this.parametros().get('id'))) ?? PRODUCTOS[0]);
  relacionados = computed(() => PRODUCTOS.filter(p => p.id !== this.producto().id).slice(0, 4));
}
