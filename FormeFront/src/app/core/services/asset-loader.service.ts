import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

type AssetType = 'style' | 'script';

@Injectable({ providedIn: 'root' })
export class AssetLoaderService {
  private renderer: Renderer2;
  private loaded = new Map<string, HTMLLinkElement | HTMLScriptElement>();

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  loadStyle(href: string): void {
    this.load('style', href);
  }

  loadScript(src: string): void {
    this.load('script', src);
  }

  unload(hrefOrSrc: string): void {
    const el = this.loaded.get(hrefOrSrc);
    if (el?.parentNode) el.parentNode.removeChild(el);
    this.loaded.delete(hrefOrSrc);
  }

  unloadMany(list: string[]): void {
    list.forEach(x => this.unload(x));
  }

  private load(type: AssetType, url: string): void {
    if (this.loaded.has(url)) return;

    if (type === 'style') {
      const link = this.renderer.createElement('link') as HTMLLinkElement;
      link.rel = 'stylesheet';
      link.href = url;
      this.renderer.appendChild(document.head, link);
      this.loaded.set(url, link);
    } else {
      const script = this.renderer.createElement('script') as HTMLScriptElement;
      script.src = url;
      script.defer = true;
      this.renderer.appendChild(document.body, script);
      this.loaded.set(url, script);
    }
  }
}