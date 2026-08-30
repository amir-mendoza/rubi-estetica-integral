# Seguridad, licencias y salida a produccion

Revision realizada: 30 de agosto de 2026.

Este documento es una guia tecnica de cumplimiento para el proyecto. No reemplaza
la validacion final de un abogado peruano especializado en proteccion de datos.

## Decisiones cerradas

- Frontend: Angular 22, version con soporte activo. No desplegar Angular 19.
- Backend: Spring Boot sobre Eclipse Temurin 25 LTS. No usar Oracle JDK en
  desarrollo, CI ni produccion.
- Base de datos: MySQL 8.4 LTS en el VPS o en un servicio administrado. Nunca debe
  exponerse el puerto 3306 a internet.
- Pagos: Izipay mediante checkout alojado. Las llaves privadas y la validacion de
  webhooks pertenecen exclusivamente al backend.
- Identidad: existen solo dos paneles iniciales, Administracion y Recepcion. Rubi y
  su socio usan cuentas administrativas separadas. Cada empleada autorizada usa su
  propia cuenta de Recepcion, aunque varias trabajen en la misma computadora. No se
  deja abierta una sesion de Rubi ni se comparten credenciales para actuar sobre
  datos personales.
- Autenticacion: contrasenas almacenadas con Argon2id o BCrypt. Nunca texto plano,
  cifrado reversible ni credenciales en Angular/localStorage.
- PIN: un PIN permanente de seis digitos no es suficiente para una cuenta expuesta
  a internet. Solo puede considerarse con bloqueo de intentos, limites de tasa y
  un segundo factor; la opcion preferida es contrasena y recuperacion por enlace u
  OTP de un solo uso.

## Arquitectura aprobada

```text
Internet
   |
HTTPS 443
   |
Nginx (Angular estatico + proxy /api)
   |
Spring Boot (usuario Linux sin privilegios)
   |
MySQL 8.4 LTS (127.0.0.1 o red privada, sin puerto publico)
```

En una primera etapa, Angular, Spring Boot y MySQL pueden vivir en el mismo VPS.
La base se conserva en un volumen o directorio persistente independiente del
artefacto de la aplicacion. Volver a desplegar Angular o el archivo JAR no debe
borrar la base de datos.

Para pasar de desarrollo a produccion se realiza una migracion controlada:

1. Crear el esquema con Flyway o Liquibase, nunca manualmente en produccion.
2. Exportar los datos validos de desarrollo o preproduccion.
3. Importarlos en MySQL de produccion mediante un usuario temporal y restringido.
4. Verificar cantidad de registros, saldos y relaciones.
5. Eliminar el usuario temporal y conservar un respaldo cifrado de la migracion.

No se deben copiar pacientes ficticios ni credenciales del prototipo a produccion.

## Controles obligatorios del backend

- Autorizacion en cada endpoint por rol y por recurso, no solo ocultando botones.
- Roles iniciales: Administracion y Recepcion. Una especialista que tambien registre
  pacientes recibe individualmente el permiso de Recepcion; no se crea un tercer
  panel mientras el negocio no lo necesite.
- Cookies de sesion `HttpOnly`, `Secure` y `SameSite`; no guardar JWT en
  localStorage.
- MFA obligatorio para administracion y muy recomendado para recepcion.
- Limite de intentos, bloqueo temporal y registro de inicios fallidos.
- Validacion de todos los datos en el servidor y consultas parametrizadas/JPA.
- CORS limitado al dominio real; no usar `*` con credenciales.
- Proteccion CSRF si la autenticacion usa cookies.
- Limites de tasa para login, recuperacion, reserva, busqueda por DNI y pagos.
- DNI, celular e historiales nunca deben aparecer en URL, mensajes de error o logs
  tecnicos completos.
- Secretos solo en variables protegidas o un gestor de secretos. Nunca en Git,
  Angular, imagenes Docker ni archivos servidos por Nginx.
- Archivos subidos: validar tipo real, tamano, extension, nombre y contenido;
  guardarlos fuera del directorio ejecutable.
- Registrar quien visualizo, creo, modifico, exporto o elimino datos personales.
  Conservar esa trazabilidad por un minimo de dos anos.
- Mantener un inventario de dependencias y ejecutar auditorias automaticas en CI.

## MySQL y continuidad de datos

- Crear un usuario de aplicacion sin privilegios de administracion.
- Crear otro usuario exclusivo para migraciones y retirarlo despues de usarse.
- Aceptar conexiones solo desde Spring Boot por localhost o red privada.
- Usar TLS si la base se separa en otro servidor.
- Cifrar respaldos antes de enviarlos fuera del VPS.
- Respaldo diario fuera del VPS, con retencion definida y al menos una copia en un
  proveedor o cuenta diferente.
- Mantener los respaldos automaticos del VPS, pero no depender unicamente de ellos.
- Probar restauraciones de forma periodica y registrar el resultado.
- Activar binlogs si se necesita recuperacion a un punto exacto entre respaldos.
- Monitorear espacio, memoria, CPU, errores, certificados y vencimiento de dominio.

La copia semanal del VPS no es suficiente para una operacion con citas y pagos: una
falla podria hacer perder hasta una semana de movimientos. El objetivo inicial es
un respaldo diario cifrado y una prueba de restauracion mensual.

## Obligaciones de datos personales en Peru

Antes de almacenar datos reales, la empresa debe completar estas acciones:

1. Identificar a la persona natural o juridica responsable, domicilio, RUC y canal
   para ejercer derechos sobre los datos.
2. Inscribir gratuitamente el banco de datos de pacientes/clientes en el Registro
   Nacional de Proteccion de Datos Personales y mantenerlo actualizado.
3. Informar finalidad, destinatarios, banco de datos, campos obligatorios y
   opcionales, consecuencias de no entregarlos, transferencias nacionales o
   internacionales, plazo de conservacion y mecanismo para ejercer derechos.
4. Obtener consentimiento previo, informado, expreso e inequivoco y guardar prueba
   de la version del texto, fecha, hora, canal, usuario y aceptacion.
5. Solicitar por separado el permiso opcional para promociones por correo, SMS o
   WhatsApp. Rechazar publicidad no puede impedir reservar o atenderse.
6. Si se guardan alergias, reacciones, contraindicaciones, diagnosticos o datos de
   salud, tratarlos como datos sensibles y obtener consentimiento escrito,
   electronico o digital demostrable.
7. Publicar una politica de privacidad y habilitar un procedimiento gratuito para
   acceso, rectificacion, cancelacion, oposicion y revocacion.
8. Preparar un procedimiento de incidentes: documentar cualquier incidente y, en
   los supuestos legales aplicables, notificar a la ANPD y a las personas afectadas
   dentro de 48 horas.
9. Aprobar un Documento de Seguridad con inventario de datos, sistemas, accesos,
   privilegios, respaldos, ciclo de vida y eliminacion.
10. Revisar si corresponde designar un Oficial de Datos Personales segun el nivel
    de ventas y el cronograma progresivo del reglamento.

El historial estetico debe separar observaciones operativas de informacion de
salud. Se recopila solo lo estrictamente necesario y se limita la visualizacion por
rol. Las especialistas no necesitan ver datos financieros completos y el personal
de caja no necesita ver notas clinicas que no intervengan en la atencion.

Si Hostinger almacena la informacion fuera de Peru, debe declararse la transferencia
internacional, reflejarse en la politica y en la inscripcion del banco, y conservar
el contrato/DPA con el proveedor. La ubicacion del centro de datos se decide antes
de crear el VPS y queda documentada.

## Operacion segura del VPS

- Ubuntu LTS con actualizaciones de seguridad automaticas.
- Acceso SSH con llaves; deshabilitar login remoto de root y autenticacion por
  contrasena despues de probar el usuario administrativo.
- Firewall de Hostinger y firewall del sistema: publicar solo 80/443; SSH limitado
  por IP cuando sea posible. MySQL 3306 permanece cerrado.
- Nginx como unico punto publico, HTTPS con renovacion automatica y cabeceras de
  seguridad (HSTS despues de validar HTTPS, CSP, X-Content-Type-Options,
  Referrer-Policy y Permissions-Policy).
- Spring Boot y MySQL se ejecutan como usuarios sin privilegios y reinician mediante
  systemd o contenedores con volumen persistente.
- Logs centralizados con rotacion, alertas y sin datos personales innecesarios.
- Cuenta de Hostinger protegida con MFA y accesos individuales para colaboradores.
- Separar desarrollo, preproduccion y produccion; nunca probar con pacientes reales.

## Comercio electronico y servicios esteticos

La pagina vende productos y reserva servicios, por lo que antes de publicar debe:

- Mostrar razon social o nombre legal, RUC, domicilio y canales de contacto.
- Mostrar el precio total, incluyendo tributos, comisiones y cargos aplicables.
- Informar stock, vigencia, restricciones, forma de pago, recojo/entrega, cambios,
  cancelaciones, devoluciones, reembolsos y condiciones de cada promocion.
- Evitar casillas premarcadas, cargos adicionales ocultos y cualquier interfaz que
  induzca una compra no deseada.
- Incorporar un Libro de Reclamaciones virtual visible y operativo, permitir enviar
  o imprimir una copia y atender dentro del plazo legal.
- Definir terminos y condiciones de compra y reserva antes de habilitar pagos reales.
- Emitir el comprobante de pago que corresponda mediante un sistema autorizado por
  SUNAT y vincularlo al pedido o atencion sin guardar la Clave SOL en la aplicacion.
- Verificar antes de publicar cada cosmetico que su rotulado muestre la Notificacion
  Sanitaria Obligatoria (NSO), lote y procedencia. La boleta del proveedor no
  reemplaza la NSO del producto.

Botox y otros procedimientos con infiltracion, inyeccion o sustancias modelantes
requieren una verificacion regulatoria independiente del software. Antes de
publicitarlos, reservarlos o cobrarlos, la dueña debe acreditar que el procedimiento
lo realiza un profesional legalmente habilitado y que la sede cuenta con la
autorizacion sanitaria, categoria y registro que correspondan. Tambien debe existir
un consentimiento informado asistencial separado del consentimiento de privacidad.

El sistema no debe llamar "especialista" de forma generica a quien ejecuta un acto
medico. Para esos tratamientos debe guardar el profesional responsable, colegiatura
y datos de habilitacion que la empresa determine con su asesor sanitario.

## Licencias

| Componente | Decision | Condicion |
| --- | --- | --- |
| Angular | Permitido | Licencia MIT; conservar avisos al redistribuir. |
| Spring Boot | Permitido | Licencia Apache 2.0; conservar avisos aplicables. |
| Eclipse Temurin 25 | Permitido | OpenJDK GPLv2 con Classpath Exception; usar la misma distribucion en local, CI y VPS. Temurin anuncia disponibilidad al menos hasta septiembre de 2031. |
| MySQL Community 8.4 | Permitido para operar el servicio | No empaquetar ni redistribuir MySQL como parte de un producto propietario sin revisar GPL/licencia comercial. |
| Izipay | Sujeto a contrato | Usar credenciales, marcas y datos de pago segun el contrato y la documentacion de Izipay. |
| Hostinger VPS | Sujeto a contrato/DPA | Documentar ubicacion, subencargados, transferencia internacional, respaldos y responsabilidades. |

## Bloqueos de salida a produccion

No se publica el sistema mientras exista cualquiera de estas condiciones:

- Vulnerabilidades altas o criticas conocidas en dependencias de produccion.
- Datos de pacientes o contrasenas guardados en Angular/localStorage.
- Base de datos o panel administrativo accesibles sin autenticacion real.
- MySQL expuesto a internet.
- Llaves de Izipay, correo o base de datos dentro del repositorio.
- Falta de inscripcion del banco de datos, politica de privacidad o consentimientos.
- Falta de respaldo externo probado.
- Cuentas compartidas sin trazabilidad individual.
- Falta de procedimiento de incidentes y contacto responsable.
- Falta de Libro de Reclamaciones virtual, condiciones comerciales o comprobantes.
- Oferta de actos medicos sin validar profesional y establecimiento autorizados.

## Datos pendientes de la empresa

Antes de redactar los textos definitivos y configurar produccion se debe confirmar:

- Razon social o nombre legal, RUC, domicilio y correo de privacidad.
- Si la empresa es micro, pequena, mediana o grande segun ventas anuales en UIT.
- Que observaciones de salud se almacenaran exactamente.
- Plazo de conservacion de cuentas, citas, tratamientos, pagos y consentimientos.
- Centro de datos elegido en Hostinger y pais de almacenamiento.
- Personal que tendra cada rol y responsable del Documento de Seguridad.
- Canal para solicitudes de privacidad y para revocar publicidad.
- Situacion de cada sede en RENIPRESS/categorizacion y profesionales autorizados para
  Botox u otros procedimientos medicos ofertados.
- Sistema que utilizara la empresa para boletas/facturas electronicas.

## Fuentes oficiales consultadas

- Angular: https://angular.dev/reference/releases
- Oracle Java: https://www.oracle.com/java/technologies/java-se-support-roadmap.html
- Eclipse Temurin: https://adoptium.net/support/
- Spring Boot: https://docs.spring.io/spring-boot/system-requirements.html
- MySQL Community: https://www.mysql.com/about/legal/licensing/oem/
- Reglamento peruano de datos personales:
  https://www.gob.pe/institucion/anpd/normas-legales/6554453-n-016-2024-jus
- Inscripcion de bancos de datos:
  https://www.gob.pe/institucion/minjus/noticias/1187359-minjusdh-implementa-plataforma-para-agilizar-la-inscripcion-de-bancos-de-datos-personales-proteger-a-los-ciudadanos-y-reducir-tramites
- Publicidad y consentimiento: https://www.gob.pe/23725-publicidad-no-deseada
- Libro de Reclamaciones: https://www.gob.pe/institucion/indecopi/campañas/65149-libro-de-reclamaciones-una-herramienta-util-para-la-proteccion-de-tus-derechos
- Comercio electronico: https://www.gob.pe/institucion/indecopi/noticias/1352010-por-primera-vez-el-codigo-de-proteccion-del-consumidor-introduce-cambios-para-garantizar-un-comercio-electronico-sin-practicas-abusivas
- Comprobantes electronicos: https://orientacion.sunat.gob.pe/comprobantes-de-pago-electronicos-1
- Procedimientos esteticos: https://www.gob.pe/institucion/susalud/noticias/619231-susalud-antes-de-acudir-a-una-clinica-estetica-consulta-el-registro-nacional-de-instituciones-prestadoras-de-servicios-de-salud
- Izipay: https://developers.izipay.pe/web-core/quickstart/
- Hostinger DPA: https://www.hostinger.com/legal/dpa
- Respaldos de VPS: https://support.hostinger.com/en/articles/1583232-how-to-back-up-or-restore-a-vps
