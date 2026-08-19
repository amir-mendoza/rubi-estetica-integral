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

        <div class="tratamientos-layout">
          <div class="grid grid-3 tratamientos-lista">
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

          @if (promos().length) {
            <aside class="promo-vertical" aria-label="Promociones vigentes">
              <div class="promo-vertical__cabecera">
                <span class="eyebrow">Promociones vigentes</span>
                <h2>Ofertas activas</h2>
                <small>{{ promos().length }} promociones</small>
              </div>
              <div class="promo-vertical__ventana">
                <div class="promo-vertical__track">
                  @for (p of promosLoop(); track p.id + '-' + $index) {
                    <article class="promo-mini">
                      <img [src]="p.imagen" [alt]="p.titulo">
                      <div>
                        <span class="promo-mini__tag">{{ p.etiqueta }}</span>
                        <h3>{{ p.titulo }}</h3>
                        <p>{{ p.subtitulo }}</p>
                        @if (p.sesionesDetalle?.length) {
                          <ul>
                            @for (s of p.sesionesDetalle; track $index) {
                              <li>{{ s.titulo }}</li>
                            }
                          </ul>
                        }
                        <div class="promo-mini__pie">
                          <strong>{{ soles(p.precio || 0) }}</strong>
                          <a routerLink="/reservar" [queryParams]="{ promo: p.id }">Reservar</a>
                        </div>
                      </div>
                    </article>
                  }
                </div>
              </div>
            </aside>
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
    .tratamientos-layout { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 28px; align-items: start; }
    .tratamientos-lista { min-width: 0; }
    .promo-vertical {
      position: sticky; top: 96px; min-width: 0; padding: 18px;
      border: 1px solid var(--linea); border-radius: var(--radio-lg);
      background: #fff; box-shadow: var(--sombra);
    }
    .promo-vertical__cabecera { margin-bottom: 14px; }
    .promo-vertical__cabecera h2 { margin: 4px 0 2px; font-size: 1.5rem; }
    .promo-vertical__cabecera small { color: var(--gris-claro); font-size: .76rem; }
    .promo-vertical__ventana {
      height: min(680px, calc(100vh - 220px));
      min-height: 420px;
      overflow: hidden;
      mask-image: linear-gradient(to bottom, transparent 0, #000 7%, #000 93%, transparent 100%);
    }
    .promo-vertical__track { display: grid; gap: 14px; animation: promosVertical 30s linear infinite; padding: 8px 0; }
    .promo-vertical:hover .promo-vertical__track { animation-play-state: paused; }
    .promo-mini {
      background: #fff; border: 1px solid var(--linea); border-radius: var(--radio);
      overflow: hidden; transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
    }
    .promo-mini:hover { transform: scale(1.025); border-color: var(--magenta-300); box-shadow: 0 18px 40px rgba(122, 13, 63, .12); }
    .promo-mini img { width: 100%; aspect-ratio: 16 / 11; object-fit: contain; background: #fff; display: block; }
    .promo-mini > div { padding: 14px 15px 16px; }
    .promo-mini__tag { font-size: .62rem; color: var(--magenta); letter-spacing: .16em; text-transform: uppercase; font-weight: 700; }
    .promo-mini h3 { margin: 7px 0 5px; font-size: 1.05rem; line-height: 1.15; }
    .promo-mini p { font-size: .78rem; margin: 0 0 10px; line-height: 1.45; }
    .promo-mini ul { list-style: none; display: grid; gap: 4px; margin: 0 0 12px; padding: 0; }
    .promo-mini li { position: relative; padding-left: 12px; font-size: .7rem; color: var(--gris); line-height: 1.35; }
    .promo-mini li::before { content: ''; position: absolute; left: 0; top: .58em; width: 5px; height: 5px; border-radius: 50%; background: var(--magenta); }
    .promo-mini__pie { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-top: 10px; border-top: 1px solid var(--linea); }
    .promo-mini__pie strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.35rem; color: var(--vino); }
    .promo-mini__pie a { color: var(--magenta); font-size: .68rem; letter-spacing: .14em; text-transform: uppercase; font-weight: 700; }
    .filtro {
      background: none; border: 1px solid var(--linea); border-radius: 999px;
      padding: .5rem 1.25rem; font-family: inherit; font-size: .76rem;
      letter-spacing: .12em; text-transform: uppercase; color: var(--gris); cursor: pointer;
      transition: all .18s ease;
    }
    .filtro:hover { border-color: var(--magenta-300); color: var(--magenta); }
    .filtro--activo { background: var(--vino); border-color: var(--vino); color: #fff; }
    .filtros__conteo { font-size: .8rem; color: var(--gris-claro); }
    @keyframes promosVertical {
      from { transform: translateY(0); }
      to { transform: translateY(-50%); }
    }
    @media (max-width: 1200px) {
      .tratamientos-layout { grid-template-columns: 1fr; }
      .promo-vertical { position: static; order: -1; }
      .promo-vertical__ventana { height: 430px; min-height: 430px; }
    }
  `]
})
export class TratamientosComponent {
  soles = soles;
  categorias = CATEGORIAS_TRATAMIENTO;
  categoria = signal<string>('Todos');
  promos = computed(() => this.promociones.activas());
  promosLoop = computed(() => [...this.promos(), ...this.promos()]);

  constructor(private promociones: PromocionesService) {}

  lista = computed(() =>
    TRATAMIENTOS.filter(t => this.categoria() === 'Todos' || t.categoria === this.categoria())
  );
}
