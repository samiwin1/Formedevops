import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sessionStatusClass',
  standalone: true,
})
export class SessionStatusPipe implements PipeTransform {
  transform(status: string | null | undefined): string {
    const value = (status ?? '').toUpperCase();
    if (value === 'DONE' || value === 'COMPLETED') {
      return 'badge bg-success';
    }
    if (value === 'CANCELED' || value === 'CANCELLED') {
      return 'badge bg-danger';
    }
    return 'badge bg-primary';
  }
}
