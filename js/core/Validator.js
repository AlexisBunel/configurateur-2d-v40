import { DIMENSIONS, PORTE, PROFILES } from "../constants.js";

/**
 * Gestionnaire de validation avec correction automatique
 */
export class Validator {
  /**
   * Valide une configuration complète
   */
  static validate(config) {
    const errors = [];
    const warnings = [];
    let corrected = { ...config };

    // Validation dimensions principales
    const dimensionResult = this.validateDimensions(corrected);
    errors.push(...dimensionResult.errors);
    warnings.push(...dimensionResult.warnings);
    corrected = dimensionResult.corrected;

    // Validation modules
    const moduleResult = this.validateModules(corrected);
    errors.push(...moduleResult.errors);
    warnings.push(...moduleResult.warnings);
    corrected = moduleResult.corrected;

    // Validation porte (si applicable)
    if (corrected.type === "porte") {
      const porteResult = this.validatePorte(corrected);
      errors.push(...porteResult.errors);
      warnings.push(...porteResult.warnings);
      corrected = porteResult.corrected;
    }

    // Validation traverses
    const traverseResult = this.validateTraverses(corrected);
    errors.push(...traverseResult.errors);
    warnings.push(...traverseResult.warnings);
    corrected = traverseResult.corrected;

    return {
      isValid: errors.length === 0,
      errors: errors.filter(Boolean),
      warnings: warnings.filter(Boolean),
      corrected,
    };
  }

  /**
   * Valide les dimensions principales
   */
  static validateDimensions(config) {
    const errors = [];
    const warnings = [];
    const corrected = { ...config };

    // Largeur
    if (config.width < DIMENSIONS.MIN_WIDTH) {
      errors.push(`Largeur minimum: ${DIMENSIONS.MIN_WIDTH}mm`);
      corrected.width = DIMENSIONS.MIN_WIDTH;
    } else if (config.width > DIMENSIONS.MAX_WIDTH) {
      errors.push(`Largeur maximum: ${DIMENSIONS.MAX_WIDTH}mm`);
      corrected.width = DIMENSIONS.MAX_WIDTH;
    }

    // Hauteur
    if (config.height < DIMENSIONS.MIN_HEIGHT) {
      errors.push(`Hauteur minimum: ${DIMENSIONS.MIN_HEIGHT}mm`);
      corrected.height = DIMENSIONS.MIN_HEIGHT;
    } else if (config.height > DIMENSIONS.MAX_HEIGHT) {
      errors.push(`Hauteur maximum: ${DIMENSIONS.MAX_HEIGHT}mm`);
      corrected.height = DIMENSIONS.MAX_HEIGHT;
    }

    // Ratio largeur/hauteur
    const ratio = corrected.width / corrected.height;
    if (ratio > 5) {
      warnings.push(`Ratio largeur/hauteur très élevé: ${ratio.toFixed(1)}`);
    } else if (ratio < 0.2) {
      warnings.push(`Ratio largeur/hauteur très faible: ${ratio.toFixed(1)}`);
    }

    return { errors, warnings, corrected };
  }

  /**
   * Valide le nombre et dimensions des modules
   */
  static validateModules(config) {
    const errors = [];
    const warnings = [];
    const corrected = { ...config };

    // Nombre de modules basé sur la largeur
    const minModules = Math.ceil(corrected.width / DIMENSIONS.MAX_MODULE_WIDTH);
    const maxModules = Math.floor(
      corrected.width / DIMENSIONS.MIN_MODULE_WIDTH
    );

    if (corrected.modulesCount < minModules) {
      errors.push(`Minimum ${minModules} modules pour cette largeur`);
      corrected.modulesCount = minModules;
    } else if (corrected.modulesCount > maxModules) {
      errors.push(`Maximum ${maxModules} modules pour cette largeur`);
      corrected.modulesCount = maxModules;
    }

    // Index de porte valide
    if (corrected.type === "porte") {
      if (corrected.porteIndex < 1) {
        corrected.porteIndex = 1;
      } else if (corrected.porteIndex > corrected.modulesCount) {
        corrected.porteIndex = corrected.modulesCount;
      }
    }

    // Synchroniser le tableau modules
    corrected.modules = this.#syncModulesArray(corrected);

    // Valider les largeurs individuelles
    const moduleValidation = this.#validateModuleWidths(corrected);
    errors.push(...moduleValidation.errors);
    warnings.push(...moduleValidation.warnings);
    corrected.modules = moduleValidation.modules;

    return { errors, warnings, corrected };
  }

  /**
   * Valide la configuration de la porte
   */
  static validatePorte(config) {
    const errors = [];
    const warnings = [];
    const corrected = { ...config };

    if (!corrected.porte) {
      corrected.porte = { ...config.porte };
    }

    const porte = { ...corrected.porte };

    // Dimensions porte
    if (porte.porteWidth < PORTE.MIN_WIDTH) {
      errors.push(`Largeur porte minimum: ${PORTE.MIN_WIDTH}mm`);
      porte.porteWidth = PORTE.MIN_WIDTH;
    } else if (porte.porteWidth > PORTE.MAX_WIDTH) {
      errors.push(`Largeur porte maximum: ${PORTE.MAX_WIDTH}mm`);
      porte.porteWidth = PORTE.MAX_WIDTH;
    }

    if (porte.porteHeight < PORTE.MIN_HEIGHT) {
      errors.push(`Hauteur porte minimum: ${PORTE.MIN_HEIGHT}mm`);
      porte.porteHeight = PORTE.MIN_HEIGHT;
    } else if (porte.porteHeight > PORTE.MAX_HEIGHT) {
      errors.push(`Hauteur porte maximum: ${PORTE.MAX_HEIGHT}mm`);
      porte.porteHeight = PORTE.MAX_HEIGHT;
    }

    // Validation tierce
    if (porte.withTierce) {
      if (porte.tierceWidth < DIMENSIONS.MIN_TIERCE_WIDTH) {
        errors.push(`Largeur tierce minimum: ${DIMENSIONS.MIN_TIERCE_WIDTH}mm`);
        porte.tierceWidth = DIMENSIONS.MIN_TIERCE_WIDTH;
      } else if (porte.tierceWidth > PORTE.MAX_WIDTH) {
        errors.push(`Largeur tierce maximum: ${PORTE.MAX_WIDTH}mm`);
        porte.tierceWidth = PORTE.MAX_WIDTH;
      }
    }

    // Validation imposte vs dormant
    if (porte.withImposte && porte.withDormant) {
      warnings.push("Imposte et dormant haut incompatibles");
      porte.withDormant = false;
    }

    // Validation hauteur avec imposte
    if (porte.withImposte) {
      const maxPorteHeight =
        corrected.height -
        PORTE.MIN_IMPOSTE_HEIGHT -
        PROFILES.DORMANT_HEIGHT -
        PROFILES.JEU;
      if (porte.porteHeight > maxPorteHeight) {
        errors.push(`Hauteur porte maximum avec imposte: ${maxPorteHeight}mm`);
        porte.porteHeight = maxPorteHeight;
      }
    }

    // Validation cohérence avec module
    const moduleValidation = this.#validatePorteInModule(corrected, porte);
    errors.push(...moduleValidation.errors);
    warnings.push(...moduleValidation.warnings);

    corrected.porte = porte;
    return { errors, warnings, corrected };
  }

  /**
   * Valide les traverses
   */
  static validateTraverses(config) {
    const errors = [];
    const warnings = [];
    const corrected = { ...config };

    // Traverses principales
    if (corrected.traverses) {
      corrected.traverses = corrected.traverses
        .filter((traverse) => {
          if (
            traverse.height < 100 ||
            traverse.height > corrected.height - 100
          ) {
            warnings.push(
              `Traverse à ${traverse.height}mm supprimée (position invalide)`
            );
            return false;
          }
          return true;
        })
        .sort((a, b) => a.height - b.height);

      // Vérifier les doublons
      const uniqueHeights = new Set();
      corrected.traverses = corrected.traverses.filter((traverse) => {
        if (uniqueHeights.has(traverse.height)) {
          warnings.push(`Traverse dupliquée à ${traverse.height}mm supprimée`);
          return false;
        }
        uniqueHeights.add(traverse.height);
        return true;
      });
    }

    // Traverses porte
    if (corrected.traversesPorte && corrected.type === "porte") {
      const maxPorteHeight = corrected.porte?.porteHeight || 2200;

      corrected.traversesPorte = corrected.traversesPorte
        .filter((traverse) => {
          if (traverse.height < 100 || traverse.height > maxPorteHeight - 100) {
            warnings.push(
              `Traverse porte à ${traverse.height}mm supprimée (position invalide)`
            );
            return false;
          }
          return true;
        })
        .sort((a, b) => a.height - b.height);
    }

    return { errors, warnings, corrected };
  }

  // ============================================
  // MÉTHODES PRIVÉES
  // ============================================

  /**
   * Synchronise le tableau des modules avec le nombre de modules
   */
  static #syncModulesArray(config) {
    const { width, modulesCount } = config;
    const modules = [...(config.modules || [])];

    // Calculer largeur par défaut
    const profilesWidth = (modulesCount + 1) * PROFILES.SEPARATOR_WIDTH;
    const availableWidth = width - profilesWidth;
    const defaultWidth = Math.floor(availableWidth / modulesCount);

    // Ajuster la taille du tableau
    while (modules.length < modulesCount) {
      modules.push({ width: defaultWidth });
    }
    while (modules.length > modulesCount) {
      modules.pop();
    }

    return modules;
  }

  /**
   * Valide les largeurs individuelles des modules
   */
  static #validateModuleWidths(config) {
    const errors = [];
    const warnings = [];
    const modules = [...config.modules];

    const profilesWidth = (config.modulesCount + 1) * PROFILES.SEPARATOR_WIDTH;
    const availableWidth = config.width - profilesWidth;

    // Vérifier chaque module
    modules.forEach((module, index) => {
      if (module.width < DIMENSIONS.MIN_MODULE_WIDTH) {
        errors.push(
          `Module ${index + 1}: largeur minimum ${
            DIMENSIONS.MIN_MODULE_WIDTH
          }mm`
        );
        module.width = DIMENSIONS.MIN_MODULE_WIDTH;
      } else if (module.width > DIMENSIONS.MAX_MODULE_WIDTH) {
        errors.push(
          `Module ${index + 1}: largeur maximum ${
            DIMENSIONS.MAX_MODULE_WIDTH
          }mm`
        );
        module.width = DIMENSIONS.MAX_MODULE_WIDTH;
      }
    });

    // Vérifier la somme totale
    const totalModulesWidth = modules.reduce(
      (sum, module) => sum + module.width,
      0
    );
    const difference = Math.abs(totalModulesWidth - availableWidth);

    if (difference > 50) {
      // Tolérance de 50mm
      warnings.push(
        `Largeur totale modules (${totalModulesWidth}mm) différente de l'espace disponible (${availableWidth}mm)`
      );

      // Redistribution automatique si l'écart est trop important
      if (difference > 200) {
        const defaultWidth = Math.floor(availableWidth / config.modulesCount);
        modules.forEach((module) => {
          module.width = defaultWidth;
        });
      }
    }

    return { errors, warnings, modules };
  }

  /**
   * Valide que la porte peut tenir dans son module
   */
  static #validatePorteInModule(config, porte) {
    const errors = [];
    const warnings = [];

    if (config.modulesCount === 1) {
      // Module unique : calculs automatiques
      return { errors, warnings };
    }

    const moduleIndex = config.porteIndex - 1;
    const module = config.modules?.[moduleIndex];

    if (!module) {
      errors.push(`Module ${config.porteIndex} introuvable pour la porte`);
      return { errors, warnings };
    }

    // Calculer l'espace nécessaire pour la porte
    let requiredWidth = porte.porteWidth;

    // Ajouter charnières
    const charniereWidth = porte.charniereType === "visible" ? 10 : 6;
    requiredWidth += charniereWidth;

    // Ajouter tierce
    if (porte.withTierce) {
      requiredWidth += 5 + porte.tierceWidth;
    }

    if (requiredWidth > module.width) {
      errors.push(
        `Porte trop large pour le module ${config.porteIndex} (${requiredWidth}mm > ${module.width}mm)`
      );
    }

    return { errors, warnings };
  }
}
