import { PorteCalculator } from "./PorteCalculator.js";

export class PC40Calculator {
  static calculateVariantes(config) {
    const variantes = [];
    const { width, height, modulesCount, type, porteIndex, porte } = config;

    this.ensureModulesSync(config);

    if (type !== "porte") {
      return this.calculateSansPorte(config);
    } else {
      return this.calculateAvecPorte(config);
    }
  }

  static calculateSansPorte(config) {
    const { width, height } = config;
    const variantes = [];

    variantes.push({
      type: "vertical",
      longueur: height,
      quantite: 2,
      description: "Profil cadre vertical",
    });

    variantes.push({
      type: "horizontal",
      longueur: width - 80,
      quantite: 2,
      description: "Profil cadre horizontal",
    });

    return variantes;
  }

  static calculateAvecPorte(config) {
    const { width, height, modulesCount, porteIndex, porte } = config;
    const variantes = [];

    const dimensionsOuverture =
      PorteCalculator.calculateDimensionsOuverture(config);

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

    const profilsHorizontaux = porte?.withImposte
      ? this.calculateProfilsHorizontauxAvecImposte(config, dimensionsOuverture)
      : this.calculateProfilsHorizontauxSansImposte(
          config,
          dimensionsOuverture
        );

    variantes.push(...profilsHorizontaux);
    return variantes;
  }

  static calculateProfilsVerticaux(porteIndex, modulesCount) {
    if (porteIndex === 1 || porteIndex === modulesCount) {
      return 1;
    }

    return 2;
  }

  static calculateProfilsHorizontauxSansImposte(config, dimensionsOuverture) {
    const { width, porteIndex, modulesCount } = config;
    const variantes = [];

    if (porteIndex === 1) {
      const longueurDroite = width - dimensionsOuverture.largeur - 40;

      if (longueurDroite > 0) {
        variantes.push({
          type: "horizontal_droite",
          longueur: longueurDroite,
          quantite: 2,
          description: "Profil cadre horizontal droite",
        });
      }
    } else if (porteIndex === modulesCount) {
      const longueurGauche = width - dimensionsOuverture.largeur - 40;

      if (longueurGauche > 0) {
        variantes.push({
          type: "horizontal_gauche",
          longueur: longueurGauche,
          quantite: 2,
          description: "Profil cadre horizontal gauche",
        });
      }
    } else {
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

  static calculateProfilsHorizontauxAvecImposte(config, dimensionsOuverture) {
    const { width, porteIndex, modulesCount } = config;
    const variantes = [];

    let longueurGauche = 0;
    let longueurDroite = 0;
    const longueurImposte = dimensionsOuverture.largeur - 102;

    if (porteIndex === 1) {
      longueurDroite = width - dimensionsOuverture.largeur - 40;
    } else if (porteIndex === modulesCount) {
      longueurGauche = width - dimensionsOuverture.largeur - 40;
    } else {
      const longueurs = this.calculateLongueursGaucheDroite(config);
      longueurGauche = longueurs.longueurGauche;
      longueurDroite = longueurs.longueurDroite;
    }

    if (longueurGauche > 0) {
      variantes.push({
        type: "horizontal_haut_gauche",
        longueur: longueurGauche,
        quantite: 2,
        description: "Profil cadre horizontal gauche",
      });
    }

    if (longueurDroite > 0) {
      variantes.push({
        type: "horizontal_haut_droite",
        longueur: longueurDroite,
        quantite: 2,
        description: "Profil cadre horizontal droite",
      });
    }

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

    if (porteIndex < 1 || porteIndex > modulesCount) {
      console.error("ERREUR: porteIndex invalide", {
        porteIndex,
        modulesCount,
      });
      return { longueurGauche: 0, longueurDroite: 0 };
    }

    for (let i = 1; i < porteIndex; i++) {
      const moduleIndex = i - 1;
      const moduleWidth = config.modules?.[moduleIndex]?.width;
      longueurGauche += moduleWidth;
    }

    const profilsGauche = Math.max(0, porteIndex - 2);
    longueurGauche += profilsGauche * 40;
    for (let i = porteIndex + 1; i <= modulesCount; i++) {
      const moduleIndex = i - 1;
      const moduleWidth =
        config.modules?.[moduleIndex]?.width || width / modulesCount;
      longueurDroite += moduleWidth;
    }

    const profilsDroite = Math.max(0, modulesCount - porteIndex - 1);
    longueurDroite += profilsDroite * 40;

    return { longueurGauche, longueurDroite };
  }

  static ensureModulesSync(config) {
    const { modulesCount } = config;

    if (!config.modules) {
      config.modules = [];
    }

    for (let i = 1; i <= modulesCount; i++) {
      const input = document.getElementById(`widthModule${i}`);
      if (input && input.value) {
        const moduleIndex = i - 1;
        if (!config.modules[moduleIndex]) {
          config.modules[moduleIndex] = {};
        }
        config.modules[moduleIndex].width =
          parseInt(input.value) || config.width / modulesCount;
      }
    }
  }

  static calculateTotalLengths(variantes) {
    const totalLength = variantes.reduce((sum, variante) => {
      return sum + variante.longueur * variante.quantite;
    }, 0);

    return {
      PC40: totalLength,
      PAC40: totalLength,
    };
  }

  static formatForTable(variantes, profileRef) {
    const lines = [];

    variantes.forEach((variante) => {
      let baseDescription;
      if (profileRef === "PC40") {
        baseDescription = "Profil cadre 40";
      } else if (profileRef === "PAC40") {
        baseDescription = "Parclose cadre 40";
      } else {
        baseDescription = variante.description;
      }

      let fullDescription = baseDescription;

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
            fullDescription = variante.description;
        }
      }

      lines.push({
        ref: profileRef,
        description: fullDescription,
        length: variante.longueur,
        quantity: variante.quantite,
        unitPrice: 0,
        totalPrice: 0,
        category: profileRef === "PC40" ? "structure" : "parclose",
        details: {
          type: variante.type,
          originalDescription: variante.description,
        },
      });
    });

    return lines;
  }

  static validateCalculation(config, variantes) {
    const warnings = [];

    if (variantes.length === 0) {
      warnings.push("Aucun profil calculé");
    }

    const negativeLength = variantes.find((v) => v.longueur <= 0);
    if (negativeLength) {
      warnings.push(
        `Longueur négative ou nulle détectée: ${negativeLength.description}`
      );
    }

    const zeroQuantity = variantes.find((v) => v.quantite <= 0);
    if (zeroQuantity) {
      warnings.push(`Quantité nulle détectée: ${zeroQuantity.description}`);
    }

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
