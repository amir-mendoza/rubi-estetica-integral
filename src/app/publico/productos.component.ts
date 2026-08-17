import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CATEGORIAS_PRODUCTO, PRODUCTOS, soles } from '../data/datos';
import { CarritoService } from '../compartido/carrito.service';
import { Producto } from '../data/modelos';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <div class="miga"><a routerLink="/">Inicio</a> / Productos</div>
        <h1>Tienda</h1>
        <p>
          Cosmética profesional seleccionada por nuestras especialistas. Recojo en cualquiera de
          nuestras dos sedes de Las Flores de Primavera; por ahora no realizamos envíos.
        </p>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor">
        <div class="barra-tienda">
          <div class="filtros__grupo">
            @for (c of categorias; track c) {
              <button class="filtro" [class.filtro--activo]="categoria() === c" (click)="categoria.set(c)">{{ c }}</button>
            }
          </div>
          <div class="barra-tienda__buscador">
            <input type="search" placeholder="Buscar producto" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
            <a routerLink="/carrito" class="btn btn--linea btn--sm">
              Carrito ({{ carrito.cantidad() }})
            </a>
          </div>
        </div>

        <div class="grid grid-4">
          @for (p of lista(); track p.id) {
            <article class="tarjeta-prod">
              <a [routerLink]="['/productos', p.id]" class="tarjeta-prod__imagen">
                <img [src]="p.imagen" [alt]="p.nombre">
              </a>
              <div class="tarjeta-prod__cuerpo">
                <span class="tarjeta-prod__marca">{{ p.marca }}</span>
                <h4>{{ p.nombre }}</h4>
                <div class="precio">
                  @if (p.precioAntes) { <span class="precio__antes">{{ soles(p.precioAntes) }}</span> }
                  <span class="precio__actual">{{ soles(p.precio) }}</span>
                </div>
                @if (p.stock > 0) {
                  <span class="chip chip--ok chip--punto">{{ p.stock }} en stock</span>
                } @else {
                  <span class="chip chip--error chip--punto">Sin stock</span>
                }
                <button class="btn btn--vino btn--sm btn--bloque" style="margin-top:auto"
                        [disabled]="p.stock === 0" (click)="agregar(p)">
                  Agregar al carrito
                </button>
              </div>
            </article>
          }
        </div>

        @if (!lista().length) {
          <p class="texto-centro" style="padding:48px 0">No encontramos productos con ese criterio.</p>
        }
      </div>
    </section>
  `,
  styles: [`
    .barra-tienda {
      display: flex; align-items: center; justify-content: space-between; gap: 20px;
      flex-wrap: wrap; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid var(--linea);
    }
    .filtros__grupo { display: flex; gap: 10px; flex-wrap: wrap; }
    .filtro {
      background: none; border: 1px solid var(--linea); border-radius: 999px;
      padding: .5rem 1.25rem; font-family: inherit; font-size: .76rem;
      letter-spacing: .12em; text-transform: uppercase; color: var(--gris); cursor: pointer;
    }
    .filtro:hover { border-color: var(--magenta-300); color: var(--magenta); }
    .filtro--activo { background: var(--vino); border-color: var(--vino); color: #fff; }
    .barra-tienda__buscador { display: flex; gap: 12px; align-items: center; }
    .barra-tienda__buscador input {
      border: 1px solid var(--linea); border-radius: var(--radio);
      padding: .6rem .9rem; font-family: inherit; font-size: .88rem; min-width: 240px; outline: none;
    }
    .barra-tienda__buscador input:focus { border-color: var(--magenta-300); }
    .chip { align-self: flex-start; }
  `]
})
export class ProductosComponent {
  carrito = inject(CarritoService);
  soles = soles;
  categorias = CATEGORIAS_PRODUCTO;
  categoria = signal('Todos');
  busqueda = signal('');

  lista = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return PRODUCTOS.filter(p =>
      (this.categoria() === 'Todos' || p.categoria === this.categoria()) &&
      (!texto || `${p.nombre} ${p.marca} ${p.categoria}`.toLowerCase().includes(texto))
    );
  });

  agregar(p: Producto): void {
    this.carrito.agregar(p);
  }
}
