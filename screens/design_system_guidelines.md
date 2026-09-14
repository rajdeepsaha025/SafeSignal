# SafeSignal Intelligence System Style Guidelines

The design system is engineered for high-stakes financial surveillance and cybersecurity intelligence. The brand personality is **authoritative, vigilant, and ultra-reliable**, designed to instill confidence in enterprise security analysts and fraud investigators.

The visual style is a refined implementation of **Corporate Modernism**, blending the structural rigor of Material Design 3 with the polished, high-fidelity execution of modern SaaS leaders. The aesthetic prioritizes clarity and rapid information processing over decorative flair. It avoids dark "cyber" clichés in favor of a clean, clinical light-mode environment that reduces cognitive load during long investigative sessions. 

Key attributes include:
- **Precision:** Perfect alignment and consistent spacing.
- **Translucency-Free:** Solid surfaces to ensure maximum legibility and focus.
- **Enterprise-Grade:** Professional density that balances data richness with breathable white space.

---

## Brand & Style

The design system is engineered for high-stakes financial surveillance and cybersecurity intelligence. The brand personality is **authoritative, vigilant, and ultra-reliable**, designed to instill confidence in enterprise security analysts and fraud investigators.

The visual style is a refined implementation of **Corporate Modernism**, blending the structural rigor of Material Design 3 with the polished, high-fidelity execution of modern SaaS leaders. The aesthetic prioritizes clarity and rapid information processing over decorative flair. It avoids dark "cyber" clichés in favor of a clean, clinical light-mode environment that reduces cognitive load during long investigative sessions. 

Key attributes include:
- **Precision:** Perfect alignment and consistent spacing.
- **Translucency-Free:** Solid surfaces to ensure maximum legibility and focus.
- **Enterprise-Grade:** Professional density that balances data richness with breathable white space.

## Colors

The color palette is rooted in functional utility, following a strict semantic logic to indicate system status and fraud risk levels.

- **Primary (Security Blue):** Used for primary actions, navigation states, and brand presence. It signals stability and professional trust.
- **Secondary (Safe Green):** Represents "Low Risk" and successful validation states.
- **Warning (Alert Amber):** Reserved for "Medium Risk" and non-critical system notifications.
- **Danger (Critical Red):** Used for "High Risk" fraud detection, critical errors, and destructive actions.
- **Neutral/Surface:** A sophisticated scale of grays starting from a soft off-white background (`#F8FAFC`) to a deep charcoal text (`#111827`), ensuring high contrast and WCAG AA compliance.

**Risk Scoring Application:**
Color must never be the sole indicator of risk. Always accompany color-coded scores with iconography or text labels to maintain accessibility standards.

## Typography

This design system utilizes a dual-font strategy to balance character with utility. 

- **Plus Jakarta Sans** is used for headlines and display styles. Its modern, slightly rounded geometric forms provide a contemporary feel that feels welcoming yet precise.
- **Inter** is the workhorse for all body text, labels, and data visualizations. It is chosen for its exceptional legibility in data-dense environments and its neutral, systematic tone.

**Usage Rules:**
- Use **Bold** or **Semi-Bold** for headings to establish a strong visual hierarchy.
- The base body size is set at **16px** to ensure readability for long-form report analysis.
- Use `label-md` for tabular data headers and metadata.

## Layout & Spacing

The layout is built on a **12-column fluid grid** for desktop and a **4-column grid** for mobile. It follows a strict 8px spatial rhythm.

- **Grid Logic:** A 1440px max-width container is centered on the screen. Content should be organized into modular cards that span defined column counts (e.g., 4 columns for a metric, 8 columns for a transaction list).
- **White Space:** Generous margins and gutters are used to separate distinct data clusters, preventing the "wall of data" effect common in legacy security tools.
- **Density:** While the base spacing is generous, data tables may utilize a "compact" mode (4px vertical padding) to maximize information density when required by the analyst.

## Elevation & Depth

Hierarchy is established through a combination of **Tonal Layering** and **Ambient Shadows**.

- **Level 0 (Background):** `#F8FAFC`. The lowest plane.
- **Level 1 (Cards/Surface):** `#FFFFFF`. Used for the primary content containers. These features a soft, diffused shadow (`0px 4px 20px rgba(0, 0, 0, 0.05)`) to create a subtle lift from the background.
- **Level 2 (Hover/Active):** When an element is interacted with, the shadow deepens and the elevation increases slightly to provide tactile feedback.
- **Outlines:** A thin, 1px border using the Divider color (`#E5E7EB`) is applied to all Level 1 containers to maintain structural definition even in low-contrast environments.

## Shapes

The system uses a highly approachable and modern shape language. 

- **Primary Radius:** Large containers, dashboard cards, and main surfaces use a **20px corner radius**. This softness counteracts the clinical nature of security data, making the platform feel like a modern consumer-grade tool.
- **Small Component Radius:** Buttons, input fields, and chips use a smaller **8px radius** to maintain a sense of precision and fit within the larger containers.
- **Iconography:** Use rounded icons (Material Symbols Rounded) to harmonize with the container shapes.

## Components

### Buttons
- **Primary:** Solid `#1565C0` with white text. 8px border radius.
- **Secondary:** Outlined with `#E5E7EB` border and Primary color text.
- **Interaction:** Implement a subtle "ripple" effect on click and a slight elevation increase on hover.

### Cards
- Standard containers for all dashboard modules. 
- **Style:** White background, 20px border radius, 1px `#E5E7EB` stroke, and Level 1 shadow.
- **Header:** Cards should include a 16px bottom-bordered header section for titles and actions.

### Input Fields
- **Style:** Outlined style with 8px radius. 
- **States:** Default border is `#E5E7EB`. Focus border is `#1565C0` with a 2px width. Error state uses Danger color.
- **Labels:** Always visible above the field using `label-lg`.

### Chips / Badges
- Used for status and risk levels.
- **High Risk:** Light Red background with Dark Red text.
- **Low Risk:** Light Green background with Dark Green text.
- **Shape:** Fully pill-shaped (100px radius).

### Tables (Transaction Lists)
- Clean, unbordered rows with a 1px bottom divider.
- **Row Hover:** Use a very subtle `#F1F5F9` background tint on hover to assist eye-tracking across data points.
- **Typography:** Use `body-md` for row content and `label-md` (uppercase) for headers.

### Navigation
- **Side Rail:** A persistent left-hand navigation bar using a slight off-white or the background color to differentiate from the primary content area. Active states should use a vertical "pill" indicator in the Primary color.
