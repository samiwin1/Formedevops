import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeLoaderService {
  private r: Renderer2;
  private loaded = new Set<string>();

  constructor(rf: RendererFactory2) {
    this.r = rf.createRenderer(null, null);
  }

  loadStyle(href: string) {
    if (this.loaded.has(href)) return;
    const link = this.r.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    this.r.appendChild(document.head, link);
    this.loaded.add(href);
  }

  loadScript(src: string): Promise<void> {
    if (this.loaded.has(src)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const s = this.r.createElement('script');
      s.src = src;
      s.defer = true;
      s.onload = () => {
        this.loaded.add(src);
        resolve();
      };
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      this.r.appendChild(document.body, s);
    });
  }
}