import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIAS_TRATAMIENTO, TRATAMIENTOS, soles } from '../../data/datos';

@Component({
  selector: 'app-tratamientos',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <div class="miga"><a routerLink="/">Inicio</a> / Tratamientos</div>
        <h1>Tratamientos</h1>
        <p>
          Protocolos faciales, corporales y de aparatología. Cada ficha indica duración de sesión,
          tiempo de cabina, beneficios y recomendaciones posteriores.
        </p>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor">
        <div class="filtros">
          <div class="filtros__grupo">
            @for (c of categorias; track c) {
              <button class="filtro" [class.filtro--activo]="categoria() === c" (click)="categoria.set(c)">
                {{ c }}
              </button>
            }
          </div>
          <span class="filtros__conteo">{{ lista().length }} tratamientos</span>
        </div>

        <div class="grid grid-3">
          @for (t of lista(); track t.id) {
            <article class="tarjeta-trat">
              <a [routerLink]="['/tratamientos', t.id]" class="tarjeta-trat__imagen">
                <img class="img-cobertura" [src]="t.imagen" [alt]="t.nombre">
                <span class="tarjeta-trat__categoria">{{ t.categoria }}</span>
              </a>
              <div class="tarjeta-trat__cuerpo">
                <h3>{{ t.nombre }}</h3>
                <p>{{ t.resumen }}</p>
                <div class="tarjeta-trat__meta">
                  <span>{{ t.duracionMin }} min de sesión</span>
                  <span class="punto"></span>
                  <span>+{{ t.limpiezaMin }} min de cabina</span>
                </div>
                <div class="tarjeta-trat__pie">
                  <div class="precio">
                    @if (t.precioAntes) { <span class="precio__antes">{{ soles(t.precioAntes) }}</span> }
                    <span class="precio__actual">{{ soles(t.precio) }}</span>
                  </div>
                  <a [routerLink]="['/tratamientos', t.id]" class="enlace-flecha">Ver detalle</a>
                </div>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .filtros {
      display: flex; align-items: center; justify-content: space-between;
      gap: 20px; flex-wrap: wrap; margin-bottom: 40px;
      padding-bottom: 20px; border-bottom: 1px solid var(--linea);
    }
    .filtros__grupo { display: flex; gap: 10px; flex-wrap: wrap; }
    .filtro {
      background: none; border: 1px solid var(--linea); border-radius: 999px;
      padding: .5rem 1.25rem; font-family: inherit; font-size: .76rem;
      letter-spacing: .12em; text-transform: uppercase; color: var(--gris); cursor: pointer;
      transition: all .18s ease;
    }
    .filtro:hover { border-color: var(--magenta-300); color: var(--magenta); }
    .filtro--activo { background: var(--vino); border-color: var(--vino); color: #fff; }
    .filtros__conteo { font-size: .8rem; color: var(--gris-claro); }
  `]
})
export class TratamientosComponent {
  soles = soles;
  categorias = CATEGORIAS_TRATAMIENTO;
  categoria = signal<string>('Todos');
  lista = computed(() =>
    TRATAMIENTOS.filter(t => this.categoria() === 'Todos' || t.categoria === this.categoria())
  );
}
