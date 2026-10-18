export const USER_ROLES = ['user', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_PROVIDERS = ['github', 'google', 'seed'] as const;
export type UserProvider = (typeof USER_PROVIDERS)[number];

export const POST_STATUSES = ['draft', 'published'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

/** The authenticated user as seen by server code (loaded fresh from the database). */
export interface SessionUser {
  id: string;
  username: string;
  name: string;
  image: string | null;
  role: UserRole;
}

export interface AuthorRefDTO {
  id: string;
  name: string;
  username: string;
  image: string | null;
}

export interface PublicProfileDTO extends AuthorRefDTO {
  bio: string;
  skills: string[];
  createdAt: string;
}

/** Returned only for the signed-in user themself (GET/PATCH /api/me). */
export interface UserDTO extends PublicProfileDTO {
  email: string | null;
  role: UserRole;
  provider: UserProvider;
  updatedAt: string;
}

export interface CommunityDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  topics: string[];
  icon: string | null;
  color: string | null;
  memberCount: number;
  createdAt: string;
}

export type CommunityRefDTO = Pick<CommunityDTO, 'id' | 'name' | 'slug' | 'icon' | 'color'>;

export interface PostSummaryDTO {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  author: AuthorRefDTO;
  community: CommunityRefDTO;
  tags: string[];
  status: PostStatus;
  readingTime: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostDetailDTO extends PostSummaryDTO {
  content: string;
}

export interface CommentDTO {
  id: string;
  postId: string;
  content: string;
  author: AuthorRefDTO;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MembershipDTO {
  member: boolean;
  memberCount: number;
}

export interface BookmarkStatusDTO {
  bookmarked: boolean;
}

export interface TopicCountDTO {
  topic: string;
  count: number;
}

export interface SearchResultDTO {
  posts: PaginatedResult<PostSummaryDTO>;
  communities: CommunityDTO[];
}
