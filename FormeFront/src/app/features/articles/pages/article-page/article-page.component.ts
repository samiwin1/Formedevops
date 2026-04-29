import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ArticleService } from '../../services/article.service';
import {
  Article,
  ArticleCategory,
  ArticleComment,
  ArticleLanguage,
  ArticleTargetLanguage,
  TranslatedArticleView,
} from '../../models/article.models';

@Component({
  selector: 'app-article-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './article-page.component.html',
  styleUrl: './article-page.component.css',
})
export class ArticlePageComponent implements OnInit {
  private readonly articleService = inject(ArticleService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  categories: ArticleCategory[] = ['GUIDE', 'ACTUALITE', 'CONSEIL'];
  articles: Article[] = [];
  loading = false;
  publishing = false;
  error: string | null = null;

  composer = {
    titre: '',
    contenu: '',
    categorie: 'GUIDE' as ArticleCategory,
    image: '',
    resume: '',
  };

  commentDrafts: Record<number, string> = {};
  comments: Record<number, ArticleComment[]> = {};
  commentsLoading: Record<number, boolean> = {};
  commentsOpen: Record<number, boolean> = {};
  likeLoading: Record<number, boolean> = {};
  translationLoading: Record<number, boolean> = {};
  selectedLanguage: Record<number, ArticleLanguage> = {};
  translationError: Record<number, string> = {};
  translations: Record<number, Partial<Record<ArticleTargetLanguage, TranslatedArticleView>>> = {};

  ngOnInit(): void {
    this.loadArticles();
  }

  get isLoggedIn(): boolean {
    return !!this.auth.getToken();
  }

  get currentUserId(): number | null {
    return this.auth.getUserId();
  }

  get currentUserLabel(): string {
    return this.auth.getEmail() ?? 'User';
  }

  loadArticles(): void {
    this.loading = true;
    this.error = null;
    this.articleService.listArticles(this.currentUserId ?? undefined).subscribe({
      next: (list) => {
        this.articles = list ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to load articles';
        this.loading = false;
      },
    });
  }

  publish(): void {
    if (!this.isLoggedIn || this.currentUserId == null) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/articles' } });
      return;
    }

    const titre = this.composer.titre.trim();
    const contenu = this.composer.contenu.trim();
    if (!titre || !contenu) {
      this.toast.error('Title and content are required.');
      return;
    }

    this.publishing = true;
    this.articleService.createArticle({
      titre,
      contenu,
      categorie: this.composer.categorie,
      image: this.composer.image.trim() || null,
      resume: this.composer.resume.trim() || null,
      genereParIa: false,
    }).subscribe({
      next: () => {
        this.toast.success('Article published.');
        this.composer = { titre: '', contenu: '', categorie: 'GUIDE', image: '', resume: '' };
        this.publishing = false;
        this.loadArticles();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Could not publish article.');
        this.publishing = false;
      },
    });
  }

  toggleLike(article: Article): void {
    if (!article.id) return;
    if (!this.isLoggedIn || this.currentUserId == null) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/articles' } });
      return;
    }

    this.likeLoading[article.id] = true;
    this.articleService.toggleLike(article.id, this.currentUserId).subscribe({
      next: (updated) => {
        this.replaceArticle(updated);
        this.likeLoading[article.id as number] = false;
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Could not update like.');
        this.likeLoading[article.id as number] = false;
      },
    });
  }

  toggleComments(article: Article): void {
    if (!article.id) return;
    const articleId = article.id;
    this.commentsOpen[articleId] = !this.commentsOpen[articleId];
    this.comments[articleId] = this.comments[articleId] ?? [];
    if (this.commentsOpen[articleId] && this.comments[articleId].length === 0) {
      this.loadComments(articleId);
    }
  }

  loadComments(articleId: number): void {
    this.commentsLoading[articleId] = true;
    this.articleService.listComments(articleId).subscribe({
      next: (list) => {
        this.comments[articleId] = list ?? [];
        this.commentsLoading[articleId] = false;
      },
      error: () => {
        this.comments[articleId] = [];
        this.commentsLoading[articleId] = false;
      },
    });
  }

  submitComment(article: Article): void {
    if (article.id == null || this.currentUserId == null) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/articles' } });
      return;
    }

    const articleId = article.id;
    const content = (this.commentDrafts[article.id] ?? '').trim();
    if (!content) {
      return;
    }

    this.articleService.addComment(articleId, {
      userId: this.currentUserId,
      authorName: this.currentUserLabel,
      content,
    }).subscribe({
      next: (created) => {
        const list = this.comments[articleId] ?? [];
        this.comments[articleId] = [...list, created];
        this.commentDrafts[articleId] = '';
        article.commentCount = (article.commentCount ?? 0) + 1;
      },
      error: (err) => {
        this.toast.error(err?.error?.message || err?.message || 'Could not add comment.');
      }
    });
  }

  categoryLabel(category: ArticleCategory): string {
    const labels: Record<ArticleCategory, string> = {
      GUIDE: 'Guide',
      ACTUALITE: 'Actualité',
      CONSEIL: 'Conseil',
    };
    return labels[category] ?? category;
  }

  trackByArticleId(_: number, article: Article): number {
    return article.id ?? 0;
  }

  articleKey(article: Article): number {
    return article.id ?? 0;
  }

  languageOptions = [
    { code: 'original' as ArticleLanguage, label: 'Original' },
    { code: 'en' as ArticleLanguage, label: 'EN' },
    { code: 'fr' as ArticleLanguage, label: 'FR' },
    { code: 'ar' as ArticleLanguage, label: 'AR' },
  ];

  getSelectedLanguage(article: Article): ArticleLanguage {
    const articleId = this.articleKey(article);
    return this.selectedLanguage[articleId] ?? 'original';
  }

  isLanguageLoading(article: Article): boolean {
    const articleId = this.articleKey(article);
    return !!this.translationLoading[articleId];
  }

  setArticleLanguage(article: Article, language: ArticleLanguage): void {
    if (!article.id) return;
    const articleId = article.id;
    this.selectedLanguage[articleId] = language;
    this.translationError[articleId] = '';

    if (language === 'original') {
      return;
    }

    const cached = this.translations[articleId]?.[language];
    if (cached) {
      return;
    }

    this.translationLoading[articleId] = true;
    this.articleService.translateArticle(articleId, language).subscribe({
      next: (translated) => {
        this.translations[articleId] = {
          ...(this.translations[articleId] ?? {}),
          [language]: translated,
        };
        this.translationLoading[articleId] = false;
      },
      error: (err) => {
        this.translationLoading[articleId] = false;
        this.translationError[articleId] = err?.error?.message || err?.message || 'Translation failed.';
        this.selectedLanguage[articleId] = 'original';
        this.toast.error('Translation unavailable right now.');
      },
    });
  }

  displayTitle(article: Article): string {
    return this.currentTranslation(article)?.titre ?? article.titre;
  }

  displaySummary(article: Article): string | null | undefined {
    return this.currentTranslation(article)?.resume ?? article.resume;
  }

  displayContent(article: Article): string {
    return this.currentTranslation(article)?.contenu ?? article.contenu;
  }

  isArabic(article: Article): boolean {
    return this.getSelectedLanguage(article) === 'ar';
  }

  translationErrorMessage(article: Article): string {
    const articleId = this.articleKey(article);
    return this.translationError[articleId] ?? '';
  }

  private currentTranslation(article: Article): TranslatedArticleView | null {
    const articleId = article.id;
    if (!articleId) return null;
    const lang = this.selectedLanguage[articleId] ?? 'original';
    if (lang === 'original') return null;
    return this.translations[articleId]?.[lang] ?? null;
  }

  private replaceArticle(updated: Article): void {
    const index = this.articles.findIndex((item) => item.id === updated.id);
    if (index >= 0) {
      this.articles[index] = updated;
      this.articles = [...this.articles];
    }
  }
}
