import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a branded PDF report.
 *
 * @param {object} opts
 * @param {string}   opts.title        - Report title (e.g. "Daily Cash Book")
 * @param {string}   [opts.subtitle]   - Secondary line shown in header
 * @param {string}   [opts.filename]   - Output filename (auto-generated if omitted)
 * @param {string[]} opts.columns      - Column header labels
 * @param {any[][]}  opts.rows         - Table rows (array of arrays)
 * @param {string}   [opts.schoolName] - School name from auth context
 * @param {string}   [opts.term]       - Current term label
 * @param {string}   [opts.orientation]- 'portrait' | 'landscape'
 * @param {object[]} [opts.summaryRows]- [{label, value}] — shown above table
 */
export function exportPDF({
  title = 'Report',
  subtitle = '',
  filename,
  columns = [],
  rows = [],
  schoolName = 'Smart Bursar School',
  term = '',
  orientation,
  summaryRows = [],
}) {
  const isLandscape = orientation === 'landscape' || columns.length > 7;
  const doc = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });

  const pw  = doc.internal.pageSize.getWidth();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  /* ── Header band ────────────────────────────────────────────── */
  // Dark gradient band
  doc.setFillColor(15, 23, 42);           // slate-900
  doc.rect(0, 0, pw, 38, 'F');

  // Accent stripe
  doc.setFillColor(37, 99, 235);           // blue-600
  doc.rect(0, 38, pw, 3, 'F');

  // School name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(schoolName.toUpperCase(), 14, 13);

  // Report title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);         // slate-400
  doc.text('SMART BURSAR SCHOOL FINANCE SYSTEM', 14, 20);

  // Divider
  doc.setDrawColor(51, 65, 85);
  doc.line(14, 22, pw - 14, 22);

  // Report title (large)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 30);

  // Subtitle / term
  if (subtitle || term) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text([subtitle, term].filter(Boolean).join('  ·  '), 14, 36);
  }

  // Date + time (top-right)
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${dateStr}  ${timeStr}`, pw - 14, 30, { align: 'right' });

  let cursorY = 47;

  /* ── Summary boxes ─────────────────────────────────────────── */
  if (summaryRows.length > 0) {
    const boxW  = (pw - 28 - (summaryRows.length - 1) * 4) / summaryRows.length;
    summaryRows.forEach((s, i) => {
      const x = 14 + i * (boxW + 4);
      doc.setFillColor(248, 250, 252);      // gray-50
      doc.setDrawColor(226, 232, 240);      // gray-200
      doc.roundedRect(x, cursorY, boxW, 16, 2, 2, 'FD');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);      // slate-500
      doc.text(String(s.label).toUpperCase(), x + 4, cursorY + 6);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(String(s.value), x + 4, cursorY + 13);
    });
    cursorY += 22;
  }

  /* ── Table ─────────────────────────────────────────────────── */
  autoTable(doc, {
    startY: cursorY,
    head:   [columns],
    body:   rows,
    margin: { left: 14, right: 14 },
    styles: {
      fontSize:    8,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      textColor:   [30, 41, 59],
      lineColor:   [226, 232, 240],
      lineWidth:   0.2,
    },
    headStyles: {
      fillColor:   [15, 23, 42],
      textColor:   [255, 255, 255],
      fontStyle:   'bold',
      fontSize:    8,
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {},
    didDrawPage: (data) => {
      /* ── Footer on every page ── */
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, pageH - 12, pw, 12, 'F');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(schoolName, 14, pageH - 4.5);
      doc.text(
        `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`,
        pw - 14, pageH - 4.5, { align: 'right' }
      );
      doc.text('Confidential — For Internal Use Only', pw / 2, pageH - 4.5, { align: 'center' });
    },
  });

  const safeFilename = filename || `${title.toLowerCase().replace(/\s+/g, '-')}-${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
}
