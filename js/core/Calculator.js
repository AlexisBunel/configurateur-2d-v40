import { PROFILES, CHARNIERE, DIMENSIONS, PORTE } from "../constants.js";

/**
 * Calculateur pour toutes les opérations métier
 * Remplace les calculs éparpillés dans main.js et references_db.js
 */
export class Calculator {
  // ============================================
  // CALCULS DE DIMENSIONS
  // ============================================

  /**
   * Calcule les dimensions d'ouverture pour une porte
   */
  static calculateDimensionsOuverture(config) {
    if (config.type !== "porte") {
      return { hauteur: 0, largeur: 0, hasOuverture: false };
    }

    const { porte } = config;

    // Calcul hauteur
    let hauteur;
    if (porte.withImposte) {
      hauteur = porte.porteHeight + PROFILES.JEU + PROFILES.DORMANT_HEIGHT;
    } else {
      hauteur = config.height;
    }

    // Calcul largeur
    const largeur = this.#calculatePorteWidth(porte);

    return {
      hauteur,
      largeur,
      hasOuverture: true,
    };
  }

  /**
   * Calcule la largeur totale occupée par une porte
   */
  static calculatePorteModuleWidth(config) {
    if (!config.porte) return 0;

    return this.#calculatePorteWidth(config.porte);
  }

  /**
   * Distribue les largeurs de modules
   */
  static distributeModuleWidths(config) {
    const { width, modulesCount, type, porteIndex } = config;

    // Calculer l'espace disponible
    const profilesWidth = this.#calculateProfilesWidth(config);
    const availableWidth = width - profilesWidth;

    if (type !== "porte") {
      return this.#distributeEqually(availableWidth, modulesCount);
    }

    return this.#distributeWithPorte(config, availableWidth);
  }

  /**
   * Calcule les contraintes pour une porte en module unique
   */
  static calculateSingleModulePorteConstraints(config) {
    if (config.modulesCount !== 1 || config.type !== "porte") {
      return null;
    }

    const { width, porte } = config;
    const charniereType = porte?.charniereType || "visible";

    if (!porte?.withTierce) {
      // Porte simple : largeur imposée
      const charniereWidth = CHARNIERE[charniereType.toUpperCase()];
      const porteWidth = width - 2 * PROFILES.CADRE_WIDTH - charniereWidth;

      return {
        type: "simple",
        porteWidth,
        tierceWidth: 0,
        isLocked: true,
      };
    }

    // Porte avec tierce : calcul des limites
    const charniereWidth =
      charniereType === "visible"
        ? CHARNIERE.TIERCE_VISIBLE
        : CHARNIERE.TIERCE_INVISIBLE;

    const availableWidth = width - 2 * PROFILES.CADRE_WIDTH - charniereWidth;
    const minPorteWidth = Math.ceil(availableWidth / 2);
    const maxPorteWidth = availableWidth - DIMENSIONS.MIN_TIERCE_WIDTH;

    const currentPorteWidth = porte?.porteWidth || 730;
    const adjustedPorteWidth = Math.max(
      minPorteWidth,
      Math.min(maxPorteWidth, currentPorteWidth)
    );

    return {
      type: "withTierce",
      porteWidth: adjustedPorteWidth,
      tierceWidth: availableWidth - adjustedPorteWidth,
      isLocked: false,
      constraints: {
        min: minPorteWidth,
        max: maxPorteWidth,
        available: availableWidth,
      },
    };
  }

  // ============================================
  // CALCULS DE PROFILS
  // ============================================

  /**
   * Calcule tous les profils nécessaires
   */
  static calculateProfiles(config) {
    const profiles = [];

    // Profils de cadre
    profiles.push(...this.#calculateCadreProfiles(config));

    // Profils intermédiaires (entre modules)
    profiles.push(...this.#calculateIntermediateProfiles(config));

    // Profils de traverses
    profiles.push(...this.#calculateTraverseProfiles(config));

    return profiles;
  }

  // ============================================
  // MÉTHODES PRIVÉES
  // ============================================

  /**
   * Calcule la largeur totale d'une porte
   */
  static #calculatePorteWidth(porte) {
    let width = porte.porteWidth || 730;

    // Ajouter charnières
    const charniereWidth =
      porte.charniereType === "invisible"
        ? CHARNIERE.INVISIBLE
        : CHARNIERE.VISIBLE;

    width += charniereWidth;

    // Ajouter tierce si présente
    if (porte.withTierce) {
      width += 5 + (porte.tierceWidth || 350);
    }

    return width;
  }

  /**
   * Calcule la largeur totale des profils
   */
  static #calculateProfilesWidth(config) {
    const { modulesCount, type } = config;

    // Profils entre modules
    let profilesWidth = (modulesCount + 1) * PROFILES.SEPARATOR_WIDTH;

    // Profil supplémentaire pour porte
    if (type === "porte") {
      profilesWidth += 22; // Profil spécial porte
    }

    return profilesWidth;
  }

  /**
   * Distribution équitable des largeurs
   */
  static #distributeEqually(availableWidth, count) {
    const moduleWidth = Math.floor(availableWidth / count);
    return Array(count).fill(moduleWidth);
  }

  /**
   * Distribution avec porte
   */
  static #distributeWithPorte(config, availableWidth) {
    const { modulesCount, porteIndex } = config;
    const porteModuleWidth = this.calculatePorteModuleWidth(config);

    // Largeur restante pour les autres modules
    const remainingWidth = availableWidth - porteModuleWidth;
    const freeModulesCount = modulesCount - 1;
    const standardModuleWidth = Math.floor(remainingWidth / freeModulesCount);

    // Répartir les largeurs
    const widths = [];
    for (let i = 1; i <= modulesCount; i++) {
      if (i === porteIndex) {
        widths.push(porteModuleWidth);
      } else {
        widths.push(standardModuleWidth);
      }
    }

    return widths;
  }

  /**
   * Calcule les profils de cadre
   */
  static #calculateCadreProfiles(config) {
    const profiles = [];
    const { width, height, type } = config;

    if (type !== "porte") {
      // Cas simple : cadre complet
      profiles.push({
        type: "vertical",
        longueur: height,
        quantite: 2,
        description: "Profil cadre vertical",
      });

      profiles.push({
        type: "horizontal",
        longueur: width - 80, // -40mm de chaque côté
        quantite: 2,
        description: "Profil cadre horizontal",
      });
    } else {
      // Cas avec porte : calcul complexe
      profiles.push(...this.#calculateCadreWithPorte(config));
    }

    return profiles;
  }

  /**
   * Calcule les profils de cadre avec porte
   */
  static #calculateCadreWithPorte(config) {
    const { width, height, porteIndex, modulesCount } = config;
    const dimensionsOuverture = this.calculateDimensionsOuverture(config);
    const profiles = [];

    // Profils verticaux
    let quantiteVerticale = 2;
    if (porteIndex === 1 || porteIndex === modulesCount) {
      quantiteVerticale = 1; // Porte sur un côté
    }

    if (quantiteVerticale > 0) {
      profiles.push({
        type: "vertical",
        longueur: height,
        quantite: quantiteVerticale,
        description: "Profil cadre vertical",
      });
    }

    // Profils horizontaux (logique complexe selon position porte)
    profiles.push(
      ...this.#calculateHorizontalProfilesWithPorte(config, dimensionsOuverture)
    );

    return profiles;
  }

  /**
   * Calcule les profils horizontaux avec porte
   */
  static #calculateHorizontalProfilesWithPorte(config, dimensionsOuverture) {
    const { width, porteIndex, modulesCount, modules, porte } = config;
    const profiles = [];

    if (!porte?.withImposte) {
      // Sans imposte
      if (porteIndex === 1) {
        // Porte à gauche
        const longueurDroite = width - dimensionsOuverture.largeur - 40;
        if (longueurDroite > 0) {
          profiles.push({
            type: "horizontal_droite",
            longueur: longueurDroite,
            quantite: 2,
            description: "Profil cadre horizontal",
          });
        }
      } else if (porteIndex === modulesCount) {
        // Porte à droite
        const longueurGauche = width - dimensionsOuverture.largeur - 40;
        if (longueurGauche > 0) {
          profiles.push({
            type: "horizontal_gauche",
            longueur: longueurGauche,
            quantite: 2,
            description: "Profil cadre horizontal",
          });
        }
      } else {
        // Porte au centre
        const { longueurGauche, longueurDroite } =
          this.#calculateCenterPorteWidths(config);

        if (longueurGauche > 0) {
          profiles.push({
            type: "horizontal_gauche",
            longueur: longueurGauche,
            quantite: 2,
            description: "Profil cadre horizontal gauche",
          });
        }

        if (longueurDroite > 0) {
          profiles.push({
            type: "horizontal_droite",
            longueur: longueurDroite,
            quantite: 2,
            description: "Profil cadre horizontal droite",
          });
        }
      }
    } else {
      // Avec imposte : logique similaire mais avec profil imposte
      profiles.push(
        ...this.#calculateImposteProfiles(config, dimensionsOuverture)
      );
    }

    return profiles;
  }

  /**
   * Calcule les largeurs gauche/droite pour porte au centre
   */
  static #calculateCenterPorteWidths(config) {
    const { width, porteIndex, modulesCount, modules } = config;

    let longueurGauche = 0;
    let longueurDroite = 0;

    // Largeur à gauche
    for (let i = 1; i < porteIndex; i++) {
      const moduleWidth = modules?.[i - 1]?.width || width / modulesCount;
      longueurGauche += moduleWidth;
    }
    longueurGauche += Math.max(0, porteIndex - 2) * PROFILES.SEPARATOR_WIDTH;

    // Largeur à droite
    for (let i = porteIndex + 1; i <= modulesCount; i++) {
      const moduleWidth = modules?.[i - 1]?.width || width / modulesCount;
      longueurDroite += moduleWidth;
    }
    longueurDroite +=
      Math.max(0, modulesCount - porteIndex - 1) * PROFILES.SEPARATOR_WIDTH;

    return { longueurGauche, longueurDroite };
  }

  /**
   * Calcule les profils avec imposte
   */
  static #calculateImposteProfiles(config, dimensionsOuverture) {
    const profiles = [];
    const { longueurGauche, longueurDroite } =
      this.#calculateCenterPorteWidths(config);

    // Profils horizontaux gauche et droite
    if (longueurGauche > 0) {
      profiles.push({
        type: "horizontal_haut_gauche",
        longueur: longueurGauche,
        quantite: 2,
        description: "Profil cadre horizontal",
      });
    }

    if (longueurDroite > 0) {
      profiles.push({
        type: "horizontal_haut_droite",
        longueur: longueurDroite,
        quantite: 2,
        description: "Profil cadre horizontal",
      });
    }

    // Profil de l'imposte
    const longueurImposte =
      dimensionsOuverture.largeur - 2 * PROFILES.CADRE_WIDTH;
    if (longueurImposte > 0) {
      profiles.push({
        type: "horizontal_imposte",
        longueur: longueurImposte,
        quantite: 1,
        description: "Profil cadre imposte",
      });
    }

    return profiles;
  }

  /**
   * Calcule les profils intermédiaires
   */
  static #calculateIntermediateProfiles(config) {
    const { height, modulesCount } = config;
    const profiles = [];

    // Profils verticaux entre modules
    const nombreProfils = modulesCount - 1;
    if (nombreProfils > 0) {
      profiles.push({
        type: "intermediate_vertical",
        longueur: height,
        quantite: nombreProfils,
        description: "Profil intermédiaire vertical",
      });
    }

    return profiles;
  }

  /**
   * Calcule les profils de traverses
   */
  static #calculateTraverseProfiles(config) {
    const profiles = [];

    // Traverses principales
    if (config.traverses?.length > 0) {
      config.traverses.forEach((traverse) => {
        const longueurTotale =
          traverse.modules?.reduce((total, moduleIndex) => {
            const module = config.modules?.[moduleIndex - 1];
            return total + (module?.width || 0);
          }, 0) || config.width;

        profiles.push({
          type: "traverse_principale",
          longueur: longueurTotale,
          quantite: 1,
          description: `Traverse ${traverse.height}mm`,
          hauteur: traverse.height,
        });
      });
    }

    // Traverses porte
    if (config.traversesPorte?.length > 0 && config.type === "porte") {
      config.traversesPorte.forEach((traverse) => {
        const longueurPorte = config.porte?.porteWidth || 730;
        let quantite = 1;

        // Si traverse sur tierce aussi
        if (traverse.onTierce && config.porte?.withTierce) {
          quantite = 2; // Une sur porte + une sur tierce
        }

        profiles.push({
          type: "traverse_porte",
          longueur: longueurPorte,
          quantite,
          description: `Traverse porte ${traverse.height}mm type ${traverse.type}`,
          hauteur: traverse.height,
        });
      });
    }

    return profiles;
  }
}
