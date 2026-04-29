import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentThinkingService } from '../../services/agent-thinking.service';

@Component({
  selector: 'app-agent-thinking-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-thinking-animation.component.html',
  styleUrl: './agent-thinking-animation.component.css'
})
export class AgentThinkingAnimationComponent implements OnInit, OnChanges, OnDestroy {
  @Input() active = false;

  frameCount = 0;
  currentFrameIndex = 0;
  currentFrameUrl: string | null = null;
  useSpinner = true;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly frameIntervalMs = 120;

  constructor(private agentThinkingService: AgentThinkingService) {}

  ngOnInit(): void {
    this.loadMetadata();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['active']) {
      if (this.active) {
        this.startAnimation();
      } else {
        this.stopAnimation();
      }
    }
  }

  ngOnDestroy(): void {
    this.stopAnimation();
  }

  private loadMetadata(): void {
    this.agentThinkingService.getFramesMetadata().subscribe((meta) => {
      this.frameCount = meta.count;
      this.useSpinner = this.frameCount === 0;
      if (this.frameCount > 0) {
        this.preloadFrames();
      }
    });
  }

  private preloadFrames(): void {
    for (let i = 1; i <= this.frameCount; i++) {
      const img = new Image();
      img.src = this.agentThinkingService.getFrameUrl(i);
    }
  }

  private startAnimation(): void {
    this.stopAnimation();
    if (this.useSpinner || this.frameCount === 0) return;

    this.currentFrameIndex = 1;
    this.currentFrameUrl = this.agentThinkingService.getFrameUrl(this.currentFrameIndex);

    this.intervalId = setInterval(() => {
      this.currentFrameIndex = (this.currentFrameIndex % this.frameCount) + 1;
      this.currentFrameUrl = this.agentThinkingService.getFrameUrl(this.currentFrameIndex);
    }, this.frameIntervalMs);
  }

  private stopAnimation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentFrameIndex = 0;
    this.currentFrameUrl = null;
  }
}
