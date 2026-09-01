import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ESPECIALISTAS } from '../../data/datos';
import { Especialista } from '../../data/modelos';

@Component({
  selector: 'app-especialistas',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <div class="miga"><a routerLink="/">Inicio</a> / Especialistas</div>
        <h1>Especialistas</h1>
        <p>Equipo de atención estética con experiencia en protocolos faciales, corporales y aparatología.</p>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor">
        <div class="grid grid-3">
          @for (e of especialistas; track e.id) {
            <article class="ficha">
              <img class="img-cobertura" [src]="e.foto" [alt]="e.nombre + ' ' + e.apellido">
              <div class="ficha__cuerpo">
                <h3>{{ nombrePublico(e) }}</h3>
                <span class="ficha__rol">{{ e.especialidad }}</span>
                <p>{{ e.bio }}</p>
              </div>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    .ficha { background: #fff; border: 1px solid var(--linea); border-radius: var(--radio-lg); overflow: hidden; display: flex; flex-direction: column; }
    .ficha img { width: 100%; aspect-ratio: 4/4.4; object-fit: cover; }
    .ficha__cuerpo { padding: 26px; display: flex; flex-direction: column; flex: 1; }
    .ficha__cuerpo h3 { margin-bottom: .2rem; }
    .ficha__rol { font-size: .82rem; letter-spacing: .18em; text-transform: uppercase; color: var(--magenta); margin-bottom: 14px; }
    .ficha__cuerpo p { font-size: .96rem; margin-bottom: 0; }
  `]
})
export class EspecialistasComponent {
  especialistas = ESPECIALISTAS;

  nombrePublico(especialista: Especialista): string {
    const nombre = especialista.nombre.trim().split(/\s+/)[0] ?? '';
    const apellido = especialista.apellido.trim().split(/\s+/)[0] ?? '';
    return `${nombre} ${apellido}`.trim();
  }
}
