import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIAS_TRATAMIENTO, TRATAMIENTOS, soles } from '../../data/datos';
import { PromocionesService } from '../../compartido/promociones.service';

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

        @if (promos().length) {
          <section class="promos-trat">
            <div class="promos-trat__cabecera">
              <div>
                <span class="eyebrow">Promociones vigentes</span>
                <h2>Combos y ofertas disponibles</h2>
              </div>
              <span class="filtros__conteo">{{ promos().length }} promociones</span>
            </div>
            <div class="grid grid-3">
              @for (p of promos(); track p.id) {
                <article class="promo-card">
                  <img [src]="p.imagen" [alt]="p.titulo">
                  <div class="promo-card__body">
                    <span class="promo-card__tag">{{ p.etiqueta }}</span>
                    <h3>{{ p.titulo }}</h3>
                    <p>{{ p.subtitulo }}</p>
                    @if (p.sesionesDetalle?.length) {
                      <div class="promo-card__incluye">
                        @for (s of p.sesionesDetalle; track $index) {
                          <span>{{ s.titulo }}</span>
                        }
                      </div>
                    }
                    <div class="tarjeta-trat__pie">
                      <div class="precio">
                        @if (p.precioAntes) { <span class="precio__antes">{{ soles(p.precioAntes) }}</span> }
                        <span class="precio__actual">{{ soles(p.precio || 0) }}</span>
                      </div>
                      <a routerLink="/reservar" [queryParams]="{ promo: p.id }" class="enlace-flecha">Reservar promo</a>
                    </div>
                  </div>
                </article>
              }
            </div>
          </section>
        }

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
    .promos-trat { margin-bottom: 44px; padding-bottom: 36px; border-bottom: 1px solid var(--linea); }
    .promos-trat__cabecera { display: flex; justify-content: space-between; align-items: end; gap: 18px; margin-bottom: 22px; }
    .promos-trat__cabecera h2 { margin: 4px 0 0; }
    .promo-card { background: #fff; border: 1px solid var(--linea); border-radius: var(--radio-lg); overflow: hidden; box-shadow: var(--sombra); }
    .promo-card img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; display: block; }
    .promo-card__body { padding: 18px; }
    .promo-card__tag { font-size: .68rem; color: var(--magenta); letter-spacing: .14em; text-transform: uppercase; font-weight: 700; }
    .promo-card h3 { margin: 8px 0 6px; font-size: 1.25rem; }
    .promo-card p { font-size: .86rem; min-height: 42px; }
    .promo-card__incluye { display: grid; gap: 6px; margin: 12px 0 16px; }
    .promo-card__incluye span { font-size: .78rem; color: var(--gris); padding-left: 14px; position: relative; }
    .promo-card__incluye span::before { content: ''; position: absolute; left: 0; top: .62em; width: 5px; height: 5px; border-radius: 50%; background: var(--magenta); }
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
  promos = computed(() => this.promociones.activas());

  constructor(private promociones: PromocionesService) {}

  lista = computed(() =>
    TRATAMIENTOS.filter(t => this.categoria() === 'Todos' || t.categoria === this.categoria())
  );
}
