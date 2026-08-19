import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIAS_TRATAMIENTO, CITAS, TRATAMIENTOS, soles } from '../../data/datos';
import { CategoriaTratamiento, Tratamiento } from '../../data/modelos';

function tratamientoVacio(): Tratamiento {
  return {
    id: 0,
    nombre: '',
    categoria: 'Facial',
    etiquetas: [],
    resumen: '',
    descripcion: '',
    beneficios: [],
    recomendaciones: [],
    duracionMin: 60,
    limpiezaMin: 15,
    precio: 0,
    imagen: 'img/trat-limpieza.jpg',
    nombreImagen: 'Imagen del tratamiento',
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
              @if (c !== 'Todos' && !categoriaUsada(c)) {
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
            <span class="dato__label">Previsualización de imagen</span>
            <img [src]="borrador().imagen" [alt]="borrador().nombre || 'Tratamiento'">
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
    .panel-form, .categorias-panel { margin-bottom: 22px; }
    .categorias-admin { display: grid; grid-template-columns: 1fr minmax(280px, .5fr); gap: 16px; padding: 18px 22px 22px; align-items: start; }
    .categorias-admin__lista { display: flex; flex-wrap: wrap; gap: 8px; }
    .categoria-chip { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--linea); border-radius: 999px; padding: 7px 10px 7px 13px; background: #fff; color: var(--gris); font-size: .78rem; }
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
      grid-template-columns: repeat(3, minmax(150px, 1fr));
      gap: 14px;
      padding: 20px 22px 24px;
      align-items: end;
    }
    .trat-form__ancho { grid-column: 1 / -1; }
    .trat-form__preview, .lista-editor { grid-column: 1 / -1; }
    .trat-form__preview { display: grid; gap: 10px; align-items: start; }
    .trat-form__preview img { width: min(360px, 100%); max-height: 220px; object-fit: contain; border: 1px solid var(--linea); border-radius: var(--radio); background: var(--rosa-50); padding: 8px; }
    .lista-editor { border: 1px solid var(--linea); border-radius: var(--radio); padding: 14px; background: var(--rosa-50); display: grid; gap: 10px; }
    .lista-editor__cabecera { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    .lista-editor__cabecera strong { display: block; color: var(--vino); font-size: .92rem; }
    .lista-editor__fila { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
    .check { display: flex; gap: 8px; align-items: center; color: var(--gris); font-size: .86rem; }
    .boton-icono--peligro { color: var(--error); }
    .fila-trat { display: flex; gap: 12px; align-items: center; max-width: 380px; }
    .fila-trat img { width: 46px; height: 46px; border-radius: var(--radio); object-fit: cover; }
    .fila-trat .mini-dato span { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
    @media (max-width: 1000px) { .trat-form, .categorias-admin { grid-template-columns: 1fr; } .form-rapido, .lista-editor__fila, .categorias-admin__nuevo { display: grid; grid-template-columns: 1fr; } }
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
    if (categoria === 'Todos' || this.categoriaUsada(categoria)) { return; }
    this.categorias.update(lista => lista.filter(c => c !== categoria));
    if (this.categoria() === categoria) { this.categoria.set('Todos'); }
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
    this.borrador.set({ ...t, etiquetas: [...t.etiquetas], beneficios: [...t.beneficios], recomendaciones: [...t.recomendaciones] });
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
      recomendaciones: t.recomendaciones.map(v => v.trim()).filter(Boolean)
    };
    this.tratamientos.update(lista => limpio.id
      ? lista.map(item => item.id === limpio.id ? { ...limpio } : item)
      : [{ ...limpio, id: lista.reduce((max, item) => Math.max(max, item.id), 0) + 1 }, ...lista]);
    this.cerrarFormulario();
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
