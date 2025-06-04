import { SELECTORS, EVENTS, DIMENSIONS } from "../constants.js";
import { Calculator } from "../core/Calculator.js";

/**
 * 🔧 FormManager avec listeners individuels (plus de syncFromDOM)
 */
export class FormManager {
  constructor(appState) {
    this._appState = appState;
    this._boundHandlers = new Map();
    this._moduleInputs = new Set();
    this._isUpdatingFromState = false;
    this._debounceTimers = new Map(); // Pour debounce par input
  }

  /**
   * Initialise tous les formulaires
   */
  initialize() {
    this._attachIndividualListeners(); // 🆕 Nouvelle méthode
    this._attachSpecialListeners();

    // S'abonner aux changements d'état
    this._appState.subscribe(EVENTS.CONFIG_CHANGED, (data) => {
      this._updateFormVisibility(data.newState);
      this._updateFormValues(data.newState);
    });

    console.log("✅ FormManager initialisé");
  }

  // ... autres méthodes restent identiques jusqu'à _attachFormListeners ...

  /**
   * 🆕 Attache des listeners individuels à chaque input
   */
  _attachIndividualListeners() {
    const inputs = document.querySelectorAll(SELECTORS.CONFIG_INPUTS);
    console.log(`🔗 Attachement de ${inputs.length} listeners individuels...`);

    inputs.forEach((input) => {
      const configKey = input.getAttribute("data-config-key");

      if (!configKey) {
        console.warn("⚠️ Input sans data-config-key:", input);
        return;
      }

      // Handler individuel pour cet input spécifique
      const handler = (event) => {
        if (this._isUpdatingFromState) {
          console.log(`⏭️ Changement ignoré (update en cours): ${configKey}`);
          return;
        }

        this._handleIndividualInputChange(configKey, input, event);
      };

      // Attacher les événements
      input.addEventListener("change", handler);
      input.addEventListener("input", handler);

      // Stocker pour cleanup
      this._boundHandlers.set(input, handler);
    });
  }

  /**
   * 🆕 Gère le changement d'un input individuel
   */
  _handleIndividualInputChange(configKey, input, event) {
    // Debounce par input
    const existingTimer = this._debounceTimers.get(configKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      const value = this._extractInputValue(input);
      console.log(`📝 Changement: ${configKey} = ${value}`);

      // Mettre à jour directement cette valeur
      this._appState.update(configKey, value);

      // Nettoyer le timer
      this._debounceTimers.delete(configKey);
    }, 150); // 150ms de debounce

    this._debounceTimers.set(configKey, timer);
  }

  /**
   * 🆕 Extrait la valeur d'un input avec conversion de type
   */
  _extractInputValue(input) {
    const { type, value, checked } = input;

    if (type === "radio") {
      return checked
        ? this._convertValue(value, input.getAttribute("data-config-key"))
        : undefined;
    }

    if (type === "checkbox") {
      return checked;
    }

    if (type === "number") {
      return parseInt(value, 10) || 0;
    }

    // Conversions spéciales
    return this._convertValue(value, input.getAttribute("data-config-key"));
  }

  /**
   * 🆕 Convertit une valeur selon le type attendu
   */
  _convertValue(value, configKey) {
    // Champs numériques
    const numberFields = [
      "width",
      "height",
      "modulesCount",
      "porteIndex",
      "porte.porteWidth",
      "porte.tierceWidth",
      "porte.porteHeight",
      "options.remplissageEp",
    ];

    if (numberFields.includes(configKey)) {
      const num = parseInt(value, 10);
      return isNaN(num) ? 0 : num;
    }

    // Champs booléens
    if (value === "true") return true;
    if (value === "false") return false;

    return value;
  }

  /**
   * 🔧 SIMPLIFICATION : Plus besoin de _attachFormListeners
   */
  _attachFormListeners() {
    // Cette méthode est remplacée par _attachIndividualListeners
    console.log(
      "⚠️ _attachFormListeners appelée mais remplacée par _attachIndividualListeners"
    );
  }

  /**
   * 🔧 Protection renforcée pour _updateFormValues
   */
  _updateFormValues(config) {
    if (this._isUpdatingFromState) {
      return; // Protection simple mais efficace
    }

    this._isUpdatingFromState = true;

    try {
      const inputs = document.querySelectorAll(SELECTORS.CONFIG_INPUTS);

      inputs.forEach((input) => {
        const path = input.getAttribute("data-config-key");
        const value = this._appState.get(path);

        if (value !== undefined && this._needsUpdate(input, value)) {
          this._updateInputValue(input, value);
        }
      });

      // Mettre à jour dimensions ouverture
      this._updateDimensionsOuverture(config);
    } finally {
      // Débloquer après un délai
      setTimeout(() => {
        this._isUpdatingFromState = false;
      }, 100);
    }
  }

  /**
   * 🆕 Vérifie si un input a besoin d'être mis à jour
   */
  _needsUpdate(input, newValue) {
    if (input.type === "radio") {
      return input.checked !== (input.value === String(newValue));
    } else if (input.type === "checkbox") {
      return input.checked !== Boolean(newValue);
    } else {
      return input.value !== String(newValue);
    }
  }

  /**
   * 🆕 Met à jour la valeur d'un input sans déclencher d'événements
   */
  _updateInputValue(input, value) {
    // Désactiver temporairement le listener
    const handler = this._boundHandlers.get(input);
    if (handler) {
      input.removeEventListener("change", handler);
      input.removeEventListener("input", handler);
    }

    // Mettre à jour la valeur
    if (input.type === "radio") {
      input.checked = input.value === String(value);
    } else if (input.type === "checkbox") {
      input.checked = Boolean(value);
    } else {
      input.value = value;
    }

    // Réactiver le listener après un micro-délai
    if (handler) {
      setTimeout(() => {
        input.addEventListener("change", handler);
        input.addEventListener("input", handler);
      }, 10);
    }
  }

  // ... toutes les autres méthodes restent exactement identiques ...

  /**
   * Met à jour la visibilité des formulaires selon le type
   */
  updateVisibility(config) {
    this._updateFormVisibility(config);
  }

  /**
   * Met à jour les options des selects dynamiques
   */
  updateDynamicOptions(config) {
    this._updateModulesCountOptions(config);
    this._updatePorteIndexOptions(config);
    this._updateTraversesOptions(config);
  }

  /**
   * Gère la logique spéciale du module unique avec porte
   */
  handleSingleModulePorte(config) {
    if (config.modulesCount !== 1 || config.type !== "porte") {
      this._unlockPorteInputs();
      return;
    }

    const constraints =
      Calculator.calculateSingleModulePorteConstraints(config);
    if (!constraints) return;

    this._applyPorteConstraints(constraints);
  }

  /**
   * Gère les options dormant/imposte
   */
  handleDormantOptions(config) {
    const withImposte = config.porte?.withImposte || false;
    const dormantSelect = document.getElementById("dormant");
    const dormantLabel = document.getElementById("label-dormant");

    if (!dormantLabel || !dormantSelect) return;

    if (withImposte) {
      dormantLabel.classList.add("hidden");
      dormantSelect.classList.add("hidden");
      dormantSelect.value = "false";
    } else {
      dormantLabel.classList.remove("hidden");
      dormantSelect.classList.remove("hidden");
    }

    this._updatePorteHeight(config);
  }

  /**
   * Met à jour les inputs des modules
   */
  updateModuleInputs(config) {
    const container = document.getElementById("modules-width");
    if (!container) return;

    this._moduleInputs.clear();

    const moduleWidths = Calculator.distributeModuleWidths(config);

    container.innerHTML = "";

    for (let i = 1; i <= config.modulesCount; i++) {
      const isPorteModule = config.type === "porte" && config.porteIndex === i;
      const moduleDiv = this._createModuleInput(
        i,
        moduleWidths[i - 1],
        isPorteModule
      );
      container.appendChild(moduleDiv);
    }

    this._attachModuleListeners(config);
  }

  /**
   * Réinitialise tous les modules à une répartition équitable
   */
  resetModules() {
    const config = this._appState.get();
    const moduleWidths = Calculator.distributeModuleWidths(config);

    const updates = {};
    moduleWidths.forEach((width, index) => {
      updates[`modules.${index}.width`] = width;
    });

    this._appState.updateMany(updates);
  }

  // ============================================
  // MÉTHODES PRIVÉES (restent identiques)
  // ============================================

  // ... toutes les autres méthodes privées restent exactement comme avant ...
}
