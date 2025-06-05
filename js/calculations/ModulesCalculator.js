// ===== js/calculations/ModulesCalculator.js =====
export class ModulesCalculator {
  /**
   * Calcule les bornes min/max pour le nombre de modules
   * @param {number} width - Largeur totale
   * @returns {{min: number, max: number}}
   */
  static calculateModulesBounds(width) {
    const minModules = Math.max(1, Math.ceil(width / 1500)); // module max 1500mm
    const maxModules = Math.min(20, Math.floor(width / 300)); // module min 300mm
    return { min: minModules, max: maxModules };
  }

  /**
   * Calcule la répartition équitable des modules
   * @param {Object} config - Configuration
   * @returns {Array<{width: number, type: string}>}
   */
  static calculateEquitableDistribution(config) {
    const { width, modulesCount, type, porteIndex, porte } = config;
    const hasPorte = type === "porte";
    let availableWidth = width;
    let porteModuleWidth = 0;

    // CORRECTION: Pour la largeur du module porte, utiliser la largeur de porte + marges
    // Cette méthode ne peut pas calculer les dimensions d'ouverture pour éviter la dépendance circulaire
    // La largeur du module porte sera recalculée dans updateModulesStructure()
    if (hasPorte) {
      porteModuleWidth = (porte?.porteWidth || 730) + 102 + 10; // approximation
      availableWidth -= porteModuleWidth;
    }

    // Calculer largeur standard pour modules libres
    const freeModules = hasPorte ? modulesCount - 1 : modulesCount;
    const standardWidth =
      freeModules > 0 ? Math.floor(availableWidth / freeModules) : 0;

    // Générer la répartition
    const modules = [];
    for (let i = 0; i < modulesCount; i++) {
      if (hasPorte && i + 1 === porteIndex) {
        modules.push({ width: porteModuleWidth, type: "porte" });
      } else {
        modules.push({ width: standardWidth, type: "fixe" });
      }
    }

    return modules;
  }

  /**
   * Valide qu'une largeur de module est dans les bornes
   * @param {number} width - Largeur à valider
   * @returns {{valid: boolean, corrected: number, message?: string}}
   */
  static validateModuleWidth(width) {
    const min = 200;
    const max = 2000;

    if (width < min) {
      return {
        valid: false,
        corrected: min,
        message: `Largeur minimum: ${min}mm`,
      };
    }
    if (width > max) {
      return {
        valid: false,
        corrected: max,
        message: `Largeur maximum: ${max}mm`,
      };
    }
    return { valid: true, corrected: width };
  }

  /**
   * Calcule la largeur totale des modules
   * @param {Array} modules - Liste des modules
   * @returns {number}
   */
  static getTotalModulesWidth(modules) {
    return modules.reduce((sum, module) => sum + (module.width || 0), 0);
  }
}

// ===== js/calculations/PorteCalculator.js =====
export class PorteCalculator {
  /**
   * Calcule la hauteur imposée de la porte (sans imposte)
   * @param {Object} config - Configuration
   * @returns {number}
   */
  static calculateImposedPorteHeight(config) {
    const { height, porte } = config;
    const withDormant =
      porte?.withDormant === true || porte?.withDormant === "true";
    return height - 15 - (withDormant ? 51 : 0);
  }

  /**
   * Calcule la hauteur maximum de porte (avec imposte)
   * @param {Object} config - Configuration
   * @returns {number}
   */
  static calculateMaxPorteHeight(config) {
    return config.height - 250 - 51 - 15; // hauteur - imposte min - dormant - jeu
  }

  /**
   * Détermine si la hauteur de porte doit être verrouillée
   * @param {Object} config - Configuration
   * @returns {boolean}
   */
  static isPorteHeightLocked(config) {
    return (
      config.porte?.withImposte === false ||
      config.porte?.withImposte === "false"
    );
  }

  /**
   * Calcule les dimensions d'ouverture
   * @param {Object} config - Configuration
   * @returns {{hauteur: number, largeur: number, hasOuverture: boolean}}
   */
  static calculateDimensionsOuverture(config) {
    if (config.type !== "porte") {
      return { hauteur: 0, largeur: 0, hasOuverture: false };
    }

    const { porte, height } = config;
    let hauteur, largeur;

    // Calcul hauteur
    if (porte?.withImposte === true || porte?.withImposte === "true") {
      hauteur = (porte?.porteHeight || 0) + 15 + 51;
    } else {
      hauteur = height || 0;
    }

    // Calcul largeur
    const porteWidth = porte?.porteWidth || 0;
    const charniere = porte?.charniereType || "visible";
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";
    const tierceWidth = porte?.tierceWidth || 0;

    const charniereOffset = charniere === "invisible" ? 6 : 10;
    const baseWidth = porteWidth + 102 + charniereOffset;

    if (withTierce) {
      largeur = baseWidth + tierceWidth + 5;
    } else {
      largeur = baseWidth;
    }

    return { hauteur, largeur, hasOuverture: true };
  }

  /**
   * Valide la configuration porte
   * @param {Object} porte - Configuration porte
   * @returns {Object} Configuration corrigée
   */
  static validatePorteConfig(porte) {
    const validated = { ...porte };

    // Largeurs avec bornes
    validated.porteWidth = Math.max(
      400,
      Math.min(1230, validated.porteWidth || 730)
    );
    validated.tierceWidth = Math.max(
      300,
      Math.min(1230, validated.tierceWidth || 350)
    );
    validated.porteHeight = Math.max(
      500,
      Math.min(4000, validated.porteHeight || 2200)
    );

    // Valeurs par défaut
    validated.charniereType = validated.charniereType || "visible";
    validated.sensOuverture = validated.sensOuverture || "droit";
    validated.serrure = validated.serrure || "SERROULM";
    validated.profile = validated.profile || "po66";
    validated.colorBequille = validated.colorBequille || "noir";
    validated.colorPvitrage = validated.colorPvitrage || "noir";
    validated.traverseType = validated.traverseType || "28";

    return validated;
  }
}

// ===== js/calculations/TraversesCalculator.js =====
export class TraversesCalculator {
  /**
   * Valide la position d'une traverse sur verrière
   * @param {number} height - Hauteur traverse
   * @param {number} maxHeight - Hauteur verrière
   * @returns {{valid: boolean, message?: string}}
   */
  static validateTraversePosition(height, maxHeight) {
    const min = 240;
    const max = maxHeight - 240;

    if (height < min) {
      return { valid: false, message: `Position minimum: ${min}mm` };
    }
    if (height > max) {
      return { valid: false, message: `Position maximum: ${max}mm` };
    }
    return { valid: true };
  }

  /**
   * Valide la position d'une traverse sur porte
   * @param {number} height - Hauteur traverse
   * @param {number} porteHeight - Hauteur porte
   * @returns {{valid: boolean, message?: string}}
   */
  static validateTraversePortePosition(height, porteHeight) {
    const min = 200;
    const max = porteHeight - 240;

    if (height < min) {
      return { valid: false, message: `Position minimum: ${min}mm` };
    }
    if (height > max) {
      return { valid: false, message: `Position maximum: ${max}mm` };
    }
    return { valid: true };
  }

  /**
   * Vérifie s'il y a conflit entre traverses
   * @param {Array} traverses - Liste des traverses
   * @param {number} newHeight - Nouvelle hauteur à tester
   * @param {Array} newModules - Modules concernés
   * @returns {{conflict: boolean, message?: string}}
   */
  static checkTraverseConflict(traverses, newHeight, newModules) {
    for (const traverse of traverses) {
      if (traverse.height === newHeight) {
        // Vérifier si modules se chevauchent
        const overlap = traverse.modules.some((m) => newModules.includes(m));
        if (overlap) {
          return {
            conflict: true,
            message: `Conflit avec traverse existante à ${newHeight}mm`,
          };
        }
      }
    }
    return { conflict: false };
  }
}

// ===== js/core/ValidationRules.js =====
export class ValidationRules {
  /**
   * Règles de validation pour les dimensions principales
   */
  static dimensions = {
    width: { min: 400, max: 5000, step: 1 },
    height: { min: 400, max: 5000, step: 1 },
  };

  /**
   * Règles de validation pour la porte
   */
  static porte = {
    porteWidth: { min: 400, max: 1230, step: 1 },
    tierceWidth: { min: 300, max: 1230, step: 1 },
    porteHeight: { min: 500, max: 4000, step: 1 },
  };

  /**
   * Valide une valeur selon une règle
   * @param {*} value - Valeur à valider
   * @param {Object} rule - Règle de validation
   * @returns {{valid: boolean, corrected: *, message?: string}}
   */
  static validateValue(value, rule) {
    if (typeof value !== "number" || isNaN(value)) {
      return {
        valid: false,
        corrected: rule.min,
        message: `Valeur numérique requise`,
      };
    }

    if (value < rule.min) {
      return {
        valid: false,
        corrected: rule.min,
        message: `Minimum: ${rule.min}`,
      };
    }

    if (value > rule.max) {
      return {
        valid: false,
        corrected: rule.max,
        message: `Maximum: ${rule.max}`,
      };
    }

    return { valid: true, corrected: value };
  }

  /**
   * Valide une configuration complète
   * @param {Object} config - Configuration à valider
   * @returns {{valid: boolean, errors: Array}}
   */
  static validateConfig(config) {
    const errors = [];

    // Validation dimensions
    const widthValidation = this.validateValue(
      config.width,
      this.dimensions.width
    );
    if (!widthValidation.valid) {
      errors.push({ field: "width", message: widthValidation.message });
    }

    const heightValidation = this.validateValue(
      config.height,
      this.dimensions.height
    );
    if (!heightValidation.valid) {
      errors.push({ field: "height", message: heightValidation.message });
    }

    // Validation porte si applicable
    if (config.type === "porte" && config.porte) {
      const porteWidthValidation = this.validateValue(
        config.porte.porteWidth,
        this.porte.porteWidth
      );
      if (!porteWidthValidation.valid) {
        errors.push({
          field: "porte.porteWidth",
          message: porteWidthValidation.message,
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
