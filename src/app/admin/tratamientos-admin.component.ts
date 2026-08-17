import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIAS_TRATAMIENTO, CITAS, TRATAMIENTOS, soles } from '../data/datos';

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
        <button class="btn btn--linea btn--sm">Actualizar precios</button>
        <button class="btn btn--vino btn--sm">Nuevo tratamiento</button>
      </div>
    </div>

    <div class="barra-filtros">
      <div class="campo barra-filtros__crecer">
        <label>Buscar</label>
        <input type="search" placeholder="Nombre del tratamiento" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
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
                    <img [src]="t.imagen" [alt]="t.nombre">
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
                    <button class="boton-icono">Editar</button>
                    <button class="boton-icono">Desactivar</button>
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
    .fila-trat { display: flex; gap: 12px; align-items: center; max-width: 380px; }
    .fila-trat img { width: 46px; height: 46px; border-radius: var(--radio); object-fit: cover; }
    .fila-trat .mini-dato span { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
  `]
})
export class TratamientosAdminComponent {
  soles = soles;
  categorias = CATEGORIAS_TRATAMIENTO;
  busqueda = signal('');
  categoria = signal('Todos');

  lista = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return TRATAMIENTOS.filter(t =>
      (this.categoria() === 'Todos' || t.categoria === this.categoria()) &&
      (!texto || t.nombre.toLowerCase().includes(texto))
    );
  });

  sesiones(id: number): number {
    const mes = new Date().toISOString().slice(0, 7);
    return CITAS.filter(c => c.tratamientoId === id && c.fecha.slice(0, 7) === mes).length;
  }
}
