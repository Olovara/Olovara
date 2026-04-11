# OLOVARA Style Guide

## Brand positioning

OLOVARA is a premium handmade marketplace. The design should feel **calm**, **spacious**, **refined**, and **intentional**.

- Avoid the chaotic look common in marketplaces like Etsy or Amazon.
- Minimal UI, generous white space, clear hierarchy.
- Few colors used intentionally; large imagery; typography-driven layout.
- The interface should feel closer to **Apple**, **Aesop**, or **Swiss editorial design** than a typical ecommerce site.

---

## Typography

### Primary font: Jost

Used for: body text, buttons, navigation, UI elements, product descriptions, form inputs.

- **Weights:** 400 Regular, 500 Medium, 600 SemiBold
- Avoid excessive bolding.

**Tailwind:** `font-jost`

### Display font: Noto Serif Display

Used **sparingly** for visual impact.

- **Use for:** homepage hero heading, large marketing statements, occasional section headers.
- **Never use for:** product listings, UI elements, navigation, long paragraphs.

**Rule:** Display serif = accent, not structure.

**Tailwind:** `font-noto-serif-display`

---

## Color system

**Where values live:** All brand color values are defined once in `app/globals.css`. Tailwind and semantic tokens reference those variables. Change a color only in `globals.css`.

### Brand primary (purple)

- **Key shade:** `brand-primary-700` (primary buttons, links, key accents, focus states)
- **Hover:** `brand-primary-600`
- Avoid flooding the interface with purple; use sparingly.

| Use case       | Tailwind class               |
| -------------- | ---------------------------- |
| Primary button | `bg-brand-primary-700`       |
| Primary hover  | `hover:bg-brand-primary-600` |
| Primary text   | `text-brand-primary-700`     |

### Brand secondary (green)

Subtle balance: secondary accents, success states, organic highlights. Never compete with purple for attention.

### Brand tertiary (warm red)

Use rarely: limited highlights, marketing accents.

### Semantic colors

| Role    | Tailwind class      |
| ------- | ------------------- |
| Success | `brand-success-500` |
| Warning | `brand-warn-500`    |
| Error   | `brand-error-500`   |

### Neutrals

Most of the interface should be neutral.

| Role           | Tailwind class            |
| -------------- | ------------------------- |
| Primary bg     | `white` / `bg-background` |
| Soft bg        | `brand-light-neutral-50`  |
| Borders        | `brand-dark-neutral-200`  |
| Primary text   | `brand-dark-neutral-900`  |
| Secondary text | `brand-dark-neutral-600`  |
| Muted text     | `brand-dark-neutral-500`  |

**Usage:** Prefer `styles/tokens.ts` for consistent class names (e.g. `tokens.colors.primary`, `tokens.colors.textPrimary`).

---

## Spacing system

Swiss design relies on space for clarity.

**Scale (Tailwind):** 1 (4px), 2 (8px), 3 (12px), 4 (16px), 6 (24px), 8 (32px), 12 (48px), 16 (64px), 24 (96px).

**Rules:**

- Section padding: `py-24` to `py-32`
- Card padding: `p-6`
- Grid gaps: `gap-6` or `gap-8`
- Never crowd elements.

---

## Layout

### White space

White space creates hierarchy and luxury. OLOVARA should feel breathable; avoid filling every inch.

### Content width

| Context          | Tailwind    |
| ---------------- | ----------- |
| Main layout      | `max-w-7xl` |
| Readable content | `max-w-5xl` |
| Text blocks      | `max-w-3xl` |

Use `tokens.container.default` or `tokens.container.narrow` when appropriate.

---

## Buttons

### Primary

```html
className="bg-brand-primary-700 text-brand-light-neutral-50 rounded-md px-6 py-3
font-medium hover:bg-brand-primary-600"
```

Or: `tokens.colors.primary`, `tokens.colors.primaryHover`, plus typography and padding.

### Secondary

```html
className="border border-brand-dark-neutral-300 bg-brand-light-neutral-50
rounded-md px-6 py-3"
```

No flashy gradients or heavy shadows. Clean and confident.

---

## Cards

Product cards should feel gallery-like: large images, minimal text, consistent spacing, subtle borders.

**Example:**

```html
className="rounded-lg border border-brand-dark-neutral-200
bg-brand-light-neutral-50"
```

Avoid heavy shadows.

---

## Imagery

- Large product images; neutral backgrounds; minimal clutter; natural lighting.
- Avoid tiny thumbnails. Images are the main selling tool.

---

## Interaction design

**Allowed:** hover opacity, slight scale, smooth transitions.

**Avoid:** bouncy animations, flashy effects, excessive motion. Premium brands move slowly and deliberately.

---

## Marketplace UX

Typical marketplaces overwhelm users. OLOVARA should prioritize **clarity**, **discovery**, and **calm browsing**. Design should encourage slow browsing and appreciation of handmade work, not frantic clicking.

---

## Implementation rule

Before adding a new UI element, ask:

1. Is it necessary?
2. Can it be simpler?
3. Does it add clarity?

If not — remove it. **Luxury interfaces are defined by what they leave out.**
