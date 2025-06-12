// ===== js/calculations/GlassCalculator.js =====
export class GlassCalculator {
  /**
   * Calcule tous les remplissages pour une configuration
   * @param {Object} config - Configuration complète
   * @returns {Array} Liste des remplissages avec dimensions et surfaces
   */
  static calculateGlass(config) {
    const glass = [];

    console.log("🔧 Calcul des remplissages");

    // 1. REMPLISSAGES VERRIÈRE (modules fixes)
    const verriereGlass = this.calculateVerriereGlass(config);
    glass.push(...verriereGlass);

    // 2. REMPLISSAGE IMPOSTE (si porte avec imposte)
    const imposteGlass = this.calculateImposteGlass(config);
    if (imposteGlass) {
      glass.push(imposteGlass);
    }

    // 3. REMPLISSAGES PORTE ET TIERCE
    const porteGlass = this.calculatePorteGlass(config);
    glass.push(...porteGlass);

    return glass;
  }

  /**
   * Calcule les remplissages de la verrière (modules fixes)
   */
  static calculateVerriereGlass(config) {
    const { modules, height, type, porteIndex, traverses, options } = config;
    const glass = [];

    console.log("📐 Calcul remplissages verrière");

    // Récupérer les paramètres du remplissage
    const epaisseur = options?.remplissageEp || 6;
    const refRemplissage = epaisseur === 8 ? "REMPLISSAGE-8" : "REMPLISSAGE-6";

    // Pour chaque module
    modules.forEach((module, index) => {
      const moduleNumber = index + 1;
      const isPorteModule = type === "porte" && moduleNumber === porteIndex;

      // Ignorer le module porte (traité séparément)
      if (isPorteModule) {
        console.log(`⏭️ Module ${moduleNumber} (porte) - ignoré`);
        return;
      }

      console.log(`\n📦 Module ${moduleNumber} (fixe)`);

      // Largeur du remplissage
      const largeurRemplissage = module.width + 19;
      console.log(`📏 Largeur: ${module.width} + 19 = ${largeurRemplissage}mm`);

      // Trouver les traverses qui concernent ce module
      const traversesModule = this.getTraversesForModule(
        traverses,
        moduleNumber
      );
      console.log(
        `🔧 Traverses sur module ${moduleNumber}:`,
        traversesModule.map((t) => `${t.height}mm`)
      );

      // Calculer les hauteurs des remplissages
      const hauteurs = this.calculateHeights(height, traversesModule);
      console.log(`📏 Hauteurs calculées:`, hauteurs);

      // Créer les remplissages pour ce module
      hauteurs.forEach((hauteur, remplissageIndex) => {
        const surface = this.calculateSurface(largeurRemplissage, hauteur);

        glass.push({
          ref: refRemplissage,
          description: `Remplissage ${epaisseur}mm`,
          epaisseur: `${epaisseur}mm`,
          dimensions: `${hauteur}mm × ${largeurRemplissage}mm`,
          surface: surface,
          unitPrice: 0, // Prix à définir plus tard
          totalPrice: 0,
          category: "remplissage",
          details: {
            module: moduleNumber,
            remplissageIndex: remplissageIndex + 1,
            width: largeurRemplissage,
            height: hauteur,
          },
        });

        console.log(
          `✅ Remplissage ${
            remplissageIndex + 1
          }: ${hauteur}mm × ${largeurRemplissage}mm = ${surface}m²`
        );
      });
    });

    return glass;
  }

  /**
   * Trouve les traverses qui concernent un module donné
   * @param {Array} traverses - Liste des traverses principales
   * @param {number} moduleNumber - Numéro du module (1-based)
   * @returns {Array} Traverses triées par hauteur croissante
   */
  static getTraversesForModule(traverses, moduleNumber) {
    if (!traverses || traverses.length === 0) {
      return [];
    }

    const traversesModule = traverses.filter(
      (traverse) => traverse.modules && traverse.modules.includes(moduleNumber)
    );

    // Trier par hauteur croissante
    return traversesModule.sort((a, b) => a.height - b.height);
  }

  /**
   * Calcule les hauteurs des remplissages selon les traverses
   * @param {number} totalHeight - Hauteur totale (HT)
   * @param {Array} traverses - Traverses triées par hauteur
   * @returns {Array<number>} Hauteurs des remplissages
   */
  static calculateHeights(totalHeight, traverses) {
    const HT = totalHeight;
    const hauteurs = [];

    if (traverses.length === 0) {
      // Aucune traverse : un seul remplissage
      const h = HT - 61;
      hauteurs.push(h);
      console.log(`📏 Aucune traverse: h = ${HT} - 61 = ${h}mm`);
    } else {
      // Avec traverses : découpage en sections
      for (let i = 0; i < traverses.length; i++) {
        const hTi = traverses[i].height;

        if (i === 0) {
          // Premier remplissage (du bas jusqu'à la première traverse)
          const h1 = hTi - 30.5;
          hauteurs.push(h1);
          console.log(`📏 h1 = ${hTi} - 30.5 = ${h1}mm`);
        } else {
          // Remplissages intermédiaires (entre deux traverses)
          const hTprev = traverses[i - 1].height;
          const hi = hTi - hTprev - 30.5;
          hauteurs.push(hi);
          console.log(`📏 h${i + 1} = ${hTi} - ${hTprev} - 30.5 = ${hi}mm`);
        }
      }

      // Dernier remplissage (de la dernière traverse jusqu'en haut)
      const hTn = traverses[traverses.length - 1].height;
      const hn = HT - hTn - 61;
      hauteurs.push(hn);
      console.log(`📏 hn+ = ${HT} - ${hTn} - 61 = ${hn}mm`);
    }

    // Filtrer les hauteurs négatives ou nulles
    return hauteurs.filter((h) => h > 0);
  }

  /**
   * Calcule le remplissage de l'imposte (si porte avec imposte)
   */
  static calculateImposteGlass(config) {
    // Vérifier les conditions pour l'imposte
    if (config.type !== "porte") {
      console.log("❌ Pas de porte, aucun remplissage imposte");
      return null;
    }

    const withImposte =
      config.porte?.withImposte === true ||
      config.porte?.withImposte === "true";
    if (!withImposte) {
      console.log("❌ Pas d'imposte, aucun remplissage imposte");
      return null;
    }

    console.log("🔧 Calcul remplissage imposte");

    // Récupérer le module de la porte
    const porteIndex = config.porteIndex;
    const modulePorteIndex = porteIndex - 1; // porteIndex est 1-based
    const modulePorte = config.modules[modulePorteIndex];

    if (!modulePorte) {
      console.error(`❌ Module porte (index ${modulePorteIndex}) non trouvé`);
      return null;
    }

    // Calculer les dimensions d'ouverture
    const dimensionsOuverture = this.calculateDimensionsOuverture(config);

    // Calcul des dimensions du remplissage imposte
    const largeurImposte = modulePorte.width + 19;
    const hauteurImposte = config.height - dimensionsOuverture.hauteur - 21;

    console.log(
      `📐 Module porte ${porteIndex}: largeur = ${modulePorte.width}mm`
    );
    console.log(
      `📐 Dimensions ouverture: ${dimensionsOuverture.hauteur}mm × ${dimensionsOuverture.largeur}mm`
    );
    console.log(
      `📏 Imposte: largeur = ${modulePorte.width} + 19 = ${largeurImposte}mm`
    );
    console.log(
      `📏 Imposte: hauteur = ${config.height} - ${dimensionsOuverture.hauteur} - 21 = ${hauteurImposte}mm`
    );

    // Vérifier que les dimensions sont valides
    if (hauteurImposte <= 0 || largeurImposte <= 0) {
      console.warn(
        `⚠️ Dimensions imposte invalides: ${hauteurImposte}mm × ${largeurImposte}mm`
      );
      return null;
    }

    // Paramètres du remplissage
    const epaisseur = config.options?.remplissageEp || 6;
    const refRemplissage = epaisseur === 8 ? "REMPLISSAGE-8" : "REMPLISSAGE-6";
    const surface = this.calculateSurface(largeurImposte, hauteurImposte);

    const imposteGlass = {
      ref: refRemplissage,
      description: `Remplissage ${epaisseur}mm`,
      epaisseur: `${epaisseur}mm`,
      dimensions: `${hauteurImposte}mm × ${largeurImposte}mm`,
      surface: surface,
      unitPrice: 0, // Prix à définir plus tard
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

    console.log(
      `✅ Remplissage imposte: ${hauteurImposte}mm × ${largeurImposte}mm = ${surface}m²`
    );

    return imposteGlass;
  }

  /**
   * Calcule les remplissages de la porte et de la tierce
   */
  static calculatePorteGlass(config) {
    if (config.type !== "porte") {
      return [];
    }

    const glass = [];
    const { porte, options } = config;

    console.log("🚪 Calcul remplissages porte et tierce");

    // Paramètres du remplissage
    const epaisseur = options?.remplissageEp || 6;
    const refRemplissage = epaisseur === 8 ? "REMPLISSAGE-8" : "REMPLISSAGE-6";

    // 1. REMPLISSAGES DE LA PORTE
    const porteRemplissages = this.calculatePorteRemplissages(
      config,
      refRemplissage,
      epaisseur
    );
    glass.push(...porteRemplissages);

    // 2. REMPLISSAGES DE LA TIERCE (si applicable)
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

  /**
   * Calcule les remplissages de la porte
   */
  static calculatePorteRemplissages(config, refRemplissage, epaisseur) {
    const { porte, traversesPorte } = config;
    const glass = [];

    console.log("📐 Calcul remplissages porte");

    // Déterminer les profils de la porte
    const profilsPorte = this.determineProfilsPorte(porte);
    console.log(
      `🔧 Profils porte: ${profilsPorte.gauche}-${profilsPorte.droite}`
    );

    // Calculer la largeur du remplissage
    const largeurRemplissage = this.calculatePorteGlassWidth(
      porte.porteWidth,
      profilsPorte
    );
    console.log(`📏 Largeur remplissage porte: ${largeurRemplissage}mm`);

    // Trouver les traverses qui concernent la porte
    const traversesPorteOnly = this.getTraversesPorteForLocation(
      traversesPorte,
      true,
      false
    );
    console.log(
      `🔧 Traverses sur porte:`,
      traversesPorteOnly.map((t) => `${t.height}mm (${t.type}mm)`)
    );

    // Calculer les hauteurs des remplissages
    const hauteurs = this.calculatePorteHeights(
      porte.porteHeight,
      traversesPorteOnly
    );
    console.log(`📏 Hauteurs calculées porte:`, hauteurs);

    // Créer les remplissages pour la porte
    hauteurs.forEach((hauteur, remplissageIndex) => {
      const surface = this.calculateSurface(largeurRemplissage, hauteur);

      glass.push({
        ref: refRemplissage,
        description: `Remplissage ${epaisseur}mm`,
        epaisseur: `${epaisseur}mm`,
        dimensions: `${hauteur}mm × ${largeurRemplissage}mm`,
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

      console.log(
        `✅ Remplissage porte ${
          remplissageIndex + 1
        }: ${hauteur}mm × ${largeurRemplissage}mm = ${surface}m²`
      );
    });

    return glass;
  }

  /**
   * Calcule les remplissages de la tierce
   */
  static calculateTierceRemplissages(config, refRemplissage, epaisseur) {
    const { porte, traversesPorte } = config;
    const glass = [];

    console.log("📐 Calcul remplissages tierce");

    // Déterminer les profils de la tierce
    const profilsTierce = this.determineProfilsTierce(porte);
    console.log(
      `🔧 Profils tierce: ${profilsTierce.gauche}-${profilsTierce.droite}`
    );

    // Calculer la largeur du remplissage
    const largeurRemplissage = this.calculateTierceGlassWidth(
      porte.tierceWidth,
      profilsTierce
    );
    console.log(`📏 Largeur remplissage tierce: ${largeurRemplissage}mm`);

    // Trouver les traverses qui concernent la tierce
    const traversesTierceOnly = this.getTraversesPorteForLocation(
      traversesPorte,
      false,
      true
    );
    console.log(
      `🔧 Traverses sur tierce:`,
      traversesTierceOnly.map((t) => `${t.height}mm (${t.type}mm)`)
    );

    // Calculer les hauteurs des remplissages
    const hauteurs = this.calculatePorteHeights(
      porte.porteHeight,
      traversesTierceOnly
    );
    console.log(`📏 Hauteurs calculées tierce:`, hauteurs);

    // Créer les remplissages pour la tierce
    hauteurs.forEach((hauteur, remplissageIndex) => {
      const surface = this.calculateSurface(largeurRemplissage, hauteur);

      glass.push({
        ref: refRemplissage,
        description: `Remplissage ${epaisseur}mm`,
        epaisseur: `${epaisseur}mm`,
        dimensions: `${hauteur}mm × ${largeurRemplissage}mm`,
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

      console.log(
        `✅ Remplissage tierce ${
          remplissageIndex + 1
        }: ${hauteur}mm × ${largeurRemplissage}mm = ${surface}m²`
      );
    });

    return glass;
  }

  /**
   * Détermine les profils de la porte
   */
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

  /**
   * Détermine les profils de la tierce
   */
  static determineProfilsTierce(porte) {
    const charniereType = porte?.charniereType || "visible";

    if (charniereType === "visible") {
      return { gauche: 40, droite: 40 }; // 40-40
    } else {
      // invisible
      return { gauche: 53, droite: 40 }; // 53-40
    }
  }

  /**
   * Calcule la largeur du remplissage de la porte
   */
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

    console.warn(`⚠️ Profils porte non reconnus: ${gauche}-${droite}`);
    return porteWidth - 63; // Fallback
  }

  /**
   * Calcule la largeur du remplissage de la tierce
   */
  static calculateTierceGlassWidth(tierceWidth, profils) {
    const { gauche, droite } = profils;

    if (gauche === 40 && droite === 40) {
      return tierceWidth - 63;
    } else if (gauche === 53 && droite === 40) {
      return tierceWidth - 76;
    }

    console.warn(`⚠️ Profils tierce non reconnus: ${gauche}-${droite}`);
    return tierceWidth - 63; // Fallback
  }

  /**
   * Trouve les traverses porte pour un emplacement donné
   */
  static getTraversesPorteForLocation(traversesPorte, onPorte, onTierce) {
    if (!traversesPorte || traversesPorte.length === 0) {
      return [];
    }

    const traversesFiltered = traversesPorte.filter((traverse) => {
      return (onPorte && traverse.onPorte) || (onTierce && traverse.onTierce);
    });

    // Trier par hauteur croissante
    return traversesFiltered.sort((a, b) => a.height - b.height);
  }

  /**
   * Calcule les hauteurs des remplissages de porte selon les traverses
   */
  static calculatePorteHeights(porteHeight, traverses) {
    const HP = porteHeight;
    const hauteurs = [];

    if (traverses.length === 0) {
      // Aucune traverse : un seul remplissage
      const h = HP - 66;
      hauteurs.push(h);
      console.log(`📏 Aucune traverse porte: h = ${HP} - 66 = ${h}mm`);
    } else {
      // Avec traverses : découpage en sections selon le type
      for (let i = 0; i < traverses.length; i++) {
        const traverse = traverses[i];
        const Hi = traverse.height;
        const type = traverse.type;

        if (i === 0) {
          // Premier remplissage (du bas jusqu'à la première traverse)
          let h1;
          if (type === "28") {
            h1 = Hi - 32;
          } else {
            // type === "37"
            h1 = Hi - 32;
          }
          hauteurs.push(h1);
          console.log(
            `📏 h1 (${type}mm) = ${Hi} - ${type === "28" ? 32 : 52} = ${h1}mm`
          );
        } else {
          // Remplissages intermédiaires (entre deux traverses)
          const Hprev = traverses[i - 1].height;
          let hi;
          if (type === "28") {
            hi = Hi - Hprev - 10;
          } else {
            // type === "37"
            hi = Hi - Hprev - 18;
          }
          hauteurs.push(hi);
          console.log(
            `📏 h${i + 1} (${type}mm) = ${Hi} - ${Hprev} - ${
              type === "28" ? 10 : 18
            } = ${hi}mm`
          );
        }
      }

      // Dernier remplissage (de la dernière traverse jusqu'en haut)
      const lastTraverse = traverses[traverses.length - 1];
      const Hn = lastTraverse.height;
      const lastType = lastTraverse.type;
      let hn;
      if (lastType === "28") {
        hn = HP - Hn - 44;
      } else {
        // lastType === "37"
        hn = HP - Hn - 52;
      }
      hauteurs.push(hn);
      console.log(
        `📏 hn+ (${lastType}mm) = ${HP} - ${Hn} - ${
          lastType === "28" ? 44 : 52
        } = ${hn}mm`
      );
    }

    // Filtrer les hauteurs négatives ou nulles
    return hauteurs.filter((h) => h > 0);
  }
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

  static calculateSurface(width, height) {
    const widthM = width / 1000;
    const heightM = height / 1000;
    const surface = widthM * heightM;
    return Math.round(surface * 100) / 100; // Arrondi à 2 décimales
  }

  /**
   * Formate les remplissages pour affichage dans les tableaux
   * @param {Array} glass - Remplissages calculés
   * @returns {Array} Lignes formatées pour le tableau
   */
  static formatForTable(glass) {
    // Regrouper les remplissages par dimensions identiques
    const groupedGlass = new Map();

    glass.forEach((g) => {
      const key = `${g.epaisseur}_${g.dimensions}`;

      if (groupedGlass.has(key)) {
        // Remplissage existant : incrémenter la quantité
        const existing = groupedGlass.get(key);
        existing.quantity += 1;
        existing.surface += g.surface;
        existing.totalPrice = existing.quantity * existing.unitPrice;

        // Ajouter les détails pour traçabilité
        existing.details.modules.push(g.details.module);
        existing.details.remplissageIndexes.push(g.details.remplissageIndex);
      } else {
        // Nouveau remplissage : créer l'entrée
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

    // Convertir la Map en Array et trier par dimensions (hauteur puis largeur)
    const result = Array.from(groupedGlass.values()).sort((a, b) => {
      // Extraire hauteur et largeur des dimensions "hauteur mm × largeur mm"
      const [hauteurA, largeurA] = a.dimensions
        .split(" × ")
        .map((d) => parseInt(d));
      const [hauteurB, largeurB] = b.dimensions
        .split(" × ")
        .map((d) => parseInt(d));

      // Trier par hauteur puis par largeur
      if (hauteurA !== hauteurB) {
        return hauteurA - hauteurB;
      }
      return largeurA - largeurB;
    });

    console.log(
      `📊 Remplissages regroupés: ${glass.length} → ${result.length} lignes`
    );
    result.forEach((r) => {
      console.log(
        `  ${r.dimensions} × ${r.quantity} = ${r.surface.toFixed(
          2
        )}m² (modules: ${r.details.modules.join(", ")})`
      );
    });

    return result;
  }

  /**
   * Valide la cohérence des remplissages calculés
   * @param {Array} glass - Remplissages calculés
   * @param {Object} config - Configuration
   * @returns {{valid: boolean, warnings: Array<string>}}
   */
  static validateGlass(glass, config) {
    const warnings = [];

    // Vérifier les surfaces négatives
    const negativeSurface = glass.find((g) => g.surface <= 0);
    if (negativeSurface) {
      warnings.push(
        `Surface négative ou nulle détectée: ${negativeSurface.ref}`
      );
    }

    // Vérifier les dimensions aberrantes
    glass.forEach((g) => {
      if (g.details) {
        if (g.details.width < 50 || g.details.width > 2500) {
          warnings.push(
            `Largeur aberrante: ${g.details.width}mm pour module ${g.details.module}`
          );
        }
        if (g.details.height < 50 || g.details.height > 4000) {
          warnings.push(
            `Hauteur aberrante: ${g.details.height}mm pour module ${g.details.module}`
          );
        }
      }
    });

    // Vérifier cohérence nombre modules vs remplissages
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

  /**
   * Génère un rapport complet des remplissages
   * @param {Object} config - Configuration
   * @returns {Object} Rapport détaillé
   */
  static generateReport(config) {
    const glass = this.calculateGlass(config);
    const validation = this.validateGlass(glass, config);
    const tableLines = this.formatForTable(glass);

    // Calcul des totaux
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
