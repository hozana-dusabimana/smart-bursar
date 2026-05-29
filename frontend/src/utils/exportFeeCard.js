import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export a fully-formatted Student Fee Card PDF.
 * Mirrors the on-screen fee card layout with:
 *  - School + student header
 *  - Summary stat boxes (Total Fee / Paid / Balance / Status)
 *  - Payment progress bar
 *  - Fee Structure breakdown
 *  - Payment History table with running balance
 *  - Totals footer row
 */
export function exportFeeCardPDF({ studentData, schoolName = 'Smart Bursar School' }) {
  const { student, summary, feeStructure, payments } = studentData;

  const fee     = Number(summary?.fee)     || 0;
  const paid    = Number(summary?.paid)    || 0;
  const balance = Number(summary?.balance) || 0;
  const pct     = fee ? Math.round((paid / fee) * 100) : 0;
  const status  = !fee ? 'No Invoice' : paid >= fee ? 'Cleared' : paid > 0 ? 'Partial' : 'Unpaid';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw  = doc.internal.pageSize.getWidth();   // 210
  const ph  = doc.internal.pageSize.getHeight();  // 297

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const fmt = (n) => 'RWF ' + Number(n || 0).toLocaleString();

  // ── Palette ──────────────────────────────────────────────────
  const DARK    = [15, 23, 42];      // slate-900
  const BLUE    = [37, 99, 235];     // blue-600
  const BLUE_LT = [219, 234, 254];   // blue-100
  const GRAY    = [248, 250, 252];   // gray-50
  const BORDER  = [226, 232, 240];   // gray-200
  const TEXT    = [30, 41, 59];      // slate-800
  const MUTED   = [100, 116, 139];   // slate-500
  const WHITE   = [255, 255, 255];
  const GREEN   = [5, 150, 105];     // emerald-600
  const RED     = [220, 38, 38];     // red-600
  const GREEN_BG= [209, 250, 229];   // emerald-100
  const RED_BG  = [254, 226, 226];   // red-100

  // ── Header band ──────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pw, 42, 'F');

  // Blue accent stripe
  doc.setFillColor(...BLUE);
  doc.rect(0, 42, pw, 3, 'F');

  // School name
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(schoolName.toUpperCase(), 14, 12);

  // System subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('SMART BURSAR — SCHOOL FINANCE SYSTEM', 14, 18);

  // Divider line
  doc.setDrawColor(51, 65, 85);
  doc.line(14, 20, pw - 14, 20);

  // Report label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  doc.text('STUDENT FEE CARD', 14, 28);

  // Term / date top-right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${dateStr}  ${timeStr}`, pw - 14, 28, { align: 'right' });

  // Academic term (if available via summary)
  if (summary?.term) {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(summary.term, 14, 35);
  }

  // ── Student Info card ────────────────────────────────────────
  let y = 52;

  // Avatar circle
  const initials = (student?.full_name || 'S')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  doc.setFillColor(...BLUE);
  doc.circle(22, y + 6, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text(initials, 22, y + 7.2, { align: 'center' });

  // Student name + admission no
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TEXT);
  doc.text(student?.full_name || '—', 33, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`Adm No: ${student?.admission_no || '—'}`, 33, y + 9);

  // Right: class + guardian info
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const classLabel = `Class ${student?.class || ''} ${student?.stream || ''}`.trim();
  doc.text(classLabel, pw - 14, y + 4, { align: 'right' });
  doc.text(`Guardian: ${student?.guardian_name || '—'}`, pw - 14, y + 9, { align: 'right' });
  doc.text(`Tel: ${student?.guardian_tel || '—'}`, pw - 14, y + 14, { align: 'right' });

  // Status badge
  const statusColor = status === 'Cleared' ? GREEN : status === 'Partial' ? [202, 138, 4] : RED;
  const statusBg    = status === 'Cleared' ? GREEN_BG : status === 'Partial' ? [254, 249, 195] : RED_BG;
  doc.setFillColor(...statusBg);
  doc.setDrawColor(...statusColor);
  doc.roundedRect(33, y + 12, 22, 6, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...statusColor);
  doc.text(status.toUpperCase(), 44, y + 16, { align: 'center' });

  y += 24;

  // ── Summary boxes ────────────────────────────────────────────
  const boxes = [
    { label: 'TOTAL FEE',  value: fmt(fee),     bg: GRAY,     textC: TEXT,  valueC: TEXT  },
    { label: 'AMOUNT PAID',value: fmt(paid),    bg: GREEN_BG, textC: [6, 95, 70], valueC: [4, 120, 87] },
    { label: 'BALANCE DUE',value: fmt(balance), bg: balance > 0 ? RED_BG : GREEN_BG,
      textC: balance > 0 ? [153, 27, 27] : [6, 95, 70],
      valueC: balance > 0 ? RED : GREEN },
  ];
  const boxW = (pw - 28 - 2 * 4) / 3;
  boxes.forEach((b, i) => {
    const x = 14 + i * (boxW + 4);
    doc.setFillColor(...b.bg);
    doc.setDrawColor(...BORDER);
    doc.roundedRect(x, y, boxW, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...b.textC);
    doc.text(b.label, x + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...b.valueC);
    doc.text(b.value, x + 4, y + 14);
  });
  y += 24;

  // ── Progress bar ─────────────────────────────────────────────
  doc.setFillColor(...GRAY);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(14, y, pw - 28, 12, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text('Payment Progress', 18, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT);
  doc.text(`${pct}% paid`, pw - 18, y + 4.5, { align: 'right' });

  // Bar background
  const barX = 18;
  const barY = y + 7;
  const barW = pw - 36;
  const barH = 2.5;
  doc.setFillColor(...BORDER);
  doc.roundedRect(barX, barY, barW, barH, 1, 1, 'F');
  // Bar fill
  const fillColor = pct === 100 ? GREEN : pct > 50 ? BLUE : [251, 146, 60]; // orange
  doc.setFillColor(...fillColor);
  if (pct > 0) doc.roundedRect(barX, barY, (barW * pct) / 100, barH, 1, 1, 'F');
  y += 18;

  // ── Fee Structure table ───────────────────────────────────────
  if (feeStructure) {
    // Section header
    doc.setFillColor(...DARK);
    doc.rect(14, y, pw - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...WHITE);
    doc.text(`FEE STRUCTURE — CLASS ${student?.class || ''}`, 18, y + 4.8);
    y += 7;

    const structureRows = [
      ['Tuition Fee',  fmt(feeStructure.tuition)],
      ['Activity Fee', fmt(feeStructure.activity)],
    ];
    if (feeStructure.transport > 0) {
      structureRows.push(['Transport Fee', fmt(feeStructure.transport)]);
    }

    autoTable(doc, {
      startY: y,
      body: structureRows,
      foot: [['TOTAL', fmt(fee)]],
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 8,
        cellPadding: { top: 2.5, right: 4, bottom: 2.5, left: 4 },
        textColor: TEXT,
        lineColor: BORDER,
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: { fillColor: GRAY },
      footStyles: {
        fillColor: DARK,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'right',
      },
      showHead: false,
    });

    y = doc.lastAutoTable.finalY + 6;
  }

  // ── Payment History table ─────────────────────────────────────
  // Section header
  doc.setFillColor(...DARK);
  doc.rect(14, y, pw - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text('PAYMENT HISTORY', 18, y + 4.8);
  y += 7;

  if (payments.length === 0) {
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(252, 165, 165);
    doc.roundedRect(14, y, pw - 28, 12, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...RED);
    doc.text('No payments recorded this term.', pw / 2, y + 7.5, { align: 'center' });
    y += 18;
  } else {
    let running = fee;
    const payRows = payments.map((p, i) => {
      running -= Number(p.amount);
      const bal = Math.max(0, running);
      return [
        String(i + 1),
        p.receipt_no || '—',
        String(p.payment_date || '').slice(0, 10),
        p.payment_method || '—',
        p.reference || '—',
        fmt(p.amount),
        fmt(bal),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['#', 'Receipt No.', 'Date', 'Method', 'Reference', 'Amount', 'Running Balance']],
      body: payRows,
      foot: [[
        { content: 'TOTAL PAID', colSpan: 5, styles: { halign: 'left', fontStyle: 'bold' } },
        { content: fmt(paid), styles: { halign: 'right', fontStyle: 'bold' } },
        {
          content: `${fmt(balance)} remaining`,
          styles: {
            halign: 'right',
            fontStyle: 'bold',
            textColor: balance <= 0 ? GREEN_BG : RED,
          }
        },
      ]],
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 7.5,
        cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
        textColor: TEXT,
        lineColor: BORDER,
        lineWidth: 0.2,
        overflow: 'ellipsize',
      },
      headStyles: {
        fillColor: DARK,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: { top: 3.5, right: 3, bottom: 3.5, left: 3 },
      },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center', textColor: MUTED },
        1: { cellWidth: 28, fontStyle: 'bold' },
        2: { cellWidth: 22 },
        3: { cellWidth: 20 },
        4: { cellWidth: 28, textColor: MUTED },
        5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
        6: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      },
      alternateRowStyles: { fillColor: GRAY },
      footStyles: {
        fillColor: BLUE,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 7.5,
      },

      // Color the running balance column per row
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 6) {
          const row = payments[data.row.index];
          if (!row) return;
          // Recalculate running balance for this row
          let r = fee;
          for (let i = 0; i <= data.row.index; i++) r -= Number(payments[i].amount);
          data.cell.styles.textColor = r <= 0 ? GREEN : RED;
        }
      },
    });

    y = doc.lastAutoTable.finalY + 6;
  }

  // ── Footer on every page ──────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let pg = 1; pg <= totalPages; pg++) {
    doc.setPage(pg);
    doc.setFillColor(...DARK);
    doc.rect(0, ph - 12, pw, 12, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(schoolName, 14, ph - 4.5);
    doc.text(
      `Page ${pg} of ${totalPages}`,
      pw - 14, ph - 4.5, { align: 'right' }
    );
    doc.text('Confidential — For Internal Use Only', pw / 2, ph - 4.5, { align: 'center' });
  }

  const filename = `fee-card-${student?.admission_no || 'student'}-${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}