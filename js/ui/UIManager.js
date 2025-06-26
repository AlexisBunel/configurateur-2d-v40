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
    this.isUpdatingUI = false;
    this.lastImposedModule = -1;
    this.lastConfigType = "pleine";
    this.lastPorteIndex = null;

    this.init();
  }

  init() {
    this.attachFormListeners();
    this.attachButtonListeners();
    this.setupValidation();
    this.updateFromConfig(this.configModel.state);

    this.eventBus.on("configChanged", (config) => {
      this.updateFromConfig(config);
    });
  }

  attachFormListeners() {
    document.querySelectorAll("[data-config-key]").forEach((input) => {
      const key = input.getAttribute("data-config-key");

      if (input.type === "number") {
        input.addEventListener("blur", () => {
          this.handleFieldChange(input, key);
          this.validateField(input, key);
        });

        input.addEventListener(
          "input",
          this.debounce(() => {
            this.validateField(input, key, this.extractFieldValue(input), true);
          }, 200)
        );
      } else {
        input.addEventListener("change", () => {
          this.handleFieldChange(input, key);
        });
      }
    });
  }

  attachButtonListeners() {
    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.configModel.resetModulesWidths();
        this.eventBus.emit("configChanged", this.configModel.getConfig());
      });
    }

    this.setupTraversesListeners();
  }

  setupValidation() {
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

    this.fieldValidators.set("modulesCount", (value, config) => {
      if (value < 1 || value > 20) {
        return {
          valid: false,
          corrected: Math.max(1, Math.min(20, value)),
          message: `Entre 1 et 20 modules`,
        };
      }

      const bounds = ModulesCalculator.calculateModulesBounds(config.width);
      if (value < bounds.min || value > bounds.max) {
        return {
          valid: true,
          corrected: value,
          message: `Optimal: ${bounds.min}-${bounds.max} modules pour cette largeur`,
        };
      }

      return { valid: true, corrected: value };
    });
  }

  handleFieldChange(input, key) {
    if (this.isUpdatingUI) return;

    let value = this.extractFieldValue(input);

    const validation = this.validateField(input, key, value);
    if (!validation.valid && validation.corrected !== undefined) {
      value = validation.corrected;
      this.setFieldValue(input, value);
    }

    const currentValue = this.getConfigValueByKey(this.configModel.state, key);
    if (currentValue === value) {
      return;
    }

    this.setConfigValueByKey(key, value);
  }

  validateField(input, key, value = null, visualOnly = false) {
    if (value === null) {
      value = this.extractFieldValue(input);
    }

    const validator = this.fieldValidators.get(key);
    let validation = { valid: true, corrected: value };

    if (validator) {
      validation = validator(value, this.configModel.state);
    }

    this.displayFieldValidation(input, validation);

    if (
      !visualOnly &&
      !validation.valid &&
      validation.corrected !== undefined
    ) {
      this.setFieldValue(input, validation.corrected);
    }

    return validation;
  }

  displayFieldValidation(input, validation) {
    const existingError = input.parentNode.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }

    if (validation.valid) {
      input.classList.remove("error");
      input.classList.add("valid");
    } else {
      input.classList.remove("valid");
      input.classList.add("error");

      if (validation.message) {
        const errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        errorDiv.textContent = validation.message;
        input.parentNode.appendChild(errorDiv);
      }
    }
  }

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
      let value = input.value;
      if (value === "true") return true;
      if (value === "false") return false;
      if (
        input.getAttribute("data-config-key") === "modulesCount" ||
        input.getAttribute("data-config-key") === "porteIndex"
      ) {
        return Number(value);
      }

      return value;
    }
  }

  setFieldValue(input, value) {
    if (input.type === "checkbox") {
      input.checked = Boolean(value);
    } else if (input.type === "radio") {
      input.checked = input.value == value;
    } else {
      input.value = value ?? "";
    }
  }

  setConfigValueByKey(key, value) {
    const keys = key.split(".");

    if (keys.length === 1) {
      const updateObj = {};
      updateObj[key] = value;
      this.configModel.updateState(updateObj);
      return;
    }

    let target = this.configModel.state;

    for (let i = 0; i < keys.length - 1; i++) {
      const currentKey = keys[i];

      if (!target[currentKey]) {
        target[currentKey] = {};
      }
      target = target[currentKey];
    }

    const finalKey = keys[keys.length - 1];
    target[finalKey] = value;

    this.configModel.performAutomaticCalculations();

    this.configModel.validate();
    this.eventBus.emit("configChanged", this.configModel.getConfig());
  }

  updateFromConfig(config) {
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

  updateFormFields(config) {
    document.querySelectorAll("[data-config-key]").forEach((input) => {
      if (this.lockedFields.has(input)) return;

      const key = input.getAttribute("data-config-key");
      const value = this.getConfigValueByKey(config, key);
      this.setFieldValue(input, value);
    });
  }

  updateModulesCountOptions(config) {
    const select = document.getElementById("modulesCount");
    if (!select) return;

    const bounds = ModulesCalculator.calculateModulesBounds(config.width);
    const currentValue = config.modulesCount;

    select.innerHTML = "";
    for (let i = bounds.min; i <= bounds.max; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      if (i === currentValue) option.selected = true;
      select.appendChild(option);
    }

    if (currentValue < bounds.min || currentValue > bounds.max) {
      select.value = bounds.min;
      select.dispatchEvent(new Event("change"));
    }
  }

  updateModulesInputs(config) {
    const container = document.getElementById("modules-width");
    if (!container) return;

    const existingInputs = container.querySelectorAll(
      'input[data-config-key^="modules."]'
    );

    const currentImposedModule = this.calculateImposedModuleIndex(config);
    const previousImposedModule = this.lastImposedModule || -1;
    const currentType = config.type;
    const previousType = this.lastConfigType || "pleine";
    const currentPorteIndex =
      config.type === "porte" ? config.porteIndex : null;
    const previousPorteIndex = this.lastPorteIndex || null;

    if (
      existingInputs.length !== config.modulesCount ||
      currentImposedModule !== previousImposedModule ||
      currentType !== previousType ||
      currentPorteIndex !== previousPorteIndex
    ) {
      this.lastImposedModule = currentImposedModule;
      this.lastConfigType = currentType;
      this.lastPorteIndex = currentPorteIndex;

      this.rebuildModulesInputs(config, container);
      return;
    }

    existingInputs.forEach((input, index) => {
      const module = config.modules[index];
      if (module && input.value != module.width) {
        input.value = module.width || "";
      }
    });
  }

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

      if (isPorteModule) {
        this.lockField(input, "Module porte, largeur imposée");
      } else if (isImposedModule) {
        this.lockField(input, `Module imposé (${module.width}mm).`);
      } else {
        this.unlockField(input);

        input.addEventListener("blur", () => {
          const newValue = parseInt(input.value);
          if (!isNaN(newValue) && newValue !== module.width) {
            this.handleModuleWidthChange(i, newValue);
            this.validateModuleWidth(input, i);
          }
        });

        input.addEventListener(
          "input",
          this.debounce(() => {
            this.validateModuleWidth(input, i, true);
          }, 200)
        );

        if (isModifiedByUser) {
          input.style.borderLeft = "3px solid #28a745";
          input.title = "Module modifié manuellement";
        }
      }

      label.appendChild(input);
      container.appendChild(label);
    }
  }

  handleModuleWidthChange(index, value) {
    const numValue = Number(value);
    if (isNaN(numValue)) return;

    const validation = ModulesCalculator.validateModuleWidth(numValue);
    const finalValue = validation.corrected;

    this.configModel.setModuleWidth(index, finalValue);
  }

  validateModuleWidth(input, index, visualOnly = false) {
    const value = Number(input.value);
    const validation = ModulesCalculator.validateModuleWidth(value);

    this.displayFieldValidation(input, validation);

    if (!visualOnly && !validation.valid) {
      input.value = validation.corrected;
      this.handleModuleWidthChange(index, validation.corrected);
    }
  }

  updatePO66Visibility(config) {
    if (config.type !== "porte") return;

    const isSerpen35m = config.porte?.serrure === "SERPEN35M";

    this.toggleElement("#form-po66", isSerpen35m);
  }

  updatePorteUIVisibility(config) {
    const isPorte = config.type === "porte";

    this.toggleSection("configuration-porte", isPorte);
    this.toggleSection("configuration-traverses-porte", isPorte);
    this.toggleSection("configuration-options-porte", isPorte);
    this.toggleElement("#label-modulePorte", isPorte);
    this.toggleElement("#modulePorte", isPorte);

    if (isPorte) {
      const withImposte =
        config.porte?.withImposte === true ||
        config.porte?.withImposte === "true";

      this.toggleElement("#label-dormant", !withImposte);
      this.toggleElement("#dormant", !withImposte);

      const withTierce =
        config.porte?.withTierce === true ||
        config.porte?.withTierce === "true";
      this.toggleElement("#widthTierce", withTierce);
      this.toggleElement('label[for="widthTierce"]', withTierce);

      this.updateProfileAvailability(config);
      this.updatePO66Visibility(config);
      this.updatePorteIndexOptions(config);
    }
  }

  calculateImposedModuleIndex(config) {
    const { modulesCount, type, porteIndex, moduleModifiedByUser } = config;

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

    if (freeModules.length === 1) {
      return freeModules[0];
    }

    return -1;
  }

  updatePorteIndexOptions(config) {
    const select = document.getElementById("modulePorte");
    if (!select) return;

    const currentValue = config.porteIndex;
    const modulesCount = config.modulesCount;

    select.innerHTML = "";
    for (let i = 1; i <= modulesCount; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `Module ${i}`;
      if (i === currentValue) option.selected = true;
      select.appendChild(option);
    }

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
      if (porteHeight <= 2204) {
        po6622uOption.disabled = false;
        po6622uOption.textContent = "PO6622U - Profil Porte Ouvrante 66 usiné";
        po6622uOption.style.color = "";
        po6622uOption.style.fontStyle = "";
      } else {
        po6622uOption.disabled = true;
        po6622uOption.textContent =
          "PO6622U - Non disponible (hauteur > 2204mm)";
        po6622uOption.style.color = "#999";
        po6622uOption.style.fontStyle = "italic";

        if (profileSelect.value === "po6622u") {
          profileSelect.value = "po66";
          profileSelect.dispatchEvent(new Event("change"));
        }
      }
    }
  }

  updateFieldStates(config) {
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

    if (config.type === "porte") {
      this.updateProfileAvailability(config);
    }
  }

  updateCalculatedFields(config) {
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
        this.configModel.state.porte.porteHeight = imposedHeight;
      }
    }
  }

  updateTraversesLists(config) {
    this.updateTraversesSelect(config.traverses, "list-traverses", "Traverse");
    this.updateTraversesPorteSelect(
      config.traversesPorte,
      "list-traverses-porte"
    );
  }

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

  updateTraversesPorteSelect(traversesPorte, selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML =
      '<option value="" selected>Sélectionner une traverse</option>';

    if (traversesPorte && traversesPorte.length > 0) {
      traversesPorte.forEach((traverse) => {
        const option = document.createElement("option");
        option.value = traverse.id;
        const tierceTxt = traverse.onTierce ? " tierce" : " porte";
        option.textContent = `Traverse ${traverse.height}mm (${traverse.type}mm) - ${tierceTxt}`;
        select.appendChild(option);
      });
    }
  }

  setupTraversesListeners() {
    document.getElementById("add-traverse")?.addEventListener("click", () => {
      this.showAddTraverseModal();
    });

    document
      .getElementById("delete-traverse")
      ?.addEventListener("click", () => {
        this.deleteSelectedTraverse("list-traverses");
      });

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

  showAddTraverseModal() {
    if (document.getElementById("add-traverse-form")) return;

    const config = this.configModel.state;
    const maxHeight = config.height - 240;

    const form = this.createTraverseForm("add-traverse-form", {
      title: "Ajouter une traverse",
      heightMin: 240,
      heightMax: maxHeight,
      modulesCount: config.modulesCount,

      hasPorte: config.type === "porte",
      porteIndex: config.porteIndex,

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

  showAddTraversePorteModal() {
    if (document.getElementById("add-traverse-porte-form")) return;

    const config = this.configModel.state;
    const maxHeight = (config.porte?.porteHeight || 2200) - 240;
    const withTierce =
      config.porte?.withTierce === true || config.porte?.withTierce === "true";

    const form = this.createTraversePorteForm("add-traverse-porte-form", {
      title: "Ajouter une traverse sur la porte",
      heightMin: 200,
      heightMax: maxHeight,
      hastierce: withTierce,
      onSubmit: (data) => {
        try {
          this.configModel.addTraversePorte(data.height, {
            type: data.type,
            onPorte: data.onPorte,
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
        ${this.generateModulesCheckboxes(options)}
      </div>
      ${
        options.hasPorte
          ? '<small style="color: #dc3545; font-style: italic;">Le module contenant la porte ne peut pas avoir de traverse</small>'
          : ""
      }
    </div>
    <div class="form-actions">
      <button type="submit">Ajouter</button>
      <button type="button" class="cancel-btn">Annuler</button>
    </div>
    <div class="error-container"></div>
  `;

    this.attachTraverseFormListeners(form, options);

    return form;
  }

  attachTraverseFormListeners(form, options) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const height = parseInt(form.height.value);
      const selectedCheckboxes = form.querySelectorAll(
        'input[type="checkbox"]:checked:not(:disabled)'
      );
      const modules = Array.from(selectedCheckboxes).map((cb) =>
        parseInt(cb.value)
      );

      if (modules.length === 0) {
        this.showError(form, "Sélectionnez au moins un module !");
        return;
      }

      if (options.hasPorte && modules.includes(options.porteIndex)) {
        this.showError(
          form,
          "Le module contenant la porte ne peut pas avoir de traverse !"
        );
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
  }

  addModuleSelectionInfo(form, options) {
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    const infoDiv = document.createElement("div");
    infoDiv.className = "modules-selection-info";
    infoDiv.style.marginTop = "10px";
    infoDiv.style.fontSize = "0.85rem";
    infoDiv.style.color = "#495057";

    const updateInfo = () => {
      const selectedCount = form.querySelectorAll(
        'input[type="checkbox"]:checked:not(:disabled)'
      ).length;
      const totalAvailable = options.modulesCount - (options.hasPorte ? 1 : 0);

      infoDiv.innerHTML = `
      <strong>Sélection :</strong> ${selectedCount}/${totalAvailable} modules disponibles
      ${
        options.hasPorte
          ? "<br><em>Le module porte est automatiquement exclu</em>"
          : ""
      }
    `;
    };

    checkboxes.forEach((checkbox) => {
      if (!checkbox.disabled) {
        checkbox.addEventListener("change", updateInfo);
      }
    });

    const modulesGroup = form.querySelector(".form-group:last-of-type");
    modulesGroup.appendChild(infoDiv);

    updateInfo();
  }

  generateModulesCheckboxes(options) {
    const { modulesCount, hasPorte, porteIndex } = options;

    return Array.from({ length: modulesCount }, (_, i) => {
      const moduleNumber = i + 1;
      const isPorteModule = hasPorte && moduleNumber === porteIndex;

      const isChecked = !isPorteModule;
      const isDisabled = isPorteModule;

      let labelText = `Module ${moduleNumber}`;
      let labelStyle = "";
      let checkboxStyle = "";

      if (isPorteModule) {
        labelText = `Module ${moduleNumber} (porte)`;
        labelStyle = 'style="color: #6c757d; font-style: italic;"';
        checkboxStyle = 'style="cursor: not-allowed;"';
      }

      return `
      <label ${labelStyle}>
        <input 
          type="checkbox" 
          value="${moduleNumber}" 
          ${isChecked ? "checked" : ""}
          ${isDisabled ? "disabled" : ""}
          ${checkboxStyle}
        />
        ${labelText}
      </label>
    `;
    }).join("");
  }

  createTraversePorteForm(id, options) {
    const form = document.createElement("form");
    form.id = id;
    form.className = "traverse-form";
    form.innerHTML = `
      <h4>${options.title}</h4>
      <div class="form-group">
        <label>
          Hauteur sol / sous-traverse (mm) :
          <input type="number" min="${options.heightMin}" max="${
      options.heightMax
    }" 
                 name="height" required style="width:80px" />
        </label>
        <small>Distance depuis le sol jusqu'à la sous-face de la traverse (entre ${
          options.heightMin
        }mm et ${options.heightMax}mm)</small>
      </div>
      <div class="form-group">
        <label>
          Type de traverse :
          <select name="type">
            <option value="28" selected>28mm</option>
            <option value="37">37mm</option>
          </select>
        </label>
      </div>
      <div class="form-group">
        <label style="font-weight: 600; color: #495057; margin-bottom: 10px;">Emplacement :</label>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-left: 15px;">
          <label style="flex-direction: row; align-items: center; gap: 8px; font-weight: normal;">
            <input type="checkbox" name="onPorte" checked style="width: auto;" />
            Sur la porte
          </label>
          ${
            options.hastierce
              ? `
            <label style="flex-direction: row; align-items: center; gap: 8px; font-weight: normal;">
              <input type="checkbox" name="onTierce" style="width: auto;" />
              Sur la tierce
            </label>
          `
              : ""
          }
        </div>
        <small style="margin-top: 8px;">Sélectionnez où placer la traverse</small>
      </div>
      <div class="form-actions">
        <button type="submit">Ajouter</button>
        <button type="button" class="cancel-btn">Annuler</button>
      </div>
      <div class="error-container"></div>
    `;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const height = parseInt(form.height.value);
      const type = form.type.value;
      const onPorte = form.onPorte?.checked || false;
      const onTierce = form.onTierce?.checked || false;

      if (!onPorte && !onTierce) {
        this.showError(
          form,
          "Sélectionnez au moins un emplacement (porte ou tierce)"
        );
        return;
      }

      const validation = TraversesCalculator.validateTraversePortePosition(
        height,
        options.heightMax + 240
      );
      if (!validation.valid) {
        this.showError(form, validation.message);
        return;
      }

      try {
        if (onPorte) {
          options.onSubmit({ height, type, onPorte: true, onTierce: false });
        }
        if (onTierce) {
          options.onSubmit({ height, type, onPorte: false, onTierce: true });
        }
      } catch (error) {
        this.showError(form, error.message);
      }
    });

    const heightInput = form.querySelector('input[name="height"]');
    heightInput.addEventListener("input", () => {
      const height = parseInt(heightInput.value);
      if (!isNaN(height)) {
        const config = this.configModel.state;

        const porteConflict =
          TraversesCalculator.checkTraversePorteSpecificConflict(
            config.traversesPorte,
            height,
            true,
            false
          );
        const tierceConflict = config.porte?.withTierce
          ? TraversesCalculator.checkTraversePorteSpecificConflict(
              config.traversesPorte,
              height,
              false,
              true
            )
          : { conflict: false };

        if (porteConflict.conflict && tierceConflict.conflict) {
          this.showError(form, `Conflits sur porte ET tierce à ${height}mm`);
        } else if (porteConflict.conflict) {
          this.showError(form, `Conflit sur porte: ${porteConflict.message}`);
        } else if (tierceConflict.conflict) {
          this.showError(form, `Conflit sur tierce: ${tierceConflict.message}`);
        } else {
          const errorContainer = form.querySelector(".error-container");
          if (errorContainer) errorContainer.innerHTML = "";
        }
      }
    });

    form
      .querySelector(".cancel-btn")
      .addEventListener("click", options.onCancel);
    return form;
  }

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

  lockField(input, tooltip = "Champ calculé automatiquement") {
    input.readOnly = true;
    input.style.backgroundColor = "#f5f5f5";
    input.style.color = "#666";
    input.title = tooltip;
    this.lockedFields.add(input);
  }

  unlockField(input) {
    input.readOnly = false;
    input.style.backgroundColor = "";
    input.style.color = "";
    input.title = "";
    this.lockedFields.delete(input);
  }

  toggleElement(selector, show) {
    const element =
      typeof selector === "string"
        ? document.querySelector(selector)
        : selector;
    if (element) {
      element.classList.toggle("hidden", !show);
    }
  }

  toggleSection(id, show) {
    const section = document.getElementById(id);
    if (section) {
      section.classList.toggle("hidden", !show);
    }
  }

  showError(form, message) {
    const container = form.querySelector(".error-container");
    if (container) {
      container.innerHTML = `<div class="error-message">${message}</div>`;
      setTimeout(() => {
        container.innerHTML = "";
      }, 5000);
    }
  }

  getConfigValueByKey(obj, key) {
    return key.split(".").reduce((acc, k) => {
      if (!isNaN(k) && Array.isArray(acc)) {
        return acc[Number(k)];
      }
      return acc ? acc[k] : undefined;
    }, obj);
  }

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
