/* ============================================================
   assets/js/lib/donut-geometry.js
   Rôle : arcs du graphique en anneau calculés à partir des pourcentages de la légende
   (calcul pur, sans DOM).
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur ; le DOM est dans donut-chart.js).
   ============================================================ */

/**
 * Lit un pourcentage dans un texte de légende (« 45 % », « 7,5 % »).
 * @param {string} text Texte de la légende.
 * @returns {number} Pourcentage, ou NaN si le texte n'en contient pas.
 */
export function parseShare(text) {
  const match = String(text).match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(',', '.')) : NaN;
}

/**
 * Longueur et décalage de chaque arc d'un anneau, proportionnels aux parts. Les arcs se
 * suivent sans trou ni chevauchement et referment l'anneau, même si les parts ne
 * totalisent pas 100.
 * @param {number[]} shares Part de chaque arc (même unité, par exemple des pourcentages).
 * @param {number} radius Rayon de l'anneau, dans l'unité du SVG.
 * @returns {{circumference: number, arcs: Array<{length: number, offset: number}>}}
 *   Circonférence et, pour chaque arc, sa longueur et son décalage de départ
 *   (négatif, comme `stroke-dashoffset`).
 */
export function computeDonutArcs(shares, radius) {
  const circumference = 2 * Math.PI * radius;
  const total = shares.reduce((sum, share) => sum + share, 0);
  let start = 0;
  const arcs = shares.map((share) => {
    const length = total > 0 ? (share / total) * circumference : 0;
    const arc = { length, offset: -start };
    start += length;
    return arc;
  });
  return { circumference, arcs };
}
