import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ESPECIALISTAS, LOCALES, TRATAMIENTOS } from '../../data/datos';

@Component({
  selector: 'app-especialistas',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <div class="miga"><a routerLink="/">Inicio</a> / Especialistas</div>
        <h1>Especialistas</h1>
        <p>Cosmiatras, técnicas en aparatología y médico estético con colegiatura vigente.</p>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor">
        <div class="grid grid-3">
          @for (e of especialistas; track e.id) {
            <article class="ficha">
              <img class="img-cobertura" [src]="e.foto" [alt]="e.nombre + ' ' + e.apellido">
              <div class="ficha__cuerpo">
                <h3>{{ e.nombre }} {{ e.apellido }}</h3>
                <span class="ficha__rol">{{ e.especialidad }}</span>
                <p>{{ e.bio }}</p>

                <div class="ficha__dato">
                  <span class="dato__label">Colegiatura</span>
                  <span>{{ e.colegiatura }}</span>
                </div>
                <div class="ficha__dato">
                  <span class="dato__label">Atiende en</span>
                  <span>{{ sedes(e.locales) }}</span>
                </div>
                <div class="ficha__dato">
                  <span class="dato__label">Horario</span>
                  <span>{{ e.horario }}</span>
                </div>

                <div class="ficha__etiquetas">
                  @for (t of tratamientos(e.tratamientos); track t) {
                    <span class="chip">{{ t }}</span>
                  }
                </div>

                <a routerLink="/reservar" [queryParams]="{ especialista: e.id }" class="btn btn--linea btn--sm ficha__btn">
                  Reservar con {{ e.nombre }}
                </a>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .ficha { background: #fff; border: 1px solid var(--linea); border-radius: var(--radio-lg); overflow: hidden; display: flex; flex-direction: column; }
    .ficha img { width: 100%; aspect-ratio: 4/4.4; object-fit: cover; }
    .ficha__cuerpo { padding: 26px; display: flex; flex-direction: column; flex: 1; }
    .ficha__cuerpo h3 { margin-bottom: .2rem; }
    .ficha__rol { font-size: .68rem; letter-spacing: .18em; text-transform: uppercase; color: var(--magenta); margin-bottom: 14px; }
    .ficha__cuerpo p { font-size: .9rem; }
    .ficha__dato { display: flex; justify-content: space-between; gap: 14px; padding: 9px 0; border-bottom: 1px dashed var(--linea); font-size: .84rem; color: var(--tinta); }
    .ficha__etiquetas { display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0 22px; }
    .ficha__btn { margin-top: auto; align-self: flex-start; }
  `]
})
export class EspecialistasComponent {
  especialistas = ESPECIALISTAS;

  sedes(ids: number[]): string {
    return ids.map(id => LOCALES.find(l => l.id === id)?.nombre ?? '').join(' · ');
  }

  tratamientos(ids: number[]): string[] {
    return ids.map(id => TRATAMIENTOS.find(t => t.id === id)?.nombre ?? '').filter(Boolean);
  }
}
