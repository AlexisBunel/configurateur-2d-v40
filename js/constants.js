export const DIMENSIONS = Object.freeze({
  MIN_WIDTH: 400,
  MAX_WIDTH: 5000,
  MIN_HEIGHT: 400,
  MAX_HEIGHT: 5000,
  MIN_MODULE_WIDTH: 300,
  MAX_MODULE_WIDTH: 2000,
  MIN_TIERCE_WIDTH: 200,
});

export const PROFILES = Object.freeze({
  CADRE_WIDTH: 51,
  SEPARATOR_WIDTH: 40,
  JEU: 15,
  DORMANT_HEIGHT: 51,
});

export const CHARNIERE = Object.freeze({
  VISIBLE: 10,
  INVISIBLE: 6,
  TIERCE_VISIBLE: 15,
  TIERCE_INVISIBLE: 11,
});

export const PORTE = Object.freeze({
  MIN_WIDTH: 400,
  MAX_WIDTH: 1230,
  MIN_HEIGHT: 500,
  MAX_HEIGHT: 4000,
  MIN_IMPOSTE_HEIGHT: 250,
});

export const COLORS = Object.freeze({
  PROFILES: {
    NOIR: "#2c2c2c",
    GRIS: "#6c757d",
    BLANC: "#f8f9fa",
  },
  LABELS: {
    noir: "Laqué noir RAL 9005 granité",
    gris: "Laqué gris RAL 7016 granité",
    blanc: "Laqué blanc RAL 9003 granité",
  },
});

export const SVG = Object.freeze({
  SCALE: 0.15,
  VIEWPORT: {
    WIDTH: 900,
    HEIGHT: 550,
  },
  MARGINS: 50,
});

export const DEFAULT_CONFIG = Object.freeze({
  width: 4000,
  height: 2500,
  type: "pleine",
  modulesCount: 4,
  porteIndex: 3,
  modules: [],
  traverses: [],
  traversesPorte: [],
  porte: Object.freeze({
    withTierce: false,
    withImposte: false,
    withDormant: false,
    charniereType: "visible",
    porteWidth: 730,
    tierceWidth: 350,
    porteHeight: 2200,
    sensOuverture: "droit",
    serrure: "SERROULM",
    profile: "po66",
    colorBequille: "noir",
    colorPvitrage: "noir",
    traverseType: "28",
  }),
  options: Object.freeze({
    colorProfile: "noir",
    remplissageEp: 6,
    colorJoint: "noir",
  }),
});

// Types d'événements
export const EVENTS = Object.freeze({
  CONFIG_CHANGED: "config:changed",
  CONFIG_LOADED: "config:loaded",
  MODULE_UPDATED: "module:updated",
  TRAVERSE_ADDED: "traverse:added",
  TRAVERSE_REMOVED: "traverse:removed",
});

// Sélecteurs DOM fréquents
export const SELECTORS = Object.freeze({
  CONFIG_INPUTS: "[data-config-key]",
  SVG_PREVIEW: "#svg-preview",
  MODULES_CONTAINER: "#modules-width",
  TABLES: {
    PROFILES: "#profiles",
    ACCESSOIRES: "#accessoires",
    REMPLISSAGE: "#remplissage",
  },
});
