export class PorteCalculator {
  static calculateImposedPorteHeight(config) {
    const { height, porte } = config;
    const withDormant =
      porte?.withDormant === true || porte?.withDormant === "true";

    return height - 15 - (withDormant ? 51 : 0);
  }

  static calculateMaxPorteHeight(config) {
    return config.height - 250 - 51 - 15;
  }

  static isPorteHeightLocked(config) {
    return (
      config.porte?.withImposte === false ||
      config.porte?.withImposte === "false" ||
      !config.porte?.withImposte
    );
  }

  static calculateDimensionsOuverture(config) {
    if (config.type !== "porte") {
      return { hauteur: 0, largeur: 0, hasOuverture: false };
    }

    const { porte, height } = config;

    const hauteur = porte?.withImposte
      ? (porte?.porteHeight || 0) + 15 + 51
      : height || 0;

    const porteWidth = porte?.porteWidth || 0;
    const charniereOffset = porte?.charniereType === "invisible" ? 6 : 10;
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";

    let largeur = porteWidth + 102 + charniereOffset;

    if (withTierce) {
      largeur += (porte?.tierceWidth || 0) + 5;
    }

    return {
      hauteur: Math.round(hauteur),
      largeur: Math.round(largeur),
      hasOuverture: true,
    };
  }

  static validatePorteConfig(porte, globalConfig = {}) {
    const validated = { ...porte };

    validated.porteWidth = this.clamp(validated.porteWidth || 730, 400, 1230);
    validated.tierceWidth = this.clamp(validated.tierceWidth || 350, 300, 1230);

    if (globalConfig.height && this.isPorteHeightLocked({ porte: validated })) {
      validated.porteHeight = this.calculateImposedPorteHeight({
        height: globalConfig.height,
        porte: validated,
      });
    } else {
      const maxHeight = globalConfig.height
        ? this.calculateMaxPorteHeight(globalConfig)
        : 4000;
      validated.porteHeight = this.clamp(
        validated.porteHeight || 2200,
        500,
        maxHeight
      );
    }

    const validCharnieres = ["visible", "invisible"];
    if (!validCharnieres.includes(validated.charniereType)) {
      validated.charniereType = "visible";
    }

    const validSens = ["droit", "gauche"];
    if (!validSens.includes(validated.sensOuverture)) {
      validated.sensOuverture = "droit";
    }

    const validSerrures = ["SERROULM", "SERROULPENM", "SERPEN35M"];
    if (!validSerrures.includes(validated.serrure)) {
      validated.serrure = "SERROULM";
    }

    const validProfiles = ["po66", "po6622u"];
    if (!validProfiles.includes(validated.profile)) {
      validated.profile = "po66";
    }

    const validCouleursBequille = ["noir", "inox"];
    if (!validCouleursBequille.includes(validated.colorBequille)) {
      validated.colorBequille = "noir";
    }

    const validCouleursJoint = ["noir", "transp", "blanc"];
    if (!validCouleursJoint.includes(validated.colorPvitrage)) {
      validated.colorPvitrage = "noir";
    }

    const validTraverseTypes = ["28", "37"];
    if (!validTraverseTypes.includes(validated.traverseType)) {
      validated.traverseType = "28";
    }

    validated.withTierce = this.validateBoolean(validated.withTierce, false);
    validated.withImposte = this.validateBoolean(validated.withImposte, false);
    validated.withDormant = this.validateBoolean(validated.withDormant, false);

    return validated;
  }

  static calculateValidPortePositions(config) {
    const { modulesCount, width, porte } = config;
    const porteWidth = porte?.porteWidth || 730;

    const avgModuleWidth = width / modulesCount;

    const validPositions = Array.from(
      { length: modulesCount },
      (_, i) => i + 1
    );

    const centerPosition = Math.ceil(modulesCount / 2);
    const recommended = Math.min(centerPosition, modulesCount);

    return { validPositions, recommended };
  }

  static calculatePorteImpactOnModules(config) {
    const { width, modulesCount, porteIndex, porte } = config;
    const porteModuleWidth = porte?.porteWidth || 730;

    const freeModulesWidth = width - porteModuleWidth;
    const freeModulesCount = modulesCount - 1;

    return {
      porteModuleWidth,
      freeModulesWidth,
      freeModulesCount,
      avgFreeModuleWidth:
        freeModulesCount > 0
          ? Math.floor(freeModulesWidth / freeModulesCount)
          : 0,
    };
  }

  static validatePorteCompatibility(porte) {
    const warnings = [];

    if (porte.withImposte && porte.withDormant) {
      warnings.push("Imposte et dormant haut sont incompatibles");
    }

    if (porte.withTierce && porte.tierceWidth > porte.porteWidth) {
      warnings.push("Tierce plus large que la porte");
    }

    if (porte.porteWidth < 600 && porte.serrure !== "SERROULM") {
      warnings.push("Serrure complexe sur porte étroite");
    }

    return {
      compatible: warnings.length === 0,
      warnings,
    };
  }

  static clamp(value, min, max) {
    if (typeof value !== "number" || isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  static validateBoolean(value, defaultValue = false) {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return defaultValue;
  }
}
