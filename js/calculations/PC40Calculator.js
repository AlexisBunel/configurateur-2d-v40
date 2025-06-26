import { PorteCalculator } from "./PorteCalculator.js";

export class PC40Calculator {
  /**
   * Calcule les variantes PC40 et PAC40 selon la configuration
   * @param {Object} config - Configuration complète
   * @returns {Array} Liste des variantes avec longueurs et quantités
   */
  static calculateVariantes(config) {
    const variantes = [];
    const { width, height, modulesCount, type, porteIndex, porte } = config;

    console.log("🔍 Calcul PC40 - Config:", {
      hasPorte: type === "porte",
      porteIndex,
      modulesCount,
      withImposte: porte?.withImposte,
      modules: config.modules,
    });

    // Vérification et synchronisation des modules
    this.ensureModulesSync(config);

    if (type !== "porte") {
      // ============= CAS SANS PORTE =============
      console.log("📝 Cas sans porte");
      return this.calculateSansPorte(config);
    } else {
      // ============= CAS AVEC PORTE =============
      console.log("🚪 Cas avec porte");
      return this.calculateAvecPorte(config);
    }
  }

  /**
   * Calcul pour verrière sans porte
   */
  static calculateSansPorte(config) {
    const { width, height } = config;
    const variantes = [];

    // Profils verticaux (gauche + droite)
    variantes.push({
      type: "vertical",
      longueur: height,
      quantite: 2,
      description: "Profil cadre vertical",
    });

    // Profils horizontaux (haut + bas)
    variantes.push({
      type: "horizontal",
      longueur: width - 80, // -40mm de chaque côté
      quantite: 2,
      description: "Profil cadre horizontal",
    });

    return variantes;
  }

  /**
   * Calcul pour verrière avec porte
   */
  static calculateAvecPorte(config) {
    const { width, height, modulesCount, porteIndex, porte } = config;
    const variantes = [];

    // Calculer les dimensions d'ouverture
    const dimensionsOuverture =
      PorteCalculator.calculateDimensionsOuverture(config);
    console.log("📐 Dimensions ouverture:", dimensionsOuverture);

    // ===== PROFILS VERTICAUX =====
    const quantiteVerticale = this.calculateProfilsVerticaux(
      porteIndex,
      modulesCount
    );

    if (quantiteVerticale > 0) {
      variantes.push({
        type: "vertical",
        longueur: height,
        quantite: quantiteVerticale,
        description: "Profil cadre vertical",
      });
    }

    // ===== PROFILS HORIZONTAUX =====
    const profilsHorizontaux = porte?.withImposte
      ? this.calculateProfilsHorizontauxAvecImposte(config, dimensionsOuverture)
      : this.calculateProfilsHorizontauxSansImposte(
          config,
          dimensionsOuverture
        );

    variantes.push(...profilsHorizontaux);

    console.log("✅ Variantes calculées:", variantes);
    return variantes;
  }

  /**
   * Calcule le nombre de profils verticaux nécessaires
   */
  static calculateProfilsVerticaux(porteIndex, modulesCount) {
    // Si la porte est sur un côté (premier ou dernier module), on enlève un profil vertical
    if (porteIndex === 1 || porteIndex === modulesCount) {
      console.log(`📍 Porte en position ${porteIndex}, profils verticaux: 1`);
      return 1;
    }

    // Porte au centre, on garde les 2 profils verticaux
    return 2;
  }

  /**
   * Calcule les profils horizontaux SANS imposte
   */
  static calculateProfilsHorizontauxSansImposte(config, dimensionsOuverture) {
    const { width, porteIndex, modulesCount } = config;
    const variantes = [];

    console.log("🔸 Sans imposte");

    if (porteIndex === 1) {
      // Porte à gauche : profil horizontal seulement à droite
      const longueurDroite = width - dimensionsOuverture.largeur - 40;
      console.log(`➡️ Porte à gauche, longueur droite: ${longueurDroite}mm`);

      if (longueurDroite > 0) {
        variantes.push({
          type: "horizontal_droite",
          longueur: longueurDroite,
          quantite: 2, // Haut + bas
          description: "Profil cadre horizontal droite",
        });
      }
    } else if (porteIndex === modulesCount) {
      // Porte à droite : profil horizontal seulement à gauche
      const longueurGauche = width - dimensionsOuverture.largeur - 40;
      console.log(`⬅️ Porte à droite, longueur gauche: ${longueurGauche}mm`);

      if (longueurGauche > 0) {
        variantes.push({
          type: "horizontal_gauche",
          longueur: longueurGauche,
          quantite: 2, // Haut + bas
          description: "Profil cadre horizontal gauche",
        });
      }
    } else {
      // Porte au centre : profils horizontaux des deux côtés
      console.log("🎯 Porte au centre");

      const { longueurGauche, longueurDroite } =
        this.calculateLongueursGaucheDroite(config);

      if (longueurGauche > 0) {
        variantes.push({
          type: "horizontal_gauche",
          longueur: longueurGauche,
          quantite: 2,
          description: "Profil cadre horizontal gauche",
        });
      }

      if (longueurDroite > 0) {
        variantes.push({
          type: "horizontal_droite",
          longueur: longueurDroite,
          quantite: 2,
          description: "Profil cadre horizontal droite",
        });
      }
    }

    return variantes;
  }

  /**
   * Calcule les profils horizontaux AVEC imposte
   */
  static calculateProfilsHorizontauxAvecImposte(config, dimensionsOuverture) {
    const { width, porteIndex, modulesCount } = config;
    const variantes = [];

    console.log("🔹 Avec imposte");

    let longueurGauche = 0;
    let longueurDroite = 0;
    const longueurImposte = dimensionsOuverture.largeur - 102;

    if (porteIndex === 1) {
      // Porte à gauche
      longueurDroite = width - dimensionsOuverture.largeur - 40;
    } else if (porteIndex === modulesCount) {
      // Porte à droite
      longueurGauche = width - dimensionsOuverture.largeur - 40;
    } else {
      // Porte au centre
      const longueurs = this.calculateLongueursGaucheDroite(config);
      longueurGauche = longueurs.longueurGauche;
      longueurDroite = longueurs.longueurDroite;
    }

    console.log(
      `🏗️ Imposte - Gauche: ${longueurGauche}mm, Droite: ${longueurDroite}mm, Imposte: ${longueurImposte}mm`
    );

    // Profils horizontaux gauche
    if (longueurGauche > 0) {
      variantes.push({
        type: "horizontal_haut_gauche",
        longueur: longueurGauche,
        quantite: 2, // Haut + bas
        description: "Profil cadre horizontal gauche",
      });
    }

    // Profils horizontaux droite
    if (longueurDroite > 0) {
      variantes.push({
        type: "horizontal_haut_droite",
        longueur: longueurDroite,
        quantite: 2, // Haut + bas
        description: "Profil cadre horizontal droite",
      });
    }

    // Profil de l'imposte
    if (longueurImposte > 0) {
      variantes.push({
        type: "horizontal_imposte",
        longueur: longueurImposte,
        quantite: 1,
        description: "Profil cadre imposte",
      });
    }

    return variantes;
  }

  static calculateLongueursGaucheDroite(config) {
    const { width, modulesCount, porteIndex } = config;
    let longueurGauche = 0;
    let longueurDroite = 0;

    // SÉCURITÉ : Vérifier que porteIndex est valide
    if (porteIndex < 1 || porteIndex > modulesCount) {
      console.error("❌ ERREUR: porteIndex invalide", {
        porteIndex,
        modulesCount,
      });
      return { longueurGauche: 0, longueurDroite: 0 };
    }

    // Calculer la largeur à gauche de la porte
    console.log(`🔍 Calcul gauche - porteIndex: ${porteIndex}`);
    for (let i = 1; i < porteIndex; i++) {
      const moduleIndex = i - 1;
      const moduleWidth = config.modules?.[moduleIndex]?.width;

      console.log(`📏 Module ${i} (index ${moduleIndex}): ${moduleWidth}mm`);
      longueurGauche += moduleWidth;
    }

    // Ajouter les profils entre les modules à gauche
    const profilsGauche = Math.max(0, porteIndex - 2);
    longueurGauche += profilsGauche * 40;
    console.log(
      `🔗 Profils à gauche: ${profilsGauche} × 40mm = ${profilsGauche * 40}mm`
    );
    console.log(`📊 Total gauche: ${longueurGauche}mm`);

    // Calculer la largeur à droite de la porte
    console.log(
      `🔍 Calcul droite - porteIndex: ${porteIndex}, modulesCount: ${modulesCount}`
    );

    for (let i = porteIndex + 1; i <= modulesCount; i++) {
      const moduleIndex = i - 1;
      const moduleWidth =
        config.modules?.[moduleIndex]?.width || width / modulesCount;

      console.log(`📏 Module ${i} (index ${moduleIndex}): ${moduleWidth}mm`);
      longueurDroite += moduleWidth;
    }

    // Ajouter les profils entre les modules à droite
    const profilsDroite = Math.max(0, modulesCount - porteIndex - 1);
    longueurDroite += profilsDroite * 40;
    console.log(
      `🔗 Profils à droite: ${profilsDroite} × 40mm = ${profilsDroite * 40}mm`
    );
    console.log(`📊 Total droite: ${longueurDroite}mm`);

    return { longueurGauche, longueurDroite };
  }

  /**
   * S'assure que les modules sont synchronisés avec les inputs DOM
   */
  static ensureModulesSync(config) {
    const { modulesCount } = config;

    // Initialiser le tableau modules si nécessaire
    if (!config.modules) {
      config.modules = [];
    }

    // Synchroniser avec les valeurs des inputs DOM
    for (let i = 1; i <= modulesCount; i++) {
      const input = document.getElementById(`widthModule${i}`);
      if (input && input.value) {
        const moduleIndex = i - 1;
        if (!config.modules[moduleIndex]) {
          config.modules[moduleIndex] = {};
        }
        config.modules[moduleIndex].width =
          parseInt(input.value) || config.width / modulesCount;
        console.log(
          `📝 Module ${i} synchronisé: ${config.modules[moduleIndex].width}mm`
        );
      }
    }
  }

  /**
   * Calcule la longueur totale pour un type de profil donné
   * @param {Array} variantes - Variantes calculées
   * @returns {{PC40: number, PAC40: number}} Longueurs totales en mm
   */
  static calculateTotalLengths(variantes) {
    const totalLength = variantes.reduce((sum, variante) => {
      return sum + variante.longueur * variante.quantite;
    }, 0);

    // PC40 et PAC40 ont les mêmes longueurs
    return {
      PC40: totalLength,
      PAC40: totalLength,
    };
  }

  /**
   * Formate les variantes pour affichage dans les tableaux
   * @param {Array} variantes - Variantes calculées
   * @param {string} profileRef - "PC40" ou "PAC40"
   * @returns {Array} Lignes formatées pour le tableau
   */
  static formatForTable(variantes, profileRef) {
    // Importer References pour récupérer les vraies descriptions
    import("../data/References.js").then((module) => {
      // Sera disponible de manière asynchrone, mais on va faire plus simple
    });

    const lines = [];

    variantes.forEach((variante) => {
      // Déterminer la description de base selon la référence
      let baseDescription;
      if (profileRef === "PC40") {
        baseDescription = "Profil cadre 40";
      } else if (profileRef === "PAC40") {
        baseDescription = "Parclose cadre 40";
      } else {
        baseDescription = variante.description;
      }

      // Ajouter les informations de position spécifiques
      let fullDescription = baseDescription;

      // Analyser le type pour ajouter la position
      if (variante.type) {
        switch (variante.type) {
          case "vertical":
            fullDescription += " - vertical";
            break;
          case "horizontal":
            fullDescription += " - horizontal";
            break;
          case "horizontal_droite":
            fullDescription += " - horizontal droite";
            break;
          case "horizontal_gauche":
            fullDescription += " - horizontal gauche";
            break;
          case "horizontal_haut_gauche":
            fullDescription += " - horizontal haut gauche";
            break;
          case "horizontal_haut_droite":
            fullDescription += " - horizontal haut droite";
            break;
          case "horizontal_imposte":
            fullDescription += " - horizontal imposte";
            break;
          default:
            // Garder la description originale si type non reconnu
            fullDescription = variante.description;
        }
      }

      lines.push({
        ref: profileRef,
        description: fullDescription,
        length: variante.longueur,
        quantity: variante.quantite,
        unitPrice: 0, // Prix à définir plus tard
        totalPrice: 0, // Prix à définir plus tard
        category: profileRef === "PC40" ? "structure" : "parclose",
        details: {
          type: variante.type,
          originalDescription: variante.description,
        },
      });
    });

    return lines;
  }

  /**
   * Valide la cohérence des calculs
   * @param {Object} config - Configuration
   * @param {Array} variantes - Variantes calculées
   * @returns {{valid: boolean, warnings: Array<string>}}
   */
  static validateCalculation(config, variantes) {
    const warnings = [];

    // Vérifier qu'on a au moins des profils
    if (variantes.length === 0) {
      warnings.push("Aucun profil calculé");
    }

    // Vérifier les longueurs négatives
    const negativeLength = variantes.find((v) => v.longueur <= 0);
    if (negativeLength) {
      warnings.push(
        `Longueur négative ou nulle détectée: ${negativeLength.description}`
      );
    }

    // Vérifier les quantités
    const zeroQuantity = variantes.find((v) => v.quantite <= 0);
    if (zeroQuantity) {
      warnings.push(`Quantité nulle détectée: ${zeroQuantity.description}`);
    }

    // Vérifications spécifiques porte
    if (config.type === "porte") {
      const dimensionsOuverture =
        PorteCalculator.calculateDimensionsOuverture(config);
      if (dimensionsOuverture.largeur > config.width) {
        warnings.push("L'ouverture de porte est plus large que la verrière");
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Génère un rapport de débits pour PC40/PAC40
   * @param {Object} config - Configuration
   * @returns {Object} Rapport complet
   */
  static generateReport(config) {
    const variantes = this.calculateVariantes(config);
    const validation = this.validateCalculation(config, variantes);
    const totalLengths = this.calculateTotalLengths(variantes);

    const pc40Lines = this.formatForTable(variantes, "PC40");
    const pac40Lines = this.formatForTable(variantes, "PAC40");

    return {
      config: {
        dimensions: `${config.width}×${config.height}mm`,
        type: config.type,
        modules: config.modulesCount,
        hasPorte: config.type === "porte",
      },
      variantes,
      validation,
      totalLengths,
      tableLines: {
        PC40: pc40Lines,
        PAC40: pac40Lines,
      },
      summary: {
        variantesCount: variantes.length,
        totalPC40: `${(totalLengths.PC40 / 1000).toFixed(2)}m`,
        totalPAC40: `${(totalLengths.PAC40 / 1000).toFixed(2)}m`,
        valid: validation.valid,
      },
    };
  }
}
