// ===== js/ui/UIManager.js =====
import { ModulesCalculator } from "../calculations/ModulesCalculator.js";
import { PorteCalculator } from "../calculations/PorteCalculator.js";
import { TraversesCalculator } from "../calculations/TraversesCalculator.js";
import { ValidationRules } from "../core/ValidationRules.js";

export class UIManager {
  constructor(configModel, eventBus) {
    this.configModel = configModel;
    this.eventBus = eventBus;
    this.fieldValidators = new Map();
    this.lockedFields = new Set();
    this.isUpdatingUI = false; // CORRECTION: Protection contre les boucles

    this.init();
  }

  init() {
    this.attachFormListeners();
    this.attachButtonListeners();
    this.setupValidation();
    this.updateFromConfig(this.configModel.state);

    // Écoute les changements de configuration
    this.eventBus.on("configChanged", (config) => {
      this.updateFromConfig(config);
    });
  }

  /**
   * Attache les listeners sur tous les formulaires
   */
  attachFormListeners() {
    // Listeners pour tous les champs avec data-config-key
    document.querySelectorAll("[data-config-key]").forEach((input) => {
      const key = input.getAttribute("data-config-key");

      // CORRECTION: Validation seulement à la perte de focus pour les inputs numériques
      if (input.type === "number") {
        input.addEventListener("blur", () => {
          this.handleFieldChange(input, key);
          this.validateField(input, key);
        });

        // Validation visuelle en temps réel sans changement du modèle
        input.addEventListener(
          "input",
          this.debounce(() => {
            this.validateField(input, key, this.extractFieldValue(input), true); // visualOnly = true
          }, 200)
        );
      } else {
        // Pour les selects, radios, checkboxes : changement immédiat
        input.addEventListener("change", () => {
          this.handleFieldChange(input, key);
        });
      }
    });
  }

  /**
   * Attache les listeners sur les boutons d'action
   */
  attachButtonListeners() {
    // Reset modules
    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.configModel.resetModulesWidths();
        this.eventBus.emit("configChanged", this.configModel.getConfig());
      });
    }

    // Traverses
    this.setupTraversesListeners();
  }

  /**
   * Configure la validation en temps réel
   */
  setupValidation() {
    // Règles de validation pour chaque champ
    this.fieldValidators.set("width", (value) =>
      ValidationRules.validateValue(value, ValidationRules.dimensions.width)
    );

    this.fieldValidators.set("height", (value) =>
      ValidationRules.validateValue(value, ValidationRules.dimensions.height)
    );

    this.fieldValidators.set("porte.porteWidth", (value) =>
      ValidationRules.validateValue(value, ValidationRules.porte.porteWidth)
    );

    this.fieldValidators.set("porte.tierceWidth", (value) =>
      ValidationRules.validateValue(value, ValidationRules.porte.tierceWidth)
    );

    this.fieldValidators.set("porte.porteHeight", (value) =>
      ValidationRules.validateValue(value, ValidationRules.porte.porteHeight)
    );

    // CORRECTION: Validation souple pour modulesCount (avertissement seulement)
    this.fieldValidators.set("modulesCount", (value, config) => {
      if (value < 1 || value > 20) {
        return {
          valid: false,
          corrected: Math.max(1, Math.min(20, value)),
          message: `Entre 1 et 20 modules`,
        };
      }

      // Avertissement si hors bornes optimales mais on laisse passer
      const bounds = ModulesCalculator.calculateModulesBounds(config.width);
      if (value < bounds.min || value > bounds.max) {
        return {
          valid: true, // On laisse passer
          corrected: value,
          message: `Optimal: ${bounds.min}-${bounds.max} modules pour cette largeur`,
        };
      }

      return { valid: true, corrected: value };
    });
  }

  /**
   * Gère le changement d'un champ
   */
  handleFieldChange(input, key) {
    // CORRECTION: Protection contre les changements en cascade
    if (this.isUpdatingUI) return;

    let value = this.extractFieldValue(input);

    // Validation en temps réel
    const validation = this.validateField(input, key, value);
    if (!validation.valid && validation.corrected !== undefined) {
      value = validation.corrected;
      this.setFieldValue(input, value);
    }

    // CORRECTION: Vérifier si la valeur a vraiment changé
    const currentValue = this.getConfigValueByKey(this.configModel.state, key);
    if (currentValue === value) {
      return; // Pas de changement, pas de mise à jour
    }

    // Mise à jour du modèle
    this.setConfigValueByKey(key, value);
  }

  /**
   * Valide un champ spécifique
   * @param {HTMLElement} input - Élément input
   * @param {string} key - Clé de configuration
   * @param {*} value - Valeur à valider (optionnel)
   * @param {boolean} visualOnly - Si true, ne fait que l'affichage sans correction
   */
  validateField(input, key, value = null, visualOnly = false) {
    if (value === null) {
      value = this.extractFieldValue(input);
    }

    const validator = this.fieldValidators.get(key);
    let validation = { valid: true, corrected: value };

    if (validator) {
      validation = validator(value, this.configModel.state);
    }

    // Affichage du message d'erreur (toujours)
    this.displayFieldValidation(input, validation);

    // Correction de la valeur seulement si pas en mode visualOnly
    if (
      !visualOnly &&
      !validation.valid &&
      validation.corrected !== undefined
    ) {
      this.setFieldValue(input, validation.corrected);
    }

    return validation;
  }

  /**
   * Affiche la validation d'un champ
   */
  displayFieldValidation(input, validation) {
    // Supprime ancien message
    const existingError = input.parentNode.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }

    // Style du champ
    if (validation.valid) {
      input.classList.remove("error");
      input.classList.add("valid");
    } else {
      input.classList.remove("valid");
      input.classList.add("error");

      // Ajoute message d'erreur
      if (validation.message) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.textContent = validation.message;
        input.parentNode.appendChild(errorDiv);
      }
    }
  }

  /**
   * Extrait la valeur d'un champ selon son type
   */
  extractFieldValue(input) {
    if (input.type === "checkbox") {
      return input.checked;
    } else if (input.type === "number") {
      return input.value === "" ? null : Number(input.value);
    } else if (input.type === "radio") {
      if (!input.checked) return null;
      let value = input.value;
      if (value === "true") return true;
      if (value === "false") return false;
      return value;
    } else {
      // CORRECTION: Pour les selects, vérifier si la valeur doit être un nombre
      let value = input.value;
      if (value === "true") return true;
      if (value === "false") return false;

      // CORRECTION: Pour modulesCount et porteIndex, convertir en nombre
      if (
        input.getAttribute("data-config-key") === "modulesCount" ||
        input.getAttribute("data-config-key") === "porteIndex"
      ) {
        return Number(value);
      }

      return value;
    }
  }

  /**
   * Définit la valeur d'un champ selon son type
   */
  setFieldValue(input, value) {
    if (input.type === "checkbox") {
      input.checked = Boolean(value);
    } else if (input.type === "radio") {
      input.checked = input.value == value;
    } else {
      input.value = value ?? "";
    }
  }

  /**
   * Met à jour la configuration par clé imbriquée
   */
  setConfigValueByKey(key, value) {
    const keys = key.split(".");

    // CORRECTION: Pour les clés simples, utiliser updateState directement
    if (keys.length === 1) {
      const updateObj = {};
      updateObj[key] = value;
      this.configModel.updateState(updateObj);
      return;
    }

    // Pour les clés imbriquées, naviguer dans l'objet
    let target = this.configModel.state;

    // Navigation dans l'objet
    for (let i = 0; i < keys.length - 1; i++) {
      const currentKey = keys[i];

      if (!target[currentKey]) {
        target[currentKey] = {};
      }
      target = target[currentKey];
    }

    // Application de la valeur
    const finalKey = keys[keys.length - 1];
    target[finalKey] = value;

    // CORRECTION: Appeler performAutomaticCalculations pour tous les changements imbriqués
    this.configModel.performAutomaticCalculations();

    // Validation et notification
    this.configModel.validate();
    this.eventBus.emit("configChanged", this.configModel.getConfig());
  }

  /**
   * Met à jour l'interface depuis la configuration
   */
  updateFromConfig(config) {
    // CORRECTION: Protection contre les boucles infinies
    if (this.isUpdatingUI) return;

    this.isUpdatingUI = true;

    try {
      this.updateFormFields(config);
      this.updateModulesCountOptions(config);
      this.updateModulesInputs(config);
      this.updatePorteUIVisibility(config);
      this.updateFieldStates(config);
      this.updateCalculatedFields(config);
      this.updateTraversesLists(config);
    } finally {
      this.isUpdatingUI = false;
    }
  }

  /**
   * Met à jour tous les champs de formulaire
   */
  updateFormFields(config) {
    document.querySelectorAll("[data-config-key]").forEach((input) => {
      if (this.lockedFields.has(input)) return;

      const key = input.getAttribute("data-config-key");
      const value = this.getConfigValueByKey(config, key);
      this.setFieldValue(input, value);
    });
  }

  /**
   * Met à jour les options du select nombre de modules
   */
  updateModulesCountOptions(config) {
    const select = document.getElementById("modulesCount");
    if (!select) return;

    const bounds = ModulesCalculator.calculateModulesBounds(config.width);
    const currentValue = config.modulesCount;

    // Vide et reconstruit les options
    select.innerHTML = "";
    for (let i = bounds.min; i <= bounds.max; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      if (i === currentValue) option.selected = true;
      select.appendChild(option);
    }

    // Correction automatique si hors bornes
    if (currentValue < bounds.min || currentValue > bounds.max) {
      select.value = bounds.min;
      select.dispatchEvent(new Event("change"));
    }
  }

  /**
   * CORRECTION 3: Met à jour les inputs des modules de manière optimisée avec gestion du module imposé
   */
  updateModulesInputs(config) {
    const container = document.getElementById("modules-width");
    if (!container) return;

    const existingInputs = container.querySelectorAll(
      'input[data-config-key^="modules."]'
    );

    // CORRECTION : Toujours reconstruire si le nombre de modules change OU si l'imposition change
    const currentImposedModule = this.calculateImposedModuleIndex(config);
    const previousImposedModule = this.lastImposedModule || -1;

    if (
      existingInputs.length !== config.modulesCount ||
      currentImposedModule !== previousImposedModule
    ) {
      this.lastImposedModule = currentImposedModule;
      this.rebuildModulesInputs(config, container);
      return;
    }

    // Mise à jour des valeurs seulement
    existingInputs.forEach((input, index) => {
      const module = config.modules[index];
      if (module && input.value != module.width) {
        input.value = module.width || "";
      }
    });
  }

  /**
   * Reconstruit complètement les inputs des modules
   */
  rebuildModulesInputs(config, container) {
    container.innerHTML = "";

    const imposedModuleIndex = this.calculateImposedModuleIndex(config);

    for (let i = 0; i < config.modulesCount; i++) {
      const module = config.modules[i] || {};
      const isPorteModule =
        config.type === "porte" && i + 1 === config.porteIndex;
      const isImposedModule = i === imposedModuleIndex;
      const isModifiedByUser =
        config.moduleModifiedByUser && config.moduleModifiedByUser[i];

      const label = document.createElement("label");
      label.textContent = `Module ${i + 1} : `;

      const input = document.createElement("input");
      input.type = "number";
      input.min = 200;
      input.max = 2000;
      input.value = module.width || "";
      input.setAttribute("data-config-key", `modules.${i}.width`);
      input.style.width = "100px";

      // CORRECTION : Listeners différents selon le type de module
      if (isPorteModule) {
        // Module porte : aucun listener
        this.lockField(input, "Module porte, largeur imposée");
      } else if (isImposedModule) {
        // Module imposé : listener spécial pour déverrouillage
        this.lockField(
          input,
          `Module imposé (${module.width}mm). Cliquer pour déverrouiller.`
        );

        // CORRECTION : Click pour déverrouiller le module imposé
        input.addEventListener("focus", () => {
          if (
            confirm(
              `Déverrouiller ce module imposé ?\nIl deviendra modifiable et un autre module sera automatiquement imposé.`
            )
          ) {
            this.configModel.unlockImposedModule(i);
          } else {
            input.blur(); // Enlever le focus si annulé
          }
        });
      } else {
        // Module libre : listeners normaux
        this.unlockField(input);

        // CORRECTION : Blur au lieu de focus pour éviter déverrouillage accidentel
        input.addEventListener("blur", () => {
          const newValue = parseInt(input.value);
          if (!isNaN(newValue) && newValue !== module.width) {
            this.handleModuleWidthChange(i, newValue);
            this.validateModuleWidth(input, i);
          }
        });

        // Validation visuelle en temps réel
        input.addEventListener(
          "input",
          this.debounce(() => {
            this.validateModuleWidth(input, i, true);
          }, 200)
        );

        // Indication visuelle pour modules modifiés
        if (isModifiedByUser) {
          input.style.borderLeft = "3px solid #28a745";
          input.title = "Module modifié manuellement";
        }
      }

      label.appendChild(input);
      container.appendChild(label);
    }
  }

  /**
   * Gère le changement de largeur d'un module
   */
  handleModuleWidthChange(index, value) {
    const numValue = Number(value);
    if (isNaN(numValue)) return;

    const validation = ModulesCalculator.validateModuleWidth(numValue);
    const finalValue = validation.corrected;

    // CORRECTION : Utiliser setModuleWidth qui gère automatiquement le tracking
    this.configModel.setModuleWidth(index, finalValue);

    // Pas besoin d'émettre l'événement, setModuleWidth le fait déjà
  }

  /**
   * Valide la largeur d'un module
   * @param {HTMLElement} input - Input du module
   * @param {number} index - Index du module
   * @param {boolean} visualOnly - Si true, validation visuelle uniquement
   */
  validateModuleWidth(input, index, visualOnly = false) {
    const value = Number(input.value);
    const validation = ModulesCalculator.validateModuleWidth(value);

    this.displayFieldValidation(input, validation);

    if (!visualOnly && !validation.valid) {
      input.value = validation.corrected;
      this.handleModuleWidthChange(index, validation.corrected);
    }
  }

  /**
   * Met à jour la visibilité des sections selon le type
   */
  updatePorteUIVisibility(config) {
    const isPorte = config.type === "porte";

    // Sections principales
    this.toggleSection("configuration-porte", isPorte);
    this.toggleSection("configuration-traverses-porte", isPorte);
    this.toggleSection("configuration-options-porte", isPorte);

    // CORRECTION 2: Éléments spécifiques porte - chercher par ID et selector
    this.toggleElement("#label-modulePorte", isPorte);
    this.toggleElement("#modulePorte", isPorte);

    // Logique conditionnelle dormant/imposte
    if (isPorte) {
      const withImposte =
        config.porte?.withImposte === true ||
        config.porte?.withImposte === "true";

      // CORRECTION 1: Masquer/afficher le label ET le select du dormant
      this.toggleElement("#label-dormant", !withImposte);
      this.toggleElement("#dormant", !withImposte);

      // Largeur tierce
      const withTierce =
        config.porte?.withTierce === true ||
        config.porte?.withTierce === "true";
      this.toggleElement("#widthTierce", withTierce);
      this.toggleElement('label[for="widthTierce"]', withTierce);

      // CORRECTION 2: Gestion du profil PO6622U selon la hauteur de porte
      this.updateProfileAvailability(config);

      // CORRECTION 2: Mettre à jour les options du select porteIndex
      this.updatePorteIndexOptions(config);
    }
  }

  /**
   * CORRECTION 3: Calcule quel module doit être imposé (dernier libre non modifié)
   */
  calculateImposedModuleIndex(config) {
    const { modulesCount, type, porteIndex, moduleModifiedByUser } = config;

    // Identifier les modules libres (non porte, non modifiés)
    const freeModules = [];

    for (let i = 0; i < modulesCount; i++) {
      const isPorteModule = type === "porte" && i + 1 === porteIndex;

      if (
        !isPorteModule &&
        (!moduleModifiedByUser || !moduleModifiedByUser[i])
      ) {
        freeModules.push(i);
      }
    }

    // Si il reste exactement 1 module libre, c'est lui qui est imposé
    if (freeModules.length === 1) {
      return freeModules[0];
    }

    return -1; // Aucun module imposé
  }

  updatePorteIndexOptions(config) {
    const select = document.getElementById("modulePorte");
    if (!select) return;

    const currentValue = config.porteIndex;
    const modulesCount = config.modulesCount;

    // Vide et reconstruit les options
    select.innerHTML = "";
    for (let i = 1; i <= modulesCount; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `Module ${i}`;
      if (i === currentValue) option.selected = true;
      select.appendChild(option);
    }

    // Si porteIndex dépasse le nombre de modules, ajuster
    if (currentValue > modulesCount) {
      select.value = modulesCount;
      select.dispatchEvent(new Event("change"));
    }
  }
  updateProfileAvailability(config) {
    const profileSelect = document.getElementById("po66-profile");
    if (!profileSelect) return;

    const porteHeight = config.porte?.porteHeight || 0;
    const po6622uOption = profileSelect.querySelector(
      'option[value="po6622u"]'
    );

    if (po6622uOption) {
      // CORRECTION: Inversion de la logique - PO6622U disponible SI hauteur >= 2204
      if (porteHeight >= 2204) {
        // Hauteur suffisante : PO6622U disponible
        po6622uOption.disabled = false;
        po6622uOption.textContent = "PO6622U - Profil Porte Ouvrante 66 usiné";
        po6622uOption.style.color = "";
        po6622uOption.style.fontStyle = "";
      } else {
        // Hauteur insuffisante : verrouiller PO6622U
        po6622uOption.disabled = true;
        po6622uOption.textContent =
          "PO6622U - Non disponible (hauteur < 2204mm)";
        po6622uOption.style.color = "#999";
        po6622uOption.style.fontStyle = "italic";

        // Si PO6622U était sélectionné, basculer vers PO66
        if (profileSelect.value === "po6622u") {
          profileSelect.value = "po66";
          // Déclencher l'événement change pour mettre à jour le modèle
          profileSelect.dispatchEvent(new Event("change"));
        }
      }
    }
  }

  /**
   * Met à jour l'état des champs (verrouillé/déverrouillé)
   */
  updateFieldStates(config) {
    // Hauteur de porte
    const porteHeightInput = document.querySelector(
      '[data-config-key="porte.porteHeight"]'
    );
    if (porteHeightInput) {
      if (PorteCalculator.isPorteHeightLocked(config)) {
        this.lockField(porteHeightInput, "Calculé automatiquement");
      } else {
        this.unlockField(porteHeightInput);
        porteHeightInput.max = PorteCalculator.calculateMaxPorteHeight(config);
      }
    }

    // CORRECTION 2: Mise à jour de la disponibilité du profil selon la hauteur
    if (config.type === "porte") {
      this.updateProfileAvailability(config);
    }
  }

  /**
   * Met à jour les champs calculés
   */
  updateCalculatedFields(config) {
    // Dimensions d'ouverture
    const ouvertureElement = document.getElementById("dimensions-ouverture");
    if (ouvertureElement) {
      const dimensions = PorteCalculator.calculateDimensionsOuverture(config);
      if (dimensions.hasOuverture) {
        ouvertureElement.textContent = `Dimensions de l'ouverture : ${dimensions.hauteur}mm × ${dimensions.largeur}mm`;
        ouvertureElement.style.fontWeight = "bold";
        ouvertureElement.style.color = "#007bff";
      } else {
        ouvertureElement.textContent = "";
      }
    }

    // Calcul automatique hauteur porte si verrouillée
    if (
      config.type === "porte" &&
      PorteCalculator.isPorteHeightLocked(config)
    ) {
      const imposedHeight = PorteCalculator.calculateImposedPorteHeight(config);
      const porteHeightInput = document.querySelector(
        '[data-config-key="porte.porteHeight"]'
      );
      if (
        porteHeightInput &&
        Number(porteHeightInput.value) !== imposedHeight
      ) {
        porteHeightInput.value = imposedHeight;
        // Met à jour le modèle sans déclencher d'événement circulaire
        this.configModel.state.porte.porteHeight = imposedHeight;
      }
    }
  }

  /**
   * Met à jour les listes de traverses
   */
  updateTraversesLists(config) {
    this.updateTraversesSelect(config.traverses, "list-traverses", "Traverse");
    this.updateTraversesPorteSelect(
      config.traversesPorte,
      "list-traverses-porte"
    );
  }

  /**
   * Met à jour le select des traverses principales
   */
  updateTraversesSelect(traverses, selectId, prefix = "Traverse") {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = `<option value="" selected>Sélectionner une ${prefix.toLowerCase()}</option>`;

    if (traverses && traverses.length > 0) {
      traverses.forEach((traverse) => {
        const option = document.createElement("option");
        option.value = traverse.id;
        option.textContent = `${prefix} ${
          traverse.height
        }mm (modules: ${traverse.modules.join(", ")})`;
        select.appendChild(option);
      });
    }
  }

  /**
   * Met à jour le select des traverses de porte
   */
  updateTraversesPorteSelect(traversesPorte, selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML =
      '<option value="" selected>Sélectionner une traverse</option>';

    if (traversesPorte && traversesPorte.length > 0) {
      traversesPorte.forEach((traverse) => {
        const option = document.createElement("option");
        option.value = traverse.id;
        const tierceTxt = traverse.onTierce ? " + tierce" : "";
        option.textContent = `Traverse ${traverse.height}mm (${traverse.type}mm${tierceTxt})`;
        select.appendChild(option);
      });
    }
  }

  /**
   * Configure les listeners pour les traverses
   */
  setupTraversesListeners() {
    // Traverses principales
    document.getElementById("add-traverse")?.addEventListener("click", () => {
      this.showAddTraverseModal();
    });

    document
      .getElementById("delete-traverse")
      ?.addEventListener("click", () => {
        this.deleteSelectedTraverse("list-traverses");
      });

    // Traverses porte
    document
      .getElementById("add-traverse-porte")
      ?.addEventListener("click", () => {
        this.showAddTraversePorteModal();
      });

    document
      .getElementById("delete-traverse-porte")
      ?.addEventListener("click", () => {
        this.deleteSelectedTraversePorte("list-traverses-porte");
      });
  }

  /**
   * Affiche le modal d'ajout de traverse
   */
  showAddTraverseModal() {
    if (document.getElementById("add-traverse-form")) return;

    const config = this.configModel.state;
    const maxHeight = config.height - 240;

    const form = this.createTraverseForm("add-traverse-form", {
      title: "Ajouter une traverse",
      heightMin: 240,
      heightMax: maxHeight,
      modulesCount: config.modulesCount,
      onSubmit: (data) => {
        try {
          this.configModel.addTraverse(data.height, data.modules);
          this.eventBus.emit("configChanged", this.configModel.getConfig());
          form.remove();
        } catch (error) {
          this.showError(form, error.message);
        }
      },
      onCancel: () => form.remove(),
    });

    document
      .getElementById("add-traverse")
      .insertAdjacentElement("afterend", form);
  }

  /**
   * Affiche le modal d'ajout de traverse porte
   */
  showAddTraversePorteModal() {
    if (document.getElementById("add-traverse-porte-form")) return;

    const config = this.configModel.state;
    const maxHeight = (config.porte?.porteHeight || 2200) - 240;

    const form = this.createTraversePorteForm("add-traverse-porte-form", {
      title: "Ajouter une traverse de porte",
      heightMin: 200,
      heightMax: maxHeight,
      hastierce: config.porte?.withTierce,
      onSubmit: (data) => {
        try {
          this.configModel.addTraversePorte(data.height, {
            type: data.type,
            onTierce: data.onTierce,
          });
          this.eventBus.emit("configChanged", this.configModel.getConfig());
          form.remove();
        } catch (error) {
          this.showError(form, error.message);
        }
      },
      onCancel: () => form.remove(),
    });

    document
      .getElementById("add-traverse-porte")
      .insertAdjacentElement("afterend", form);
  }

  /**
   * Crée un formulaire de traverse
   */
  createTraverseForm(id, options) {
    const form = document.createElement("form");
    form.id = id;
    form.className = "traverse-form";
    form.innerHTML = `
      <h4>${options.title}</h4>
      <div class="form-group">
        <label>
          Hauteur (mm) :
          <input type="number" min="${options.heightMin}" max="${
      options.heightMax
    }" 
                 name="height" required style="width:80px" />
        </label>
        <small>Entre ${options.heightMin}mm et ${options.heightMax}mm</small>
      </div>
      <div class="form-group">
        <label>Modules concernés :</label>
        <div class="modules-checkboxes">
          ${Array.from(
            { length: options.modulesCount },
            (_, i) => `
            <label>
              <input type="checkbox" value="${i + 1}" checked />
              M${i + 1}
            </label>
          `
          ).join("")}
        </div>
      </div>
      <div class="form-actions">
        <button type="submit">Ajouter</button>
        <button type="button" class="cancel-btn">Annuler</button>
      </div>
      <div class="error-container"></div>
    `;

    // Listeners
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const height = parseInt(form.height.value);
      const modules = Array.from(
        form.querySelectorAll('input[type="checkbox"]:checked')
      ).map((cb) => parseInt(cb.value));

      if (modules.length === 0) {
        this.showError(form, "Sélectionnez au moins un module !");
        return;
      }

      const validation = TraversesCalculator.validateTraversePosition(
        height,
        options.heightMax + 240
      );
      if (!validation.valid) {
        this.showError(form, validation.message);
        return;
      }

      options.onSubmit({ height, modules });
    });

    form
      .querySelector(".cancel-btn")
      .addEventListener("click", options.onCancel);

    return form;
  }

  /**
   * Crée un formulaire de traverse porte
   */
  createTraversePorteForm(id, options) {
    const form = document.createElement("form");
    form.id = id;
    form.className = "traverse-form";
    form.innerHTML = `
      <h4>${options.title}</h4>
      <div class="form-group">
        <label>
          Hauteur (mm) :
          <input type="number" min="${options.heightMin}" max="${
      options.heightMax
    }" 
                 name="height" required style="width:80px" />
        </label>
        <small>Entre ${options.heightMin}mm et ${options.heightMax}mm</small>
      </div>
      <div class="form-group">
        <label>
          Type de traverse :
          <select name="type">
            <option value="28">28mm</option>
            <option value="37">37mm</option>
          </select>
        </label>
      </div>
      ${
        options.hastierce
          ? `
        <div class="form-group">
          <label>
            <input type="checkbox" name="onTierce" />
            Sur la tierce
          </label>
        </div>
      `
          : ""
      }
      <div class="form-actions">
        <button type="submit">Ajouter</button>
        <button type="button" class="cancel-btn">Annuler</button>
      </div>
      <div class="error-container"></div>
    `;

    // Listeners
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const height = parseInt(form.height.value);
      const type = form.type.value;
      const onTierce = form.onTierce?.checked || false;

      const validation = TraversesCalculator.validateTraversePortePosition(
        height,
        options.heightMax + 240
      );
      if (!validation.valid) {
        this.showError(form, validation.message);
        return;
      }

      options.onSubmit({ height, type, onTierce });
    });

    form
      .querySelector(".cancel-btn")
      .addEventListener("click", options.onCancel);

    return form;
  }

  /**
   * Supprime la traverse sélectionnée
   */
  deleteSelectedTraverse(selectId) {
    const select = document.getElementById(selectId);
    const selectedId = select?.value;
    if (!selectedId) {
      alert("Sélectionnez une traverse à supprimer");
      return;
    }

    this.configModel.removeTraverse(Number(selectedId));
    this.eventBus.emit("configChanged", this.configModel.getConfig());
  }

  /**
   * Supprime la traverse de porte sélectionnée
   */
  deleteSelectedTraversePorte(selectId) {
    const select = document.getElementById(selectId);
    const selectedId = select?.value;
    if (!selectedId) {
      alert("Sélectionnez une traverse à supprimer");
      return;
    }

    this.configModel.removeTraversePorte(Number(selectedId));
    this.eventBus.emit("configChanged", this.configModel.getConfig());
  }

  /**
   * Verrouille un champ
   */
  lockField(input, tooltip = "Champ calculé automatiquement") {
    input.readOnly = true;
    input.style.backgroundColor = "#f5f5f5";
    input.style.color = "#666";
    input.title = tooltip;
    this.lockedFields.add(input);
  }

  /**
   * Déverrouille un champ
   */
  unlockField(input) {
    input.readOnly = false;
    input.style.backgroundColor = "";
    input.style.color = "";
    input.title = "";
    this.lockedFields.delete(input);
  }

  /**
   * Affiche/masque un élément
   */
  toggleElement(selector, show) {
    const element =
      typeof selector === "string"
        ? document.querySelector(selector)
        : selector;
    if (element) {
      element.classList.toggle("hidden", !show);
    }
  }

  /**
   * Affiche/masque une section
   */
  toggleSection(id, show) {
    const section = document.getElementById(id);
    if (section) {
      section.classList.toggle("hidden", !show);
    }
  }

  /**
   * Affiche une erreur dans un formulaire
   */
  showError(form, message) {
    const container = form.querySelector(".error-container");
    if (container) {
      container.innerHTML = `<div class="error-message">${message}</div>`;
      setTimeout(() => {
        container.innerHTML = "";
      }, 5000);
    }
  }

  /**
   * Récupère une valeur de configuration par clé imbriquée
   */
  getConfigValueByKey(obj, key) {
    return key.split(".").reduce((acc, k) => {
      if (!isNaN(k) && Array.isArray(acc)) {
        return acc[Number(k)];
      }
      return acc ? acc[k] : undefined;
    }, obj);
  }

  /**
   * Utilitaire debounce pour limiter les appels
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}
