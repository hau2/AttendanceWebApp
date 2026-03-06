# Stitch Design Tokens (extracted from HTML source)

## Colors
- **Primary**: `#4848e5` (used everywhere: buttons, links, active nav, focus rings, badges)
- **Primary hover**: `primary/90` (opacity)
- **Primary focus ring**: `ring-primary/50`
- **Background**: `#f6f6f8` (page background, body)
- **Surface**: `#ffffff` (cards, tables, modals)
- **Employee check-in green**: `#10b981` (emerald-500), hover `#059669`

## Font
- **Family**: `"Geist Sans", "Inter", sans-serif` (already using Geist via Next.js)
- **Body**: antialiased

## Neutral Palette (Login page defines custom neutrals)
- neutral-50: `#f5f5f9`
- neutral-100: `#ebebf4`
- neutral-200: `#d6d6e9`
- neutral-300: `#c2c2de`
- neutral-400: `#9999c8`
- neutral-500: `#7070b2`
- neutral-600: `#5a5a8e`
- neutral-700: `#43436b`
- neutral-800: `#2d2d47`
- neutral-900: `#161624`

Most pages use standard Tailwind `slate-*` instead of custom neutrals. Use `slate-*` for consistency.

## Border Radius
- DEFAULT: `0.5rem` (8px)
- lg: `1rem` (16px)
- xl: `1.5rem` (24px)
- full: `9999px`

## Spacing / Sizing

### Inputs
- Login inputs: `h-12 pl-11 pr-4 rounded-lg text-base` (with left icon)
- Register inputs: `h-11 px-4 rounded-lg text-sm`
- Filter inputs: `py-2 pl-10 pr-4 rounded-lg text-sm`
- Filter selects: `pl-4 pr-10 py-2 rounded-lg text-sm min-w-[140px]`

### Buttons
- Primary: `h-12 px-5 rounded-lg bg-primary text-white text-base font-bold` (login)
- Standard: `h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold` (add user)
- Outline: `h-10 px-4 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700`
- Small: `h-10 px-5 rounded-lg text-sm font-medium`

### Tables
- Header: `px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider`
- Body cell: `px-6 py-4 text-sm`
- Row hover: `hover:bg-slate-50 transition-colors`
- Container: `rounded-xl border border-slate-200 bg-white shadow-sm`

### Cards (KPI)
- Container: `rounded-xl p-6 bg-white shadow-sm border border-slate-100`
- Label: `text-sm font-medium text-slate-500 uppercase tracking-wider`
- Value: `text-4xl font-bold`
- Trend: `text-sm font-medium` (emerald-600 for up, red-600 for down, slate-400 for stable)

## Role Badges
- Admin: `bg-primary/10 text-primary` (custom purple-blue)
- Manager: `bg-indigo-100 text-indigo-800`
- Employee: `bg-slate-100 text-slate-800`
- Disabled employee: `bg-slate-100 text-slate-500`

## Status Badges
- Active: `bg-green-100 text-green-800`
- Disabled: `bg-slate-200 text-slate-600`
- On-time: `bg-green-100 text-green-800`
- Late: `bg-red-100 text-red-800`
- Remote: `bg-primary/10 text-primary` with wifi icon

## Action Icons (Material Symbols → use Lucide equivalents)
- Edit: `edit` → Lucide `Pencil`
- Delete: `delete` → Lucide `Trash2`
- Assign Shift: `calendar_add_on` → Lucide `CalendarPlus`
- View: `visibility` → Lucide `Eye`
- Search: `search` → Lucide `Search`
- Refresh: `refresh` → Lucide `RefreshCw`
- Upload: `upload` → Lucide `Upload`
- Add: `add` → Lucide `Plus`

## Avatar Circles
- Size: `size-8` (32px) in tables
- Style: `rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600`
- Initials: first letter of first + last name (e.g., "NV" for Nguyen Van)

## Rank Circles (Executive late ranking)
- #1: `bg-red-100 text-red-700` + late count in `text-red-600 font-semibold`
- #2: `bg-orange-100 text-orange-700` + `text-orange-600`
- #3: `bg-amber-100 text-amber-700` + `text-amber-600`
- #4+: `bg-slate-100 text-slate-600` + `text-slate-700`

## Pagination
- Active page: `bg-primary text-white rounded`
- Inactive: `border border-slate-200 text-slate-600 hover:bg-slate-50 rounded`
- Info: `text-sm text-slate-500` "Showing 1 to 3 of 50 entries"

## Employee Dashboard (Check-in Card)
- Card: `rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 p-6 md:p-8`
- Decorative blur: `absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl`
- Title: `text-2xl font-bold`
- Subtitle: `text-base text-text-muted`
- Remote checkbox: `h-6 w-6 rounded text-primary` inside `p-4 rounded-lg bg-gray-50 border border-gray-200`
- CHECK IN button: `rounded-xl h-16 bg-[#10b981] hover:bg-[#059669] text-white text-lg font-bold shadow-lg shadow-primary/30`
- View History link: `text-text-muted hover:text-primary font-medium` with history icon

## Brand Logo (Login/Register)
- Container: `h-12 w-12 rounded-xl bg-primary shadow-lg shadow-primary/30 text-white`
- Icon: Material `how_to_reg` → Lucide `UserCheck` (24px)

## Stitch HTML Files
Saved to `.planning/phases/13-ui-redesign/stitch-html/` for pixel-perfect reference during execution.
