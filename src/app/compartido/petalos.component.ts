import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

interface PetaloConfig {
  left: string;
  delay: string;
  duracion: string;
  scale: number;
  rotacionInicial: number;
  opacidad: number;
}

@Component({
  selector: 'app-petalos',
  standalone: true,
  template: `
    <div class="contenedor-petalos" aria-hidden="true">
      @for (p of petalos; track $index) {
        <div class="petalo-caida"
             [style.left]="p.left"
             [style.animation-delay]="p.delay"
             [style.animation-duration]="p.duracion"
             [style.opacity]="p.opacidad">
          <div class="petalo-balanceo"
               [style.transform]="'scale(' + p.scale + ') rotate(' + p.rotacionInicial + 'deg)'">
            <svg viewBox="0 0 84 68" width="40" height="32">
              <path d="M0 0 C 34 -22 76 -6 84 30 C 90 58 60 78 30 68 C 4 60 -14 26 0 0 Z" fill="url(#tono-petalo)"/>
              <path d="M2 6 C 30 -8 66 6 78 34" fill="none" stroke="#6e1338" stroke-opacity="0.12" stroke-width="1.6"/>
              <path d="M14 46 C 34 34 54 30 74 38" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="1.4"/>
            </svg>
          </div>
        </div>
      }

      <svg style="position: absolute; width: 0; height: 0;" width="0" height="0">
        <defs>
          <linearGradient id="tono-petalo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#e07bad" stop-opacity="0.75"/>
            <stop offset="100%" stop-color="#b01b72" stop-opacity="0.4"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .contenedor-petalos {
      position: fixed;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .petalo-caida {
      position: absolute;
      top: -60px;
      animation: caer linear infinite;
      will-change: top;
    }
    .petalo-balanceo {
      animation: balancear ease-in-out infinite alternate;
      transform-origin: center;
      will-change: transform;
    }
    @keyframes caer {
      0% { top: -60px; }
      100% { top: 105vh; }
    }
    @keyframes balancear {
      0% { transform: translateX(0) rotate(0deg); }
      100% { transform: translateX(50px) rotate(40deg); }
    }
  `]
})
export class PetalosComponent implements OnInit {
  petalos: PetaloConfig[] = [];

  ngOnInit(): void {
    for (let i = 0; i < 16; i++) {
      this.petalos.push({
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * -20}s`,
        duracion: `${10 + Math.random() * 10}s`,
        scale: 0.35 + Math.random() * 0.65,
        rotacionInicial: Math.random() * 360,
        opacidad: 0.15 + Math.random() * 0.4
      });
    }
  }
}
