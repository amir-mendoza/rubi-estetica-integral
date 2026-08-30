import { Component, OnDestroy, OnInit, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { soles } from '../../data/datos';
import { PromocionesService } from '../../compartido/promociones.service';

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
      <section class="seccion promociones" aria-label="Promociones vigentes">
        <div class="contenedor">
          <div class="promociones__encabezado">
            <div>
              <span class="eyebrow">Promociones vigentes</span>
              <h2>Combos faciales y corporales para potenciar resultados</h2>
              <div class="filete"></div>
            </div>
            <div class="promociones__controles">
              <button class="promo__flecha" type="button" aria-label="Promocion anterior" (click)="anterior()">‹</button>
              <button class="promo__flecha" type="button" aria-label="Promocion siguiente" (click)="siguiente()">›</button>
            </div>
          </div>

          <div class="promociones__marco"
               (mouseenter)="pausar()"
               (mouseleave)="reanudar()"
               (pointerdown)="iniciarArrastre($event)"
               (pointermove)="moverArrastre($event)"
               (pointerup)="terminarArrastre($event)"
               (pointercancel)="cancelarArrastre()">
            @for (p of promos(); track p.id; let i = $index) {
              <article class="promo" [class.promo--activa]="i === indice()" [attr.aria-hidden]="i !== indice()">
                <div class="promo__arte">
                  <img class="img-cobertura" [src]="p.imagen" [alt]="p.titulo">
                  <span class="promo__sello">
                    @if (p.sesiones && p.sesiones > 1) {
                      {{ p.sesiones }} sesiones
                    } @else {
                      Promo del mes
                    }
                  </span>
                </div>

                <div class="promo__contenido">
                  <span class="promo__etiqueta">{{ p.etiqueta }}</span>
                  <h3>{{ p.titulo }}</h3>
                  <p class="promo__subtitulo">{{ p.subtitulo }}</p>
                  <p class="promo__texto">{{ p.descripcion }}</p>

                  @if (p.sesionesDetalle?.length) {
                    <div class="promo__incluye">
                      <span>Incluye</span>
                      <ol>
                        @for (s of p.sesionesDetalle; track s.titulo) {
                          <li>
                            <strong>{{ s.titulo }}</strong>
                            <p>{{ s.descripcion }}</p>
                          </li>
                        }
                      </ol>
                    </div>
                  }

                  <div class="promo__datos">
                    @if (p.precio) {
                      <div class="promo__precio">
                        <span>Precio especial</span>
                        <strong>{{ soles(p.precio) }}</strong>
                        @if (p.precioAntes) { <s>Antes {{ soles(p.precioAntes) }}</s> }
                      </div>
                    }
                    <div class="promo__vigencia">
                      <span>Vigente hasta</span>
                      <strong>{{ p.vigenciaHasta }}</strong>
                    </div>
                  </div>

                  <div class="promo__acciones">
                    <a routerLink="/reservar" [queryParams]="{ promo: p.id }" class="btn btn--primario">Reservar promocion</a>
                    <a [href]="whatsappPromo(p)" target="_blank" rel="noopener" class="btn btn--linea">Consultar por WhatsApp</a>
                  </div>
                </div>
              </article>
            }

            <div class="promo__puntos">
              @for (p of promos(); track p.id; let i = $index) {
                <button type="button" [class.activo]="i === indice()"
                        [attr.aria-label]="'Ver promocion ' + (i + 1)" (click)="ir(i)"></button>
              }
            </div>
          </div>

          <div class="promociones__lista" aria-label="Catalogo breve de promociones">
            @for (p of promos(); track p.id; let i = $index) {
              <button type="button" class="promo-mini" [class.promo-mini--activa]="i === indice()" (click)="ir(i)">
                <span>{{ p.etiqueta }}</span>
                <strong>{{ p.titulo }}</strong>
                @if (p.precio) { <em>{{ soles(p.precio) }}</em> }
              </button>
            }
          </div>
        </div>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .promociones {
      background: linear-gradient(180deg, #fff 0%, var(--rosa-50) 100%);
      overflow: hidden;
    }
    .promociones__encabezado {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 28px;
      margin-bottom: 34px;
    }
    .promociones__encabezado h2 {
      max-width: 760px;
      margin-bottom: .45rem;
    }
    .promociones__controles {
      display: flex;
      gap: 10px;
      flex: none;
    }
    .promociones__marco {
      position: relative;
      border: 1px solid var(--linea);
      border-radius: var(--radio-lg);
      background: #fff;
      box-shadow: var(--sombra);
      overflow: hidden;
      cursor: grab;
      user-select: none;
      touch-action: pan-y;
    }
    .promociones__marco:active { cursor: grabbing; }
    .promo {
      display: none;
      grid-template-columns: minmax(min(100%, 300px), 470px) minmax(0, 1fr);
      align-items: stretch;
    }
    .promo--activa {
      display: grid;
      animation: promo-contenedor 1.05s cubic-bezier(.2, .72, .18, 1) both;
    }
    .promo__arte {
      position: relative;
      min-height: 0;
      overflow: visible;
      background: #fff;
      display: grid;
      place-items: center;
      padding: 18px;
    }
    .promo__arte::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, rgba(110, 19, 56, .18), rgba(176, 27, 114, .02));
      pointer-events: none;
    }
    .promo__arte img {
      width: 100%;
      height: auto;
      max-height: min(78vh, 720px);
      object-fit: contain;
      padding: 0;
      will-change: transform;
    }
    .promo__sello {
      position: absolute;
      right: 24px;
      bottom: 24px;
      display: grid;
      place-items: center;
      width: 106px;
      height: 106px;
      border-radius: 50%;
      background: var(--magenta);
      color: #fff;
      text-align: center;
      font-size: .86rem;
      font-weight: 700;
      letter-spacing: .08em;
      line-height: 1.2;
      text-transform: uppercase;
      box-shadow: 0 18px 35px rgba(77, 13, 39, .22);
      z-index: 1;
    }
    .promo__contenido {
      align-self: center;
      padding: 52px 52px 34px;
    }
    .promo__etiqueta {
      display: inline-flex;
      align-items: center;
      margin-bottom: 16px;
      color: var(--magenta);
      font-size: .82rem;
      font-weight: 700;
      letter-spacing: .18em;
      text-transform: uppercase;
    }
    .promo h3 {
      font-size: clamp(2rem, 3.6vw, 3.35rem);
      max-width: 12ch;
      margin-bottom: 12px;
    }
    .promo__subtitulo {
      color: var(--vino);
      font-weight: 600;
      margin-bottom: 12px;
    }
    .promo__texto {
      max-width: 58ch;
      margin-bottom: 24px;
    }
    .promo__incluye {
      position: relative;
      margin: 0 0 24px;
      padding: 18px 18px 18px 22px;
      border-radius: var(--radio-lg);
      background: var(--rosa-50);
      border: 1px solid var(--linea);
    }
    .promo__incluye > span {
      display: block;
      color: var(--magenta);
      font-size: .82rem;
      font-weight: 800;
      letter-spacing: .16em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .promo__incluye ol {
      list-style: none;
      display: grid;
      gap: 12px;
      margin: 0;
      padding: 0;
      counter-reset: promo-sesion;
    }
    .promo__incluye li {
      position: relative;
      padding-left: 36px;
      counter-increment: promo-sesion;
    }
    .promo__incluye li::before {
      content: counter(promo-sesion);
      position: absolute;
      left: 0;
      top: 1px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--magenta);
      color: #fff;
      font-size: .82rem;
      font-weight: 700;
    }
    .promo__incluye strong {
      display: block;
      color: var(--vino);
      font-size: .96rem;
      margin-bottom: 2px;
    }
    .promo__incluye p {
      margin: 0;
      color: var(--gris);
      font-size: .9rem;
      line-height: 1.45;
    }
    .promo__datos {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 28px;
    }
    .promo__precio,
    .promo__vigencia {
      border-top: 1px solid var(--linea);
      padding-top: 14px;
    }
    .promo__precio span,
    .promo__vigencia span {
      display: block;
      color: var(--gris-claro);
      font-size: .82rem;
      letter-spacing: .14em;
      text-transform: uppercase;
    }
    .promo__precio strong {
      display: block;
      color: var(--magenta);
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 2.4rem;
      line-height: 1;
      margin: 7px 0 5px;
    }
    .promo__precio s {
      color: var(--gris-claro);
      font-size: .94rem;
    }
    .promo__vigencia strong {
      display: block;
      color: var(--vino);
      font-size: 1rem;
      margin-top: 10px;
    }
    .promo__acciones {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .promo--activa .promo__arte img {
      animation: promo-imagen 1.15s cubic-bezier(.2, .72, .18, 1) both;
    }
    .promo--activa .promo__etiqueta,
    .promo--activa h3,
    .promo--activa .promo__subtitulo,
    .promo--activa .promo__texto,
    .promo--activa .promo__incluye,
    .promo--activa .promo__datos,
    .promo--activa .promo__acciones {
      animation: promo-texto 1.05s cubic-bezier(.2, .72, .18, 1) both;
    }
    .promo--activa h3 { animation-delay: .06s; }
    .promo--activa .promo__subtitulo { animation-delay: .12s; }
    .promo--activa .promo__texto { animation-delay: .18s; }
    .promo--activa .promo__incluye { animation-delay: .24s; }
    .promo--activa .promo__datos { animation-delay: .3s; }
    .promo--activa .promo__acciones { animation-delay: .36s; }
    .promo__flecha {
      width: 42px;
      height: 42px;
      border: 1px solid var(--linea);
      border-radius: 50%;
      background: #fff;
      color: var(--vino);
      font-size: 1.45rem;
      line-height: 1;
      cursor: pointer;
      transition: background .2s ease, color .2s ease, border-color .2s ease;
    }
    .promo__flecha:hover {
      background: var(--vino);
      border-color: var(--vino);
      color: #fff;
    }
    .promo__puntos {
      display: flex;
      justify-content: center;
      gap: 9px;
      padding: 0 24px 28px;
    }
    .promo__puntos button {
      width: 34px;
      height: 3px;
      border: none;
      background: rgba(110, 19, 56, .22);
      cursor: pointer;
      padding: 0;
    }
    .promo__puntos button.activo { background: var(--magenta); }
    .promociones__lista {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-top: 16px;
    }
    .promo-mini {
      text-align: left;
      border: 1px solid var(--linea);
      border-radius: var(--radio-lg);
      background: #fff;
      padding: 18px;
      cursor: pointer;
      box-shadow: none;
      transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
    }
    .promo-mini:hover,
    .promo-mini--activa {
      border-color: rgba(176, 27, 114, .42);
      box-shadow: var(--sombra);
      transform: translateY(-5px) scale(1.015);
    }
    .promo-mini span {
      display: block;
      color: var(--magenta);
      font-size: .78rem;
      font-weight: 700;
      letter-spacing: .14em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .promo-mini strong {
      display: block;
      color: var(--tinta);
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1.16rem;
      font-weight: 600;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    .promo-mini em {
      color: var(--vino);
      font-style: normal;
      font-size: .96rem;
      font-weight: 700;
    }
    @media (max-width: 960px) {
      .promociones__encabezado { align-items: flex-start; }
      .promo {
        grid-template-columns: 1fr;
      }
      .promo__arte { min-height: 0; }
      .promo__arte img { max-height: none; }
      .promo__contenido { padding: 34px 28px 24px; }
      .promo h3 { max-width: 14ch; }
      .promociones__lista { grid-template-columns: 1fr; }
      .promo__puntos { justify-content: flex-start; padding-left: 28px; }
    }
    @media (max-width: 640px) {
      .promociones__encabezado { display: block; }
      .promociones__controles { margin-top: 18px; }
      .promo__datos { grid-template-columns: 1fr; }
      .promo__arte { min-height: 0; }
      .promo__sello {
        width: 86px;
        height: 86px;
        right: 16px;
        bottom: 16px;
        font-size: .78rem;
      }
      .promo__contenido { padding: 28px 22px 24px; }
      .promo__acciones .btn { width: 100%; }
    }
    @media (prefers-reduced-motion: no-preference) {
      @keyframes promo-contenedor {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes promo-imagen {
        from { opacity: 0; transform: translateY(16px) scale(.99); }
        to { opacity: 1; transform: translateX(0) scale(1); }
      }
      @keyframes promo-texto {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateX(0); }
      }
    }
  `]
})
export class PromoCarruselComponent implements OnInit, OnDestroy {
  private temporizador?: ReturnType<typeof setInterval>;
  private arrastre: { id: number; y: number } | null = null;

  soles = soles;
  indice = signal(0);
  promos = computed(() => this.promociones.carrusel());

  constructor(private promociones: PromocionesService) {}

  ngOnInit(): void {
    this.reanudar();
  }

  ngOnDestroy(): void {
    this.pausar();
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

  pausar(): void {
    if (this.temporizador) {
      clearInterval(this.temporizador);
      this.temporizador = undefined;
    }
  }

  reanudar(): void {
    this.pausar();
    this.temporizador = setInterval(() => this.siguiente(), 7000);
  }

  iniciarArrastre(evento: PointerEvent): void {
    this.arrastre = { id: evento.pointerId, y: evento.clientY };
    (evento.currentTarget as HTMLElement).setPointerCapture(evento.pointerId);
    this.pausar();
  }

  moverArrastre(evento: PointerEvent): void {
    if (!this.arrastre || this.arrastre.id !== evento.pointerId) { return; }
    const desplazamiento = evento.clientY - this.arrastre.y;
    if (Math.abs(desplazamiento) < 42) { return; }
    desplazamiento < 0 ? this.siguiente() : this.anterior();
    this.arrastre = { ...this.arrastre, y: evento.clientY };
  }

  terminarArrastre(evento: PointerEvent): void {
    if (!this.arrastre || this.arrastre.id !== evento.pointerId) { return; }
    (evento.currentTarget as HTMLElement).releasePointerCapture(evento.pointerId);
    this.arrastre = null;
    this.reanudar();
  }

  cancelarArrastre(): void {
    this.arrastre = null;
    this.reanudar();
  }

  whatsappPromo(promo: { titulo: string; precio?: number }): string {
    const precio = promo.precio ? ` a ${soles(promo.precio)}` : '';
    const texto = `Hola, quiero consultar y reservar la promocion ${promo.titulo}${precio}.`;
    return `https://wa.me/51945189720?text=${encodeURIComponent(texto)}`;
  }
}
