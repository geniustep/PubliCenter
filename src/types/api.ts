// API Response Types for PubliCenter

// Base Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Enums
export enum Language {
  AR = 'AR',
  EN = 'EN',
  FR = 'FR',
  ES = 'ES'
}

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum TranslationStatus {
  PENDING = 'PENDING',
  TRANSLATING = 'TRANSLATING',
  TRANSLATED = 'TRANSLATED',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED'
}

export enum LayoutType {
  SINGLE_COLUMN = 'SINGLE_COLUMN',
  TWO_COLUMN = 'TWO_COLUMN',
  THREE_COLUMN = 'THREE_COLUMN',
  GRID = 'GRID',
  MAGAZINE = 'MAGAZINE'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  AUTHOR = 'AUTHOR',
  CONTRIBUTOR = 'CONTRIBUTOR',
  VIEWER = 'VIEWER'
}

// Entity Types
export interface User {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  emailVerified: string | null;
  image: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: number;
  name: string;
  description: string;
  layoutType: LayoutType;
  structure: any;
  styles: any;
  thumbnail: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    articles: number;
  };
}

export interface ArticleImage {
  id: number;
  articleId: number;
  url: string;
  alt: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  size: number | null;
  mimeType: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface Translation {
  id: number;
  articleId: number;
  language: Language;
  title: string;
  content: string;
  excerpt: string | null;
  status: TranslationStatus;
  wordpressPostId: number | null;
  wordpressSiteId: number | null;
  publishedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  excerpt: string | null;
  sourceLanguage: Language;
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  categoryId: number | null;
  templateId: number;

  // Relations (optional - included when using 'include' in Prisma)
  author?: User;
  category?: Category | null;
  template?: Template;
  images?: ArticleImage[];
  translations?: Translation[];
  _count?: {
    translations: number;
  };
}

export interface WordPressSite {
  id: number;
  name: string;
  url: string;
  language: Language;
  username: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// API Request Types
export interface CreateArticleRequest {
  sourceLanguage: Language;
  targetLanguages: Language[];
  title: string;
  content: string;
  excerpt?: string;
  templateId: number;
  categoryId?: number;
  images?: {
    url: string;
    alt?: string;
    caption?: string;
  }[];
  authorId: string;
}

export interface UpdateArticleRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  status?: ArticleStatus;
  categoryId?: number;
  templateId?: number;
}

export interface ArticleFilters {
  page?: number;
  limit?: number;
  status?: ArticleStatus;
  categoryId?: number;
  authorId?: string;
  search?: string;
}

export interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Authentication Types
export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthSession {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
    image: string | null;
    role: UserRole;
  };
  expires: string;
}

export interface Permission {
  resource: string;
  actions: string[];
}

// Role Permissions Map
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    { resource: 'articles', actions: ['create', 'read', 'update', 'delete', 'publish'] },
    { resource: 'categories', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'templates', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'settings', actions: ['read', 'update'] },
  ],
  [UserRole.EDITOR]: [
    { resource: 'articles', actions: ['create', 'read', 'update', 'delete', 'publish'] },
    { resource: 'categories', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'templates', actions: ['read'] },
    { resource: 'users', actions: ['read'] },
  ],
  [UserRole.AUTHOR]: [
    { resource: 'articles', actions: ['create', 'read', 'update', 'publish'] },
    { resource: 'categories', actions: ['read'] },
    { resource: 'templates', actions: ['read'] },
  ],
  [UserRole.CONTRIBUTOR]: [
    { resource: 'articles', actions: ['create', 'read', 'update'] },
    { resource: 'categories', actions: ['read'] },
    { resource: 'templates', actions: ['read'] },
  ],
  [UserRole.VIEWER]: [
    { resource: 'articles', actions: ['read'] },
    { resource: 'categories', actions: ['read'] },
    { resource: 'templates', actions: ['read'] },
  ],
};

// API Response Type Aliases
export type ArticlesResponse = PaginatedResponse<Article>;
export type ArticleResponse = ApiResponse<Article>;
export type TemplatesResponse = ApiResponse<Template[]>;
export type TemplateResponse = ApiResponse<Template>;
export type CategoriesResponse = ApiResponse<Category[]>;
export type CategoryResponse = ApiResponse<Category>;
export type ContactResponse = ApiResponse<{ message: string }>;
export type AuthResponse = ApiResponse<{ user: User; token?: string }>;
