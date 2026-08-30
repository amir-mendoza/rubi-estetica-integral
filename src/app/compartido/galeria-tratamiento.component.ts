import { Component, ElementRef, computed, effect, input, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';

interface Pieza {
  tipo: 'video' | 'imagen';
  fuente: string;
  portada: string;
  etiqueta: string;
}

/**
 * Galería del detalle de tratamiento: el video se muestra primero y las fotos
 * quedan como miniaturas seleccionables, igual que un catálogo de producto.
 */
@Component({
  selector: 'app-galeria-tratamiento',
  standalone: true,
  template: `
    <div class="galeria">
      <div class="galeria__escena">
        @if (actual(); as pieza) {
          @if (pieza.tipo === 'video') {
            <video
              #reproductor
              class="galeria__video"
              [src]="pieza.fuente"
              [poster]="pieza.portada || null"
              [muted]="silencio()"
              playsinline
              loop
              autoplay
              preload="metadata"
              controls
            ></video>

            <button type="button" class="galeria__sonido" (click)="alternarSonido()">
              @if (silencio()) {
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 4 6"/><path d="m20 9-4 6"/>
                </svg>
                Activar sonido
              } @else {
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M16 9a4 4 0 0 1 0 6"/>
                </svg>
                Silenciar
              }
            </button>
          } @else {
            <img class="galeria__foto" [src]="pieza.fuente" [alt]="titulo() + ' — ' + pieza.etiqueta">
          }
        }

        @if (piezas().length > 1) {
          <span class="galeria__contador">{{ indice() + 1 }} / {{ piezas().length }}</span>
        }
      </div>

      @if (piezas().length > 1) {
        <div class="galeria__miniaturas" role="tablist" aria-label="Video y fotos del tratamiento">
          @for (p of piezas(); track p.fuente; let i = $index) {
            <button
              type="button"
              role="tab"
              class="mini"
              [class.mini--activa]="i === indice()"
              [attr.aria-selected]="i === indice()"
              [attr.aria-label]="p.etiqueta"
              (click)="indice.set(i)"
            >
              <img [src]="p.portada || p.fuente" [alt]="p.etiqueta">
              @if (p.tipo === 'video') {
                <span class="mini__play" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </span>
              }
            </button>
          }
        </div>
      }

      @if (tiktokUrl()) {
        <a class="galeria__tiktok" [href]="tiktokUrl()" target="_blank" rel="noopener">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.79-2.46V9.8a5.79 5.79 0 1 0 4.88 5.71V8.87a7.35 7.35 0 0 0 4.3 1.38V7.16a4.29 4.29 0 0 1-3.24-1.34Z"/>
          </svg>
          Ver este tratamiento en TikTok
        </a>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .galeria { display: grid; gap: 14px; min-width: 0; }
    .galeria__escena {
      position: relative;
      width: 100%;
      border-radius: var(--radio-lg);
      overflow: hidden;
      background: #120309;
      aspect-ratio: 4 / 3;
    }
    .galeria__video, .galeria__foto {
      width: 100%; height: 100%; max-width: 100%;
      object-fit: cover; display: block;
    }
    .galeria__video { background: #120309; object-fit: contain; }
    .galeria__sonido {
      position: absolute; top: 3%; left: 3%;
      display: inline-flex; align-items: center; gap: 8px;
      padding: 8px 14px; border: 1px solid rgba(255,255,255,.4); border-radius: 999px;
      background: rgba(18,3,9,.55); color: #fff; cursor: pointer;
      font-family: inherit; font-size: .82rem; letter-spacing: .1em; text-transform: uppercase;
      backdrop-filter: blur(3px); transition: background .3s ease, border-color .3s ease;
    }
    .galeria__sonido:hover { background: rgba(18,3,9,.8); border-color: #fff; }
    .galeria__contador {
      position: absolute; bottom: 3%; right: 3%;
      padding: 5px 11px; border-radius: 999px;
      background: rgba(18,3,9,.55); color: #fff; font-size: .8rem; letter-spacing: .08em;
    }
    .galeria__miniaturas {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 84px), 1fr));
      gap: 2.5%;
      min-width: 0;
    }
    .mini {
      position: relative; padding: 0; border: 1px solid var(--linea); border-radius: var(--radio);
      overflow: hidden; background: var(--rosa-50); cursor: pointer; aspect-ratio: 1 / 1;
      transition: border-color .3s ease, transform .3s ease;
    }
    .mini img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .mini:hover { transform: translateY(-2px); border-color: var(--magenta-300); }
    .mini--activa { border-color: var(--magenta); box-shadow: 0 0 0 2px var(--magenta-300); }
    .mini__play {
      position: absolute; inset: 0; display: grid; place-items: center;
      background: rgba(18,3,9,.34); color: #fff;
    }
    .galeria__tiktok {
      display: inline-flex; align-items: center; gap: 9px; justify-self: start;
      padding: 10px 16px; border: 1px solid var(--linea); border-radius: 999px;
      color: var(--vino); font-size: .9rem; text-decoration: none;
      transition: color .3s ease, border-color .3s ease;
    }
    .galeria__tiktok:hover { color: var(--magenta); border-color: var(--magenta-300); }
    @media (max-width: 640px) {
      .galeria__escena { aspect-ratio: 3 / 4; }
    }
  `]
})
export class GaleriaTratamientoComponent {
  video = input('');
  videoPoster = input('');
  imagenes = input<string[]>([]);
  tiktokUrl = input('');
  titulo = input('Tratamiento');

  indice = signal(0);
  silencio = signal(true);

  private reproductor = viewChild<ElementRef<HTMLVideoElement>>('reproductor');

  piezas = computed<Pieza[]>(() => {
    const lista: Pieza[] = [];

    if (this.video()) {
      lista.push({
        tipo: 'video',
        fuente: this.video(),
        portada: this.videoPoster() || this.imagenes()[0] || '',
        etiqueta: 'Video del tratamiento'
      });
    }

    this.imagenes().filter(Boolean).forEach((imagen, i) => {
      lista.push({ tipo: 'imagen', fuente: imagen, portada: imagen, etiqueta: `Foto ${i + 1}` });
    });

    return lista;
  });

  actual = computed(() => this.piezas()[Math.min(this.indice(), this.piezas().length - 1)]);

  constructor() {
    effect(() => {
      this.piezas();
      this.indice.set(0);
    });

    effect(() => {
      const elemento = this.reproductor()?.nativeElement;
      if (!elemento) { return; }

      elemento.muted = this.silencio();
      elemento.play().catch(() => {
        // Si el navegador bloquea la reproducción automática la paciente usa los controles.
      });
    });
  }

  alternarSonido(): void {
    this.silencio.update(v => !v);
  }
}
