import {
  Component, Input, OnChanges, OnDestroy, SimpleChanges,
  ElementRef, ViewChild, AfterViewInit, NgZone, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformDashboardData } from '../dashboard.component';

// ── Types ────────────────────────────────────────────────────────────────────

interface GraphNode {
  id: number;
  name: string;
  profession: string;
  formations: string[];
  cluster: number;
  risk: 'low' | 'medium' | 'high';
  riskScore: number;
  degree: number;
  x: number; y: number; vx: number; vy: number;
  _idx?: number;
}

interface GraphEdge {
  a: number; b: number;
  weight: number;
  shared: string[];
}

interface ClusterInfo {
  id: number;
  label: string;
  color: string;
  nodes: GraphNode[];
  topFormations: string[];
  atRisk: number;
  pct: number;
}

interface AiInsight {
  icon: string;
  title: string;
  text: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const COLORS  = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899'];
const LABELS  = ['Alpha','Beta','Gamma','Delta','Epsilon'];

// ── Node radius helper (shared between draw and hit-test) ─────────────────────
function nodeRadius(degree: number): number {
  return Math.min(7 + degree * 1.2, 16);   // FIX 1: cap radius at 16px
}

// ── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-learner-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learner-map.component.html',
  styleUrl: './learner-map.component.css',
})
export class LearnerMapComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() data!: PlatformDashboardData;
  @ViewChild('cvs') canvasRef!: ElementRef<HTMLCanvasElement>;

  // ── State ──────────────────────────────────────────────────────────────────
  nodes: GraphNode[] = [];
  edges: GraphEdge[] = [];
  clusters: ClusterInfo[] = [];

  totalNodes   = 0;
  totalEdges   = 0;
  totalClusters = 0;
  atRiskCount  = 0;
  isolatedCount = 0;
  studentCount  = 0;
  devCount      = 0;

  mode: 'force' | 'cluster' = 'force';
  selectedNode: GraphNode | null = null;
  hoveredNode:  GraphNode | null = null;
  tooltipX = 0; tooltipY = 0;

  aiLoading  = false;
  aiAnalyzed = false;
  aiInsights: AiInsight[] = [];
  aiError    = false;

  private ctx!: CanvasRenderingContext2D;
  private animId: number | null = null;
  private zoom  = 1;
  private offset = { x: 0, y: 0 };
  private drag: { node?: GraphNode; isPan: boolean; moved?: boolean } | null = null;
  private dpr   = window.devicePixelRatio || 1;
  private apiKey = localStorage.getItem('forme_ai_key') ?? '';
  private viewReady = false;

  readonly COLORS = COLORS;
  readonly LABELS = LABELS;

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
      this.resize();
      window.addEventListener('resize', this.onResize);
      this.viewReady = true;

      if (this.data) {
        this.zone.runOutsideAngular(() => {
          this.build();
          this.resetView();
          this.startSim();
        });
      }
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.zone.runOutsideAngular(() => {
        this.build();
        if (this.viewReady) {
          this.resetView();
          this.startSim();
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.onResize);
  }

  // ── Graph construction ─────────────────────────────────────────────────────

  private build(): void {
    const users     = this.data._rawUsers     ?? [];
    const items     = this.data._rawOrderItems ?? [];

    const userForms = new Map<number, Set<string>>();
    items.forEach((item: any) => {
      const uid  = item.userId ?? item.user_id ?? item.order?.userId;
      const title = item.formationTitleSnapshot ?? item.productName ?? item.formation?.title ?? 'Unknown';
      if (uid == null) return;
      if (!userForms.has(uid)) userForms.set(uid, new Set());
      userForms.get(uid)!.add(title);
    });

    const useReal = users.length >= 20;
    const sourceUsers = useReal ? users : this.syntheticUsers();

    const canvas = this.canvasRef?.nativeElement;
    const CW = (canvas?.clientWidth  || canvas?.getBoundingClientRect().width  || 900);
    const CH = (canvas?.clientHeight || canvas?.getBoundingClientRect().height || 560);

    this.nodes = sourceUsers.slice(0, 80).map((u: any) => ({
      id:   u.id,
      name: `${u.firstName ?? 'User'} ${u.lastName ?? u.id}`,
      profession: u.profession ?? 'STUDENT',
      formations: [...(userForms.get(u.id) ?? this.syntheticFormations(u.id))],
      cluster: -1, risk: 'low' as const, riskScore: 0, degree: 0,
      x: (Math.random() - 0.5) * CW * 0.7,
      y: (Math.random() - 0.5) * CH * 0.7,
      vx: 0, vy: 0,
    }));

    this.edges = [];
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const shared = this.nodes[i].formations.filter(f => this.nodes[j].formations.includes(f));
        if (shared.length > 0) this.edges.push({ a: i, b: j, weight: shared.length, shared });
      }
    }

    this.detectCommunities();

    const adjDeg = new Array(this.nodes.length).fill(0);
    this.edges.forEach(e => { adjDeg[e.a]++; adjDeg[e.b]++; });
    this.nodes.forEach((n, i) => {
      n.degree    = adjDeg[i];
      n.riskScore = n.degree === 0 ? 3 : n.degree === 1 ? 2 : n.formations.length <= 1 ? 1 : 0;
      n.risk      = (['low','low','medium','high'] as const)[n.riskScore];
    });

    this.buildClusters();
    this.zone.run(() => {
      this.totalNodes    = this.nodes.length;
      this.totalEdges    = this.edges.length;
      this.totalClusters = this.clusters.length;
      this.atRiskCount   = this.nodes.filter(n => n.risk === 'high').length;
      this.isolatedCount = this.nodes.filter(n => n.degree === 0).length;
      this.studentCount  = this.nodes.filter(n => n.profession === 'STUDENT').length;
      this.devCount      = this.nodes.filter(n => n.profession === 'DEVELOPER').length;
      this.cdr.markForCheck();
    });
  }

  private detectCommunities(): void {
    this.nodes.forEach((n, i) => n.cluster = i);
    const adj = new Map<number, {nb:number;w:number}[]>(this.nodes.map((_, i) => [i, []]));
    this.edges.forEach(e => { adj.get(e.a)!.push({nb:e.b,w:e.weight}); adj.get(e.b)!.push({nb:e.a,w:e.weight}); });

    let improved = true;
    for (let pass = 0; pass < 12 && improved; pass++) {
      improved = false;
      this.nodes.forEach((_, i) => {
        const nbClusters = new Map<number,number>();
        adj.get(i)!.forEach(({nb,w}) => nbClusters.set(this.nodes[nb].cluster, (nbClusters.get(this.nodes[nb].cluster)??0)+w));
        if (!nbClusters.size) return;
        const best = [...nbClusters.entries()].sort((a,b)=>b[1]-a[1])[0][0];
        if (best !== this.nodes[i].cluster) { this.nodes[i].cluster = best; improved = true; }
      });
    }

    const unique = [...new Set(this.nodes.map(n => n.cluster))].sort((a,b)=>a-b);
    const remap  = new Map(unique.map((c,i) => [c, i % 5]));
    this.nodes.forEach(n => n.cluster = remap.get(n.cluster)!);
  }

  private buildClusters(): void {
    const map = new Map<number, GraphNode[]>();
    this.nodes.forEach(n => { if (!map.has(n.cluster)) map.set(n.cluster,[]); map.get(n.cluster)!.push(n); });
    this.clusters = [...map.entries()]
      .sort((a,b) => b[1].length - a[1].length)
      .map(([c, ns]) => ({
        id: c, label: LABELS[c%5], color: COLORS[c%5], nodes: ns,
        topFormations: [...new Set(ns.flatMap(n => n.formations))].slice(0,2),
        atRisk: ns.filter(n => n.risk !== 'low').length,
        pct: Math.round(ns.length / this.nodes.length * 100),
      }));
  }

  // ── Physics simulation ─────────────────────────────────────────────────────

  private startSim(): void {
    if (this.animId) cancelAnimationFrame(this.animId);
    const tick = () => {
      this.physicsTick();
      this.draw();
      this.animId = requestAnimationFrame(tick);
    };
    this.animId = requestAnimationFrame(tick);
  }

  private physicsTick(): void {
    // Stronger damping — velocity bleeds off much faster → nodes settle
    this.nodes.forEach(n => { n.vx *= 0.72; n.vy *= 0.72; });

    if (this.mode === 'force') {
      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          const dx = this.nodes[i].x - this.nodes[j].x, dy = this.nodes[i].y - this.nodes[j].y;
          const d  = Math.max(Math.sqrt(dx*dx+dy*dy), 1);
          // Weaker repulsion (900 → was 1800) + min-distance floor so nearby nodes don't rocket apart
          const f = Math.min(900, 900/(d*d)) / d;
          this.nodes[i].vx += dx*f; this.nodes[i].vy += dy*f;
          this.nodes[j].vx -= dx*f; this.nodes[j].vy -= dy*f;
        }
      }
      this.edges.forEach(e => {
        const a = this.nodes[e.a], b = this.nodes[e.b];
        const dx = b.x-a.x, dy = b.y-a.y, d = Math.max(Math.sqrt(dx*dx+dy*dy), 1);
        // Weaker spring (0.025 → 0.018)
        const f  = (d - (60 + e.weight*20)) * 0.018;
        a.vx += dx/d*f; a.vy += dy/d*f;
        b.vx -= dx/d*f; b.vy -= dy/d*f;
      });
      // Weaker gravity (0.008 → 0.005)
      this.nodes.forEach(n => { n.vx += (0-n.x)*0.005; n.vy += (0-n.y)*0.005; });
    } else {
      const pos = [[-200,-130],[200,-130],[0,160],[-220,80],[220,80]];
      this.nodes.forEach(n => {
        const p = pos[n.cluster%5];
        // Weaker cluster pull (0.06 → 0.04)
        n.vx += (p[0]-n.x)*0.04; n.vy += (p[1]-n.y)*0.04;
      });
      this.edges.forEach(e => {
        const a=this.nodes[e.a], b=this.nodes[e.b];
        if (a.cluster !== b.cluster) return;
        const dx=b.x-a.x, dy=b.y-a.y, d=Math.max(Math.sqrt(dx*dx+dy*dy),1);
        const f = (d-50)*0.02;
        a.vx+=dx/d*f; a.vy+=dy/d*f; b.vx-=dx/d*f; b.vy-=dy/d*f;
      });
      for (let i=0;i<this.nodes.length;i++) for (let j=i+1;j<this.nodes.length;j++) {
        if (this.nodes[i].cluster !== this.nodes[j].cluster) continue;
        const dx=this.nodes[i].x-this.nodes[j].x, dy=this.nodes[i].y-this.nodes[j].y;
        const d=Math.max(Math.sqrt(dx*dx+dy*dy),1);
        // Weaker intra-cluster repulsion (800 → 500)
        const f=500/(d*d*d);
        this.nodes[i].vx+=dx*f; this.nodes[i].vy+=dy*f;
        this.nodes[j].vx-=dx*f; this.nodes[j].vy-=dy*f;
      }
    }

    this.nodes.forEach(n => {
      if (this.drag?.node === n) return;
      // Velocity threshold — snap to zero once nearly still to prevent endless micro-jitter
      if (Math.abs(n.vx) < 0.01) n.vx = 0;
      if (Math.abs(n.vy) < 0.01) n.vy = 0;
      n.x += n.vx; n.y += n.vy;
    });
  }

  // ── Canvas rendering ───────────────────────────────────────────────────────

  private worldToScreen(x:number,y:number):[number,number] {
    return [(x+this.offset.x)*this.zoom, (y+this.offset.y)*this.zoom];
  }
  private screenToWorld(x:number,y:number):[number,number] {
    return [x/this.zoom - this.offset.x, y/this.zoom - this.offset.y];
  }

  private draw(): void {
    const canvas = this.canvasRef.nativeElement;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    this.ctx.clearRect(0, 0, W, H);

    // FIX 2: In cluster mode, skip cross-cluster edges entirely
    const isClusterMode = this.mode === 'cluster';

    // Edges
    this.edges.forEach(e => {
      const a=this.nodes[e.a], b=this.nodes[e.b];

      // Hide cross-cluster edges when in cluster mode (they cause the mess)
      if (isClusterMode && a.cluster !== b.cluster) return;

      const [ax,ay]=this.worldToScreen(a.x,a.y), [bx,by]=this.worldToScreen(b.x,b.y);
      const sel = this.selectedNode && (e.a===this.selectedNode._idx||e.b===this.selectedNode._idx);
      this.ctx.beginPath();
      this.ctx.moveTo(ax,ay); this.ctx.lineTo(bx,by);
      this.ctx.strokeStyle = sel ? '#6366f190' : 'rgba(99,102,241,0.18)';
      this.ctx.lineWidth   = sel ? 1.5 : 0.5 + e.weight*0.25;
      this.ctx.stroke();
    });

    // Nodes
    this.nodes.forEach((n,i) => {
      n._idx = i;
      const [sx,sy] = this.worldToScreen(n.x, n.y);
      const r = nodeRadius(n.degree);   // FIX 1: use capped radius helper
      const col = COLORS[n.cluster%5];
      const isHov = this.hoveredNode===n, isSel = this.selectedNode===n;

      if (n.risk === 'high') {
        this.ctx.beginPath(); this.ctx.arc(sx,sy,r+5,0,Math.PI*2);
        this.ctx.strokeStyle = '#ef444445';
        this.ctx.lineWidth   = 2 + Math.sin(Date.now()/400)*1.5;
        this.ctx.stroke();
      }

      this.ctx.beginPath(); this.ctx.arc(sx,sy,r,0,Math.PI*2);
      this.ctx.fillStyle = col + (isHov||isSel ? 'ff' : 'cc');
      if (isHov||isSel) { this.ctx.shadowColor=col; this.ctx.shadowBlur=18; }
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      if (isSel) {
        this.ctx.strokeStyle = '#ffffff80'; this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }

      if (isHov || isSel || r > 13) {
        this.ctx.font      = `${Math.max(10, 11/this.zoom)}px DM Sans, sans-serif`;
        this.ctx.fillStyle = 'rgba(255,255,255,0.85)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(n.name.split(' ')[0], sx, sy - r - 4);
      }
    });
  }

  // ── Canvas event helpers ───────────────────────────────────────────────────

  private getNodeAt(mx:number,my:number): GraphNode|null {
    const [wx,wy] = this.screenToWorld(mx,my);
    for (let i=this.nodes.length-1;i>=0;i--) {
      const n=this.nodes[i];
      const r = nodeRadius(n.degree);   // FIX 3: use same capped radius for hit-test
      const dx=wx-n.x, dy=wy-n.y;
      if (dx*dx+dy*dy <= (r+5)*(r+5)) return n;
    }
    return null;
  }

  onMouseMove(e: MouseEvent): void {
    const r  = (e.target as HTMLElement).getBoundingClientRect();
    const mx = e.clientX-r.left, my = e.clientY-r.top;
    this.tooltipX = mx+14; this.tooltipY = my-10;

    if (this.drag) {
      if (this.drag.isPan) { this.offset.x += e.movementX/this.zoom; this.offset.y += e.movementY/this.zoom; }
      else if (this.drag.node) {
        const [wx,wy] = this.screenToWorld(mx,my);
        this.drag.node.x=wx; this.drag.node.y=wy; this.drag.node.vx=0; this.drag.node.vy=0;
        this.drag.moved = true;
      }
      return;
    }
    const n = this.getNodeAt(mx,my);
    if (n !== this.hoveredNode) { this.hoveredNode = n; this.zone.run(() => this.cdr.markForCheck()); }
  }

  onMouseDown(e: MouseEvent): void {
    const r  = (e.target as HTMLElement).getBoundingClientRect();
    const n  = this.getNodeAt(e.clientX-r.left, e.clientY-r.top);
    this.drag = n ? { node:n, isPan:false, moved:false } : { isPan:true };
  }

  onMouseUp(e: MouseEvent): void {
    if (this.drag && !this.drag.isPan && !this.drag.moved) {
      const r = (e.target as HTMLElement).getBoundingClientRect();
      const n = this.getNodeAt(e.clientX-r.left, e.clientY-r.top);
      if (n) this.zone.run(() => { this.selectedNode = this.selectedNode===n ? null : n; this.cdr.markForCheck(); });
    }
    this.drag = null;
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.zoom = Math.max(0.35, Math.min(3.5, this.zoom * (e.deltaY > 0 ? 0.9 : 1.11)));
  }

  // ── UI actions ─────────────────────────────────────────────────────────────

  setMode(m: 'force'|'cluster'): void { this.mode = m; }

  closeNode(): void { this.selectedNode = null; }

  focusCluster(c: number): void { this.setMode('cluster'); }

  resetView(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const W = canvas.clientWidth  || canvas.getBoundingClientRect().width  || 800;
    const H = canvas.clientHeight || canvas.getBoundingClientRect().height || 560;
    this.zoom = 1;
    this.offset.x = W / 2;
    this.offset.y = H / 2;
  }

  // ── Claude AI analysis ─────────────────────────────────────────────────────

  async runAI(): Promise<void> {
    if (this.aiLoading) return;
    this.aiLoading = true; this.aiError = false; this.aiInsights = [];
    this.cdr.markForCheck();

    const clusterSummary = this.clusters.map(cl =>
      `Cluster ${cl.label}: ${cl.nodes.length} learners, ${cl.atRisk} at-risk, top formations: ${cl.topFormations.join(', ') || 'N/A'}`
    ).join('\n');

    const prompt = `You are analyzing the learner intelligence neural graph for ForME — an online certification platform.

Graph data:
- Total learners mapped: ${this.totalNodes}
- Connections (shared formations): ${this.totalEdges}
- Isolated learners (no connections): ${this.isolatedCount}
- High-risk learners: ${this.atRiskCount}
- Students: ${this.studentCount} | Developers: ${this.devCount}

Community clusters detected by algorithm:
${clusterSummary}

Give exactly 3 sharp, actionable insights. Each must follow this exact format:
ICON | TITLE | BODY
Where ICON is one emoji, TITLE is 3-5 words, BODY is 1-2 sentences with a specific action.
Separate insights with newlines. No markdown, no numbering.
Focus on: dropout prevention, cluster health, cross-community opportunities, formation gaps.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      const raw  = json.content?.[0]?.text ?? '';
      this.aiInsights  = this.parseInsights(raw);
      this.aiAnalyzed  = true;
    } catch {
      this.aiInsights = this.localInsights();
      this.aiAnalyzed = true;
    }

    this.aiLoading = false;
    this.zone.run(() => this.cdr.markForCheck());
  }

  private parseInsights(raw: string): AiInsight[] {
    return raw.split('\n').filter(l => l.includes('|')).slice(0,3).map(line => {
      const parts = line.split('|').map(p => p.trim());
      return { icon: parts[0]||'💡', title: parts[1]||'Insight', text: parts[2]||'' };
    });
  }

  private localInsights(): AiInsight[] {
    const insights: AiInsight[] = [];
    if (this.isolatedCount > 0) insights.push({ icon:'🔴', title:'Isolated learners at risk', text:`${this.isolatedCount} learner${this.isolatedCount>1?'s':''} have zero shared formations with anyone else — they're invisible in the community. Send them a curated formation bundle recommendation this week.` });
    const biggest = this.clusters[0];
    if (biggest && biggest.pct > 40) insights.push({ icon:'🟡', title:'Cluster concentration', text:`The ${biggest.label} cluster holds ${biggest.pct}% of all learners. This over-concentration means a single formation going offline could affect nearly half your platform. Promote cross-cluster formations.` });
    insights.push({ icon:'🟢', title:'Network density healthy', text:`${this.totalEdges} connections across ${this.totalNodes} learners gives a solid foundation for peer learning programs. Consider creating cohort groups from the tightest clusters.` });
    return insights.slice(0,3);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private onResize = () => { this.resize(); };

  private resize(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const wrap = canvas.parentElement!;
    const W = wrap.clientWidth  || wrap.getBoundingClientRect().width  || 800;
    const H = wrap.clientHeight || wrap.getBoundingClientRect().height || 560;
    canvas.width  = W * this.dpr;
    canvas.height = H * this.dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private syntheticUsers() {
    const names = ['Ali Ben Ali','Sana Hamdi','Karim Trabelsi','Ines Mansour','Omar Kaabi',
                   'Nour Saad','Youssef Frikha','Meriem Jebali','Hamza Bousbia','Rim Zouari',
                   'Tarek Slim','Leila Cherif','Bilel Ayari','Amira Dridi','Soufien Hajri'];
    return Array.from({length:55},(_,i)=>({id:i+1,firstName:names[i%15].split(' ')[0],lastName:names[i%15].split(' ')[1],profession:['STUDENT','DEVELOPER','EVALUATOR','OTHER'][Math.floor(i/14)%4]}));
  }

  private syntheticFormations(id: number): string[] {
    const all=['Angular Advanced','Spring Boot','DevOps & Docker','Machine Learning','React Fundamentals','Cloud Essentials','Python Data Science','Kubernetes','SQL Mastery','Node.js APIs'];
    const cluster=Math.floor((id-1)/8)%5;
    const bases=[[0,1,2],[3,4,5],[6,7,8],[1,9],[2,5]];
    return bases[cluster].slice(0, 1+id%2).map(i=>all[i]);
  }

  clusterColor(c: number): string { return COLORS[c%5]; }
  clusterLabel(c: number): string { return LABELS[c%5]; }
  profIcon(p: string): string { return {STUDENT:'🎓',DEVELOPER:'💻',EVALUATOR:'⚖️',OTHER:'👤'}[p]||'👤'; }
}