export type ArticleCategory = 'GUIDE' | 'ACTUALITE' | 'CONSEIL';

export interface Article {
  id?: number;
  titre: string;
  contenu: string;
  categorie: ArticleCategory;
  image?: string | null;
  resume?: string | null;
  genereParIa?: boolean;
  likeCount?: number;
  commentCount?: number;
  likedByCurrentUser?: boolean;
}

export interface ArticleComment {
  id?: number;
  userId: number;
  authorName?: string | null;
  content: string;
  createdAt?: string;
}

export type ArticleLanguage = 'original' | 'en' | 'fr' | 'ar';
export type ArticleTargetLanguage = Exclude<ArticleLanguage, 'original'>;

export interface TranslatedArticleView {
  language: ArticleTargetLanguage;
  titre: string;
  resume?: string | null;
  contenu: string;
}
