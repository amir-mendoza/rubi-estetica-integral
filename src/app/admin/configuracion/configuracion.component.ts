import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LOCALES, cabinasDeSede, cupoDeSede } from '../../data/datos';
import { MarcaService } from '../../compartido/marca.service';
import { FondoService } from '../../compartido/fondo.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Configuración</h1>
        <p>Parámetros del negocio, agenda, pagos, usuarios y preparación para la etapa offline.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--vino btn--sm">Guardar cambios</button>
      </div>
    </div>

    <nav class="pestanas">
      @for (t of pestanas; track t) {
        <button [class.activa]="pestana() === t" (click)="pestana.set(t)">{{ t }}</button>
      }
    </nav>

    @if (pestana() === 'Negocio') {
      <div class="grid-config">
        <div class="panel">
          <h4>Datos del negocio</h4>
          <div class="campo"><label>Nombre comercial</label><input type="text" value="Rubí Estética Integral"></div>
          <div class="campo"><label>RUC</label><input type="text" value="10 4XX XXX XX1"></div>
          <div class="campo"><label>Teléfono principal</label><input type="text" value="945 189 720"></div>
          <div class="campo"><label>Correo de contacto</label><input type="email" value="contacto@rubiestetica.pe"></div>
        </div>
        <div class="panel">
          <h4>Redes y canales</h4>
          <div class="campo"><label>Instagram</label><input type="text" value="@rubiesteticaintegral346"></div>
          <div class="campo"><label>TikTok</label><input type="text" value="@rubiesteticaintegral"></div>
          <div class="campo"><label>Facebook</label><input type="text" value="Rubí Estética Integral"></div>
          <div class="campo"><label>WhatsApp de reservas</label><input type="text" value="+51 945 189 720"></div>
        </div>
      </div>
    }

    @if (pestana() === 'Marca') {
      <div class="grid-config">
        <div class="panel">
          <h4>Logo principal de la web</h4>
          <div class="marca-preview marca-preview--web">
            <img [src]="marca.logoSitio()" alt="Logo actual de Rubí">
          </div>
          <div class="campo">
            <label>Ruta o URL del logo</label>
            <input type="text" [ngModel]="logoRuta()" (ngModelChange)="logoRuta.set($event)" placeholder="img/logo-rubi-transparente.png">
            <span class="campo__ayuda">Usa PNG transparente para que se vea bien sobre fondo blanco, vino o cualquier sección.</span>
          </div>
          <div class="campo">
            <label>Cargar logo desde tu equipo</label>
            <input type="file" accept="image/*" (change)="cargarLogo($event)">
          </div>
          <div class="acciones-marca">
            <button class="btn btn--vino btn--sm" (click)="guardarLogo()">Guardar logo web</button>
            <button class="btn btn--linea btn--sm" (click)="logoRuta.set('img/logo-rubi-web-transparente.png'); guardarLogo()">Usar logo oficial</button>
          </div>
        </div>

        <div class="panel panel--vino">
          <h4>Logo del panel administrador</h4>
          <div class="marca-preview marca-preview--admin">
            <img [src]="marca.logoAdmin()" alt="Logo actual del panel">
          </div>
          <div class="campo">
            <label>Ruta o URL del logo del panel</label>
            <input type="text" [ngModel]="logoAdminRuta()" (ngModelChange)="logoAdminRuta.set($event)" placeholder="img/logo-rubi-panel-transparente.png">
            <span class="campo__ayuda">Este logo se usa sobre el menú vino del panel. Recomendado: PNG claro/transparente.</span>
          </div>
          <div class="campo">
            <label>Cargar logo del panel</label>
            <input type="file" accept="image/*" (change)="cargarLogoAdmin($event)">
          </div>
          <div class="acciones-marca">
            <button class="btn btn--vino btn--sm" (click)="guardarLogoAdmin()">Guardar logo panel</button>
            <button class="btn btn--linea btn--sm" (click)="logoAdminRuta.set('img/logo-rubi-panel-transparente.png'); guardarLogoAdmin()">Usar logo claro</button>
          </div>
        </div>

        <div class="panel">
          <h4>Icono de pestaña / favicon</h4>
          <div class="marca-preview marca-preview--favicon">
            <img [src]="marca.faviconSitio()" alt="Favicon actual">
            <span>Vista aproximada del icono que aparece en la pestaña del navegador.</span>
          </div>
          <div class="campo">
            <label>Ruta o URL del favicon</label>
            <input type="text" [ngModel]="faviconRuta()" (ngModelChange)="faviconRuta.set($event)" placeholder="favicon.svg">
            <span class="campo__ayuda">Recomendado: imagen cuadrada PNG/SVG de 32x32 o 64x64.</span>
          </div>
          <div class="campo">
            <label>Cargar icono desde tu equipo</label>
            <input type="file" accept="image/*" (change)="cargarFavicon($event)">
          </div>
          <div class="acciones-marca">
            <button class="btn btn--vino btn--sm" (click)="guardarFavicon()">Guardar favicon</button>
            <button class="btn btn--linea btn--sm" (click)="faviconRuta.set('favicon.svg'); guardarFavicon()">Usar favicon actual</button>
          </div>
        </div>

        <div class="panel marca-nota">
          <h4>Cómo se guardará luego</h4>
          <p>
            En este prototipo se guarda en el navegador para probar el flujo. Cuando conectemos Spring Boot,
            estas imágenes se subirán al backend, se guardará su URL en MySQL y toda la web leerá esa configuración.
          </p>
          <button class="btn btn--linea btn--sm" (click)="restablecerMarca()">Restablecer marca por defecto</button>
        </div>
      </div>
    }

    @if (pestana() === 'Fondo') {
      <div class="grid-config">
        <div class="panel">
          <h4>Fondo de la web pública</h4>
          <div class="campo">
            <label>Tipo de fondo</label>
            <select [ngModel]="fondo.config().modo" (ngModelChange)="fondo.actualizar({ modo: $event })">
              <option value="color">Color sólido (o degradado)</option>
              <option value="imagen">Imagen sobre el color</option>
              <option value="video">Video sobre el color</option>
            </select>
            <span class="campo__ayuda">
              El color siempre queda al fondo. Si eliges imagen o video, se coloca encima del color y puedes
              bajarle la opacidad para que el contenido se lea bien.
            </span>
          </div>

          <div class="fondo-colores">
            <div class="campo">
              <label>Color base</label>
              <input type="color" [ngModel]="fondo.config().color" (ngModelChange)="fondo.actualizar({ color: $event })">
            </div>
            <div class="campo">
              <label>Segundo color del degradado</label>
              <input type="color" [ngModel]="fondo.config().colorSecundario" (ngModelChange)="fondo.actualizar({ colorSecundario: $event })">
              <span class="campo__ayuda">Ponlo igual al color base si prefieres un color entero, sin degradado.</span>
            </div>
          </div>

          @if (fondo.config().modo === 'imagen') {
            <div class="campo">
              <label>Ruta o URL de la imagen</label>
              <input type="text" [ngModel]="fondo.config().imagen" (ngModelChange)="fondo.actualizar({ imagen: $event })"
                     placeholder="img/fondo-petalos.png">
              <span class="campo__ayuda">
                Ideal: PNG con transparencia (pétalos, texturas) de 2400 px de ancho o más, comprimido a menos de 600 KB.
              </span>
            </div>
            <div class="campo">
              <label>Cargar imagen desde tu equipo</label>
              <input type="file" accept="image/*" (change)="cargarFondoImagen($event)">
            </div>
            <div class="acciones-marca">
              <button class="btn btn--linea btn--sm" (click)="fondo.actualizar({ imagen: 'img/fondo-petalos.svg' })">
                Usar textura de pétalos incluida
              </button>
            </div>
          }

          @if (fondo.config().modo === 'video') {
            <div class="campo">
              <label>Ruta o URL del video</label>
              <input type="text" [ngModel]="fondo.config().video" (ngModelChange)="fondo.actualizar({ video: $event })"
                     placeholder="video/petalos-rosa.mp4">
            </div>
            <div class="campo">
              <label>Cargar video desde tu equipo</label>
              <input type="file" accept="video/*" (change)="cargarFondoVideo($event)">
              <span class="campo__ayuda">
                En el prototipo el video se guarda en el navegador, así que conviene uno corto (5–15 s). Con el
                backend se subirá al servidor sin límite de peso.
              </span>
            </div>
            <div class="campo">
              <label>Imagen de respaldo mientras carga el video</label>
              <input type="text" [ngModel]="fondo.config().posterVideo" (ngModelChange)="fondo.actualizar({ posterVideo: $event })"
                     placeholder="img/fondo-poster.jpg">
            </div>
            <div class="interruptores">
              <label>
                <input type="checkbox" [ngModel]="fondo.config().pausarQuieto" (ngModelChange)="fondo.actualizar({ pausarQuieto: $event })">
                Reproducir mientras se desplaza la página y pausar cuando se detiene
              </label>
            </div>
          }

          <div class="campo" style="margin-top:18px">
            <label>Opacidad de la imagen o video: {{ fondo.config().opacidadMedio }} %</label>
            <input type="range" min="5" max="100" step="5"
                   [ngModel]="fondo.config().opacidadMedio" (ngModelChange)="fondo.actualizar({ opacidadMedio: +$event })">
          </div>
          <div class="campo">
            <label>Opacidad de las secciones sobre el fondo: {{ fondo.config().velo }} %</label>
            <input type="range" min="30" max="100" step="2"
                   [ngModel]="fondo.config().velo" (ngModelChange)="fondo.actualizar({ velo: +$event })">
            <span class="campo__ayuda">Menos porcentaje = se ve más el fondo. Más porcentaje = textos más legibles.</span>
          </div>
          <div class="campo">
            <label>Desenfoque del fondo: {{ fondo.config().desenfoque }} px</label>
            <input type="range" min="0" max="12" step="1"
                   [ngModel]="fondo.config().desenfoque" (ngModelChange)="fondo.actualizar({ desenfoque: +$event })">
          </div>

          <div class="acciones-marca">
            <button class="btn btn--linea btn--sm" (click)="fondo.restablecer()">Restablecer fondo</button>
          </div>
        </div>

        <div class="panel">
          <h4>Vista previa</h4>
          <div class="fondo-preview" [style.background]="previaColor()">
            @if (fondo.config().modo === 'imagen' && fondo.config().imagen) {
              <img [src]="fondo.config().imagen" alt="Fondo"
                   [style.opacity]="fondo.config().opacidadMedio / 100"
                   [style.filter]="previaFiltro()">
            }
            @if (fondo.config().modo === 'video' && fondo.config().video) {
              <video [src]="fondo.config().video" autoplay muted loop playsinline
                     [style.opacity]="fondo.config().opacidadMedio / 100"
                     [style.filter]="previaFiltro()"></video>
            }
            <div class="fondo-preview__seccion" [style.opacity]="fondo.config().velo / 100">
              <strong>Sección de la web</strong>
              <span>Así se verá el contenido sobre el fondo elegido.</span>
            </div>
          </div>

          <h4 style="margin-top:26px">Calidad recomendada del video</h4>
          <ul class="fondo-recomendacion">
            <li>Formato MP4 (H.264) y, si se puede, una copia WebM (VP9) para que pese menos.</li>
            <li>Resolución 1920 × 1080 para pantallas normales; 2560 × 1440 si quieres nitidez en monitores grandes.</li>
            <li>Bitrate 6–10 Mbps en 1080p. Menos de 4 Mbps se ve borroso al ampliarlo a pantalla completa.</li>
            <li>Duración 8–20 segundos, en bucle, sin cortes bruscos y sin audio.</li>
            <li>30 fps es suficiente para pétalos o movimiento lento; evita 60 fps porque duplica el peso.</li>
            <li>Peso final ideal: 3–8 MB. Súbelo comprimido para que la web cargue rápido en celular.</li>
            <li>Movimiento lento y contraste bajo: así el texto encima se lee sin esfuerzo.</li>
            <li>En celular conviene usar la imagen de respaldo en lugar del video para no gastar datos.</li>
          </ul>
        </div>
      </div>
    }

    @if (pestana() === 'Agenda') {
      <div class="grid-config">
        <div class="panel">
          <h4>Reglas de la agenda</h4>
          <div class="campo"><label>Duración del bloque horario</label>
            <select><option>60 minutos</option><option>90 minutos</option><option>30 minutos</option></select>
          </div>
          <div class="campo"><label>Días entre sesiones de un plan multisesión</label>
            <select><option>15 días</option><option>30 días</option><option>7 días</option></select>
            <span class="campo__ayuda">Valor sugerido al programar la siguiente sesión de un plan.</span>
          </div>
          <div class="campo"><label>Llegada recomendada antes de la hora reservada</label>
            <select><option>20 minutos antes</option><option>30 minutos antes</option><option>15 minutos antes</option></select>
            <span class="campo__ayuda">Mensaje visible para pacientes: si llegan tarde no pierden la reserva, pero podrían esperar cabina disponible.</span>
          </div>
          @for (l of locales; track l.id) {
            <div class="campo">
              <label>Pacientes por hora en {{ l.nombre }} ({{ cabinas(l.id) }} cabinas)</label>
              <input type="number" [value]="cupo(l.id)" min="1" max="20">
              <span class="campo__ayuda">
                Al llegar a {{ cupo(l.id) }} reservas, esa hora se cierra y la paciente pasa a la siguiente.
              </span>
            </div>
          }
          <div class="interruptores">
            <label><input type="checkbox" checked> Cerrar el bloque horario al llegar a su cupo</label>
            <label><input type="checkbox" checked> Atención las 24 horas en ambas sedes</label>
            <label><input type="checkbox" checked> Asignar cabina y especialista en el local, al llegar la paciente</label>
            <label><input type="checkbox" checked> Aceptar pacientes sin cita según disponibilidad del momento</label>
          </div>
        </div>

        <div class="panel">
          <h4>Horario por local</h4>
          @for (l of locales; track l.id) {
            <div class="horario-config">
              <strong>{{ l.nombre }}</strong>
              @for (h of l.horario; track h.dias) {
                <div class="horario-config__fila">
                  <span>{{ h.dias }}</span>
                  <input type="time" [value]="h.apertura">
                  <input type="time" [value]="h.cierre">
                </div>
              }
            </div>
          }
        </div>
      </div>
    }

    @if (pestana() === 'Pagos') {
      <div class="grid-config">
        <div class="panel">
          <h4>Pasarela Izipay</h4>
          <div class="campo"><label>Modo</label><select><option>Pruebas (sandbox)</option><option>Producción</option></select></div>
          <div class="campo"><label>Identificador de comercio</label><input type="text" value="—" placeholder="Se configura en la etapa de integración"></div>
          <div class="campo"><label>URL del webhook de confirmación</label><input type="text" value="https://api.rubiestetica.pe/pagos/izipay/webhook"></div>
          <div class="interruptores">
            <label><input type="checkbox" checked> Marcar la cita como pagada solo con la confirmación del webhook</label>
            <label><input type="checkbox" checked> Registrar el código de operación en cada movimiento</label>
          </div>
        </div>
        <div class="panel">
          <h4>Cobros en local</h4>
          <div class="interruptores">
            <label><input type="checkbox" checked> Efectivo (único método presencial habilitado)</label>
            <label><input type="checkbox" checked> Registrar quién confirmó cada cobro en efectivo</label>
          </div>
          <div class="campo" style="margin-top:18px">
            <label>Adelanto requerido para reservar en línea</label>
            <select><option>Sin adelanto</option><option>30 % del tratamiento</option><option>50 % del tratamiento</option><option>Pago completo</option></select>
          </div>
        </div>
      </div>
    }

    @if (pestana() === 'Usuarios') {
      <div class="tabla-panel">
        <div class="tabla-panel__cabecera">
          <h3>Usuarios del sistema</h3>
          <button class="btn btn--linea btn--sm">Nuevo usuario</button>
        </div>
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Local</th><th>Permisos</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              @for (u of usuarios; track u.usuario) {
                <tr>
                  <td><div class="mini-dato"><strong>{{ u.nombre }}</strong><span>{{ u.usuario }}</span></div></td>
                  <td>{{ u.rol }}</td>
                  <td>{{ u.local }}</td>
                  <td>{{ u.permisos }}</td>
                  <td><span class="chip chip--ok chip--punto">Activo</span></td>
                  <td class="num"><button class="boton-icono">Editar</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    @if (pestana() === 'Sincronización') {
      <div class="panel">
        <h4>Preparación para la etapa offline</h4>
        <p>
          Estos parámetros aún no están activos. Quedan documentados en el prototipo porque la
          segunda etapa contempla una aplicación de escritorio por local con sincronización.
        </p>
        <div class="grid-config" style="margin-top:20px">
          <div>
            <div class="campo"><label>Frecuencia de sincronización</label><select><option>Cada 5 minutos</option><option>Cada 15 minutos</option></select></div>
            <div class="campo"><label>Bloquear reservas del día si un local no sincroniza hace</label><select><option>30 minutos</option><option>60 minutos</option></select></div>
          </div>
          <div class="interruptores">
            <label><input type="checkbox" checked> Registrar uuid global en cada operación</label>
            <label><input type="checkbox" checked> Registrar el local de origen de cada registro</label>
            <label><input type="checkbox" checked> Usar borrado lógico en lugar de borrado físico</label>
            <label><input type="checkbox" checked> Mantener marcas de creación y actualización</label>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .pestanas { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
    .pestanas button {
      background: #fff; border: 1px solid var(--linea); border-radius: 999px;
      padding: .5rem 1.2rem; font-family: inherit; font-size: .86rem; letter-spacing: .08em;
      color: var(--gris); cursor: pointer;
    }
    .pestanas button:hover { border-color: var(--magenta-300); color: var(--magenta); }
    .pestanas button.activa { background: var(--vino); border-color: var(--vino); color: #fff; }
    .grid-config { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
    .interruptores { display: grid; gap: 12px; }
    .interruptores label { display: flex; gap: 10px; align-items: flex-start; font-size: .94rem; color: var(--gris); cursor: pointer; }
    .interruptores input { margin-top: 3px; accent-color: var(--magenta); }
    .horario-config { margin-bottom: 20px; }
    .horario-config strong { display: block; margin-bottom: 10px; font-weight: 500; }
    .horario-config__fila { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 10px; align-items: center; margin-bottom: 8px; }
    .horario-config__fila span { font-size: .9rem; color: var(--gris); }
    .horario-config__fila input { border: 1px solid var(--linea); border-radius: var(--radio); padding: .45rem .6rem; font-family: inherit; font-size: .9rem; }
    .marca-preview {
      display: grid;
      place-items: center;
      min-height: 138px;
      margin: 16px 0 20px;
      border: 1px dashed var(--linea);
      border-radius: var(--radio-lg);
      background:
        linear-gradient(45deg, #f7f4f6 25%, transparent 25%),
        linear-gradient(-45deg, #f7f4f6 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #f7f4f6 75%),
        linear-gradient(-45deg, transparent 75%, #f7f4f6 75%);
      background-size: 24px 24px;
      background-position: 0 0, 0 12px, 12px -12px, -12px 0;
    }
    .marca-preview--web img { max-width: min(360px, 86%); max-height: 90px; object-fit: contain; }
    .panel--vino .marca-preview {
      background: var(--vino-900);
      border-color: rgba(255,255,255,.16);
    }
    .marca-preview--admin img { max-width: min(360px, 86%); max-height: 96px; object-fit: contain; }
    .marca-preview--favicon {
      grid-template-columns: 72px 1fr;
      gap: 16px;
      justify-items: start;
      padding: 20px;
      min-height: 112px;
    }
    .marca-preview--favicon img {
      width: 54px;
      height: 54px;
      object-fit: contain;
      border-radius: 12px;
      background: #fff;
      box-shadow: var(--sombra);
    }
    .marca-preview--favicon span { color: var(--gris); font-size: .94rem; }
    .acciones-marca { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
    .fondo-colores { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .fondo-colores input[type="color"] { height: 46px; padding: 4px; cursor: pointer; }
    .campo input[type="range"] { accent-color: var(--magenta); min-height: 0; border: none; background: none; padding: 0; }
    .fondo-preview {
      position: relative;
      overflow: hidden;
      border-radius: var(--radio-lg);
      border: 1px solid var(--linea);
      min-height: 240px;
      display: grid;
      place-items: center;
    }
    .fondo-preview img, .fondo-preview video {
      position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
    }
    .fondo-preview__seccion {
      position: relative;
      display: grid;
      gap: 6px;
      justify-items: center;
      text-align: center;
      background: #fff7f2;
      border-radius: var(--radio);
      padding: 22px 26px;
      width: min(86%, 320px);
    }
    .fondo-preview__seccion strong { color: var(--vino); font-weight: 500; }
    .fondo-preview__seccion span { font-size: .9rem; color: var(--gris); }
    .fondo-recomendacion { margin: 0; padding-left: 20px; display: grid; gap: 8px; color: var(--gris); font-size: .94rem; }
    .marca-nota { grid-column: 1 / -1; }
    .marca-nota p { max-width: 78ch; }
    @media (max-width: 1100px) { .grid-config { grid-template-columns: 1fr; } }
  `]
})
export class ConfiguracionComponent {
  constructor(public marca: MarcaService, public fondo: FondoService) {
    this.logoRuta.set(this.marca.logoSitio());
    this.logoAdminRuta.set(this.marca.logoAdmin());
    this.faviconRuta.set(this.marca.faviconSitio());
  }

  locales = LOCALES;
  cupo = cupoDeSede;
  cabinas = (localId: number) => cabinasDeSede(localId).length;
  pestanas = ['Negocio', 'Marca', 'Fondo', 'Agenda', 'Pagos', 'Usuarios', 'Sincronización'];
  pestana = signal('Negocio');
  logoRuta = signal('');
  logoAdminRuta = signal('');
  faviconRuta = signal('');

  usuarios = [
    { nombre: 'Rubí Salazar', usuario: 'rubi.admin', rol: 'Administradora', local: 'Ambas sedes', permisos: 'Acceso total' },
    { nombre: 'Milagros Ríos', usuario: 'milagros.recepcion', rol: 'Recepcionista', local: 'Sede Las Flores 1522', permisos: 'Agenda, pacientes y cobros' },
    { nombre: 'Jazmín Cabrera', usuario: 'jazmin.recepcion', rol: 'Recepcionista', local: 'Sede Las Flores 1544', permisos: 'Agenda, pacientes y cobros' },
    { nombre: 'Ana Torres', usuario: 'ana.especialista', rol: 'Especialista', local: 'Sede Las Flores 1522', permisos: 'Sus citas y observaciones' },
    { nombre: 'Lucía Ramos', usuario: 'lucia.especialista', rol: 'Especialista', local: 'Sede Las Flores 1544', permisos: 'Sus citas y observaciones' }
  ];

  guardarLogo(): void {
    this.marca.cambiarLogo(this.logoRuta());
  }

  guardarLogoAdmin(): void {
    this.marca.cambiarLogoAdmin(this.logoAdminRuta());
  }

  guardarFavicon(): void {
    this.marca.cambiarFavicon(this.faviconRuta());
  }

  cargarLogo(evento: Event): void {
    this.cargarImagen(evento, ruta => {
      this.logoRuta.set(ruta);
      this.guardarLogo();
    });
  }

  cargarLogoAdmin(evento: Event): void {
    this.cargarImagen(evento, ruta => {
      this.logoAdminRuta.set(ruta);
      this.guardarLogoAdmin();
    });
  }

  cargarFavicon(evento: Event): void {
    this.cargarImagen(evento, ruta => {
      this.faviconRuta.set(ruta);
      this.guardarFavicon();
    });
  }

  previaColor(): string {
    const c = this.fondo.config();
    return c.colorSecundario && c.colorSecundario !== c.color
      ? `linear-gradient(160deg, ${c.color} 0%, ${c.colorSecundario} 100%)`
      : c.color;
  }

  previaFiltro(): string {
    const d = this.fondo.config().desenfoque;
    return d > 0 ? `blur(${d}px)` : 'none';
  }

  cargarFondoImagen(evento: Event): void {
    this.cargarImagen(evento, ruta => this.fondo.actualizar({ imagen: ruta, modo: 'imagen' }));
  }

  cargarFondoVideo(evento: Event): void {
    this.cargarImagen(evento, ruta => this.fondo.actualizar({ video: ruta, modo: 'video' }));
  }

  restablecerMarca(): void {
    this.marca.restablecer();
    this.logoRuta.set(this.marca.logoSitio());
    this.logoAdminRuta.set(this.marca.logoAdmin());
    this.faviconRuta.set(this.marca.faviconSitio());
  }

  private cargarImagen(evento: Event, listo: (ruta: string) => void): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) { return; }
    const lector = new FileReader();
    lector.onload = () => listo(String(lector.result || ''));
    lector.readAsDataURL(archivo);
  }
}
