import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fmt, amountInWords } from './format';

/**
 * Export a professional Invoice PDF.
 */
export function exportInvoicePDF({ invoice, schoolInfo = {} }) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();

    const DARK = [15, 23, 42];      // slate-900
    const BLUE = [37, 99, 235];     // blue-600
    const TEXT = [30, 41, 59];      // slate-800
    const MUTED = [100, 116, 139];   // slate-500
    const WHITE = [255, 255, 255];

    const schoolName = schoolInfo.school_name || 'Smart Bursar School';
    const schoolAddress = schoolInfo.school_address || 'Kigali, Rwanda';
    const schoolEmail = schoolInfo.school_email || 'info@school.com';
    const schoolPhone = schoolInfo.school_tel || '+250 000 000 000';

    // ── Header Header ──────────────────────────────────────────
    doc.setFillColor(...DARK);
    doc.rect(0, 0, pw, 50, 'F');

    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('INVOICE', 14, 25);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Invoice No: ${invoice.invoice_no}`, 14, 32);
    doc.text(`Issued Date: ${String(invoice.issued_date || '').slice(0, 10)}`, 14, 37);

    // School Info (Right Aligned)
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(schoolName.toUpperCase(), pw - 14, 20, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(schoolAddress, pw - 14, 26, { align: 'right' });
    doc.text(schoolEmail, pw - 14, 31, { align: 'right' });
    doc.text(schoolPhone, pw - 14, 36, { align: 'right' });

    // Blue Accent Line
    doc.setFillColor(...BLUE);
    doc.rect(0, 50, pw, 2, 'F');

    // ── Bill To & Details ──────────────────────────────────────
    let y = 65;

    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('BILL TO:', 14, y);

    doc.setTextColor(...TEXT);
    doc.setFontSize(12);
    doc.text(invoice.full_name, 14, y + 6);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(`Adm No: ${invoice.admission_no}`, 14, y + 11);
    doc.text(`Class: ${invoice.class_name}`, 14, y + 16);

    // Term Info (Right side)
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'bold');
    doc.text('ACADEMIC TERM:', pw - 14, y, { align: 'right' });
    doc.setTextColor(...TEXT);
    doc.text(invoice.term_name || 'Active term', pw - 14, y + 6, { align: 'right' });

    y += 30;

    // ── Items Table ────────────────────────────────────────────
    const tableData = [
        ['Tuition Fees', fmt(invoice.tuition_amount || 0)],
        ['Activity Fees', fmt(invoice.activity_amount || 0)],
        ['Transport Fees', fmt(invoice.transport_amount || 0)],
    ].filter(row => row[1] !== fmt(0));

    autoTable(doc, {
        startY: y,
        head: [['Description', 'Amount']],
        body: tableData,
        margin: { left: 14, right: 14 },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            textColor: TEXT,
            lineColor: [226, 232, 240],
            lineWidth: 0.1,
        },
        headStyles: {
            fillColor: [248, 250, 252], // slate-50
            textColor: DARK,
            fontStyle: 'bold',
            lineWidth: 0,
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { halign: 'right', cellWidth: 40, fontStyle: 'bold' },
        }
    });

    y = doc.lastAutoTable.finalY + 10;

    // ── Totals ──────────────────────────────────────────────────
    const total = Number(invoice.total_amount || 0);
    const paid = Number(invoice.paid || 0);
    const balance = Number(invoice.balance || 0);

    doc.setDrawColor(226, 232, 240);
    doc.line(pw - 80, y, pw - 14, y);
    y += 8;

    const rowHeight = 6;
    const drawTotalRow = (label, value, isBold = false, color = TEXT) => {
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(...(isBold ? DARK : color));
        doc.setFontSize(isBold ? 11 : 9);
        doc.text(label, pw - 80, y);
        doc.text(fmt(value), pw - 14, y, { align: 'right' });
        y += rowHeight;
    };

    drawTotalRow('Subtotal', total);
    drawTotalRow('Total Paid', paid);
    y += 2;
    doc.setFillColor(...[248, 250, 252]);
    doc.rect(pw - 82, y - 5, 72, 10, 'F');
    drawTotalRow('BALANCE DUE', balance, true, [220, 38, 38]);

    // Amount in words
    y += 15;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Amount in words: ${amountInWords(total)}`, 14, y);

    // ── Footer ──────────────────────────────────────────────────
    doc.setFillColor(...DARK);
    doc.rect(0, ph - 20, pw, 20, 'F');

    doc.setTextColor(...WHITE);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your prompt payment!', pw / 2, ph - 12, { align: 'center' });
    doc.setTextColor(148, 163, 184);
    doc.text('This is a computer-generated invoice.', pw / 2, ph - 7, { align: 'center' });

    doc.save(`Invoice-${invoice.invoice_no}.pdf`);
}
