import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  computed,
  effect,
  inject,
  viewChild,
  ChangeDetectionStrategy
} from '@angular/core';
import { FondoService } from './fondo.service';

/**
 * Capa de fondo de la web pública.
 * Orden de capas: color sólido → imagen o video con opacidad regulable → contenido.
 */
@Component({
  selector: 'app-fondo-web',
  standalone: true,
  template: `
    <div class="fondo" aria-hidden="true" [style.background]="degradado()">
      @if (cfg().modo === 'imagen' && cfg().imagen) {
        <img class="fondo__medio" [src]="cfg().imagen" alt=""
             [style.opacity]="cfg().opacidadMedio / 100"
             [style.filter]="filtro()">
      }
      @if (cfg().modo === 'video' && cfg().video) {
        <video #video class="fondo__medio" muted loop playsinline preload="metadata"
               [attr.poster]="cfg().posterVideo || null"
               [src]="cfg().video"
               [style.opacity]="cfg().opacidadMedio / 100"
               [style.filter]="filtro()"></video>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .fondo {
      position: fixed;
      inset: 0;
      z-index: -1;
      overflow: hidden;
      pointer-events: none;
    }
    .fondo__medio {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity .6s ease;
    }
  `]
})
export class FondoWebComponent implements AfterViewInit, OnDestroy {
  private readonly fondo = inject(FondoService);
  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private temporizador?: ReturnType<typeof setTimeout>;

  cfg = this.fondo.config;

  constructor() {
    effect(() => {
      this.cfg();
      setTimeout(() => this.reproducir(), 0);
    });
  }

  degradado = computed(() => {
    const c = this.cfg();
    return c.colorSecundario && c.colorSecundario !== c.color
      ? `linear-gradient(160deg, ${c.color} 0%, ${c.colorSecundario} 100%)`
      : c.color;
  });

  filtro = computed(() => {
    const d = this.cfg().desenfoque;
    return d > 0 ? `blur(${d}px)` : 'none';
  });

  ngAfterViewInit(): void {
    this.reproducir();
  }

  ngOnDestroy(): void {
    if (this.temporizador) { clearTimeout(this.temporizador); }
  }

  @HostListener('window:scroll')
  alDesplazar(): void {
    if (!this.cfg().pausarQuieto) { return; }
    this.reproducir();
    if (this.temporizador) { clearTimeout(this.temporizador); }
    this.temporizador = setTimeout(() => this.video()?.nativeElement.pause(), 1100);
  }

  @HostListener('document:visibilitychange')
  alCambiarVisibilidad(): void {
    const el = this.video()?.nativeElement;
    if (!el) { return; }
    if (document.hidden) { el.pause(); } else if (!this.cfg().pausarQuieto) { this.reproducir(); }
  }

  private reproducir(): void {
    const el = this.video()?.nativeElement;
    if (!el) { return; }
    el.muted = true;
    void el.play().catch(() => undefined);
  }
}
