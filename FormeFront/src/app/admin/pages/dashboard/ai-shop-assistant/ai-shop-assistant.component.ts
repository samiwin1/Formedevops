import { Component, Input, OnChanges, OnInit, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformDashboardData } from '../dashboard.component';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  loading?: boolean;
  sources?: string[];   // RAG: which data chunks were used
}

interface RagChunk {
  id: string;
  topic: string;
  content: string;
  keywords: string[];
}

@Component({
  selector: 'app-ai-shop-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-shop-assistant.component.html',
  styleUrl: './ai-shop-assistant.component.css',
})
export class AiShopAssistantComponent implements OnChanges, OnInit {
  @Input() data!: PlatformDashboardData;
  @ViewChild('chatEnd') chatEnd!: ElementRef;

  apiKey: string = localStorage.getItem('forme_groq_key') ?? '';
  showKeyPrompt = false;

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      text: "Hi! I'm ForME AI 🤖 I know your real platform data — certifications, learners, shop orders, revenue. Ask me anything or click a suggestion below.",
    },
  ];

  input = '';
  isTyping = false;
  dataReady = false;

  // RAG: in-memory knowledge base built from live platform data
  private ragChunks: RagChunk[] = [];

  readonly SUGGESTED = [
    'What is our best selling certification?',
    'Which orders are at risk of abandonment?',
    'Predict next month revenue',
    'What should we promote this week?',
    'How is our completion rate?',
    'Give me a full platform summary',
  ];

  ngOnInit(): void {
    if (!this.apiKey) this.showKeyPrompt = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.dataReady = true;
      this.buildRagChunks(); // rebuild the RAG knowledge base whenever data changes
    }
  }

  saveKey(): void {
    const k = this.apiKey.trim();
    if (!k) return;
    localStorage.setItem('forme_groq_key', k);
    this.apiKey = k;
    this.showKeyPrompt = false;
  }

  clearKey(): void {
    localStorage.removeItem('forme_groq_key');
    this.apiKey = '';
    this.showKeyPrompt = true;
  }

  async send(): Promise<void> {
    if (!this.apiKey) { this.showKeyPrompt = true; return; }
    const text = this.input.trim();
    if (!text || this.isTyping) return;

    this.input = '';
    this.messages.push({ role: 'user', text });
    this.isTyping = true;
    this.messages.push({ role: 'assistant', text: '', loading: true });
    this.scrollToBottom();

    try {
      const { answer, sources } = await this.callGeminiWithRAG(text);
      this.finishResponse(answer, sources);
    } catch (err: any) {
      console.error('Groq error:', err);
      const msg = err?.message ?? '';
      if (msg.includes('401') || msg.includes('API_KEY') || msg.includes('invalid') || msg.includes('auth')) {
        localStorage.removeItem('forme_groq_key');
        this.apiKey = '';
        this.showKeyPrompt = true;
        this.finishResponse('❌ Invalid API key. Please enter a valid Groq API key from console.groq.com');
      } else if (msg.includes('429')) {
        this.finishResponse('⚠️ Rate limit reached. Please wait a moment and try again.');
      } else {
        this.finishResponse(`⚠️ Could not reach Groq API. Error: ${msg.slice(0, 120)}`);
      }
    }
  }

  sendSuggestion(text: string): void {
    this.input = text;
    this.send();
  }

  // ── RAG: Build Knowledge Base from Platform Data ──────────────────────────
  // Each chunk covers a specific topic domain. At query time we retrieve
  // the most relevant chunks and inject them as context into the LLM prompt.
  private buildRagChunks(): void {
    const orders     = this.data?._rawOrders     ?? [];
    const orderItems = this.data?._rawOrderItems ?? [];
    const products   = this.data?._rawProducts   ?? [];
    const analytics  = this.data?.analytics;
    const now        = Date.now();
    const DAY        = 86_400_000;
    const WEEK       = 7 * DAY;

    // ── Revenue & Orders chunk ──
    const totalRev   = orders.reduce((s: number, o: any) => s + (o.totalAmount ?? 0), 0);
    const completed  = orders.filter((o: any) => ['COMPLETED','APPROVED'].includes((o.status ?? '').toUpperCase()));
    const pending    = orders.filter((o: any) => (o.status ?? '').toUpperCase() === 'PENDING');
    const cancelled  = orders.filter((o: any) => (o.status ?? '').toUpperCase() === 'CANCELLED');
    const weekOrders = orders.filter((o: any) => o.createdAt && now - new Date(o.createdAt).getTime() < WEEK);
    const weekRev    = weekOrders.reduce((s: number, o: any) => s + (o.totalAmount ?? 0), 0);
    const prevWeekRev = orders.filter((o: any) => {
      if (!o.createdAt) return false;
      const age = now - new Date(o.createdAt).getTime();
      return age >= WEEK && age < 2 * WEEK;
    }).reduce((s: number, o: any) => s + (o.totalAmount ?? 0), 0);
    const growthPct = prevWeekRev > 0 ? Math.round(((weekRev - prevWeekRev) / prevWeekRev) * 100) : weekRev > 0 ? 100 : 0;
    const avgOrder   = orders.length > 0 ? Math.round(totalRev / orders.length) : 0;
    const monthRev   = orders.filter((o: any) => o.createdAt && now - new Date(o.createdAt).getTime() < 30 * DAY)
      .reduce((s: number, o: any) => s + (o.totalAmount ?? 0), 0);

    this.ragChunks = [];

    this.ragChunks.push({
      id: 'revenue',
      topic: 'Revenue & Orders',
      keywords: ['revenue','sales','money','earn','income','total','order','payment','transaction','billing'],
      content: `REVENUE & ORDERS DATA:
- Total orders: ${orders.length} (${completed.length} completed, ${pending.length} pending, ${cancelled.length} cancelled)
- Total revenue all-time: ${totalRev.toFixed(2)} TND
- Revenue this week: ${weekRev.toFixed(2)} TND (${growthPct >= 0 ? '+' : ''}${growthPct}% vs last week)
- Revenue last 30 days: ${monthRev.toFixed(2)} TND
- Average order value: ${avgOrder} TND
- Revenue growth trend: ${this.data?.revenueGrowth ?? growthPct}%`
    });

    // ── At-risk orders chunk ──
    const atRisk = pending.filter((o: any) => o.createdAt && now - new Date(o.createdAt).getTime() > DAY);
    const atRiskRev = atRisk.reduce((s: number, o: any) => s + (o.totalAmount ?? 0), 0);
    this.ragChunks.push({
      id: 'atrisk',
      topic: 'At-Risk & Pending Orders',
      keywords: ['risk','abandon','pending','stuck','old','cart','incomplete','convert','follow','chase'],
      content: `AT-RISK ORDERS DATA:
- Total pending orders: ${pending.length}
- At-risk orders (pending > 24h): ${atRisk.length}
- Revenue at risk: ${atRiskRev.toFixed(2)} TND
- At-risk order IDs: ${atRisk.slice(0,8).map((o:any) => `#${o.idOrder ?? o.id}`).join(', ') || 'none'}
- Recommendation: Send reminder emails or discount codes to convert these orders`
    });

    // ── Products / Top Sellers chunk ──
    const productMap = new Map<string, { count: number; revenue: number }>();
    orderItems.forEach((item: any) => {
      const name = item.formationTitleSnapshot || 'Unknown';
      const e = productMap.get(name) ?? { count: 0, revenue: 0 };
      e.count++;
      e.revenue += (item.unitPriceSnapshot ?? 0) * (item.quantity ?? 1);
      productMap.set(name, e);
    });
    const topProducts = Array.from(productMap.entries()).sort((a, b) => b[1].count - a[1].count);
    const availableProducts = products.filter((p:any) => p.isAvailable);
    this.ragChunks.push({
      id: 'products',
      topic: 'Products & Best Sellers',
      keywords: ['product','sell','popular','best','top','certification','certif','shop','buy','purchase','catalog'],
      content: `PRODUCTS & BEST SELLERS DATA:
- Total products in catalog: ${products.length} (${availableProducts.length} available)
- Total unique certifications sold: ${productMap.size}
- Top selling certifications:
${topProducts.slice(0,8).map(([name,s],i) => `  ${i+1}. "${name}" — ${s.count} sales, ${s.revenue.toFixed(0)} TND revenue`).join('\n') || '  No sales data yet'}
- Least selling (opportunity): ${topProducts.slice(-3).map(([n])=>`"${n}"`).join(', ') || 'N/A'}`
    });

    // ── Users & Learners chunk ──
    this.ragChunks.push({
      id: 'users',
      topic: 'Users & Learners',
      keywords: ['user','learner','student','people','enroll','register','active','new','member','account'],
      content: `USERS & LEARNERS DATA:
- Total users on platform: ${this.data?.totalUsers ?? 0}
- Active users: ${this.data?.activeUsers ?? 0} (${this.data?.totalUsers ? Math.round((this.data.activeUsers / this.data.totalUsers)*100) : 0}% active rate)
- New users this week: ${this.data?.newUsersThisWeek ?? 0}
- Users enrolled in formations: ${analytics?.trainingCompletion?.totalStarted ?? 0}
- Users who completed training: ${analytics?.trainingCompletion?.totalCompleted ?? 0}`
    });

    // ── Certifications chunk ──
    this.ragChunks.push({
      id: 'certifications',
      topic: 'Certifications & Formations',
      keywords: ['certif','certificate','formation','cours','complete','finish','progress','rate','training','learn','study','score','assess'],
      content: `CERTIFICATIONS & FORMATIONS DATA:
- Certifications issued (all-time): ${this.data?.issuedCerts ?? 0}
- Certifications pending review: ${this.data?.pendingCerts ?? 0}
- Upcoming oral sessions: ${this.data?.upcomingSessions?.length ?? 0}
- Completion rate: ${analytics?.trainingCompletion?.completionRatePercent ?? 0}%
- Total started formations: ${analytics?.trainingCompletion?.totalStarted ?? 0}
- Total completed formations: ${analytics?.trainingCompletion?.totalCompleted ?? 0}
- Assessment pass rate: ${analytics?.assessmentSuccess?.successRatePercent ?? 0}%
- Average assessment score: ${Math.round(analytics?.assessmentSuccess?.averageScore ?? 0)}/100
- Total assessment attempts: ${analytics?.assessmentSuccess?.totalAttempts ?? 0}
- Top formations by completion:
${(analytics?.trainingCompletion?.topCompletedFormations ?? []).slice(0,5).map((f:any,i:number) => `  ${i+1}. "${f.formationTitle}" — ${f.rate ?? f.completionRate ?? 0}% completion`).join('\n') || '  No data yet'}`
    });

    // ── Predictions & Forecasting chunk ──
    const predictedRev = Math.round(monthRev * (1 + ((this.data?.revenueGrowth ?? growthPct) / 100)));
    const completionRate = analytics?.trainingCompletion?.completionRatePercent ?? 0;
    this.ragChunks.push({
      id: 'predictions',
      topic: 'Predictions & Forecasting',
      keywords: ['predict','forecast','next','future','trend','grow','expect','estimate','projection','will','should'],
      content: `PREDICTIONS & FORECAST DATA:
- Last 30-day revenue: ${monthRev.toFixed(0)} TND
- Current growth rate: ${this.data?.revenueGrowth ?? growthPct}%
- Predicted next month revenue: ~${predictedRev} TND
- Conversion opportunity: ${pending.length} pending orders could generate ${pending.reduce((s:number,o:any) => s+(o.totalAmount??0),0).toFixed(0)} TND if completed
- Completion trend: ${completionRate >= 70 ? 'Strong' : completionRate >= 50 ? 'Moderate' : 'Needs improvement'} at ${completionRate}%
- New user acquisition: ${this.data?.newUsersThisWeek ?? 0} this week — if maintained, ~${(this.data?.newUsersThisWeek ?? 0)*4} new users/month`
    });

    // ── Promotions chunk ──
    const topFormations = analytics?.trainingCompletion?.topCompletedFormations ?? [];
    this.ragChunks.push({
      id: 'promotions',
      topic: 'Promotions & Marketing',
      keywords: ['promot','market','push','campaign','recommend','advertis','boost','focus','priorit','strategy','week','highlight'],
      content: `PROMOTIONS & MARKETING DATA:
- High-performing formations to promote (high completion = social proof):
${topFormations.slice(0,3).map((f:any) => `  - "${f.formationTitle}" (${f.rate ?? f.completionRate ?? 0}% completion)`).join('\n') || '  N/A'}
- Quick wins this week:
  - ${pending.length} pending orders — users showed intent, just need a nudge
  - ${atRisk.length} at-risk orders (>24h pending) — immediate action needed
  - ${this.data?.newUsersThisWeek ?? 0} new users this week — target with onboarding offer
- Low-selling products that could use promotion: ${topProducts.slice(-2).map(([n])=>`"${n}"`).join(', ') || 'N/A'}`
    });
  }

  // ── RAG: Retrieve relevant chunks for a query ──────────────────────────────
  private retrieveChunks(query: string): RagChunk[] {
    const q = query.toLowerCase();
    const scored = this.ragChunks.map(chunk => {
      const keywordMatches = chunk.keywords.filter(kw => q.includes(kw)).length;
      const topicMatch = q.includes(chunk.topic.toLowerCase()) ? 2 : 0;
      return { chunk, score: keywordMatches + topicMatch };
    });

    // Always include predictions + sort by score, take top 3 relevant chunks
    const sorted = scored.sort((a, b) => b.score - a.score);
    const top = sorted.slice(0, 3).filter(s => s.score > 0).map(s => s.chunk);

    // If nothing matched well, return top 2 by default (summary/general)
    if (top.length === 0) {
      return this.ragChunks.slice(0, 2);
    }

    // Always append predictions chunk if not already included (useful for context)
    const hasPredictions = top.some(c => c.id === 'predictions');
    if (!hasPredictions && top.length < 3) {
      const predChunk = this.ragChunks.find(c => c.id === 'predictions');
      if (predChunk) top.push(predChunk);
    }

    return top;
  }

  // ── Gemini API with RAG ───────────────────────────────────────────────────
  private async callGeminiWithRAG(userMessage: string): Promise<{ answer: string; sources: string[] }> {
    // Step 1: Retrieve relevant data chunks (RAG retrieval)
    const relevantChunks = this.retrieveChunks(userMessage);
    const sources = relevantChunks.map(c => c.topic);

    // Step 2: Build augmented prompt with retrieved context
    const ragContext = relevantChunks.map(c => c.content).join('\n\n---\n\n');

    const systemInstruction = `You are ForME AI, an intelligent business analytics assistant embedded in the ForME e-learning platform dashboard. You help admins understand their platform performance and make smart decisions.

RETRIEVED PLATFORM DATA (use this to answer accurately):
${ragContext}

INSTRUCTIONS:
- Be concise, data-driven, and actionable. Use **bold** for key numbers and metrics.
- Respond in the user's language (French or English — detect from their message).
- Currency is TND. Always show exact numbers from the data above.
- Give predictions and recommendations based on the trends in the data.
- Keep responses under 250 words unless a detailed analysis is explicitly requested.
- Never mention being Groq or any underlying model. You are "ForME AI".
- If the data shows 0 or no records, acknowledge it honestly and suggest what to look for.`;

    // Build conversation history (last 6 messages for context window efficiency)
    const history = this.messages
      .filter(m => !m.loading && m.text.trim() !== '')
      .slice(-6)
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text
      }));

    // Step 3: Call Groq API (free tier: 14,400 req/day)
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemInstruction },
            ...history,
            { role: 'user', content: userMessage }
          ],
          temperature: 0.4,
          max_tokens: 600,
          top_p: 0.9,
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`${response.status}: ${errText}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content ?? 'No response received.';
    return { answer, sources };
  }

  private finishResponse(text: string, sources?: string[]): void {
    this.messages[this.messages.length - 1] = { role: 'assistant', text, sources };
    this.isTyping = false;
    this.scrollToBottom();
  }

  formatMessage(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  private scrollToBottom(): void {
    setTimeout(() => this.chatEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' }), 60);
  }
}