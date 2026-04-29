import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminOrderService } from '../../../services/admin-order.service';
import { Order, OrderItem } from '../../../models/shop.models';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderWithItems extends Order {
  items?: OrderItem[];
}

interface TopProductStat {
  formationTitle: string;
  orderCount: number;
  quantity: number;
  revenue: number;
}

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css',
})
export class OrderListComponent implements OnInit {
  private adminOrderService = inject(AdminOrderService);

  orders: OrderWithItems[] = [];
  topProducts: TopProductStat[] = [];
  totalRevenue = 0;
  loading = true;
  error: string | null = null;
  deletingId: number | null = null;
  expandedOrderId: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.adminOrderService.getAllOrders().subscribe({
      next: (list) => {
        const sorted = (list ?? []).slice().sort((a, b) => (b.idOrder ?? 0) - (a.idOrder ?? 0));
        this.orders = sorted;
        this.totalRevenue = sorted.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
        sorted.forEach((order) => {
          if (order.idOrder == null) return;
          this.adminOrderService.getOrderItemsByOrderId(order.idOrder).subscribe({
            next: (items) => {
              (order as OrderWithItems).items = items ?? [];
            },
          });
        });
        this.loadTopProducts();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || err.message || 'Failed to load orders';
        this.loading = false;
      },
    });
  }

  private loadTopProducts(): void {
    this.adminOrderService.getAllOrderItems().subscribe({
      next: (allItems) => {
        const map = new Map<string, { orderCount: Set<number>; quantity: number; revenue: number }>();
        (allItems ?? []).forEach((item) => {
          const key = item.formationTitleSnapshot ?? 'Unknown';
          const unit = item.unitPriceSnapshot ?? 0;
          const qty = item.quantity ?? 0;
          const orderId = item.order?.idOrder ?? 0;
          if (!map.has(key)) {
            map.set(key, { orderCount: new Set(), quantity: 0, revenue: 0 });
          }
          const stat = map.get(key)!;
          stat.orderCount.add(orderId);
          stat.quantity += qty;
          stat.revenue += unit * qty;
        });
        this.topProducts = Array.from(map.entries())
          .map(([formationTitle, s]) => ({
            formationTitle,
            orderCount: s.orderCount.size,
            quantity: s.quantity,
            revenue: s.revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
      },
    });
  }

  toggleOrder(id: number | undefined): void {
    if (id == null) return;
    this.expandedOrderId = this.expandedOrderId === id ? null : id;
  }

  statusClass(status: string): string {
    if (status === 'COMPLETED' || status === 'APPROVED') return 'bg-success';
    if (status === 'PENDING') return 'bg-warning text-dark';
    if (status === 'CANCELLED') return 'bg-danger';
    return 'bg-secondary';
  }

  deleteOrder(order: Order): void {
    const id = order.idOrder;
    if (id == null) return;
    if (!confirm(`Delete order #${id}?`)) return;
    this.deletingId = id;
    this.adminOrderService.deleteOrder(id).subscribe({
      next: () => {
        this.orders = this.orders.filter((o) => o.idOrder !== id);
        this.totalRevenue = this.orders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
        this.deletingId = null;
      },
      error: () => {
        this.deletingId = null;
      },
    });
  }

  downloadPdf(order: OrderWithItems): void {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    // Branded header bar
    doc.setFillColor(22, 163, 74); // green
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('ForMe - Order Receipt', 14, 12);

    // Order title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text(`Order #${order.idOrder}`, 14, 30);

    // Order meta info
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const createdAt = order.createdAt ?? 'N/A';
    const status = order.status ?? 'N/A';
    const totalLine = `${order.totalAmount} ${order.currency ?? 'TND'}`;
    doc.text(`Date: ${createdAt}`, 14, 36);
    doc.text(`Status: ${status}`, 14, 42);
    doc.text(`User ID: ${order.userId}`, 120, 36);
    doc.text(`Total: ${totalLine}`, 120, 42);

    // Items table
    const items = order.items ?? [];
    const rows = items.map((i) => [
      i.formationTitleSnapshot ?? '',
      String(i.quantity ?? 0),
      `${i.unitPriceSnapshot ?? 0}`,
      `${(i.unitPriceSnapshot ?? 0) * (i.quantity ?? 0)}`,
    ]);

    autoTable(doc, {
      head: [['Course', 'Qty', 'Unit price', 'Subtotal']],
      body: rows,
      startY: 50,
      styles: { fontSize: 9, textColor: [30, 41, 59] },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });

    // Footer note
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for your purchase!', 14, pageHeight - 10);

    doc.save(`order-${order.idOrder}.pdf`);
  }
}
