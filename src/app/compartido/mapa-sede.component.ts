import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Local } from '../data/modelos';

/** Mapa embebido (OpenStreetMap) centrado en las coordenadas de la sede. */
@Component({
  selector: 'app-mapa-sede',
  standalone: true,
  template: `
    <div class="mapa">
      <iframe
        [src]="src()"
        [title]="'Mapa de ' + local().nombre"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"></iframe>
      <div class="mapa__pie">
        <span>{{ local().direccion }} · {{ local().distrito }}</span>
        <a [href]="local().mapa" target="_blank" rel="noopener">Abrir en Google Maps</a>
      </div>
    </div>
  `,
  styles: [`
    .mapa {
      border: 1px solid var(--linea); border-radius: var(--radio-lg);
      overflow: hidden; background: var(--rosa-50);
    }
    iframe { display: block; width: 100%; height: 260px; border: 0; }
    .mapa__pie {
      display: flex; justify-content: space-between; align-items: center; gap: 16px;
      padding: 12px 16px; font-size: .8rem; color: var(--gris);
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
}
