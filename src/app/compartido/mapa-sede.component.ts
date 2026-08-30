import { Component, computed, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Local } from '../data/modelos';

/** Mapa embebido (OpenStreetMap) centrado en las coordenadas de la sede. */
@Component({
  selector: 'app-mapa-sede',
  standalone: true,
  template: `
    <div class="mapa" [class.mapa--editable]="editable()">
      @if (!editable()) {
        <iframe
          [src]="src()"
          [style.height.px]="alto()"
          [title]="'Mapa de ' + local().nombre"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"></iframe>
      } @else {
        <div
          class="mapa__lienzo"
          [style.height.px]="alto()"
          (pointerdown)="iniciarArrastre($event)"
          (pointermove)="moverMapa($event)"
          (pointerup)="terminarArrastre($event)"
          (pointercancel)="cancelarArrastre()">
          <div class="mapa__tiles" [style.left]="tileLayer().left" [style.top]="tileLayer().top">
            @for (tile of tiles(); track tile.key) {
              <img [src]="tile.url" [style.left.px]="tile.left" [style.top.px]="tile.top" alt="">
            }
          </div>
          <div class="mapa__pin" aria-hidden="true"></div>
          <div class="mapa__zoom" (pointerdown)="$event.stopPropagation()">
            <button type="button" (click)="acercar()" aria-label="Acercar mapa">+</button>
            <button type="button" (click)="alejar()" aria-label="Alejar mapa">−</button>
          </div>
        </div>
        <div class="mapa__ayuda">Arrastra el mapa o haz clic en el punto exacto para actualizar coordenadas</div>
      }
      <div class="mapa__pie">
        <span>{{ local().direccion }} · {{ local().distrito }}</span>
        <a [href]="googleMaps()" target="_blank" rel="noopener">Abrir en Google Maps</a>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .mapa {
      border: 1px solid var(--linea); border-radius: var(--radio-lg);
      overflow: hidden; background: var(--rosa-50); position: relative;
    }
    iframe { display: block; width: 100%; border: 0; }
    .mapa__lienzo {
      position: relative;
      overflow: hidden;
      background: #eef0ee;
      cursor: grab;
      touch-action: none;
      user-select: none;
    }
    .mapa__lienzo:active { cursor: grabbing; }
    .mapa__tiles { position: absolute; width: 1024px; height: 1024px; }
    .mapa__tiles img {
      position: absolute;
      width: 256px;
      height: 256px;
      max-width: none;
      user-select: none;
      -webkit-user-drag: none;
    }
    .mapa__pin {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 22px;
      height: 22px;
      transform: translate(-50%, -100%) rotate(45deg);
      border-radius: 50% 50% 50% 0;
      background: var(--magenta);
      box-shadow: 0 2px 12px rgba(110,19,56,.28);
      pointer-events: none;
    }
    .mapa__pin::after {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fff;
      left: 7px;
      top: 7px;
    }
    .mapa__zoom {
      position: absolute;
      right: 12px;
      top: 12px;
      z-index: 3;
      display: grid;
      gap: 6px;
    }
    .mapa__zoom button {
      width: 34px;
      height: 34px;
      border: 1px solid rgba(42, 32, 40, .12);
      border-radius: var(--radio);
      background: rgba(255,255,255,.96);
      color: var(--vino);
      font: inherit;
      font-size: 1.1rem;
      line-height: 1;
      cursor: pointer;
      box-shadow: var(--sombra);
    }
    .mapa__zoom button:hover { border-color: var(--magenta); color: var(--magenta); }
    .mapa__ayuda {
      position: absolute;
      left: 14px;
      right: 14px;
      bottom: 62px;
      z-index: 2;
      border-radius: var(--radio);
      padding: 8px 12px;
      background: rgba(255,255,255,.94);
      color: var(--vino);
      border: 1px solid rgba(176, 27, 114, .2);
      box-shadow: var(--sombra);
      font-size: .86rem;
      font-weight: 600;
      pointer-events: none;
    }
    .mapa__pie {
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
      padding: 12px 16px; font-size: .9rem; color: var(--gris);
      border-top: 1px solid var(--linea); background: #fff;
    }
    .mapa__pie a { color: var(--magenta); font-weight: 500; white-space: nowrap; }
    @media (max-width: 640px) {
      .mapa__pie { flex-direction: column; align-items: flex-start; gap: 6px; }
    }
  `]
})
export class MapaSedeComponent {
  private sanitizador = inject(DomSanitizer);

  readonly local = input.required<Local>();
  readonly alto = input(260);
  readonly editable = input(false);
  readonly coordenadas = output<{ latitud: number; longitud: number }>();
  readonly zoom = signal(16);
  private arrastre?: { pointerId: number; x: number; y: number; pixelX: number; pixelY: number; movido: boolean };

  readonly src = computed<SafeResourceUrl>(() => {
    const { latitud, longitud } = this.local();
    const dLat = 0.0016;
    const dLng = 0.0028;
    const bbox = [longitud - dLng, latitud - dLat, longitud + dLng, latitud + dLat].join('%2C');
    const url =
      `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}` +
      `&layer=mapnik&marker=${latitud}%2C${longitud}`;
    return this.sanitizador.bypassSecurityTrustResourceUrl(url);
  });

  readonly centroPixel = computed(() => this.latLonAPixel(this.local().latitud, this.local().longitud));
  readonly tileLayer = computed(() => {
    const pixel = this.centroPixel();
    const tileX = Math.floor(pixel.x / 256);
    const tileY = Math.floor(pixel.y / 256);
    const fracX = pixel.x - tileX * 256;
    const fracY = pixel.y - tileY * 256;
    return {
      left: `calc(50% - ${512 + fracX}px)`,
      top: `calc(50% - ${512 + fracY}px)`
    };
  });
  readonly tiles = computed(() => {
    const pixel = this.centroPixel();
    const tileX = Math.floor(pixel.x / 256);
    const tileY = Math.floor(pixel.y / 256);
    const zoom = this.zoom();
    const max = 2 ** zoom;
    const tiles: { key: string; url: string; left: number; top: number }[] = [];
    for (let y = -2; y <= 2; y++) {
      for (let x = -2; x <= 2; x++) {
        const tx = ((tileX + x) % max + max) % max;
        const ty = Math.min(Math.max(tileY + y, 0), max - 1);
        tiles.push({
          key: `${tx}-${ty}-${zoom}`,
          url: `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`,
          left: (x + 2) * 256,
          top: (y + 2) * 256
        });
      }
    }
    return tiles;
  });
  readonly googleMaps = computed(() => {
    const { latitud, longitud } = this.local();
    return `https://www.google.com/maps?q=${latitud},${longitud}`;
  });

  iniciarArrastre(evento: PointerEvent): void {
    if (!this.editable()) { return; }
    const pixel = this.centroPixel();
    this.arrastre = { pointerId: evento.pointerId, x: evento.clientX, y: evento.clientY, pixelX: pixel.x, pixelY: pixel.y, movido: false };
    (evento.currentTarget as HTMLElement).setPointerCapture(evento.pointerId);
  }

  moverMapa(evento: PointerEvent): void {
    if (!this.editable() || !this.arrastre || this.arrastre.pointerId !== evento.pointerId) { return; }
    const dx = evento.clientX - this.arrastre.x;
    const dy = evento.clientY - this.arrastre.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) { this.arrastre.movido = true; }
    const punto = this.pixelALatLon(this.arrastre.pixelX - dx, this.arrastre.pixelY - dy);
    this.emitir(punto.latitud, punto.longitud);
  }

  terminarArrastre(evento: PointerEvent): void {
    if (!this.editable() || !this.arrastre || this.arrastre.pointerId !== evento.pointerId) { return; }
    const arrastre = this.arrastre;
    this.arrastre = undefined;
    (evento.currentTarget as HTMLElement).releasePointerCapture(evento.pointerId);
    if (!arrastre.movido) {
      const rect = (evento.currentTarget as HTMLElement).getBoundingClientRect();
      const dx = evento.clientX - (rect.left + rect.width / 2);
      const dy = evento.clientY - (rect.top + rect.height / 2);
      const centro = this.centroPixel();
      const punto = this.pixelALatLon(centro.x + dx, centro.y + dy);
      this.emitir(punto.latitud, punto.longitud);
    }
  }

  cancelarArrastre(): void {
    this.arrastre = undefined;
  }

  acercar(): void {
    this.zoom.update(z => Math.min(z + 1, 19));
  }

  alejar(): void {
    this.zoom.update(z => Math.max(z - 1, 12));
  }

  private emitir(latitud: number, longitud: number): void {
    this.coordenadas.emit({ latitud: Number(latitud.toFixed(7)), longitud: Number(longitud.toFixed(7)) });
  }

  private latLonAPixel(latitud: number, longitud: number): { x: number; y: number } {
    const escala = 256 * 2 ** this.zoom();
    const sin = Math.sin(latitud * Math.PI / 180);
    return {
      x: (longitud + 180) / 360 * escala,
      y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * escala
    };
  }

  private pixelALatLon(x: number, y: number): { latitud: number; longitud: number } {
    const escala = 256 * 2 ** this.zoom();
    const longitud = x / escala * 360 - 180;
    const n = Math.PI - 2 * Math.PI * y / escala;
    const latitud = Math.atan(Math.sinh(n)) * 180 / Math.PI;
    return { latitud, longitud };
  }
}
