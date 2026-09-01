import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

type DocumentoLegal = 'terminos' | 'privacidad' | 'cookies' | 'libro-reclamaciones';

interface BloqueLegal {
  titulo: string;
  parrafos: string[];
}

interface PaginaLegal {
  id: DocumentoLegal;
  titulo: string;
  subtitulo: string;
  introduccion: string;
  actualizado: string;
  bloques: BloqueLegal[];
}

const EMPRESA = 'RUBI ESTETICA INTEGRAL E.I.R.L.';
const MARCA = 'Rubí Estética Integral';
const RUC = '20614999544';

const PAGINAS: PaginaLegal[] = [
  {
    id: 'terminos',
    titulo: 'Términos y condiciones',
    subtitulo: 'Reglas generales para reservas, pagos, tratamientos, promociones, productos y atención en nuestras sedes.',
    introduccion: 'Este documento explica de forma simple cómo funcionan las reservas, los pagos, los cambios de cita, las promociones y el recojo de productos. Al usar la web o confirmar una reserva, la persona usuaria acepta estas condiciones.',
    actualizado: '31 de agosto de 2026',
    bloques: [
      { titulo: 'Identificación del negocio', parrafos: [`${MARCA} opera bajo la razón social ${EMPRESA}, con RUC ${RUC}. La atención se realiza en nuestras sedes ubicadas en Av. Las Flores de Primavera 1522, 051, San Juan de Lurigancho 15404, Lima; y Av. Las Flores de Primavera 1544, San Juan de Lurigancho 15408, Lima.`] },
      { titulo: 'Reservas y adelantos', parrafos: ['Toda reserva requiere un adelanto obligatorio o el pago completo del servicio. El adelanto mínimo vigente es de 30 % del total, salvo que la configuración de la web o una promoción vigente indique otra condición.', 'La reserva confirma un horario de llegada al local. La cabina y la especialista se asignan según disponibilidad operativa al momento de la atención.'] },
      { titulo: 'Reprogramaciones, tardanzas y no asistencia', parrafos: ['La paciente puede solicitar la reprogramación de su cita con al menos un día de anticipación. Se intentará asignar una nueva fecha según disponibilidad de agenda, sedes y cabinas.', 'Si la paciente llega tarde, será atendida lo antes posible según disponibilidad. Si las cabinas están ocupadas, deberá esperar hasta que exista un espacio compatible con la duración de su tratamiento.', 'Si la paciente no asiste, el adelanto no será devuelto, debido a que el horario reservado dejó de estar disponible para otras pacientes. Esta condición se aplica sin perjuicio de los derechos que reconozca la normativa vigente.'] },
      { titulo: 'Cambios de tratamiento y evaluaciones', parrafos: ['Los cambios de tratamiento deben solicitarse preferentemente con dos días de anticipación, y como mínimo con un día de anticipación. No se garantizan cambios solicitados pocas horas antes de la cita.', 'Algunos tratamientos pueden requerir evaluación previa, preguntas sobre alergias, tipo de piel, condiciones particulares o contraindicaciones. Por seguridad de la paciente, el local puede postergar o no realizar un procedimiento cuando exista un riesgo razonable.'] },
      { titulo: 'Pagos y promociones', parrafos: ['Se aceptan pagos en efectivo, Yape, Plin, tarjeta y los medios habilitados mediante Izipay. El pago online puede corresponder al adelanto o al total del servicio.', 'Las promociones pueden tener vigencia limitada. Cada promoción indicará sus condiciones, precio, fecha de vencimiento o si se mantiene como promoción permanente. Las promociones no se combinan con otros descuentos salvo comunicación expresa del negocio.', 'El precio aceptado al momento de reservar no se modifica para esa reserva confirmada, salvo que la paciente solicite cambiar el tratamiento y exista diferencia de precio.'] },
      { titulo: 'Productos', parrafos: ['Los productos se entregan únicamente mediante recojo en tienda física. No se realiza delivery.', 'La clienta puede revisar el producto al momento de la entrega. Si detecta una falla, podrá comunicarlo dentro de 24 a 48 horas para evaluación y búsqueda de una solución según el caso.'] },
      { titulo: 'Libro de reclamaciones', parrafos: ['El Libro de Reclamaciones se encuentra disponible de forma física y virtual. Para registrar un reclamo relacionado con un servicio o producto, se podrá solicitar información que permita identificar la atención, compra, fecha, sede y comprobante correspondiente. La ausencia de un comprobante no impide registrar el reclamo o la queja.'] }
    ]
  },
  {
    id: 'privacidad',
    titulo: 'Política de privacidad',
    subtitulo: 'Información clara sobre qué datos se recopilan, para qué se usan y quiénes pueden acceder a ellos.',
    introduccion: 'Aquí explicamos qué datos personales se solicitan al reservar o recibir atención, por qué son necesarios y cómo se cuidan. La información se usa para brindar el servicio y no se vende ni se comparte para fines ajenos al negocio.',
    actualizado: '31 de agosto de 2026',
    bloques: [
      { titulo: 'Responsable del tratamiento', parrafos: [`El responsable del tratamiento de datos personales es ${EMPRESA}, con RUC ${RUC}, bajo el nombre comercial ${MARCA}.`] },
      { titulo: 'Datos que podemos recopilar', parrafos: ['Podemos solicitar nombre, apellidos, DNI, celular, correo electrónico opcional, fecha de nacimiento, datos de reserva, sede seleccionada, tratamientos, productos, pagos, observaciones necesarias para la atención y el historial de tratamientos realizados.'] },
      { titulo: 'Finalidades del uso de datos', parrafos: ['Los datos se utilizan para registrar y gestionar reservas, identificar a la paciente, confirmar pagos, ubicar su historial, dar seguimiento a tratamientos de una o varias sesiones, atender consultas, validar reclamos y mantener una atención ordenada en nuestras sedes.', 'El DNI se solicita para identificar de forma precisa a la paciente y evitar confusiones entre personas con nombres similares.'] },
      { titulo: 'Acceso interno a la información', parrafos: ['El acceso a los datos estará limitado al administrador y al personal autorizado que necesite la información para registrar citas, atender pacientes, gestionar pagos, revisar historiales o realizar seguimiento de tratamientos.', 'Las personas autorizadas deberán usar la información solo para fines operativos del negocio y atención de pacientes.'] },
      { titulo: 'Datos sensibles y cuidado del paciente', parrafos: ['Cuando sea necesario para la seguridad del tratamiento, se podrán registrar observaciones sobre alergias, tipo de piel, contraindicaciones, recomendaciones o antecedentes relevantes para la atención estética. Esta información se utiliza únicamente para brindar una atención más segura y adecuada.'] },
      { titulo: 'Promociones y comunicaciones', parrafos: ['Actualmente no se enviarán promociones automáticas por correo o celular. Si en el futuro el negocio habilita comunicaciones promocionales, se solicitará autorización expresa mediante una casilla de aceptación u otro mecanismo equivalente.'] },
      { titulo: 'Terceros necesarios para operar', parrafos: ['No vendemos ni cedemos datos personales con fines externos. Algunos datos pueden ser tratados por proveedores necesarios para operar la web, como hosting, mensajería, WhatsApp, correo, pasarela de pago Izipay u otros servicios tecnológicos vinculados a la reserva, pago o atención.'] },
      { titulo: 'Seguridad y conservación', parrafos: ['La plataforma implementará acceso por roles, contraseñas cifradas, base de datos privada, conexión segura, copias de seguridad y permisos limitados según el cargo o función.', 'Los datos se conservarán mientras sean necesarios para la relación con la paciente, historial de atención, obligaciones del negocio, reclamos o solicitudes posteriores.'] },
      { titulo: 'Derechos de la persona titular', parrafos: ['La paciente puede solicitar acceso, rectificación, actualización o eliminación de sus datos cuando corresponda. El canal de atención para estas solicitudes será informado por el negocio mediante WhatsApp, correo oficial o el medio que se configure en la web.'] }
    ]
  },
  {
    id: 'cookies',
    titulo: 'Política de cookies',
    subtitulo: 'Uso de almacenamiento del navegador para recordar preferencias y mantener una experiencia segura.',
    introduccion: 'Las cookies son pequeños datos que la web guarda en el navegador para recordar acciones básicas, como una sesión iniciada o la aceptación del aviso de cookies. En esta etapa no usamos cookies publicitarias ni herramientas para seguir la navegación fuera de la web.',
    actualizado: '31 de agosto de 2026',
    bloques: [
      { titulo: 'Qué son las cookies', parrafos: ['Las cookies y tecnologías similares permiten que una página recuerde información básica del navegador, como preferencias, sesión o configuraciones necesarias para que algunas funciones trabajen correctamente.'] },
      { titulo: 'Qué usamos en esta web', parrafos: ['Esta web puede usar almacenamiento técnico para recordar la aceptación de cookies, mantener una sesión iniciada, conservar temporalmente un proceso de reserva y mejorar la continuidad de navegación.', 'No utilizamos cookies de publicidad, análisis avanzado, Meta Pixel, TikTok Pixel ni Google Analytics en esta etapa.'] },
      { titulo: 'Cookies necesarias', parrafos: ['Las cookies necesarias permiten funciones básicas como sesión, seguridad, carrito, reserva temporal y preferencias del usuario. Sin ellas, algunas partes de la web pueden no funcionar correctamente.'] },
      { titulo: 'Preferencias', parrafos: ['El usuario puede aceptar el aviso de cookies desde el banner. Si en el futuro se agregan cookies de publicidad o analítica, la web deberá permitir aceptar o rechazar ese uso adicional.'] }
    ]
  },
  {
    id: 'libro-reclamaciones',
    titulo: 'Libro de reclamaciones',
    subtitulo: 'Canal para registrar reclamos o quejas vinculadas a servicios, productos o atención recibida.',
    introduccion: 'Este canal permite registrar un reclamo o una queja sobre un producto, tratamiento o atención recibida. Su uso es gratuito y busca que la empresa revise el caso y responda por el medio de contacto indicado.',
    actualizado: '31 de agosto de 2026',
    bloques: [
      { titulo: 'Disponibilidad', parrafos: ['El Libro de Reclamaciones estará disponible en formato físico y virtual para las personas que hayan adquirido un producto o servicio en Rubí Estética Integral. El registro de un reclamo o una queja es gratuito.'] },
      { titulo: 'Información necesaria', parrafos: ['Para registrar y atender un reclamo, se solicitará la identificación y los datos de contacto de la persona, una descripción del producto o servicio, sede, fecha y detalle de lo ocurrido. El comprobante, código de reserva o evidencia puede ayudar a revisar el caso, pero no es un requisito para presentar el reclamo.'] },
      { titulo: 'Numeración de la hoja virtual', parrafos: ['La fecha se registra en el campo FECHA. El campo N° corresponde a un código correlativo asignado por el sistema, no a la fecha. La primera hoja virtual de 2026 será N° 000000001-2026; la siguiente será N° 000000002-2026, y así sucesivamente.', 'La numeración debe ser única y no debe repetirse. Cuando el Libro Virtual esté conectado al servidor, el sistema generará este código de forma automática y entregará una constancia a la persona reclamante.'] },
      { titulo: 'Atención del reclamo', parrafos: ['El negocio revisará la información presentada y responderá por el canal indicado por la persona usuaria en un plazo máximo de quince (15) días hábiles, sin prórroga. La atención del reclamo no está condicionada a pago alguno.'] }
    ]
  }
];

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <div class="miga"><a routerLink="/">Inicio</a> / Información legal</div>
        <h1>Información legal</h1>
        <p>Documentos principales para usar la web, reservar citas y conocer el tratamiento de datos personales.</p>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor legal">
        <aside class="legal__menu">
          <span class="legal__menu-titulo">Información legal</span>
          @for (item of paginas; track item.id) {
            <a [routerLink]="['/legal', item.id]" [class.activo]="pagina().id === item.id">{{ item.titulo }}</a>
          }
        </aside>

        <article class="legal__contenido panel">
          <span class="eyebrow">Rubí Estética Integral</span>
          <h2>{{ pagina().titulo }}</h2>
          <p class="lead">{{ pagina().subtitulo }}</p>
          <div class="legal__introduccion">
            <strong>¿Para qué sirve este documento?</strong>
            <p>{{ pagina().introduccion }}</p>
          </div>
          <p class="legal__fecha">Última actualización: {{ pagina().actualizado }}</p>

          @for (bloque of pagina().bloques; track bloque.titulo; let i = $index) {
            <details class="legal__bloque">
              <summary>
                <span>{{ i + 1 }}. {{ bloque.titulo }}</span>
                <span class="legal__indicador" aria-hidden="true"></span>
              </summary>
              <div class="legal__bloque-contenido">
                @for (parrafo of bloque.parrafos; track parrafo) {
                  <p>{{ parrafo }}</p>
                }
              </div>
            </details>
          }

          @if (pagina().id === 'libro-reclamaciones') {
            <section class="libro-virtual">
              <figure class="libro-virtual__aviso">
                <img src="/img/aviso-libro-reclamaciones-virtual.png" alt="Aviso oficial del Libro de Reclamaciones Virtual" />
                <figcaption>Aviso oficial del Libro de Reclamaciones Virtual.</figcaption>
              </figure>

              <div class="libro-virtual__detalle">
                <span class="eyebrow">Registro virtual</span>
                <h3>Tu constancia tendrá un código único</h3>
                <p>Al enviar un reclamo o una queja, la plataforma asignará una fecha, hora y número correlativo de manera automática. Así se podrá identificar y hacer seguimiento al caso.</p>
                <div class="libro-virtual__codigo">
                  <span>Ejemplo de primera hoja virtual</span>
                  <strong>N° 000000001-2026</strong>
                </div>
                <p class="legal__nota">El formulario de envío se conectará al servidor seguro antes de publicar la web. No se usarán datos reales ni se guardarán reclamos solamente en el navegador.</p>
                <a routerLink="/libro-reclamaciones" class="btn btn--primario btn--sm">Ir al Libro de Reclamaciones</a>
              </div>
            </section>
          }

          <div class="aviso">
            Estos textos son una base operativa para la web. La versión final debe validarse con la información oficial del negocio y, de ser necesario, con asesoría legal.
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .legal { display: grid; grid-template-columns: minmax(220px, 280px) minmax(0, 1fr); gap: 32px; align-items: start; }
    .legal__menu { position: sticky; top: calc(var(--header-h) + 24px); display: grid; gap: 4px; padding: 18px; border: 1px solid var(--linea); border-radius: var(--radio-lg); background: rgba(255,255,255,.88); }
    .legal__menu-titulo { padding: 0 10px 12px; border-bottom: 1px solid var(--linea); color: var(--tinta); font-size: .92rem; font-weight: 600; }
    .legal__menu a { padding: 12px 10px; border-left: 3px solid transparent; color: var(--gris); font-size: .96rem; }
    .legal__menu a:hover, .legal__menu a.activo { border-left-color: var(--magenta); background: var(--rosa-50); color: var(--vino); }
    .legal__contenido { padding: clamp(24px, 4vw, 44px); }
    .legal__contenido h2 { margin-bottom: 10px; }
    .legal__introduccion { margin-top: 24px; padding: 18px 20px; border: 1px solid var(--linea); border-left: 4px solid var(--magenta); background: var(--rosa-50); }
    .legal__introduccion strong { color: var(--vino); font-size: 1rem; }
    .legal__introduccion p { margin: 8px 0 0; }
    .legal__fecha { margin: 18px 0 28px; color: var(--gris-claro); font-size: .92rem; }
    .legal__bloque { border-top: 1px solid var(--linea); }
    .legal__bloque:last-of-type { border-bottom: 1px solid var(--linea); }
    .legal__bloque summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 72px; cursor: pointer; color: var(--vino); font-family: var(--fuente-titulos); font-size: clamp(1.05rem, 2vw, 1.3rem); list-style: none; }
    .legal__bloque summary::-webkit-details-marker { display: none; }
    .legal__bloque summary:hover { color: var(--magenta); }
    .legal__indicador { position: relative; flex: 0 0 28px; width: 28px; height: 28px; border: 1px solid var(--linea); border-radius: 50%; }
    .legal__indicador::before, .legal__indicador::after { content: ''; position: absolute; top: 50%; left: 50%; width: 10px; height: 1px; background: currentColor; transform: translate(-50%, -50%); }
    .legal__indicador::after { transform: translate(-50%, -50%) rotate(90deg); transition: transform .2s ease; }
    .legal__bloque[open] .legal__indicador { border-color: var(--magenta); background: var(--magenta); color: white; }
    .legal__bloque[open] .legal__indicador::after { transform: translate(-50%, -50%) rotate(0); }
    .legal__bloque-contenido { padding: 0 48px 24px 0; }
    .legal__bloque-contenido p { margin-bottom: 12px; }
    .libro-virtual { display: grid; grid-template-columns: minmax(180px, 260px) minmax(0, 1fr); gap: 28px; align-items: center; margin-top: 32px; padding: 24px; border: 1px solid var(--linea); background: rgba(255, 255, 255, .72); }
    .libro-virtual__aviso { margin: 0; }
    .libro-virtual__aviso img { display: block; width: 100%; border: 1px solid var(--linea); }
    .libro-virtual__aviso figcaption { margin-top: 8px; color: var(--gris-claro); font-size: .8rem; text-align: center; }
    .libro-virtual__detalle h3 { margin: 8px 0 12px; font-size: 1.5rem; }
    .libro-virtual__codigo { display: grid; gap: 6px; margin: 18px 0; padding: 14px 16px; border-left: 3px solid var(--magenta); background: var(--rosa-50); }
    .libro-virtual__codigo span { color: var(--gris); font-size: .88rem; }
    .libro-virtual__codigo strong { color: var(--vino); font-size: 1.08rem; }
    .legal__nota { color: var(--gris); font-size: .92rem; }
    @media (max-width: 900px) {
      .legal { grid-template-columns: 1fr; }
      .legal__menu { position: static; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .legal__menu-titulo { grid-column: 1 / -1; }
    }
    @media (max-width: 560px) {
      .legal__menu { grid-template-columns: 1fr; }
      .legal__contenido { padding: 20px; }
      .legal__bloque summary { min-height: 64px; font-size: 1.05rem; }
      .legal__bloque-contenido { padding-right: 0; }
      .libro-virtual { grid-template-columns: 1fr; padding: 20px; }
      .libro-virtual__aviso { max-width: 240px; margin: 0 auto; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegalComponent {
  private readonly ruta = inject(ActivatedRoute);
  readonly paginas = PAGINAS;
  private readonly documento = toSignal(
    this.ruta.paramMap.pipe(map(params => params.get('documento') as DocumentoLegal | null)),
    { initialValue: 'terminos' as DocumentoLegal }
  );

  readonly pagina = computed(() => PAGINAS.find(pagina => pagina.id === this.documento()) ?? PAGINAS[0]);
}
