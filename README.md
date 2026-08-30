# RubiPrototipo

This project uses [Angular](https://angular.dev/) 22.1.

Before starting the backend or deploying the application, read the
[security, licensing and production checklist](docs/seguridad-licencias-produccion.md).
The editable project risk register is available in
[docs/registro-riesgos.ipynb](docs/registro-riesgos.ipynb).
For a shorter solved-versus-pending view, use the
[high-risk status checklist](docs/estado-altos-riesgos.ipynb).
Responsibilities for development, the business owner, SUNAT and hosting are split in
[docs/responsabilidades-produccion.ipynb](docs/responsabilidades-produccion.ipynb).
The agenda and evidence checklist for the client meeting on September 3, 2026 is in
[docs/reunion-rubi-2026-09-03.ipynb](docs/reunion-rubi-2026-09-03.ipynb).

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with Vitest, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
