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

    // 4. PROFILS DE LA PORTE (POCI53, PO40, PO66)
    const porteOuvranteProfiles = this.calculatePorteOuvranteProfiles(config);
    profiles.push(...porteOuvranteProfiles);

    // 5. TRAVERSES HAUTE ET BASSE DE LA PORTE (THB40)
    const thb40Profiles = this.calculateTHB40Profiles(config);
    profiles.push(...thb40Profiles);

    // 6. TRAVERSES INTERMÉDIAIRES TI28 et TI37
    const traversesIntermediaires = this.calculateTraversesIntermediaires(
      config,
      thb40Profiles
    );
    profiles.push(...traversesIntermediaires);

    // 7. PARCLOSES PATP65 (Reprennent les mêmes longueurs, ajustées si imposte)
    const patp65Profiles = this.calculatePATP65(
      config,
      ptciv51Profiles,
      ptpv51Profiles
    );
    profiles.push(...patp65Profiles);

    return profiles;
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

    // CAS 1: Charnières visibles
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

    // CAS 2: Charnières invisibles SANS tierce
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

    // CAS 3: Imposte (indépendant des charnières)
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

    // Calcul hauteur d'ouverture
    const hauteur = porte?.withImposte
      ? (porte?.porteHeight || 0) + 15 + 51
      : height || 0;

    // Calcul largeur d'ouverture
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
   * Calcule les profils de la porte ouvrante (POCI53, PO40, PO66)
   */
  static calculatePorteOuvranteProfiles(config) {
    const profiles = [];
    const { porte } = config;

    if (!porte) {
      console.log("🔍 Pas de configuration porte");
      return profiles;
    }

    console.log("🚪 Calcul profils porte ouvrante");

    const isVisible = porte.charniereType === "visible";
    const isInvisible = porte.charniereType === "invisible";
    const withTierce = porte.withTierce === true || porte.withTierce === "true";
    const isSerpen35m = porte.serrure === "SERPEN35M";
    const longueurPorte = (porte.porteHeight || 0) - 5;

    console.log("🔍 Conditions porte:", {
      isVisible,
      isInvisible,
      withTierce,
      isSerpen35m,
      longueurPorte,
    });

    // CALCUL POCI53
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
      console.log(
        `🔧 POCI53: ${quantitePOCI53} profil(s) de ${longueurPorte}mm`
      );
    }

    // CALCUL PO40
    let quantitePO40 = 0;

    if (!withTierce) {
      // Sans tierce
      if (isVisible) {
        quantitePO40 = isSerpen35m ? 1 : 2;
      } else if (isInvisible) {
        quantitePO40 = isSerpen35m ? 0 : 1;
      }
    } else {
      // Avec tierce
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
      console.log(`🔧 PO40: ${quantitePO40} profil(s) de ${longueurPorte}mm`);
    }

    // CALCUL PO66
    const quantitePO66 = isSerpen35m ? 1 : 0;

    if (quantitePO66 > 0) {
      profiles.push({
        ref: "PO66",
        description: "Profil ouvrant 66",
        longueur: longueurPorte,
        quantite: quantitePO66,
        category: "structure",
        type: "porte",
      });
      console.log(`🔧 PO66: ${quantitePO66} profil(s) de ${longueurPorte}mm`);
    }

    // Vérification totaux
    const totalProfiles = quantitePOCI53 + quantitePO40 + quantitePO66;
    const expectedTotal = withTierce ? 4 : 2;

    if (totalProfiles !== expectedTotal) {
      console.warn(
        `⚠️ Total profils porte: ${totalProfiles}, attendu: ${expectedTotal}`
      );
    } else {
      console.log(`✅ Total profils porte: ${totalProfiles} (conforme)`);
    }

    return profiles;
  }

  /**
   * Calcule les traverses haute et basse THB40
   */
  static calculateTHB40Profiles(config) {
    const profiles = [];
    const { porte } = config;

    if (!porte) {
      console.log("🔍 Pas de configuration porte pour THB40");
      return profiles;
    }

    console.log("🔧 Calcul traverses THB40");

    const isVisible = porte.charniereType === "visible";
    const isInvisible = porte.charniereType === "invisible";
    const withTierce = porte.withTierce === true || porte.withTierce === "true";
    const isSerpen35m = porte.serrure === "SERPEN35M";
    const porteWidth = porte.porteWidth || 0;
    const tierceWidth = porte.tierceWidth || 0;

    // Collecter les longueurs avec leurs quantités
    const longueurMap = new Map();

    // TRAVERSES DE LA PARTIE PORTE
    let largeurPorteInterne;

    if (isVisible) {
      // Charnières visibles : toujours PO40 à gauche
      if (isSerpen35m) {
        // PO40 (40) + PO66 (66)
        largeurPorteInterne = porteWidth - 40 - 66;
      } else {
        // PO40 (40) + PO40 (40)
        largeurPorteInterne = porteWidth - 40 - 40;
      }
    } else if (isInvisible) {
      // Charnières invisibles : toujours POCI53 à gauche
      if (isSerpen35m) {
        // POCI53 (53) + PO66 (66)
        largeurPorteInterne = porteWidth - 53 - 66;
      } else {
        // POCI53 (53) + PO40 (40)
        largeurPorteInterne = porteWidth - 53 - 40;
      }
    }

    console.log(
      `🔧 THB40 porte: largeur interne = ${porteWidth} - profils = ${largeurPorteInterne}mm`
    );

    // Ajouter 2 traverses pour la partie porte
    const currentQty = longueurMap.get(largeurPorteInterne) || 0;
    longueurMap.set(largeurPorteInterne, currentQty + 2);

    // TRAVERSES DE LA PARTIE TIERCE (si applicable)
    if (withTierce) {
      let largeurTierceInterne;

      if (isVisible) {
        // Charnières visibles : profils PO40 des deux côtés pour la tierce
        largeurTierceInterne = tierceWidth - 40 - 40;
      } else if (isInvisible) {
        // Charnières invisibles : profils POCI53 côté charnière, PO40 côté opposé
        largeurTierceInterne = tierceWidth - 53 - 40;
      }

      console.log(
        `🔧 THB40 tierce: largeur interne = ${tierceWidth} - profils = ${largeurTierceInterne}mm`
      );

      // Ajouter 2 traverses pour la partie tierce
      const currentTierceQty = longueurMap.get(largeurTierceInterne) || 0;
      longueurMap.set(largeurTierceInterne, currentTierceQty + 2);
    }

    // CRÉER LES PROFILS GROUPÉS PAR LONGUEUR
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
        console.log(`🔧 THB40: ${quantite} traverse(s) de ${longueur}mm`);
      }
    });

    // Vérification totaux
    const totalTHB40 = Array.from(longueurMap.values()).reduce(
      (sum, qty) => sum + qty,
      0
    );
    const expectedTHB40 = withTierce ? 4 : 2;

    if (totalTHB40 !== expectedTHB40) {
      console.warn(
        `⚠️ Total traverses THB40: ${totalTHB40}, attendu: ${expectedTHB40}`
      );
    } else {
      console.log(`✅ Total traverses THB40: ${totalTHB40} (conforme)`);
    }

    return profiles;
  }

  /**
   * Calcule les traverses intermédiaires TI28 et TI37
   */
  static calculateTraversesIntermediaires(config, thb40Profiles) {
    const profiles = [];
    const { traversesPorte } = config;

    if (!traversesPorte || traversesPorte.length === 0) {
      console.log("🔍 Aucune traverse intermédiaire configurée");
      return profiles;
    }

    console.log("🔧 Calcul traverses intermédiaires TI28/TI37");

    // Déterminer les longueurs porte et tierce depuis THB40
    let longueurPorteTHB40 = 0;
    let longueurTierceTHB40 = 0;

    // Pour déterminer quelle longueur correspond à la porte vs tierce,
    // on utilise la logique inverse de calculateTHB40Profiles
    const { porte } = config;
    const isVisible = porte.charniereType === "visible";
    const isSerpen35m = porte.serrure === "SERPEN35M";
    const porteWidth = porte.porteWidth || 0;
    const tierceWidth = porte.tierceWidth || 0;
    const withTierce = porte.withTierce === true || porte.withTierce === "true";

    // Calculer la longueur attendue pour la porte
    if (isVisible) {
      longueurPorteTHB40 = isSerpen35m
        ? porteWidth - 40 - 66
        : porteWidth - 40 - 40;
    } else {
      longueurPorteTHB40 = isSerpen35m
        ? porteWidth - 53 - 66
        : porteWidth - 53 - 40;
    }

    // Calculer la longueur attendue pour la tierce (si applicable)
    if (withTierce) {
      if (isVisible) {
        longueurTierceTHB40 = tierceWidth - 40 - 40;
      } else {
        longueurTierceTHB40 = tierceWidth - 53 - 40;
      }
    }

    console.log(
      `📐 Longueurs THB40 calculées - Porte: ${longueurPorteTHB40}mm, Tierce: ${longueurTierceTHB40}mm`
    );

    // Grouper les traverses par référence et longueur
    const traversesMap = new Map();

    traversesPorte.forEach((traverse) => {
      const { type, onPorte, onTierce } = traverse;
      const ref = type === "28" ? "TI28" : "TI37";

      // Déterminer la longueur selon l'emplacement
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

        console.log(
          `🔧 ${ref}: +1 traverse de ${longueur}mm (${
            onPorte ? "porte" : "tierce"
          })`
        );
      }
    });

    // Créer les profils
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
      console.log(
        `🔧 ${traverse.ref}: ${traverse.quantite} traverse(s) de ${traverse.longueur}mm`
      );
    });

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

    // Vérification spécifique profils porte
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

    // Vérification spécifique traverses THB40
    const thb40Count = profiles
      .filter((p) => p.ref === "THB40")
      .reduce((sum, p) => sum + p.quantite, 0);
    const expectedTHB40 = withTierce ? 4 : 2;

    if (thb40Count !== expectedTHB40) {
      warnings.push(
        `Total traverses THB40 incorrect: ${thb40Count}, attendu: ${expectedTHB40}`
      );
    }

    // Vérification spécifique traverses intermédiaires
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
