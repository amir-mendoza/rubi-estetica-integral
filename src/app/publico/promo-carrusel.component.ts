import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { soles } from '../data/datos';
import { PromocionesService } from '../compartido/promociones.service';

/**
 * Carrusel de promociones de la pagina de inicio. Muestra las promociones que la
 * administracion marca como destacadas en el panel.
 */
@Component({
  selector: 'app-promo-carrusel',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (promos().length) {
      <section class="promos" aria-label="Promociones vigentes">
        @for (p of promos(); track p.id; let i = $index) {
          <article class="promo" [class.promo--activa]="i === indice()" [attr.aria-hidden]="i !== indice()">
            <img class="promo__imagen" [src]="p.imagen" [alt]="p.titulo">
            <div class="promo__velo"></div>
            <div class="contenedor promo__contenido">
              <span class="promo__etiqueta">{{ p.etiqueta }}</span>
              <h2>{{ p.titulo }}</h2>
              <p class="promo__subtitulo">{{ p.subtitulo }}</p>
              <p class="promo__texto">{{ p.descripcion }}</p>
              <div class="promo__datos">
                @if (p.precio) {
                  <div class="promo__precio">
                    <strong>{{ soles(p.precio) }}</strong>
                    @if (p.precioAntes) { <s>{{ soles(p.precioAntes) }}</s> }
                  </div>
                }
                @if (p.sesiones && p.sesiones > 1) {
                  <span class="promo__sesiones">{{ p.sesiones }} sesiones · seguimiento en el sistema</span>
                }
              </div>
              <div class="promo__acciones">
                <a routerLink="/reservar" class="btn btn--primario">Reservar esta promoción</a>
                <a routerLink="/tratamientos" class="btn btn--claro">Ver todos los tratamientos</a>
              </div>
              <span class="promo__vigencia">Vigente hasta {{ p.vigenciaHasta }} · Válido en ambas sedes</span>
            </div>
          </article>
        }

        <button class="promo__flecha promo__flecha--izq" type="button" aria-label="Promoción anterior" (click)="anterior()">‹</button>
        <button class="promo__flecha promo__flecha--der" type="button" aria-label="Promoción siguiente" (click)="siguiente()">›</button>

        <div class="promo__puntos">
          @for (p of promos(); track p.id; let i = $index) {
            <button type="button" [class.activo]="i === indice()"
                    [attr.aria-label]="'Ver promoción ' + (i + 1)" (click)="ir(i)"></button>
          }
        </div>
      </section>
    }
  `,
  styles: [`
    .promos {
      position: relative;
      height: clamp(460px, 62vh, 620px);
      background: var(--vino-900);
      overflow: hidden;
    }
    .promo {
      position: absolute;
      inset: 0;
      opacity: 0;
      visibility: hidden;
      transition: opacity .7s ease;
      display: flex;
      align-items: center;
    }
    .promo--activa { opacity: 1; visibility: visible; }
    .promo__imagen { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .promo__velo {
      position: absolute; inset: 0;
      background: linear-gradient(100deg, rgba(77, 13, 39, .92) 0%, rgba(110, 19, 56, .78) 42%, rgba(110, 19, 56, .25) 100%);
    }
    .promo__contenido { position: relative; color: #fff; max-width: 720px; padding: 48px 0; }
    .promo__etiqueta {
      display: inline-block;
      border: 1px solid rgba(255, 255, 255, .5);
      border-radius: 999px;
      padding: 5px 16px;
      font-size: .68rem;
      letter-spacing: .18em;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    .promo h2 { color: #fff; margin-bottom: 8px; }
    .promo__subtitulo {
      color: var(--rosa);
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1.35rem;
      margin-bottom: 14px;
    }
    .promo__texto { color: rgba(255, 255, 255, .82); max-width: 560px; }
    .promo__datos { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; margin: 4px 0 26px; }
    .promo__precio { display: flex; align-items: baseline; gap: 10px; }
    .promo__precio strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2.1rem; }
    .promo__precio s { color: rgba(255, 255, 255, .6); font-size: .95rem; }
    .promo__sesiones { font-size: .82rem; color: rgba(255, 255, 255, .75); letter-spacing: .03em; }
    .promo__acciones { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
    .promo__vigencia { font-size: .74rem; letter-spacing: .06em; color: rgba(255, 255, 255, .6); }
    .promo__flecha {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 46px; height: 46px;
      border: 1px solid rgba(255, 255, 255, .45);
      border-radius: 50%;
      background: rgba(77, 13, 39, .35);
      color: #fff;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
    }
    .promo__flecha:hover { background: var(--magenta); border-color: var(--magenta); }
    .promo__flecha--izq { left: 24px; }
    .promo__flecha--der { right: 24px; }
    .promo__puntos { position: absolute; bottom: 22px; left: 0; right: 0; display: flex; justify-content: center; gap: 10px; }
    .promo__puntos button {
      width: 34px; height: 3px;
      border: none;
      background: rgba(255, 255, 255, .4);
      cursor: pointer;
      padding: 0;
    }
    .promo__puntos button.activo { background: #fff; }
    @media (max-width: 720px) {
      .promo__flecha { display: none; }
      .promo__contenido { padding: 40px 0; }
    }
  `]
})
export class PromoCarruselComponent implements OnInit, OnDestroy {
  private temporizador?: ReturnType<typeof setInterval>;

  soles = soles;
  indice = signal(0);
  promos = computed(() => this.promociones.carrusel());

  constructor(private promociones: PromocionesService) {}

  ngOnInit(): void {
    this.temporizador = setInterval(() => this.siguiente(), 7000);
  }

  ngOnDestroy(): void {
    if (this.temporizador) { clearInterval(this.temporizador); }
  }

  ir(i: number): void { this.indice.set(i); }

  siguiente(): void {
    const total = this.promos().length;
    if (total) { this.indice.set((this.indice() + 1) % total); }
  }

  anterior(): void {
    const total = this.promos().length;
    if (total) { this.indice.set((this.indice() - 1 + total) % total); }
  }
}
