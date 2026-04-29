import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'safeResourceUrl',
  standalone: true,
})
export class SafeResourceUrlPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(url: string | null | undefined): SafeResourceUrl | null {
    if (url == null || url === '') return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
