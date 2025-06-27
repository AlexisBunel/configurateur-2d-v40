import { ModulesCalculator } from "../calculations/ModulesCalculator.js";
import { PorteCalculator } from "../calculations/PorteCalculator.js";
import { TraversesCalculator } from "../calculations/TraversesCalculator.js";
import { ValidationRules } from "./ValidationRules.js";

export class ConfigModel {
  constructor(initialConfig = {}, eventBus = null) {
    this.eventBus = eventBus;
    this.state = this.getDefaultConfig();
    this.isUpdating = false;

    if (Object.keys(initialConfig).length > 0) {
      this.updateState(initialConfig, false);
    }

    this.validate();
  }

  getDefaultConfig() {
    return {
      width: 4000,
      height: 2500,
      type: "pleine",
      modulesCount: 4,
      porteIndex: 3,
      modules: [
        { width: 950, type: "fixe" },
        { width: 950, type: "fixe" },
        { width: 950, type: "fixe" },
        { width: 950, type: "fixe" },
      ],
      moduleModifiedByUser: [false, false, false, false],
      traverses: [],
      porte: {
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
      },
      traversesPorte: [],
      options: {
        colorProfile: "noir",
        remplissageEp: 6,
        colorJoint: "noir",
      },
    };
  }

  updateState(newValues = {}, notify = true) {
    if (this.isUpdating) return this.state;

    this.isUpdating = true;

    try {
      const hasChanged = this.hasStateChanged(newValues);

      this.state = { ...this.state, ...newValues };

      this.performAutomaticCalculations();

      this.validate();

      if (notify && hasChanged && this.eventBus) {
        this.eventBus.emit("configChanged", this.getConfig());
      }
    } finally {
      this.isUpdating = false;
    }

    return this.state;
  }

  hasStateChanged(newValues) {
    for (const [key, newValue] of Object.entries(newValues)) {
      if (this.state[key] !== newValue) {
        return true;
      }
    }
    return false;
  }

  performAutomaticCalculations() {
    this.updateModulesStructure();

    this.updatePorteHeight();

    this.validatePorteIndex();
  }

  recalculateFreeModulesWidths() {
    const { modulesCount, width, porteIndex, type } = this.state;

    if (type === "porte") {
      const dimensionsOuverture = PorteCalculator.calculateDimensionsOuverture(
        this.state
      );
      const porteModuleWidth = dimensionsOuverture.largeur - 102;

      if (this.state.modules[porteIndex - 1]) {
        this.state.modules[porteIndex - 1].width = porteModuleWidth;
        this.state.modules[porteIndex - 1].type = "porte";
      }

      const freeModulesCount = modulesCount - 1;
      if (freeModulesCount > 0) {
        const clairVitrage =
          (width - dimensionsOuverture.largeur - (modulesCount - 1) * 40) /
          freeModulesCount;

        for (let i = 0; i < modulesCount; i++) {
          if (i + 1 !== porteIndex && this.state.modules[i]) {
            this.state.modules[i].width = Math.floor(clairVitrage);
            this.state.modules[i].type = "fixe";
          }
        }
      }
    } else {
      const clairVitrage = (width - (modulesCount + 1) * 40) / modulesCount;

      for (let i = 0; i < modulesCount; i++) {
        if (this.state.modules[i]) {
          this.state.modules[i].width = Math.floor(clairVitrage);
          this.state.modules[i].type = "fixe";
        }
      }
    }
  }

  updateModulesStructure() {
    const { modulesCount, width, type, porteIndex } = this.state;

    while (this.state.modules.length < modulesCount) {
      this.state.modules.push({ width: 800, type: "fixe" });
    }
    while (this.state.modules.length > modulesCount) {
      this.state.modules.pop();
    }

    while (this.state.moduleModifiedByUser.length < modulesCount) {
      this.state.moduleModifiedByUser.push(false);
    }
    while (this.state.moduleModifiedByUser.length > modulesCount) {
      this.state.moduleModifiedByUser.pop();
    }

    if (type === "porte") {
      const dimensionsOuverture = PorteCalculator.calculateDimensionsOuverture(
        this.state
      );
      const porteModuleWidth = dimensionsOuverture.largeur - 102;

      const freeModulesCount = modulesCount - 1;
      const clairVitrage =
        freeModulesCount > 0
          ? (width - dimensionsOuverture.largeur - (modulesCount - 1) * 40) /
            freeModulesCount
          : 0;

      for (let i = 0; i < modulesCount; i++) {
        if (!this.state.modules[i]) {
          this.state.modules[i] = { width: 800, type: "fixe" };
        }

        const isPorteModule = i + 1 === porteIndex;

        if (isPorteModule) {
          this.state.modules[i].type = "porte";
          this.state.modules[i].width = porteModuleWidth;
          this.state.moduleModifiedByUser[i] = false;
        } else {
          this.state.modules[i].type = "fixe";
          if (!this.state.moduleModifiedByUser[i]) {
            this.state.modules[i].width = Math.floor(clairVitrage);
          }
        }
      }
    } else {
      const clairVitrage = (width - (modulesCount + 1) * 40) / modulesCount;

      for (let i = 0; i < modulesCount; i++) {
        if (!this.state.modules[i]) {
          this.state.modules[i] = { width: 800, type: "fixe" };
        }

        this.state.modules[i].type = "fixe";
        if (!this.state.moduleModifiedByUser[i]) {
          this.state.modules[i].width = Math.floor(clairVitrage);
        }
      }
    }
    this.handleLastFreeModuleImposition();
  }

  handleLastFreeModuleImposition() {
    const { modulesCount, type, porteIndex, width } = this.state;

    const freeModules = [];
    const modifiedModules = [];

    for (let i = 0; i < modulesCount; i++) {
      const isPorteModule = type === "porte" && i + 1 === porteIndex;

      if (!isPorteModule) {
        if (this.state.moduleModifiedByUser[i]) {
          modifiedModules.push(i);
        } else {
          freeModules.push(i);
        }
      }
    }

    if (freeModules.length === 1) {
      const imposedIndex = freeModules[0];
      const imposedWidth = this.calculateImposedModuleWidth(imposedIndex);
      this.state.modules[imposedIndex].width = imposedWidth;
    } else if (freeModules.length > 1) {
      this.redistributeFreeModules(freeModules);
    }
  }

  redistributeFreeModules(freeModulesIndexes) {
    const { modulesCount, width, type } = this.state;

    if (freeModulesIndexes.length === 0) return;

    let usedWidth = 0;
    for (let i = 0; i < modulesCount; i++) {
      const isPorteModule = type === "porte" && i + 1 === this.state.porteIndex;
      const isModifiedModule = this.state.moduleModifiedByUser[i];

      if (isPorteModule || isModifiedModule) {
        usedWidth += this.state.modules[i].width || 0;
      }
    }

    let profilesWidth;
    if (type === "porte") {
      profilesWidth = (modulesCount - 1) * 40 + 102;
    } else {
      profilesWidth = (modulesCount + 1) * 40;
    }

    const remainingWidth = width - usedWidth - profilesWidth;
    const widthPerFreeModule = Math.floor(
      remainingWidth / freeModulesIndexes.length
    );

    freeModulesIndexes.forEach((index) => {
      this.state.modules[index].width = Math.max(
        200,
        Math.min(2000, widthPerFreeModule)
      );
    });
  }

  calculateImposedModuleWidth(imposedIndex) {
    const { modulesCount, width, type } = this.state;

    let otherModulesWidth = 0;
    for (let i = 0; i < modulesCount; i++) {
      if (i !== imposedIndex) {
        otherModulesWidth += this.state.modules[i].width || 0;
      }
    }

    let profilesWidth;
    if (type === "porte") {
      profilesWidth = (modulesCount - 1) * 40 + 102;
    } else {
      profilesWidth = (modulesCount + 1) * 40;
    }

    const imposedWidth = width - otherModulesWidth - profilesWidth;

    return Math.max(200, Math.min(2000, Math.round(imposedWidth)));
  }

  updatePorteHeight() {
    if (this.state.type !== "porte") return;

    const isLocked = PorteCalculator.isPorteHeightLocked(this.state);
    if (isLocked) {
      const calculatedHeight = PorteCalculator.calculateImposedPorteHeight(
        this.state
      );
      this.state.porte.porteHeight = calculatedHeight;
    }
  }

  validatePorteIndex() {
    if (this.state.type === "porte") {
      const maxIndex = this.state.modulesCount;
      if (this.state.porteIndex > maxIndex) {
        this.state.porteIndex = maxIndex;
      }
      if (this.state.porteIndex < 1) {
        this.state.porteIndex = 1;
      }
    }
  }

  validate() {
    this.state.width = this.clamp(this.state.width, 400, 5000);
    this.state.height = this.clamp(this.state.height, 400, 5000);

    this.state.modulesCount = this.clamp(this.state.modulesCount, 1, 20);

    if (this.state.type === "porte" && this.state.porte) {
      this.validatePorteConfig();
    }

    this.validateModules();

    this.validateTraverses();

    return this.state;
  }

  validatePorteConfig() {
    const porte = this.state.porte;

    porte.porteWidth = this.clamp(porte.porteWidth, 400, 1230);
    porte.tierceWidth = this.clamp(porte.tierceWidth, 300, 1230);

    if (!PorteCalculator.isPorteHeightLocked(this.state)) {
      const maxHeight = PorteCalculator.calculateMaxPorteHeight(this.state);
      porte.porteHeight = this.clamp(porte.porteHeight, 500, maxHeight);
    }

    if (!["visible", "invisible"].includes(porte.charniereType)) {
      porte.charniereType = "visible";
    }
    if (!["droit", "gauche"].includes(porte.sensOuverture)) {
      porte.sensOuverture = "droit";
    }
    if (!["SERROULM", "SERROULPENM", "SERPEN35M"].includes(porte.serrure)) {
      porte.serrure = "SERROULM";
    }
  }

  validateModules() {
    this.state.modules.forEach((module) => {
      if (module.type !== "porte") {
        module.width = this.clamp(module.width, 200, 2000);
      }
    });
  }

  validateTraverses() {
    this.state.traverses = this.state.traverses.filter((traverse) => {
      return (
        traverse.height >= 240 &&
        traverse.height <= this.state.height - 240 &&
        Array.isArray(traverse.modules) &&
        traverse.modules.length > 0
      );
    });

    this.state.traversesPorte = this.state.traversesPorte.filter((traverse) => {
      return (
        traverse.height >= 200 &&
        traverse.height <= (this.state.porte?.porteHeight || 2200) - 240
      );
    });
  }

  clamp(value, min, max) {
    if (typeof value !== "number" || isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  setModuleWidth(index, width) {
    if (index < 0 || index >= this.state.modules.length) {
      throw new Error("Index de module invalide");
    }

    if (this.state.modules[index].type === "porte") {
      throw new Error("Impossible de modifier la largeur d'un module porte");
    }

    const validatedWidth = this.clamp(width, 200, 2000);
    this.state.modules[index].width = validatedWidth;

    this.state.moduleModifiedByUser[index] = true;

    this.handleLastFreeModuleImposition();

    if (this.eventBus) {
      this.eventBus.emit("configChanged", this.getConfig());
    }

    return this.state;
  }

  resetModulesWidths() {
    const { modulesCount, width, type, porteIndex } = this.state;
    this.state.moduleModifiedByUser = new Array(modulesCount).fill(false);

    if (type === "porte") {
      const dimensionsOuverture = PorteCalculator.calculateDimensionsOuverture(
        this.state
      );
      const porteModuleWidth = dimensionsOuverture.largeur - 102;

      const freeModulesCount = modulesCount - 1;
      const clairVitrage =
        freeModulesCount > 0
          ? (width - dimensionsOuverture.largeur - (modulesCount - 1) * 40) /
            freeModulesCount
          : 0;

      for (let i = 0; i < modulesCount; i++) {
        if (!this.state.modules[i]) {
          this.state.modules[i] = { width: 800, type: "fixe" };
        }

        const isPorteModule = i + 1 === porteIndex;

        if (isPorteModule) {
          this.state.modules[i].type = "porte";
          this.state.modules[i].width = porteModuleWidth;
        } else {
          this.state.modules[i].type = "fixe";
          this.state.modules[i].width = Math.floor(clairVitrage);
        }
      }
    } else {
      const clairVitrage = (width - (modulesCount + 1) * 40) / modulesCount;

      for (let i = 0; i < modulesCount; i++) {
        if (!this.state.modules[i]) {
          this.state.modules[i] = { width: 800, type: "fixe" };
        }

        this.state.modules[i].type = "fixe";
        this.state.modules[i].width = Math.floor(clairVitrage);
      }
    }

    return this.getConfig();
  }

  addTraverse(height, modules = [1]) {
    if (height < 240 || height > this.state.height - 240) {
      throw new Error(
        `Hauteur de traverse invalide (${240} - ${this.state.height - 240})`
      );
    }

    if (!Array.isArray(modules) || modules.length === 0) {
      throw new Error("Au moins un module doit être sélectionné");
    }

    const conflict = this.state.traverses.some(
      (t) => t.height === height && t.modules.some((m) => modules.includes(m))
    );

    if (conflict) {
      throw new Error("Conflit avec une traverse existante");
    }

    const id = Date.now() + Math.floor(Math.random() * 10000);
    this.state.traverses.push({ id, height, modules: [...modules] });

    return id;
  }

  removeTraverse(id) {
    this.state.traverses = this.state.traverses.filter((t) => t.id !== id);
    return this.state;
  }

  addTraversePorte(
    height,
    { type = "28", onPorte = true, onTierce = false } = {}
  ) {
    const maxHeight = (this.state.porte?.porteHeight || 2200) - 240;

    if (height < 200 || height > maxHeight) {
      throw new Error(`Hauteur invalide (200 - ${maxHeight}mm)`);
    }

    if (!onPorte && !onTierce) {
      throw new Error("Sélectionnez au moins un emplacement (porte ou tierce)");
    }

    if (onPorte) {
      const porteConflict =
        TraversesCalculator.checkTraversePorteSpecificConflict(
          this.state.traversesPorte,
          height,
          true,
          false
        );
      if (porteConflict.conflict) {
        throw new Error(`Sur porte: ${porteConflict.message}`);
      }
    }

    if (onTierce) {
      const tierceConflict =
        TraversesCalculator.checkTraversePorteSpecificConflict(
          this.state.traversesPorte,
          height,
          false,
          true
        );
      if (tierceConflict.conflict) {
        throw new Error(`Sur tierce: ${tierceConflict.message}`);
      }
    }

    const id = Date.now() + Math.floor(Math.random() * 10000);
    this.state.traversesPorte.push({
      id,
      height,
      type,
      onPorte: onPorte,
      onTierce: onTierce,
    });

    return id;
  }

  removeTraversePorte(id) {
    this.state.traversesPorte = this.state.traversesPorte.filter(
      (t) => t.id !== id
    );
    return this.state;
  }

  static calculateDimensionsOuverture(config) {
    return PorteCalculator.calculateDimensionsOuverture(config);
  }

  getConfig() {
    return JSON.parse(JSON.stringify(this.state));
  }

  getSummary() {
    const cfg = this.state;
    return {
      dimensions: `${cfg.width}mm × ${cfg.height}mm`,
      type: cfg.type,
      modules: `${cfg.modulesCount} modules`,
      porte:
        cfg.type === "porte"
          ? {
              largeur: `${cfg.porte.porteWidth}mm`,
              hauteur: `${cfg.porte.porteHeight}mm`,
              tierce: cfg.porte.withTierce
                ? `${cfg.porte.tierceWidth}mm`
                : "Non",
              imposte: cfg.porte.withImposte ? "Oui" : "Non",
            }
          : null,
      traverses: {
        principales: cfg.traverses?.length || 0,
        porte: cfg.traversesPorte?.length || 0,
      },
      couleur: cfg.options.colorProfile,
    };
  }

  saveToStorage(key = "verriere_config") {
    try {
      localStorage.setItem(key, JSON.stringify(this.state));
      return true;
    } catch (e) {
      console.error("Erreur sauvegarde :", e);
      return false;
    }
  }

  loadFromStorage(key = "verriere_config") {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const loaded = JSON.parse(item);
        this.state = { ...this.getDefaultConfig(), ...loaded };
        this.validate();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Erreur chargement :", e);
      return false;
    }
  }

  toJSON() {
    return JSON.stringify(this.state, null, 2);
  }

  fromJSON(jsonString) {
    try {
      const obj = JSON.parse(jsonString);
      this.state = { ...this.getDefaultConfig(), ...obj };
      this.validate();
      return true;
    } catch (e) {
      console.error("JSON invalide :", e);
      return false;
    }
  }
}
