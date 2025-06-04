import { DEFAULT_CONFIG, EVENTS } from "../constants.js";
import { Validator } from "./Validator.js";

/**
 * Gestionnaire d'état central avec immutabilité et réactivité
 * Remplace ConfigEventManager et ConfigManager
 */
export class AppState {
  constructor() {
    this._state = null;
    this._listeners = new Map();
    this._storageKey = "verriere_config_v2";
    this._state = Object.freeze(this._deepClone(DEFAULT_CONFIG));
  }

  /**
   * Initialise l'état depuis localStorage ou config par défaut
   */
  async initialize() {
    try {
      const saved = this._loadFromStorage();
      if (saved) {
        this._state = Object.freeze(saved);
        console.log("📦 Configuration chargée depuis localStorage");
      } else {
        this._state = Object.freeze(this._generateFromDOM());
        console.log("🆕 Configuration générée depuis le DOM");
      }

      this._validateAndCorrect();
      this._saveToStorage();
      this._emit(EVENTS.CONFIG_LOADED, this._state);

      return this._state;
    } catch (error) {
      console.error("❌ Erreur initialisation:", error);
      this._state = Object.freeze(this._deepClone(DEFAULT_CONFIG));
      return this._state;
    }
  }

  /**
   * Récupère une valeur par chemin (ex: "porte.porteWidth")
   */
  get(path = "") {
    if (!path) return this._state;

    return path.split(".").reduce((obj, key) => {
      return obj?.[key];
    }, this._state);
  }

  /**
   * Met à jour l'état de façon immutable
   */
  update(path, value) {
    try {
      const newState = this._updateNestedValue(this._state, path, value);
      const validated = Validator.validate(newState);

      if (!validated.isValid) {
        console.warn("⚠️ Validation échouée:", validated.errors);
        // Utiliser la version corrigée
        this._state = Object.freeze(validated.corrected);
      } else {
        this._state = Object.freeze(newState);
      }

      this._saveToStorage();
      this._emit(EVENTS.CONFIG_CHANGED, {
        path,
        value,
        newState: this._state,
      });

      return this._state;
    } catch (error) {
      console.error("❌ Erreur update:", error);
      return this._state;
    }
  }

  /**
   * Met à jour plusieurs valeurs en une fois
   */
  updateMany(updates) {
    let newState = this._deepClone(this._state);

    Object.entries(updates).forEach(([path, value]) => {
      newState = this._updateNestedValue(newState, path, value, false);
    });

    const validated = Validator.validate(newState);
    this._state = Object.freeze(
      validated.isValid ? newState : validated.corrected
    );

    this._saveToStorage();
    this._emit(EVENTS.CONFIG_CHANGED, {
      updates,
      newState: this._state,
    });

    return this._state;
  }

  /**
   * Synchronise depuis le DOM (pour les changements de formulaire)
   */
  syncFromDOM() {
    const domConfig = this._generateFromDOM();

    // Comparer avec l'état actuel pour éviter les mises à jour inutiles
    if (!this._deepEqual(domConfig, this._state)) {
      this._state = Object.freeze(domConfig);
      this._validateAndCorrect();
      this._saveToStorage();
      this._emit(EVENTS.CONFIG_CHANGED, {
        source: "dom",
        newState: this._state,
      });
    }

    return this._state;
  }

  /**
   * S'abonne aux changements d'état
   */
  subscribe(eventType, callback) {
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, new Set());
    }

    this._listeners.get(eventType).add(callback);

    // Retourne une fonction de cleanup
    return () => {
      const listeners = this._listeners.get(eventType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this._listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Remet à zéro la configuration
   */
  reset() {
    this._state = Object.freeze(this._deepClone(DEFAULT_CONFIG));
    this._saveToStorage();
    this._emit(EVENTS.CONFIG_CHANGED, {
      reset: true,
      newState: this._state,
    });
    return this._state;
  }

  // ============================================
  // MÉTHODES PRIVÉES
  // ============================================

  /**
   * Génère la config depuis les inputs DOM
   */
  _generateFromDOM() {
    const config = this._deepClone(DEFAULT_CONFIG);
    const inputs = document.querySelectorAll("[data-config-key]");

    inputs.forEach((input) => {
      const path = input.getAttribute("data-config-key");
      const value = this._extractInputValue(input);

      if (value !== undefined) {
        this._setNestedValue(config, path, value);
      }
    });

    return config;
  }

  /**
   * Extrait la valeur d'un input selon son type
   */
  _extractInputValue(input) {
    const { type, value, checked } = input;

    if (type === "radio") {
      return checked ? value : undefined;
    }

    if (type === "checkbox") {
      return checked;
    }

    if (type === "number") {
      return parseInt(value, 10) || 0;
    }

    // Conversion des strings boolean
    if (value === "true") return true;
    if (value === "false") return false;

    return value;
  }

  /**
   * Met à jour une valeur imbriquée de façon immutable
   */
  _updateNestedValue(obj, path, value, freeze = true) {
    const keys = path.split(".");
    const result = this._deepClone(obj);

    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;

    return freeze ? Object.freeze(result) : result;
  }

  /**
   * Définit une valeur imbriquée (mutable, pour construction)
   */
  _setNestedValue(obj, path, value) {
    const keys = path.split(".");
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Clone profond d'un objet
   */
  _deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map((item) => this._deepClone(item));

    const cloned = {};
    Object.keys(obj).forEach((key) => {
      cloned[key] = this._deepClone(obj[key]);
    });

    return cloned;
  }

  /**
   * Comparaison profonde de deux objets
   */
  _deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this._deepEqual(item, b[index]));
    }

    if (typeof a === "object") {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;
      return keysA.every((key) => this._deepEqual(a[key], b[key]));
    }

    return false;
  }

  /**
   * Valide et corrige l'état si nécessaire
   */
  _validateAndCorrect() {
    const validated = Validator.validate(this._state);

    if (!validated.isValid) {
      console.warn("⚠️ Configuration corrigée automatiquement");
      this._state = Object.freeze(validated.corrected);
    }
  }

  /**
   * Sauvegarde dans localStorage
   */
  _saveToStorage() {
    try {
      localStorage.setItem(this._storageKey, JSON.stringify(this._state));
    } catch (error) {
      console.error("❌ Erreur sauvegarde localStorage:", error);
    }
  }

  /**
   * Charge depuis localStorage
   */
  _loadFromStorage() {
    try {
      const saved = localStorage.getItem(this._storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("❌ Erreur chargement localStorage:", error);
      return null;
    }
  }

  /**
   * Émet un événement vers les listeners
   */
  _emit(eventType, data) {
    const listeners = this._listeners.get(eventType);
    if (!listeners) return;

    listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Erreur dans listener ${eventType}:`, error);
      }
    });
  }
}

// Instance globale unique
export const appState = new AppState();
