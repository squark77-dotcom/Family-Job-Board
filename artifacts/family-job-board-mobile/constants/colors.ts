/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#17171a', // foreground
    tint: '#3d4dfa', // primary

    // Core surfaces
    background: '#f9f9fa',
    foreground: '#17171a',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#17171a',

    // Primary action color (buttons, links, active states)
    primary: '#3d4dfa',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#eeeff2',
    secondaryForeground: '#17171a',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#eeeff2',
    mutedForeground: '#5c5c66',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#f21d96',
    accentForeground: '#ffffff',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#e6e6e8',
    input: '#e6e6e8',
  },

  // Dark mode mappings (adjusted for contrast where appropriate)
  dark: {
    text: '#ffffff',
    tint: '#5b6cfb',
    background: '#121214',
    foreground: '#ffffff',
    card: '#1c1c1f',
    cardForeground: '#ffffff',
    primary: '#5b6cfb',
    primaryForeground: '#ffffff',
    secondary: '#27272a',
    secondaryForeground: '#ffffff',
    muted: '#27272a',
    mutedForeground: '#a1a1aa',
    accent: '#f21d96',
    accentForeground: '#ffffff',
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',
    border: '#27272a',
    input: '#27272a',
  },

  radius: 16,
};

export default colors;
