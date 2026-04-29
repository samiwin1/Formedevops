import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AccessCode, Partner, Deal } from '../models/business.models';

@Injectable({ providedIn: 'root' })
export class PdfService {

  private getStatus(code: AccessCode): string {
    if (code.used) return 'Used';
    if (new Date(code.expirationDate) < new Date()) return 'Expired';
    return 'Active';
  }

  // ✅ Export liste complète
  exportAccessCodes(codes: AccessCode[], partners: Partner[], deals: Deal[]): void {
    const doc = new jsPDF();

    const partnerName = (id: number) => partners.find(p => p.id === id)?.name || `#${id}`;
    const dealTitle   = (id: number) => deals.find(d => d.id === id)?.title  || `#${id}`;

    const active  = codes.filter(c => this.getStatus(c) === 'Active').length;
    const expired = codes.filter(c => this.getStatus(c) === 'Expired').length;
    const used    = codes.filter(c => this.getStatus(c) === 'Used').length;

    // ── Header vert ──────────────────────────────────────────────────────
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, 220, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Access Codes Report', 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}   |   Total: ${codes.length} codes`, 14, 22);

    // ── 3 mini cards ─────────────────────────────────────────────────────
    const cards = [
      { label: 'Active',   value: active,  x: 14,  fill: [240,253,244] as [number,number,number], text: [22,163,74]   as [number,number,number] },
      { label: 'Expired',  value: expired, x: 78,  fill: [254,242,242] as [number,number,number], text: [220,38,38]   as [number,number,number] },
      { label: 'Used',     value: used,    x: 142, fill: [243,244,246] as [number,number,number], text: [107,114,128] as [number,number,number] },
    ];

    cards.forEach(card => {
      doc.setFillColor(...card.fill);
      doc.roundedRect(card.x, 33, 55, 18, 3, 3, 'F');
      doc.setTextColor(...card.text);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(String(card.value), card.x + 27, 44, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label, card.x + 27, 49, { align: 'center' });
    });

    // ── Tableau ──────────────────────────────────────────────────────────
    autoTable(doc, {
      startY: 58,
      head: [['#', 'Code', 'Partner', 'Deal', 'Expiration', 'Status']],
      body: codes.map((c, i) => [
        String(i + 1),
        c.code,
        partnerName(c.partnerId),
        dealTitle(c.dealId),
        new Date(c.expirationDate).toLocaleDateString('en-GB'),
        this.getStatus(c),
      ]),
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 },
        4: { cellWidth: 28, halign: 'center' },
        5: { cellWidth: 22, halign: 'center' },
      },
      willDrawCell: (data) => {
        // ✅ Colorise la colonne Status
        if (data.column.index === 5 && data.section === 'body') {
          const val = data.cell.text[0];
          const c = val === 'Active' ? [22,163,74] : val === 'Expired' ? [220,38,38] : [107,114,128];
          data.cell.styles.textColor = c as [number, number, number];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 14, right: 14 },
    });

    // ── Footer pagination ────────────────────────────────────────────────
    const pages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} / ${pages}`, doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 8, { align: 'center' });
    }

    doc.save(`access-codes-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // ✅ Carte individuelle d'un seul code (format A6 paysage)
  exportSingleCode(code: AccessCode, partner: string, deal: string): void {
    const doc = new jsPDF({ orientation: 'landscape', format: [148, 105] });
    const status = this.getStatus(code);
    const color: [number,number,number] =
      status === 'Active'  ? [22,163,74] :
      status === 'Expired' ? [220,38,38] : [107,114,128];

    doc.setFillColor(...color);
    doc.rect(0, 0, 148, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('ACCESS CODE', 74, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(status.toUpperCase(), 74, 18, { align: 'center' });

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(30);
    doc.setFont('courier', 'bold');
    doc.text(code.code, 74, 52, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`Partner:    ${partner}`, 18, 68);
    doc.text(`Deal:         ${deal}`, 18, 77);
    doc.text(`Expires:    ${new Date(code.expirationDate).toLocaleDateString('en-GB')}`, 18, 86);

    doc.setDrawColor(...color);
    doc.setLineWidth(1.5);
    doc.roundedRect(4, 4, 140, 97, 4, 4);

    doc.save(`code-${code.code}.pdf`);
  }
}