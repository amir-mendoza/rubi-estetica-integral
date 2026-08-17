import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PRODUCTOS, productoPorId, soles } from '../data/datos';
import { CarritoService } from '../compartido/carrito.service';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (producto(); as p) {
      <section class="seccion seccion--compacta">
        <div class="contenedor detalle-prod">
          <figure class="detalle-prod__imagen"><img [src]="p.imagen" [alt]="p.nombre"></figure>
          <div>
            <div class="miga">
              <a routerLink="/">Inicio</a> / <a routerLink="/productos">Productos</a> / {{ p.nombre }}
            </div>
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
                <li>Recojo en Sede Las Flores 1522 — sin costo</li>
                <li>Recojo en Sede Las Flores 1544 — sin costo</li>
                <li>Por ahora no realizamos envíos a domicilio</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="seccion seccion--rosa">
        <div class="contenedor">
          <div class="encabezado-seccion"><h2>Otros productos</h2><div class="filete"></div></div>
          <div class="grid grid-4">
            @for (o of relacionados(); track o.id) {
              <article class="tarjeta-prod">
                <a [routerLink]="['/productos', o.id]" class="tarjeta-prod__imagen"><img [src]="o.imagen" [alt]="o.nombre"></a>
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
  styles: [`
    .detalle-prod { display: grid; grid-template-columns: 1fr 1.1fr; gap: 64px; align-items: center; }
    .detalle-prod__imagen { margin: 0; border-radius: var(--radio-lg); overflow: hidden; background: var(--rosa-50); }
    .detalle-prod__imagen img { width: 100%; aspect-ratio: 1/1; object-fit: cover; }
    .detalle-prod__acciones { display: flex; gap: 14px; margin: 28px 0; flex-wrap: wrap; }
    .detalle-prod__entrega { border-top: 1px solid var(--linea); padding-top: 22px; }
    .detalle-prod__entrega ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    .detalle-prod__entrega li { font-size: .9rem; color: var(--gris); padding-left: 18px; position: relative; }
    .detalle-prod__entrega li::before { content: ''; position: absolute; left: 0; top: 10px; width: 6px; height: 6px; border-radius: 50%; background: var(--magenta-300); }
    @media (max-width: 960px) { .detalle-prod { grid-template-columns: 1fr; gap: 32px; } }
  `]
})
export class ProductoDetalleComponent {
  private ruta = inject(ActivatedRoute);
  private parametros = toSignal(this.ruta.paramMap, { initialValue: this.ruta.snapshot.paramMap });
  carrito = inject(CarritoService);
  soles = soles;

  producto = computed(() => productoPorId(Number(this.parametros().get('id'))) ?? PRODUCTOS[0]);
  relacionados = computed(() => PRODUCTOS.filter(p => p.id !== this.producto().id).slice(0, 4));
}
