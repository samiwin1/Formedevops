import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { Article, ArticleComment, ArticleTargetLanguage, TranslatedArticleView } from '../models/article.models';

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private readonly baseUrl = `${environment.articleApiUrl}/articles`;

  constructor(private http: HttpClient) {}

  listArticles(userId?: number): Observable<Article[]> {
    let params = new HttpParams();
    if (userId != null) {
      params = params.set('userId', String(userId));
    }
    return this.http.get<Article[]>(this.baseUrl, { params });
  }

  getArticle(id: number, userId?: number): Observable<Article> {
    let params = new HttpParams();
    if (userId != null) {
      params = params.set('userId', String(userId));
    }
    return this.http.get<Article>(`${this.baseUrl}/${id}`, { params });
  }

  createArticle(payload: Article): Observable<Article> {
    return this.http.post<Article>(this.baseUrl, payload);
  }

  updateArticle(id: number, payload: Article): Observable<Article> {
    return this.http.put<Article>(`${this.baseUrl}/${id}`, payload);
  }

  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  toggleLike(articleId: number, userId: number): Observable<Article> {
    return this.http.post<Article>(`${this.baseUrl}/${articleId}/like`, { userId });
  }

  listComments(articleId: number): Observable<ArticleComment[]> {
    return this.http.get<ArticleComment[]>(`${this.baseUrl}/${articleId}/comments`);
  }

  addComment(articleId: number, payload: ArticleComment): Observable<ArticleComment> {
    return this.http.post<ArticleComment>(`${this.baseUrl}/${articleId}/comments`, payload);
  }

  translateArticle(articleId: number, targetLanguage: ArticleTargetLanguage): Observable<TranslatedArticleView> {
    return this.http.post<TranslatedArticleView>(`${this.baseUrl}/${articleId}/translate`, { targetLanguage });
  }
}
