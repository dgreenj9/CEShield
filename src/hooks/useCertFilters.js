import { useMemo, useReducer, useEffect, useRef } from 'react';
import { certifications as certData } from '../utils/certificationData';
import {
  PATHS,
  PATH_ORDER,
  PATH_DIMENSIONS,
  getPathDefaultWeights,
} from '../utils/careerPaths';
import {
  rankCertifications,
  filterRankedCerts,
  redistributeWeights,
  tierCountsFor,
} from '../utils/certScoring';
import { useSearchParam, setSearchParams } from '../router';

const DEFAULT_PATH = PATH_ORDER[0]; // 'clinical'

// ─── URL <-> state encoding ───────────────────────────────────────────────
//
// Lens + weights live in the URL as `?lens=<path>&w=<key>:<val>,<key>:<val>`.
// This makes the matrix view shareable — a user can DM a colleague a link
// that opens to a specific lens with custom weights pre-applied.

const encodeWeights = (weights) => {
  if (!weights) return '';
  return Object.entries(weights)
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
};

const parseWeights = (raw, pathKey) => {
  if (!raw) return null;
  const defaults = getPathDefaultWeights(pathKey);
  if (!defaults) return null;
  const dimKeys = new Set(Object.keys(PATH_DIMENSIONS[pathKey] || {}));
  const out = { ...defaults };
  let touched = false;
  for (const pair of raw.split(',')) {
    const [k, v] = pair.split(':');
    if (!k || !dimKeys.has(k)) continue;
    const n = parseInt(v, 10);
    if (!Number.isFinite(n) || n < 0 || n > 100) continue;
    out[k] = n;
    touched = true;
  }
  if (!touched) return null;
  // Renormalize to 100 in case the URL was hand-edited or truncated.
  const sum = Object.values(out).reduce((a, b) => a + b, 0);
  if (sum === 0) return null;
  if (sum !== 100) {
    const scale = 100 / sum;
    for (const k of Object.keys(out)) out[k] = Math.round(out[k] * scale);
    // Fix rounding drift on the largest dim
    const drift = 100 - Object.values(out).reduce((a, b) => a + b, 0);
    if (drift !== 0) {
      const largest = Object.entries(out).sort((a, b) => b[1] - a[1])[0][0];
      out[largest] += drift;
    }
  }
  return out;
};

const INITIAL_STATE = {
  path: DEFAULT_PATH,
  weights: getPathDefaultWeights(DEFAULT_PATH),
  tier: 'strong',
  discipline: 'All',
  type: 'All',
  searchTerm: '',
  expanded: {
    citations: {},
    subScores: {},
    roi: {},
    investment: {},
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_FROM_URL': {
      // One-shot URL → state hydration. Applies path + weights atomically
      // without going through SET_PATH (which would clobber the URL weights
      // with the path defaults).
      const nextPath = PATHS[action.path] ? action.path : state.path;
      const nextWeights = action.weights || getPathDefaultWeights(nextPath);
      return { ...state, path: nextPath, weights: nextWeights };
    }
    case 'SET_PATH': {
      // Switching lens swaps both the dimension set and the default weights.
      // User can then tweak weights via SET_WEIGHT.
      if (!PATHS[action.value]) return state;
      return {
        ...state,
        path: action.value,
        weights: getPathDefaultWeights(action.value),
      };
    }
    case 'SET_WEIGHT': {
      // Only allowed for dims of the current path. Other dims left alone.
      const def = getPathDefaultWeights(state.path);
      if (!def || !(action.key in def)) return state;
      return {
        ...state,
        weights: redistributeWeights(state.weights, action.key, action.value),
      };
    }
    case 'RESET_WEIGHTS':
      return { ...state, weights: getPathDefaultWeights(state.path) };
    case 'SET_TIER':       return { ...state, tier: action.value };
    case 'SET_DISCIPLINE': return { ...state, discipline: action.value };
    case 'SET_TYPE':       return { ...state, type: action.value };
    case 'SET_SEARCH':     return { ...state, searchTerm: action.value };
    case 'TOGGLE_DISCLOSURE': {
      const group = state.expanded[action.group] || {};
      return {
        ...state,
        expanded: { ...state.expanded, [action.group]: { ...group, [action.id]: !group[action.id] } },
      };
    }
    case 'CLOSE_DISCLOSURE_GROUP':
      return { ...state, expanded: { ...state.expanded, [action.group]: {} } };
    default:
      return state;
  }
}

export default function useCertFilters() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // URL sync. Reads ?lens= and ?w= on mount (so deep links open to the
  // right view), then writes them back whenever the user changes lens or
  // tweaks weights — making the view shareable. The `hydrated` ref keeps
  // mount-time URL reading from racing with the first SET_PATH effect
  // upstream (the matrix also seeds from a localStorage preference).
  const lensParam = useSearchParam('lens');
  const wParam = useSearchParam('w');
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    if (!lensParam && !wParam) {
      hydratedRef.current = true;
      return;
    }
    const path = PATHS[lensParam] ? lensParam : DEFAULT_PATH;
    const weights = parseWeights(wParam, path);
    dispatch({ type: 'HYDRATE_FROM_URL', path, weights });
    hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state → URL after hydration. Only writes when values differ from
  // what's already there, to avoid an infinite popstate loop and unnecessary
  // history churn.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const isDefaultPath = state.path === DEFAULT_PATH;
    const defaults = getPathDefaultWeights(state.path);
    const weightsAreDefault =
      defaults && Object.keys(defaults).every((k) => defaults[k] === state.weights?.[k]);
    setSearchParams(
      {
        lens: isDefaultPath ? null : state.path,
        w: weightsAreDefault ? null : encodeWeights(state.weights),
      },
      { replace: true },
    );
  }, [state.path, state.weights]);

  // Re-rank whenever path or weights change. The path determines which certs
  // are eligible (those with a pathScores block for this lens).
  const ranked = useMemo(
    () => rankCertifications(certData, state.weights, state.path),
    [state.weights, state.path],
  );

  const filtered = useMemo(
    () => filterRankedCerts(ranked, {
      tier: state.tier,
      discipline: state.discipline,
      type: state.type,
      searchTerm: state.searchTerm,
    }),
    [ranked, state.tier, state.discipline, state.type, state.searchTerm],
  );

  const tierCounts = useMemo(
    () => tierCountsFor(ranked, state.discipline),
    [ranked, state.discipline],
  );

  return { state, dispatch, ranked, filtered, tierCounts };
}
