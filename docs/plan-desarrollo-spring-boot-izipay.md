# Plan de desarrollo: reservas, Izipay, Spring Boot y MySQL

Fecha de actualización: 2026-08-24

## 1. Estado actual del frontend

El frontend Angular ya quedó preparado con estas bases:

- Flujo público de reserva por pasos.
- Límite de cupo por bloque horario (`10` pacientes por hora por sede).
- Retención temporal de bloque horario para evitar cruces.
- Temporizador general de `8 minutos` para completar la reserva desde que la paciente elige la sede.
- Extensión opcional de `5 minutos` con ventana de respuesta de `30 segundos`.
- Pago online en modo `mock` para `Izipay`, listo para cambiar luego a `sandbox` y `producción`.
- Estructuras de promociones, tratamientos, productos, pedidos, pagos y panel administrativo.

## 2. Cómo queda ahora la lógica de reserva

La reserva debe funcionar así:

1. La paciente entra a `Reservar cita`.
2. Elige la sede.
3. Desde ese momento empieza un temporizador de `8 minutos`.
4. En ese tiempo termina el flujo:
   - tratamiento o promoción
   - fecha
   - hora
   - datos
   - pago o confirmación
5. Cuando elige una hora, ese bloque queda retenido con el mismo tiempo restante.
6. Si el bloque ya llegó a `10` pacientes entre reservas confirmadas y retenciones activas, se cierra.
7. Si el tiempo vence, la reserva en proceso se cancela y la hora vuelve a quedar disponible.

## 3. Qué falta para conectar Izipay de verdad

### Frontend

Ya está lista esta capa:

- `src/app/data/pagos-online.modelos.ts`
- `src/app/config/pagos-online.config.ts`
- `src/app/compartido/pagos-online.service.ts`

Lo único que faltará en Angular será:

- cambiar `modo: 'mock'` a `modo: 'sandbox'`
- apuntar al backend real
- manejar mejor mensajes de rechazo, timeout y reintento

### Backend Spring Boot

Debemos crear estos endpoints:

1. `POST /api/pagos/izipay/sesion`
   - valida monto, cliente, stock/cupo
   - crea orden interna pendiente
   - solicita token/sesión a Izipay
   - devuelve `authorization`, `transactionId`, `orderNumber`, `keyRSA`

2. `POST /api/pagos/izipay/confirmacion-frontend`
   - recibe respuesta del checkout
   - guarda trazabilidad inicial
   - no decide sola el estado final del pago

3. `POST /api/pagos/izipay/webhook`
   - valida firma/notificación oficial
   - confirma si el pago fue aprobado o rechazado
   - marca la cita o pedido como `Pagado`, `Fallido` o `Pendiente`

## 4. Qué debe guardar MySQL

Tablas principales sugeridas:

- `pacientes`
- `sedes`
- `cabinas`
- `especialistas`
- `tratamientos`
- `promociones`
- `promocion_sesiones`
- `productos`
- `citas`
- `retenciones_cita`
- `pedidos`
- `pedido_detalle`
- `pagos`
- `movimientos_pago`
- `usuarios`

## 5. Orden recomendado de implementación

Para no romper el proyecto, conviene seguir este orden:

### Fase 1. Backend base

- levantar Spring Boot
- configurar MySQL
- crear entidades, DTOs y repositorios base
- exponer catálogos: tratamientos, promociones, productos, sedes

### Fase 2. Agenda y reservas

- persistir citas reales
- persistir retenciones temporales
- validar cupo por hora en backend
- impedir doble confirmación de la misma hora

### Fase 3. Pacientes y panel

- persistir pacientes web y recepción
- historial de citas, tratamientos y compras
- pagos parciales y completos
- reportes y filtros reales

### Fase 4. Izipay

- crear sesión desde backend
- integrar checkout sandbox
- guardar webhook
- pasar luego a producción

## 6. Decisiones importantes para no olvidarnos

- La verdad final del cupo no debe vivir solo en Angular; al pasar a Spring Boot, el control final debe ser del backend.
- La verdad final del pago tampoco debe vivir solo en Angular; el webhook de Izipay debe ser la confirmación definitiva.
- Las claves privadas de Izipay nunca deben ir en el frontend.
- La retención de bloque horario debe migrar luego de `localStorage/sessionStorage` a base de datos o caché del backend.
- El código de operación del pago debe generarlo o validarlo el backend, no el panel manualmente.

## 7. Siguiente paso recomendado

El siguiente paso más sano del proyecto es este:

1. crear la estructura base de Spring Boot
2. conectar MySQL
3. migrar primero sedes, tratamientos, promociones, productos y pacientes
4. después migrar reservas/cupos/retenciones
5. recién ahí activar Izipay sandbox real

## 8. Fuentes oficiales revisadas para Izipay

- Inicio general: https://developers.izipay.pe/getting-started/
- SDK web quickstart: https://developers.izipay.pe/web-core/quickstart/
- API / referencia REST: https://developers.izipay.pe/api/

Nota: según la documentación oficial revisada el 24 de agosto de 2026, el token de sesión debe generarse desde backend y el SDK web se carga con los scripts oficiales de sandbox o producción.
