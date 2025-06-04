import { SELECTORS, EVENTS, DIMENSIONS } from "../constants.js";
import { Calculator } from "../core/Calculator.js";

/**
 * Gère tous les formulaires et leurs interactions
 * Remplace la logique éparpillée dans main.js
 */
export class FormManager {
  constructor(appState) {
    this._appState = appState;
    this._boundHandlers = new Map();
    this._moduleInputs = new Set();
  }

  /**
   * Initialise tous les formulaires
   */
  initialize() {
    this._attachFormListeners();
    this._attachSpecialListeners();

    // S'abonner aux changements d'état
    this._appState.subscribe(EVENTS.CONFIG_CHANGED, (data) => {
      this._updateFormVisibility(data.newState);
      this._updateFormValues(data.newState);
    });

    console.log("✅ FormManager initialisé");
  }

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
      // Avec imposte : masquer dormant
      dormantLabel.classList.add("hidden");
      dormantSelect.classList.add("hidden");
      dormantSelect.value = "false";
    } else {
      // Sans imposte : afficher dormant
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

    // Vider les anciens event listeners
    this._moduleInputs.clear();

    // Calculer les largeurs
    const moduleWidths = Calculator.distributeModuleWidths(config);

    // Générer les inputs
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

    // Attacher les event listeners
    this._attachModuleListeners(config);
  }

  /**
   * Réinitialise tous les modules à une répartition équitable
   */
  resetModules() {
    const config = this._appState.get();
    const moduleWidths = Calculator.distributeModuleWidths(config);

    // Mettre à jour la configuration
    const updates = {};
    moduleWidths.forEach((width, index) => {
      updates[`modules.${index}.width`] = width;
    });

    this._appState.updateMany(updates);
  }

  // ============================================
  // MÉTHODES PRIVÉES
  // ============================================

  /**
   * Attache les listeners sur tous les inputs de configuration
   */
  _attachFormListeners() {
    const inputs = document.querySelectorAll(SELECTORS.CONFIG_INPUTS);

    inputs.forEach((input) => {
      const handler = () => this._appState.syncFromDOM();

      input.addEventListener("change", handler);
      input.addEventListener("input", handler);

      // Stocker pour cleanup éventuel
      this._boundHandlers.set(input, handler);
    });
  }

  /**
   * Attache les listeners spéciaux pour les interactions complexes
   */
  _attachSpecialListeners() {
    // Listener largeur → options modules
    const widthInput = document.getElementById("width");
    if (widthInput) {
      widthInput.addEventListener("change", () => {
        const config = this._appState.get();
        this._updateModulesCountOptions(config);
        this.handleSingleModulePorte(config);
      });
    }

    // Listener nombre modules → index porte
    const modulesCountSelect = document.getElementById("modulesCount");
    if (modulesCountSelect) {
      modulesCountSelect.addEventListener("change", () => {
        const config = this._appState.get();
        this._updatePorteIndexOptions(config);
        this.handleSingleModulePorte(config);
      });
    }

    // Listener tierce → affichage champs
    const tierceSelect = document.getElementById("tierce");
    if (tierceSelect) {
      tierceSelect.addEventListener("change", () => {
        const config = this._appState.get();
        this.handleSingleModulePorte(config);
      });
    }

    // Listener charnière → recalcul porte
    const charniereSelect = document.getElementById("charniere");
    if (charniereSelect) {
      charniereSelect.addEventListener("change", () => {
        const config = this._appState.get();
        this.handleSingleModulePorte(config);
      });
    }

    // Listener imposte → options dormant
    const imposteSelect = document.getElementById("imposte");
    if (imposteSelect) {
      imposteSelect.addEventListener("change", () => {
        const config = this._appState.get();
        this.handleDormantOptions(config);
      });
    }

    // Listener dormant/hauteur → hauteur porte
    ["dormant", "height"].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("change", () => {
          const config = this._appState.get();
          this._updatePorteHeight(config);
        });
      }
    });

    // Listener largeur porte → recalcul tierce
    const porteWidthInput = document.querySelector(
      '[data-config-key="porte.porteWidth"]'
    );
    if (porteWidthInput) {
      porteWidthInput.addEventListener("change", () => {
        const config = this._appState.get();
        if (
          config.modulesCount === 1 &&
          config.type === "porte" &&
          config.porte?.withTierce
        ) {
          this.handleSingleModulePorte(config);
        }
      });
    }

    // Bouton reset modules
    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetModules());
    }
  }

  /**
   * Met à jour la visibilité des sections de formulaire
   */
  _updateFormVisibility(config) {
    const isPorte = config.type === "porte";

    // Sections porte
    this._toggleElement("#configuration-porte", isPorte);
    this._toggleElement("#configuration-options-porte", isPorte);
    this._toggleElement("#configuration-traverses-porte", isPorte);
    this._toggleElement("#label-modulePorte", isPorte);
    this._toggleElement("#modulePorte", isPorte);

    // Champ tierce
    const withTierce = config.porte?.withTierce || false;
    this._toggleElement("#widthTierce", withTierce);

    // Gestion spécifique dormant/imposte
    if (isPorte) {
      this.handleDormantOptions(config);
      this.handleSingleModulePorte(config);
    }
  }

  /**
   * Met à jour les valeurs des formulaires depuis la config
   */
  _updateFormValues(config) {
    const inputs = document.querySelectorAll(SELECTORS.CONFIG_INPUTS);

    inputs.forEach((input) => {
      const path = input.getAttribute("data-config-key");
      const value = this._appState.get(path);

      if (value !== undefined) {
        if (input.type === "radio") {
          input.checked = input.value === String(value);
        } else if (input.type === "checkbox") {
          input.checked = Boolean(value);
        } else {
          input.value = value;
        }
      }
    });

    // Mettre à jour dimensions ouverture
    this._updateDimensionsOuverture(config);
  }

  /**
   * Met à jour les options du nombre de modules
   */
  _updateModulesCountOptions(config) {
    const select = document.getElementById("modulesCount");
    if (!select) return;

    const width = config.width || 4000;
    const maxModules = Math.floor(width / DIMENSIONS.MIN_MODULE_WIDTH);
    const minModules = Math.ceil(width / DIMENSIONS.MAX_MODULE_WIDTH);

    const currentValue = parseInt(select.value) || minModules;

    // Régénérer les options
    select.innerHTML = "";
    for (let i = minModules; i <= maxModules; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      option.selected =
        i === currentValue &&
        currentValue >= minModules &&
        currentValue <= maxModules;
      select.appendChild(option);
    }

    // Ajuster si la valeur actuelle est invalide
    if (currentValue < minModules || currentValue > maxModules) {
      select.value = minModules;
      this._appState.update("modulesCount", minModules);
    }
  }

  /**
   * Met à jour les options de l'index de porte
   */
  _updatePorteIndexOptions(config) {
    const select = document.getElementById("modulePorte");
    if (!select) return;

    const modulesCount = config.modulesCount || 1;
    const currentValue = parseInt(select.value) || 1;

    // Régénérer les options
    select.innerHTML = "";
    for (let i = 1; i <= modulesCount; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      option.selected = i === currentValue && currentValue <= modulesCount;
      select.appendChild(option);
    }

    // Ajuster si nécessaire
    if (currentValue > modulesCount) {
      select.value = 1;
      this._appState.update("porteIndex", 1);
    }
  }

  /**
   * Met à jour les listes de traverses
   */
  _updateTraversesOptions(config) {
    // Traverses principales
    const mainSelect = document.getElementById("list-traverses");
    if (mainSelect) {
      this._populateTraversesSelect(mainSelect, config.traverses, "Traverse");
    }

    // Traverses porte
    const porteSelect = document.getElementById("list-traverses-tierce");
    if (porteSelect) {
      this._populateTraversesSelect(
        porteSelect,
        config.traversesPorte,
        "Traverse porte",
        true
      );
    }
  }

  /**
   * Remplit un select avec les traverses
   */
  _populateTraversesSelect(select, traverses, prefix, showTierce = false) {
    select.innerHTML =
      '<option value="" selected>Sélectionner une traverse</option>';

    if (traverses?.length > 0) {
      traverses.forEach((traverse) => {
        const option = document.createElement("option");
        option.value = traverse.id;

        let text = `${prefix} ${traverse.height}mm`;
        if (showTierce && traverse.type) {
          text += ` (type ${traverse.type})`;
        }
        if (showTierce && traverse.onTierce) {
          text += " + tierce";
        }

        option.textContent = text;
        select.appendChild(option);
      });
    }
  }

  /**
   * Crée un input pour un module
   */
  _createModuleInput(index, width, isPorte) {
    const div = document.createElement("div");
    div.className = "moduleWidth";

    const label = isPorte ? ` (PORTE)` : "";
    const readonly = isPorte ? "readonly" : "";
    const style = isPorte ? 'style="background-color: #f0f0f0;"' : "";

    div.innerHTML = `
      <label>
        Module ${index}${label} : 
        <input 
          id="widthModule${index}" 
          type="number" 
          data-config-key="modules.${index - 1}.width" 
          value="${width}" 
          min="300" 
          max="2000"
          ${readonly}
          ${style}
        />
      </label>
    `;

    return div;
  }

  /**
   * Attache les listeners sur les inputs de modules
   */
  _attachModuleListeners(config) {
    for (let i = 1; i <= config.modulesCount; i++) {
      const input = document.getElementById(`widthModule${i}`);
      if (!input) continue;

      const isPorteModule = config.type === "porte" && config.porteIndex === i;

      if (!isPorteModule) {
        const handler = (event) => {
          const path = `modules.${i - 1}.width`;
          const value = parseInt(event.target.value) || 300;
          this._appState.update(path, value);
        };

        input.addEventListener("change", handler);
        this._moduleInputs.add(input);
      }
    }
  }

  /**
   * Applique les contraintes de porte calculées
   */
  _applyPorteConstraints(constraints) {
    const porteWidthInput = document.querySelector(
      '[data-config-key="porte.porteWidth"]'
    );
    const tierceWidthInput = document.querySelector(
      '[data-config-key="porte.tierceWidth"]'
    );

    if (porteWidthInput) {
      porteWidthInput.value = constraints.porteWidth;
      porteWidthInput.readOnly = constraints.isLocked;
      porteWidthInput.style.backgroundColor = constraints.isLocked
        ? "#f0f0f0"
        : "";

      if (constraints.constraints) {
        porteWidthInput.min = constraints.constraints.min;
        porteWidthInput.max = constraints.constraints.max;
        porteWidthInput.title = `Largeur entre ${constraints.constraints.min}mm et ${constraints.constraints.max}mm`;
      } else {
        porteWidthInput.title = "Calculé automatiquement (module unique)";
      }
    }

    if (tierceWidthInput) {
      tierceWidthInput.value = constraints.tierceWidth;
      tierceWidthInput.readOnly = true;
      tierceWidthInput.style.backgroundColor = "#f0f0f0";
      tierceWidthInput.title =
        constraints.tierceWidth > 0
          ? "Calculé automatiquement (largeur restante)"
          : "";
    }

    // Mettre à jour la configuration
    this._appState.updateMany({
      "porte.porteWidth": constraints.porteWidth,
      "porte.tierceWidth": constraints.tierceWidth,
    });
  }

  /**
   * Déverrouille les inputs de porte
   */
  _unlockPorteInputs() {
    const porteWidthInput = document.querySelector(
      '[data-config-key="porte.porteWidth"]'
    );
    const tierceWidthInput = document.querySelector(
      '[data-config-key="porte.tierceWidth"]'
    );

    if (porteWidthInput) {
      porteWidthInput.readOnly = false;
      porteWidthInput.style.backgroundColor = "";
      porteWidthInput.title = "";
      porteWidthInput.min = "400";
      porteWidthInput.max = "1230";
    }

    if (tierceWidthInput) {
      tierceWidthInput.readOnly = false;
      tierceWidthInput.style.backgroundColor = "";
      tierceWidthInput.title = "";
    }
  }

  /**
   * Met à jour la hauteur de porte selon imposte/dormant
   */
  _updatePorteHeight(config) {
    const porteHeightInput = document.querySelector(
      '[data-config-key="porte.porteHeight"]'
    );
    if (!porteHeightInput) return;

    const withImposte = config.porte?.withImposte || false;
    const withDormant = config.porte?.withDormant || false;
    const totalHeight = config.height || 2500;

    if (!withImposte) {
      // Sans imposte : hauteur calculée automatiquement
      let calculatedHeight = totalHeight - 15; // Jeu de 15mm

      if (withDormant) {
        calculatedHeight -= 51; // Dormant haut
      }

      porteHeightInput.value = calculatedHeight;
      porteHeightInput.readOnly = true;
      porteHeightInput.style.backgroundColor = "#f0f0f0";

      this._appState.update("porte.porteHeight", calculatedHeight);
    } else {
      // Avec imposte : hauteur modifiable
      const maxHeight = totalHeight - 40 - 250 - 51 - 15; // traverse + min imposte + dormant + jeu

      porteHeightInput.readOnly = false;
      porteHeightInput.style.backgroundColor = "";
      porteHeightInput.min = 500;
      porteHeightInput.max = maxHeight;

      // Vérifier la valeur actuelle
      const currentValue = parseInt(porteHeightInput.value) || 2200;
      if (currentValue > maxHeight) {
        porteHeightInput.value = maxHeight;
        this._appState.update("porte.porteHeight", maxHeight);
      } else if (currentValue < 500) {
        porteHeightInput.value = 500;
        this._appState.update("porte.porteHeight", 500);
      }
    }

    this._updateDimensionsOuverture(config);
  }

  /**
   * Met à jour l'affichage des dimensions d'ouverture
   */
  _updateDimensionsOuverture(config) {
    const displayElement = document.getElementById("dimensions-ouverture");
    if (!displayElement) return;

    const dimensions = Calculator.calculateDimensionsOuverture(config);

    if (dimensions.hasOuverture) {
      displayElement.textContent = `Dimensions de l'ouverture : ${dimensions.hauteur}mm x ${dimensions.largeur}mm`;
    } else {
      displayElement.textContent = "Dimensions de l'ouverture :";
    }
  }

  /**
   * Utilitaire pour toggler la visibilité d'un élément
   */
  _toggleElement(selector, show) {
    const element = document.querySelector(selector);
    if (element) {
      element.classList.toggle("hidden", !show);
    }
  }
}
