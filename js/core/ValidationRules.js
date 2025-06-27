export class ValidationRules {
  static dimensions = {
    width: { min: 400, max: 5000, step: 1 },
    height: { min: 400, max: 5000, step: 1 },
  };

  static porte = {
    porteWidth: { min: 400, max: 1230, step: 1 },
    tierceWidth: { min: 300, max: 1230, step: 1 },
    porteHeight: { min: 500, max: 4000, step: 1 },
  };

  static modules = {
    width: { min: 200, max: 2000, step: 1 },
    maxCount: 20,
    minWidth: 300,
    maxWidth: 1500,
  };

  static traverses = {
    main: { minFromBottom: 240, minFromTop: 240 },
    porte: { minFromBottom: 200, minFromTop: 240 },
  };

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

  static validateConfig(config) {
    const errors = [];

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

    const typeValidation = this.validateEnum(
      config.type,
      ["pleine", "porte"],
      "pleine"
    );
    if (!typeValidation.valid) {
      errors.push({ field: "type", message: typeValidation.message });
    }

    if (config.type === "porte" && config.porte) {
      const porteErrors = this.validatePorteConfig(config.porte);
      errors.push(...porteErrors);
    }

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

  static validatePorteConfig(porte) {
    const errors = [];

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
