import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MapaSedeComponent } from '../../compartido/mapa-sede.component';
import { HABITACIONES, LOCALES } from '../../data/datos';
import { ConfiguracionPanelService } from '../../compartido/configuracion-panel.service';

@Component({
  selector: 'app-locales',
  standalone: true,
  imports: [RouterLink, MapaSedeComponent],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <div class="miga"><a routerLink="/">Inicio</a> / Locales</div>
        <h1>Nuestras sedes</h1>
        <p>Dos locales en la Av. Las Flores de Primavera, San Juan de Lurigancho, con cabinas equipadas y atención con cita previa.</p>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor">
        @for (l of locales(); track l.id) {
          <article class="sede">
            <div class="sede__visual">
              <figure class="sede__imagen"><img class="img-cobertura" [src]="l.imagen" [alt]="l.nombre"></figure>
              <app-mapa-sede [local]="l" />
            </div>
            <div class="sede__info">
              <span class="eyebrow">{{ l.distrito }}</span>
              <h2>{{ l.nombre }}</h2>
              <div class="filete"></div>
              <p>{{ l.direccion }}<br>{{ l.referencia }}</p>

              <div class="sede__bloques">
                <div>
                  <span class="dato__label">Horario de atención</span>
                  @for (h of l.horario; track h.dias) {
                    <div class="sede__horario"><span>{{ h.dias }}</span><strong>{{ h.apertura }} — {{ h.cierre }}</strong></div>
                  }
                </div>
                <div>
                  <span class="dato__label">Cabinas disponibles</span>
                  @for (c of cabinas(l.id); track c.id) {
                    <div class="sede__cabina">
                      <strong>{{ c.nombre }}</strong>
                      <span>{{ c.equipamiento }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="sede__acciones">
                <a routerLink="/reservar" [queryParams]="{ local: l.id }" class="btn btn--primario btn--sm">Reservar en esta sede</a>
                <a [href]="'https://www.google.com/maps/dir/?api=1&destination=' + l.latitud + ',' + l.longitud"
                   target="_blank" rel="noopener" class="btn btn--linea btn--sm">Cómo llegar</a>
                <a [href]="'tel:' + l.telefono" class="btn btn--linea btn--sm">{{ l.telefono }}</a>
              </div>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .sede {
      display: grid; grid-template-columns: 1fr 1.1fr; gap: 56px; align-items: center;
      padding: 56px 0; border-bottom: 1px solid var(--linea);
    }
    .sede:first-child { padding-top: 0; }
    .sede:last-child { border-bottom: none; }
    .sede:nth-child(even) .sede__visual { order: 2; }
    .sede__visual { display: grid; gap: 16px; }
    .sede__imagen { margin: 0; border-radius: var(--radio-lg); overflow: hidden; }
    .sede__imagen img { width: 100%; aspect-ratio: 4/3; object-fit: cover; }
    .sede__bloques { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin: 28px 0; }
    .sede__horario { display: flex; justify-content: space-between; gap: 12px; font-size: .94rem; color: var(--gris); padding: 7px 0; border-bottom: 1px dashed var(--linea); }
    .sede__horario strong { color: var(--tinta); font-weight: 500; }
    .sede__cabina { padding: 7px 0; border-bottom: 1px dashed var(--linea); }
    .sede__cabina strong { display: block; font-size: .94rem; font-weight: 500; }
    .sede__cabina span { font-size: .86rem; color: var(--gris-claro); }
    .sede__acciones { display: flex; gap: 12px; flex-wrap: wrap; }
    .dato__label { display: block; margin-bottom: 12px; }
    @media (max-width: 960px) {
      .sede { grid-template-columns: 1fr; gap: 32px; }
      .sede:nth-child(even) .sede__visual { order: 0; }
      .sede__bloques { grid-template-columns: 1fr; }
    }
  `]
})
export class LocalesComponent {
  private configPanel = inject(ConfiguracionPanelService);
  locales = computed(() => this.configPanel.combinarLocalesConHorarios(LOCALES));
  cabinas(localId: number) {
    return HABITACIONES.filter(h => h.localId === localId);
  }
}
