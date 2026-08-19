# Preparacion de pagos online con Izipay

Este frontend ya tiene una capa preparada para pagos online en:

- `src/app/data/pagos-online.modelos.ts`
- `src/app/config/pagos-online.config.ts`
- `src/app/compartido/pagos-online.service.ts`

Actualmente `PAGOS_ONLINE_CONFIG.modo` esta en `mock`, por eso el cobro se simula en Angular. Cuando exista Spring Boot, cambiar a `sandbox` y luego a `produccion`.

## Credenciales necesarias de Izipay

Desde la cuenta/backoffice de Izipay se necesitan:

- Usuario o merchant code de comercio.
- Password/API key secreta para backend.
- Llave publica `keyRSA` para el checkout web.
- URL/credenciales de ambiente sandbox.
- URL/credenciales de produccion.
- Configuracion de webhook/notificacion de pago.

La clave secreta nunca debe ir en Angular. Solo Spring Boot la debe usar.

## Endpoints que debe crear Spring Boot

### Crear sesion de pago

`POST /api/pagos/izipay/sesion`

Recibe `SolicitudPagoOnline` desde Angular:

```json
{
  "tipo": "Cita",
  "referencia": "CT-1042",
  "descripcion": "Reserva HIFU 25D facial",
  "monto": 350,
  "moneda": "PEN",
  "cliente": {
    "nombre": "Maria",
    "apellido": "Lopez",
    "dni": "74859632",
    "celular": "987654321",
    "correo": "maria@email.com"
  },
  "items": [
    { "id": 2, "nombre": "HIFU 25D facial", "cantidad": 1, "precioUnitario": 350 }
  ],
  "localId": 1,
  "metadata": {
    "fecha": "2026-08-20",
    "hora": "09:00"
  }
}
```

Debe:

1. Validar monto, stock/cupo y datos del cliente.
2. Crear una orden interna en estado `Pendiente`.
3. Consumir la API de Izipay para generar token/sesion.
4. Responder a Angular con `SesionPagoOnline`.

Respuesta esperada:

```json
{
  "proveedor": "Izipay",
  "modo": "sandbox",
  "transactionId": "TX-123",
  "orderNumber": "CT-1042",
  "authorization": "TOKEN_SESSION_GENERADO_POR_BACKEND",
  "keyRSA": "LLAVE_PUBLICA_RSA",
  "amount": 350,
  "currency": "PEN",
  "publicConfig": {
    "merchantCode": "CODIGO_PUBLICO_COMERCIO"
  }
}
```

### Confirmacion frontend

`POST /api/pagos/izipay/confirmacion-frontend`

Este endpoint recibe la respuesta del checkout para mostrar resultado al usuario, pero no debe ser la fuente final de verdad. La verdad final debe venir del webhook de Izipay.

### Webhook Izipay

`POST /api/pagos/izipay/webhook`

Debe:

1. Validar firma/token del proveedor.
2. Buscar la orden por `transactionId`, `orderNumber` o referencia.
3. Marcar cita/pedido como `Pagado` solo si Izipay confirma aprobado.
4. Crear movimiento en `pagos` con:
   - `metodo = Izipay`
   - `canal = Online`
   - `registradoPor = Izipay (automatico)`
   - `codigoOperacion`
5. Si falla, mantener `Pendiente` o marcar `Fallido`.

## Flujos ya preparados en Angular

### Reserva de tratamiento o promocion

Archivo: `src/app/publico/reservar/reservar.component.ts`

Cuando el usuario elige `Pagar en linea con Izipay`, Angular llama a `PagosOnlineService.iniciarPago()` con:

- tipo `Cita`
- codigo de reserva
- tratamiento o promocion
- sede, fecha y hora
- datos del paciente

### Compra de productos

Archivo: `src/app/publico/carrito/carrito.component.ts`

Cuando el usuario elige `Pagar en linea con Izipay`, Angular llama a `PagosOnlineService.iniciarPago()` con:

- tipo `Producto`
- codigo de pedido
- productos, cantidades y total
- local de recojo
- datos del cliente

## Cambio para activar sandbox

En `src/app/config/pagos-online.config.ts`:

```ts
modo: 'sandbox'
```

Luego Spring Boot debe responder en `/api/pagos/izipay/sesion`.

## Fuente de documentacion revisada

Documentacion oficial Izipay Developers:

- https://developers.izipay.pe/web-core/quickstart/
- https://developers.izipay.pe/api/

Nota importante de Izipay: el token de sesion debe generarse desde backend.
