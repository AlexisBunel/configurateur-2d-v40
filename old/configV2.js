// config.js - Gestionnaire de configuration centralisé

class ConfigurationManager {
  constructor() {
    // Configuration par défaut
    this.config = {
      // Dimensions principales
      width: 4000,
      height: 2500,

      // Type de verrière
      type: "pleine", // 'pleine' ou 'porte'

      // Configuration porte
      porte: {
        withTierce: false,
        withImposte: false,
        withDormant: false,
        charniereType: "visible",
        porteWidth: 730,
        tierceWidth: 350,
        porteHeight: 2200,
        traverseType: "28",
        sensOuverture: "droit",
        serrure: "SERROULM",
        profile: "po66",
        colorBequille: "noir",
        colorPvitrage: "noir",
      },

      // Configuration modules
      modulesCount: 4,
      porteIndex: 3, // Index du module contenant la porte (commence à 1)
      modulesWidth: [950, 950, 950, 950], // Largeurs des modules

      // Traverses principales
      traverses: [],

      // Traverses porte
      traversesPorte: [],

      // Options finition
      options: {
        colorProfile: "noir",
        remplissageEp: "6",
        colorJoint: "noir",
      },
    };

    // Contraintes de validation
    this.constraints = {
      width: { min: 400, max: 5000 },
      height: { min: 400, max: 5000 },
      porte: {
        porteWidth: { min: 400, max: 1230 },
        tierceWidth: { min: 300, max: 1230 },
        porteHeight: { min: 500, max: 4000 },
      },
      module: {
        width: { min: 200, max: 2000 },
      },
    };

    this.errors = {};
  }

  // Getter pour récupérer une valeur de configuration
  get(path) {
    return this.getNestedValue(this.config, path);
  }

  // Setter pour modifier une valeur avec validation
  set(path, value) {
    const oldValue = this.get(path);

    // Validation
    const error = this.validate(path, value);
    if (error) {
      this.errors[path] = error;
      EventManager.emit("validationError", { path, error, value });
      return false;
    }

    // Supprime l'erreur précédente si elle existait
    delete this.errors[path];

    // Met à jour la valeur
    this.setNestedValue(this.config, path, value);

    // Recalcule les valeurs dépendantes
    this.updateDependentValues(path, value, oldValue);

    // Émet l'événement de changement
    EventManager.emit("configChanged", { path, value, oldValue });

    return true;
  }

  // Validation des valeurs
  validate(path, value) {
    const numValue = parseFloat(value);

    // Validation des dimensions principales
    if (path === "width" || path === "height") {
      const constraint = this.constraints[path];
      if (numValue < constraint.min) {
        return `La ${
          path === "width" ? "largeur" : "hauteur"
        } doit être d'au moins ${constraint.min}mm`;
      }
      if (numValue > constraint.max) {
        return `La ${
          path === "width" ? "largeur" : "hauteur"
        } ne peut pas dépasser ${constraint.max}mm`;
      }
    }

    // Validation des dimensions porte
    if (path.startsWith("porte.")) {
      const porteProp = path.split(".")[1];
      if (this.constraints.porte[porteProp]) {
        const constraint = this.constraints.porte[porteProp];
        if (numValue < constraint.min || numValue > constraint.max) {
          return `Valeur hors limites (${constraint.min}-${constraint.max}mm)`;
        }
      }
    }

    // Validation de la hauteur de porte vs hauteur verrière
    if (path === "porte.porteHeight") {
      const maxHeight = this.get("height") - 100; // Garde 100mm pour la structure
      if (numValue > maxHeight) {
        return `La hauteur de porte ne peut pas dépasser ${maxHeight}mm (hauteur verrière - 100mm)`;
      }
    }

    // Validation des largeurs de modules
    if (path.startsWith("modulesWidth")) {
      if (numValue < this.constraints.module.width.min) {
        return `Largeur minimum d'un module : ${this.constraints.module.width.min}mm`;
      }
      if (numValue > this.constraints.module.width.max) {
        return `Largeur maximum d'un module : ${this.constraints.module.width.max}mm`;
      }

      // Vérification de la somme totale
      const moduleIndex = parseInt(path.split("[")[1]);
      const modulesWidth = [...this.get("modulesWidth")];
      modulesWidth[moduleIndex] = numValue;
      const totalWidth = modulesWidth.reduce((sum, width) => sum + width, 0);
      const availableWidth =
        this.get("width") - (this.get("modulesCount") + 1) * 40; // 40mm par montant

      if (Math.abs(totalWidth - availableWidth) > 10) {
        // Tolérance de 10mm
        return `La somme des modules (${totalWidth}mm) ne correspond pas à la largeur disponible (${availableWidth}mm)`;
      }
    }

    return null; // Pas d'erreur
  }

  // Met à jour les valeurs dépendantes
  updateDependentValues(path, value, oldValue) {
    // Si on change la largeur totale, recalcule les modules
    if (path === "width") {
      this.recalculateModules();
    }

    // Si on change le nombre de modules, ajuste le tableau
    if (path === "modulesCount") {
      this.adjustModulesArray(value);
    }

    // Si on change le type vers 'pleine', cache les options porte
    if (path === "type") {
      if (value === "pleine") {
        EventManager.emit("hidePorteConfig");
      } else {
        EventManager.emit("showPorteConfig");
      }
    }

    // Si on active/désactive la tierce
    if (path === "porte.withTierce") {
      if (value === "true" || value === true) {
        EventManager.emit("showTierceConfig");
      } else {
        EventManager.emit("hideTierceConfig");
      }
    }
  }

  // Recalcule la répartition des modules
  recalculateModules() {
    const totalWidth = this.get("width");
    const modulesCount = this.get("modulesCount");
    const montantsWidth = (modulesCount + 1) * 40; // 40mm par montant
    const availableWidth = totalWidth - montantsWidth;
    const moduleWidth = Math.floor(availableWidth / modulesCount);

    const newModulesWidth = new Array(modulesCount).fill(moduleWidth);
    this.setNestedValue(this.config, "modulesWidth", newModulesWidth);
  }

  // Ajuste le tableau des modules selon le nombre
  adjustModulesArray(newCount) {
    const currentWidths = this.get("modulesWidth");
    const currentCount = currentWidths.length;

    if (newCount > currentCount) {
      // Ajouter des modules
      const defaultWidth = 1000;
      while (currentWidths.length < newCount) {
        currentWidths.push(defaultWidth);
      }
    } else if (newCount < currentCount) {
      // Supprimer des modules
      currentWidths.splice(newCount);
    }

    this.setNestedValue(this.config, "modulesWidth", currentWidths);
    this.recalculateModules();
  }

  // Calcule les dimensions d'ouverture pour la porte
  getOuvertureDimensions() {
    if (this.get("type") !== "porte") return null;

    const porteWidth = this.get("porte.porteWidth");
    const porteHeight = this.get("porte.porteHeight");
    const withTierce = this.get("porte.withTierce");
    const tierceWidth = withTierce ? this.get("porte.tierceWidth") : 0;

    return {
      width: porteWidth + tierceWidth + (withTierce ? 40 : 0), // +40mm pour montant tierce
      height: porteHeight,
      porteWidth,
      tierceWidth: withTierce ? tierceWidth : 0,
    };
  }

  // Fonctions utilitaires pour gérer les objets imbriqués
  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
      if (key.includes("[")) {
        const arrayKey = key.split("[")[0];
        const index = parseInt(key.split("[")[1].split("]")[0]);
        return current[arrayKey] ? current[arrayKey][index] : undefined;
      }
      return current ? current[key] : undefined;
    }, obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (key.includes("[")) {
        const arrayKey = key.split("[")[0];
        const index = parseInt(key.split("[")[1].split("]")[0]);
        if (!current[arrayKey]) current[arrayKey] = [];
        return current[arrayKey];
      }
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);

    if (lastKey.includes("[")) {
      const arrayKey = lastKey.split("[")[0];
      const index = parseInt(lastKey.split("[")[1].split("]")[0]);
      if (!target[arrayKey]) target[arrayKey] = [];
      target[arrayKey][index] = value;
    } else {
      target[lastKey] = value;
    }
  }

  // Export/Import de configuration
  export() {
    return JSON.stringify(this.config, null, 2);
  }

  import(jsonConfig) {
    try {
      this.config = JSON.parse(jsonConfig);
      EventManager.emit("configImported", { config: this.config });
      return true;
    } catch (error) {
      console.error("Erreur lors de l'import de configuration:", error);
      return false;
    }
  }

  // Réinitialise la configuration
  reset() {
    const oldConfig = { ...this.config };
    this.config = this.getDefaultConfig();
    EventManager.emit("configReset", { oldConfig, newConfig: this.config });
  }

  getDefaultConfig() {
    return {
      width: 4000,
      height: 2500,
      type: "pleine",
      porte: {
        withTierce: false,
        withImposte: false,
        withDormant: false,
        charniereType: "visible",
        porteWidth: 730,
        tierceWidth: 350,
        porteHeight: 2200,
        traverseType: "28",
        sensOuverture: "droit",
        serrure: "SERROULM",
        profile: "po66",
        colorBequille: "noir",
        colorPvitrage: "noir",
      },
      modulesCount: 4,
      porteIndex: 3,
      modulesWidth: [1000, 1000, 1000, 1000],
      traverses: [],
      traversesPorte: [],
      options: {
        colorProfile: "noir",
        remplissageEp: "6",
        colorJoint: "noir",
      },
    };
  }
}

// Instance globale du gestionnaire de configuration
const configManager = new ConfigurationManager();
