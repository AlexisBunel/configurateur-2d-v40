export class GlassCalculator {
  static calculateGlass(config) {
    const glass = [];
    const verriereGlass = this.calculateVerriereGlass(config);
    glass.push(...verriereGlass);

    const imposteGlass = this.calculateImposteGlass(config);
    if (imposteGlass) {
      glass.push(imposteGlass);
    }

    const porteGlass = this.calculatePorteGlass(config);
    glass.push(...porteGlass);

    return glass;
  }

  static calculateVerriereGlass(config) {
    const { modules, height, type, porteIndex, traverses, options } = config;
    const glass = [];

    const epaisseur = options?.remplissageEp || 6;
    const refRemplissage = epaisseur === 8 ? "REMPLISSAGE-8" : "REMPLISSAGE-6";

    modules.forEach((module, index) => {
      const moduleNumber = index + 1;
      const isPorteModule = type === "porte" && moduleNumber === porteIndex;

      if (isPorteModule) {
        return;
      }

      const largeurRemplissage = module.width + 19;
      const traversesModule = this.getTraversesForModule(
        traverses,
        moduleNumber
      );

      const hauteurs = this.calculateHeights(height, traversesModule);

      hauteurs.forEach((hauteur, remplissageIndex) => {
        const surface = this.calculateSurface(largeurRemplissage, hauteur);

        glass.push({
          ref: refRemplissage,
          description: `Remplissage ${epaisseur}mm`,
          epaisseur: `${epaisseur}mm`,
          dimensions: `${hauteur}mm x ${largeurRemplissage}mm`,
          surface: surface,
          unitPrice: 0,
          totalPrice: 0,
          category: "remplissage",
          details: {
            module: moduleNumber,
            remplissageIndex: remplissageIndex + 1,
            width: largeurRemplissage,
            height: hauteur,
          },
        });
      });
    });

    return glass;
  }

  static getTraversesForModule(traverses, moduleNumber) {
    if (!traverses || traverses.length === 0) {
      return [];
    }

    const traversesModule = traverses.filter(
      (traverse) => traverse.modules && traverse.modules.includes(moduleNumber)
    );

    return traversesModule.sort((a, b) => a.height - b.height);
  }

  static calculateHeights(totalHeight, traverses) {
    const HT = totalHeight;
    const hauteurs = [];

    if (traverses.length === 0) {
      // Aucune traverse : un seul remplissage
      const h = HT - 61;
      hauteurs.push(h);
    } else {
      for (let i = 0; i < traverses.length; i++) {
        const hTi = traverses[i].height;

        if (i === 0) {
          const h1 = hTi - 21;
          hauteurs.push(h1);
        } else {
          const hTprev = traverses[i - 1].height;
          const hi = hTi - hTprev - 21;
          hauteurs.push(hi);
        }
      }

      const hTn = traverses[traverses.length - 1].height;
      const hn = HT - hTn - 61;
      hauteurs.push(hn);
    }

    return hauteurs.filter((h) => h > 0);
  }

  static calculateImposteGlass(config) {
    if (config.type !== "porte") {
      return null;
    }

    const withImposte =
      config.porte?.withImposte === true ||
      config.porte?.withImposte === "true";
    if (!withImposte) {
      return null;
    }

    const porteIndex = config.porteIndex;
    const modulePorteIndex = porteIndex - 1;
    const modulePorte = config.modules[modulePorteIndex];

    if (!modulePorte) {
      return null;
    }

    const dimensionsOuverture = this.calculateDimensionsOuverture(config);

    const largeurImposte = modulePorte.width + 19;
    const hauteurImposte = config.height - dimensionsOuverture.hauteur - 21;

    if (hauteurImposte <= 0 || largeurImposte <= 0) {
      console.warn(
        `Dimensions imposte invalides: ${hauteurImposte}mm x ${largeurImposte}mm`
      );
      return null;
    }

    const epaisseur = config.options?.remplissageEp || 6;
    const refRemplissage = epaisseur === 8 ? "REMPLISSAGE-8" : "REMPLISSAGE-6";
    const surface = this.calculateSurface(largeurImposte, hauteurImposte);

    const imposteGlass = {
      ref: refRemplissage,
      description: `Remplissage ${epaisseur}mm`,
      epaisseur: `${epaisseur}mm`,
      dimensions: `${hauteurImposte}mm x ${largeurImposte}mm`,
      surface: surface,
      unitPrice: 0,
      totalPrice: 0,
      category: "remplissage",
      details: {
        module: porteIndex,
        remplissageIndex: 1,
        width: largeurImposte,
        height: hauteurImposte,
        type: "imposte",
      },
    };

    return imposteGlass;
  }

  static calculatePorteGlass(config) {
    if (config.type !== "porte") {
      return [];
    }

    const glass = [];
    const { porte, options } = config;

    const epaisseur = options?.remplissageEp || 6;
    const refRemplissage = epaisseur === 8 ? "REMPLISSAGE-8" : "REMPLISSAGE-6";

    const porteRemplissages = this.calculatePorteRemplissages(
      config,
      refRemplissage,
      epaisseur
    );
    glass.push(...porteRemplissages);

    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";
    if (withTierce) {
      const tierceRemplissages = this.calculateTierceRemplissages(
        config,
        refRemplissage,
        epaisseur
      );
      glass.push(...tierceRemplissages);
    }

    return glass;
  }

  static calculatePorteRemplissages(config, refRemplissage, epaisseur) {
    const { porte, traversesPorte } = config;
    const glass = [];

    const profilsPorte = this.determineProfilsPorte(porte);

    const largeurRemplissage = this.calculatePorteGlassWidth(
      porte.porteWidth,
      profilsPorte
    );
    const traversesPorteOnly = this.getTraversesPorteForLocation(
      traversesPorte,
      true,
      false
    );

    const hauteurs = this.calculatePorteHeights(
      porte.porteHeight,
      traversesPorteOnly
    );

    hauteurs.forEach((hauteur, remplissageIndex) => {
      const surface = this.calculateSurface(largeurRemplissage, hauteur);

      glass.push({
        ref: refRemplissage,
        description: `Remplissage ${epaisseur}mm`,
        epaisseur: `${epaisseur}mm`,
        dimensions: `${hauteur}mm x ${largeurRemplissage}mm`,
        surface: surface,
        unitPrice: 0,
        totalPrice: 0,
        category: "remplissage",
        details: {
          module: "porte",
          remplissageIndex: remplissageIndex + 1,
          width: largeurRemplissage,
          height: hauteur,
          type: "porte",
        },
      });
    });

    return glass;
  }

  static calculateTierceRemplissages(config, refRemplissage, epaisseur) {
    const { porte, traversesPorte } = config;
    const glass = [];

    const profilsTierce = this.determineProfilsTierce(porte);

    const largeurRemplissage = this.calculateTierceGlassWidth(
      porte.tierceWidth,
      profilsTierce
    );

    const traversesTierceOnly = this.getTraversesPorteForLocation(
      traversesPorte,
      false,
      true
    );

    const hauteurs = this.calculatePorteHeights(
      porte.porteHeight,
      traversesTierceOnly
    );

    hauteurs.forEach((hauteur, remplissageIndex) => {
      const surface = this.calculateSurface(largeurRemplissage, hauteur);

      glass.push({
        ref: refRemplissage,
        description: `Remplissage ${epaisseur}mm`,
        epaisseur: `${epaisseur}mm`,
        dimensions: `${hauteur}mm x ${largeurRemplissage}mm`,
        surface: surface,
        unitPrice: 0,
        totalPrice: 0,
        category: "remplissage",
        details: {
          module: "tierce",
          remplissageIndex: remplissageIndex + 1,
          width: largeurRemplissage,
          height: hauteur,
          type: "tierce",
        },
      });
    });

    return glass;
  }

  static determineProfilsPorte(porte) {
    const charniereType = porte?.charniereType || "visible";
    const serrure = porte?.serrure || "SERROULM";

    if (charniereType === "visible") {
      if (serrure === "SERPEN35M") {
        return { gauche: 66, droite: 40 }; // 66-40
      } else {
        return { gauche: 40, droite: 40 }; // 40-40
      }
    } else {
      // invisible
      if (serrure === "SERPEN35M") {
        return { gauche: 53, droite: 66 }; // 53-66
      } else {
        return { gauche: 53, droite: 40 }; // 53-40
      }
    }
  }

  static determineProfilsTierce(porte) {
    const charniereType = porte?.charniereType || "visible";

    if (charniereType === "visible") {
      return { gauche: 40, droite: 40 };
    } else {
      return { gauche: 53, droite: 40 };
    }
  }

  static calculatePorteGlassWidth(porteWidth, profils) {
    const { gauche, droite } = profils;

    if (gauche === 40 && droite === 40) {
      return porteWidth - 63;
    } else if (gauche === 66 && droite === 40) {
      return porteWidth - 89;
    } else if (gauche === 53 && droite === 40) {
      return porteWidth - 76;
    } else if (gauche === 53 && droite === 66) {
      return porteWidth - 102;
    }

    return porteWidth - 63;
  }

  static calculateTierceGlassWidth(tierceWidth, profils) {
    const { gauche, droite } = profils;

    if (gauche === 40 && droite === 40) {
      return tierceWidth - 63;
    } else if (gauche === 53 && droite === 40) {
      return tierceWidth - 76;
    }

    return tierceWidth - 63;
  }

  static getTraversesPorteForLocation(traversesPorte, onPorte, onTierce) {
    if (!traversesPorte || traversesPorte.length === 0) {
      return [];
    }

    const traversesFiltered = traversesPorte.filter((traverse) => {
      return (onPorte && traverse.onPorte) || (onTierce && traverse.onTierce);
    });

    return traversesFiltered.sort((a, b) => a.height - b.height);
  }

  static calculatePorteHeights(porteHeight, traverses) {
    const HP = porteHeight;
    const hauteurs = [];

    if (traverses.length === 0) {
      const h = HP - 66;
      hauteurs.push(h);
    } else {
      for (let i = 0; i < traverses.length; i++) {
        const traverse = traverses[i];
        const Hi = traverse.height;
        const type = traverse.type;

        if (i === 0) {
          let h1;
          if (type === "28") {
            h1 = Hi - 32;
          } else {
            h1 = Hi - 32;
          }
          hauteurs.push(h1);
        } else {
          const Hprev = traverses[i - 1].height;
          let hi;
          if (type === "28") {
            hi = Hi - Hprev - 10;
          } else {
            hi = Hi - Hprev - 18;
          }
          hauteurs.push(hi);
        }
      }

      const lastTraverse = traverses[traverses.length - 1];
      const Hn = lastTraverse.height;
      const lastType = lastTraverse.type;
      let hn;
      if (lastType === "28") {
        hn = HP - Hn - 44;
      } else {
        hn = HP - Hn - 52;
      }
      hauteurs.push(hn);
    }

    return hauteurs.filter((h) => h > 0);
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

  static calculateSurface(width, height) {
    const widthM = width / 1000;
    const heightM = height / 1000;
    const surface = widthM * heightM;
    return Math.round(surface * 100) / 100;
  }

  static formatForTable(glass) {
    const groupedGlass = new Map();

    glass.forEach((g) => {
      const key = `${g.epaisseur}_${g.dimensions}`;

      if (groupedGlass.has(key)) {
        const existing = groupedGlass.get(key);
        existing.quantity += 1;
        existing.surface += g.surface;
        existing.totalPrice = existing.quantity * existing.unitPrice;

        existing.details.modules.push(g.details.module);
        existing.details.remplissageIndexes.push(g.details.remplissageIndex);
      } else {
        groupedGlass.set(key, {
          description: g.description,
          epaisseur: g.epaisseur,
          dimensions: g.dimensions,
          surface: g.surface,
          quantity: 1,
          unitPrice: g.unitPrice || 0,
          totalPrice: g.unitPrice || 0,
          category: g.category,
          details: {
            modules: [g.details.module],
            remplissageIndexes: [g.details.remplissageIndex],
            width: g.details.width,
            height: g.details.height,
          },
        });
      }
    });

    const result = Array.from(groupedGlass.values()).sort((a, b) => {
      const [hauteurA, largeurA] = a.dimensions
        .split(" x ")
        .map((d) => parseInt(d));
      const [hauteurB, largeurB] = b.dimensions
        .split(" x ")
        .map((d) => parseInt(d));

      if (hauteurA !== hauteurB) {
        return hauteurA - hauteurB;
      }
      return largeurA - largeurB;
    });

    return result;
  }

  static validateGlass(glass, config) {
    const warnings = [];
    const negativeSurface = glass.find((g) => g.surface <= 0);
    if (negativeSurface) {
      warnings.push(`Surface négative ou nulle : ${negativeSurface.ref}`);
    }

    glass.forEach((g) => {
      if (g.details) {
        if (g.details.width < 50 || g.details.width > 2500) {
          warnings.push(
            `Largeur : ${g.details.width}mm pour module ${g.details.module}`
          );
        }
        if (g.details.height < 50 || g.details.height > 4000) {
          warnings.push(
            `Hauteur : ${g.details.height}mm pour module ${g.details.module}`
          );
        }
      }
    });

    const modulesFixesCount = config.modules.filter((module, index) => {
      const moduleNumber = index + 1;
      const isPorteModule =
        config.type === "porte" && moduleNumber === config.porteIndex;
      return !isPorteModule;
    }).length;

    const modulesWithGlass = new Set(glass.map((g) => g.details?.module)).size;
    if (modulesWithGlass !== modulesFixesCount) {
      warnings.push(
        `Incohérence modules/remplissages: ${modulesWithGlass} modules avec vitrage, ${modulesFixesCount} attendus`
      );
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  static generateReport(config) {
    const glass = this.calculateGlass(config);
    const validation = this.validateGlass(glass, config);
    const tableLines = this.formatForTable(glass);

    const totalSurface = glass.reduce((sum, g) => sum + (g.surface || 0), 0);
    const totalCount = glass.length;

    return {
      config: {
        dimensions: `${config.width}×${config.height}mm`,
        modules: config.modulesCount,
        traverses: config.traverses?.length || 0,
        epaisseur: `${config.options?.remplissageEp || 6}mm`,
      },
      glass,
      validation,
      tableLines,
      totals: {
        surface: Math.round(totalSurface * 100) / 100,
        count: totalCount,
      },
      summary: {
        totalGlass: totalCount,
        totalSurface: `${Math.round(totalSurface * 100) / 100}m²`,
        averageSurface:
          totalCount > 0
            ? `${Math.round((totalSurface / totalCount) * 100) / 100}m²`
            : "0m²",
        valid: validation.valid,
      },
    };
  }
}
