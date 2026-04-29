import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformDashboardData } from '../dashboard.component';
import { StatisticsService } from '../../../../features/formation/services/statistics.service';

interface FormationHealth {
  name: string;
  health: number;
  completionRate: number;
  passRate: number;
  dropOffRisk: 'low' | 'medium' | 'high';
  studentsAtRisk: number;
  trend: 'up' | 'stable' | 'down';
  action: string;
}

interface EarlyWarning {
  severity: 'critical' | 'warning' | 'info';
  icon: string;
  title: string;
  detail: string;
  metric: string;
}

interface RevenueSegment {
  label: string;
  value: number;
  pct: number;
  color: string;
}

@Component({
  selector: 'app-shop-predictions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shop-predictions.component.html',
  styleUrl: './shop-predictions.component.css',
})
export class ShopPredictionsComponent implements OnChanges {
  @Input() data!: PlatformDashboardData;

  activeTab: 'health' | 'warnings' | 'revenue' = 'health';

  formationHealth: FormationHealth[] = [];
  earlyWarnings: EarlyWarning[] = [];
  revenueSegments: RevenueSegment[] = [];

  platformScore = 0;
  criticalCount = 0;
  totalAtRisk = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) this.compute();
  }

  setTab(tab: 'health' | 'warnings' | 'revenue') { this.activeTab = tab; }

  private compute(): void {
    this.buildFormationHealth();
    this.buildEarlyWarnings();
    this.buildRevenueSegments();
    this.platformScore = this.computePlatformScore();
    this.criticalCount = this.earlyWarnings.filter(w => w.severity === 'critical').length;
    this.totalAtRisk = this.formationHealth.reduce((s, f) => s + f.studentsAtRisk, 0);
  }

  private buildFormationHealth(): void {
    const analytics = this.data?.analytics;

    // ── DEBUG: log raw analytics shape to browser console ──────────────
    console.log('[AdminIC] analytics:', analytics);
    console.log('[AdminIC] _rawOrderItems sample:', this.data?._rawOrderItems?.slice(0, 2));
    console.log('[AdminIC] _rawProducts sample:', this.data?._rawProducts?.slice(0, 2));

    const completed    = analytics?.trainingCompletion?.topCompletedFormations ?? [];
    const abandoned    = analytics?.trainingCompletion?.topAbandonedFormations ?? [];
    const highFail     = analytics?.assessmentSuccess?.evaluationsWithHighFailure ?? [];
    const globalPass   = analytics?.assessmentSuccess?.successRatePercent ?? 0;
    const totalStarted = analytics?.trainingCompletion?.totalStarted ?? 0;
    const baseCompletion = analytics?.trainingCompletion?.completionRatePercent ?? 0;
    const basePass       = globalPass || (analytics?.assessmentSuccess?.successRatePercent ?? 0);

    const map = new Map<string, any>();

    // ── Layer 1: analytics topCompletedFormations ──
    completed.forEach((f: any) => {
      const title = f.formationTitle ?? f.title ?? f.name ?? f.formation?.title;
      if (title) map.set(title, { name: title, completionRate: f.rate ?? f.completionRate ?? 0, passRate: globalPass });
    });

    // ── Layer 2: analytics topAbandonedFormations ──
    abandoned.forEach((f: any) => {
      const title = f.formationTitle ?? f.title ?? f.name ?? f.formation?.title;
      if (title) {
        const ex = map.get(title) ?? {};
        map.set(title, { ...ex, name: title, completionRate: f.rate ?? f.completionRate ?? 0, passRate: basePass * 0.65 });
      }
    });

    highFail.forEach((e: any) => {
      const title = e.formationTitle ?? e.title ?? e.evaluationTitle;
      const entry = title ? map.get(title) : null;
      if (entry) entry.passRate = Math.max(0, (entry.passRate ?? globalPass) - (e.failureRate ?? 0) * 0.4);
    });

    // ── Layer 3: fallback — derive from _rawOrderItems ──────────────────
    if (map.size === 0 && (this.data?._rawOrderItems?.length ?? 0) > 0) {
      const orderMap = new Map<string, number>();
      (this.data._rawOrderItems as any[]).forEach((item: any) => {
        const name = item.formationTitleSnapshot
          ?? item.formation_title_snapshot
          ?? item.productName
          ?? item.product?.title ?? item.product?.name
          ?? item.formation?.title ?? item.formation?.nom
          ?? 'Unknown Formation';
        orderMap.set(name, (orderMap.get(name) ?? 0) + 1);
      });
      orderMap.forEach((_count, name) => {
        const seed = name.charCodeAt(0) % 7;
        const estimatedCompletion = Math.min(95, Math.max(20, (baseCompletion || 55) + (seed - 3) * 4));
        map.set(name, { name, completionRate: estimatedCompletion, passRate: basePass || 50 });
      });
    }

    // ── Layer 4: fallback — derive from _rawProducts ─────────────────────
    if (map.size === 0 && (this.data?._rawProducts?.length ?? 0) > 0) {
      (this.data._rawProducts as any[]).forEach((p: any, i: number) => {
        const name = p.title ?? p.name ?? p.nom ?? p.formationTitle ?? `Formation ${i + 1}`;
        const seed = name.charCodeAt(0) % 7;
        const estimatedCompletion = Math.min(95, Math.max(20, (baseCompletion || 55) + (seed - 3) * 4));
        map.set(name, { name, completionRate: estimatedCompletion, passRate: basePass || 50 });
      });
    }

    console.log('[AdminIC] formationHealth map size:', map.size, [...map.keys()]);

    this.formationHealth = Array.from(map.values()).map(f => {
      const completion = f.completionRate ?? 0;
      const pass = Math.round(f.passRate ?? 0);
      const health = Math.round(completion * 0.6 + pass * 0.4);
      const dropOffRisk: 'low' | 'medium' | 'high' = completion < 50 ? 'high' : completion < 70 ? 'medium' : 'low';
      const studentsAtRisk = Math.round(totalStarted * ((100 - completion) / 100) * 0.3);
      const trend: 'up' | 'stable' | 'down' = completion >= 75 ? 'up' : completion >= 55 ? 'stable' : 'down';
      const action = dropOffRisk === 'high' ? 'Review difficulty — schedule office hours'
        : dropOffRisk === 'medium' ? 'Add progress nudges at week 2'
        : 'Maintain quality — use as template';
      return {
        name: f.name.length > 26 ? f.name.slice(0, 26) + '…' : f.name,
        health, completionRate: completion, passRate: pass,
        dropOffRisk, studentsAtRisk, trend, action
      };
    }).sort((a, b) => a.health - b.health);
  }

  private buildEarlyWarnings(): void {
    const warnings: EarlyWarning[] = [];
    const analytics = this.data?.analytics;
    const orders = this.data?._rawOrders ?? [];
    const now = Date.now();

    const abandoned = analytics?.trainingCompletion?.topAbandonedFormations ?? [];
    abandoned.forEach((f: any) => {
      if (f.rate < 50) warnings.push({
        severity: 'critical', icon: '🔴',
        title: `Critical drop-off: ${f.formationTitle}`,
        detail: `Only ${f.rate}% complete this formation. ${f.count} learners abandoned.`,
        metric: `${f.rate}% completion`
      });
    });

    const highFail = analytics?.assessmentSuccess?.evaluationsWithHighFailure ?? [];
    highFail.forEach((e: any) => warnings.push({
      severity: e.failureRate > 55 ? 'critical' : 'warning',
      icon: e.failureRate > 55 ? '🔴' : '🟡',
      title: `High failure: ${e.evaluationTitle}`,
      detail: `${e.failureRate}% fail rate across ${e.attemptCount} attempts. Revise question difficulty.`,
      metric: `${e.failureRate}% fail`
    }));

    const passRate = analytics?.assessmentSuccess?.successRatePercent ?? 0;
    if (passRate < 60) warnings.push({
      severity: 'critical', icon: '🔴',
      title: 'Pass rate below threshold',
      detail: `${passRate}% overall pass rate is below the 60% minimum benchmark.`,
      metric: `${passRate}% pass rate`
    });

    const completionRate = analytics?.trainingCompletion?.completionRatePercent ?? 0;
    if (completionRate > 0 && completionRate < 60) warnings.push({
      severity: 'warning', icon: '🟡',
      title: 'Completion rate needs attention',
      detail: `${completionRate}% of started formations are completed. Add engagement nudges.`,
      metric: `${completionRate}% completion`
    });

    const aging = orders.filter(o =>
      (o.status ?? '').toUpperCase() === 'PENDING' && o.createdAt &&
      now - new Date(o.createdAt).getTime() > 2 * 86_400_000
    );
    if (aging.length > 0) warnings.push({
      severity: 'warning', icon: '🟡',
      title: `${aging.length} orders pending 48h+`,
      detail: `At-risk revenue: ${aging.reduce((s, o) => s + o.totalAmount, 0)} TND. Follow up with users.`,
      metric: `${aging.length} orders`
    });

    const top = analytics?.trainingCompletion?.topCompletedFormations ?? [];
    if (top.length > 0 && (top[0] as any).rate >= 75) warnings.push({
      severity: 'info', icon: '🟢',
      title: `Top performer: ${(top[0] as any).formationTitle}`,
      detail: `${(top[0] as any).rate}% completion. Use this formation as a structural template.`,
      metric: `${(top[0] as any).rate}% completion`
    });

    if (warnings.length === 0) warnings.push({
      severity: 'info', icon: '🟢',
      title: 'All systems healthy',
      detail: 'No critical issues detected. Platform metrics are within acceptable ranges.',
      metric: '✓ Healthy'
    });

    const order = { critical: 0, warning: 1, info: 2 };
    this.earlyWarnings = warnings.sort((a, b) => order[a.severity] - order[b.severity]);
  }

  private buildRevenueSegments(): void {
    const orders = this.data?._rawOrders ?? [];
    const items  = this.data?._rawOrderItems ?? [];
    const total  = orders.reduce((s, o) => s + (o.totalAmount ?? 0), 0);
    if (total === 0) { this.revenueSegments = []; return; }

    const map = new Map<string, number>();
    items.forEach((item: any) => {
      const name = item.formationTitleSnapshot || 'Other';
      const itemTotal = (item.unitPriceSnapshot ?? 0) * (item.quantity ?? 1);
      map.set(name, (map.get(name) ?? 0) + itemTotal);
    });

    // Fallback: if items have no price data, split revenue equally per product name
    if (map.size === 0 || Array.from(map.values()).every(v => v === 0)) {
      const nameMap = new Map<string, number>();
      items.forEach((item: any) => {
        const name = item.formationTitleSnapshot || 'Unknown Formation';
        nameMap.set(name, (nameMap.get(name) ?? 0) + 1);
      });
      if (nameMap.size > 0) {
        nameMap.forEach((count, name) => {
          map.set(name, Math.round((count / items.length) * total));
        });
      } else {
        // Last resort: group by order status
        const byStatus = new Map<string, number>();
        orders.forEach(o => {
          const key = (o.status ?? 'Other');
          byStatus.set(key, (byStatus.get(key) ?? 0) + (o.totalAmount ?? 0));
        });
        byStatus.forEach((val, key) => map.set(key, val));
      }
    }

    const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#94a3b8'];
    this.revenueSegments = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value], i) => ({
        label: label.length > 22 ? label.slice(0, 22) + '…' : label,
        value: Math.round(value),
        pct: Math.round((value / total) * 100),
        color: colors[i]
      }));
  }

  private computePlatformScore(): number {
    const a = this.data?.analytics;
    const completion = a?.trainingCompletion?.completionRatePercent ?? 0;
    const pass       = a?.assessmentSuccess?.successRatePercent ?? 0;
    const active     = this.data?.totalUsers > 0
      ? Math.round((this.data.activeUsers / this.data.totalUsers) * 100) : 0;
    return Math.round(completion * 0.4 + pass * 0.4 + active * 0.2);
  }
  get totalRevenue(): number {
  return this.revenueSegments.reduce((s, seg) => s + seg.value, 0);
}

  get scoreColor(): string {
    return this.platformScore >= 70 ? '#22c55e' : this.platformScore >= 50 ? '#f59e0b' : '#ef4444';
  }
  get scoreLabel(): string {
    return this.platformScore >= 70 ? 'Excellent' : this.platformScore >= 50 ? 'Needs Work' : 'At Risk';
  }
  get donutCircumference(): number { return 2 * Math.PI * 36; }
  get scoreDashOffset(): number {
    return this.donutCircumference - (this.platformScore / 100) * this.donutCircumference;
  }
  healthColor(s: number) { return s >= 70 ? 'good' : s >= 50 ? 'medium' : 'poor'; }
  riskBadge(r: string)   { return r === 'high' ? 'badge-high' : r === 'medium' ? 'badge-medium' : 'badge-low'; }
  trendIcon(t: string)   { return t === 'up' ? 'bi-arrow-up-circle-fill' : t === 'down' ? 'bi-arrow-down-circle-fill' : 'bi-dash-circle-fill'; }
  trendClass(t: string)  { return t === 'up' ? 'trend-up' : t === 'down' ? 'trend-down' : 'trend-stable'; }
}