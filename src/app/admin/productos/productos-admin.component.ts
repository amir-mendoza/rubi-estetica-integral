import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIAS_PRODUCTO, PRODUCTOS, soles } from '../../data/datos';
import { Producto } from '../../data/modelos';

function productoVacio(): Producto {
  return {
    id: 0,
    nombre: '',
    marca: 'Rubí Skin',
    categoria: 'Cuidado facial',
    descripcion: '',
    precio: 0,
    stock: 0,
    imagen: 'img/prod-1.jpg',
    activo: true
  };
}

@Component({
  selector: 'app-productos-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Productos</h1>
        <p>Catálogo de tienda, stock y precios. Lo cobrado va a reportes; el stock ayuda a recepción a vender sin cuaderno.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--linea btn--sm" (click)="abrirStock()">Registrar stock</button>
        <button class="btn btn--vino btn--sm" (click)="nuevo()">Nuevo producto</button>
      </div>
    </div>

    @if (mostrarFormulario()) {
      <div class="tabla-panel panel-form">
        <div class="tabla-panel__cabecera">
          <div>
            <h3>{{ borrador().id ? 'Editar producto' : 'Nuevo producto' }}</h3>
            <span class="dato__label">Datos que verá recepción y la tienda web</span>
          </div>
          <button class="boton-icono" (click)="cerrarFormulario()">Cancelar</button>
        </div>
        <form class="producto-form" (ngSubmit)="guardar()">
          <div class="producto-form__imagen">
            <img [src]="borrador().imagen" [alt]="borrador().nombre || 'Producto'">
            <label class="btn btn--linea btn--sm">
              Subir imagen
              <input type="file" accept="image/*" (change)="cargarImagen($event)" hidden>
            </label>
            <span>Vista previa local; luego Spring Boot la guardará en el servidor.</span>
          </div>
          <div class="campo"><label>Nombre</label><input required [ngModel]="borrador().nombre" (ngModelChange)="editar('nombre', $event)" name="nombre"></div>
          <div class="campo"><label>Marca</label><input [ngModel]="borrador().marca" (ngModelChange)="editar('marca', $event)" name="marca"></div>
          <div class="campo"><label>Categoría</label><input list="categoriasProducto" [ngModel]="borrador().categoria" (ngModelChange)="editar('categoria', $event)" name="categoria"></div>
          <datalist id="categoriasProducto">
            @for (c of categoriasSinTodos; track c) { <option [value]="c"></option> }
          </datalist>
          <div class="campo"><label>Precio venta (S/)</label><input type="number" min="0" required [ngModel]="borrador().precio" (ngModelChange)="editar('precio', Number($event))" name="precio"></div>
          <div class="campo"><label>Precio antes (opcional)</label><input type="number" min="0" [ngModel]="borrador().precioAntes" (ngModelChange)="editar('precioAntes', Number($event) || undefined)" name="precioAntes"></div>
          <div class="campo"><label>Stock actual</label><input type="number" min="0" [ngModel]="borrador().stock" (ngModelChange)="editar('stock', Number($event))" name="stock"></div>
          <div class="campo producto-form__ancho"><label>Descripción para venta</label><textarea rows="3" [ngModel]="borrador().descripcion" (ngModelChange)="editar('descripcion', $event)" name="descripcion"></textarea></div>
          <label class="check"><input type="checkbox" [ngModel]="borrador().activo" (ngModelChange)="editar('activo', $event)" name="activo"> Publicado en tienda</label>
          <button class="btn btn--vino btn--sm" type="submit" [disabled]="!borrador().nombre || !borrador().precio">Guardar producto</button>
        </form>
      </div>
    }

    @if (mostrarStock()) {
      <div class="tabla-panel panel-form">
        <div class="tabla-panel__cabecera">
          <h3>Ingreso rápido de stock</h3>
          <button class="boton-icono" (click)="mostrarStock.set(false)">Cerrar</button>
        </div>
        <form class="stock-form" (ngSubmit)="registrarStock()">
          <div class="campo">
            <label>Producto</label>
            <select [(ngModel)]="stockProductoId" name="stockProductoId">
              @for (p of productos(); track p.id) { <option [value]="p.id">{{ p.nombre }}</option> }
            </select>
          </div>
          <div class="campo"><label>Unidades que ingresan</label><input type="number" min="1" [(ngModel)]="stockCantidad" name="stockCantidad"></div>
          <button class="btn btn--vino btn--sm" type="submit" [disabled]="stockCantidad <= 0">Sumar al inventario</button>
        </form>
      </div>
    }

    <div class="kpis kpis-4">
      <div class="kpi"><span class="kpi__label">Productos activos</span><span class="kpi__valor">{{ activos() }}</span><span class="kpi__nota">Publicados en la tienda</span></div>
      <div class="kpi"><span class="kpi__label">Unidades en stock</span><span class="kpi__valor">{{ unidades() }}</span><span class="kpi__nota">Inventario disponible</span></div>
      <div class="kpi"><span class="kpi__label">Valor del inventario</span><span class="kpi__valor">{{ soles(valorInventario()) }}</span><span class="kpi__nota">A precio de venta</span></div>
      <div class="kpi"><span class="kpi__label">Stock crítico</span><span class="kpi__valor" style="color:var(--error)">{{ criticos() }}</span><span class="kpi__nota">Con 3 unidades o menos</span></div>
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
                    <img class="img-cobertura" [src]="p.imagen" [alt]="p.nombre">
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
                    <button class="boton-icono" (click)="editarProducto(p)">Editar</button>
                    <button class="boton-icono" (click)="ajustarStock(p)">Stock</button>
                    <button class="boton-icono" (click)="alternar(p)">{{ p.activo ? 'Ocultar' : 'Publicar' }}</button>
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
    .panel-form { margin-bottom: 22px; }
    .producto-form { display: grid; grid-template-columns: 180px repeat(3, minmax(150px, 1fr)); gap: 14px; padding: 20px 22px 24px; align-items: end; }
    .producto-form__imagen { grid-row: span 3; display: grid; gap: 10px; align-content: start; color: var(--gris-claro); font-size: .76rem; }
    .producto-form__imagen img { width: 160px; height: 160px; border-radius: var(--radio); object-fit: contain; background: var(--rosa-50); border: 1px solid var(--linea); padding: 8px; }
    .producto-form__ancho { grid-column: 2 / -1; }
    .stock-form { display: grid; grid-template-columns: 1fr 220px auto; gap: 14px; align-items: end; padding: 20px 22px 24px; }
    .check { display: flex; gap: 8px; align-items: center; color: var(--gris); font-size: .86rem; }
    .fila-prod { display: flex; gap: 12px; align-items: center; }
    .fila-prod img { width: 44px; height: 44px; border-radius: var(--radio); object-fit: cover; background: var(--rosa-50); }
    @media (max-width: 1200px) { .kpis-4 { grid-template-columns: repeat(2, 1fr); } .producto-form { grid-template-columns: repeat(2, 1fr); } .producto-form__imagen, .producto-form__ancho { grid-column: 1 / -1; } }
    @media (max-width: 720px) { .producto-form, .stock-form { grid-template-columns: 1fr; } }
  `]
})
export class ProductosAdminComponent {
  Math = Math;
  Number = Number;
  soles = soles;
  categorias = CATEGORIAS_PRODUCTO;
  categoriasSinTodos = CATEGORIAS_PRODUCTO.filter(c => c !== 'Todos');
  productos = signal(PRODUCTOS.map(p => ({ ...p })));
  busqueda = signal('');
  categoria = signal('Todos');
  mostrarFormulario = signal(false);
  mostrarStock = signal(false);
  borrador = signal<Producto>(productoVacio());
  stockProductoId = PRODUCTOS[0]?.id ?? 1;
  stockCantidad = 1;

  activos = computed(() => this.productos().filter(p => p.activo).length);
  unidades = computed(() => this.productos().reduce((t, p) => t + p.stock, 0));
  valorInventario = computed(() => this.productos().reduce((t, p) => t + p.stock * p.precio, 0));
  criticos = computed(() => this.productos().filter(p => p.stock <= 3).length);

  lista = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.productos().filter(p =>
      (this.categoria() === 'Todos' || p.categoria === this.categoria()) &&
      (!texto || `${p.nombre} ${p.marca}`.toLowerCase().includes(texto))
    );
  });

  nuevo(): void {
    this.borrador.set(productoVacio());
    this.mostrarFormulario.set(true);
  }

  editarProducto(p: Producto): void {
    this.borrador.set({ ...p });
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    this.borrador.set(productoVacio());
  }

  editar<K extends keyof Producto>(campo: K, valor: Producto[K]): void {
    this.borrador.update(p => ({ ...p, [campo]: valor }));
  }

  guardar(): void {
    const p = this.borrador();
    this.productos.update(lista => p.id
      ? lista.map(item => item.id === p.id ? { ...p } : item)
      : [{ ...p, id: lista.reduce((max, item) => Math.max(max, item.id), 0) + 1 }, ...lista]);
    this.cerrarFormulario();
  }

  alternar(p: Producto): void {
    this.productos.update(lista => lista.map(item => item.id === p.id ? { ...item, activo: !item.activo } : item));
  }

  abrirStock(): void {
    this.stockProductoId = this.productos()[0]?.id ?? 1;
    this.stockCantidad = 1;
    this.mostrarStock.set(true);
  }

  ajustarStock(p: Producto): void {
    this.stockProductoId = p.id;
    this.stockCantidad = 1;
    this.mostrarStock.set(true);
  }

  registrarStock(): void {
    this.productos.update(lista => lista.map(p => p.id === Number(this.stockProductoId)
      ? { ...p, stock: p.stock + Number(this.stockCantidad) }
      : p));
    this.mostrarStock.set(false);
    this.stockCantidad = 1;
  }

  cargarImagen(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) { return; }
    const lector = new FileReader();
    lector.onload = () => this.editar('imagen', String(lector.result || ''));
    lector.readAsDataURL(archivo);
  }
}
