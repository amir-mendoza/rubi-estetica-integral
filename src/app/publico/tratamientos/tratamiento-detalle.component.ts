import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TRATAMIENTOS, soles, tratamientoPorId } from '../../data/datos';
import { GaleriaTratamientoComponent } from '../../compartido/galeria-tratamiento.component';
import { RedesEnlacesComponent } from '../../compartido/redes-enlaces.component';
import { MediaTratamientosService } from '../../compartido/media-tratamientos.service';
import { RedesService } from '../../compartido/redes.service';

@Component({
  selector: 'app-tratamiento-detalle',
  standalone: true,
  imports: [RouterLink, GaleriaTratamientoComponent, RedesEnlacesComponent],
  template: `
    @if (tratamiento(); as t) {
      <section class="detalle">
        <div class="contenedor">
          <div class="detalle__navegacion">
            <a routerLink="/tratamientos" class="volver-link">← Volver a tratamientos</a>
            <div class="miga">
              <a routerLink="/">Inicio</a> / <a routerLink="/tratamientos">Tratamientos</a> / {{ t.nombre }}
            </div>
          </div>

          <div class="detalle__grid">
            <div class="detalle__media">
              <app-galeria-tratamiento
                [video]="media().video"
                [videoPoster]="media().videoPoster"
                [imagenes]="imagenes()"
                [tiktokUrl]="media().tiktokUrl"
                [titulo]="t.nombre"
              />
            </div>
            <div class="detalle__info">
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
                @if (redes.whatsapp()) {
                  <a [href]="redes.whatsapp()" target="_blank" rel="noopener" class="btn btn--linea">Consultar por WhatsApp</a>
                }
              </div>

              @if (redes.activas().length) {
                <div class="detalle__redes">
                  <span>Míralo en nuestras redes</span>
                  <app-redes-enlaces />
                </div>
              }
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
            <div class="panel">
              <h4>Síguenos</h4>
              <p class="aviso">Publicamos cada tratamiento en nuestras redes.</p>
              <app-redes-enlaces [conTexto]="true" />
            </div>
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
          <div class="grid grid-3 catalogo-compacto catalogo-tratamientos">
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .detalle { padding: 56px 0 0; }
    .detalle__navegacion {
      display: grid;
      gap: 8px;
      margin-bottom: 24px;
    }
    .detalle__navegacion .miga {
      margin-bottom: 0;
      overflow-wrap: anywhere;
    }
    .detalle__grid { display: grid; grid-template-columns: 1fr 1.05fr; gap: 64px; align-items: center; }
    .detalle__info { min-width: 0; }
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
    .detalle__media { min-width: 0; }
    .detalle__redes {
      display: flex; align-items: center; flex-wrap: wrap; gap: 14px;
      margin-top: 26px; padding-top: 22px; border-top: 1px solid var(--linea); min-width: 0;
    }
    .detalle__redes > span {
      font-size: .82rem; letter-spacing: .16em; text-transform: uppercase; color: var(--gris-claro);
    }
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
      .detalle { padding-top: 34px; }
      .detalle__navegacion { margin-bottom: 18px; }
      .detalle__grid {
        grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
        gap: 32px;
        align-items: start;
      }
      .detalle__contenido { grid-template-columns: 1fr; gap: 36px; }
      .detalle__datos { grid-template-columns: 1fr; }
      .detalle__info h1 { font-size: 2.45rem; }
    }
    @media (max-width: 700px) {
      .detalle__grid { grid-template-columns: 1fr; gap: 24px; }
    }
    @media (max-width: 640px) {
      .detalle { padding-top: 28px; }
      .detalle__navegacion .miga {
        font-size: .78rem;
        line-height: 1.7;
        letter-spacing: .12em;
      }
      .detalle__info h1 { font-size: 2.15rem; }
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

  readonly redes = inject(RedesService);
  private mediaTratamientos = inject(MediaTratamientosService);

  media = computed(() => this.mediaTratamientos.media(this.tratamiento()));
  imagenes = computed(() => [this.tratamiento().imagen, ...this.media().galeria]);
}
