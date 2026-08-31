# Rubí Estética Integral

Web Angular para Rubí Estética Integral.

## Requisitos locales

- Node.js compatible con Angular CLI 22.
- npm.

Versiones validadas en esta máquina:

- Angular CLI 22.1.6
- Angular 22.1.4
- Node.js 24.19.0
- npm 11.13.0

## Comandos

```bash
npm install
npm run build:prod
npm audit
```

El build de producción queda en:

```bash
dist/rubi-estetica-integral
```

## Despliegue en Hostinger

1. Ejecutar `npm run build:prod`.
2. Entrar al panel de Hostinger.
3. Abrir el administrador de archivos del dominio.
4. Entrar a `public_html`.
5. Subir el contenido interno de `dist/rubi-estetica-integral/browser`.
6. Confirmar que `index.html`, los archivos `.js`, `.css`, `img`, `video`, `favicon` y `.htaccess` queden dentro de `public_html`.

El archivo `public/.htaccess` se copia al build para que las rutas de Angular funcionen al recargar páginas internas como `/productos/5` o `/tratamientos/9`.

## Revisión antes de publicar

- Ejecutar `npm audit` y confirmar 0 vulnerabilidades.
- Ejecutar `npm run build:prod` y confirmar que termina sin errores.
- Revisar en móvil y tablet: inicio, tratamientos, detalle de tratamiento, productos, detalle de producto, locales, contacto, carrito, reserva e ingreso.
- No subir `node_modules`, `dist`, `.angular/cache` ni archivos `.env`.
