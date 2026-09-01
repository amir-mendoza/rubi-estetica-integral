import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';

type TipoRegistro = 'reclamo' | 'queja';

@Component({
  selector: 'app-libro-reclamaciones',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <div class="miga"><a routerLink="/">Inicio</a> / Libro de reclamaciones</div>
        <h1>Libro de reclamaciones</h1>
        <p>Registra aquí un reclamo o una queja sobre nuestros servicios, productos o atención.</p>
      </div>
    </section>

    <section class="seccion libro">
      <div class="contenedor libro__encabezado">
        <div>
          <span class="eyebrow">Registro virtual</span>
          <h2>Cuéntanos lo ocurrido</h2>
          <p>Completa la información con claridad. Al confirmar, recibirás una constancia con código, fecha y hora para hacer seguimiento a tu caso.</p>
        </div>
        <a routerLink="/legal/libro-reclamaciones" class="btn btn--linea btn--sm">Conoce cómo funciona</a>
      </div>

      @if (!revisando()) {
        <form #formulario="ngForm" class="contenedor libro__formulario panel" novalidate (ngSubmit)="revisar(formulario)">
          <fieldset>
            <legend><span>1</span> Datos de la persona reclamante</legend>
            <p class="libro__ayuda">Esta información permite identificar el caso y enviar la constancia o respuesta.</p>

            <div class="libro__campos libro__campos--dos">
              <div class="campo">
                <label for="tipoDocumento">Tipo de documento</label>
                <select id="tipoDocumento" name="tipoDocumento" [(ngModel)]="tipoDocumento" required>
                  <option value="DNI">DNI</option>
                  <option value="CE">Carné de extranjería</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>
              <div class="campo">
                <label for="numeroDocumento">Número de documento</label>
                <input id="numeroDocumento" name="numeroDocumento" [(ngModel)]="numeroDocumento" required maxlength="16" autocomplete="off" />
              </div>
              <div class="campo">
                <label for="nombres">Nombres</label>
                <input id="nombres" name="nombres" [(ngModel)]="nombres" required autocomplete="given-name" />
              </div>
              <div class="campo">
                <label for="apellidos">Apellidos</label>
                <input id="apellidos" name="apellidos" [(ngModel)]="apellidos" required autocomplete="family-name" />
              </div>
              <div class="campo libro__campo-amplio">
                <label for="domicilio">Domicilio</label>
                <input id="domicilio" name="domicilio" [(ngModel)]="domicilio" required autocomplete="street-address" placeholder="Dirección donde reside" />
              </div>
              <div class="campo">
                <label for="telefono">Teléfono</label>
                <input id="telefono" name="telefono" [(ngModel)]="telefono" type="tel" autocomplete="tel" placeholder="Ej. 987 654 321" />
              </div>
              <div class="campo">
                <label for="correo">Correo electrónico</label>
                <input id="correo" name="correo" [(ngModel)]="correo" type="email" autocomplete="email" placeholder="correo@ejemplo.com" />
              </div>
            </div>
            <p class="campo__ayuda">Indica al menos un teléfono o un correo. Si registras un correo, allí se enviará la constancia automáticamente.</p>
          </fieldset>

          <fieldset>
            <legend><span>2</span> Información del caso</legend>
            <p class="libro__ayuda">Selecciona el canal o sede vinculada y describe el producto o servicio involucrado.</p>

            <div class="libro__campos libro__campos--dos">
              <div class="campo">
                <label for="sede">Sede o canal involucrado</label>
                <select id="sede" name="sede" [(ngModel)]="sede" required>
                  <option value="" disabled>Selecciona una opción</option>
                  <option value="Sede Las Flores 1522">Sede Las Flores 1522</option>
                  <option value="Sede Las Flores 1544">Sede Las Flores 1544</option>
                  <option value="Página web">Página web</option>
                </select>
              </div>
              <div class="campo">
                <label for="fechaIncidente">Fecha aproximada de lo ocurrido</label>
                <input id="fechaIncidente" name="fechaIncidente" [(ngModel)]="fechaIncidente" type="date" required />
              </div>
              <div class="campo">
                <label for="bien">Bien contratado</label>
                <select id="bien" name="bien" [(ngModel)]="bien" required>
                  <option value="Servicio">Servicio o tratamiento</option>
                  <option value="Producto">Producto</option>
                </select>
              </div>
              <div class="campo">
                <label for="monto">Monto involucrado (S/)</label>
                <input id="monto" name="monto" [(ngModel)]="monto" type="number" min="0" step="0.01" placeholder="Opcional" />
              </div>
              <div class="campo libro__campo-amplio">
                <label for="descripcionBien">Nombre o descripción del {{ bien === 'Producto' ? 'producto' : 'servicio' }}</label>
                <input id="descripcionBien" name="descripcionBien" [(ngModel)]="descripcionBien" required placeholder="Ej. Limpieza facial profunda, sérum, reserva de cita" />
              </div>
              <div class="campo libro__campo-amplio">
                <label for="motivo">Motivo (opcional)</label>
                <select id="motivo" name="motivo" [(ngModel)]="motivo">
                  <option value="">Selecciona si te ayuda a describir el caso</option>
                  <option value="Atención recibida">Atención recibida</option>
                  <option value="Reserva o reprogramación">Reserva o reprogramación</option>
                  <option value="Tratamiento o servicio">Tratamiento o servicio</option>
                  <option value="Producto adquirido">Producto adquirido</option>
                  <option value="Cobro o pago">Cobro o pago</option>
                  <option value="Promoción, precio o información">Promoción, precio o información</option>
                  <option value="Comprobante de pago">Comprobante de pago</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend><span>3</span> Reclamo o queja</legend>
            <div class="libro__tipos" role="radiogroup" aria-label="Tipo de registro">
              <label [class.activo]="tipo() === 'reclamo'">
                <input type="radio" name="tipo" [checked]="tipo() === 'reclamo'" (change)="tipo.set('reclamo')" />
                <span><strong>Reclamo</strong> Disconformidad con un producto o servicio recibido.</span>
              </label>
              <label [class.activo]="tipo() === 'queja'">
                <input type="radio" name="tipo" [checked]="tipo() === 'queja'" (change)="tipo.set('queja')" />
                <span><strong>Queja</strong> Malestar por la atención recibida, sin relación directa con el producto o servicio.</span>
              </label>
            </div>

            <div class="libro__campos">
              <div class="campo">
                <label for="detalle">Detalle de {{ tipo() === 'reclamo' ? 'tu reclamo' : 'tu queja' }}</label>
                <textarea id="detalle" name="detalle" [(ngModel)]="detalle" required minlength="20" rows="6" placeholder="Describe qué ocurrió, cuándo y cómo te afectó."></textarea>
                <span class="campo__ayuda">Incluye los datos que ayuden a identificar la atención, compra o situación.</span>
              </div>
              <div class="campo">
                <label for="pedido">Pedido de la persona usuaria</label>
                <textarea id="pedido" name="pedido" [(ngModel)]="pedido" required minlength="10" rows="4" placeholder="Indica qué solución solicitas."></textarea>
              </div>
              <div class="campo">
                <label for="evidencia">Evidencia (opcional)</label>
                <input id="evidencia" name="evidencia" type="file" accept=".pdf,.jpg,.jpeg,.png" (change)="seleccionarEvidencia($event)" />
                <span class="campo__ayuda">Puedes adjuntar voucher, comprobante, fotos o capturas. La evidencia ayuda a revisar el caso, pero no es obligatoria.</span>
                @if (nombreEvidencia()) { <span class="libro__archivo">Archivo seleccionado: {{ nombreEvidencia() }}</span> }
              </div>
            </div>
          </fieldset>

          <input class="libro__trampa" type="text" name="sitioWeb" [(ngModel)]="sitioWeb" tabindex="-1" autocomplete="off" aria-hidden="true" />

          @if (mensaje()) {
            <div class="aviso aviso--error" role="alert">{{ mensaje() }}</div>
          }

          <div class="libro__acciones">
            <p>La información será tratada conforme a nuestra <a routerLink="/legal/privacidad">Política de privacidad</a>.</p>
            <button class="btn btn--primario" type="submit">Revisar información</button>
          </div>
        </form>
      } @else {
        <section class="contenedor libro__revision panel">
          <span class="eyebrow">Revisa antes de enviar</span>
          <h2>Confirma que la información sea correcta</h2>
          <p>El código correlativo, la fecha y la hora se asignarán al confirmar el registro.</p>

          <dl class="libro__resumen">
            <div><dt>Tipo</dt><dd>{{ tipo() === 'reclamo' ? 'Reclamo' : 'Queja' }}</dd></div>
            <div><dt>Sede o canal</dt><dd>{{ sede }}</dd></div>
            <div><dt>Persona reclamante</dt><dd>{{ nombres }} {{ apellidos }}</dd></div>
            <div><dt>Documento</dt><dd>{{ tipoDocumento }} {{ numeroDocumento }}</dd></div>
            <div><dt>Bien contratado</dt><dd>{{ bien }}: {{ descripcionBien }}</dd></div>
            <div><dt>Pedido</dt><dd>{{ pedido }}</dd></div>
          </dl>

          <div class="aviso">
            El envío definitivo, la generación del PDF y el correo de constancia se activarán al conectar el servidor seguro. Esta vista no registra ni almacena datos personales en el navegador.
          </div>

          <div class="libro__acciones libro__acciones--revision">
            <button class="btn btn--linea" type="button" (click)="revisando.set(false)">Volver a editar</button>
            <button class="btn btn--primario" type="button" disabled title="Disponible al activar el servidor seguro">Confirmar y enviar</button>
          </div>
        </section>
      }
    </section>
  `,
  styles: [`
    .libro { padding-top: 0; }
    .libro__encabezado { display: flex; justify-content: space-between; align-items: end; gap: 24px; margin-bottom: 28px; }
    .libro__encabezado h2 { margin: 8px 0 10px; }
    .libro__encabezado p { max-width: 700px; }
    .libro__formulario, .libro__revision { max-width: 940px; padding: clamp(24px, 4vw, 44px); }
    fieldset { margin: 0; padding: 0 0 32px; border: 0; }
    fieldset + fieldset { padding-top: 30px; border-top: 1px solid var(--linea); }
    fieldset:last-of-type { padding-bottom: 16px; }
    legend { display: flex; align-items: center; gap: 10px; color: var(--vino); font-family: var(--fuente-titulos); font-size: 1.45rem; }
    legend span { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--magenta); color: #fff; font-family: var(--fuente); font-size: .85rem; }
    .libro__ayuda { margin: 10px 0 20px; color: var(--gris); }
    .libro__campos { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0 18px; }
    .libro__campos--dos { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .libro__campo-amplio { grid-column: 1 / -1; }
    .libro__tipos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 18px 0 24px; }
    .libro__tipos label { display: flex; gap: 12px; padding: 16px; border: 1px solid var(--linea); background: #fff; cursor: pointer; }
    .libro__tipos label.activo { border-color: var(--magenta); background: var(--rosa-50); }
    .libro__tipos input { width: 18px; height: 18px; margin-top: 3px; accent-color: var(--magenta); }
    .libro__tipos span { display: grid; gap: 5px; color: var(--gris); font-size: .92rem; }
    .libro__tipos strong { color: var(--vino); font-size: 1rem; }
    .libro__archivo { display: block; margin-top: 8px; color: var(--vino); font-size: .88rem; }
    .libro__trampa { position: absolute; left: -10000px; width: 1px; height: 1px; opacity: 0; }
    .libro__acciones { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding-top: 22px; border-top: 1px solid var(--linea); }
    .libro__acciones p { margin: 0; font-size: .9rem; }
    .libro__acciones a { color: var(--vino); text-decoration: underline; }
    .libro__resumen { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0; margin: 26px 0; border: 1px solid var(--linea); }
    .libro__resumen div { padding: 16px; border-bottom: 1px solid var(--linea); }
    .libro__resumen div:nth-child(odd) { border-right: 1px solid var(--linea); }
    .libro__resumen div:nth-last-child(-n + 2) { border-bottom: 0; }
    .libro__resumen dt { margin-bottom: 5px; color: var(--gris-claro); font-size: .78rem; letter-spacing: .08em; text-transform: uppercase; }
    .libro__resumen dd { margin: 0; color: var(--tinta); }
    .libro__acciones--revision { margin-top: 22px; }
    @media (max-width: 680px) {
      .libro__encabezado, .libro__acciones { align-items: stretch; flex-direction: column; }
      .libro__encabezado .btn, .libro__acciones .btn { width: 100%; }
      .libro__campos--dos, .libro__tipos, .libro__resumen { grid-template-columns: 1fr; }
      .libro__resumen div:nth-child(odd) { border-right: 0; }
      .libro__resumen div:nth-last-child(2) { border-bottom: 1px solid var(--linea); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibroReclamacionesComponent {
  readonly tipo = signal<TipoRegistro>('reclamo');
  readonly revisando = signal(false);
  readonly mensaje = signal('');
  readonly nombreEvidencia = signal('');

  tipoDocumento = 'DNI';
  numeroDocumento = '';
  nombres = '';
  apellidos = '';
  domicilio = '';
  telefono = '';
  correo = '';
  sede = '';
  fechaIncidente = '';
  bien = 'Servicio';
  monto: number | null = null;
  descripcionBien = '';
  motivo = '';
  detalle = '';
  pedido = '';
  sitioWeb = '';

  seleccionarEvidencia(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    this.nombreEvidencia.set(entrada.files?.[0]?.name ?? '');
  }

  revisar(formulario: NgForm): void {
    if (this.sitioWeb) {
      this.mensaje.set('No fue posible procesar el registro. Inténtalo nuevamente.');
      return;
    }

    if (!this.telefono.trim() && !this.correo.trim()) {
      this.mensaje.set('Indica al menos un teléfono o un correo electrónico para poder responderte.');
      return;
    }

    if (formulario.invalid) {
      const pendientes = this.camposPendientes(formulario);
      this.mensaje.set(`Completa o corrige: ${pendientes.join(', ')}.`);
      formulario.control.markAllAsTouched();
      return;
    }

    this.mensaje.set('');
    this.revisando.set(true);
  }

  private camposPendientes(formulario: NgForm): string[] {
    const etiquetas: Record<string, string> = {
      tipoDocumento: 'tipo de documento',
      numeroDocumento: 'número de documento',
      nombres: 'nombres',
      apellidos: 'apellidos',
      domicilio: 'domicilio',
      correo: 'correo electrónico válido',
      sede: 'sede o canal involucrado',
      fechaIncidente: 'fecha aproximada de lo ocurrido',
      bien: 'bien contratado',
      descripcionBien: 'nombre o descripción del producto o servicio',
      detalle: 'detalle del reclamo o queja',
      pedido: 'pedido de la persona usuaria'
    };

    return Object.entries(formulario.controls)
      .filter(([, control]) => control.invalid)
      .map(([nombre]) => etiquetas[nombre] ?? nombre);
  }
}
