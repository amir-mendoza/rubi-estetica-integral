import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HORAS_SELECTOR, LOCALES, cabinasDeSede, cupoDeSede } from '../../data/datos';
import { MarcaService } from '../../compartido/marca.service';
import { FondoService } from '../../compartido/fondo.service';
import { RedesService } from '../../compartido/redes.service';
import { RedesEnlacesComponent } from '../../compartido/redes-enlaces.component';
import { CargadorService } from '../../compartido/cargador.service';
import { CargadorRuedaComponent } from '../../compartido/cargador-rueda.component';
import { SubidasService } from '../../compartido/subidas.service';
import { ConfiguracionImpresionEquipo, ConfiguracionPanelService, UsuarioSistemaConfig } from '../../compartido/configuracion-panel.service';
import { ImpresionService } from '../../compartido/impresion.service';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [FormsModule, RedesEnlacesComponent, CargadorRuedaComponent],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Configuración</h1>
        <p>Parámetros del negocio, agenda, pagos, usuarios y preparación para la etapa offline.</p>
      </div>
      <div class="cabecera-admin__acciones">
        @if (configPanel.ultimaActualizacion()) {
          <span class="chip chip--ok">Guardado {{ configPanel.ultimaActualizacion() }}</span>
        }
        <button class="btn btn--vino btn--sm" (click)="guardarTodo()">Guardar cambios</button>
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
          <div class="campo"><label>Nombre comercial</label>
            <input type="text" [ngModel]="configPanel.negocio().nombreComercial" (ngModelChange)="configPanel.actualizarNegocio({ nombreComercial: $event })">
          </div>
          <div class="campo"><label>RUC</label>
            <input type="text" [ngModel]="configPanel.negocio().ruc" (ngModelChange)="configPanel.actualizarNegocio({ ruc: $event })">
          </div>
          <div class="campo"><label>Teléfono principal</label>
            <input type="text" [ngModel]="configPanel.negocio().telefonoPrincipal" (ngModelChange)="configPanel.actualizarNegocio({ telefonoPrincipal: $event })">
          </div>
          <div class="campo"><label>Correo de contacto</label>
            <input type="email" [ngModel]="configPanel.negocio().correoContacto" (ngModelChange)="configPanel.actualizarNegocio({ correoContacto: $event })">
          </div>
        </div>
        <div class="panel">
          <h4>Redes y canales</h4>
          <p class="campo__ayuda" style="margin-bottom:18px">
            El enlace que guardes aquí se usa en el banner del inicio, el pie de página y la página de
            contacto. Desmarca una red para ocultarla de toda la web.
          </p>

          @for (r of redes.redes(); track r.red) {
            <div class="red-config">
              <label class="red-config__visible">
                <input type="checkbox" [ngModel]="r.visible" (ngModelChange)="redes.cambiarVisibilidad(r.red, $event)">
                <span>{{ r.nombre }}</span>
              </label>
              <input type="text" [ngModel]="r.url" (ngModelChange)="redes.cambiarUrl(r.red, $event)"
                     [placeholder]="r.red === 'whatsapp' ? '+51 945 189 720 o https://wa.me/51945189720' : 'https://...'">
            </div>
          }

          <div class="red-config__pie">
            <div>
              <span class="campo__ayuda">Vista previa de lo que verá la paciente</span>
              <app-redes-enlaces [conTexto]="true" />
            </div>
            <button class="btn btn--linea btn--sm" (click)="redes.restablecer()">Restablecer enlaces</button>
          </div>
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
            <input type="text" [ngModel]="logoRuta()" (ngModelChange)="logoRuta.set($event)" placeholder="img/marca-rubi-logo-magenta.png">
            <span class="campo__ayuda">Usa PNG transparente para que se vea bien sobre fondo blanco, vino o cualquier sección.</span>
          </div>
          <div class="campo">
            <label>Cargar logo desde tu equipo</label>
            <input type="file" accept="image/*" (change)="cargarLogo($event)">
          </div>
          <div class="acciones-marca">
            <button class="btn btn--vino btn--sm" (click)="guardarLogo()">Guardar logo web</button>
            <button class="btn btn--linea btn--sm" (click)="logoRuta.set('img/marca-rubi-logo-magenta.png'); guardarLogo()">Usar logo oficial</button>
          </div>
        </div>

        <div class="panel panel--vino">
          <h4>Logo del panel administrador</h4>
          <div class="marca-preview marca-preview--admin">
            <img [src]="marca.logoAdmin()" alt="Logo actual del panel">
          </div>
          <div class="campo">
            <label>Ruta o URL del logo del panel</label>
            <input type="text" [ngModel]="logoAdminRuta()" (ngModelChange)="logoAdminRuta.set($event)" placeholder="img/marca-rubi-logo-blanco.png">
            <span class="campo__ayuda">Este logo se usa sobre el menú vino del panel. Recomendado: PNG claro/transparente.</span>
          </div>
          <div class="campo">
            <label>Cargar logo del panel</label>
            <input type="file" accept="image/*" (change)="cargarLogoAdmin($event)">
          </div>
          <div class="acciones-marca">
            <button class="btn btn--vino btn--sm" (click)="guardarLogoAdmin()">Guardar logo panel</button>
            <button class="btn btn--linea btn--sm" (click)="logoAdminRuta.set('img/marca-rubi-logo-blanco.png'); guardarLogoAdmin()">Usar logo claro</button>
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
            <input type="text" [ngModel]="faviconRuta()" (ngModelChange)="faviconRuta.set($event)" placeholder="img/marca-rubi-favicon-magenta.png">
            <span class="campo__ayuda">Recomendado: imagen cuadrada PNG/SVG de 32x32 o 64x64.</span>
          </div>
          <div class="campo">
            <label>Cargar icono desde tu equipo</label>
            <input type="file" accept="image/*" (change)="cargarFavicon($event)">
          </div>
          <div class="acciones-marca">
            <button class="btn btn--vino btn--sm" (click)="guardarFavicon()">Guardar favicon</button>
            <button class="btn btn--linea btn--sm" (click)="faviconRuta.set('img/marca-rubi-favicon-magenta.png'); guardarFavicon()">Usar favicon oficial</button>
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

    @if (pestana() === 'Carga') {
      <div class="grid-config">
        <div class="panel">
          <h4>Indicador de carga</h4>
          <p class="campo__ayuda">
            Se muestra al cambiar de página en la web pública y al subir videos o fotos desde el panel,
            para que nadie piense que la página se trabó cuando hay mucho tráfico.
          </p>
          <div class="interruptores" style="margin-bottom:18px">
            <label>
              <input type="checkbox" [ngModel]="cargador.config().activo"
                     (ngModelChange)="cargador.actualizar({ activo: $event })">
              Activar el indicador de carga en la web y en las subidas del panel
            </label>
          </div>
          <div class="estilos-carga">
            @for (o of cargador.opciones; track o.estilo) {
              <button type="button" class="estilo-carga"
                      [class.estilo-carga--activo]="cargador.config().estilo === o.estilo"
                      (click)="cargador.actualizar({ estilo: o.estilo })">
                <app-cargador-rueda [estilo]="o.estilo" [tamano]="54" [etiqueta]="o.nombre" />
                <strong>{{ o.nombre }}</strong>
                <span>{{ o.descripcion }}</span>
              </button>
            }
          </div>

          <div class="campo" style="margin-top:18px">
            <label>Tamaño del indicador</label>
            <div class="presets-carga">
              @for (preset of tamanosCarga; track preset.id) {
                <button type="button"
                        class="preset-carga"
                        [class.preset-carga--activo]="cargador.config().tamanoPreset === preset.id"
                        (click)="usarTamanoCarga(preset.id)">
                  {{ preset.nombre }}
                </button>
              }
            </div>
            <span class="campo__ayuda">
              El tamaño elegido se usa en el velo entre páginas y como base para el indicador del panel.
            </span>
          </div>

          @if (cargador.config().tamanoPreset === 'personalizado') {
            <div class="campo">
              <label>Diámetro personalizado: {{ cargador.config().tamanoPx }} px</label>
              <input type="range" min="44" max="110" step="2"
                     [ngModel]="cargador.config().tamanoPx"
                     (ngModelChange)="cargador.actualizar({ tamanoPx: +$event })">
            </div>
          }

          <div class="campo" style="margin-top:18px">
            <label>Velocidad del giro: {{ cargador.config().velocidadMs }} ms por vuelta</label>
            <input type="range" min="700" max="2600" step="100"
                   [ngModel]="cargador.config().velocidadMs" (ngModelChange)="cargador.actualizar({ velocidadMs: +$event })">
            <span class="campo__ayuda">Más milisegundos = giro más lento y suave, ideal para equipos con poca potencia.</span>
          </div>
          <div class="campo">
            <label>Tiempo mínimo en pantalla: {{ cargador.config().minimoMs }} ms</label>
            <input type="range" min="0" max="1500" step="60"
                   [ngModel]="cargador.config().minimoMs" (ngModelChange)="cargador.actualizar({ minimoMs: +$event })">
            <span class="campo__ayuda">Evita que el velo aparezca y desaparezca de golpe cuando la página carga muy rápido.</span>
          </div>
          <div class="campo">
            <label>Mensaje mostrado</label>
            <input type="text" [ngModel]="cargador.config().mensaje" (ngModelChange)="cargador.actualizar({ mensaje: $event })"
                   placeholder="Preparando tu experiencia">
          </div>
          <div class="interruptores">
            <label>
              <input type="checkbox" [ngModel]="cargador.config().mostrarPorcentaje"
                     (ngModelChange)="cargador.actualizar({ mostrarPorcentaje: $event })">
              Mostrar el porcentaje (0 – 100 %) junto al indicador
            </label>
          </div>
          <div class="acciones-marca">
            <button class="btn btn--linea btn--sm" (click)="cargador.restablecer()">Restablecer indicador</button>
          </div>
        </div>

        <div class="panel">
          <h4>Vista previa</h4>
          <div class="carga-preview" [style.--carga-escala]="escalaCargaPreview()">
            @if (cargador.config().activo) {
              <app-cargador-rueda [tamano]="tamanoCargaPreview()" [etiqueta]="cargador.config().mensaje" />
              <strong>{{ cargador.config().mensaje }}</strong>
              @if (cargador.config().mostrarPorcentaje) { <span>68 %</span> }
              <span class="carga-preview__barra"><i style="width:68%"></i></span>
            } @else {
              <span class="chip chip--neutro">Desactivado</span>
              <strong>El indicador no se mostrará por ahora</strong>
              <span class="campo__ayuda">La configuración queda guardada para volver a activarla cuando el tráfico crezca.</span>
            }
          </div>

          <h4 style="margin-top:26px">Subidas de archivos</h4>
          <p class="campo__ayuda">
            Cada archivo que subas (video, portada o foto) muestra su avance del 0 al 100 % en un aviso
            flotante, con la confirmación "subido exitosamente" al terminar.
          </p>
        </div>
      </div>
    }

    @if (pestana() === 'Agenda') {
      <div class="grid-config">
        <div class="panel">
          <h4>Reglas de la agenda</h4>
          <div class="campo"><label>Duración del bloque horario</label>
            <select [ngModel]="configPanel.agenda().bloqueMin" (ngModelChange)="cambiarBloqueMin($event)">
              <option [ngValue]="60">60 minutos</option><option [ngValue]="90">90 minutos</option><option [ngValue]="30">30 minutos</option>
            </select>
          </div>
          <div class="campo"><label>Días entre sesiones de un plan multisesión</label>
            <select [ngModel]="configPanel.agenda().intervaloDias" (ngModelChange)="cambiarIntervaloDias($event)">
              <option [ngValue]="15">15 días</option><option [ngValue]="30">30 días</option><option [ngValue]="7">7 días</option>
            </select>
            <span class="campo__ayuda">Valor sugerido al programar la siguiente sesión de un plan.</span>
          </div>
          <div class="campo"><label>Llegada recomendada antes de la hora reservada</label>
            <select [ngModel]="configPanel.agenda().llegadaMin" (ngModelChange)="cambiarLlegadaMin($event)">
              <option [ngValue]="20">20 minutos antes</option><option [ngValue]="30">30 minutos antes</option><option [ngValue]="15">15 minutos antes</option>
            </select>
            <span class="campo__ayuda">Mensaje visible para pacientes: si llegan tarde no pierden la reserva, pero podrían esperar cabina disponible.</span>
          </div>
          @for (l of locales; track l.id) {
            <div class="campo">
              <label>Pacientes por hora en {{ l.nombre }} ({{ cabinas(l.id) }} cabinas)</label>
              <input type="number" [ngModel]="configPanel.obtenerCupoLocal(l.id)" (ngModelChange)="configPanel.actualizarCupoLocal(l.id, +$event)" min="1" max="20">
              <span class="campo__ayuda">
                Al llegar a {{ configPanel.obtenerCupoLocal(l.id) }} reservas, esa hora se cierra y la paciente pasa a la siguiente.
              </span>
            </div>
          }
          <div class="interruptores">
            <label><input type="checkbox" [ngModel]="configPanel.agenda().cerrarAlLlegarCupo" (ngModelChange)="configPanel.actualizarAgenda({ cerrarAlLlegarCupo: $event })"> Cerrar el bloque horario al llegar a su cupo</label>
            <label><input type="checkbox" [ngModel]="configPanel.agenda().atencion24h" (ngModelChange)="configPanel.actualizarAgenda({ atencion24h: $event })"> Atención las 24 horas en ambas sedes</label>
            <label><input type="checkbox" [ngModel]="configPanel.agenda().asignarAlLlegar" (ngModelChange)="configPanel.actualizarAgenda({ asignarAlLlegar: $event })"> Asignar cabina y especialista en el local, al llegar la paciente</label>
            <label><input type="checkbox" [ngModel]="configPanel.agenda().aceptarSinCita" (ngModelChange)="configPanel.actualizarAgenda({ aceptarSinCita: $event })"> Aceptar pacientes sin cita según disponibilidad del momento</label>
          </div>
          <div class="acciones-marca">
            <button class="btn btn--linea btn--sm" (click)="aplicarHorarioComercial()">Restaurar horario oficial</button>
            <button class="btn btn--linea btn--sm" (click)="configPanel.restablecerAgenda()">Restablecer agenda</button>
          </div>
        </div>

        <div class="panel">
          <h4>Horario por local</h4>
          @for (l of locales; track l.id) {
            <div class="horario-config">
              <strong>{{ l.nombre }}</strong>
              @for (h of configPanel.obtenerHorariosLocal(l.id); track h.dias; let i = $index) {
                <div class="horario-config__fila">
                  <span>{{ h.dias }}</span>
                  <select [ngModel]="h.apertura" (ngModelChange)="configPanel.actualizarAgendaHorario(l.id, i, 'apertura', $event)" [disabled]="configPanel.agenda().atencion24h">
                    @for (hora of horasSelector; track hora.valor) { <option [value]="hora.valor">{{ hora.etiqueta }}</option> }
                  </select>
                  <select [ngModel]="h.cierre" (ngModelChange)="configPanel.actualizarAgendaHorario(l.id, i, 'cierre', $event)" [disabled]="configPanel.agenda().atencion24h">
                    @for (hora of horasSelector; track hora.valor) { <option [value]="hora.valor">{{ hora.etiqueta }}</option> }
                    <option value="24:00">12:00 AM</option>
                  </select>
                </div>
              }
              <div class="horario-config__acciones">
                <button class="btn btn--linea btn--sm" (click)="aplicarHorarioLocal(l.id)">Restaurar horario oficial</button>
              </div>
            </div>
          }
        </div>
      </div>
    }

    @if (pestana() === 'Pagos') {
      <div class="grid-config">
        <div class="panel">
          <h4>Pasarela Izipay</h4>
          <div class="campo"><label>Modo</label>
            <select [ngModel]="configPanel.pagos().modoIzipay" (ngModelChange)="configPanel.actualizarPagos({ modoIzipay: $event })">
              <option value="sandbox">Pruebas (sandbox)</option><option value="produccion">Producción</option>
            </select>
          </div>
          <div class="campo"><label>Identificador de comercio</label>
            <input type="text" [ngModel]="configPanel.pagos().merchantId" (ngModelChange)="configPanel.actualizarPagos({ merchantId: $event })" placeholder="Se configura en la etapa de integración">
          </div>
          <div class="campo"><label>URL del webhook de confirmación</label>
            <input type="text" [ngModel]="configPanel.pagos().webhookUrl" (ngModelChange)="configPanel.actualizarPagos({ webhookUrl: $event })">
          </div>
          <div class="interruptores">
            <label><input type="checkbox" [ngModel]="configPanel.pagos().confirmarConWebhook" (ngModelChange)="configPanel.actualizarPagos({ confirmarConWebhook: $event })"> Marcar la cita como pagada solo con la confirmación del webhook</label>
            <label><input type="checkbox" [ngModel]="configPanel.pagos().registrarCodigoOperacion" (ngModelChange)="configPanel.actualizarPagos({ registrarCodigoOperacion: $event })"> Registrar el código de operación en cada movimiento</label>
          </div>
        </div>
        <div class="panel">
          <h4>Cobros en local</h4>
          <div class="interruptores">
            <label><input type="checkbox" [ngModel]="configPanel.pagos().metodosPresenciales['Efectivo']" (ngModelChange)="configPanel.actualizarMetodoPresencial('Efectivo', $event)"> Efectivo</label>
            <label><input type="checkbox" [ngModel]="configPanel.pagos().metodosPresenciales['Yape']" (ngModelChange)="configPanel.actualizarMetodoPresencial('Yape', $event)"> Yape</label>
            <label><input type="checkbox" [ngModel]="configPanel.pagos().metodosPresenciales['Plin']" (ngModelChange)="configPanel.actualizarMetodoPresencial('Plin', $event)"> Plin</label>
            <label><input type="checkbox" [ngModel]="configPanel.pagos().metodosPresenciales['Tarjeta POS']" (ngModelChange)="configPanel.actualizarMetodoPresencial('Tarjeta POS', $event)"> Tarjeta POS</label>
            <label><input type="checkbox" [ngModel]="configPanel.pagos().metodosPresenciales['Transferencia']" (ngModelChange)="configPanel.actualizarMetodoPresencial('Transferencia', $event)"> Transferencia</label>
            <label><input type="checkbox" [ngModel]="configPanel.pagos().registrarQuienCobra" (ngModelChange)="configPanel.actualizarPagos({ registrarQuienCobra: $event })"> Registrar quién confirmó cada cobro</label>
          </div>
          <div class="campo" style="margin-top:18px">
            <label>Adelanto requerido para reservar en línea</label>
            <select [ngModel]="configPanel.pagos().adelantoReserva" (ngModelChange)="configPanel.actualizarPagos({ adelantoReserva: $event })">
              <option value="ninguno">Sin adelanto</option><option value="30">30 % del tratamiento</option><option value="50">50 % del tratamiento</option><option value="100">Pago completo</option>
            </select>
          </div>
          <div class="acciones-marca">
            <button class="btn btn--linea btn--sm" (click)="configPanel.restablecerPagos()">Restablecer pagos</button>
          </div>
        </div>
      </div>
    }

    @if (pestana() === 'Impresión') {
      <div class="grid-config">
        <div class="panel">
          <h4>Impresión de vouchers por recepción</h4>
          <p class="campo__ayuda" style="margin-bottom:18px">
            Cada sede puede trabajar en modo navegador para pruebas o con agente local instalado en la computadora de recepción.
            Si una impresora falla, el agente puede usar una impresora de respaldo sin cambiar código.
          </p>

          @for (l of locales; track l.id) {
            @let equipo = equipoImpresion(l.id);
            <article class="impresora-card">
              <div class="impresora-card__cabecera">
                <div>
                  <span class="dato__label">{{ l.nombre }}</span>
                  <strong>{{ equipo.equipo }}</strong>
                </div>
                <span class="chip" [class.chip--ok]="equipo.activo" [class.chip--neutro]="!equipo.activo">
                  {{ equipo.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>

              <div class="impresora-grid">
                <div class="campo">
                  <label>Equipo o caja</label>
                  <input type="text" [ngModel]="equipo.equipo" (ngModelChange)="actualizarEquipoImpresion(l.id, { equipo: $event })" placeholder="Recepción principal">
                </div>
                <div class="campo">
                  <label>Modo de impresión</label>
                  <select [ngModel]="equipo.modo" (ngModelChange)="actualizarEquipoImpresion(l.id, { modo: $event })">
                    <option value="navegador">Navegador / pruebas</option>
                    <option value="agente-local">Agente local instalado</option>
                  </select>
                </div>
                <div class="campo">
                  <label>URL del agente local</label>
                  <input type="text" [ngModel]="equipo.agenteUrl" (ngModelChange)="actualizarEquipoImpresion(l.id, { agenteUrl: $event })" placeholder="http://127.0.0.1:48531">
                </div>
                <div class="campo">
                  <label>Papel</label>
                  <select [ngModel]="equipo.papel" (ngModelChange)="actualizarEquipoImpresion(l.id, { papel: $event })">
                    <option value="80mm">Ticket 80 mm</option>
                    <option value="58mm">Ticket 58 mm</option>
                  </select>
                </div>
                <div class="campo">
                  <label>Impresora principal</label>
                  <input type="text" [ngModel]="equipo.impresoraPrincipal" (ngModelChange)="actualizarEquipoImpresion(l.id, { impresoraPrincipal: $event })" placeholder="Ej. EPSON TM-T20III">
                </div>
                <div class="campo">
                  <label>Impresora de respaldo</label>
                  <input type="text" [ngModel]="equipo.impresoraRespaldo" (ngModelChange)="actualizarEquipoImpresion(l.id, { impresoraRespaldo: $event })" placeholder="Ej. POS-80C">
                </div>
                <div class="campo">
                  <label>Copias</label>
                  <input type="number" min="1" max="3" [ngModel]="equipo.copias" (ngModelChange)="actualizarEquipoImpresion(l.id, { copias: +$event })">
                </div>
              </div>

              <div class="interruptores impresora-switches">
                <label><input type="checkbox" [ngModel]="equipo.activo" (ngModelChange)="actualizarEquipoImpresion(l.id, { activo: $event })"> Usar este equipo para la sede</label>
                <label><input type="checkbox" [ngModel]="equipo.imprimirAutomaticamente" (ngModelChange)="actualizarEquipoImpresion(l.id, { imprimirAutomaticamente: $event })"> Imprimir automáticamente al guardar una cita presencial</label>
                <label><input type="checkbox" [ngModel]="equipo.usarRespaldoSiFalla" (ngModelChange)="actualizarEquipoImpresion(l.id, { usarRespaldoSiFalla: $event })"> Usar impresora de respaldo si falla la principal</label>
                <label><input type="checkbox" [ngModel]="equipo.fallbackNavegador" (ngModelChange)="actualizarEquipoImpresion(l.id, { fallbackNavegador: $event })"> Abrir impresión del navegador si el agente no responde</label>
              </div>

              <div class="acciones-marca">
                <button class="btn btn--vino btn--sm" type="button" (click)="probarImpresion(l.id)">
                  Probar impresión
                </button>
                @if (estadoPruebaImpresion()[l.id]) {
                  <span class="chip" [class.chip--ok]="estadoPruebaImpresion()[l.id].ok" [class.chip--neutro]="!estadoPruebaImpresion()[l.id].ok">
                    {{ estadoPruebaImpresion()[l.id].mensaje }}
                  </span>
                }
              </div>
            </article>
          }

          <div class="acciones-marca">
            <button class="btn btn--linea btn--sm" (click)="configPanel.restablecerImpresion()">Restablecer impresión</button>
          </div>
        </div>

        <div class="panel">
          <h4>Flujo recomendado en producción</h4>
          <div class="flujo-impresion">
            <div><strong>1</strong><span>Windows reconoce la impresora térmica por USB o red.</span></div>
            <div><strong>2</strong><span>Se instala Rubi Print Agent en la computadora de recepción.</span></div>
            <div><strong>3</strong><span>El panel envía el voucher al agente local con sede, equipo e impresora.</span></div>
            <div><strong>4</strong><span>Si falla la principal, se intenta con la impresora de respaldo y queda trazabilidad.</span></div>
          </div>
          <p class="campo__ayuda" style="margin-top:16px">
            En este prototipo el agente todavía no está instalado. Por eso el modo seguro es navegador. Cuando tengamos Spring Boot,
            el backend guardará esta misma configuración en base de datos y el agente imprimirá sin mostrar "Guardar como PDF".
          </p>
        </div>
      </div>
    }

    @if (pestana() === 'Usuarios') {
      <div class="tabla-panel">
        <div class="tabla-panel__cabecera">
          <h3>Usuarios del sistema</h3>
          <button class="btn btn--linea btn--sm" (click)="nuevoUsuario()">Nuevo usuario</button>
        </div>
        @if (mostrarFormularioUsuario()) {
          <div class="panel" style="margin-bottom:18px">
            <h4>{{ indiceUsuarioEditando() === null ? 'Nuevo usuario' : 'Editar usuario' }}</h4>
            <div class="grid-config">
              <div class="campo"><label>Nombre visible</label><input type="text" [ngModel]="usuarioForm().nombre" (ngModelChange)="actualizarUsuarioForm('nombre', $event)"></div>
              <div class="campo"><label>Usuario</label><input type="text" [ngModel]="usuarioForm().usuario" (ngModelChange)="actualizarUsuarioForm('usuario', $event)"></div>
              <div class="campo"><label>Rol</label>
                <select [ngModel]="usuarioForm().rol" (ngModelChange)="actualizarUsuarioForm('rol', $event)">
                  <option value="Administrador">Administrador</option>
                  <option value="Recepcionista">Recepcionista</option>
                  <option value="Especialista">Especialista</option>
                </select>
              </div>
              <div class="campo"><label>Local</label><input type="text" [ngModel]="usuarioForm().local" (ngModelChange)="actualizarUsuarioForm('local', $event)"></div>
            </div>
            <div class="campo"><label>Permisos</label><input type="text" [ngModel]="usuarioForm().permisos" (ngModelChange)="actualizarUsuarioForm('permisos', $event)"></div>
            <div class="interruptores">
              <label><input type="checkbox" [ngModel]="usuarioForm().activo" (ngModelChange)="actualizarUsuarioForm('activo', $event)"> Usuario activo</label>
            </div>
            <div class="acciones-marca">
              <button class="btn btn--vino btn--sm" (click)="guardarUsuario()" [disabled]="!usuarioFormValido()">Guardar usuario</button>
              <button class="btn btn--linea btn--sm" (click)="cancelarEdicionUsuario()">Cancelar</button>
            </div>
          </div>
        }
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Local</th><th>Permisos</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              @for (u of configPanel.usuarios(); track u.usuario; let i = $index) {
                <tr>
                  <td><div class="mini-dato"><strong>{{ u.nombre }}</strong><span>{{ u.usuario }}</span></div></td>
                  <td>{{ u.rol }}</td>
                  <td>{{ u.local }}</td>
                  <td>{{ u.permisos }}</td>
                  <td><span class="chip" [class.chip--ok]="u.activo" [class.chip--neutro]="!u.activo">{{ u.activo ? 'Activo' : 'Inactivo' }}</span></td>
                  <td class="num">
                    <button class="boton-icono" (click)="editarUsuario(i)">Editar</button>
                    <button class="boton-icono" (click)="eliminarUsuario(i)">Eliminar</button>
                  </td>
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
            <div class="campo"><label>Frecuencia de sincronización</label>
              <select [ngModel]="configPanel.sincronizacion().frecuenciaMin" (ngModelChange)="cambiarFrecuenciaSync($event)">
                <option [ngValue]="5">Cada 5 minutos</option><option [ngValue]="15">Cada 15 minutos</option>
              </select>
            </div>
            <div class="campo"><label>Bloquear reservas del día si un local no sincroniza hace</label>
              <select [ngModel]="configPanel.sincronizacion().bloquearReservasTrasMin" (ngModelChange)="cambiarBloqueoSync($event)">
                <option [ngValue]="30">30 minutos</option><option [ngValue]="60">60 minutos</option>
              </select>
            </div>
          </div>
          <div class="interruptores">
            <label><input type="checkbox" [ngModel]="configPanel.sincronizacion().registrarUuid" (ngModelChange)="configPanel.actualizarSincronizacion({ registrarUuid: $event })"> Registrar uuid global en cada operación</label>
            <label><input type="checkbox" [ngModel]="configPanel.sincronizacion().registrarLocalOrigen" (ngModelChange)="configPanel.actualizarSincronizacion({ registrarLocalOrigen: $event })"> Registrar el local de origen de cada registro</label>
            <label><input type="checkbox" [ngModel]="configPanel.sincronizacion().usarBorradoLogico" (ngModelChange)="configPanel.actualizarSincronizacion({ usarBorradoLogico: $event })"> Usar borrado lógico en lugar de borrado físico</label>
            <label><input type="checkbox" [ngModel]="configPanel.sincronizacion().mantenerTimestamps" (ngModelChange)="configPanel.actualizarSincronizacion({ mantenerTimestamps: $event })"> Mantener marcas de creación y actualización</label>
          </div>
        </div>
        <div class="acciones-marca">
          <button class="btn btn--linea btn--sm" (click)="configPanel.restablecerSincronizacion()">Restablecer sincronización</button>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Default,
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
    .estilos-carga {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
      gap: 12px; min-width: 0;
    }
    .estilo-carga {
      display: grid; justify-items: center; gap: 8px; min-width: 0; text-align: center;
      padding: 16px 4%; border: 1px solid var(--linea); border-radius: var(--radio-md, 14px);
      background: #fff; font-family: inherit; color: var(--gris); cursor: pointer;
      transition: border-color .2s ease, transform .2s ease;
    }
    .estilo-carga:hover { border-color: var(--magenta-300); transform: translateY(-2px); }
    .estilo-carga--activo { border-color: var(--vino); box-shadow: 0 0 0 1px var(--vino) inset; }
    .estilo-carga strong { color: var(--vino); font-size: .95rem; }
    .estilo-carga span { font-size: .84rem; }
    .presets-carga { display: flex; flex-wrap: wrap; gap: 8px; }
    .preset-carga {
      background: #fff; border: 1px solid var(--linea); border-radius: 999px;
      padding: .52rem 1rem; font-family: inherit; font-size: .86rem; color: var(--gris); cursor: pointer;
    }
    .preset-carga:hover { border-color: var(--magenta-300); color: var(--magenta); }
    .preset-carga--activo { background: var(--vino); border-color: var(--vino); color: #fff; }
    .carga-preview {
      display: grid;
      justify-items: center;
      gap: clamp(8px, calc(12px * var(--carga-escala, 1)), 16px);
      min-width: 0;
      padding: clamp(18px, calc(28px * var(--carga-escala, 1)), 34px) 4%;
      border: 1px solid var(--linea);
      border-radius: var(--radio-lg, 18px);
      background: var(--rosa-50, #fdf3f7); text-align: center;
    }
    .carga-preview strong {
      color: var(--vino);
      letter-spacing: .06em;
      text-transform: uppercase;
      font-size: clamp(.82rem, calc(1rem * var(--carga-escala, 1)), 1.08rem);
      line-height: 1.25;
    }
    .carga-preview > span:not(.carga-preview__barra) {
      font-size: clamp(.78rem, calc(.92rem * var(--carga-escala, 1)), .98rem);
      line-height: 1.2;
    }
    .carga-preview__barra {
      display: block;
      width: min(100%, calc(200px + (90px * var(--carga-escala, 1))));
      height: clamp(4px, calc(5px * var(--carga-escala, 1)), 7px);
      border-radius: 999px; overflow: hidden;
      background: color-mix(in srgb, var(--vino) 14%, transparent);
    }
    .carga-preview__barra i {
      display: block; height: 100%; border-radius: 999px;
      background: linear-gradient(90deg, var(--vino), var(--fucsia, #c2185b));
    }
    .red-config {
      display: grid; grid-template-columns: minmax(min(100%, 130px), 26%) minmax(0, 1fr);
      gap: 12px; align-items: center; margin-bottom: 12px;
    }
    .red-config__visible { display: flex; align-items: center; gap: 9px; font-size: .96rem; color: var(--tinta); cursor: pointer; }
    .red-config__visible input { accent-color: var(--magenta); }
    .red-config input[type="text"] {
      width: 100%; min-width: 0; border: 1px solid var(--linea); border-radius: var(--radio);
      padding: .6rem .9rem; font-family: inherit; font-size: .94rem; outline: none;
    }
    .red-config__pie {
      display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between;
      gap: 16px; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--linea);
    }
    .red-config__pie > div { display: grid; gap: 10px; min-width: 0; }
    @media (max-width: 720px) {
      .red-config { grid-template-columns: 1fr; gap: 6px; }
    }
    .interruptores { display: grid; gap: 12px; }
    .interruptores label { display: flex; gap: 10px; align-items: flex-start; font-size: .94rem; color: var(--gris); cursor: pointer; }
    .interruptores input { margin-top: 3px; accent-color: var(--magenta); }
    .horario-config { margin-bottom: 20px; }
    .horario-config strong { display: block; margin-bottom: 10px; font-weight: 500; }
    .horario-config__fila { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 10px; align-items: center; margin-bottom: 8px; }
    .horario-config__fila span { font-size: .9rem; color: var(--gris); }
    .horario-config__fila input, .horario-config__fila select { border: 1px solid var(--linea); border-radius: var(--radio); padding: .45rem .6rem; font-family: inherit; font-size: .9rem; background: #fff; }
    .horario-config__acciones { display: flex; justify-content: flex-end; margin-top: 10px; }
    .impresora-card { display: grid; gap: 14px; padding: 16px; border: 1px solid var(--linea); border-radius: var(--radio-lg); background: var(--rosa-50); margin-bottom: 16px; }
    .impresora-card__cabecera { display: flex; justify-content: space-between; gap: 14px; align-items: flex-start; padding-bottom: 12px; border-bottom: 1px dashed var(--linea); }
    .impresora-card__cabecera div { display: grid; gap: 4px; }
    .impresora-card__cabecera strong { color: var(--vino); font-size: 1rem; }
    .impresora-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); gap: 12px 14px; align-items: end; }
    .impresora-switches { grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 10px 16px; }
    .flujo-impresion { display: grid; gap: 12px; }
    .flujo-impresion div { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 12px; align-items: center; padding: 12px; border: 1px solid var(--linea); border-radius: var(--radio); background: #fff; }
    .flujo-impresion strong { display: inline-grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--vino); color: #fff; }
    .flujo-impresion span { color: var(--gris); line-height: 1.45; }
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
  horasSelector = HORAS_SELECTOR;
  cabinas = (localId: number) => cabinasDeSede(localId).length;
  readonly configPanel = inject(ConfiguracionPanelService);
  readonly redes = inject(RedesService);
  readonly cargador = inject(CargadorService);
  readonly subidas = inject(SubidasService);
  readonly impresion = inject(ImpresionService);
  pestanas = ['Negocio', 'Marca', 'Fondo', 'Carga', 'Agenda', 'Pagos', 'Impresión', 'Usuarios', 'Sincronización'];
  pestana = signal('Negocio');
  logoRuta = signal('');
  logoAdminRuta = signal('');
  faviconRuta = signal('');
  estadoPruebaImpresion = signal<Record<number, { ok: boolean; mensaje: string }>>({});
  mostrarFormularioUsuario = signal(false);
  indiceUsuarioEditando = signal<number | null>(null);
  usuarioForm = signal<UsuarioSistemaConfig>({
    nombre: '',
    usuario: '',
    rol: 'Recepcionista',
    local: 'Sede Las Flores 1522',
    permisos: '',
    activo: true
  });
  tamanosCarga = [
    { id: 'compacto' as const, nombre: 'Compacto' },
    { id: 'medio' as const, nombre: 'Medio' },
    { id: 'grande' as const, nombre: 'Grande' },
    { id: 'personalizado' as const, nombre: 'Personalizado' }
  ];

  guardarTodo(): void {
    this.configPanel.guardarTodo();
  }

  aplicarHorarioComercial(): void {
    this.configPanel.usarHorarioComercialEnTodasLasSedes();
  }

  aplicarHorarioLocal(localId: number): void {
    this.configPanel.usarHorarioComercial(localId);
  }

  cambiarBloqueMin(valor: string | number): void {
    this.configPanel.actualizarAgenda({ bloqueMin: Number(valor) as 30 | 60 | 90 });
  }

  cambiarIntervaloDias(valor: string | number): void {
    this.configPanel.actualizarAgenda({ intervaloDias: Number(valor) as 7 | 15 | 30 });
  }

  cambiarLlegadaMin(valor: string | number): void {
    this.configPanel.actualizarAgenda({ llegadaMin: Number(valor) as 15 | 20 | 30 });
  }

  cambiarFrecuenciaSync(valor: string | number): void {
    this.configPanel.actualizarSincronizacion({ frecuenciaMin: Number(valor) as 5 | 15 });
  }

  cambiarBloqueoSync(valor: string | number): void {
    this.configPanel.actualizarSincronizacion({ bloquearReservasTrasMin: Number(valor) as 30 | 60 });
  }

  equipoImpresion(localId: number): ConfiguracionImpresionEquipo {
    return this.configPanel.impresion().equipos.find(equipo => equipo.localId === localId)
      ?? this.configPanel.impresion().equipos[0];
  }

  actualizarEquipoImpresion(localId: number, cambios: Partial<ConfiguracionImpresionEquipo>): void {
    this.configPanel.actualizarEquipoImpresion(localId, cambios);
  }

  probarImpresion(localId: number): void {
    const equipo = this.equipoImpresion(localId);
    if (equipo.modo === 'navegador') {
      this.estadoPruebaImpresion.update(v => ({
        ...v,
        [localId]: { ok: true, mensaje: 'Modo navegador listo para pruebas.' }
      }));
      return;
    }
    this.estadoPruebaImpresion.update(v => ({
      ...v,
      [localId]: { ok: false, mensaje: 'Probando agente local...' }
    }));
    void this.impresion.probarEquipo(localId).then(resultado => {
      this.estadoPruebaImpresion.update(v => ({ ...v, [localId]: resultado }));
    });
  }

  guardarLogo(): void {
    this.marca.cambiarLogo(this.logoRuta());
  }

  guardarLogoAdmin(): void {
    this.marca.cambiarLogoAdmin(this.logoAdminRuta());
  }

  guardarFavicon(): void {
    this.marca.cambiarFavicon(this.faviconRuta());
  }

  usarTamanoCarga(preset: 'compacto' | 'medio' | 'grande' | 'personalizado'): void {
    this.cargador.usarTamanoPreset(preset);
  }

  tamanoCargaPreview(): number {
    return Math.max(52, Math.min(this.cargador.config().tamanoPx, 88));
  }

  escalaCargaPreview(): number {
    return Math.max(.78, Math.min(this.tamanoCargaPreview() / 72, 1.18));
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

  nuevoUsuario(): void {
    this.indiceUsuarioEditando.set(null);
    this.usuarioForm.set({
      nombre: '',
      usuario: '',
      rol: 'Recepcionista',
      local: 'Sede Las Flores 1522',
      permisos: '',
      activo: true
    });
    this.mostrarFormularioUsuario.set(true);
  }

  editarUsuario(indice: number): void {
    const usuario = this.configPanel.usuarios()[indice];
    if (!usuario) { return; }
    this.indiceUsuarioEditando.set(indice);
    this.usuarioForm.set({ ...usuario });
    this.mostrarFormularioUsuario.set(true);
  }

  actualizarUsuarioForm<K extends keyof UsuarioSistemaConfig>(campo: K, valor: UsuarioSistemaConfig[K]): void {
    this.usuarioForm.set({ ...this.usuarioForm(), [campo]: valor });
  }

  usuarioFormValido(): boolean {
    const form = this.usuarioForm();
    return !!(form.nombre.trim() && form.usuario.trim() && form.local.trim() && form.permisos.trim());
  }

  guardarUsuario(): void {
    if (!this.usuarioFormValido()) { return; }
    const form = {
      ...this.usuarioForm(),
      nombre: this.usuarioForm().nombre.trim(),
      usuario: this.usuarioForm().usuario.trim(),
      local: this.usuarioForm().local.trim(),
      permisos: this.usuarioForm().permisos.trim()
    };
    const indice = this.indiceUsuarioEditando();
    if (indice === null) {
      this.configPanel.agregarUsuario(form);
    } else {
      this.configPanel.actualizarUsuario(indice, form);
    }
    this.cancelarEdicionUsuario();
  }

  cancelarEdicionUsuario(): void {
    this.mostrarFormularioUsuario.set(false);
    this.indiceUsuarioEditando.set(null);
  }

  eliminarUsuario(indice: number): void {
    this.configPanel.eliminarUsuario(indice);
    if (this.indiceUsuarioEditando() === indice) {
      this.cancelarEdicionUsuario();
    }
  }

  private cargarImagen(evento: Event, listo: (ruta: string) => void): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) { return; }
    const etiqueta = archivo.type.startsWith('video') ? 'Video' : 'Imagen';
    this.subidas.leer(archivo, etiqueta).then(listo).catch(() => undefined);
  }
}
