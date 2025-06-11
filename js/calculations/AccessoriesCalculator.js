import { References } from "../data/References.js";

export class AccessoriesCalculator {
  /**
   * Calcule tous les accessoires pour une configuration
   * @param {Object} config - Configuration complète
   * @returns {Array} Liste des accessoires avec quantités et longueurs
   */
  static calculateAccessories(config) {
    const accessories = [];

    console.log("🔧 Calcul des accessoires");

    // 1. ÉQUERRES EQUER100
    const equerres = this.calculateEQUER100(config);
    if (equerres.quantity > 0) {
      accessories.push(equerres);
    }

    const clips = this.calculateCLIPV30(config);
    if (clips.quantity > 0) {
      accessories.push(clips);
    }

    const cales = this.calculateCALE4(config);
    if (cales.quantity > 0) {
      accessories.push(cales);
    }

    const jtpe48 = this.calculateJTPE48(config);
    if (jtpe48) {
      accessories.push(jtpe48);
    }

    const jrlp47 = this.calculateJRLP47(config);
    if (jrlp47) {
      accessories.push(jrlp47);
    }

    return accessories;
  }

  /**
   * Calcule les équerres EQUER100
   * @param {Object} config - Configuration
   * @returns {Object} Données de l'équerre
   */
  static calculateEQUER100(config) {
    const { modules, traverses, type, porte } = config;
    let totalQuantity = 0;

    console.log("🔧 Calcul EQUER100");

    // Pour chaque module
    modules.forEach((module, index) => {
      const moduleNumber = index + 1;
      const isPorteModule =
        type === "porte" && moduleNumber === config.porteIndex;

      if (!isPorteModule) {
        // MODULE FIXE : (nombre de traverses + 1) * 4
        const traversesOnModule = this.countTraversesOnModule(
          traverses,
          moduleNumber
        );
        const moduleQuantity = (traversesOnModule + 1) * 4;
        totalQuantity += moduleQuantity;

        console.log(
          `📐 Module ${moduleNumber} (fixe): ${traversesOnModule} traverses → (${traversesOnModule} + 1) × 4 = ${moduleQuantity} équerres`
        );
      }
    });

    // MODULE PORTE : Bonus selon les options
    if (type === "porte") {
      let porteBonus = 0;

      if (porte?.withImposte === true || porte?.withImposte === "true") {
        porteBonus = 6;
        console.log("🚪 Module porte avec imposte: +6 équerres");
      } else if (porte?.withDormant === true || porte?.withDormant === "true") {
        porteBonus = 2;
        console.log("🚪 Module porte avec dormant: +2 équerres");
      } else {
        porteBonus = 0;
        console.log("🚪 Module porte sans dormant: +0 équerres");
      }

      totalQuantity += porteBonus;
    }

    console.log(`✅ Total EQUER100: ${totalQuantity} équerres`);

    return {
      ref: "EQUER100",
      description: "Équerres 100x100",
      quantity: totalQuantity,
      length: null, // Pas de longueur pour les équerres
      unitPrice: 0, // Prix à définir plus tard
      totalPrice: 0, // Prix à définir plus tard
      category: "quincaillerie",
      finition: "-",
    };
  }

  /**
   * Compte le nombre de traverses qui concernent un module donné
   * @param {Array} traverses - Liste des traverses
   * @param {number} moduleNumber - Numéro du module (1-based)
   * @returns {number} Nombre de traverses
   */
  static countTraversesOnModule(traverses, moduleNumber) {
    if (!traverses || traverses.length === 0) {
      return 0;
    }

    return traverses.filter(
      (traverse) => traverse.modules && traverse.modules.includes(moduleNumber)
    ).length;
  }

  static calculateCALE4(config) {
    const { modules, traverses, type } = config;
    let totalQuantity = 0;

    console.log("🔧 Calcul CALE4");

    // Pour chaque module
    modules.forEach((module, index) => {
      const moduleNumber = index + 1;
      const isPorteModule =
        type === "porte" && moduleNumber === config.porteIndex;

      if (!isPorteModule) {
        // MODULE FIXE : (nombre de traverses * 2) + 2
        const traversesOnModule = this.countTraversesOnModule(
          traverses,
          moduleNumber
        );
        const moduleQuantity = traversesOnModule * 2 + 2;
        totalQuantity += moduleQuantity;

        console.log(
          `📐 Module ${moduleNumber} (fixe): ${traversesOnModule} traverses → (${traversesOnModule} × 2) + 2 = ${moduleQuantity} cales`
        );
      }
    });

    // MODULE PORTE : Bonus si imposte
    if (type === "porte") {
      const porteBonus =
        config.porte?.withImposte === true ||
        config.porte?.withImposte === "true"
          ? 2
          : 0;
      totalQuantity += porteBonus;

      if (porteBonus > 0) {
        console.log("🚪 Module porte avec imposte: +2 cales");
      } else {
        console.log("🚪 Module porte sans imposte: +0 cales");
      }
    }

    console.log(`✅ Total CALE4: ${totalQuantity} cales`);

    return {
      ref: "CALE4",
      description: "Cale 4mm",
      quantity: totalQuantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: null,
    };
  }

  static calculateCLIPV30(config) {
    console.log("🔧 Calcul CLIPV30");

    // Calcul synchrone : recalculer directement les parcloses
    let totalParcloseLength = 0;

    // 1. PARCLOSES PAC40 (cadre)
    const pac40Length = this.calculatePAC40Length(config);
    totalParcloseLength += pac40Length;
    console.log(`📏 PAC40 total: ${pac40Length}mm`);

    // 2. PARCLOSES PAT40 (traverses)
    const pat40Length = this.calculatePAT40Length(config);
    totalParcloseLength += pat40Length;
    console.log(`📏 PAT40 total: ${pat40Length}mm`);

    // 3. PARCLOSES PORTE (si porte présente)
    if (config.type === "porte") {
      const porteParcloseLength = this.calculatePorteParcloseLength(config);
      totalParcloseLength += porteParcloseLength;
      console.log(`📏 Parcloses porte total: ${porteParcloseLength}mm`);
    }

    // Calcul de la quantité de clips : (total parcloses) / 2, arrondi au dessus
    const quantity = Math.ceil(totalParcloseLength / 250);

    console.log(`📊 Total longueur parcloses: ${totalParcloseLength}mm`);
    console.log(
      `📊 Quantité CLIPV30: ${totalParcloseLength} ÷ 2 = ${quantity} clips`
    );

    return {
      ref: "CLIPV30",
      description: "Clips",
      quantity: quantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: null,
    };
  }

  static calculatePC40Length(config) {
    const { width, height, type } = config;
    let totalLength = 0;

    if (type !== "porte") {
      // Cas sans porte
      totalLength += height * 2; // Verticaux
      totalLength += (width - 80) * 2; // Horizontaux
    } else {
      // Cas avec porte
      const { modulesCount, porteIndex, porte } = config;

      // Profils verticaux
      const quantiteVerticale =
        porteIndex === 1 || porteIndex === modulesCount ? 1 : 2;
      totalLength += height * quantiteVerticale;

      // Profils horizontaux
      if (porte?.withImposte) {
        totalLength += this.calculatePC40HorizontalWithImposte(config);
      } else {
        totalLength += this.calculatePC40HorizontalWithoutImposte(config);
      }
    }

    return totalLength;
  }

  static calculatePT40StructureLength(config) {
    const { height, modulesCount, type, porteIndex, traverses } = config;
    let totalLength = 0;

    // 1. Traverses verticales
    const longueurVerticale = height - 80;
    let nombreTraversesVerticales = 0;

    if (type === "porte") {
      if (porteIndex === 1 || porteIndex === modulesCount) {
        nombreTraversesVerticales = modulesCount - 2;
      } else {
        nombreTraversesVerticales = modulesCount - 3;
      }
    } else {
      nombreTraversesVerticales = modulesCount - 1;
    }

    nombreTraversesVerticales = Math.max(0, nombreTraversesVerticales);
    totalLength += longueurVerticale * nombreTraversesVerticales;

    // 2. Traverses horizontales
    if (traverses && traverses.length > 0) {
      traverses.forEach((traverse) => {
        traverse.modules.forEach((numeroModule) => {
          const moduleIndex = numeroModule - 1;
          const module = config.modules[moduleIndex];
          if (module) {
            totalLength += module.width;
          }
        });
      });
    }

    return totalLength;
  }

  /**
   * Calcule la longueur totale des parcloses PAC40
   */
  static calculatePAC40Length(config) {
    const { width, height, type } = config;
    let totalLength = 0;

    if (type !== "porte") {
      // Cas sans porte : profils cadre standard
      totalLength += height * 2; // Verticaux
      totalLength += (width - 80) * 2; // Horizontaux
    } else {
      // Cas avec porte : logique PC40Calculator
      const { modulesCount, porteIndex, porte } = config;

      // Profils verticaux
      const quantiteVerticale =
        porteIndex === 1 || porteIndex === modulesCount ? 1 : 2;
      totalLength += height * quantiteVerticale;

      // Profils horizontaux selon imposte ou non
      if (porte?.withImposte) {
        totalLength += this.calculatePAC40HorizontalWithImposte(config);
      } else {
        totalLength += this.calculatePAC40HorizontalWithoutImposte(config);
      }
    }

    return totalLength;
  }

  static calculatePC40HorizontalWithoutImposte(config) {
    const { width, porteIndex, modulesCount } = config;
    const dimensionsOuverture = this.calculateDimensionsOuverture(config);
    let totalLength = 0;

    if (porteIndex === 1) {
      const longueurDroite = width - dimensionsOuverture.largeur - 40;
      totalLength += Math.max(0, longueurDroite * 2);
    } else if (porteIndex === modulesCount) {
      const longueurGauche = width - dimensionsOuverture.largeur - 40;
      totalLength += Math.max(0, longueurGauche * 2);
    } else {
      const longueurs = this.calculateLongueursGaucheDroite(config);
      totalLength += Math.max(0, longueurs.longueurGauche * 2);
      totalLength += Math.max(0, longueurs.longueurDroite * 2);
    }

    return totalLength;
  }

  /**
   * Calcule PC40 horizontal avec imposte
   */
  static calculatePC40HorizontalWithImposte(config) {
    const { width, porteIndex, modulesCount } = config;
    const dimensionsOuverture = this.calculateDimensionsOuverture(config);
    let totalLength = 0;

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

    totalLength += Math.max(0, longueurGauche * 2);
    totalLength += Math.max(0, longueurDroite * 2);
    totalLength += Math.max(0, longueurImposte);

    return totalLength;
  }

  /**
   * Calcule la longueur totale des parcloses PAT40
   */
  static calculatePAT40Length(config) {
    const { height, modulesCount, type, porteIndex, traverses } = config;
    let totalLength = 0;

    // 1. Traverses verticales
    const longueurVerticale = height - 80;
    let nombreTraversesVerticales = 0;

    if (type === "porte") {
      if (porteIndex === 1 || porteIndex === modulesCount) {
        nombreTraversesVerticales = modulesCount - 2;
      } else {
        nombreTraversesVerticales = modulesCount - 3;
      }
    } else {
      nombreTraversesVerticales = modulesCount - 1;
    }

    nombreTraversesVerticales = Math.max(0, nombreTraversesVerticales);
    totalLength += longueurVerticale * nombreTraversesVerticales;

    // 2. Traverses horizontales
    if (traverses && traverses.length > 0) {
      traverses.forEach((traverse) => {
        traverse.modules.forEach((numeroModule) => {
          const moduleIndex = numeroModule - 1;
          const module = config.modules[moduleIndex];
          if (module) {
            totalLength += module.width;
          }
        });
      });
    }

    return totalLength;
  }

  static calculatePorteStructureLength(config) {
    if (config.type !== "porte") return 0;

    let totalLength = 0;
    const { height, porte } = config;
    const longueurPorte = (porte?.porteHeight || 0) - 5;

    // PTCIV51, PTPV51, POCI53, PO40, PO66, THB40, TI28, TI37, etc.
    // Simplification : approximation basée sur la logique PorteProfilesCalculator

    const isVisible = porte?.charniereType === "visible";
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";
    const withImposte =
      porte?.withImposte === true || porte?.withImposte === "true";

    // PTPV51/PTCIV51
    if (isVisible) {
      totalLength += height * 2;
    } else {
      const quantite = withTierce ? 3 : 2;
      totalLength += height * quantite;
    }

    // Profils ouvrants (approximation)
    const expectedPorteProfiles = withTierce ? 4 : 2;
    totalLength += longueurPorte * expectedPorteProfiles;

    // Traverses THB40 (approximation)
    const expectedTHB40 = withTierce ? 4 : 2;
    const avgThbLength = (porte?.porteWidth || 600) - 100;
    totalLength += avgThbLength * expectedTHB40;

    // Imposte si applicable
    if (withImposte) {
      const modulePorteIndex = config.porteIndex - 1;
      const modulePorte = config.modules?.[modulePorteIndex];
      if (modulePorte) {
        totalLength += modulePorte.width;
      }
    }

    return totalLength;
  }

  /**
   * Calcule la longueur totale des parcloses de porte
   */
  static calculatePorteParcloseLength(config) {
    if (config.type !== "porte") return 0;

    let totalLength = 0;
    const { height, porte } = config;

    // PATP65 : Reprend les longueurs des profils dormant
    const isVisible = porte?.charniereType === "visible";
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";
    const withImposte =
      porte?.withImposte === true || porte?.withImposte === "true";

    // Calcul PATP65
    if (isVisible) {
      totalLength += height * 2;
    } else {
      // Invisible
      const quantite = withTierce ? 3 : 2;
      totalLength += height * quantite;
    }

    // Ajustement pour imposte
    if (withImposte) {
      const modulePorteIndex = config.porteIndex - 1;
      const modulePorte = config.modules?.[modulePorteIndex];
      if (modulePorte) {
        totalLength += modulePorte.width;
      }
    }

    // PAIP65 : Parcloses imposte (si applicable)
    if (withImposte) {
      const dimensionsOuverture = this.calculateDimensionsOuverture(config);
      const longueurImposte = config.height - dimensionsOuverture.hauteur;
      totalLength += longueurImposte * 2;
    }

    return totalLength;
  }

  /**
   * Calcule les dimensions d'ouverture (copie simplifiée)
   */
  static calculateDimensionsOuverture(config) {
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

    return { hauteur: Math.round(hauteur), largeur: Math.round(largeur) };
  }

  /**
   * Calcule PAC40 horizontal sans imposte
   */
  static calculatePAC40HorizontalWithoutImposte(config) {
    const { width, porteIndex, modulesCount } = config;
    const dimensionsOuverture = this.calculateDimensionsOuverture(config);
    let totalLength = 0;

    if (porteIndex === 1) {
      const longueurDroite = width - dimensionsOuverture.largeur - 40;
      totalLength += Math.max(0, longueurDroite * 2);
    } else if (porteIndex === modulesCount) {
      const longueurGauche = width - dimensionsOuverture.largeur - 40;
      totalLength += Math.max(0, longueurGauche * 2);
    } else {
      const longueurs = this.calculateLongueursGaucheDroite(config);
      totalLength += Math.max(0, longueurs.longueurGauche * 2);
      totalLength += Math.max(0, longueurs.longueurDroite * 2);
    }

    return totalLength;
  }

  /**
   * Calcule PAC40 horizontal avec imposte
   */
  static calculatePAC40HorizontalWithImposte(config) {
    const { width, porteIndex, modulesCount } = config;
    const dimensionsOuverture = this.calculateDimensionsOuverture(config);
    let totalLength = 0;

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

    totalLength += Math.max(0, longueurGauche * 2);
    totalLength += Math.max(0, longueurDroite * 2);
    totalLength += Math.max(0, longueurImposte);

    return totalLength;
  }

  /**
   * Calcule les longueurs à gauche et à droite de la porte
   */
  static calculateLongueursGaucheDroite(config) {
    const { modulesCount, porteIndex } = config;
    let longueurGauche = 0;
    let longueurDroite = 0;

    if (porteIndex < 1 || porteIndex > modulesCount) {
      return { longueurGauche: 0, longueurDroite: 0 };
    }

    // Largeur à gauche
    for (let i = 1; i < porteIndex; i++) {
      const moduleIndex = i - 1;
      const moduleWidth = config.modules?.[moduleIndex]?.width || 0;
      longueurGauche += moduleWidth;
    }
    longueurGauche += Math.max(0, porteIndex - 2) * 40;

    // Largeur à droite
    for (let i = porteIndex + 1; i <= modulesCount; i++) {
      const moduleIndex = i - 1;
      const moduleWidth = config.modules?.[moduleIndex]?.width || 0;
      longueurDroite += moduleWidth;
    }
    longueurDroite += Math.max(0, modulesCount - porteIndex - 1) * 40;

    return { longueurGauche, longueurDroite };
  }

  /**
   * Compte le nombre de traverses qui concernent un module donné
   * @param {Array} traverses - Liste des traverses
   * @param {number} moduleNumber - Numéro du module (1-based)
   * @returns {number} Nombre de traverses
   */
  static countTraversesOnModule(traverses, moduleNumber) {
    if (!traverses || traverses.length === 0) {
      return 0;
    }

    return traverses.filter(
      (traverse) => traverse.modules && traverse.modules.includes(moduleNumber)
    ).length;
  }

  static calculateJTPE48(config) {
    console.log("🔧 Calcul JTPE48");

    const remplissageEp = config.options?.remplissageEp || 6;
    const colorJoint = config.options?.colorJoint || "noir";
    let longueur = null;

    if (remplissageEp === 8) {
      // Calculer somme longueurs profils "structure"
      let totalStructureLength = 0;

      // PC40 (structure)
      totalStructureLength += this.calculatePC40Length(config);

      // PT40 (structure) - multiplier par 2
      const pt40Length = this.calculatePT40StructureLength(config);
      totalStructureLength += pt40Length * 2;
      console.log(
        `📏 PT40 structure: ${pt40Length}mm × 2 = ${pt40Length * 2}mm`
      );

      // Profils porte (structure)
      if (config.type === "porte") {
        totalStructureLength += this.calculatePorteStructureLength(config);
      }

      // Convertir en mètres et arrondir au supérieur
      longueur = Math.ceil(totalStructureLength / 1000);
      console.log(`📊 JTPE48: ${totalStructureLength}mm → ${longueur}m`);
    }

    return {
      ref: "JTPE48",
      description: "Joint plat",
      quantity: 1,
      length: longueur,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: this.getJointColorLabel(colorJoint),
    };
  }

  /**
   * Calcule le joint JRLP47
   * @param {Object} config - Configuration
   * @returns {Object} Données du joint
   */
  static calculateJRLP47(config) {
    console.log("🔧 Calcul JRLP47");

    const remplissageEp = config.options?.remplissageEp || 6;
    const colorJoint = config.options?.colorJoint || "noir";
    let longueur = null;

    if (remplissageEp === 6) {
      // Somme profils "structure" + "parclose", PT40/PAT40 × 2
      let totalLength = 0;

      // Structure
      totalLength += this.calculatePC40Length(config);
      const pt40Length = this.calculatePT40StructureLength(config);
      totalLength += pt40Length * 2;

      if (config.type === "porte") {
        totalLength += this.calculatePorteStructureLength(config);
      }

      // Parcloses
      totalLength += this.calculatePAC40Length(config);
      const pat40Length = this.calculatePAT40Length(config);
      totalLength += pat40Length * 2;

      if (config.type === "porte") {
        totalLength += this.calculatePorteParcloseLength(config);
      }

      longueur = Math.ceil(totalLength / 1000);
      console.log(`📊 JRLP47 (ep=6): ${totalLength}mm → ${longueur}m`);
    } else if (remplissageEp === 8) {
      // Somme profils "parclose", PAT40 × 2
      let totalParcloseLength = 0;

      totalParcloseLength += this.calculatePAC40Length(config);
      const pat40Length = this.calculatePAT40Length(config);
      totalParcloseLength += pat40Length * 2;

      if (config.type === "porte") {
        totalParcloseLength += this.calculatePorteParcloseLength(config);
      }

      longueur = Math.ceil(totalParcloseLength / 1000);
      console.log(`📊 JRLP47 (ep=8): ${totalParcloseLength}mm → ${longueur}m`);
    }

    return {
      ref: "JRLP47",
      description: "Joint bulle",
      quantity: 1,
      length: longueur,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: this.getJointColorLabel(colorJoint),
    };
  }

  static getJointColorLabel(colorJoint) {
    const colorMap = {
      noir: "Noir",
      transp: "Transparent",
      blanc: "Blanc",
    };
    return colorMap[colorJoint] || "Noir";
  }

  /**
   * Formate les accessoires pour les tableaux
   * @param {Array} accessories - Accessoires calculés
   * @returns {Array} Lignes formatées pour le tableau
   */
  static formatForTable(accessories) {
    return accessories.map((accessory) => ({
      ref: accessory.ref,
      description: accessory.description,
      quantity: accessory.quantity,
      length: accessory.length || "-", // Afficher "-" si pas de longueur
      unitPrice: accessory.unitPrice || 0,
      totalPrice: accessory.totalPrice || 0,
      category: accessory.category,
      finition: accessory.finition || "-",
    }));
  }

  /**
   * Valide la cohérence des accessoires calculés
   * @param {Array} accessories - Accessoires calculés
   * @param {Object} config - Configuration
   * @returns {{valid: boolean, warnings: Array<string>}}
   */
  static validateAccessories(accessories, config) {
    const warnings = [];

    // Vérifier les quantités négatives
    const negativeQuantity = accessories.find((a) => a.quantity < 0);
    if (negativeQuantity) {
      warnings.push(`Quantité négative: ${negativeQuantity.ref}`);
    }

    // Vérifier cohérence équerres vs modules
    const equerres = accessories.find((a) => a.ref === "EQUER100");
    if (equerres && config.modulesCount > 0) {
      const expectedMin = config.modulesCount * 2;
      if (equerres.quantity < expectedMin) {
        warnings.push(
          `Nombre d'équerres faible: ${equerres.quantity}, minimum attendu: ${expectedMin}`
        );
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Génère un rapport complet des accessoires
   * @param {Object} config - Configuration
   * @returns {Object} Rapport détaillé
   */
  static generateReport(config) {
    const accessories = this.calculateAccessories(config);
    const validation = this.validateAccessories(accessories, config);
    const tableLines = this.formatForTable(accessories);

    return {
      config: {
        dimensions: `${config.width}×${config.height}mm`,
        modules: config.modulesCount,
        traverses: config.traverses?.length || 0,
        hasPorte: config.type === "porte",
      },
      accessories,
      validation,
      tableLines,
      summary: {
        totalAccessories: accessories.length,
        totalEquerres:
          accessories.find((a) => a.ref === "EQUER100")?.quantity || 0,
        valid: validation.valid,
      },
    };
  }
}
