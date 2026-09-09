# JSX Conventions

Atlas renders JSX on the server with Hono. Components produce HTML for a request; they do not own browser state,
re-render in the browser, or attach client-side event handlers. Put request handling, data loading, mutations, and
permissions in Hono routes and services. Use native HTML, HTMX, or focused browser scripts for browser interaction.

## Date formats

Persist all dates in UTC and display them in the user's local time zone.

When rendering dates, use the standard formats defined in `lib/utils/dates.ts` rather than defining new formats inline.

## Components

### Design props around meaning

Express a component contract semantically.

- Prefer `isSelected` over `blueBackground`
- Prefer `disabled` over `isClickable={false}`
- Prefer a named content prop such as `footer` over a presentation-specific flag

### Keep rendering predictable

Keep components free of mutations, I/O, and other side effects. Prepare data in the route handler or service, then
pass the values needed to render HTML to the component.

A component may derive display-only values from its props. Do not make rendering depend on invocation order or hidden
request state.

### Prefer native forms and browser behavior

Use standard HTML forms, native validation, and form submission by default. Read submitted values in the route handler.

Add HTMX or browser JavaScript only when the interaction needs it, such as live search, cross-field validation, or
formatting while the user types. Keep the server route responsible for validating and applying a mutation.

### Split large components

Split a large JSX component when it improves readability without creating a false abstraction.

- Keep request handling, data loading, permissions, and mutation policy in routes or services
- Extract markup blocks that do not need their own behavior into presentational components with explicit props
- Keep closely related components in the same file until reuse justifies a separate module
- Do not create a component solely because a JSX fragment is short or repeated once

### Keep non-trivial logic out of JSX

Compute non-trivial values before the `return` and reference the resulting variables from JSX.

Do not place filtering, mapping, branching algorithms, or other non-trivial transformations directly in JSX. Simple
boolean guards are fine, for example: `{error ? <p role="alert">{error}</p> : null}`.

### Avoid premature abstraction

Prefer duplication over the wrong abstraction.

- Extract shared code only when the shared concept can be named
- Do not abstract components solely because their JSX looks similar
- Do not preserve an abstraction merely because a specification proposed it

### Prefer composition over configuration

Treat a growing collection of flags or variants as evidence that an abstraction may be collapsing. Prefer `children`,
named content props, and component parts when supporting multiple layouts, shells, or optional regions.

### Use component parts for structured UI

Expose composable parts when a reusable surface has distinct regions that consumers need to arrange, such as a dialog
header, content, and footer.

```tsx
import {Dialog, DialogContent, DialogFooter, DialogHeader} from './Dialog.tsx';

<Dialog>
  <DialogHeader title="Invite team member" message="Invite someone to your workspace." />
  <DialogContent>...</DialogContent>
  <DialogFooter>...</DialogFooter>
</Dialog>;
```

Prefer standalone parts such as `DialogHeader` over namespaced access such as `Dialog.DialogHeader`.

### Use slots situationally

Use slots when a full component-parts API would be unnecessary overhead and a small number of named regions need
customization.

- Prefer `children` for a single content region
- Prefer semantic props for simple values
- Use slots for limited, clearly named regions
- Do not use slots as the default composition pattern

### Let parents control external layout

Let reusable components accept `class` and avoid owning external layout such as margins, page positioning, or parent
flex and grid placement. Do not design reusable leaf components around page-specific layout.

## Request and Data Flow

### Keep orchestration at explicit boundaries

Routes and services coordinate fetching, mutations, permissions, and requests to external systems. JSX components
render the prepared result and reusable UI mechanics.

A dialog component may provide dialog markup, but deletion rules, permission checks, and mutation policy belong in the
app's route and domain code. Keep routing, fetching, mutations, permissions, and cross-page coordination explicit.

### Model mutually exclusive states as unions

When states cannot occur together, represent them as a discriminated union rather than independent booleans or
optional fields. Make impossible states unrepresentable instead of guarding against them at every read site.

```ts
// Permits isLoading && error && data simultaneously
type State = {isLoading: boolean; error?: Error; data?: Record};

// One state at a time, with a non-optional payload in the relevant branch
type State =
  {status: 'empty'} | {status: 'error'; error: Error} | {status: 'loaded'; record: Record};
```

Switch on the discriminant when selecting a response or rendering a page. The same applies to component props: a union
of valid prop shapes is better than a wide prop type whose combinations are mostly invalid.

### Handle user-visible outcomes explicitly

Every route that fetches data or applies a mutation should deliberately account for the outcomes the user can observe.

Consider, as applicable:

- pending or in-progress feedback for HTMX or browser-driven requests
- empty results
- validation and operational errors
- successful completion

Do not let missing states emerge accidentally from `undefined`, stale partial content, or incomplete response logic.
When a mutation can occur alongside existing content, make both the current content and mutation result clear.

### Handle request failures at route boundaries

Return useful error responses from expected failure paths, with an appropriate recovery action when one exists. Let the
host-level error handler handle unanticipated failures consistently; do not duplicate broad failure handling in each
component.

## File Organization

### Module structure

Organize files by feature or responsibility.

- Prefer a flat directory structure
- Introduce subdirectories only for cohesive webConfig
- Treat non-exported files as module-private
- Follow the repository's feature boundaries: apps own feature pages and routes, while `src/ui/` holds genuinely
  shared presentation

### Promote components as reuse grows

Start with the narrowest scope that serves the component's consumers.

1. Keep supporting components private in the same file as the main exported component.
2. When other components within an app need them, move them into an app-local module, such as
   `src/apps/design-system/`, `src/apps/dashboard/`, or `src/apps/jellyfin/`.
3. Promote genuinely reusable presentation to `src/ui/`, including app-local components that need to be shared
   across apps. Remove app-specific assumptions from their contracts before sharing them.

Splitting a large component does not itself justify promotion. Let a clear shared responsibility or actual reuse
drive the move; do not import components from another app.

## Code Style

### Exports and declarations

Use named exports. Do not use `export default`.

Declare JSX components as named function declarations, not arrow functions assigned to a `const`.

```tsx
// Yes
export function RevisionCard({revision}: RevisionCardProps) {
  return <article>{revision.name}</article>;
}

// No
export const RevisionCard = ({revision}: RevisionCardProps) => {
  return <article>{revision.name}</article>;
};
```

### Conditionals

- Do not use ternaries inside object literals; compute the value first
- Do not use nested ternaries
- Use a single-level ternary only when both branches are short and obvious

Use `if`/`else`, `switch`, lookup maps, or computed variables when they better express the decision.

### Named types for component props

Always use a named type for component props.

```tsx
type CardProps = {
  isSelected?: boolean;
  title: string;
};

export function Card({isSelected, title}: CardProps) {
  return <section aria-selected={isSelected}>{title}</section>;
}
```

For wrappers around an HTML element, derive the attribute type from `JSX.IntrinsicElements` and explicitly define the
component's additions and omissions.

## Styling

### Class names

Use `clsx` when combining conditional classes. Do not add a dependency merely to combine one trivial class name.

### Styling system and themes

Before building UI, inspect the relevant components in `src/ui/`, their working examples in
`src/apps/design-system/`, and the tokens in `src/styles/theme.css`. Reuse shared components when their meaning and
behavior fit. Follow the component promotion rules above for new presentation. When adding or changing shared UI,
update the relevant gallery examples and verify affected behavior with Playwright.

Use semantic theme colors and `type-*` typography. Do not introduce raw color palettes, literal colors, or bespoke
font sizes in JSX or component CSS. Add missing reusable visual roles to `theme.css` and document them in the design
system gallery. Feedback uses `success`, `info`, `warning`, and `danger`; errors share `danger` with destructive
actions and invalid fields. Use `shadow` for shadow colors and `overlay` for backdrops, with opacity modifiers as
needed. Ordinary Tailwind spacing, sizing, layout, radius, and shadow-size utilities are allowed. Inline emphasis
and numeric formatting utilities may supplement a semantic type style.

`AppLayout` owns the single toast region for each app page. App routes can return `<Toast oob>` in HTMX responses;
pages using this layout must not add another region. Toasts communicate routine form success/error states.

### Tailwind and custom CSS

Use Tailwind utilities in JSX by default, including responsive, hover, focus, and semantic state variants. Repeated
markup and styling usually belong in a component rather than a new global class.

Add custom CSS when it makes a cohesive styling concern clearer, such as keyframes, shared table element rules,
or dialog sizing invariants. A long class list alone does not require a stylesheet. Custom CSS must use the same
theme tokens through `var(...)` or `@apply`; it must not create a parallel palette or typography scale.

Keep styles in `src/styles`. `src/styles/index.css` is the single browser entry point and builds to
`public/styles/app.css`.

Keep the global app stylesheet focused with small, top-level support files:

- `base.css` for document-level styles and global overrides
- `theme.css` for design tokens, typography, and theme definitions
- a focused shared stylesheet when a substantial global concern needs one
- `index.css` as the global stylesheet entry point

Use Tailwind utilities in JSX and focused shared stylesheets in `src/styles/` when native CSS is clearer. Do
not add feature stylesheet entry points.

`index.css` is the only stylesheet entry point that imports `tailwindcss`. It scans `src` and any browser scripts named
with `@source`, so utilities used while constructing DOM nodes imperatively are included in the output.

Tailwind utility classes used in feature JSX are generated by `index.css`. Add an `@source` only for browser scripts
that construct DOM with Tailwind class names; do not create feature-specific Tailwind source lists.

### Style states explicitly

Target visual states through semantic attributes a component exposes, such as `disabled`, `aria-selected`, and
`data-state`. Keep accessibility state synchronized with visual state.

Avoid selectors that depend on exact nesting such as `> div > span`. Prefer classes, semantic attributes, and explicit
component parts.

### Prefer CSS for presentation

Use CSS for responsive behavior, visibility, hover and focus states, and basic layout when it expresses the intent
cleanly. Do not duplicate presentation logic in server-side JSX or browser scripts.

## Accessibility

### Use semantic HTML

Prefer native HTML elements and semantics before custom ARIA-based behavior.

- Use the correct element for the interaction, such as `button`, `a`, `input`, and `label`
- Do not recreate native controls with generic elements
- Use ARIA only when native semantics are insufficient
- Do not add ARIA that conflicts with native semantics

### Support keyboard interaction and focus

Ensure interactive UI is fully operable by keyboard. Preserve expected behavior for native controls and visible focus
indicators. When temporary UI such as a dialog changes focus, move and restore focus deliberately.

### Provide accessible names and states

Provide accessible names for controls and meaningful images. Associate form controls with their labels and errors, and
use attributes such as `disabled`, `aria-expanded`, and `aria-selected` where appropriate.

### Announce meaningful changes

Make errors, status changes, and asynchronous results available to assistive technology when they are not otherwise
apparent. Prefer existing semantic mechanisms before adding live regions, and do not announce routine updates.

## Playwright

### Prefer semantic selectors

Structure the DOM so tests can target elements by user-visible meaning.

- Prefer roles, accessible names, labels, and visible text
- Use `id` or `data-testid` when no stable semantic selector exists
- Keep test IDs semantic and stable rather than tied to implementation details
- Never use selectors that depend on DOM order

### Prefer Page Object Models

Use Page Object Models to encapsulate page selectors and common interactions.

- Name page POM files `<page-name>.pom.ts`
- Use `<component-name>.pom.ts` for reusable interaction surfaces such as dialogs and panels
- Keep selectors and reusable page interactions in the POM
- Keep test scenarios and assertions in test files
- Reuse POM methods instead of duplicating selector logic across tests
