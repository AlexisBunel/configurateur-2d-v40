// ===== js/calculations/PorteProfilesCalculator.js =====
export class PorteProfilesCalculator {
  /**
   * Calcule tous les profils spécifiques à la porte
   * @param {Object} config - Configuration complète
   * @returns {Array} Liste des profils avec longueurs et quantités
   */
  static calculatePorteProfiles(config) {
    const profiles = [];

    // Vérifier qu'on a bien une porte
    if (config.type !== "porte") {
      return profiles;
    }

    console.log("🚪 Calcul des profils de porte");

    // 1. PROFILS PTCIV51 (Charnières invisibles)
    const ptciv51Profiles = this.calculatePTCIV51(config);
    profiles.push(...ptciv51Profiles);

    // 2. PROFILS PTPV51 (Charnières visibles + imposte)
    const ptpv51Profiles = this.calculatePTPV51(config);
    profiles.push(...ptpv51Profiles);

    // 3. PROFILS IMPOSTE PIP14 et PAIP65 (si imposte)
    const imposteProfiles = this.calculateImposteProfiles(config);
    profiles.push(...imposteProfiles);

    // 4. PARCLOSES PATP65 (Reprennent les mêmes longueurs, ajustées si imposte)
    const patp65Profiles = this.calculatePATP65(
      config,
      ptciv51Profiles,
      ptpv51Profiles
    );
    profiles.push(...patp65Profiles);

    return profiles;
  }

  /**
   * Calcule les profils d'imposte PIP14 et PAIP65
   */
  static calculateImposteProfiles(config) {
    const profiles = [];
    const withImposte =
      config.porte?.withImposte === true ||
      config.porte?.withImposte === "true";

    if (!withImposte) {
      console.log("🔍 Pas d'imposte, aucun profil PIP14/PAIP65");
      return profiles;
    }

    console.log("🔧 Calcul profils imposte PIP14 et PAIP65");

    // Calculer les dimensions d'ouverture
    const dimensionsOuverture = this.calculateDimensionsOuverture(config);
    const longueurImposte = config.height - dimensionsOuverture.hauteur;

    console.log(
      `📐 Longueur imposte: ${config.height} - ${dimensionsOuverture.hauteur} = ${longueurImposte}mm`
    );

    // Profil imposte PIP14
    profiles.push({
      ref: "PIP14",
      description: "Profil imposte",
      longueur: longueurImposte,
      quantite: 2,
      category: "structure",
      type: "imposte",
    });

    // Parclose imposte PAIP65
    profiles.push({
      ref: "PAIP65",
      description: "Parclose imposte",
      longueur: longueurImposte,
      quantite: 2,
      category: "parclose",
      type: "imposte",
    });

    console.log(`🔧 PIP14: 2 profils de ${longueurImposte}mm`);
    console.log(`🔧 PAIP65: 2 parcloses de ${longueurImposte}mm`);

    return profiles;
  }

  /**
   * Calcule les dimensions d'ouverture (copie de PorteCalculator pour éviter dépendance circulaire)
   */
  static calculateDimensionsOuverture(config) {
    if (config.type !== "porte") {
      return { hauteur: 0, largeur: 0, hasOuverture: false };
    }

    const { porte, height } = config;

    // ===== Calcul hauteur d'ouverture =====
    const hauteur = porte?.withImposte
      ? (porte?.porteHeight || 0) + 15 + 51
      : height || 0;

    // ===== Calcul largeur d'ouverture =====
    const porteWidth = porte?.porteWidth || 0;
    const charniereOffset = porte?.charniereType === "invisible" ? 6 : 10;
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";

    // Largeur de base : porte + profilés + charnière
    let largeur = porteWidth + 102 + charniereOffset;

    // Ajouter tierce si nécessaire
    if (withTierce) {
      largeur += (porte?.tierceWidth || 0) + 5;
    }

    return {
      hauteur: Math.round(hauteur),
      largeur: Math.round(largeur),
      hasOuverture: true,
    };
  }

  /**
   * Calcule les profils PTCIV51 (charnières invisibles)
   */
  static calculatePTCIV51(config) {
    const profiles = [];
    const { height, porte } = config;

    // Conditions pour PTCIV51
    const isInvisible = porte?.charniereType === "invisible";
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";

    if (!isInvisible) {
      console.log("🔍 PTCIV51: Charnières visibles, aucun profil PTCIV51");
      return profiles;
    }

    // Quantité selon la tierce
    const quantite = withTierce ? 2 : 1;

    console.log(
      `🔧 PTCIV51: Charnières invisibles, ${
        withTierce ? "avec" : "sans"
      } tierce → ${quantite} profil(s)`
    );

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

  /**
   * Calcule les profils PTPV51 (charnières visibles + imposte)
   */
  static calculatePTPV51(config) {
    const profiles = [];
    const { height, porte, modules, porteIndex } = config;

    const isVisible = porte?.charniereType === "visible";
    const isInvisible = porte?.charniereType === "invisible";
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";
    const withImposte =
      porte?.withImposte === true || porte?.withImposte === "true";

    console.log("🔍 PTPV51 - Conditions:", {
      isVisible,
      isInvisible,
      withTierce,
      withImposte,
    });

    // ===== CAS 1: Charnières visibles =====
    if (isVisible) {
      const quantite = 2; // Toujours 2 pour charnières visibles
      console.log(
        `🔧 PTPV51: Charnières visibles → ${quantite} profils de ${height}mm`
      );

      profiles.push({
        ref: "PTPV51",
        description: "Profil traverse paumelles visibles",
        longueur: height,
        quantite: quantite,
        category: "structure",
        type: "dormant",
      });
    }

    // ===== CAS 2: Charnières invisibles SANS tierce =====
    if (isInvisible && !withTierce) {
      const quantite = 1;
      console.log(
        `🔧 PTPV51: Charnières invisibles sans tierce → ${quantite} profil de ${height}mm`
      );

      profiles.push({
        ref: "PTPV51",
        description: "Profil traverse paumelles visibles",
        longueur: height,
        quantite: quantite,
        category: "structure",
        type: "dormant",
      });
    }

    // ===== CAS 3: Imposte (indépendant des charnières) =====
    if (withImposte) {
      // Récupérer la largeur du module porte
      const modulePorteIndex = porteIndex - 1; // porteIndex est 1-based
      const modulePorte = modules?.[modulePorteIndex];

      if (modulePorte && modulePorte.width) {
        const longueurImposte = modulePorte.width;
        console.log(
          `🔧 PTPV51: Imposte → 1 profil de ${longueurImposte}mm (largeur module ${porteIndex})`
        );

        profiles.push({
          ref: "PTPV51",
          description: "Profil traverse paumelles visibles (imposte)",
          longueur: longueurImposte,
          quantite: 1,
          category: "structure",
          type: "dormant",
        });
      } else {
        console.warn(
          `⚠️ Module porte (index ${modulePorteIndex}) non trouvé pour imposte`
        );
      }
    }

    return profiles;
  }

  /**
   * Calcule les parcloses PATP65 (reprennent les longueurs des PTCIV51 + PTPV51)
   */
  static calculatePATP65(config, ptciv51Profiles, ptpv51Profiles) {
    const profiles = [];
    const withImposte =
      config.porte?.withImposte === true ||
      config.porte?.withImposte === "true";

    console.log("🔧 PATP65: Génération des parcloses");

    // Collecter toutes les longueurs des profils PTCIV51 et PTPV51
    const allProfiles = [...ptciv51Profiles, ...ptpv51Profiles];

    // Grouper par longueur pour additionner les quantités
    const longueurMap = new Map();

    allProfiles.forEach((profile) => {
      let longueur = profile.longueur;

      // CAS SPÉCIAL IMPOSTE : Ajuster les longueurs qui correspondent à la hauteur totale
      if (withImposte && longueur === config.height) {
        // Calculer les dimensions d'ouverture pour obtenir la hauteur de l'ouverture
        const dimensionsOuverture = this.calculateDimensionsOuverture(config);
        longueur = dimensionsOuverture.hauteur;
        console.log(
          `🔧 PATP65 avec imposte: Longueur ajustée de ${config.height}mm à ${longueur}mm`
        );
      }

      const quantiteActuelle = longueurMap.get(longueur) || 0;
      longueurMap.set(longueur, quantiteActuelle + profile.quantite);
    });

    // Créer les profils PATP65
    longueurMap.forEach((quantite, longueur) => {
      console.log(`🔧 PATP65: ${quantite} parclose(s) de ${longueur}mm`);

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

  /**
   * Formate les profils pour les tableaux
   */
  static formatForTable(profiles) {
    return profiles.map((profile) => ({
      ref: profile.ref,
      description: profile.description,
      length: profile.longueur,
      quantity: profile.quantite,
      unitPrice: 0, // Prix à définir plus tard
      totalPrice: 0, // Prix à définir plus tard
      category: profile.category,
      details: {
        type: profile.type,
        originalDetails: {},
      },
    }));
  }

  /**
   * Valide la cohérence des profils calculés
   */
  static validateProfiles(profiles, config) {
    const warnings = [];

    // Vérifier les longueurs négatives
    const negativeLength = profiles.find((p) => p.longueur <= 0);
    if (negativeLength) {
      warnings.push(`Longueur négative ou nulle: ${negativeLength.ref}`);
    }

    // Vérifier les quantités
    const zeroQuantity = profiles.find((p) => p.quantite <= 0);
    if (zeroQuantity) {
      warnings.push(`Quantité nulle: ${zeroQuantity.ref}`);
    }

    // Vérifier cohérence PTCIV51/PTPV51 vs PATP65 (ajusté pour imposte)
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

    // Vérification spécifique imposte
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

  /**
   * Génère un rapport complet des profils de porte
   */
  static generateReport(config) {
    const profiles = this.calculatePorteProfiles(config);
    const validation = this.validateProfiles(profiles, config);
    const tableLines = this.formatForTable(profiles);

    // Calcul des totaux par type
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
        valid: validation.valid,
      },
    };
  }
}
