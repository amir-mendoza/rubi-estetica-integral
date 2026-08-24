import { Component, computed, inject, input } from '@angular/core';
import { CargadorService, EstiloCargador } from './cargador.service';

/**
 * Rueda de carga de la marca. El estilo y la velocidad salen de la configuración
 * del panel, así se puede cambiar el indicador sin tocar el código.
 */
@Component({
  selector: 'app-cargador-rueda',
  template: `
    <span
      class="rueda"
      [class]="'rueda--' + estiloActivo()"
      [style.--rueda-tam.px]="tamano()"
      [style.--rueda-vel.ms]="velocidad()"
      role="progressbar"
      [attr.aria-valuenow]="porcentaje() ?? null"
      [attr.aria-label]="etiqueta()"
    >
      @switch (estiloActivo()) {
        @case ('puntos') {
          @for (i of doce; track i) {
            <i class="pieza" [style.--i]="i"></i>
          }
        }
        @case ('petalos') {
          @for (i of ocho; track i) {
            <i class="pieza" [style.--i]="i"></i>
          }
        }
        @case ('barras') {
          @for (i of doce; track i) {
            <i class="pieza" [style.--i]="i"></i>
          }
        }
        @case ('orbita') {
          <i class="aro aro--uno"></i>
          <i class="aro aro--dos"></i>
        }
        @case ('segmentos') {
          @for (i of cuatro; track i) {
            <i class="pieza" [style.--i]="i"></i>
          }
        }
        @default {
          <i class="aro aro--uno"></i>
          <i class="punto"></i>
        }
      }
    </span>
  `,
  styles: [`
    .rueda {
      position: relative; display: inline-block; flex: none;
      width: var(--rueda-tam, 64px); height: var(--rueda-tam, 64px);
      max-width: 100%;
    }
    .rueda i { position: absolute; display: block; }

    .aro {
      inset: 0; border-radius: 50%;
      border: calc(var(--rueda-tam, 64px) * .085) solid color-mix(in srgb, var(--vino, #7d1f45) 16%, transparent);
      border-top-color: var(--vino, #7d1f45);
      animation: rueda-giro var(--rueda-vel, 1400ms) cubic-bezier(.45, .05, .55, .95) infinite;
    }
    .aro--dos {
      inset: 22%;
      border-width: calc(var(--rueda-tam, 64px) * .07);
      border-top-color: transparent;
      border-bottom-color: var(--fucsia, #c2185b);
      animation-direction: reverse;
      animation-duration: calc(var(--rueda-vel, 1400ms) * 1.35);
    }
    .punto {
      top: 0; left: 50%; width: 16%; height: 16%; margin-left: -8%;
      border-radius: 50%; background: var(--fucsia, #c2185b);
      transform-origin: 50% calc(var(--rueda-tam, 64px) / 2);
      animation: rueda-giro var(--rueda-vel, 1400ms) linear infinite;
    }

    .rueda--puntos .pieza {
      top: 0; left: 50%; width: 12%; height: 12%; margin-left: -6%;
      border-radius: 50%; background: var(--vino, #7d1f45);
      transform: rotate(calc(var(--i) * 30deg)) translateY(0);
      transform-origin: 50% calc(var(--rueda-tam, 64px) / 2);
      opacity: .18;
      animation: rueda-pulso calc(var(--rueda-vel, 1400ms) * 1.1) linear infinite;
      animation-delay: calc(var(--i) * var(--rueda-vel, 1400ms) / 12);
    }

    .rueda--barras .pieza {
      top: 2%; left: 50%; width: 7%; height: 26%; margin-left: -3.5%;
      border-radius: 999px; background: var(--vino, #7d1f45);
      transform: rotate(calc(var(--i) * 30deg));
      transform-origin: 50% calc(var(--rueda-tam, 64px) / 2 - 2%);
      opacity: .16;
      animation: rueda-pulso calc(var(--rueda-vel, 1400ms) * 1.1) linear infinite;
      animation-delay: calc(var(--i) * var(--rueda-vel, 1400ms) / 12);
    }

    .rueda--petalos { animation: rueda-giro calc(var(--rueda-vel, 1400ms) * 2) linear infinite; }
    .rueda--petalos .pieza {
      top: 0; left: 50%; width: 14%; height: 30%; margin-left: -7%;
      border-radius: 60% 60% 60% 0;
      background: color-mix(in srgb, var(--fucsia, #c2185b) 70%, #fff);
      transform: rotate(calc(var(--i) * 45deg));
      transform-origin: 50% calc(var(--rueda-tam, 64px) / 2);
      opacity: .3;
      animation: rueda-pulso calc(var(--rueda-vel, 1400ms) * 1.3) ease-in-out infinite;
      animation-delay: calc(var(--i) * var(--rueda-vel, 1400ms) / 8);
    }

    .rueda--segmentos .pieza {
      inset: 0; border-radius: 50%;
      border: calc(var(--rueda-tam, 64px) * .1) solid transparent;
      border-top-color: var(--vino, #7d1f45);
      transform: rotate(calc(var(--i) * 90deg));
      opacity: .25;
      animation: rueda-pulso calc(var(--rueda-vel, 1400ms) * 1.2) linear infinite;
      animation-delay: calc(var(--i) * var(--rueda-vel, 1400ms) / 4);
    }

    @keyframes rueda-giro { to { transform: rotate(360deg); } }
    @keyframes rueda-pulso {
      0%, 100% { opacity: .16; }
      35% { opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .rueda, .rueda i { animation-duration: 3s !important; }
    }
  `]
})
export class CargadorRuedaComponent {
  private cargador = inject(CargadorService);

  /** Permite forzar un estilo (vista previa del panel); si no, usa el configurado. */
  estilo = input<EstiloCargador | null>(null);
  tamano = input(64);
  porcentaje = input<number | null>(null);
  etiqueta = input('Cargando');

  readonly cuatro = [0, 1, 2, 3];
  readonly ocho = [0, 1, 2, 3, 4, 5, 6, 7];
  readonly doce = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  estiloActivo = computed<EstiloCargador>(() => this.estilo() ?? this.cargador.config().estilo);
  velocidad = computed(() => this.cargador.config().velocidadMs);
}
