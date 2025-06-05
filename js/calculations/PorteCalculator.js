export class PorteCalculator {
  /**
   * Calcule la hauteur imposée de la porte (sans imposte)
   * @param {Object} config - Configuration complète
   * @returns {number} Hauteur calculée
   */
  static calculateImposedPorteHeight(config) {
    const { height, porte } = config;
    const withDormant =
      porte?.withDormant === true || porte?.withDormant === "true";

    // Hauteur = hauteur totale - jeu bas - dormant (si applicable)
    return height - 15 - (withDormant ? 51 : 0);
  }

  /**
   * Calcule la hauteur maximum de porte (avec imposte)
   * @param {Object} config - Configuration complète
   * @returns {number} Hauteur maximum
   */
  static calculateMaxPorteHeight(config) {
    // hauteur totale - imposte minimum - dormant - jeu
    return config.height - 250 - 51 - 15;
  }

  /**
   * Détermine si la hauteur de porte doit être verrouillée (calculée automatiquement)
   * @param {Object} config - Configuration complète
   * @returns {boolean} True si verrouillée
   */
  static isPorteHeightLocked(config) {
    return (
      config.porte?.withImposte === false ||
      config.porte?.withImposte === "false" ||
      !config.porte?.withImposte
    );
  }

  /**
   * Calcule les dimensions d'ouverture de la porte
   * @param {Object} config - Configuration complète
   * @returns {{hauteur: number, largeur: number, hasOuverture: boolean}}
   */
  static calculateDimensionsOuverture(config) {
    if (config.type !== "porte") {
      return { hauteur: 0, largeur: 0, hasOuverture: false };
    }

    const { porte, height } = config;
    let hauteur, largeur;

    // ===== Calcul de la hauteur d'ouverture =====
    if (porte?.withImposte === true || porte?.withImposte === "true") {
      // Avec imposte : hauteur porte + jeu + dormant
      hauteur = (porte?.porteHeight || 0) + 15 + 51;
    } else {
      // Sans imposte : hauteur totale de la verrière
      hauteur = height || 0;
    }

    // ===== Calcul de la largeur d'ouverture =====
    const porteWidth = porte?.porteWidth || 0;
    const charniere = porte?.charniereType || "visible";
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";
    const tierceWidth = porte?.tierceWidth || 0;

    // Offset selon le type de charnière
    const charniereOffset = charniere === "invisible" ? 6 : 10;

    // Largeur de base : porte + profilés + charnière
    const baseWidth = porteWidth + 102 + charniereOffset;

    if (withTierce) {
      // Avec tierce : ajouter largeur tierce + jeu supplémentaire
      largeur = baseWidth + tierceWidth + 5;
    } else {
      // Sans tierce
      largeur = baseWidth;
    }

    return {
      hauteur: Math.round(hauteur),
      largeur: Math.round(largeur),
      hasOuverture: true,
    };
  }

  /**
   * Valide et corrige la configuration porte
   * @param {Object} porte - Configuration porte
   * @param {Object} globalConfig - Configuration globale (pour contraintes)
   * @returns {Object} Configuration porte corrigée
   */
  static validatePorteConfig(porte, globalConfig = {}) {
    const validated = { ...porte };

    // ===== Largeurs avec bornes =====
    validated.porteWidth = this.clamp(validated.porteWidth || 730, 400, 1230);
    validated.tierceWidth = this.clamp(validated.tierceWidth || 350, 300, 1230);

    // ===== Hauteur porte =====
    if (globalConfig.height && this.isPorteHeightLocked({ porte: validated })) {
      // Hauteur calculée automatiquement
      validated.porteHeight = this.calculateImposedPorteHeight({
        height: globalConfig.height,
        porte: validated,
      });
    } else {
      // Hauteur libre avec contraintes
      const maxHeight = globalConfig.height
        ? this.calculateMaxPorteHeight(globalConfig)
        : 4000;
      validated.porteHeight = this.clamp(
        validated.porteHeight || 2200,
        500,
        maxHeight
      );
    }

    // ===== Valeurs par défaut pour énumérations =====
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

    // ===== Valeurs booléennes =====
    validated.withTierce = this.validateBoolean(validated.withTierce, false);
    validated.withImposte = this.validateBoolean(validated.withImposte, false);
    validated.withDormant = this.validateBoolean(validated.withDormant, false);

    return validated;
  }

  /**
   * Calcule les contraintes d'emplacement pour la porte dans les modules
   * @param {Object} config - Configuration complète
   * @returns {{validPositions: Array<number>, recommended: number}}
   */
  static calculateValidPortePositions(config) {
    const { modulesCount, width, porte } = config;
    const porteWidth = porte?.porteWidth || 730;

    // Largeur moyenne par module
    const avgModuleWidth = width / modulesCount;

    // Positions valides (tous les modules pour l'instant)
    const validPositions = Array.from(
      { length: modulesCount },
      (_, i) => i + 1
    );

    // Position recommandée (centre ou proche du centre)
    const centerPosition = Math.ceil(modulesCount / 2);
    const recommended = Math.min(centerPosition, modulesCount);

    return { validPositions, recommended };
  }

  /**
   * Calcule l'impact de la porte sur la répartition des modules
   * @param {Object} config - Configuration complète
   * @returns {{porteModuleWidth: number, freeModulesWidth: number, freeModulesCount: number}}
   */
  static calculatePorteImpactOnModules(config) {
    const { width, modulesCount, porteIndex, porte } = config;
    const porteModuleWidth = porte?.porteWidth || 730;

    // Largeur disponible pour les modules libres
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

  /**
   * Valide la compatibilité entre les options de porte
   * @param {Object} porte - Configuration porte
   * @returns {{compatible: boolean, warnings: Array<string>}}
   */
  static validatePorteCompatibility(porte) {
    const warnings = [];

    // Imposte ET dormant = conflit
    if (porte.withImposte && porte.withDormant) {
      warnings.push(
        "Imposte et dormant haut sont incompatibles - dormant ignoré"
      );
    }

    // Tierce très large par rapport à la porte
    if (porte.withTierce && porte.tierceWidth > porte.porteWidth) {
      warnings.push(
        "Tierce plus large que la porte - vérifiez les proportions"
      );
    }

    // Serrure avancée avec porte étroite
    if (porte.porteWidth < 600 && porte.serrure !== "SERROULM") {
      warnings.push(
        "Serrure complexe sur porte étroite - vérifiez la faisabilité"
      );
    }

    return {
      compatible: warnings.length === 0,
      warnings,
    };
  }

  // ===== Utilitaires =====

  /**
   * Contraint une valeur numérique dans des bornes
   */
  static clamp(value, min, max) {
    if (typeof value !== "number" || isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Valide une valeur booléenne
   */
  static validateBoolean(value, defaultValue = false) {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return defaultValue;
  }

  /**
   * Formate les dimensions pour l'affichage
   * @param {{hauteur: number, largeur: number}} dimensions
   * @returns {string}
   */
  static formatDimensions(dimensions) {
    return `${dimensions.hauteur}mm × ${dimensions.largeur}mm`;
  }

  /**
   * Calcule le coefficient d'ouverture (pour débattement)
   * @param {Object} config - Configuration porte
   * @returns {number} Angle d'ouverture en degrés
   */
  static calculateAngleOuverture(config) {
    // Angle standard de 90° pour une porte industrielle
    return 90;
  }
}
