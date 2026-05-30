/**
 * Centralized icon registry for the app.
 * All operator and category icons are 3D-rendered PNGs.
 */

// ─── Operator Icons ───────────────────────────────────────────────────────────
export const OperatorIcons = {
  telkomsel: require('../assets/images/operators/telkomsel.png'),
  xl:        require('../assets/images/operators/xl.png'),
  indosat:   require('../assets/images/operators/indosat.png'),
  axis:      require('../assets/images/operators/axis.png'),
  tri:       require('../assets/images/operators/tri.png'),
  smartfren: require('../assets/images/operators/smartfren.png'),
  byu:       require('../assets/images/operators/byu.png'),
} as const;

// ─── Category Icons ───────────────────────────────────────────────────────────
export const CategoryIcons = {
  pulsa:   require('../assets/images/categories/pulsa.png'),
  data:    require('../assets/images/categories/data.png'),
  pln:     require('../assets/images/categories/pln.png'),
  games:   require('../assets/images/categories/games.png'),
  emoney:  require('../assets/images/categories/emoney.png'),
} as const;

export type OperatorId = keyof typeof OperatorIcons;
export type CategoryIconId = keyof typeof CategoryIcons;
