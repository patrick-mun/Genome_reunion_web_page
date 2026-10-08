// Configuration ESLint recommandée pour les règles JS du skill.
// À copier dans le projet. Dépendances :
//   npm i -D eslint @eslint/js globals
// Les paires `*.avant.js` du skill sont des contre-exemples : les ignorer.
// Les dérogations (// eslint-disable-next-line règle -- raison) doivent porter
// une raison ; ESLint ne l'impose pas, c'est une règle de relecture (JS-13).

import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['**/*.avant.js'] },
  js.configs.recommended,
  {
    languageOptions: { sourceType: 'module', globals: globals.browser },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      // JS-01 : pas de variable globale
      'no-implicit-globals': 'error',

      // JS-10, 13 : accroche par classe js- ou data-*, pas d'innerHTML
      'no-restricted-properties': [
        'error',
        { object: 'document', property: 'getElementById', message: 'JS-10 : accrocher par une classe js- ou un attribut data-*' },
        { property: 'innerHTML', message: 'JS-13 : textContent ou createElement (balisage constant : dérogation décrite)' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name=/^querySelector(All)?$/] > Literal.arguments:first-child:not([value=/^\\.js-|^\\[data-/])",
          message: 'JS-10 : sélecteur par classe js- ou attribut data-*',
        },
        {
          // JS-01 : exports nommés uniquement
          selector: "ExportDefaultDeclaration, ExportSpecifier[exported.name='default']",
          message: 'JS-01 : export nommé, pas d\'export par défaut',
        },
        {
          // JS-01 : extension .js obligatoire dans les chemins relatifs
          selector: 'ImportDeclaration[source.value=/^\\.{1,2}\\//]:not([source.value=/\\.js$/])',
          message: 'JS-01 : ajouter l\'extension .js au chemin d\'import',
        },
        {
          // JS-11 : pas de style direct (classList ou style.setProperty('--variable', …))
          selector: "AssignmentExpression[left.object.property.name='style']",
          message: 'JS-11 : classList ou style.setProperty(--variable)',
        },
        {
          // JS-12 : pas de gestionnaire par propriété (onclick = …)
          selector: 'AssignmentExpression[left.property.name=/^on[a-z]+$/]',
          message: 'JS-12 : addEventListener',
        },
        {
          // JS-12 : écouteurs de défilement et de toucher passifs
          selector: "CallExpression[callee.property.name='addEventListener'][arguments.0.value=/^(scroll|touchstart|touchmove|wheel)$/][arguments.length<3]",
          message: 'JS-12 : ajouter { passive: true }',
        },
      ],

      // JS-30 : une variable par déclaration
      'one-var': ['error', 'never'],

      // JS-20 : camelCase (les constantes en MAJUSCULES sont admises par la règle)
      camelcase: 'error',
      'new-cap': 'error',

      // JS-30 : syntaxe moderne
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: 'error',
      curly: ['error', 'multi-line'],

      // JS-32 : taille et complexité, en avertissement
      'max-lines-per-function': ['warn', { max: 60, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', 10],
      'max-depth': ['warn', 3],

      // JS-34 : fichier de 300 lignes au plus (hors blancs et commentaires), en avertissement
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],

      // JS-33 : pas de console laissé (no-empty, dans recommended, interdit le catch vide)
      'no-console': 'error',
    },
  },
];
