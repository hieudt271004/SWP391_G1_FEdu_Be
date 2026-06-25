---
name: FEdu Design System
description: A high-density, professional, and crisp workspace designed for seamless task management.
colors:
  primary: "#030213"
  neutral-bg: "#ffffff"
  neutral-fg: "#000000"
  muted: "#ececf0"
  muted-fg: "#717182"
  accent: "#e9ebef"
  border: "rgba(0, 0, 0, 0.1)"
typography:
  display:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Outfit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "10px"
spacing:
  sm: "8px"
  md: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "#1c1b2d"
  card:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "20px"
---

# Design System: FEdu LMS

## 1. Overview

**Creative North Star: "The Academic Command Center"**

The FEdu Design System is a highly structured, professional, and task-focused visual workspace designed for educational administrators, teachers, and students. By framing the product interface as a crisp and high-density workspace, it helps users get jobs done with speed and accuracy.

This system relies on flat containers, clear 1px borders, and generous text contrast to organize complex charts, user lists, and learning nodes. It rejects floating decorative gradients, overly rounded container corners (>12px), glassmorphism overlays, and low-contrast muted-gray text.

**Key Characteristics:**
- **Restrained & Authoritative**: Minimal colors used primarily for content readability and state indicators.
- **High-Density**: Compact layouts designed for quick scanning, without feeling cramped.
- **Clean Structure**: Flat panels delimited by fine borders instead of heavy dropshadows.

## 2. Colors

The color palette is strictly restrained, relying on deep near-black primary tones and neutral paper surfaces, paired with high-contrast state colors.

### Primary
- **Midnight Navy** (#030213): Used for primary headers, navigation boundaries, and dominant action buttons.

### Neutral
- **Paper Background** (#ffffff): The main surface for cards, panels, and tables.
- **Slate Text** (#000000): The main text color, ensuring high legibility.
- **Muted Background** (#ececf0): Background fill for inputs, inactive states, and tables.
- **Muted Foreground** (#717182): Standard secondary label text color meeting WCAG AA contrast (>=4.5:1).
- **Fine Border** (rgba(0, 0, 0, 0.1)): Delimits cards, panels, and table rows.

### Named Rules
**The 10% Accent Rule.** Accent colors and high-contrast indicators must occupy no more than 10% of any screen surface. Color is a signal, not a decoration.
**The Legible Muted Rule.** Never use gray text lighter than `#717182` on white surfaces. The text contrast must always exceed 4.5:1.

## 3. Typography

**Display Font:** Outfit (with system sans-serif fallback)
**Body Font:** Outfit (with system sans-serif fallback)

### Hierarchy
- **Display** (700, 32px, 1.2): Main page headers and high-level KPIs.
- **Headline** (600, 20px, 1.3): Major card titles and section titles.
- **Title** (600, 16px, 1.4): Small card titles and metrics labels.
- **Body** (400, 14px, 1.5): Standard copy, student logs, and description prose. Maximum 65-75ch width.
- **Label** (500, 12px, normal): Action triggers, buttons, and status badges.

## 4. Elevation

The FEdu system is flat-by-default, emphasizing structured grid layouts and fine borders over volumetric dropshadows to convey spatial depth.

### Named Rules
**The Flat-By-Default Rule.** All main dashboard sections and stats cards are flat at rest. Dropshadows are reserved exclusively for temporary floating elements like popovers, select menu dropdowns, and modals.

## 5. Components

### Buttons
- **Shape:** Soft square (6px radius).
- **Primary:** midnight navy bg with white text, padding (8px 16px).
- **Hover / Focus:** background dims to `#1c1b2d` on hover, outline ring (2px) on focus.

### Cards / Containers
- **Corner Style:** Rounded corners (10px radius).
- **Background:** White surface at rest, border 1px (rgba(0, 0, 0, 0.1)).
- **Shadow Strategy:** Flat layout, no shadow at rest.

### Inputs / Fields
- **Style:** light gray bg (#f3f3f5), no outline stroke at rest, corner radius (6px).
- **Focus:** 2px focus ring using system primary color.

### Navigation
- **Style:** Compact vertical sidebars or top bars, using clean borders and high-contrast text to mark the current selection.

## 6. Do's and Don'ts

### Do:
- **Do** use `border border-border/60` to divide sections.
- **Do** keep text sizes fixed and rely on grid wrappers for responsive scaling.
- **Do** check contrast using AA standards for all primary actions.

### Don't:
- **Don't** use decorative gradients behind headers or text fields.
- **Don't** use container rounding values larger than 12px.
- **Don't** combine card borders with heavy shadows (avoid the "ghost-card" pattern).
