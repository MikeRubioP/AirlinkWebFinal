// integrations/checkin.routes.js
import express from "express";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import QRCode from "qrcode";

const router = express.Router();

/**
 * POST /api/checkin/confirmar
 * Confirma el check-in y genera pase de abordar
 */
router.post("/confirmar", async (req, res) => {
  const db = req.app.get("db");
  const { idReserva, pasajeros } = req.body;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ CONFIRMANDO CHECK-IN');
  console.log('ID Reserva:', idReserva);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const [reservas] = await db.query(
      `SELECT estado FROM reserva WHERE idReserva = ?`,
      [idReserva]
    );

    if (reservas.length === 0) {
      return res.status(404).json({
        error: "Reserva no encontrada"
      });
    }

    if (reservas[0].estado === 'checkin_completado') {
      return res.status(400).json({
        error: "Check-in ya completado",
        mensaje: "El check-in para esta reserva ya fue completado anteriormente"
      });
    }

    await db.query(
      `UPDATE reserva SET estado = 'checkin_completado' WHERE idReserva = ?`,
      [idReserva]
    );

    for (const [idPasajero, datos] of Object.entries(pasajeros)) {
      if (datos.seat) {
        const [asientos] = await db.query(
          `SELECT idAsiento FROM asiento 
           WHERE idViaje = (SELECT idViaje FROM reserva WHERE idReserva = ?) 
           AND numero = ?`,
          [idReserva, datos.seat]
        );

        if (asientos.length > 0) {
          await db.query(
            `INSERT INTO pasajero_asiento (idPasajero, idAsiento, cargo_extra)
             VALUES (?, ?, 0)
             ON DUPLICATE KEY UPDATE idAsiento = ?`,
            [idPasajero, asientos[0].idAsiento, asientos[0].idAsiento]
          );

          await db.query(
            `UPDATE asiento SET disponible = 0 WHERE idAsiento = ?`,
            [asientos[0].idAsiento]
          );
        }
      }
    }

    console.log('✅ Check-in confirmado exitosamente\n');

    res.json({
      ok: true,
      mensaje: 'Check-in confirmado exitosamente',
      boardingPassUrl: `/api/checkin/boarding-pass/${idReserva}`
    });

  } catch (error) {
    console.error('❌ Error al confirmar check-in:', error);
    res.status(500).json({
      error: "Error al confirmar check-in",
      mensaje: error.message
    });
  }
});

/**
 * GET /api/checkin/boarding-pass/:idReserva
 * Genera y descarga el pase de abordar en PDF
 */
router.get("/boarding-pass/:idReserva", async (req, res) => {
  const db = req.app.get("db");
  const { idReserva } = req.params;

  try {
    const [reservas] = await db.query(
      `SELECT 
        r.codigo_reserva,
        r.estado,
        v.idViaje,
        v.salida,
        v.llegada,
        to_origen.codigo as origen,
        to_origen.nombreTerminal as origenNombre,
        to_destino.codigo as destino,
        to_destino.nombreTerminal as destinoNombre,
        p.nombrePasajero,
        p.apellidoPasajero,
        p.documento,
        a.numero as asiento,
        e.nombreEmpresa
      FROM reserva r
      INNER JOIN viaje v ON r.idViaje = v.idViaje
      INNER JOIN ruta ru ON v.idRuta = ru.idRuta
      INNER JOIN terminal to_origen ON ru.idTerminalOrigen = to_origen.idTerminal
      INNER JOIN terminal to_destino ON ru.idTerminalDestino = to_destino.idTerminal
      INNER JOIN pasajero p ON r.idReserva = p.idReserva
      LEFT JOIN pasajero_asiento pa ON p.idPasajero = pa.idPasajero
      LEFT JOIN asiento a ON pa.idAsiento = a.idAsiento
      LEFT JOIN empresa_equipo eq ON v.idEquipo = eq.idEquipo
      LEFT JOIN empresa e ON eq.idEmpresa = e.idEmpresa
      WHERE r.idReserva = ?`,
      [idReserva]
    );

    if (reservas.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const reserva = reservas[0];

    const qrData = `${reserva.codigo_reserva}|${reserva.nombrePasajero} ${reserva.apellidoPasajero}|${reserva.asiento || 'Sin asiento'}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrData);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=pase-abordar-${reserva.codigo_reserva}.pdf`);

    doc.pipe(res);

    doc.fontSize(24).font('Helvetica-Bold').text('PASE DE ABORDAR', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(reserva.nombreEmpresa || 'AirLink', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(10).font('Helvetica-Bold').text('INFORMACIÓN DEL VUELO', { underline: true });
    doc.moveDown(0.5);

    const yPos1 = doc.y;
    doc.fontSize(9).font('Helvetica');
    doc.text(`Código de reserva: ${reserva.codigo_reserva}`, 50, yPos1);
    doc.text(`Vuelo: AL ${reserva.idViaje}`, 300, yPos1);
    
    doc.text(`Origen: ${reserva.origen} - ${reserva.origenNombre}`, 50, yPos1 + 20);
    doc.text(`Destino: ${reserva.destino} - ${reserva.destinoNombre}`, 50, yPos1 + 40);
    
    const salida = new Date(reserva.salida);
    const llegada = new Date(reserva.llegada);
    
    doc.text(`Salida: ${salida.toLocaleString('es-CL')}`, 50, yPos1 + 60);
    doc.text(`Llegada: ${llegada.toLocaleString('es-CL')}`, 50, yPos1 + 80);

    doc.moveDown(6);

    doc.fontSize(10).font('Helvetica-Bold').text('INFORMACIÓN DEL PASAJERO', { underline: true });
    doc.moveDown(0.5);

    const yPos2 = doc.y;
    doc.fontSize(9).font('Helvetica');
    doc.text(`Nombre: ${reserva.nombrePasajero} ${reserva.apellidoPasajero}`, 50, yPos2);
    doc.text(`Documento: ${reserva.documento}`, 50, yPos2 + 20);
    doc.text(`Asiento: ${reserva.asiento || 'No asignado'}`, 50, yPos2 + 40);

    doc.moveDown(4);

    doc.fontSize(10).font('Helvetica-Bold').text('CÓDIGO QR', { align: 'center' });
    doc.moveDown(0.5);
    
    const qrImage = qrCodeDataURL.split(',')[1];
    const qrBuffer = Buffer.from(qrImage, 'base64');
    doc.image(qrBuffer, 220, doc.y, { width: 150, height: 150 });

    doc.moveDown(10);

    doc.fontSize(8).font('Helvetica').text('Presenta este pase junto con tu documento de identidad en el mostrador de check-in.', { align: 'center' });
    doc.text('Llega al aeropuerto con 2 horas de anticipación.', { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(7).text('Este es un documento electrónico válido.', { align: 'center' });
    doc.text(`Generado el ${new Date().toLocaleString('es-CL')}`, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    res.status(500).json({
      error: 'Error al generar pase de abordar',
      mensaje: error.message
    });
  }
});

/**
 * POST /api/checkin/send-boarding-pass
 * Envía el pase de abordar por email usando Gmail configurado
 */
router.post("/send-boarding-pass", async (req, res) => {
  const db = req.app.get("db");
  const { idReserva } = req.body;

  try {
    const [usuarios] = await db.query(
      `SELECT 
        u.email,
        u.nombreUsuario,
        r.codigo_reserva,
        p.nombrePasajero,
        p.apellidoPasajero
       FROM reserva r
       INNER JOIN usuario u ON r.idUsuario = u.idUsuario
       INNER JOIN pasajero p ON r.idReserva = p.idReserva
       WHERE r.idReserva = ?`,
      [idReserva]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    const { email, codigo_reserva, nombrePasajero, apellidoPasajero } = usuarios[0];

    if (!email) {
      return res.status(400).json({ 
        error: 'Email no encontrado',
        mensaje: 'El usuario no tiene un email registrado'
      });
    }

    // Usar las credenciales configuradas en .env
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        error: 'Configuración de email incompleta',
        mensaje: 'Las credenciales de email no están configuradas en el servidor'
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verificar conexión
    try {
      await transporter.verify();
      console.log('✅ Conexión con Gmail verificada');
    } catch (verifyError) {
      console.error('❌ Error de conexión con Gmail:', verifyError);
      return res.status(500).json({
        error: 'Error de configuración de email',
        mensaje: 'No se pudo conectar con Gmail. Verifica las credenciales.'
      });
    }

    const [reservas] = await db.query(
      `SELECT 
        r.codigo_reserva,
        v.idViaje,
        v.salida,
        v.llegada,
        to_origen.codigo as origen,
        to_origen.nombreTerminal as origenNombre,
        to_destino.codigo as destino,
        to_destino.nombreTerminal as destinoNombre,
        p.nombrePasajero,
        p.apellidoPasajero,
        p.documento,
        a.numero as asiento
      FROM reserva r
      INNER JOIN viaje v ON r.idViaje = v.idViaje
      INNER JOIN ruta ru ON v.idRuta = ru.idRuta
      INNER JOIN terminal to_origen ON ru.idTerminalOrigen = to_origen.idTerminal
      INNER JOIN terminal to_destino ON ru.idTerminalDestino = to_destino.idTerminal
      INNER JOIN pasajero p ON r.idReserva = p.idReserva
      LEFT JOIN pasajero_asiento pa ON p.idPasajero = pa.idPasajero
      LEFT JOIN asiento a ON pa.idAsiento = a.idAsiento
      WHERE r.idReserva = ?`,
      [idReserva]
    );

    const reserva = reservas[0];
    const salida = new Date(reserva.salida);

    const qrData = `${reserva.codigo_reserva}|${reserva.nombrePasajero} ${reserva.apellidoPasajero}|${reserva.asiento || 'Sin asiento'}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrData);

    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);

        await transporter.sendMail({
          from: `"AirLink" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `Pase de Abordar - Reserva ${codigo_reserva}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #7C4DFF; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">AirLink</h1>
              </div>
              
              <div style="padding: 30px; background-color: #f9f9f9;">
                <h2 style="color: #7C4DFF;">¡Check-in Confirmado! ✈️</h2>
                <p>Hola <strong>${nombrePasajero} ${apellidoPasajero}</strong>,</p>
                <p>Tu check-in ha sido confirmado exitosamente.</p>
                
                <div style="background-color: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #7C4DFF;">
                  <h3 style="margin-top: 0; color: #333;">Detalles del Vuelo</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Código de Reserva:</td>
                      <td style="padding: 8px 0; font-weight: bold;">${codigo_reserva}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Vuelo:</td>
                      <td style="padding: 8px 0; font-weight: bold;">AL ${reserva.idViaje}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Ruta:</td>
                      <td style="padding: 8px 0; font-weight: bold;">${reserva.origen} (${reserva.origenNombre}) → ${reserva.destino} (${reserva.destinoNombre})</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Salida:</td>
                      <td style="padding: 8px 0; font-weight: bold;">${salida.toLocaleString('es-CL')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Asiento:</td>
                      <td style="padding: 8px 0; font-weight: bold;">${reserva.asiento || 'No asignado'}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0; font-weight: bold; color: #856404;">⚠️ Importante:</p>
                  <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
                    <li>Llega al aeropuerto con 2 horas de anticipación</li>
                    <li>Presenta tu pase de abordar y documento de identidad</li>
                    <li>Revisa las restricciones de equipaje</li>
                  </ul>
                </div>
                
                <p style="margin-top: 30px;">Tu pase de abordar está adjunto a este correo en formato PDF.</p>
                <p>¡Buen viaje! ✈️</p>
              </div>
              
              <div style="background-color: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
                <p style="margin: 0; font-size: 12px;">
                  Este es un correo automático, por favor no responder.<br>
                  Si tienes dudas, contáctanos en soporte@airlink.com
                </p>
              </div>
            </div>
          `,
          attachments: [
            {
              filename: `pase-abordar-${codigo_reserva}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }
          ]
        });

        console.log('✅ Email enviado exitosamente a:', email);

        res.json({
          ok: true,
          mensaje: 'Pase de abordar enviado por email',
          email: email
        });
      } catch (emailError) {
        console.error('❌ Error al enviar email:', emailError);
        
        let mensaje = emailError.message;
        if (emailError.code === 'EAUTH') {
          mensaje = 'Error de autenticación con Gmail. Verifica que las credenciales sean correctas y que la contraseña de aplicación esté activa.';
        }
        
        res.status(500).json({
          error: 'Error al enviar email',
          mensaje: mensaje
        });
      }
    });

    // Generar PDF
    doc.fontSize(24).font('Helvetica-Bold').text('PASE DE ABORDAR', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text('AirLink', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(10).font('Helvetica-Bold').text('INFORMACIÓN DEL VUELO', { underline: true });
    doc.moveDown(0.5);
    
    const yPos1 = doc.y;
    doc.fontSize(9).font('Helvetica');
    doc.text(`Código de reserva: ${reserva.codigo_reserva}`, 50, yPos1);
    doc.text(`Vuelo: AL ${reserva.idViaje}`, 300, yPos1);
    
    doc.text(`Origen: ${reserva.origen} - ${reserva.origenNombre}`, 50, yPos1 + 20);
    doc.text(`Destino: ${reserva.destino} - ${reserva.destinoNombre}`, 50, yPos1 + 40);
    doc.text(`Salida: ${salida.toLocaleString('es-CL')}`, 50, yPos1 + 60);
    
    doc.moveDown(5);

    doc.fontSize(10).font('Helvetica-Bold').text('INFORMACIÓN DEL PASAJERO', { underline: true });
    doc.moveDown(0.5);
    
    const yPos2 = doc.y;
    doc.fontSize(9).font('Helvetica');
    doc.text(`Nombre: ${reserva.nombrePasajero} ${reserva.apellidoPasajero}`, 50, yPos2);
    doc.text(`Documento: ${reserva.documento}`, 50, yPos2 + 20);
    doc.text(`Asiento: ${reserva.asiento || 'No asignado'}`, 50, yPos2 + 40);
    
    doc.moveDown(4);

    doc.fontSize(10).font('Helvetica-Bold').text('CÓDIGO QR', { align: 'center' });
    doc.moveDown(0.5);
    
    const qrImage = qrCodeDataURL.split(',')[1];
    const qrBuffer = Buffer.from(qrImage, 'base64');
    doc.image(qrBuffer, 220, doc.y, { width: 150, height: 150 });
    
    doc.moveDown(10);
    
    doc.fontSize(8).font('Helvetica').text('Presenta este pase junto con tu documento de identidad.', { align: 'center' });
    doc.text('Llega al aeropuerto con 2 horas de anticipación.', { align: 'center' });
    
    doc.moveDown(2);
    doc.fontSize(7).text('Este es un documento electrónico válido.', { align: 'center' });
    doc.text(`Generado el ${new Date().toLocaleString('es-CL')}`, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: 'Error al enviar pase de abordar',
      mensaje: error.message
    });
  }
});

export { router };