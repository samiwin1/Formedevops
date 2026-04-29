import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KeyboardShortcutsService {
  init(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      // ESC - Close modals
      if (e.key === 'Escape') {
        this.closeModals();
      }
      
      // Ctrl/Cmd + K - Open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.focusSearch();
      }
      
      // / - Focus search (if not in input)
      if (e.key === '/' && !this.isInputFocused()) {
        e.preventDefault();
        this.focusSearch();
      }
    });
  }

  private closeModals(): void {
    // Emit custom event that modals can listen to
    document.dispatchEvent(new CustomEvent('closeModals'));
  }

  private focusSearch(): void {
    const searchInput = document.querySelector<HTMLInputElement>('.search-input, [placeholder*="Search"]');
    searchInput?.focus();
  }

  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    return activeElement?.tagName === 'INPUT' || 
           activeElement?.tagName === 'TEXTAREA' ||
           activeElement?.getAttribute('contenteditable') === 'true';
  }
}
