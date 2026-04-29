import { Component, Input, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformDashboardData } from '../dashboard.component';

export type ContentType =
  | 'social'
  | 'ad'
  | 'landing'
  | 'email'
  | 'sms'
  | 'promo';

interface ContentTemplate {
  id: ContentType;
  icon: string;
  label: string;
  description: string;
  color: string;
  prompts: string[];
}

interface GeneratedContent {
  id: string;
  type: ContentType;
  title: string;
  body: string;
  timestamp: Date;
  pinned?: boolean;
}

@Component({
  selector: 'app-ai-marketing-creator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-marketing-creator.component.html',
  styleUrl: './ai-marketing-creator.component.css',
})
export class AiMarketingCreatorComponent implements OnInit {
  @Input() data!: PlatformDashboardData;
  @ViewChild('outputEnd') outputEnd!: ElementRef;

  apiKey: string = localStorage.getItem('forme_groq_key') ?? '';
  showKeyPrompt = false;

  selectedType: ContentType | null = null;
  userPrompt = '';
  isGenerating = false;
  generatedItems: GeneratedContent[] = [];
  activeTab: 'create' | 'library' = 'create';
  copiedId: string | null = null;

  readonly TEMPLATES: ContentTemplate[] = [
    {
      id: 'social',
      icon: 'bi-broadcast',
      label: 'Social Post',
      description: 'Ready-to-publish captions for Instagram, LinkedIn & Facebook',
      color: '#e040fb',
      prompts: [
        'LinkedIn post promoting our new certification program',
        'Instagram carousel teaser for our upcoming cohort',
        'Facebook post for a limited-time discount offer',
      ],
    },
    {
      id: 'ad',
      icon: 'bi-megaphone-fill',
      label: 'Ad Copy',
      description: 'High-converting Google, Meta & display ad scripts',
      color: '#ff5252',
      prompts: [
        'Google Search ad for our leadership formation',
        'Facebook/Instagram ad set for course re-enrollment',
        'Display banner copy for a flash sale campaign',
      ],
    },
    {
      id: 'landing',
      icon: 'bi-layout-text-window-reverse',
      label: 'Landing Page',
      description: 'Headline, subheadline, benefits & CTA for a sales page',
      color: '#00bcd4',
      prompts: [
        'Landing page for our flagship data analytics program',
        'Sales page for a B2B corporate training offer',
        'Enrollment page for a free webinar lead magnet',
      ],
    },
    {
      id: 'email',
      icon: 'bi-envelope-paper-fill',
      label: 'Email Campaign',
      description: 'Promotional & nurture emails engineered for clicks',
      color: '#ff9800',
      prompts: [
        'Flash sale email — 30% off ending tonight',
        'Nurture email for leads who visited but didn\'t enroll',
        'Welcome sequence email #1 for new subscribers',
      ],
    },
    {
      id: 'sms',
      icon: 'bi-chat-dots-fill',
      label: 'SMS / WhatsApp',
      description: 'Short, punchy messages under 160 chars for direct outreach',
      color: '#4caf50',
      prompts: [
        'Flash sale reminder — seats running out',
        'Webinar reminder for tomorrow\'s live session',
        'Re-engagement nudge for inactive learners',
      ],
    },
    {
      id: 'promo',
      icon: 'bi-gift-fill',
      label: 'Promo & Offer',
      description: 'Discount copy, bundle descriptions & urgency hooks',
      color: '#ffc107',
      prompts: [
        'Early-bird pricing page for next cohort launch',
        'Bundle offer: 3 formations for the price of 2',
        'Referral program copy to drive word-of-mouth',
      ],
    },
  ];

  ngOnInit(): void {
    if (!this.apiKey) this.showKeyPrompt = true;
  }

  saveKey(key: string): void {
    const k = key.trim();
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

  selectType(type: ContentType): void {
    this.selectedType = this.selectedType === type ? null : type;
    this.userPrompt = '';
  }

  usePrompt(prompt: string): void {
    this.userPrompt = prompt;
  }

  getTemplate(id: ContentType): ContentTemplate {
    return this.TEMPLATES.find(t => t.id === id)!;
  }

  async generate(): Promise<void> {
    if (!this.apiKey) { this.showKeyPrompt = true; return; }
    if (!this.selectedType || !this.userPrompt.trim()) return;

    this.isGenerating = true;
    const type = this.selectedType;
    const prompt = this.userPrompt.trim();

    const systemContext = this.buildSystemContext();
    const fullPrompt = this.buildPrompt(type, prompt, systemContext);

    try {
      const result = await this.callGemini(fullPrompt);
      const titleLine = result.split('\n').find(l => l.trim()) ?? prompt;
      const cleanTitle = titleLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').slice(0, 80);

      this.generatedItems.unshift({
        id: Date.now().toString(),
        type,
        title: cleanTitle,
        body: result,
        timestamp: new Date(),
      });

      this.userPrompt = '';
      this.activeTab = 'library';
    } catch (err: any) {
      console.error('Generation error:', err);
    } finally {
      this.isGenerating = false;
    }
  }

  private buildSystemContext(): string {
    if (!this.data) return '';
    return `
Platform: ForME (e-learning & professional certification platform, Tunisia)
Audience: Professionals aged 24–45 seeking upskilling & career advancement
Stats: ${this.data.totalUsers} total learners, ${this.data.activeUsers} active, ${this.data.issuedCerts} certificates issued
Revenue: ${this.data.totalRevenue} TND, ${this.data.totalOrders} orders
Upcoming live sessions: ${this.data.upcomingSessions?.length ?? 0}
Brand voice: Ambitious, empowering, results-driven. Never fluff — lead with outcome.
    `.trim();
  }

  private buildPrompt(type: ContentType, userRequest: string, context: string): string {
    const typeInstructions: Record<ContentType, string> = {
      social: `You are a social media strategist specialising in edtech brands. Write platform-optimised posts in Markdown with:
- **LinkedIn version** (professional tone, 150–200 words, with 3 relevant hashtags)
- **Instagram version** (engaging hook, emoji-friendly, 80–120 words, 5–8 hashtags in a separate block)
- **Facebook version** (conversational, 80–100 words, one clear CTA)
Lead every post with a scroll-stopping first line. Focus on transformation and outcomes, not features.`,

      ad: `You are a performance marketing copywriter. Generate a full ad set in Markdown with:
- **Google Search Ad** (3 headlines ≤30 chars each, 2 descriptions ≤90 chars each, display URL)
- **Facebook/Instagram Primary Ad** (hook line, body 125 chars, headline 40 chars, CTA button label)
- **Retargeting Variant** (shorter, urgency-based, for warm audiences)
Every line must be conversion-focused. Include power words, social proof triggers, and scarcity/urgency where natural.`,

      landing: `You are a conversion copywriter. Generate a complete landing page brief in Markdown with:
- **Above-the-fold**: Hero headline (max 10 words), subheadline (max 20 words), primary CTA button text
- **Pain → Promise block**: 2-sentence problem statement + 2-sentence transformation promise
- **3 Key Benefits** (icon label + 1-line description each)
- **Social proof blurb**: Placeholder testimonial + stat (e.g., "4,200+ learners certified")
- **FAQ section**: 3 objection-busting Q&As
- **Closing CTA section**: Urgency line + button copy
Write in second-person ("You will…"). Every word earns its place.`,

      email: `You are an email marketing specialist focused on edtech conversion. Write a complete campaign email in Markdown with:
- **Subject line** (under 50 chars, curiosity or urgency hook)
- **Preview text** (under 90 chars, complements subject)
- **Opening line** (personalised feel, no "I hope this email finds you well")
- **Body** (3 short paragraphs — problem, solution, proof)
- **CTA block** (button text + surrounding urgency copy)
- **P.S. line** (reinforce value or deadline)
Optimise for mobile reading. Short sentences. No jargon. Every paragraph has a job.`,

      sms: `You are a direct-response SMS copywriter. Generate 3 message variants in Markdown:
- **Variant A — Urgency**: deadline-driven, 160 chars max
- **Variant B — FOMO**: social proof angle, 160 chars max
- **Variant C — Benefit-first**: outcome-led, 160 chars max
Also write 1 WhatsApp version (can be up to 300 chars, slightly warmer tone).
Include a placeholder short link {{LINK}} in each. No emojis unless specified. Crystal-clear CTA.`,

      promo: `You are a promotional campaign strategist. Generate a full promotional package in Markdown with:
- **Offer headline** (punchy, benefit-first, max 12 words)
- **Offer mechanics** (what's included, price, discount %, deadline — use placeholders where needed)
- **3 urgency/scarcity hooks** (vary the angle: time, seats, price increase)
- **Objection handler** (1 paragraph pre-empting "I'll think about it")
- **Referral / sharing copy** (optional share message for WhatsApp/social)
- **Terms blurb** (one short line, professional)
Make it feel unmissable without being pushy.`,
    };

    return `${typeInstructions[type]}

Platform Context:
${context}

Campaign Brief: ${userRequest}

Generate professional, ready-to-use marketing content. Use proper Markdown with clear section headers. Be specific, punchy, and conversion-focused — never generic filler.`;
  }

  private async callGemini(prompt: string): Promise<string> {
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
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 2048,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error?.message ?? `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? 'No content generated.';
  }

  formatMarkdown(text: string): string {
    return text
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .replace(/\n\n/g, '<br/><br/>');
  }

  copyContent(item: GeneratedContent): void {
    navigator.clipboard.writeText(item.body);
    this.copiedId = item.id;
    setTimeout(() => (this.copiedId = null), 2000);
  }

  togglePin(item: GeneratedContent): void {
    item.pinned = !item.pinned;
    this.generatedItems.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }

  deleteItem(id: string): void {
    this.generatedItems = this.generatedItems.filter(i => i.id !== id);
  }

  get pinnedCount(): number {
    return this.generatedItems.filter(i => i.pinned).length;
  }

  trackById(_: number, item: GeneratedContent): string {
    return item.id;
  }
}