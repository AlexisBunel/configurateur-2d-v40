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
