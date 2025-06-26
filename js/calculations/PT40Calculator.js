export class PT40Calculator {
  /**
   * Calcule toutes les traverses PT40 et PAT40
   * @param {Object} config - Configuration complète
   * @returns {Array} Liste des traverses avec longueurs et quantités
   */
  static calculateTraverses(config) {
    const traverses = [];

    console.log("🔧 Calcul des traverses PT40/PAT40");

    // 1. TRAVERSES VERTICALES (entre modules)
    const traversesVerticales = this.calculateTraversesVerticales(config);
    traverses.push(...traversesVerticales);

    // 2. TRAVERSES HORIZONTALES (selon config.traverses)
    const traversesHorizontales = this.calculateTraversesHorizontales(config);
    traverses.push(...traversesHorizontales);

    return traverses;
  }

  /**
   * Calcule les traverses verticales (entre modules)
   */
  static calculateTraversesVerticales(config) {
    const { height, modulesCount, type, porteIndex } = config;
    const traverses = [];

    console.log("📏 Calcul traverses verticales");

    // Longueur traverse verticale = hauteur - 80mm (profils haut + bas)
    const longueurVerticale = height - 80;

    // Compter le nombre de traverses verticales nécessaires
    let nombreTraversesVerticales = 0;

    if (type === "porte") {
      if (porteIndex === 1 || porteIndex === modulesCount) {
        // Porte en position extrême (début ou fin)
        // La porte "enlève" 2 traverses (une de chaque côté du module porte)
        nombreTraversesVerticales = modulesCount - 2;
        console.log(
          `🚪 Porte en position extrême (${porteIndex}) : ${modulesCount} modules - 2 = ${nombreTraversesVerticales} traverses`
        );
      } else if (porteIndex > 1 && porteIndex < modulesCount) {
        // Porte en position centrale (1 < porteIndex < modulesCount)
        // La porte "enlève" 3 traverses (une de chaque côté + une au milieu)
        nombreTraversesVerticales = modulesCount - 3;
        console.log(
          `🚪 Porte en position centrale (${porteIndex}) : ${modulesCount} modules - 3 = ${nombreTraversesVerticales} traverses`
        );
      } else {
        // Cas d'erreur - porteIndex invalide
        console.error(
          `❌ porteIndex invalide: ${porteIndex} (doit être entre 1 et ${modulesCount})`
        );
        nombreTraversesVerticales = 0;
      }
    } else {
      // Sans porte : traverses entre tous les modules
      nombreTraversesVerticales = modulesCount - 1;
      console.log(
        `📐 Sans porte : ${modulesCount} modules - 1 = ${nombreTraversesVerticales} traverses`
      );
    }

    // S'assurer qu'on n'a pas de valeur négative
    nombreTraversesVerticales = Math.max(0, nombreTraversesVerticales);

    if (nombreTraversesVerticales > 0) {
      // PT40 - Traverses verticales
      traverses.push({
        ref: "PT40",
        description: "Traverse verticale",
        longueur: longueurVerticale,
        quantite: nombreTraversesVerticales,
        category: "structure",
        type: "traverse_verticale",
      });

      // PAT40 - Parcloses traverses verticales
      traverses.push({
        ref: "PAT40",
        description: "Parclose traverse verticale",
        longueur: longueurVerticale,
        quantite: nombreTraversesVerticales,
        category: "parclose",
        type: "traverse_verticale",
      });

      console.log(
        `✅ Ajouté: ${nombreTraversesVerticales} traverses verticales de ${longueurVerticale}mm`
      );
    } else {
      console.log(
        "⚠️ Aucune traverse verticale nécessaire avec cette configuration"
      );
    }

    return traverses;
  }

  /**
   * Calcule les traverses horizontales (selon config.traverses)
   */
  static calculateTraversesHorizontales(config) {
    const { traverses: configTraverses, modules } = config;
    const traversesCalculees = [];

    if (!configTraverses || configTraverses.length === 0) {
      console.log("📭 Aucune traverse horizontale configurée");
      return traversesCalculees;
    }

    console.log("📏 Calcul traverses horizontales");

    // Collecter toutes les longueurs de traverses avec leur fréquence
    const longueursCumulees = new Map(); // longueur -> quantité

    configTraverses.forEach((traverse, index) => {
      console.log(`\n--- Traverse ${index + 1} à ${traverse.height}mm ---`);
      console.log(`Modules concernés: ${traverse.modules.join(", ")}`);

      // Pour chaque module concerné, ajouter sa largeur
      traverse.modules.forEach((numeroModule) => {
        const moduleIndex = numeroModule - 1;
        const module = modules[moduleIndex];

        if (module) {
          const largeurModule = module.width || 0;
          console.log(`  Module ${numeroModule}: ${largeurModule}mm`);

          // Cumuler les longueurs
          const currentCount = longueursCumulees.get(largeurModule) || 0;
          longueursCumulees.set(largeurModule, currentCount + 1);
        } else {
          console.warn(
            `⚠️ Module ${numeroModule} non trouvé dans la configuration`
          );
        }
      });
    });

    console.log("\n📊 Résumé des longueurs cumulées:");
    longueursCumulees.forEach((quantite, longueur) => {
      console.log(`  ${longueur}mm → ${quantite} traverse(s)`);
    });

    // Créer les lignes de traverses groupées par longueur
    longueursCumulees.forEach((quantite, longueur) => {
      if (longueur > 0 && quantite > 0) {
        // PT40 - Traverse horizontale
        traversesCalculees.push({
          ref: "PT40",
          description: `Traverse horizontale`,
          longueur: longueur,
          quantite: quantite,
          category: "structure",
          type: "traverse_horizontale",
          details: {
            longueurs_groupees: true,
          },
        });

        // PAT40 - Parclose traverse horizontale
        traversesCalculees.push({
          ref: "PAT40",
          description: `Parclose traverse horizontale`,
          longueur: longueur,
          quantite: quantite,
          category: "parclose",
          type: "traverse_horizontale",
          details: {
            longueurs_groupees: true,
          },
        });
      }
    });

    console.log(
      `\n✅ ${traversesCalculees.length} lignes de traverses créées (PT40 + PAT40)`
    );

    return traversesCalculees;
  }

  /**
   * Groupe les modules contigus en segments
   * @param {Array<number>} modules - Liste des numéros de modules
   * @returns {Array<Array<number>>} Segments de modules contigus
   */
  static grouperModulesContigus(modules) {
    if (!modules || modules.length === 0) return [];

    const modulesTries = [...modules].sort((a, b) => a - b);
    const segments = [];
    let segmentActuel = [modulesTries[0]];

    for (let i = 1; i < modulesTries.length; i++) {
      if (modulesTries[i] === modulesTries[i - 1] + 1) {
        // Module contigu : ajouter au segment actuel
        segmentActuel.push(modulesTries[i]);
      } else {
        // Module non contigu : terminer le segment actuel et en commencer un nouveau
        segments.push(segmentActuel);
        segmentActuel = [modulesTries[i]];
      }
    }

    // Ajouter le dernier segment
    segments.push(segmentActuel);

    return segments;
  }

  /**
   * Calcule la longueur d'un segment de traverse horizontale
   * @param {Array<number>} modulesSegment - Numéros des modules du segment
   * @param {Array} modulesConfig - Configuration des modules
   * @param {Object} config - Configuration globale
   * @returns {number} Longueur du segment en mm
   */
  static calculerLongueurSegment(modulesSegment, modulesConfig, config) {
    let longueur = 0;

    modulesSegment.forEach((numeroModule) => {
      const moduleIndex = numeroModule - 1;
      const module = modulesConfig[moduleIndex];

      if (module) {
        const largeurModule = module.width || 0;
        longueur += largeurModule;
        console.log(`  Module ${numeroModule}: ${largeurModule}mm`);
      } else {
        console.warn(
          `⚠️ Module ${numeroModule} non trouvé dans la configuration`
        );
      }
    });

    return longueur;
  }

  /**
   * Valide la cohérence des traverses calculées
   * @param {Array} traverses - Traverses calculées
   * @param {Object} config - Configuration
   * @returns {{valid: boolean, warnings: Array<string>}}
   */
  static validateTraverses(traverses, config) {
    const warnings = [];

    // Vérifier les longueurs négatives
    const negativeLength = traverses.find((t) => t.longueur <= 0);
    if (negativeLength) {
      warnings.push(
        `Longueur négative ou nulle: ${negativeLength.description}`
      );
    }

    // Vérifier les quantités
    const zeroQuantity = traverses.find((t) => t.quantite <= 0);
    if (zeroQuantity) {
      warnings.push(`Quantité nulle: ${zeroQuantity.description}`);
    }

    // Vérifier cohérence PT40/PAT40
    const pt40Count = traverses.filter((t) => t.ref === "PT40").length;
    const pat40Count = traverses.filter((t) => t.ref === "PAT40").length;

    if (pt40Count !== pat40Count) {
      warnings.push("Incohérence entre PT40 et PAT40");
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Formate les traverses pour affichage dans les tableaux
   * @param {Array} traverses - Traverses calculées
   * @returns {Array} Lignes formatées pour le tableau
   */
  static formatForTable(traverses) {
    return traverses.map((traverse) => {
      // Déterminer la description de base selon la référence
      let baseDescription;
      if (traverse.ref === "PT40") {
        baseDescription = "Profil traverse 40";
      } else if (traverse.ref === "PAT40") {
        baseDescription = "Parclose traverse 40";
      } else {
        baseDescription = traverse.description;
      }

      // Ajouter les informations de position spécifiques
      let fullDescription = baseDescription;

      // Analyser le type pour ajouter la position
      if (traverse.type) {
        switch (traverse.type) {
          case "traverse_verticale":
            fullDescription += " - verticale";
            break;
          case "traverse_horizontale":
            fullDescription += " - horizontale";
            break;
          default:
            // Garder la description originale si type non reconnu
            fullDescription = traverse.description;
        }
      }

      return {
        ref: traverse.ref,
        description: fullDescription,
        length: traverse.longueur,
        quantity: traverse.quantite,
        unitPrice: 0, // Prix à définir plus tard
        totalPrice: 0, // Prix à définir plus tard
        category: traverse.category,
        details: {
          type: traverse.type,
          originalDetails: traverse.details || {},
        },
      };
    });
  }

  /**
   * Génère un rapport complet des traverses
   * @param {Object} config - Configuration
   * @returns {Object} Rapport détaillé
   */
  static generateReport(config) {
    const traverses = this.calculateTraverses(config);
    const validation = this.validateTraverses(traverses, config);
    const tableLines = this.formatForTable(traverses);

    // Calcul des totaux par type
    const pt40Total = traverses
      .filter((t) => t.ref === "PT40")
      .reduce((sum, t) => sum + t.longueur * t.quantite, 0);

    const pat40Total = traverses
      .filter((t) => t.ref === "PAT40")
      .reduce((sum, t) => sum + t.longueur * t.quantite, 0);

    return {
      config: {
        dimensions: `${config.width}×${config.height}mm`,
        modules: config.modulesCount,
        traversesHorizontales: config.traverses?.length || 0,
      },
      traverses,
      validation,
      tableLines,
      totals: {
        PT40: pt40Total,
        PAT40: pat40Total,
      },
      summary: {
        totalTraverses: traverses.length,
        totalPT40: `${(pt40Total / 1000).toFixed(2)}m`,
        totalPAT40: `${(pat40Total / 1000).toFixed(2)}m`,
        valid: validation.valid,
      },
    };
  }
}
