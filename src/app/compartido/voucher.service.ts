import { Injectable, inject } from '@angular/core';
import { Cita, Paciente, PlanSesiones } from '../data/modelos';
import { formatoFechaLarga, formatoHora12, localPorId, soles, tratamientoPorId } from '../data/datos';
import { ImpresionService } from './impresion.service';

type PacienteVoucher = Pick<Paciente, 'nombre' | 'apellido' | 'dni' | 'celular' | 'correo'>;

interface LineaVoucher {
  etiqueta: string;
  valor: string;
}

interface OpcionesVoucher {
  usarAgente?: boolean;
}

@Injectable({ providedIn: 'root' })
export class VoucherService {
  private readonly impresion = inject(ImpresionService);
  private readonly logo = '/img/marca-rubi-logo-magenta.png';
  private readonly negocio = {
    nombre: 'Rubi Estetica Integral E.I.R.L.',
    ruc: '20614999544',
    telefonos: '945 189 720 / 951 716 939',
    direccion: 'Av. Las Flores de Primavera 1522 y 1544, San Juan de Lurigancho, Lima'
  };

  imprimirCita(cita: Cita, paciente?: PacienteVoucher, opciones: OpcionesVoucher = {}): void {
    const lineas = this.lineasCita(cita);
    const datos = {
      titulo: 'Comprobante de reserva',
      codigo: cita.codigo,
      subtitulo: cita.origen === 'Web' ? 'Reserva registrada desde la web' : `Reserva registrada por ${cita.origen}`,
      paciente,
      lineas,
      nota: 'Este comprobante acredita la reserva registrada. Presentalo en recepcion para validar tu atencion, adelanto o saldo pendiente.'
    };
    const html = this.htmlVoucher(datos);
    if (opciones.usarAgente === false) {
      this.abrirImpresion(html);
      return;
    }
    void this.impresion.imprimirVoucher({
      codigo: cita.codigo,
      titulo: datos.titulo,
      localId: cita.localId,
      html,
      texto: this.textoPlano(datos.titulo, cita.codigo, paciente, lineas),
      abrirEnNavegador: () => this.abrirImpresion(html)
    });
  }

  imprimirPlan(plan: PlanSesiones, paciente?: PacienteVoucher, opciones: OpcionesVoucher = {}): void {
    const lineas = this.lineasPlan(plan);
    const datos = {
      titulo: 'Comprobante de plan de sesiones',
      codigo: plan.codigo,
      subtitulo: 'Plan registrado por recepcion',
      paciente,
      lineas,
      nota: 'Este comprobante resume el plan y sus sesiones programadas. Conserva el codigo para seguimiento, pagos y reclamos.'
    };
    const html = this.htmlVoucher(datos);
    if (opciones.usarAgente === false) {
      this.abrirImpresion(html);
      return;
    }
    void this.impresion.imprimirVoucher({
      codigo: plan.codigo,
      titulo: datos.titulo,
      localId: plan.localId,
      html,
      texto: this.textoPlano(datos.titulo, plan.codigo, paciente, lineas),
      abrirEnNavegador: () => this.abrirImpresion(html)
    });
  }

  enlaceCorreoCita(cita: Cita, paciente?: PacienteVoucher): string {
    if (!paciente?.correo) { return ''; }
    return this.mailto(paciente.correo, `Comprobante de reserva ${cita.codigo}`, this.textoCita(cita, paciente));
  }

  enlaceCorreoPlan(plan: PlanSesiones, paciente?: PacienteVoucher): string {
    if (!paciente?.correo) { return ''; }
    return this.mailto(paciente.correo, `Comprobante de plan ${plan.codigo}`, this.textoPlan(plan, paciente));
  }

  enlaceWhatsappCita(cita: Cita, paciente?: PacienteVoucher): string {
    const numero = this.numeroWhatsapp(paciente?.celular);
    if (!numero) { return ''; }
    return `https://wa.me/${numero}?text=${encodeURIComponent(this.textoCita(cita, paciente))}`;
  }

  enlaceWhatsappPlan(plan: PlanSesiones, paciente?: PacienteVoucher): string {
    const numero = this.numeroWhatsapp(paciente?.celular);
    if (!numero) { return ''; }
    return `https://wa.me/${numero}?text=${encodeURIComponent(this.textoPlan(plan, paciente))}`;
  }

  textoCita(cita: Cita, paciente?: PacienteVoucher): string {
    return this.textoPlano('Comprobante de reserva', cita.codigo, paciente, this.lineasCita(cita));
  }

  textoPlan(plan: PlanSesiones, paciente?: PacienteVoucher): string {
    return this.textoPlano('Comprobante de plan de sesiones', plan.codigo, paciente, this.lineasPlan(plan));
  }

  private lineasCita(cita: Cita): LineaVoucher[] {
    const total = Number(cita.montoTotal || 0);
    const pagado = Number(cita.montoPagado || 0);
    const local = localPorId(cita.localId);
    const tratamientosIds = cita.tratamientosIncluidos?.length ? cita.tratamientosIncluidos : [cita.tratamientoId];
    const tratamientos = tratamientosIds
      .map(id => tratamientoPorId(id)?.nombre)
      .filter((nombre): nombre is string => !!nombre)
      .join(' + ');

    return [
      { etiqueta: 'Servicio', valor: tratamientos || 'Tratamiento estetico' },
      { etiqueta: 'Sede', valor: local ? `${local.nombre} - ${local.direccion}` : 'Sede por confirmar' },
      { etiqueta: 'Fecha', valor: formatoFechaLarga(cita.fecha) },
      { etiqueta: 'Hora de llegada', valor: `${formatoHora12(cita.horaInicio)} - ${formatoHora12(cita.horaFin)}` },
      { etiqueta: 'Estado de la cita', valor: cita.estado },
      { etiqueta: 'Monto total', valor: soles(total) },
      { etiqueta: 'Monto pagado', valor: soles(pagado) },
      { etiqueta: 'Saldo pendiente', valor: soles(Math.max(total - pagado, 0)) },
      { etiqueta: 'Estado de pago', valor: cita.estadoPago },
      { etiqueta: 'Metodo de pago', valor: cita.metodoPago || 'Pendiente en local' },
      { etiqueta: 'Codigo de operacion', valor: cita.codigoOperacion || 'No registrado' }
    ];
  }

  private lineasPlan(plan: PlanSesiones): LineaVoucher[] {
    const total = Number(plan.precioTotal || 0);
    const pagado = Number(plan.pagado || 0);
    const local = localPorId(plan.localId);
    const primera = plan.sesiones.find(s => s.fecha && s.hora) ?? plan.sesiones[0];
    const sesiones = plan.sesiones
      .map(s => `Sesion ${s.numero}: ${s.procedimiento}${s.fecha ? `, ${formatoFechaLarga(s.fecha)}` : ''}${s.hora ? ` a las ${formatoHora12(s.hora)}` : ''}`)
      .join('\n');

    return [
      { etiqueta: 'Plan', valor: plan.nombre },
      { etiqueta: 'Sede', valor: local ? `${local.nombre} - ${local.direccion}` : 'Sede por confirmar' },
      { etiqueta: 'Primera atencion', valor: primera?.fecha ? `${formatoFechaLarga(primera.fecha)} ${primera.hora ? formatoHora12(primera.hora) : ''}` : 'Por coordinar' },
      { etiqueta: 'Sesiones', valor: sesiones || 'Sin sesiones programadas' },
      { etiqueta: 'Estado del plan', valor: plan.estado },
      { etiqueta: 'Monto total', valor: soles(total) },
      { etiqueta: 'Monto pagado', valor: soles(pagado) },
      { etiqueta: 'Saldo pendiente', valor: soles(Math.max(total - pagado, 0)) }
    ];
  }

  private htmlVoucher(datos: {
    titulo: string;
    codigo: string;
    subtitulo: string;
    paciente?: PacienteVoucher;
    lineas: LineaVoucher[];
    nota: string;
  }): string {
    const paciente = datos.paciente;
    const fechaEmision = new Date().toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
    const filasPaciente: LineaVoucher[] = [
      { etiqueta: 'Paciente', valor: `${paciente?.nombre ?? ''} ${paciente?.apellido ?? ''}`.trim() || 'No registrado' },
      { etiqueta: 'DNI', valor: paciente?.dni || 'No registrado' },
      { etiqueta: 'Celular', valor: paciente?.celular || 'No registrado' },
      { etiqueta: 'Correo', valor: paciente?.correo || 'No registrado' }
    ];

    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${this.escape(datos.titulo)} ${this.escape(datos.codigo)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body { background: #f8f1f5; color: #1f1b20; font-family: Arial, Helvetica, sans-serif; }
    .pagina { width: 88mm; margin: 12px auto; }
    .acciones { display: flex; justify-content: center; gap: 8px; margin-bottom: 10px; }
    button { border: 1px solid #7a0f41; background: #7a0f41; color: #fff; padding: 9px 14px; border-radius: 4px; font-weight: 700; cursor: pointer; }
    .voucher {
      width: 80mm;
      min-height: 100mm;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #ddd;
      padding: 5mm 4mm 7mm;
      font-size: 10.5px;
      line-height: 1.35;
    }
    .cabecera { text-align: center; border-bottom: 1px dashed #777; padding-bottom: 8px; margin-bottom: 8px; }
    .cabecera img { width: 42mm; max-height: 18mm; object-fit: contain; display: block; margin: 0 auto 4px; }
    .empresa { font-size: 10px; line-height: 1.35; color: #2e2930; }
    h1 { margin: 8px 0 4px; color: #7a0f41; font-size: 15px; text-align: center; text-transform: uppercase; letter-spacing: .04em; }
    .subtitulo { margin: 0 0 6px; text-align: center; color: #4f444e; font-size: 10px; }
    .codigo { margin: 8px 0; border-top: 1px dashed #777; border-bottom: 1px dashed #777; padding: 6px 0; font-size: 12px; font-weight: 800; letter-spacing: .08em; color: #111; text-align: center; }
    h2 { margin: 10px 0 5px; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #7a0f41; border-bottom: 1px dashed #bbb; padding-bottom: 3px; }
    .dato {
      display: grid;
      grid-template-columns: 24mm minmax(0, 1fr);
      gap: 3mm;
      padding: 2px 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .dato span { color: #5f555e; font-size: 9.5px; text-transform: uppercase; }
    .dato strong { display: block; font-size: 10.5px; font-weight: 700; text-align: right; white-space: pre-line; overflow-wrap: anywhere; }
    .dato--larga { display: block; }
    .dato--larga span { display: block; margin-bottom: 2px; }
    .dato--larga strong { text-align: left; padding-left: 3mm; }
    .nota { margin: 9px 0 0; padding: 7px 0 0; border-top: 1px dashed #777; color: #3d333c; font-size: 10px; text-align: center; }
    .firma { margin-top: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 9.5px; color: #4f444e; text-align: center; }
    .linea { border-top: 1px solid #777; padding-top: 5px; }
    @media print {
      @page { size: 80mm auto; margin: 0; }
      html, body { width: 80mm; background: #fff; }
      .pagina { width: 80mm; margin: 0; }
      .acciones { display: none; }
      .voucher { width: 80mm; border: none; padding: 4mm; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="pagina">
    <div class="acciones"><button onclick="window.print()">Imprimir comprobante</button></div>
    <main class="voucher">
      <header class="cabecera">
        <img src="${this.logo}" alt="Rubi Estetica Integral">
        <div class="empresa">
          <strong>${this.escape(this.negocio.nombre)}</strong><br>
          RUC ${this.escape(this.negocio.ruc)}<br>
          ${this.escape(this.negocio.direccion)}<br>
          ${this.escape(this.negocio.telefonos)}
        </div>
      </header>
      <h1>${this.escape(datos.titulo)}</h1>
      <p class="subtitulo">${this.escape(datos.subtitulo)} · Emitido el ${this.escape(fechaEmision)}</p>
      <div class="codigo">CODIGO ${this.escape(datos.codigo)}</div>
      <h2>Datos del cliente</h2>
      <section>${filasPaciente.map(l => this.datoHtml(l)).join('')}</section>
      <h2>Detalle del comprobante</h2>
      <section>${datos.lineas.map(l => this.datoHtml(l)).join('')}</section>
      <p class="nota">${this.escape(datos.nota)}</p>
      <footer class="firma">
        <div class="linea">Recepcion / administracion</div>
        <div class="linea">Cliente</div>
      </footer>
    </main>
  </div>
  <script>
    window.addEventListener('load', function(){
      setTimeout(function(){
        window.focus();
        window.print();
      }, 250);
    });
  </script>
</body>
</html>`;
  }

  private datoHtml(linea: LineaVoucher): string {
    const larga = linea.valor.length > 42 || linea.valor.includes('\n');
    return `<div class="dato${larga ? ' dato--larga' : ''}"><span>${this.escape(linea.etiqueta)}</span><strong>${this.escape(linea.valor)}</strong></div>`;
  }

  private textoPlano(titulo: string, codigo: string, paciente: PacienteVoucher | undefined, lineas: LineaVoucher[]): string {
    const cabecera = [
      `${titulo} - ${codigo}`,
      this.negocio.nombre,
      `RUC ${this.negocio.ruc}`,
      `Paciente: ${`${paciente?.nombre ?? ''} ${paciente?.apellido ?? ''}`.trim() || 'No registrado'}`,
      `DNI: ${paciente?.dni || 'No registrado'}`
    ];
    return [...cabecera, '', ...lineas.map(l => `${l.etiqueta}: ${l.valor}`)].join('\n');
  }

  private abrirImpresion(html: string): void {
    const ventana = window.open('', '_blank', 'width=430,height=760');
    if (!ventana) { return; }
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
  }

  private mailto(destino: string, asunto: string, cuerpo: string): string {
    return `mailto:${encodeURIComponent(destino)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  }

  private numeroWhatsapp(valor?: string): string {
    const limpio = (valor ?? '').replace(/\D/g, '');
    if (!limpio) { return ''; }
    return limpio.startsWith('51') ? limpio : `51${limpio}`;
  }

  private escape(valor: string): string {
    return `${valor}`.replace(/[&<>"']/g, caracter => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[caracter] ?? caracter);
  }
}
