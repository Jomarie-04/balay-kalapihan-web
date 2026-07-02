import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendResetCodeEmail(to, code) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Gmail credentials not configured. Falling back to console log.');
    console.log(`Password reset code for ${to}: ${code}`);
    return { success: false, reason: 'missing-credentials' };
  }

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject: 'Balay Kalapihan Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #8b5e3c;">Balay Kalapihan Password Reset</h2>
          <p>Your verification code is:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 20px 0; color: #1f2937;">${code}</div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this, you can ignore this message.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send reset email:', error);
    console.log(`Password reset code for ${to}: ${code}`);
    return { success: false, reason: error.message };
  }
}

function formatCurrency(value) {
  return `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildInvoicePdfBuffer({ orderId, customerName, totalAmount, subtotalAmount, paymentMethod, referenceNumber, pickupDate, pickupTime, items, createdAt }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(22).text('Balay Kalapihan', { align: 'left' });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(12).text('Official Invoice', { color: '#7c3a12' });
    doc.moveDown(0.8);

    doc.font('Helvetica-Bold').fontSize(12).text(`Invoice #${orderId}`);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Customer: ${customerName || 'Customer'}`);
    doc.text(`Date: ${new Date(createdAt).toLocaleString('en-PH')}`);
    doc.text(`Payment Method: ${paymentMethod || 'N/A'}`);
    doc.text(`Reference #: ${referenceNumber || 'N/A'}`);
    doc.text(`Pickup Date: ${pickupDate || 'N/A'}`);
    doc.text(`Pickup Time: ${pickupTime || 'N/A'}`);

    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('Items', { underline: true });
    doc.moveDown(0.3);

    const normalizedItems = Array.isArray(items) ? items : [];
    const tableTop = doc.y;
    const col1 = 40;
    const col2 = 320;
    const col3 = 440;

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Item', col1, tableTop);
    doc.text('Qty', col2, tableTop, { width: 60, align: 'center' });
    doc.text('Price', col3, tableTop, { width: 80, align: 'right' });

    doc.moveTo(col1, tableTop + 15).lineTo(540, tableTop + 15).stroke();

    doc.font('Helvetica').fontSize(10);
    normalizedItems.forEach((item, index) => {
      const name = item?.name || item?.item?.name || 'Item';
      const quantity = item?.quantity || item?.qty || 1;
      const price = item?.price || item?.item?.price || 0;
      const rowY = tableTop + 20 + index * 16;
      doc.text(name, col1, rowY, { width: 260, lineBreak: false });
      doc.text(String(quantity), col2, rowY, { width: 60, align: 'center' });
      doc.text(formatCurrency(price), col3, rowY, { width: 80, align: 'right' });
    });

    doc.moveDown(2.5);
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text(`Subtotal: ${formatCurrency(subtotalAmount || 0)}`, { align: 'right' });
    doc.text(`Total: ${formatCurrency(totalAmount || 0)}`, { align: 'right' });
    doc.moveDown(0.8);
    doc.font('Helvetica').fontSize(10);
    doc.text('Thank you for supporting Balay Kalapihan.', { align: 'center', color: '#4b5563' });

    doc.end();
  });
}

export async function sendInvoiceEmail({ to, orderId, customerName, totalAmount, subtotalAmount, paymentMethod, referenceNumber, pickupDate, pickupTime, items, createdAt }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Gmail credentials not configured. Invoice email not sent.');
    return { success: false, reason: 'missing-credentials' };
  }

  try {
    const invoicePdf = await buildInvoicePdfBuffer({
      orderId,
      customerName,
      totalAmount,
      subtotalAmount,
      paymentMethod,
      referenceNumber,
      pickupDate,
      pickupTime,
      items,
      createdAt,
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject: `Balay Kalapihan Invoice #${orderId}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #8b5e3c 0%, #b7791f 100%); color: white; padding: 24px 28px;">
            <h2 style="margin: 0 0 6px; font-size: 24px;">Balay Kalapihan</h2>
            <p style="margin: 0; opacity: 0.95;">Thank you for your order. Your invoice is attached below.</p>
          </div>
          <div style="padding: 24px 28px; color: #1f2937;">
            <p style="margin-top: 0;">Hello ${customerName || 'Customer'},</p>
            <p>Your order <strong>#${orderId}</strong> has been confirmed. A professionally formatted PDF invoice is attached for your records.</p>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <p style="margin: 4px 0;"><strong>Order ID:</strong> ${orderId}</p>
              <p style="margin: 4px 0;"><strong>Date:</strong> ${new Date(createdAt).toLocaleString('en-PH')}</p>
              <p style="margin: 4px 0;"><strong>Payment Method:</strong> ${paymentMethod || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>Reference #:</strong> ${referenceNumber || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>Pickup Date:</strong> ${pickupDate || 'N/A'}</p>
              <p style="margin: 4px 0;"><strong>Pickup Time:</strong> ${pickupTime || 'N/A'}</p>
            </div>
            <div style="margin-top: 16px; text-align: right;">
              <p style="margin: 4px 0;"><strong>Subtotal:</strong> ${formatCurrency(subtotalAmount || 0)}</p>
              <p style="margin: 4px 0;"><strong>Total:</strong> ${formatCurrency(totalAmount || 0)}</p>
            </div>
            <p style="margin-top: 24px;">We appreciate your support and look forward to serving you again.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${orderId}.pdf`,
          content: invoicePdf,
          contentType: 'application/pdf',
        },
      ],
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    return { success: false, reason: error.message };
  }
}
