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
    text: '#17203A',
    tint: '#635BFF',

    // Core surfaces
    background: '#FFF8E8',
    foreground: '#17203A',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#17203A',

    // Primary action color (buttons, links, active states)
    primary: '#635BFF',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#FFE66D',
    secondaryForeground: '#3D3200',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#E8F7FF',
    mutedForeground: '#59627A',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#FF4F9A',
    accentForeground: '#ffffff',

    // Destructive actions (delete, error states)
    destructive: '#FF5C5C',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#D9D5FF',
    input: '#C9C3FF',
  },

  // Dark mode mappings (adjusted for contrast where appropriate)
  dark: {
    text: '#FFFFFF',
    tint: '#8A83FF',
    background: '#15162B',
    foreground: '#FFFFFF',
    card: '#232447',
    cardForeground: '#FFFFFF',
    primary: '#8A83FF',
    primaryForeground: '#ffffff',
    secondary: '#FFE66D',
    secondaryForeground: '#3D3200',
    muted: '#30325F',
    mutedForeground: '#C9CBE6',
    accent: '#FF63A8',
    accentForeground: '#ffffff',
    destructive: '#FF6B6B',
    destructiveForeground: '#ffffff',
    border: '#4A4D82',
    input: '#55598F',
  },

  radius: 22,
};

export default colors;
