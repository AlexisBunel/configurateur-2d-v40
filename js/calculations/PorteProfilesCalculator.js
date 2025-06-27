export class PorteProfilesCalculator {
  static calculateFinitionProfiles(config, allPorteProfiles) {
    const profiles = [];

    let totalLengthPF23 = 0;

    allPorteProfiles.forEach((profile) => {
      if (["PTPV51", "PO40", "PO66", "PO6622U"].includes(profile.ref)) {
        const totalLength = profile.longueur * profile.quantite;
        totalLengthPF23 += totalLength;
      }
    });

    if (totalLengthPF23 > 0) {
      const quantitePF23 = Math.ceil(totalLengthPF23 / 5000);

      profiles.push({
        ref: "PF23",
        description: "Profil de finition 23",
        longueur: 5140,
        quantite: quantitePF23,
        category: "finition",
        type: "porte",
        details: {
          totalLengthNeeded: totalLengthPF23,
          calculation: `${totalLengthPF23}mm ÷ 5000 = ${quantitePF23} barre(s)`,
        },
      });
    }

    let totalLengthPF33 = 0;

    allPorteProfiles.forEach((profile) => {
      if (["PTCI51", "POCI53"].includes(profile.ref)) {
        const totalLength = profile.longueur * profile.quantite;
        totalLengthPF33 += totalLength;
      }
    });

    if (totalLengthPF33 > 0) {
      const quantitePF33 = Math.ceil(totalLengthPF33 / 5000);

      profiles.push({
        ref: "PF33",
        description: "Profil de finition 33",
        longueur: 5140,
        quantite: quantitePF33,
        category: "finition",
        type: "porte",
        details: {
          totalLengthNeeded: totalLengthPF33,
          calculation: `${totalLengthPF33}mm ÷ 5000 = ${quantitePF33} barre(s)`,
        },
      });
    }
    return profiles;
  }

  static calculatePorteProfiles(config) {
    const profiles = [];

    if (config.type !== "porte") {
      return profiles;
    }

    const ptciv51Profiles = this.calculatePTCIV51(config);
    profiles.push(...ptciv51Profiles);

    const ptpv51Profiles = this.calculatePTPV51(config);
    profiles.push(...ptpv51Profiles);

    const imposteProfiles = this.calculateImposteProfiles(config);
    profiles.push(...imposteProfiles);

    const porteOuvranteProfiles = this.calculatePorteOuvranteProfiles(config);
    profiles.push(...porteOuvranteProfiles);

    const thb40Profiles = this.calculateTHB40Profiles(config);
    profiles.push(...thb40Profiles);

    const traversesIntermediaires = this.calculateTraversesIntermediaires(
      config,
      thb40Profiles
    );
    profiles.push(...traversesIntermediaires);

    const patp65Profiles = this.calculatePATP65(
      config,
      ptciv51Profiles,
      ptpv51Profiles
    );
    profiles.push(...patp65Profiles);

    const finitionProfiles = this.calculateFinitionProfiles(config, profiles);
    profiles.push(...finitionProfiles);

    return profiles;
  }

  static calculatePTCIV51(config) {
    const profiles = [];
    const { height, porte } = config;

    const isInvisible = porte?.charniereType === "invisible";
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";

    if (!isInvisible) {
      return profiles;
    }

    const quantite = withTierce ? 2 : 1;

    profiles.push({
      ref: "PTCIV51",
      description: "Profil traverse charnières invisibles",
      longueur: height,
      quantite: quantite,
      category: "structure",
      type: "dormant",
    });

    return profiles;
  }

  static calculatePTPV51(config) {
    const profiles = [];
    const { height, porte, modules, porteIndex } = config;

    const isVisible = porte?.charniereType === "visible";
    const isInvisible = porte?.charniereType === "invisible";
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";
    const withImposte =
      porte?.withImposte === true || porte?.withImposte === "true";

    if (isVisible) {
      const quantite = 2;

      profiles.push({
        ref: "PTPV51",
        description: "Profil traverse paumelles visibles",
        longueur: height,
        quantite: quantite,
        category: "structure",
        type: "dormant",
      });
    }

    if (isInvisible && !withTierce) {
      const quantite = 1;

      profiles.push({
        ref: "PTPV51",
        description: "Profil traverse paumelles visibles",
        longueur: height,
        quantite: quantite,
        category: "structure",
        type: "dormant",
      });
    }

    if (withImposte) {
      const modulePorteIndex = porteIndex - 1;
      const modulePorte = modules?.[modulePorteIndex];

      if (modulePorte && modulePorte.width) {
        const longueurImposte = modulePorte.width;

        profiles.push({
          ref: "PTPV51",
          description: "Profil traverse paumelles visibles (imposte)",
          longueur: longueurImposte,
          quantite: 1,
          category: "structure",
          type: "dormant",
        });
      }
    }

    return profiles;
  }

  static calculateImposteProfiles(config) {
    const profiles = [];
    const withImposte =
      config.porte?.withImposte === true ||
      config.porte?.withImposte === "true";

    if (!withImposte) {
      return profiles;
    }
    const dimensionsOuverture = this.calculateDimensionsOuverture(config);
    const longueurImposte = config.height - dimensionsOuverture.hauteur;

    profiles.push({
      ref: "PIP14",
      description: "Profil imposte",
      longueur: longueurImposte,
      quantite: 2,
      category: "structure",
      type: "imposte",
    });

    profiles.push({
      ref: "PAIP65",
      description: "Parclose imposte",
      longueur: longueurImposte,
      quantite: 2,
      category: "parclose",
      type: "imposte",
    });

    return profiles;
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

  static calculatePorteOuvranteProfiles(config) {
    const profiles = [];
    const { porte } = config;

    if (!porte) {
      return profiles;
    }

    const isVisible = porte.charniereType === "visible";
    const isInvisible = porte.charniereType === "invisible";
    const withTierce = porte.withTierce === true || porte.withTierce === "true";
    const isSerpen35m = porte.serrure === "SERPEN35M";
    const longueurPorte = (porte.porteHeight || 0) - 5;
    const profileType = porte.profile || "po66";

    let quantitePOCI53 = 0;
    if (isInvisible) {
      quantitePOCI53 = withTierce ? 2 : 1;
    }

    if (quantitePOCI53 > 0) {
      profiles.push({
        ref: "POCI53",
        description: "Profil ouvrant charnière invisible",
        longueur: longueurPorte,
        quantite: quantitePOCI53,
        category: "structure",
        type: "porte",
      });
    }

    let quantitePO40 = 0;

    if (!withTierce) {
      if (isVisible) {
        quantitePO40 = isSerpen35m ? 1 : 2;
      } else if (isInvisible) {
        quantitePO40 = isSerpen35m ? 0 : 1;
      }
    } else {
      if (isVisible) {
        quantitePO40 = isSerpen35m ? 3 : 4;
      } else if (isInvisible) {
        quantitePO40 = isSerpen35m ? 1 : 2;
      }
    }

    if (quantitePO40 > 0) {
      profiles.push({
        ref: "PO40",
        description: "Profil ouvrant 40",
        longueur: longueurPorte,
        quantite: quantitePO40,
        category: "structure",
        type: "porte",
      });
    }

    const quantitePO66 = isSerpen35m ? 1 : 0;

    if (quantitePO66 > 0) {
      const profileRef = profileType === "po6622u" ? "PO6622U" : "PO66";
      const profileDescription =
        profileType === "po6622u"
          ? "Profil ouvrant 66 usiné"
          : "Profil ouvrant 66";

      profiles.push({
        ref: profileRef,
        description: profileDescription,
        longueur: longueurPorte,
        quantite: quantitePO66,
        category: "structure",
        type: "porte",
      });
    }
    return profiles;
  }

  static calculateTHB40Profiles(config) {
    const profiles = [];
    const { porte } = config;

    if (!porte) {
      return profiles;
    }

    const isVisible = porte.charniereType === "visible";
    const isInvisible = porte.charniereType === "invisible";
    const withTierce = porte.withTierce === true || porte.withTierce === "true";
    const isSerpen35m = porte.serrure === "SERPEN35M";
    const porteWidth = porte.porteWidth || 0;
    const tierceWidth = porte.tierceWidth || 0;

    const longueurMap = new Map();

    let largeurPorteInterne;

    if (isVisible) {
      if (isSerpen35m) {
        largeurPorteInterne = porteWidth - 40 - 66;
      } else {
        largeurPorteInterne = porteWidth - 40 - 40;
      }
    } else if (isInvisible) {
      if (isSerpen35m) {
        largeurPorteInterne = porteWidth - 53 - 66;
      } else {
        largeurPorteInterne = porteWidth - 53 - 40;
      }
    }

    const currentQty = longueurMap.get(largeurPorteInterne) || 0;
    longueurMap.set(largeurPorteInterne, currentQty + 2);

    if (withTierce) {
      let largeurTierceInterne;

      if (isVisible) {
        largeurTierceInterne = tierceWidth - 40 - 40;
      } else if (isInvisible) {
        largeurTierceInterne = tierceWidth - 53 - 40;
      }

      const currentTierceQty = longueurMap.get(largeurTierceInterne) || 0;
      longueurMap.set(largeurTierceInterne, currentTierceQty + 2);
    }

    longueurMap.forEach((quantite, longueur) => {
      if (longueur > 0 && quantite > 0) {
        profiles.push({
          ref: "THB40",
          description: "Traverse haute et basse 40",
          longueur: longueur,
          quantite: quantite,
          category: "traverse",
          type: "porte",
        });
      }
    });

    const totalTHB40 = Array.from(longueurMap.values()).reduce(
      (sum, qty) => sum + qty,
      0
    );
    const expectedTHB40 = withTierce ? 4 : 2;

    if (totalTHB40 !== expectedTHB40) {
      console.warn(
        `⚠️ Total traverses THB40: ${totalTHB40}, attendu: ${expectedTHB40}`
      );
    }

    return profiles;
  }

  static calculateTraversesIntermediaires(config, thb40Profiles) {
    const profiles = [];
    const { traversesPorte } = config;

    if (!traversesPorte || traversesPorte.length === 0) {
      return profiles;
    }

    let longueurPorteTHB40 = 0;
    let longueurTierceTHB40 = 0;

    const { porte } = config;
    const isVisible = porte.charniereType === "visible";
    const isSerpen35m = porte.serrure === "SERPEN35M";
    const porteWidth = porte.porteWidth || 0;
    const tierceWidth = porte.tierceWidth || 0;
    const withTierce = porte.withTierce === true || porte.withTierce === "true";

    if (isVisible) {
      longueurPorteTHB40 = isSerpen35m
        ? porteWidth - 40 - 66
        : porteWidth - 40 - 40;
    } else {
      longueurPorteTHB40 = isSerpen35m
        ? porteWidth - 53 - 66
        : porteWidth - 53 - 40;
    }

    if (withTierce) {
      if (isVisible) {
        longueurTierceTHB40 = tierceWidth - 40 - 40;
      } else {
        longueurTierceTHB40 = tierceWidth - 53 - 40;
      }
    }

    const traversesMap = new Map();

    traversesPorte.forEach((traverse) => {
      const { type, onPorte, onTierce } = traverse;
      const ref = type === "28" ? "TI28" : "TI37";

      let longueur = 0;
      if (onPorte) {
        longueur = longueurPorteTHB40 - 2;
      } else if (onTierce && withTierce) {
        longueur = longueurTierceTHB40 - 2;
      }

      if (longueur > 0) {
        const key = `${ref}_${longueur}`;
        const current = traversesMap.get(key) || { ref, longueur, quantite: 0 };
        current.quantite += 1;
        traversesMap.set(key, current);
      }
    });

    traversesMap.forEach((traverse) => {
      profiles.push({
        ref: traverse.ref,
        description:
          traverse.ref === "TI28"
            ? "Traverse intermédiaire 28"
            : "Traverse intermédiaire 37",
        longueur: traverse.longueur,
        quantite: traverse.quantite,
        category: "traverse",
        type: "porte",
      });
    });

    return profiles;
  }

  static calculatePATP65(config, ptciv51Profiles, ptpv51Profiles) {
    const profiles = [];
    const withImposte =
      config.porte?.withImposte === true ||
      config.porte?.withImposte === "true";

    const allProfiles = [...ptciv51Profiles, ...ptpv51Profiles];

    const longueurMap = new Map();

    allProfiles.forEach((profile) => {
      let longueur = profile.longueur;

      if (withImposte && longueur === config.height) {
        const dimensionsOuverture = this.calculateDimensionsOuverture(config);
        longueur = dimensionsOuverture.hauteur;
      }

      const quantiteActuelle = longueurMap.get(longueur) || 0;
      longueurMap.set(longueur, quantiteActuelle + profile.quantite);
    });

    longueurMap.forEach((quantite, longueur) => {
      profiles.push({
        ref: "PATP65",
        description: "Parclose traverse porte",
        longueur: longueur,
        quantite: quantite,
        category: "parclose",
        type: "dormant",
      });
    });

    return profiles;
  }

  static formatForTable(profiles) {
    return profiles.map((profile) => ({
      ref: profile.ref,
      description: profile.description,
      length: profile.longueur,
      quantity: profile.quantite,
      unitPrice: 0,
      totalPrice: 0,
      category: profile.category,
      details: {
        type: profile.type,
        originalDetails: {},
      },
    }));
  }

  static validateProfiles(profiles, config) {
    const warnings = [];

    const negativeLength = profiles.find((p) => p.longueur <= 0);
    if (negativeLength) {
      warnings.push(`Longueur négative ou nulle: ${negativeLength.ref}`);
    }

    const zeroQuantity = profiles.find((p) => p.quantite <= 0);
    if (zeroQuantity) {
      warnings.push(`Quantité nulle: ${zeroQuantity.ref}`);
    }

    const ptciv51Total = profiles
      .filter((p) => p.ref === "PTCIV51")
      .reduce((sum, p) => sum + p.quantite, 0);

    const ptpv51Total = profiles
      .filter((p) => p.ref === "PTPV51")
      .reduce((sum, p) => sum + p.quantite, 0);

    const patp65Total = profiles
      .filter((p) => p.ref === "PATP65")
      .reduce((sum, p) => sum + p.quantite, 0);

    const expectedPatp65 = ptciv51Total + ptpv51Total;

    if (patp65Total !== expectedPatp65) {
      warnings.push(
        `Incohérence PATP65: attendu ${expectedPatp65}, calculé ${patp65Total}`
      );
    }

    const poci53Count = profiles
      .filter((p) => p.ref === "POCI53")
      .reduce((sum, p) => sum + p.quantite, 0);
    const po40Count = profiles
      .filter((p) => p.ref === "PO40")
      .reduce((sum, p) => sum + p.quantite, 0);
    const po66Count = profiles
      .filter((p) => p.ref === "PO66")
      .reduce((sum, p) => sum + p.quantite, 0);

    const totalPorteProfiles = poci53Count + po40Count + po66Count;
    const withTierce =
      config.porte?.withTierce === true || config.porte?.withTierce === "true";
    const expectedPorteTotal = withTierce ? 4 : 2;

    if (totalPorteProfiles !== expectedPorteTotal) {
      warnings.push(
        `Total profils porte incorrect: ${totalPorteProfiles}, attendu: ${expectedPorteTotal}`
      );
    }

    const thb40Count = profiles
      .filter((p) => p.ref === "THB40")
      .reduce((sum, p) => sum + p.quantite, 0);
    const expectedTHB40 = withTierce ? 4 : 2;

    if (thb40Count !== expectedTHB40) {
      warnings.push(
        `Total traverses THB40 incorrect: ${thb40Count}, attendu: ${expectedTHB40}`
      );
    }

    const ti28Count = profiles
      .filter((p) => p.ref === "TI28")
      .reduce((sum, p) => sum + p.quantite, 0);
    const ti37Count = profiles
      .filter((p) => p.ref === "TI37")
      .reduce((sum, p) => sum + p.quantite, 0);
    const traversesPorteCount = config.traversesPorte?.length || 0;
    const totalTI = ti28Count + ti37Count;

    if (totalTI !== traversesPorteCount) {
      warnings.push(
        `Total traverses intermédiaires incorrect: ${totalTI}, attendu: ${traversesPorteCount}`
      );
    }

    const withImposte =
      config.porte?.withImposte === true ||
      config.porte?.withImposte === "true";
    if (withImposte) {
      const pip14Count = profiles.filter((p) => p.ref === "PIP14").length;
      const paip65Count = profiles.filter((p) => p.ref === "PAIP65").length;

      if (pip14Count === 0) {
        warnings.push("Imposte configurée mais aucun profil PIP14 calculé");
      }
      if (paip65Count === 0) {
        warnings.push(
          "Imposte configurée mais aucune parclose PAIP65 calculée"
        );
      }
      if (pip14Count !== paip65Count) {
        warnings.push("Incohérence entre PIP14 et PAIP65");
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  static generateReport(config) {
    const profiles = this.calculatePorteProfiles(config);
    const validation = this.validateProfiles(profiles, config);
    const tableLines = this.formatForTable(profiles);

    const totals = {};
    profiles.forEach((profile) => {
      if (!totals[profile.ref]) {
        totals[profile.ref] = 0;
      }
      totals[profile.ref] += profile.longueur * profile.quantite;
    });

    return {
      config: {
        dimensions: `${config.width}×${config.height}mm`,
        charniereType: config.porte?.charniereType || "visible",
        withTierce: config.porte?.withTierce || false,
        withImposte: config.porte?.withImposte || false,
      },
      profiles,
      validation,
      tableLines,
      totals,
      summary: {
        totalProfiles: profiles.length,
        totalPTCIV51: totals.PTCIV51
          ? `${(totals.PTCIV51 / 1000).toFixed(2)}m`
          : "0m",
        totalPTPV51: totals.PTPV51
          ? `${(totals.PTPV51 / 1000).toFixed(2)}m`
          : "0m",
        totalPATP65: totals.PATP65
          ? `${(totals.PATP65 / 1000).toFixed(2)}m`
          : "0m",
        totalPIP14: totals.PIP14
          ? `${(totals.PIP14 / 1000).toFixed(2)}m`
          : "0m",
        totalPAIP65: totals.PAIP65
          ? `${(totals.PAIP65 / 1000).toFixed(2)}m`
          : "0m",
        totalPOCI53: totals.POCI53
          ? `${(totals.POCI53 / 1000).toFixed(2)}m`
          : "0m",
        totalPO40: totals.PO40 ? `${(totals.PO40 / 1000).toFixed(2)}m` : "0m",
        totalPO66: totals.PO66 ? `${(totals.PO66 / 1000).toFixed(2)}m` : "0m",
        totalTHB40: totals.THB40
          ? `${(totals.THB40 / 1000).toFixed(2)}m`
          : "0m",
        totalTI28: totals.TI28 ? `${(totals.TI28 / 1000).toFixed(2)}m` : "0m",
        totalTI37: totals.TI37 ? `${(totals.TI37 / 1000).toFixed(2)}m` : "0m",
        valid: validation.valid,
      },
    };
  }
}
