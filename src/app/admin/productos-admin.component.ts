import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIAS_PRODUCTO, PRODUCTOS, soles } from '../data/datos';

@Component({
  selector: 'app-productos-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Productos</h1>
        <p>Catálogo de la tienda, control de stock y precios de venta.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--linea btn--sm">Registrar ingreso de stock</button>
        <button class="btn btn--vino btn--sm">Nuevo producto</button>
      </div>
    </div>

    <div class="kpis kpis-4">
      <div class="kpi"><span class="kpi__label">Productos activos</span><span class="kpi__valor">{{ activos }}</span><span class="kpi__nota">Publicados en la tienda</span></div>
      <div class="kpi"><span class="kpi__label">Unidades en stock</span><span class="kpi__valor">{{ unidades }}</span><span class="kpi__nota">Suma de ambas sedes</span></div>
      <div class="kpi"><span class="kpi__label">Valor del inventario</span><span class="kpi__valor">{{ soles(valorInventario) }}</span><span class="kpi__nota">A precio de venta</span></div>
      <div class="kpi"><span class="kpi__label">Stock crítico</span><span class="kpi__valor" style="color:var(--error)">{{ criticos }}</span><span class="kpi__nota">Con 3 unidades o menos</span></div>
    </div>

    <div class="barra-filtros">
      <div class="campo barra-filtros__crecer">
        <label>Buscar</label>
        <input type="search" placeholder="Nombre o marca" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
      </div>
      <div class="campo">
        <label>Categoría</label>
        <select [ngModel]="categoria()" (ngModelChange)="categoria.set($event)">
          @for (c of categorias; track c) { <option>{{ c }}</option> }
        </select>
      </div>
    </div>

    <div class="tabla-panel">
      <div class="tabla-panel__cabecera">
        <h3>Inventario</h3>
        <span class="dato__label">{{ lista().length }} registros</span>
      </div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead>
            <tr><th>Producto</th><th>Categoría</th><th class="num">Precio</th><th class="num">Stock</th><th>Nivel</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            @for (p of lista(); track p.id) {
              <tr>
                <td>
                  <div class="fila-prod">
                    <img [src]="p.imagen" [alt]="p.nombre">
                    <div class="mini-dato"><strong>{{ p.nombre }}</strong><span>{{ p.marca }}</span></div>
                  </div>
                </td>
                <td>{{ p.categoria }}</td>
                <td class="num">{{ soles(p.precio) }}</td>
                <td class="num">{{ p.stock }}</td>
                <td>
                  <div class="barra-progreso" style="max-width:120px">
                    <span [style.width.%]="Math.min((p.stock / 30) * 100, 100)"
                          [style.background]="p.stock <= 3 ? 'var(--error)' : p.stock <= 8 ? 'var(--alerta)' : 'var(--ok)'"></span>
                  </div>
                </td>
                <td>
                  <span [class]="p.activo ? 'chip chip--ok chip--punto' : 'chip chip--error chip--punto'">
                    {{ p.activo ? 'Publicado' : 'Oculto' }}
                  </span>
                </td>
                <td class="num">
                  <div class="acciones-fila">
                    <button class="boton-icono">Editar</button>
                    <button class="boton-icono">Stock</button>
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
    .kpis-4 { grid-template-columns: repeat(4, 1fr); margin-bottom: 22px; }
    .fila-prod { display: flex; gap: 12px; align-items: center; }
    .fila-prod img { width: 44px; height: 44px; border-radius: var(--radio); object-fit: cover; background: var(--rosa-50); }
    @media (max-width: 1200px) { .kpis-4 { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class ProductosAdminComponent {
  Math = Math;
  soles = soles;
  categorias = CATEGORIAS_PRODUCTO;
  busqueda = signal('');
  categoria = signal('Todos');

  activos = PRODUCTOS.filter(p => p.activo).length;
  unidades = PRODUCTOS.reduce((t, p) => t + p.stock, 0);
  valorInventario = PRODUCTOS.reduce((t, p) => t + p.stock * p.precio, 0);
  criticos = PRODUCTOS.filter(p => p.stock <= 3).length;

  lista = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return PRODUCTOS.filter(p =>
      (this.categoria() === 'Todos' || p.categoria === this.categoria()) &&
      (!texto || `${p.nombre} ${p.marca}`.toLowerCase().includes(texto))
    );
  });
}
