// Configuration Stylelint recommandée pour les règles CSS du skill.
// À étendre ou à copier dans le projet. Dépendances :
//   npm i -D stylelint stylelint-config-standard stylelint-order stylelint-declaration-strict-value
// Les paires `*.avant.css` du skill sont des contre-exemples : les ignorer.

export default {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-order', 'stylelint-declaration-strict-value'],
  ignoreFiles: ['**/*.avant.css'],
  reportDescriptionlessDisables: true, // CSS-25 et CSS-40 : dérogation = raison obligatoire
  rules: {
    // CSS-10, 11, 12 : valeurs de conception uniquement via var(--…)
    'scale-unlimited/declaration-strict-value': [
      [
        '/color$/',
        'fill',
        'stroke',
        'margin',
        'padding',
        'gap',
        'font-size',
        'border-radius',
        'box-shadow',
      ],
      {
        ignoreValues: ['inherit', 'initial', 'unset', 'transparent', 'currentColor', 'none', 'auto', '0'],
        ignoreFunctions: false,
        disableFix: true,
      },
    ],

    // CSS-20, 22 : kebab-case, jamais de classe js-, pas de BEM strict
    'selector-class-pattern': [
      '^(?!js-)[a-z][a-z0-9]*(-[a-z0-9]+)*$',
      { message: 'Classe en kebab-case, sans BEM et sans préfixe js- (CSS-20, CSS-22)' },
    ],
    // CSS-23, 24 : pas d'identifiant, deux niveaux au plus
    'selector-max-id': 0,
    'selector-max-compound-selectors': 2,
    // Préfixe Safari conservé : -webkit-backdrop-filter doit rester à côté de backdrop-filter
    'property-no-vendor-prefix': [true, { ignoreProperties: ['-webkit-backdrop-filter'] }],
    // CSS-15 : jetons nommés par rang ou par rôle, jamais par valeur (--space-24, --text-85…)
    'custom-property-pattern': [
      '^(?!(?:space|text|radius|shadow)-(?:neg-)?\\d{2,}(?:px|rem|em)?$)[a-z][a-z0-9]*(-[a-z0-9]+)*$',
      { message: 'CSS-15 : nommer le jeton par rang ou rôle (--space-3, --text-lg), pas par valeur (--space-24)' },
    ],
    // CSS-24 : pas de classe qualifiée par un élément (ul.menu)
    'selector-no-qualifying-type': [true, { ignore: ['attribute'] }],
    // CSS-25 : !important interdit sauf dérogation décrite
    'declaration-no-important': true,

    // CSS-30 : aucune ligne vide dans une règle
    'declaration-empty-line-before': 'never',
    // CSS-31 : ordre des propriétés
    'order/properties-order': [
      [
        // positionnement
        'position', 'inset', 'top', 'right', 'bottom', 'left', 'z-index',
        // boîte
        'display', 'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
        'grid', 'grid-template-columns', 'grid-template-rows', 'grid-area',
        'align-items', 'align-content', 'align-self', 'justify-content', 'justify-items', 'justify-self',
        'gap', 'order', 'float', 'clear',
        'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height', 'aspect-ratio',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'overflow', 'box-sizing',
        // typographie
        'font', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
        'letter-spacing', 'text-align', 'text-transform', 'text-decoration', 'white-space', 'color',
        // apparence
        'background', 'background-color', 'background-image', 'border', 'border-width', 'border-style',
        'border-color', 'border-radius', 'outline', 'box-shadow', 'opacity', 'cursor', 'visibility',
        // animation
        'transform', 'transition', 'animation',
      ],
      { unspecified: 'bottom' },
    ],

    // CSS-32 : rem pour le texte, px pour les bordures
    'declaration-property-unit-disallowed-list': {
      'font-size': ['px'],
      '/^border(-.+)?-width$/': ['rem', 'em'],
      border: ['rem', 'em'],
    },

    // CSS-40 : pas de outline: none sans dérogation décrite
    'declaration-property-value-disallowed-list': {
      '/^outline(-style)?$/': ['none', '0'],
      // CSS-10 : aucune couleur en dur dans les raccourcis (border, background, outline…)
      '/.*/': [
        '/#[0-9a-fA-F]{3,8}\\b/',
        '/\\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\\(/',
      ],
    },

    // CSS-05 : un seul sens de media query (max-width par défaut).
    // Projet « mobile d'abord » : remplacer par ['max-width'].
    'media-feature-name-disallowed-list': ['min-width'],
    // La notation « context » (width <= 900px) de la config standard est écartée au profit de max-width.
    'media-feature-range-notation': 'prefix',
  },
  overrides: [
    {
      // Le fichier de tokens est le seul endroit où les valeurs brutes sont permises (nom à adapter au projet).
      files: ['**/tokens*.css'],
      rules: {
        'scale-unlimited/declaration-strict-value': null,
        'declaration-property-value-disallowed-list': null,
      },
    },
  ],
};
