/* ============================================================
   assets/js/lib/gecko-pose.js
   Rôle : pose du margouillat (pattes, corps, queue, tête), calcul pur sans DOM.
   Pages concernées : accueil.
   Accroches : aucune (module de calcul pur ; le DOM est dans margouillat.js).
   ============================================================ */

const TAIL_BONES = 11;
const TAIL_BONE_LENGTH = 6.0;
const TAIL_BASE = { x: 45, y: 83.5 };
const TAIL_TAPER_POWER = 0.72;
const TAIL_OUTER_HALF_WIDTH = 5.9;
const TAIL_INNER_HALF_WIDTH = 4.6;

/**
 * Contour effilé de la queue pour un jeu d'angles donné. `angles[i]` est la
 * flexion (en radians) du bone i : on avance de TAIL_BONE_LENGTH le long du cap
 * courant, puis on épaissit de part et d'autre de la médiane, avec une largeur
 * qui décroît vers la pointe.
 * @param {number[]} angles Flexion de chaque bone, en radians.
 * @param {number} halfWidth Demi-largeur à la base.
 * @param {number} taperPow Exposant de l'effilement (plus grand = pointe plus fine).
 * @returns {string} Attribut `d` d'un chemin SVG fermé.
 */
export function computeTailOutline(angles, halfWidth, taperPow) {
  let x = TAIL_BASE.x;
  let y = TAIL_BASE.y;
  let heading = Math.PI / 2; /* vers le bas = arrière du margouillat */
  const spine = [{ x, y }];
  for (const angle of angles) {
    heading += angle;
    x += Math.cos(heading) * TAIL_BONE_LENGTH;
    y += Math.sin(heading) * TAIL_BONE_LENGTH;
    spine.push({ x, y });
  }

  const n = spine.length;
  const left = [];
  const right = [];
  for (let i = 0; i < n; i++) {
    const a = spine[Math.max(0, i - 1)];
    const b = spine[Math.min(n - 1, i + 1)];
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const w = halfWidth * Math.pow(1 - i / (n - 1), taperPow);
    left.push([spine[i].x - dy * w, spine[i].y + dx * w]);
    right.push([spine[i].x + dy * w, spine[i].y - dx * w]);
  }

  const point = ([px, py]) => `${px.toFixed(2)},${py.toFixed(2)}`;
  const outline = [...left, ...right.reverse()];
  return `M${point(outline[0])}${outline
    .slice(1)
    .map((p) => `L${point(p)}`)
    .join('')}Z`;
}

/**
 * Flexion de chaque bone de la queue : onde qui se propage de la base vers la
 * pointe (coup de fouet à la course, léger balancement au repos).
 * @param {{phase: number, run: number, idleOff: number}} gecko État du margouillat.
 * @param {number} now Horodatage courant, en millisecondes.
 * @returns {number[]} Angles en radians, un par bone.
 */
export function computeTailAngles(gecko, now) {
  const angles = new Array(TAIL_BONES);
  for (let i = 0; i < TAIL_BONES; i++) {
    const towardTip = 0.35 + 0.65 * (i / (TAIL_BONES - 1));
    const runWave = Math.sin(gecko.phase * 0.55 - i * 0.5) * (0.05 + 0.15 * gecko.run) * towardTip;
    const idleWave =
      Math.sin(now * 0.0011 + gecko.idleOff - i * 0.42) * 0.05 * (1 - gecko.run) * towardTip;
    angles[i] = runWave + idleWave;
  }
  return angles;
}

/**
 * Pose complète du margouillat pour une image.
 * @param {{phase: number, run: number, idleOff: number}} gecko État du margouillat.
 * @param {number} now Horodatage courant, en millisecondes.
 * @returns {{legSwing: number, bodySway: number, headIdle: number, tailOuter: string,
 *   tailInner: string}} Balancement des pattes, du corps et de la tête (degrés) et
 *   contours de queue (attributs `d`).
 */
export function computeGeckoPose(gecko, now) {
  const angles = computeTailAngles(gecko, now);
  return {
    legSwing: Math.sin(gecko.phase) * 24 * (0.25 + 0.75 * gecko.run),
    bodySway: Math.sin(gecko.phase) * 3 * gecko.run,
    headIdle: Math.sin(now * 0.0007 + gecko.idleOff * 2) * 9 * (1 - gecko.run),
    tailOuter: computeTailOutline(angles, TAIL_OUTER_HALF_WIDTH, TAIL_TAPER_POWER),
    tailInner: computeTailOutline(angles, TAIL_INNER_HALF_WIDTH, TAIL_TAPER_POWER),
  };
}
