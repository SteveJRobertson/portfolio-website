# Technical Specification & Product Architecture: Teletext Portfolio

**Project**: Steve Robertson - Teletext Web Portfolio  
**Author**: Solutions Architect & Product Owner  
**Date**: October 2026  
**Status**: Draft for Review  

---

## 1. Product Definition & Vision

The objective is to build a highly memorable, interactive, and fast personal developer portfolio modeled after classic European Teletext systems (BBC Ceefax / ITV ORACLE). 

The application must combine high visual fidelity to the 1980s/90s CRT broadcast aesthetic with modern web performance, mobile responsiveness, and WCAG accessibility compliance.

### Target Audience & UX Goals
- **Recruiters & Engineering Managers**: Instantly wowed by the creative concept, responsive execution, and technical rigor.
- **Developers & Tech Enthusiasts**: Appreciate the authentic SAA5050 Mode 7 typography, 3-digit navigation, Fastext color buttons, and Storybook design system showcase.
- **Assistive Tech Users**: Can navigate effortlessly via standard keyboard shortcuts, screen readers (via hidden semantic DOM), or high-contrast accessible mode (Page 888).

---

## 2. Architectural Analysis & Technology Choices

### 2.1 Technology Stack
- **Framework**: **Vite + React + TypeScript** (Single Page Application).
  - *Rationale*: React provides seamless state management for the rolling 3-digit buffer, keybindings, CRT clock ticker, and page transitions. Vite ensures sub-second HMR and lightweight build output for static hosting.
- **Design System Catalog**: **Storybook**.
  - *Rationale*: Teletext is a purely tokenized system (8 primary CRT colors, SAA5050 character cells, mosaic blocks, Fastext actions). Storybook documents these tokens and allows isolated visual testing.
- **Styling**: **Vanilla CSS / CSS Modules with Custom Properties (Variables)**.
  - *Rationale*: Full control over monospaced character spacing (`1ch`), viewport-based `min()` font scaling, and retro CRT scanline/glow effects without heavy utility framework overhead.
- **Typography**: **Bedstead** WOFF2 (Mode 7 pixel-accurate font) with fallback to `ModeSeven`.
- **Hosting & Deployment**: **GitHub Pages via GitHub Actions CI/CD**.

---

## 3. Key Architectural Improvements Over Previous Proposals

| Feature / Domain | Previous Chat Proposal | Proposed Solution (PO / Architect) | Architectural Advantage |
| :--- | :--- | :--- | :--- |
| **Mobile Grid Layout** | Manual 20×36 dual-buffer array (`mobileLines` + `desktopLines`) | **Dual Mobile Strategy**: Scaled 40×24 CRT Stage + Retro Handheld TV Keypad docked below OR fluid reflow mode. | Eliminates dual-content authoring tax while adding a retro interactive TV remote UX for mobile. |
| **Content Authoring** | Raw line-by-line character array | **Teletext Markup / JSON Parser Engine** with auto word-wrapping | Write clean text with simple color tags (`{cyan}TEXT{/cyan}`); the parser calculates line boundaries automatically. |
| **Accessibility (a11y)** | Hidden DOM (`.sr-only`) + Page 888 toggle | **Dual-Tree Render (Aria-Hidden CRT + Semantic DOM) + Page 888 Subtitle / Reader Toggle** | Full WCAG AA/AAA compliance, screen reader support, keyboard trapping prevention, and SEO indexing. |
| **Widescreen Mode** | Fixed 56×24 aspect-ratio switch | **56×24 Widescreen Teletext ETS 300 706 Split-Screen** (Content + Teletext Index Sidebar) | Maximizes desktop real estate authentically without stretching line lengths awkward across wide monitors. |

---

## 4. System Components & Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                                 USER INPUT LAYER                                |
|  - Physical Keyboard (0-9, R/G/Y/B, Arrows)                                     |
|  - Touch / Mouse (Fastext Bar & Mobile On-Screen Remote Controller)             |
|  - URL Router (/100 or /about, /200 or /projects, /300, /400, /888)             |
+---------------------------------------------------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                           TELETEXT STATE MACHINE HUB                            |
|  - 3-Digit Page Routing Buffer ([1], [0], [0])                                  |
|  - Live Ticker / Clock Generator                                                |
|  - CRT Shader & Theme State Manager                                             |
+---------------------------------------------------------------------------------+
                                        |
                   +--------------------+--------------------+
                   |                                         |
                   v                                         v
+------------------------------------+    +------------------------------------+
|        VISUAL CRT RENDER ENGINE    |    |      SEMANTIC ACCESSIBLE DOM       |
|  - 40x24 / 56x24 CSS Grid          |    |  - Semantic HTML (<main>, <nav>)   |
|  - Bedstead Monospace Pixel Font   |    |  - Screen Reader Announcements     |
|  - Scanline Overlay & Phosphor Glow|    |  - WCAG High Contrast (Page 888)   |
|  - aria-hidden="true"              |    |  - SEO Crawlable Text              |
+------------------------------------+    +------------------------------------+
```

---

## 5. Page Directory Blueprint

- **Page 100**: Main Index / Cover Page ( Steve-Text Home )
- **Page 101**: About Steve (Bio, Experience Summary, Edinburgh location)
- **Page 200**: Projects & Case Studies Index
  - Page 201–205: Individual Project Showcase sub-pages
- **Page 300**: Tech Stack & Engineering Skills Matrix
- **Page 400**: Contact & Social Links (GitHub, LinkedIn, Email)
- **Page 888**: Accessibility / Reader Mode / Subtitles (WCAG Mode Toggle)
- **Page 404**: Authentic Broadcast "PAGE NOT FOUND / SIGNAL LOST" Error Screen

---

## 6. Decision Log

- **DEC-001**: Adopt **Vite + React + TypeScript + Storybook** for tech stack.
- **DEC-002**: Use **Bedstead** WOFF2 monospaced font with exact Mode 7 character metrics.
- **DEC-003**: Implement **Dual-Tree Rendering** (`aria-hidden` visual matrix + `.sr-only` semantic DOM) for 100% accessibility parity.
- **DEC-004**: Adopt **Aspect-Ratio Viewport Engine**:
  - Desktop (≥16:9): 56×24 Widescreen with Sidebar Index.
  - Tablet/Desktop (4:3 to 16:10): 40×24 Classic Ceefax Grid.
  - Mobile (<1:1): Scaled Teletext Viewport + Retro TV Handset Keypad.

---

## 7. Unresolved Questions & PO Next Steps

1. **Image Generation Strategy**: Do you want project screenshots/headshots auto-converted to 2×3 Teletext block art using a Canvas Ditherer component, or pre-rendered SVG/ASCII assets?
2. **CRT Effects**: Should retro CRT scanlines, screen curvature, and subtle RGB phosphor glow be enabled by default with a quick toggle?
