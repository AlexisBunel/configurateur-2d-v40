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
   * Règles de validation pour les modules
   */
  static modules = {
    width: { min: 200, max: 2000, step: 1 },
    maxCount: 20,
    minWidth: 300, // largeur min pour calculer max modules
    maxWidth: 1500, // largeur max pour calculer min modules
  };

  /**
   * Règles de validation pour les traverses
   */
  static traverses = {
    main: { minFromBottom: 240, minFromTop: 240 },
    porte: { minFromBottom: 200, minFromTop: 240 },
  };

  /**
   * Valeurs autorisées pour les énumérations
   */
  static enums = {
    charniereType: ["visible", "invisible"],
    sensOuverture: ["droit", "gauche"],
    serrure: ["SERROULM", "SERROULPENM", "SERPEN35M"],
    profile: ["po66", "po6622u"],
    colorProfile: ["noir", "gris", "blanc"],
    colorBequille: ["noir", "inox"],
    colorJoint: ["noir", "transp", "blanc"],
    remplissageEp: [6, 8],
    traverseType: ["28", "37"],
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
   * Valide une valeur d'énumération
   * @param {*} value - Valeur à valider
   * @param {Array} allowedValues - Valeurs autorisées
   * @param {*} defaultValue - Valeur par défaut
   * @returns {{valid: boolean, corrected: *, message?: string}}
   */
  static validateEnum(value, allowedValues, defaultValue = null) {
    if (allowedValues.includes(value)) {
      return { valid: true, corrected: value };
    }

    const corrected = defaultValue || allowedValues[0];
    return {
      valid: false,
      corrected,
      message: `Valeur autorisée: ${allowedValues.join(", ")}`,
    };
  }

  /**
   * Valide une configuration complète
   * @param {Object} config - Configuration à valider
   * @returns {{valid: boolean, errors: Array}}
   */
  static validateConfig(config) {
    const errors = [];

    // Validation dimensions principales
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

    // Validation type
    const typeValidation = this.validateEnum(
      config.type,
      ["pleine", "porte"],
      "pleine"
    );
    if (!typeValidation.valid) {
      errors.push({ field: "type", message: typeValidation.message });
    }

    // Validation porte si applicable
    if (config.type === "porte" && config.porte) {
      const porteErrors = this.validatePorteConfig(config.porte);
      errors.push(...porteErrors);
    }

    // Validation modules
    if (
      !config.modulesCount ||
      config.modulesCount < 1 ||
      config.modulesCount > this.modules.maxCount
    ) {
      errors.push({
        field: "modulesCount",
        message: `Entre 1 et ${this.modules.maxCount} modules`,
      });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Valide spécifiquement la configuration porte
   * @param {Object} porte - Configuration porte
   * @returns {Array} Erreurs trouvées
   */
  static validatePorteConfig(porte) {
    const errors = [];

    // Largeur porte
    const porteWidthValidation = this.validateValue(
      porte.porteWidth,
      this.porte.porteWidth
    );
    if (!porteWidthValidation.valid) {
      errors.push({
        field: "porte.porteWidth",
        message: porteWidthValidation.message,
      });
    }

    // Largeur tierce si applicable
    if (porte.withTierce) {
      const tierceWidthValidation = this.validateValue(
        porte.tierceWidth,
        this.porte.tierceWidth
      );
      if (!tierceWidthValidation.valid) {
        errors.push({
          field: "porte.tierceWidth",
          message: tierceWidthValidation.message,
        });
      }
    }

    // Hauteur porte
    const porteHeightValidation = this.validateValue(
      porte.porteHeight,
      this.porte.porteHeight
    );
    if (!porteHeightValidation.valid) {
      errors.push({
        field: "porte.porteHeight",
        message: porteHeightValidation.message,
      });
    }

    // Énumérations
    const charniereValidation = this.validateEnum(
      porte.charniereType,
      this.enums.charniereType,
      "visible"
    );
    if (!charniereValidation.valid) {
      errors.push({
        field: "porte.charniereType",
        message: charniereValidation.message,
      });
    }

    const sensValidation = this.validateEnum(
      porte.sensOuverture,
      this.enums.sensOuverture,
      "droit"
    );
    if (!sensValidation.valid) {
      errors.push({
        field: "porte.sensOuverture",
        message: sensValidation.message,
      });
    }

    return errors;
  }

  /**
   * Utilitaire pour contraindre une valeur dans des bornes
   * @param {number} value - Valeur à contraindre
   * @param {number} min - Valeur minimum
   * @param {number} max - Valeur maximum
   * @returns {number} Valeur contrainte
   */
  static clamp(value, min, max) {
    if (typeof value !== "number" || isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Valide et corrige une valeur booléenne
   * @param {*} value - Valeur à valider
   * @param {boolean} defaultValue - Valeur par défaut
   * @returns {boolean}
   */
  static validateBoolean(value, defaultValue = false) {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return defaultValue;
  }

  /**
   * Messages d'aide pour les champs
   */
  static getFieldHelp(fieldPath) {
    const helpMessages = {
      width: "Largeur totale de la verrière (400-5000mm)",
      height: "Hauteur totale de la verrière (400-5000mm)",
      "porte.porteWidth": "Largeur de la porte (400-1230mm)",
      "porte.tierceWidth": "Largeur de la tierce (300-1230mm)",
      "porte.porteHeight": "Hauteur de la porte (500-4000mm)",
      modulesCount: "Nombre de modules calculé selon la largeur",
      "modules.width": "Largeur du module (200-2000mm)",
    };

    return helpMessages[fieldPath] || "";
  }
}
