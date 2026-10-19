import type { Types } from 'mongoose';
import type {
  AuthorRefDTO,
  CommentDTO,
  CommunityDTO,
  CommunityRefDTO,
  PostDetailDTO,
  PostStatus,
  PaginatedResult,
  PostSummaryDTO,
  PublicProfileDTO,
  UserDTO,
  UserProvider,
  UserRole,
} from '@/types';

/*
 * Shapes of `.lean()` results (and the populated subsets used by the services).
 * Mappers below turn them into JSON-safe DTOs; nothing else should leak raw documents.
 */

export interface LeanPublicUser {
  _id: Types.ObjectId;
  name: string;
  username: string;
  image?: string | null;
  bio?: string;
  skills?: string[];
  createdAt: Date;
}

export interface LeanFullUser extends LeanPublicUser {
  email?: string | null;
  role: UserRole;
  provider: UserProvider;
  updatedAt: Date;
}

export interface LeanCommunity {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  topics: string[];
  icon?: string | null;
  color?: string | null;
  memberCount: number;
  createdAt: Date;
}

export type LeanCommunityRef = Pick<LeanCommunity, '_id' | 'name' | 'slug' | 'icon' | 'color'>;

export interface LeanPost {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImage?: string | null;
  author: LeanPublicUser | null;
  community: LeanCommunityRef | null;
  tags: string[];
  status: PostStatus;
  readingTime: number;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeanComment {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  content: string;
  author: LeanPublicUser | null;
  createdAt: Date;
  updatedAt: Date;
}

const DELETED_AUTHOR: AuthorRefDTO = { id: '', name: 'Deleted user', username: 'deleted', image: null };

function iso(date: Date): string {
  return date.toISOString();
}

export function toAuthorRef(user: LeanPublicUser | null): AuthorRefDTO {
  if (!user) return DELETED_AUTHOR;
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    image: user.image ?? null,
  };
}

export function toPublicProfile(user: LeanPublicUser): PublicProfileDTO {
  return {
    ...toAuthorRef(user),
    bio: user.bio ?? '',
    skills: user.skills ?? [],
    createdAt: iso(user.createdAt),
  };
}

export function toUserDTO(user: LeanFullUser): UserDTO {
  return {
    ...toPublicProfile(user),
    email: user.email ?? null,
    role: user.role,
    provider: user.provider,
    updatedAt: iso(user.updatedAt),
  };
}

export function toCommunityRef(community: LeanCommunityRef | null): CommunityRefDTO {
  return {
    id: community?._id.toString() ?? '',
    name: community?.name ?? 'Unknown community',
    slug: community?.slug ?? '',
    icon: community?.icon ?? null,
    color: community?.color ?? null,
  };
}

export function toCommunityDTO(community: LeanCommunity): CommunityDTO {
  return {
    id: community._id.toString(),
    name: community.name,
    slug: community.slug,
    description: community.description,
    topics: community.topics,
    icon: community.icon ?? null,
    color: community.color ?? null,
    memberCount: community.memberCount,
    createdAt: iso(community.createdAt),
  };
}

export function toPostSummary(post: LeanPost): PostSummaryDTO {
  return {
    id: post._id.toString(),
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage ?? null,
    author: toAuthorRef(post.author),
    community: toCommunityRef(post.community),
    tags: post.tags,
    status: post.status,
    readingTime: post.readingTime,
    // Drafts never expose a publish date, even if an older record still carries one.
    publishedAt: post.status === 'published' && post.publishedAt ? iso(post.publishedAt) : null,
    createdAt: iso(post.createdAt),
    updatedAt: iso(post.updatedAt),
  };
}

export function toPostDetail(post: LeanPost): PostDetailDTO {
  return { ...toPostSummary(post), content: post.content ?? '' };
}

export function toCommentDTO(comment: LeanComment): CommentDTO {
  return {
    id: comment._id.toString(),
    postId: comment.post.toString(),
    content: comment.content,
    author: toAuthorRef(comment.author),
    createdAt: iso(comment.createdAt),
    updatedAt: iso(comment.updatedAt),
  };
}

const MAX_LIMIT = 50;

export interface PageWindow {
  page: number;
  limit: number;
  skip: number;
}

/** Clamps untrusted page/limit values into a safe `skip/limit` window. */
export function pageWindow(input: { page?: number; limit?: number }, defaultLimit: number): PageWindow {
  const page = Number.isFinite(input.page) ? Math.max(1, Math.floor(input.page ?? 1)) : 1;
  const requested = Number.isFinite(input.limit) ? Math.floor(input.limit ?? defaultLimit) : defaultLimit;
  const limit = Math.min(MAX_LIMIT, Math.max(1, requested));
  return { page, limit, skip: (page - 1) * limit };
}

export function toPaginated<T>(items: T[], total: number, window: PageWindow): PaginatedResult<T> {
  return {
    items,
    page: window.page,
    limit: window.limit,
    total,
    totalPages: Math.ceil(total / window.limit),
  };
}

/** Populate selectors: the only user/community fields that may leave the server (never email). */
export const PUBLIC_AUTHOR_FIELDS = 'name username image';
export const PUBLIC_COMMUNITY_FIELDS = 'name slug icon color';
