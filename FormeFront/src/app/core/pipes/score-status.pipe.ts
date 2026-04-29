import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'scoreStatus',
  standalone: true,
})
export class ScoreStatusPipe implements PipeTransform {
  transform(score: number | null | undefined, threshold = 10): 'PASSED' | 'FAILED' | 'PENDING' {
    if (score == null) {
      return 'PENDING';
    }
    return score >= threshold ? 'PASSED' : 'FAILED';
  }
}
