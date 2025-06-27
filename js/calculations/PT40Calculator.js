export class PT40Calculator {
  static calculateTraverses(config) {
    const traverses = [];

    const traversesVerticales = this.calculateTraversesVerticales(config);
    traverses.push(...traversesVerticales);

    const traversesHorizontales = this.calculateTraversesHorizontales(config);
    traverses.push(...traversesHorizontales);

    return traverses;
  }

  static calculateTraversesVerticales(config) {
    const { height, modulesCount, type, porteIndex } = config;
    const traverses = [];

    const longueurVerticale = height - 80;

    let nombreTraversesVerticales = 0;

    if (type === "porte") {
      if (porteIndex === 1 || porteIndex === modulesCount) {
        nombreTraversesVerticales = modulesCount - 2;
      } else if (porteIndex > 1 && porteIndex < modulesCount) {
        nombreTraversesVerticales = modulesCount - 3;
      } else {
        console.error(
          `porteIndex invalide: ${porteIndex} (doit être entre 1 et ${modulesCount})`
        );
        nombreTraversesVerticales = 0;
      }
    } else {
      nombreTraversesVerticales = modulesCount - 1;
    }
    nombreTraversesVerticales = Math.max(0, nombreTraversesVerticales);

    if (nombreTraversesVerticales > 0) {
      traverses.push({
        ref: "PT40",
        description: "Traverse verticale",
        longueur: longueurVerticale,
        quantite: nombreTraversesVerticales,
        category: "structure",
        type: "traverse_verticale",
      });

      traverses.push({
        ref: "PAT40",
        description: "Parclose traverse verticale",
        longueur: longueurVerticale,
        quantite: nombreTraversesVerticales,
        category: "parclose",
        type: "traverse_verticale",
      });
    }
    return traverses;
  }

  static calculateTraversesHorizontales(config) {
    const { traverses: configTraverses, modules } = config;
    const traversesCalculees = [];

    if (!configTraverses || configTraverses.length === 0) {
      return traversesCalculees;
    }

    const longueursCumulees = new Map();

    configTraverses.forEach((traverse, index) => {
      traverse.modules.forEach((numeroModule) => {
        const moduleIndex = numeroModule - 1;
        const module = modules[moduleIndex];

        if (module) {
          const largeurModule = module.width || 0;

          const currentCount = longueursCumulees.get(largeurModule) || 0;
          longueursCumulees.set(largeurModule, currentCount + 1);
        } else {
          console.warn(
            `Module ${numeroModule} non trouvé dans la configuration`
          );
        }
      });
    });
    longueursCumulees.forEach((quantite, longueur) => {});

    longueursCumulees.forEach((quantite, longueur) => {
      if (longueur > 0 && quantite > 0) {
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
    return traversesCalculees;
  }
  static grouperModulesContigus(modules) {
    if (!modules || modules.length === 0) return [];

    const modulesTries = [...modules].sort((a, b) => a - b);
    const segments = [];
    let segmentActuel = [modulesTries[0]];

    for (let i = 1; i < modulesTries.length; i++) {
      if (modulesTries[i] === modulesTries[i - 1] + 1) {
        segmentActuel.push(modulesTries[i]);
      } else {
        segments.push(segmentActuel);
        segmentActuel = [modulesTries[i]];
      }
    }
    segments.push(segmentActuel);

    return segments;
  }

  static calculerLongueurSegment(modulesSegment, modulesConfig, config) {
    let longueur = 0;

    modulesSegment.forEach((numeroModule) => {
      const moduleIndex = numeroModule - 1;
      const module = modulesConfig[moduleIndex];

      if (module) {
        const largeurModule = module.width || 0;
        longueur += largeurModule;
      } else {
        console.warn(`Module ${numeroModule} non trouvé dans la configuration`);
      }
    });

    return longueur;
  }

  static validateTraverses(traverses, config) {
    const warnings = [];
    const negativeLength = traverses.find((t) => t.longueur <= 0);
    if (negativeLength) {
      warnings.push(
        `Longueur négative ou nulle: ${negativeLength.description}`
      );
    }
    const zeroQuantity = traverses.find((t) => t.quantite <= 0);
    if (zeroQuantity) {
      warnings.push(`Quantité nulle: ${zeroQuantity.description}`);
    }
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
  static formatForTable(traverses) {
    return traverses.map((traverse) => {
      let baseDescription;
      if (traverse.ref === "PT40") {
        baseDescription = "Profil traverse 40";
      } else if (traverse.ref === "PAT40") {
        baseDescription = "Parclose traverse 40";
      } else {
        baseDescription = traverse.description;
      }

      let fullDescription = baseDescription;

      if (traverse.type) {
        switch (traverse.type) {
          case "traverse_verticale":
            fullDescription += " - verticale";
            break;
          case "traverse_horizontale":
            fullDescription += " - horizontale";
            break;
          default:
            fullDescription = traverse.description;
        }
      }

      return {
        ref: traverse.ref,
        description: fullDescription,
        length: traverse.longueur,
        quantity: traverse.quantite,
        unitPrice: 0,
        totalPrice: 0,
        category: traverse.category,
        details: {
          type: traverse.type,
          originalDetails: traverse.details || {},
        },
      };
    });
  }

  static generateReport(config) {
    const traverses = this.calculateTraverses(config);
    const validation = this.validateTraverses(traverses, config);
    const tableLines = this.formatForTable(traverses);

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
