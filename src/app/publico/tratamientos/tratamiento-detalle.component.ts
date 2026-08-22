import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TRATAMIENTOS, soles, tratamientoPorId } from '../../data/datos';

@Component({
  selector: 'app-tratamiento-detalle',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (tratamiento(); as t) {
      <section class="detalle">
        <div class="contenedor detalle__grid">
          <figure class="detalle__imagen">
            <img class="img-cobertura" [src]="t.imagen" [alt]="t.nombre">
          </figure>
          <div>
            <a routerLink="/tratamientos" class="volver-link">← Volver a tratamientos</a>
            <div class="miga">
              <a routerLink="/">Inicio</a> / <a routerLink="/tratamientos">Tratamientos</a> / {{ t.nombre }}
            </div>
            <span class="eyebrow">{{ t.categoria }}</span>
            <h1>{{ t.nombre }}</h1>
            <p class="lead">{{ t.resumen }}</p>

            <div class="detalle__precio">
              @if (t.precioAntes) { <span class="precio__antes">{{ soles(t.precioAntes) }}</span> }
              <span class="detalle__monto">{{ soles(t.precio) }}</span>
              <span class="detalle__nota">por sesión</span>
            </div>

            <div class="detalle__datos">
              <div class="dato">
                <span class="dato__label">Duración</span>
                <span class="dato__valor">{{ t.duracionMin }} minutos</span>
              </div>
              <div class="dato">
                <span class="dato__label">Preparación de cabina</span>
                <span class="dato__valor">{{ t.limpiezaMin }} minutos</span>
              </div>
              <div class="dato">
                <span class="dato__label">Tiempo total reservado</span>
                <span class="dato__valor">{{ t.duracionMin + t.limpiezaMin }} minutos</span>
              </div>
            </div>

            <div class="detalle__acciones">
              <a routerLink="/reservar" [queryParams]="{ tratamiento: t.id }" class="btn btn--primario">Reservar este tratamiento</a>
              <a href="https://wa.me/51945189720" target="_blank" rel="noopener" class="btn btn--linea">Consultar por WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      <section class="seccion seccion--compacta">
        <div class="contenedor detalle__contenido">
          <div>
            <h2>En qué consiste</h2>
            <div class="filete"></div>
            <p>{{ t.descripcion }}</p>

            <h3 style="margin-top:40px">Beneficios</h3>
            <ul class="lista-marcada">
              @for (b of t.beneficios; track b) { <li>{{ b }}</li> }
            </ul>

            <h3 style="margin-top:40px">Recomendaciones posteriores</h3>
            <ul class="lista-marcada lista-marcada--sobria">
              @for (r of t.recomendaciones; track r) { <li>{{ r }}</li> }
            </ul>
          </div>

          <aside class="detalle__aside">
            <div class="panel" style="margin-top:24px">
              <h4>Antes de tu cita</h4>
              <p class="aviso">
                Llega 10 minutos antes, sin maquillaje si es un tratamiento facial, y avísanos
                si estás usando ácidos, retinol o algún medicamento fotosensibilizante.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section class="seccion seccion--rosa">
        <div class="contenedor">
          <div class="encabezado-seccion">
            <span class="eyebrow">También te puede interesar</span>
            <h2>Otros tratamientos</h2>
            <div class="filete"></div>
          </div>
          <div class="grid grid-3">
            @for (o of relacionados(); track o.id) {
              <article class="tarjeta-trat">
                <a [routerLink]="['/tratamientos', o.id]" class="tarjeta-trat__imagen">
                  <img class="img-cobertura" [src]="o.imagen" [alt]="o.nombre">
                </a>
                <div class="tarjeta-trat__cuerpo">
                  <h3>{{ o.nombre }}</h3>
                  <p>{{ o.resumen }}</p>
                  <div class="tarjeta-trat__pie">
                    <div class="precio"><span class="precio__actual">{{ soles(o.precio) }}</span></div>
                    <a [routerLink]="['/tratamientos', o.id]" class="enlace-flecha">Ver detalle</a>
                  </div>
                </div>
              </article>
            }
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    .detalle { padding: 56px 0 0; }
    .detalle__grid { display: grid; grid-template-columns: 1fr 1.05fr; gap: 64px; align-items: center; }
    .volver-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
      color: var(--vino);
      font-size: .94rem;
      font-weight: 600;
    }
    .volver-link:hover { color: var(--magenta); }
    .detalle__imagen { margin: 0; border-radius: var(--radio-lg); overflow: hidden; }
    .detalle__imagen img { width: 100%; aspect-ratio: 4/3; object-fit: cover; }
    .detalle__precio { display: flex; align-items: baseline; gap: 12px; margin: 26px 0; }
    .detalle__monto {
      font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2.6rem;
      color: var(--vino); font-weight: 600;
    }
    .detalle__nota { font-size: .9rem; color: var(--gris-claro); letter-spacing: .1em; text-transform: uppercase; }
    .detalle__datos {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
      padding: 22px 0; border-top: 1px solid var(--linea); border-bottom: 1px solid var(--linea);
      margin-bottom: 30px;
    }
    .detalle__acciones { display: flex; gap: 14px; flex-wrap: wrap; }
    .detalle__contenido { display: grid; grid-template-columns: 1.5fr 1fr; gap: 64px; align-items: start; }
    .lista-marcada { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
    .lista-marcada li { position: relative; padding-left: 26px; color: var(--gris); }
    .lista-marcada li::before {
      content: ''; position: absolute; left: 0; top: 11px;
      width: 8px; height: 8px; border-radius: 50%; background: var(--magenta-300);
    }
    .lista-marcada--sobria li::before { background: var(--linea); }
    @media (max-width: 960px) {
      .detalle__grid, .detalle__contenido { grid-template-columns: 1fr; gap: 36px; }
      .detalle__datos { grid-template-columns: 1fr; }
    }
  `]
})
export class TratamientoDetalleComponent {
  private ruta = inject(ActivatedRoute);
  private parametros = toSignal(this.ruta.paramMap, { initialValue: this.ruta.snapshot.paramMap });

  soles = soles;
  tratamiento = computed(() =>
    tratamientoPorId(Number(this.parametros().get('id'))) ?? TRATAMIENTOS[0]
  );
  relacionados = computed(() => TRATAMIENTOS.filter(t => t.id !== this.tratamiento().id).slice(0, 3));
}
