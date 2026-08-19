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
    nombreImagen: 'Imagen del producto',
    beneficios: [''],
    recomendaciones: [''],
    modoUso: [''],
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

    <section class="tabla-panel categorias-panel">
      <div class="tabla-panel__cabecera">
        <div>
          <h3>Categorías y marcas</h3>
          <span class="dato__label">Administra opciones reutilizables para el catálogo</span>
        </div>
      </div>
      <div class="catalogo-admin">
        <div>
          <span class="dato__label">Categorías</span>
          <div class="chips-admin">
            @for (c of categorias(); track c) {
              <span class="categoria-chip">{{ c }}</span>
            }
          </div>
          <div class="catalogo-admin__nuevo">
            <input placeholder="Nueva categoría" [(ngModel)]="nuevaCategoria" name="nuevaCategoriaProducto">
            <button type="button" class="btn btn--linea btn--sm" (click)="agregarCategoria()" [disabled]="!nuevaCategoria.trim()">Agregar</button>
          </div>
        </div>
        <div>
          <span class="dato__label">Marcas frecuentes</span>
          <div class="chips-admin">
            @for (m of marcas(); track m) {
              <span class="categoria-chip">{{ m }}</span>
            }
          </div>
          <div class="catalogo-admin__nuevo">
            <input placeholder="Nueva marca" [(ngModel)]="nuevaMarca" name="nuevaMarcaProducto">
            <button type="button" class="btn btn--linea btn--sm" (click)="agregarMarca()" [disabled]="!nuevaMarca.trim()">Agregar</button>
          </div>
        </div>
      </div>
    </section>

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
          <div class="campo"><label>Marca</label><input list="marcasProducto" [ngModel]="borrador().marca" (ngModelChange)="editar('marca', $event)" name="marca"></div>
          <datalist id="marcasProducto">
            @for (m of marcas(); track m) { <option [value]="m"></option> }
          </datalist>
          <div class="campo"><label>Categoría</label><input list="categoriasProducto" [ngModel]="borrador().categoria" (ngModelChange)="editar('categoria', $event)" name="categoria"></div>
          <datalist id="categoriasProducto">
            @for (c of categorias(); track c) { <option [value]="c"></option> }
          </datalist>
          <div class="campo"><label>Precio venta (S/)</label><input type="number" min="0" required [ngModel]="borrador().precio" (ngModelChange)="editar('precio', Number($event))" name="precio"></div>
          <div class="campo"><label>Precio antes (opcional)</label><input type="number" min="0" [ngModel]="borrador().precioAntes" (ngModelChange)="editar('precioAntes', Number($event) || undefined)" name="precioAntes"></div>
          <div class="campo"><label>Stock actual</label><input type="number" min="0" [ngModel]="borrador().stock" (ngModelChange)="editar('stock', Number($event))" name="stock"></div>
          <div class="campo"><label>Nombre interno de imagen</label><input [ngModel]="borrador().nombreImagen" (ngModelChange)="editar('nombreImagen', $event)" name="nombreImagenProducto" placeholder="Ej. Serum vitamina C frontal"></div>
          <div class="campo producto-form__ancho"><label>Descripción para venta</label><textarea rows="3" [ngModel]="borrador().descripcion" (ngModelChange)="editar('descripcion', $event)" name="descripcion"></textarea></div>
          <div class="lista-editor producto-form__ancho">
            <div class="lista-editor__cabecera">
              <div><span class="dato__label">Beneficios</span><strong>Qué aporta este producto</strong></div>
              <button type="button" class="btn btn--linea btn--sm" (click)="agregarItem('beneficios')">Agregar beneficio</button>
            </div>
            @for (b of borrador().beneficios || []; track $index; let i = $index) {
              <div class="lista-editor__fila">
                <input [ngModel]="b" (ngModelChange)="editarItem('beneficios', i, $event)" name="beneficioProducto{{ i }}" placeholder="Ej. Hidrata y mejora la luminosidad">
                <button type="button" class="boton-icono boton-icono--peligro" (click)="quitarItem('beneficios', i)">Quitar</button>
              </div>
            }
          </div>
          <div class="lista-editor producto-form__ancho">
            <div class="lista-editor__cabecera">
              <div><span class="dato__label">Modo de uso</span><strong>Cómo debe aplicarse</strong></div>
              <button type="button" class="btn btn--linea btn--sm" (click)="agregarItem('modoUso')">Agregar paso</button>
            </div>
            @for (u of borrador().modoUso || []; track $index; let i = $index) {
              <div class="lista-editor__fila">
                <input [ngModel]="u" (ngModelChange)="editarItem('modoUso', i, $event)" name="usoProducto{{ i }}" placeholder="Ej. Aplicar por la noche sobre piel limpia">
                <button type="button" class="boton-icono boton-icono--peligro" (click)="quitarItem('modoUso', i)">Quitar</button>
              </div>
            }
          </div>
          <div class="lista-editor producto-form__ancho">
            <div class="lista-editor__cabecera">
              <div><span class="dato__label">Recomendaciones</span><strong>Advertencias o cuidados opcionales</strong></div>
              <button type="button" class="btn btn--linea btn--sm" (click)="agregarItem('recomendaciones')">Agregar recomendación</button>
            </div>
            @for (r of borrador().recomendaciones || []; track $index; let i = $index) {
              <div class="lista-editor__fila">
                <input [ngModel]="r" (ngModelChange)="editarItem('recomendaciones', i, $event)" name="recomendacionProducto{{ i }}" placeholder="Ej. Usar protector solar al día siguiente">
                <button type="button" class="boton-icono boton-icono--peligro" (click)="quitarItem('recomendaciones', i)">Quitar</button>
              </div>
            }
          </div>
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
          <option>Todos</option>
          @for (c of categorias(); track c) { <option>{{ c }}</option> }
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
    .panel-form, .categorias-panel { margin-bottom: 22px; }
    .catalogo-admin { display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px; padding: 18px 22px 22px; }
    .chips-admin { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 12px; }
    .categoria-chip { border: 1px solid var(--linea); border-radius: 999px; padding: 7px 13px; background: #fff; color: var(--gris); font-size: .78rem; }
    .catalogo-admin__nuevo { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
    .producto-form { display: grid; grid-template-columns: 180px repeat(3, minmax(150px, 1fr)); gap: 14px; padding: 20px 22px 24px; align-items: end; }
    .producto-form__imagen { grid-row: span 3; display: grid; gap: 10px; align-content: start; color: var(--gris-claro); font-size: .76rem; }
    .producto-form__imagen img { width: 160px; height: 160px; border-radius: var(--radio); object-fit: contain; background: var(--rosa-50); border: 1px solid var(--linea); padding: 8px; }
    .producto-form__ancho { grid-column: 2 / -1; }
    .stock-form { display: grid; grid-template-columns: 1fr 220px auto; gap: 14px; align-items: end; padding: 20px 22px 24px; }
    .lista-editor { border: 1px solid var(--linea); border-radius: var(--radio); padding: 14px; background: var(--rosa-50); display: grid; gap: 10px; }
    .lista-editor__cabecera { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    .lista-editor__cabecera strong { display: block; color: var(--vino); font-size: .92rem; }
    .lista-editor__fila { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
    .boton-icono--peligro { color: var(--error); }
    .check { display: flex; gap: 8px; align-items: center; color: var(--gris); font-size: .86rem; }
    .fila-prod { display: flex; gap: 12px; align-items: center; }
    .fila-prod img { width: 44px; height: 44px; border-radius: var(--radio); object-fit: cover; background: var(--rosa-50); }
    @media (max-width: 1200px) { .kpis-4 { grid-template-columns: repeat(2, 1fr); } .producto-form, .catalogo-admin { grid-template-columns: repeat(2, 1fr); } .producto-form__imagen, .producto-form__ancho { grid-column: 1 / -1; } }
    @media (max-width: 720px) { .producto-form, .stock-form, .catalogo-admin, .catalogo-admin__nuevo, .lista-editor__fila { grid-template-columns: 1fr; } }
  `]
})
export class ProductosAdminComponent {
  Math = Math;
  Number = Number;
  soles = soles;
  categorias = signal(CATEGORIAS_PRODUCTO.filter(c => c !== 'Todos'));
  marcas = signal(Array.from(new Set(PRODUCTOS.map(p => p.marca))));
  productos = signal(PRODUCTOS.map(p => ({ ...p })));
  busqueda = signal('');
  categoria = signal('Todos');
  mostrarFormulario = signal(false);
  mostrarStock = signal(false);
  borrador = signal<Producto>(productoVacio());
  stockProductoId = PRODUCTOS[0]?.id ?? 1;
  stockCantidad = 1;
  nuevaCategoria = '';
  nuevaMarca = '';

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

  agregarCategoria(): void {
    const nombre = this.nuevaCategoria.trim();
    if (!nombre || this.categorias().some(c => c.toLowerCase() === nombre.toLowerCase())) { return; }
    this.categorias.update(lista => [...lista, nombre]);
    this.editar('categoria', nombre);
    this.nuevaCategoria = '';
  }

  agregarMarca(): void {
    const nombre = this.nuevaMarca.trim();
    if (!nombre || this.marcas().some(m => m.toLowerCase() === nombre.toLowerCase())) { return; }
    this.marcas.update(lista => [...lista, nombre]);
    this.editar('marca', nombre);
    this.nuevaMarca = '';
  }

  nuevo(): void {
    this.borrador.set(productoVacio());
    this.mostrarFormulario.set(true);
  }

  editarProducto(p: Producto): void {
    this.borrador.set({
      ...p,
      beneficios: [...(p.beneficios ?? [''])],
      recomendaciones: [...(p.recomendaciones ?? [''])],
      modoUso: [...(p.modoUso ?? [''])]
    });
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    this.borrador.set(productoVacio());
  }

  editar<K extends keyof Producto>(campo: K, valor: Producto[K]): void {
    this.borrador.update(p => ({ ...p, [campo]: valor }));
  }

  agregarItem(campo: 'beneficios' | 'recomendaciones' | 'modoUso'): void {
    this.borrador.update(p => ({ ...p, [campo]: [...(p[campo] ?? []), ''] }));
  }

  editarItem(campo: 'beneficios' | 'recomendaciones' | 'modoUso', index: number, valor: string): void {
    this.borrador.update(p => ({ ...p, [campo]: (p[campo] ?? []).map((item, i) => i === index ? valor : item) }));
  }

  quitarItem(campo: 'beneficios' | 'recomendaciones' | 'modoUso', index: number): void {
    this.borrador.update(p => {
      const lista = p[campo] ?? [];
      return { ...p, [campo]: lista.length <= 1 ? [''] : lista.filter((_, i) => i !== index) };
    });
  }

  guardar(): void {
    const p = this.borrador();
    const limpio = {
      ...p,
      beneficios: (p.beneficios ?? []).map(v => v.trim()).filter(Boolean),
      recomendaciones: (p.recomendaciones ?? []).map(v => v.trim()).filter(Boolean),
      modoUso: (p.modoUso ?? []).map(v => v.trim()).filter(Boolean)
    };
    this.productos.update(lista => limpio.id
      ? lista.map(item => item.id === limpio.id ? { ...limpio } : item)
      : [{ ...limpio, id: lista.reduce((max, item) => Math.max(max, item.id), 0) + 1 }, ...lista]);
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
    lector.onload = () => {
      this.editar('imagen', String(lector.result || ''));
      this.editar('nombreImagen', archivo.name);
    };
    lector.readAsDataURL(archivo);
  }
}
