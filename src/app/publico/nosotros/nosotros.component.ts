import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nosotros',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <div class="miga"><a routerLink="/">Inicio</a> / Nosotros</div>
        <h1>Nosotros</h1>
        <p>Un centro de estética integral enfocado en resultados visibles, seguridad y acompañamiento profesional.</p>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor historia">
        <div>
          <span class="eyebrow">Nuestra historia</span>
          <h2>Estética con criterio clínico</h2>
          <div class="filete"></div>
          <p>
            Rubí Estética Integral nació con una idea simple: que un tratamiento estético debe
            sustentarse en un diagnóstico serio, no en promesas. Empezamos con una cabina en
            San Juan de Lurigancho y hoy atendemos en dos sedes con equipos de aparatología
            certificados y un equipo de cosmiatras y médico estético.
          </p>
          <p>
            Nuestra especialidad son los tratamientos faciales y corporales no invasivos:
            reducción de medidas, modelamiento corporal, protocolos de firmeza y rejuvenecimiento
            facial. Cada paciente recibe un plan con número de sesiones, tiempos y cuidados en casa.
          </p>
          <div class="historia__firmas">
            <div>
              <strong>+2 000</strong>
              <span>Pacientes atendidas desde 2019</span>
            </div>
            <div>
              <strong>98 %</strong>
              <span>Pacientes que continúan su protocolo</span>
            </div>
          </div>
        </div>
        <figure class="historia__imagen">
          <img class="img-cobertura" src="img/nosotros.jpg" alt="Sesión de tratamiento facial">
        </figure>
      </div>
    </section>

    <section class="seccion seccion--rosa">
      <div class="contenedor">
        <div class="encabezado-seccion texto-centro">
          <span class="eyebrow">Nuestros principios</span>
          <h2>Cómo trabajamos</h2>
          <div class="filete filete--centro"></div>
        </div>
        <div class="grid grid-3">
          @for (v of valores; track v.titulo) {
            <div class="tarjeta tarjeta--sombra">
              <div class="tarjeta__cuerpo">
                <div class="filete"></div>
                <h4>{{ v.titulo }}</h4>
                <p>{{ v.texto }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor">
        <div class="encabezado-seccion">
          <span class="eyebrow">Bioseguridad</span>
          <h2>Protocolos que cuidan tu salud</h2>
          <div class="filete"></div>
        </div>
        <div class="grid grid-2">
          <ul class="lista-check">
            @for (p of protocolos.slice(0, 4); track p) { <li>{{ p }}</li> }
          </ul>
          <ul class="lista-check">
            @for (p of protocolos.slice(4); track p) { <li>{{ p }}</li> }
          </ul>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    .historia { display: grid; grid-template-columns: 1.05fr 1fr; gap: 72px; align-items: center; }
    .historia__imagen { margin: 0; border-radius: var(--radio-lg); overflow: hidden; }
    .historia__imagen img { width: 100%; aspect-ratio: 4/5; object-fit: cover; }
    .historia__firmas { display: flex; gap: 48px; margin-top: 36px; }
    .historia__firmas div { display: flex; flex-direction: column; gap: 4px; }
    .historia__firmas strong {
      font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2.2rem;
      color: var(--vino); font-weight: 500;
    }
    .historia__firmas span { font-size: .86rem; color: var(--gris-claro); letter-spacing: .06em; }
    .lista-check { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; }
    .lista-check li {
      position: relative; padding-left: 34px; color: var(--gris); font-size: 1rem;
    }
    .lista-check li::before {
      content: ''; position: absolute; left: 0; top: 8px;
      width: 18px; height: 9px; border-left: 1.5px solid var(--magenta);
      border-bottom: 1.5px solid var(--magenta); transform: rotate(-45deg);
    }
    @media (max-width: 960px) { .historia { grid-template-columns: 1fr; gap: 40px; } }
  `]
})
export class NosotrosComponent {
  valores = [
    { titulo: 'Diagnóstico antes que venta', texto: 'Ningún tratamiento se agenda sin una evaluación previa de la piel o de la zona a trabajar.' },
    { titulo: 'Precios claros', texto: 'El precio, la duración y el número de sesiones se informan antes de iniciar el protocolo.' },
    { titulo: 'Tecnología con mantenimiento', texto: 'Los equipos reciben calibración y mantenimiento periódico documentado.' },
    { titulo: 'Historia clínica digital', texto: 'Cada paciente tiene un registro de tratamientos, observaciones y evolución.' },
    { titulo: 'Puntualidad', texto: 'Cada cabina se bloquea con tiempo de preparación y limpieza para respetar tu horario.' },
    { titulo: 'Acompañamiento posterior', texto: 'Indicaciones escritas para casa y seguimiento por WhatsApp después de cada sesión.' }
  ];

  protocolos = [
    'Material descartable de un solo uso en cada sesión',
    'Desinfección de cabina y camilla entre pacientes',
    'Esterilización de instrumental con equipo certificado',
    'Personal capacitado en bioseguridad y primeros auxilios',
    'Evaluación médica previa en procedimientos inyectables',
    'Consentimiento informado firmado por la paciente',
    'Registro de lote y trazabilidad de insumos aplicados',
    'Protocolo de contingencia ante reacciones adversas'
  ];
}
