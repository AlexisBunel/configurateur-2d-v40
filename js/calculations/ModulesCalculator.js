export class ModulesCalculator {
  static calculateModulesBounds(width) {
    const minModules = Math.max(1, Math.ceil(width / 1500));
    const maxModules = Math.min(20, Math.floor(width / 300));
    return { min: minModules, max: maxModules };
  }

  static calculateEquitableDistribution(config) {
    const { width, modulesCount, type, porteIndex, porte } = config;
    const hasPorte = type === "porte";
    let availableWidth = width;
    let porteModuleWidth = 0;

    if (hasPorte) {
      porteModuleWidth = (porte?.porteWidth || 730) + 102 + 10;
      availableWidth -= porteModuleWidth;
    }

    const freeModules = hasPorte ? modulesCount - 1 : modulesCount;
    const standardWidth =
      freeModules > 0 ? Math.floor(availableWidth / freeModules) : 0;

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
}
