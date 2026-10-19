/*
 * Seed content for local development and demos. Pure data: no imports, no database access.
 * Posts, comments and bookmarks refer to other records by `key` / `username` / `slug`,
 * and scripts/seed.ts turns those references into ObjectIds and checks them before writing.
 * Dates are expressed as offsets so that the same content always produces the same timeline.
 */

export const SEED_PROVIDER = 'seed' as const;

export interface SeedCommunity {
  slug: string;
  name: string;
  description: string;
  topics: string[];
  /** A TECH_LOGOS slug (see data/tech-logos.ts), rendered as a brand logo. */
  icon: string;
  color: string;
  createdBy: string;
  createdDaysAgo: number;
}

export interface SeedUser {
  username: string;
  name: string;
  bio: string;
  skills: string[];
  createdDaysAgo: number;
}

export interface SeedMembership {
  username: string;
  community: string;
  joinedDaysAgo: number;
}

export interface SeedPost {
  key: string;
  title: string;
  excerpt: string;
  tags: string[];
  community: string;
  author: string;
  daysAgo: number;
  hourUtc: number;
  content: string;
}

export interface SeedComment {
  post: string;
  author: string;
  content: string;
  hoursAfterPublish: number;
}

export interface SeedBookmark {
  username: string;
  post: string;
}

export const SEED_COMMUNITIES: readonly SeedCommunity[] = [
  {
    slug: 'react',
    name: 'React.js',
    description:
      'Build interactive interfaces with components, hooks and a clear data flow. Share patterns for state, rendering performance, testing and accessibility.',
    topics: ['react', 'hooks', 'components', 'performance', 'state-management', 'jsx', 'testing'],
    icon: 'react',
    color: '#61DAFB',
    createdBy: 'maya-chen',
    createdDaysAgo: 190,
  },
  {
    slug: 'nextjs',
    name: 'Next.js',
    description:
      'Full-stack React with the App Router, Server Components, caching and route handlers. Discuss rendering strategies, deployment and production lessons.',
    topics: ['nextjs', 'react', 'app-router', 'server-components', 'caching', 'routing', 'api', 'performance'],
    icon: 'nextdotjs',
    color: '#8a8a8a',
    createdBy: 'priya-nair',
    createdDaysAgo: 185,
  },
  {
    slug: 'php',
    name: 'PHP',
    description:
      'Modern PHP from language features and Composer packages to security, SQL and testing. Practical notes for writing maintainable server-side code.',
    topics: ['php', 'php-8', 'composer', 'psr', 'security', 'performance', 'testing', 'types'],
    icon: 'php',
    color: '#777BB4',
    createdBy: 'daniel-okafor',
    createdDaysAgo: 210,
  },
  {
    slug: 'laravel',
    name: 'Laravel',
    description:
      'Eloquent, queues, APIs and Blade templates in the Laravel framework. Share tips for keeping large applications fast, tested and easy to operate.',
    topics: ['laravel', 'eloquent', 'queues', 'blade', 'api', 'testing', 'performance', 'php'],
    icon: 'laravel',
    color: '#FF2D20',
    createdBy: 'sofia-martins',
    createdDaysAgo: 200,
  },
  {
    slug: 'javascript',
    name: 'JavaScript',
    description:
      'The language and the platform around it: async patterns, browser APIs, Node.js and the testing tools that keep JavaScript code dependable.',
    topics: ['javascript', 'async', 'browser-apis', 'performance', 'node', 'testing', 'es2024'],
    icon: 'javascript',
    color: '#F7DF1E',
    createdBy: 'luca-moretti',
    createdDaysAgo: 205,
  },
  {
    slug: 'typescript',
    name: 'TypeScript',
    description:
      'Typed JavaScript at scale: modeling state with unions, generics, runtime validation with Zod and the tooling that makes large codebases safer to change.',
    topics: ['typescript', 'types', 'generics', 'tooling', 'zod', 'testing', 'type-safety'],
    icon: 'typescript',
    color: '#3178C6',
    createdBy: 'luca-moretti',
    createdDaysAgo: 195,
  },
];

export const SEED_USERS: readonly SeedUser[] = [
  {
    username: 'maya-chen',
    name: 'Maya Chen',
    bio: 'Frontend engineer writing about React architecture, testing and accessible interfaces. Mostly TypeScript, occasionally too many hooks.',
    skills: ['React', 'TypeScript', 'Next.js', 'Testing Library', 'Accessibility'],
    createdDaysAgo: 230,
  },
  {
    username: 'priya-nair',
    name: 'Priya Nair',
    bio: 'Performance-minded full-stack developer. I measure first and rewrite second, currently on a marketplace built with the Next.js App Router.',
    skills: ['Next.js', 'React', 'JavaScript', 'Web Performance', 'Node.js'],
    createdDaysAgo: 220,
  },
  {
    username: 'luca-moretti',
    name: 'Luca Moretti',
    bio: 'Type system enthusiast and tooling maintainer. I like small, precise types and fast feedback loops.',
    skills: ['TypeScript', 'JavaScript', 'Zod', 'ESLint', 'Node.js'],
    createdDaysAgo: 215,
  },
  {
    username: 'daniel-okafor',
    name: 'Daniel Okafor',
    bio: 'Backend developer working mainly with PHP and Laravel. Writing about Eloquent, queues and keeping APIs boring.',
    skills: ['PHP', 'Laravel', 'Eloquent', 'MySQL', 'Queues'],
    createdDaysAgo: 240,
  },
  {
    username: 'sofia-martins',
    name: 'Sofia Martins',
    bio: 'Platform engineer who builds PHP services and the pipelines that deploy them. Fan of readable SQL and small, well-tested endpoints.',
    skills: ['PHP', 'Laravel', 'SQL', 'DevOps', 'Docker'],
    createdDaysAgo: 205,
  },
];

/** Every user joins 2 to 4 communities, and every post author joins the community the post is in. */
export const SEED_MEMBERSHIPS: readonly SeedMembership[] = [
  { username: 'maya-chen', community: 'react', joinedDaysAgo: 75 },
  { username: 'maya-chen', community: 'nextjs', joinedDaysAgo: 60 },
  { username: 'maya-chen', community: 'typescript', joinedDaysAgo: 45 },
  { username: 'priya-nair', community: 'react', joinedDaysAgo: 70 },
  { username: 'priya-nair', community: 'nextjs', joinedDaysAgo: 58 },
  { username: 'priya-nair', community: 'javascript', joinedDaysAgo: 40 },
  { username: 'luca-moretti', community: 'nextjs', joinedDaysAgo: 52 },
  { username: 'luca-moretti', community: 'javascript', joinedDaysAgo: 66 },
  { username: 'luca-moretti', community: 'typescript', joinedDaysAgo: 49 },
  { username: 'daniel-okafor', community: 'php', joinedDaysAgo: 80 },
  { username: 'daniel-okafor', community: 'laravel', joinedDaysAgo: 70 },
  { username: 'daniel-okafor', community: 'javascript', joinedDaysAgo: 44 },
  { username: 'sofia-martins', community: 'php', joinedDaysAgo: 64 },
  { username: 'sofia-martins', community: 'laravel', joinedDaysAgo: 55 },
  { username: 'sofia-martins', community: 'react', joinedDaysAgo: 38 },
];

export const SEED_POSTS: readonly SeedPost[] = [
  {
    key: 'derive-state',
    title: 'Stop Overusing useEffect: Derive State During Render',
    excerpt:
      'Many useEffect calls only copy one value into another. Computing that value during render is simpler, needs no extra pass, and removes a whole class of stale-state bugs.',
    tags: ['react', 'hooks', 'state-management'],
    community: 'react',
    author: 'maya-chen',
    daysAgo: 2,
    hourUtc: 9,
    content: `## The mistake

Say a component receives a list of orders and should only total the paid ones. A common first draft copies the derived list into state inside an effect:

\`\`\`tsx
function OrderTotal({ orders }: { orders: Order[] }) {
  const [paid, setPaid] = useState<Order[]>([]);

  useEffect(() => {
    setPaid(orders.filter((order) => order.status === 'paid'));
  }, [orders]);

  return <Total orders={paid} />;
}
\`\`\`

The first render shows a stale total, React renders again after the effect runs, and now there are two copies of the same information that can drift apart.

## Compute it during render

The paid orders are a function of \`orders\`, so calculate them where they are used:

\`\`\`tsx
function OrderTotal({ orders }: { orders: Order[] }) {
  const paid = orders.filter((order) => order.status === 'paid');
  return <Total orders={paid} />;
}
\`\`\`

Keep these rules in mind:

- Derived values are recalculated on each render. Add \`useMemo\` only after a profiler shows the work is expensive.
- Effects synchronize with things outside React, such as subscriptions, timers, network requests and the DOM.
- If you are about to call \`setState\` inside an effect only because another state value changed, compute the value instead.

Effects still have a place. Fetching data when \`userId\` changes, or subscribing to a window event, are valid uses, and they should return a cleanup function.`,
  },
  {
    key: 'profiler',
    title: 'Find Slow Renders with the React DevTools Profiler',
    excerpt:
      'A practical workflow for recording a slow React interaction, reading the ranked chart, and finding components that re-render for no good reason.',
    tags: ['react', 'performance', 'components'],
    community: 'react',
    author: 'priya-nair',
    daysAgo: 9,
    hourUtc: 14,
    content: `## Record first, guess later

Open React DevTools and switch to the Profiler tab. In its settings, enable "Record why each component rendered while profiling", so every component shows the props, state or hooks that caused its render. Then click record, perform the slow interaction and stop.

Profile a development build or a build with profiling enabled. A standard production build strips the timing data the Profiler needs.

## Read the ranked chart

The ranked chart sorts components by render time for the selected commit. Start with the widest bars and ask whether the work is needed. A list of 2,000 rows that re-renders when one row is hovered is a typical finding.

\`\`\`tsx
const Row = memo(function Row({ item, onSelect }: RowProps) {
  return <li onClick={() => onSelect(item.id)}>{item.label}</li>;
});

function List({ items }: { items: Item[] }) {
  const [, setSelectedId] = useState<string | null>(null);
  const handleSelect = useCallback((id: string) => setSelectedId(id), []);

  return (
    <ul>
      {items.map((item) => (
        <Row key={item.id} item={item} onSelect={handleSelect} />
      ))}
    </ul>
  );
}
\`\`\`

\`memo\` only helps when props stay stable. A new inline function or object created on every parent render defeats it, which is why \`handleSelect\` is wrapped in \`useCallback\`.

## Common causes

- Inline objects, arrays or callbacks passed as props.
- A context value created during render, which re-renders every consumer.
- State held too high in the tree, so unrelated siblings re-render with it.

Fix one cause, profile again and compare the numbers. Measured improvements are the only ones worth keeping.`,
  },
  {
    key: 'testing-library',
    title: 'Test React Components by Behavior with Testing Library',
    excerpt:
      'Testing Library finds elements the way users do. This guide shows how to write stable tests for a form with async validation without testing implementation details.',
    tags: ['react', 'testing', 'components'],
    community: 'react',
    author: 'maya-chen',
    daysAgo: 23,
    hourUtc: 10,
    content: `## Query the way a user would

Testing Library encourages tests that find elements by role, label or visible text. Those queries survive markup changes that users would not notice, and they fail when an element disappears from the accessibility tree.

\`\`\`tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewsletterForm } from './newsletter-form';

test('shows an error for an invalid email', async () => {
  const user = userEvent.setup();
  render(<NewsletterForm />);

  await user.type(screen.getByRole('textbox', { name: /email/i }), 'not-an-email');
  await user.click(screen.getByRole('button', { name: /subscribe/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent(/valid email/i);
});
\`\`\`

## Guidelines

- Prefer \`getByRole\` with an accessible name. Use \`getByLabelText\` for form fields that have a visible label.
- Use \`findBy*\` for anything that appears after an async update, instead of fixed timeouts.
- Use \`userEvent\` rather than \`fireEvent\`, because it dispatches the sequence of events a browser would.
- Assert on what the user sees, not on state, props or CSS class names.
- Avoid snapshots of whole pages. A small snapshot of one component is fine, but it rarely catches a real bug.

When a test is hard to write, the component is often doing too much. Split it, and the test usually gets shorter.`,
  },
  {
    key: 'server-client',
    title: 'Server vs Client Components in the Next.js App Router',
    excerpt:
      'In the App Router, components are Server Components unless marked with use client. Learn what that changes for data access, bundle size and where hooks can run.',
    tags: ['nextjs', 'app-router', 'server-components'],
    community: 'nextjs',
    author: 'priya-nair',
    daysAgo: 4,
    hourUtc: 8,
    content: `## Components are on the server by default

In the App Router, every component inside \`app/\` is a Server Component unless its file opts in with a \`'use client'\` directive. Server Components run only on the server, so they can read the database, use secrets and await data directly. They add no JavaScript to the browser bundle.

\`\`\`tsx
// app/posts/page.tsx: Server Component, no directive needed
import { LikeButton } from './like-button';
import { getPosts } from './data';

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          {post.title}
          <LikeButton postId={post.id} />
        </li>
      ))}
    </ul>
  );
}
\`\`\`

## When you need a client component

Anything that uses state, effects, event handlers or browser APIs must be a Client Component:

\`\`\`tsx
// app/posts/like-button.tsx
'use client';

import { useState } from 'react';

export function LikeButton({ postId }: { postId: string }) {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>{liked ? 'Liked' : 'Like'}</button>;
}
\`\`\`

Keep these points in mind:

- \`'use client'\` marks a boundary. Every module the client file imports is bundled for the browser too.
- Props passed from a Server Component to a Client Component must be serializable, so pass plain data rather than class instances or functions.
- Push the boundary down to the smallest interactive leaf, so most of the tree stays on the server.

Start with Server Components and add the directive only where the browser genuinely needs to run code.`,
  },
  {
    key: 'revalidate-path',
    title: 'Revalidate Cached Pages On Demand with revalidatePath',
    excerpt:
      'Time-based revalidation keeps pages fast but can serve stale data after an edit. Call revalidatePath from the mutation that changed the data to refresh pages immediately.',
    tags: ['nextjs', 'caching', 'performance'],
    community: 'nextjs',
    author: 'maya-chen',
    daysAgo: 12,
    hourUtc: 16,
    content: `## Time-based revalidation is not enough

A page with \`export const revalidate = 60\` serves a cached copy for up to a minute after an edit. That is fine for a blog index, but an author who saves a correction and reloads the page expects to see it right away.

Call \`revalidatePath\` from the mutation that changed the data:

\`\`\`ts
'use server';

import { revalidatePath } from 'next/cache';

export async function updatePost(slug: string, input: PostInput) {
  await savePost(slug, input);
  revalidatePath(\`/blogs/\${slug}\`);
  revalidatePath('/blogs');
}
\`\`\`

\`revalidatePath\` marks the cached route as stale. The next request regenerates it, so visitors see the new content without waiting for the timer.

## Choose the right granularity

- Pass a literal path such as \`/blogs/my-post\` to refresh one page.
- Pass a route pattern with \`'page'\` or \`'layout'\` as the second argument to refresh every matching page. A dynamic segment such as \`/blogs/[slug]\` requires that argument.
- Use cache tags with \`revalidateTag\` when one change affects pages you cannot list in advance, such as a profile page and a feed of its posts.

Keep the time-based \`revalidate\` value as a safety net. If an on-demand call is ever missed, the page still catches up within the interval.`,
  },
  {
    key: 'route-handlers',
    title: 'Building a JSON API with Next.js Route Handlers',
    excerpt:
      'Route Handlers let a Next.js app expose JSON endpoints under app/api. See how to validate query input with Zod, return meaningful status codes and keep handlers thin.',
    tags: ['nextjs', 'api', 'routing'],
    community: 'nextjs',
    author: 'luca-moretti',
    daysAgo: 20,
    hourUtc: 11,
    content: `## A route file per endpoint

A Route Handler is a \`route.ts\` file in \`app/api\` that exports functions named after HTTP methods. Use one when a client outside the app needs JSON, or when a client component has to call the server. Server Components can call data functions directly and skip the HTTP layer.

\`\`\`ts
// app/api/posts/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { listPosts } from '@/lib/posts';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = querySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }

  const posts = await listPosts(parsed.data.limit);
  return NextResponse.json(posts);
}
\`\`\`

## Practical rules

- Parse input with a schema on every request. Never trust the raw query string or body.
- Return status codes that mean something: 400 for bad input, 401 when the caller is not signed in, 404 for an unknown id.
- Keep the handler thin. Put the logic in a function that both the route and Server Components can import.
- Cache behavior is opt-in. Handlers that read request data are dynamic, so check the caching docs before assuming a response is stored.

A small set of well-named endpoints is easier to document and test than one catch-all handler that switches on query parameters.`,
  },
  {
    key: 'php-value-objects',
    title: 'Modeling Value Objects with PHP readonly Classes and Typed Constants',
    excerpt:
      'Value objects should never change after creation. PHP readonly classes and typed class constants let a small money class enforce its own rules.',
    tags: ['php', 'php-8', 'types'],
    community: 'php',
    author: 'daniel-okafor',
    daysAgo: 6,
    hourUtc: 13,
    content: `## Why these features matter

A value object should not change after it is created, and its constants should have types. PHP 8.1 added \`readonly\` properties, PHP 8.2 added \`readonly\` classes, and PHP 8.3 added typed class constants. Together they let a small money class protect its own invariants.

\`\`\`php
<?php

declare(strict_types=1);

final readonly class Money
{
    public const string DEFAULT_CURRENCY = 'USD';

    public function __construct(
        public int $amount,
        public string $currency = self::DEFAULT_CURRENCY,
    ) {
        if ($amount < 0) {
            throw new InvalidArgumentException('Amount cannot be negative.');
        }
    }

    public function add(self $other): self
    {
        if ($other->currency !== $this->currency) {
            throw new InvalidArgumentException('Currency mismatch.');
        }

        return new self($this->amount + $other->amount, $this->currency);
    }
}
\`\`\`

## Practical notes

- Typed class constants require PHP 8.3. Check the \`php\` requirement in \`composer.json\` before using them in a shared package.
- A readonly property can be initialized only from inside its class. Any later write throws an \`Error\`.
- Store amounts as integers in the smallest currency unit, such as cents, to avoid floating-point rounding.

Operations such as \`add()\` return a new instance instead of mutating the old one, which makes the code easier to reason about and to test.`,
  },
  {
    key: 'pdo',
    title: 'Writing Safe SQL with PDO Prepared Statements',
    excerpt:
      'String-built SQL invites injection. PDO prepared statements keep data separate from the query text, and a few habits make them safer still.',
    tags: ['php', 'security'],
    community: 'php',
    author: 'sofia-martins',
    daysAgo: 15,
    hourUtc: 9,
    content: `## Keep data out of the SQL text

String concatenation lets user input change the meaning of a query. A prepared statement sends the SQL text and the values separately, so the database never parses the values as SQL.

\`\`\`php
<?php

declare(strict_types=1);

$dsn = 'mysql:host=127.0.0.1;dbname=app;charset=utf8mb4';

$pdo = new PDO($dsn, $dbUser, $dbPassword, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
]);

$stmt = $pdo->prepare('SELECT id, name FROM users WHERE email = :email');
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();
\`\`\`

## Habits that matter

- Never interpolate input into the SQL string, even when it looks safe. Bind it instead.
- Placeholders cannot bind table or column names. Choose those from an explicit allowlist.
- Set \`ERRMODE_EXCEPTION\` so a failed query cannot pass silently.
- Turn off emulated prepares so MySQL performs real server-side preparation.
- Use \`utf8mb4\` so multibyte input is stored and compared the way you expect.

Prepared statements are not a substitute for validation. Check types and lengths at the boundary, then bind every value you pass to the database.`,
  },
  {
    key: 'eager-loading',
    title: 'Fixing N+1 Queries with Laravel Eager Loading',
    excerpt:
      'Looping over models and touching a relation fires one query per row. Eager loading with with() turns that into a fixed number of queries, and a guard catches regressions.',
    tags: ['laravel', 'eloquent', 'performance'],
    community: 'laravel',
    author: 'daniel-okafor',
    daysAgo: 1,
    hourUtc: 10,
    content: `## The query multiplies

Loading 20 posts and then reading each post's author looks harmless. It runs one query for the posts, then one more for every author loaded lazily inside the loop. That is 21 queries for a page that could need two.

\`\`\`php
// Lazy loading: 1 query for posts, plus 1 per post for its author
$posts = Post::latest()->take(20)->get();

foreach ($posts as $post) {
    echo $post->author->name;
}

// Eager loading: 2 queries in total
$posts = Post::with('author')->latest()->take(20)->get();
\`\`\`

## Make regressions fail loudly

Eager loading is easy to forget when a new view is added. A few tools help:

- Call \`Model::preventLazyLoading(! app()->isProduction())\` in the \`boot\` method of \`AppServiceProvider\`. Any lazy load outside production then throws instead of quietly running a query.
- Use \`$posts->load('author')\` when you already have a collection and need a relation added later.
- Use \`withCount()\` for totals such as comment counts, instead of counting each relation inside the loop.

After a change, open the page with a query log or Laravel Debugbar and check that the query count does not grow with the number of rows.`,
  },
  {
    key: 'queues',
    title: 'Background Jobs with Laravel Queues, Retries and Backoff',
    excerpt:
      'Sending email or calling a slow API should not block the request. Laravel queues run that work in workers, and tries, backoff and failed-job handling keep it reliable.',
    tags: ['laravel', 'queues', 'api'],
    community: 'laravel',
    author: 'sofia-martins',
    daysAgo: 11,
    hourUtc: 15,
    content: `## Move slow work out of the request

Sending a receipt email or calling a payment provider can take seconds. Dispatching a job puts the work on a queue, and a worker process runs it, so the HTTP response returns right away.

\`\`\`php
class SendReceiptEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    public array $backoff = [10, 60, 300];

    public function __construct(public int $orderId) {}

    public function handle(): void
    {
        $order = Order::findOrFail($this->orderId);

        Mail::to($order->email)->send(new ReceiptMail($order));
    }

    public function failed(Throwable $exception): void
    {
        report($exception);
    }
}

SendReceiptEmail::dispatch($order->id);
\`\`\`

## Operating the queue

- Run workers with \`php artisan queue:work --tries=3\` under a process manager such as Supervisor or systemd. Run \`php artisan queue:restart\` after each deploy so workers load the new code.
- Models are fetched again when the job runs, so check that the work is still needed before any side effect.
- A job can run twice after a timeout, so make \`handle()\` idempotent. Checking whether the receipt was already sent is enough for this example.
- Inspect failures with \`php artisan queue:failed\` and retry them with \`php artisan queue:retry all\`.

Treat the queue as part of production. Monitor its backlog and failure count, the same way you monitor the web tier.`,
  },
  {
    key: 'async-generators',
    title: 'Async Generators and for await...of in JavaScript',
    excerpt:
      'Async generators let you process a stream of pages, events or chunks one item at a time. Learn how for await...of consumes them and how to stop early without leaks.',
    tags: ['javascript', 'async'],
    community: 'javascript',
    author: 'luca-moretti',
    daysAgo: 7,
    hourUtc: 12,
    content: `## Producers that pause

An async generator is a function declared with \`async function*\`. It can \`await\` inside its body and \`yield\` values one at a time. The consumer pulls each value when it is ready, so memory stays flat even for a long paginated API.

\`\`\`js
async function* fetchOrders(startUrl) {
  let url = startUrl;

  while (url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Request failed with status ' + response.status);
    }

    const page = await response.json();
    yield* page.items;
    url = page.nextUrl;
  }
}

for await (const order of fetchOrders('/api/orders')) {
  await saveOrder(order);
}
\`\`\`

## Stopping early

A \`break\`, a \`return\` or a thrown error inside \`for await...of\` calls the generator's \`return()\` method. That runs any \`finally\` block in the generator, which is the right place to close a connection or release a lock.

\`\`\`js
async function* readLines(stream) {
  try {
    for await (const chunk of stream) {
      yield chunk.toString();
    }
  } finally {
    stream.destroy();
  }
}
\`\`\`

## Notes

- Use \`for await\` inside async functions or at the top level of an ES module.
- Each \`yield\` waits for the consumer, so a slow loop applies backpressure to the producer.
- When you need every result at once and the total is small, \`Promise.all\` is simpler.`,
  },
  {
    key: 'structured-clone',
    title: 'Why structuredClone Beats JSON for Deep Copies',
    excerpt:
      'JSON.parse(JSON.stringify(value)) changes data silently. Dates become strings and Sets vanish. structuredClone copies richer values with their types intact.',
    tags: ['javascript', 'browser-apis', 'performance'],
    community: 'javascript',
    author: 'priya-nair',
    daysAgo: 26,
    hourUtc: 18,
    content: `## JSON loses types

\`JSON.parse(JSON.stringify(value))\` is a popular way to deep copy, but it changes data without warning. \`undefined\` properties disappear, \`Date\` objects become strings, \`Map\` and \`Set\` become empty objects, and \`NaN\` becomes \`null\`.

\`\`\`js
const original = {
  createdAt: new Date('2026-01-01T00:00:00Z'),
  tags: new Set(['react', 'hooks']),
  draft: undefined,
};

const viaJson = JSON.parse(JSON.stringify(original));
// viaJson.createdAt is a string, viaJson.tags is {}, and draft is gone

const copy = structuredClone(original);
// copy.createdAt is a Date, copy.tags is a Set, and copy keeps draft as undefined
\`\`\`

## What structuredClone can and cannot copy

\`structuredClone\` implements the HTML structured clone algorithm. It handles plain objects, arrays, \`Date\`, \`RegExp\`, \`Map\`, \`Set\`, \`ArrayBuffer\` and cyclic references.

- It throws a \`DataCloneError\` for functions, symbols and DOM nodes.
- It copies only data. Class instances come back as plain objects without their prototype methods.
- For large binary buffers, pass them in the \`transfer\` option to move ownership instead of copying the bytes.

It is available in Node 17 and later and in all current browsers. For a value you own and control, it is usually the simplest correct copy.`,
  },
  {
    key: 'discriminated-unions',
    title: 'Model UI State with TypeScript Discriminated Unions',
    excerpt:
      'Boolean flags such as isLoading and isError allow impossible combinations. A discriminated union describes each state once and lets TypeScript narrow the data safely.',
    tags: ['typescript', 'types', 'type-safety'],
    community: 'typescript',
    author: 'luca-moretti',
    daysAgo: 3,
    hourUtc: 9,
    content: `## Booleans allow impossible states

A component with \`isLoading\`, \`isError\` and \`data\` flags can end up loading, showing an error and holding stale data all at once. Each combination is a valid TypeScript value, and nothing stops it from happening.

## One union, one status

Describe each state as its own member of a union, with only the fields that exist in that state:

\`\`\`ts
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

function renderState<T>(state: RequestState<T>, format: (data: T) => string): string {
  switch (state.status) {
    case 'idle':
      return 'Not started';
    case 'loading':
      return 'Loading';
    case 'success':
      return format(state.data);
    case 'error':
      return state.message;
  }
}
\`\`\`

Inside each \`case\`, TypeScript narrows \`state\`, so \`data\` is only visible on success and \`message\` only on error.

## Make the compiler enforce coverage

The switch above is already exhaustive. Adding a \`default\` branch that assigns \`state\` to a \`never\` variable makes the intent explicit. If someone later adds a \`'cancelled'\` status, the build fails until that case is handled.

Unions fit any UI state machine well. Typical candidates are:

- Forms, with states such as editing, submitting and saved.
- File uploads, with states such as selecting, uploading, processing and failed.
- Data fetches, with the idle, loading, success and error states shown above.

The code that renders each state then reads like the list of states it has.`,
  },
  {
    key: 'zod',
    title: 'Validate Untrusted Input with Zod and z.infer',
    excerpt:
      'Define a Zod schema once, validate request bodies against it, and derive the TypeScript type with z.infer so the runtime check and the compile-time type never drift.',
    tags: ['typescript', 'zod', 'type-safety'],
    community: 'typescript',
    author: 'maya-chen',
    daysAgo: 14,
    hourUtc: 17,
    content: `## Define the schema once

Request bodies arrive as \`unknown\`. A Zod schema checks them at runtime, and \`z.infer\` derives the TypeScript type from the same definition, so the two cannot drift apart.

\`\`\`ts
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().trim().min(5).max(120),
  tags: z.array(z.string().trim().toLowerCase()).max(5),
  status: z.enum(['draft', 'published']).default('published'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export async function handleCreatePost(request: Request): Promise<Response> {
  const result = createPostSchema.safeParse(await request.json());

  if (!result.success) {
    return Response.json(z.flattenError(result.error), { status: 400 });
  }

  const input: CreatePostInput = result.data;
  return Response.json(input, { status: 201 });
}
\`\`\`

## Practical notes

- Use \`safeParse\` at every boundary, and continue with \`result.data\`, never with the raw body.
- \`z.infer\` gives the output type, after defaults and transforms. Use \`z.input\` when you need the shape a client is allowed to send.
- Reuse the same schema in the client form for instant feedback, then run it again on the server, because the client check can be bypassed.`,
  },
];

export const SEED_COMMENTS: readonly SeedComment[] = [
  {
    post: 'derive-state',
    author: 'priya-nair',
    content:
      'This clicked for me after a stale value cost us an afternoon. Removing three effects from our checkout form made it easier to read and to test.',
    hoursAfterPublish: 6,
  },
  {
    post: 'derive-state',
    author: 'sofia-martins',
    content:
      'Does this still hold with the React Compiler enabled? I assume it does, since the derived value is pure, but I would like to see it confirmed.',
    hoursAfterPublish: 10,
  },
  {
    post: 'profiler',
    author: 'maya-chen',
    content:
      'The "why did this render" option found an inline options object that defeated memo on our list. Moving it into a module constant fixed it.',
    hoursAfterPublish: 30,
  },
  {
    post: 'server-client',
    author: 'luca-moretti',
    content:
      'Good reminder that the boundary is the "use client" file. Everything that file imports ships to the browser too, so keep heavy libraries out of it.',
    hoursAfterPublish: 5,
  },
  {
    post: 'revalidate-path',
    author: 'daniel-okafor',
    content: 'Does revalidatePath work from a Route Handler too, or only from Server Actions?',
    hoursAfterPublish: 2,
  },
  {
    post: 'route-handlers',
    author: 'priya-nair',
    content:
      'Would you put rate limiting in the proxy or inside the handler? We need it for the public search endpoint.',
    hoursAfterPublish: 3,
  },
  {
    post: 'php-value-objects',
    author: 'sofia-martins',
    content:
      'Heads up: typed class constants need PHP 8.3. Check the platform requirement in composer.json before you use them in a shared package.',
    hoursAfterPublish: 4,
  },
  {
    post: 'eager-loading',
    author: 'maya-chen',
    content:
      'Calling Model::preventLazyLoading in AppServiceProvider caught two regressions in our admin panel last week. Worth enabling outside production.',
    hoursAfterPublish: 8,
  },
  {
    post: 'queues',
    author: 'luca-moretti',
    content:
      'Make sure the job is idempotent. A timeout followed by a retry can run handle() twice, and customers should not receive two receipts.',
    hoursAfterPublish: 10,
  },
  {
    post: 'async-generators',
    author: 'maya-chen',
    content:
      'I did not know that break inside for await calls return() on the generator. That makes finally blocks a reliable cleanup point for paginated streams.',
    hoursAfterPublish: 6,
  },
  {
    post: 'structured-clone',
    author: 'daniel-okafor',
    content:
      'We hit the Set-to-object problem with session data in exactly this way. structuredClone fixed it without a custom serializer.',
    hoursAfterPublish: 12,
  },
  {
    post: 'zod',
    author: 'luca-moretti',
    content:
      'Would you keep the schema next to the route, or in a shared module the client form can import as well?',
    hoursAfterPublish: 5,
  },
  {
    post: 'discriminated-unions',
    author: 'priya-nair',
    content:
      'The never check in the default branch is a good pattern. The compiler flagged the missing case as soon as we added a new status.',
    hoursAfterPublish: 4,
  },
];

export const SEED_BOOKMARKS: readonly SeedBookmark[] = [
  { username: 'maya-chen', post: 'discriminated-unions' },
  { username: 'maya-chen', post: 'async-generators' },
  { username: 'priya-nair', post: 'testing-library' },
  { username: 'priya-nair', post: 'route-handlers' },
  { username: 'luca-moretti', post: 'derive-state' },
  { username: 'luca-moretti', post: 'revalidate-path' },
  { username: 'daniel-okafor', post: 'server-client' },
  { username: 'daniel-okafor', post: 'zod' },
  { username: 'sofia-martins', post: 'profiler' },
  { username: 'sofia-martins', post: 'structured-clone' },
];
