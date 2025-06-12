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
    if (jtpe48.quantity > 0) {
      // CORRECTION: Vérifier la quantité au lieu de l'existence
      accessories.push(jtpe48);
    }

    const jrlp47 = this.calculateJRLP47(config);
    if (jrlp47.quantity > 0) {
      // CORRECTION: Vérifier la quantité au lieu de l'existence
      accessories.push(jrlp47);
    }

    const paumdg = this.calculatePAUMDG(config);
    if (paumdg.quantity > 0) {
      accessories.push(paumdg);
    }

    const in300 = this.calculateIN300(config);
    if (in300.quantity > 0) {
      accessories.push(in300);
    }

    const in303 = this.calculateIN303(config);
    if (in303.quantity > 0) {
      accessories.push(in303);
    }

    const capotci53 = this.calculateCAPOTCI53(config);
    if (capotci53.quantity > 0) {
      accessories.push(capotci53);
    }

    const capotouv = this.calculateCAPOTOUV(config);
    if (capotouv.quantity > 0) {
      accessories.push(capotouv);
    }

    const capotouv66 = this.calculateCAPOTOUV66(config);
    if (capotouv66.quantity > 0) {
      accessories.push(capotouv66);
    }

    const bequille = this.calculateBEQUILLE(config);
    if (bequille.quantity > 0) {
      accessories.push(bequille);
    }

    const ptirouv = this.calculatePTIROUV(config);
    if (ptirouv.quantity > 0) {
      accessories.push(ptirouv);
    }

    const serpene35m = this.calculateSERPENE35M(config);
    if (serpene35m.quantity > 0) {
      accessories.push(serpene35m);
    }

    const cylindre35x35 = this.calculateCYLINDRE35X35(config);
    if (cylindre35x35.quantity > 0) {
      accessories.push(cylindre35x35);
    }

    const serroulm = this.calculateSERROULM(config);
    if (serroulm.quantity > 0) {
      accessories.push(serroulm);
    }

    const serroulpenm = this.calculateSERROULPENM(config);
    if (serroulpenm.quantity > 0) {
      accessories.push(serroulpenm);
    }

    const gachepouvm = this.calculateGACHEPOUVM(config);
    if (gachepouvm.quantity > 0) {
      accessories.push(gachepouvm);
    }

    const verrou23m = this.calculateVERROU23M(config);
    if (verrou23m.quantity > 0) {
      accessories.push(verrou23m);
    }

    const pvitrageLines = this.calculatePVITRAGE(config);
    accessories.push(...pvitrageLines);

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
    console.log("Config remplissage:", config.options);

    // CORRECTION: Convertir en nombre ET gérer les deux types
    const remplissageEpRaw = config.options?.remplissageEp || 6;
    const remplissageEp = parseInt(remplissageEpRaw, 10);
    const colorJoint = config.options?.colorJoint || "noir";

    console.log(
      `📊 Épaisseur remplissage RAW: ${remplissageEpRaw} (type: ${typeof remplissageEpRaw})`
    );
    console.log(
      `📊 Épaisseur remplissage CONVERTED: ${remplissageEp}mm (type: ${typeof remplissageEp})`
    );
    console.log(`🎨 Couleur joint: ${colorJoint}`);

    let longueur = null;

    // CORRECTION: Comparaison stricte avec nombre
    if (remplissageEp === 8) {
      console.log("✅ Condition remplissageEp === 8 VRAIE");
      // Calculer somme longueurs profils "structure"
      let totalStructureLength = 0;

      // PC40 (structure)
      const pc40Length = this.calculatePC40Length(config);
      totalStructureLength += pc40Length;
      console.log(`📏 PC40 structure: ${pc40Length}mm`);

      // PT40 (structure) - multiplier par 2
      const pt40Length = this.calculatePT40StructureLength(config);
      totalStructureLength += pt40Length * 2;
      console.log(
        `📏 PT40 structure: ${pt40Length}mm × 2 = ${pt40Length * 2}mm`
      );

      // Profils porte (structure)
      if (config.type === "porte") {
        const porteStructureLength = this.calculatePorteStructureLength(config);
        totalStructureLength += porteStructureLength;
        console.log(`📏 Porte structure: ${porteStructureLength}mm`);
      }

      // Convertir en mètres et arrondir au supérieur
      longueur = Math.ceil(totalStructureLength / 1000);
      console.log(`📊 JTPE48: ${totalStructureLength}mm → ${longueur}ml`);
    } else {
      console.log(
        `❌ Condition remplissageEp === 8 FAUSSE (valeur: ${remplissageEp})`
      );
      longueur = 0;
    }

    return {
      ref: "JTPE48",
      description: "Joint plat",
      quantity: longueur > 0 ? 1 : 0,
      length: longueur,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: this.getJointColorLabel(colorJoint),
    };
  }

  // CORRECTION - calculateJRLP47 avec conversion de type
  static calculateJRLP47(config) {
    console.log("🔧 Calcul JRLP47");
    console.log("Config remplissage:", config.options);

    // CORRECTION: Convertir en nombre ET gérer les deux types
    const remplissageEpRaw = config.options?.remplissageEp || 6;
    const remplissageEp = parseInt(remplissageEpRaw, 10);
    const colorJoint = config.options?.colorJoint || "noir";

    console.log(
      `📊 Épaisseur remplissage RAW: ${remplissageEpRaw} (type: ${typeof remplissageEpRaw})`
    );
    console.log(
      `📊 Épaisseur remplissage CONVERTED: ${remplissageEp}mm (type: ${typeof remplissageEp})`
    );
    console.log(`🎨 Couleur joint: ${colorJoint}`);

    let longueur = null;

    // CORRECTION: Comparaisons strictes avec nombres
    if (remplissageEp === 6) {
      console.log("✅ Condition remplissageEp === 6 VRAIE");
      // Somme profils "structure" + "parclose", PT40/PAT40 × 2
      let totalLength = 0;

      // Structure
      const pc40Length = this.calculatePC40Length(config);
      totalLength += pc40Length;
      console.log(`📏 PC40: ${pc40Length}mm`);

      const pt40Length = this.calculatePT40StructureLength(config);
      totalLength += pt40Length * 2;
      console.log(`📏 PT40: ${pt40Length}mm × 2`);

      if (config.type === "porte") {
        const porteStructureLength = this.calculatePorteStructureLength(config);
        totalLength += porteStructureLength;
        console.log(`📏 Porte structure: ${porteStructureLength}mm`);
      }

      // Parcloses
      const pac40Length = this.calculatePAC40Length(config);
      totalLength += pac40Length;
      console.log(`📏 PAC40: ${pac40Length}mm`);

      const pat40Length = this.calculatePAT40Length(config);
      totalLength += pat40Length * 2;
      console.log(`📏 PAT40: ${pat40Length}mm × 2`);

      if (config.type === "porte") {
        const porteParcloseLength = this.calculatePorteParcloseLength(config);
        totalLength += porteParcloseLength;
        console.log(`📏 Porte parcloses: ${porteParcloseLength}mm`);
      }

      longueur = Math.ceil(totalLength / 1000);
      console.log(`📊 JRLP47 (ep=6): ${totalLength}mm → ${longueur}ml`);
    } else if (remplissageEp === 8) {
      console.log("✅ Condition remplissageEp === 8 VRAIE");
      // Somme profils "parclose", PAT40 × 2
      let totalParcloseLength = 0;

      const pac40Length = this.calculatePAC40Length(config);
      totalParcloseLength += pac40Length;
      console.log(`📏 PAC40: ${pac40Length}mm`);

      const pat40Length = this.calculatePAT40Length(config);
      totalParcloseLength += pat40Length * 2;
      console.log(`📏 PAT40: ${pat40Length}mm × 2`);

      if (config.type === "porte") {
        const porteParcloseLength = this.calculatePorteParcloseLength(config);
        totalParcloseLength += porteParcloseLength;
        console.log(`📏 Porte parcloses: ${porteParcloseLength}mm`);
      }

      longueur = Math.ceil(totalParcloseLength / 1000);
      console.log(`📊 JRLP47 (ep=8): ${totalParcloseLength}mm → ${longueur}ml`);
    } else {
      console.log(
        `❌ Aucune condition remplie pour remplissageEp: ${remplissageEp}`
      );
      longueur = 0;
    }

    return {
      ref: "JRLP47",
      description: "Joint bulle",
      quantity: longueur > 0 ? 1 : 0,
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

  static calculatePAUMDG(config) {
    console.log("🔧 Calcul PAUMDG (Paumelles)");

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      console.log("❌ Pas de porte, aucune paumelle nécessaire");
      return {
        ref: "PAUMDG",
        description: "Paumelles",
        quantity: 0,
        length: null,
        unitPrice: 0,
        totalPrice: 0,
        category: "quincaillerie",
        finition: null,
      };
    }

    // Si charnières invisibles, quantité = 0
    const charniereType = config.porte?.charniereType || "visible";
    if (charniereType === "invisible") {
      console.log("❌ Charnières invisibles, aucune paumelle nécessaire");
      return {
        ref: "PAUMDG",
        description: "Paumelles",
        quantity: 0,
        length: null,
        unitPrice: 0,
        totalPrice: 0,
        category: "quincaillerie",
        finition: null,
      };
    }

    const { porte } = config;
    let quantity = 0;

    // Calcul de la quantité selon la hauteur de porte
    const porteHeight = porte?.porteHeight || 0;

    if (porteHeight <= 2050) {
      quantity = 3;
      console.log(`📏 Hauteur porte ${porteHeight}mm <= 2050mm → 3 paumelles`);
    } else {
      quantity = 4;
      console.log(`📏 Hauteur porte ${porteHeight}mm > 2050mm → 4 paumelles`);
    }

    // Si porte avec tierce, doubler la quantité
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";
    if (withTierce) {
      quantity = quantity * 2;
      console.log(
        `🚪 Porte avec tierce → quantité doublée : ${quantity} paumelles`
      );
    }

    // Déterminer la finition selon la couleur du profil
    const colorProfile = config.options?.colorProfile || "noir";
    const finition = this.getProfileColorLabel(colorProfile);

    console.log(`🎨 Finition paumelles : ${finition}`);
    console.log(`✅ Total PAUMDG: ${quantity} paumelles`);

    return {
      ref: "PAUMDG",
      description: "Paumelles",
      quantity: quantity,
      length: null, // Pas de longueur pour les paumelles
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: finition,
    };
  }

  // Ajouter aussi cette méthode utilitaire après getJointColorLabel :

  static getProfileColorLabel(colorProfile) {
    const colorMap = {
      noir: "Noir",
      gris: "Gris",
      blanc: "Blanc",
    };
    return colorMap[colorProfile] || "Noir";
  }

  static calculateIN300(config) {
    console.log("🔧 Calcul IN300 (Charnières invisibles 60kg)");

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      console.log("❌ Pas de porte, aucune charnière IN300 nécessaire");
      return {
        ref: "IN300",
        description: "Charnière invisible 60kg",
        quantity: 0,
        length: null,
        unitPrice: 0,
        totalPrice: 0,
        category: "quincaillerie",
        finition: null,
      };
    }

    // Si charnières visibles, quantité = 0
    const charniereType = config.porte?.charniereType || "visible";
    if (charniereType === "visible") {
      console.log("❌ Charnières visibles, aucune charnière IN300 nécessaire");
      return {
        ref: "IN300",
        description: "Charnière invisible 60kg",
        quantity: 0,
        length: null,
        unitPrice: 0,
        totalPrice: 0,
        category: "quincaillerie",
        finition: null,
      };
    }

    // Tableau de correspondance IN300
    const in300Table = {
      // hauteur: { largeur: quantité }
      2040: { 830: 3, 930: 3, 1030: 3, 1130: 4, 1230: 5 },
      2100: { 830: 3, 930: 3, 1030: 3, 1130: 4, 1230: 5 },
      2200: { 830: 3, 930: 3, 1030: 3, 1130: 4, 1230: 5 },
      2300: { 830: 4, 930: 4, 1030: 4, 1130: 4, 1230: 5 },
      2400: { 830: 4, 930: 4, 1030: 4, 1130: 4, 1230: 0 },
      2500: { 830: 4, 930: 4, 1030: 4, 1130: 4, 1230: 0 },
      2600: { 830: 4, 930: 4, 1030: 4, 1130: 0, 1230: 0 },
      2700: { 830: 4, 930: 4, 1030: 4, 1130: 0, 1230: 0 },
      2800: { 830: 4, 930: 4, 1030: 4, 1130: 0, 1230: 0 },
      2900: { 830: 4, 930: 4, 1030: 5, 1130: 0, 1230: 0 },
      3000: { 830: 4, 930: 4, 1030: 5, 1130: 0, 1230: 0 },
    };

    const quantity = this.getQuantityFromTable(config, in300Table, "IN300");

    return {
      ref: "IN300",
      description: "Charnière invisible 60kg",
      quantity: quantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: null,
    };
  }

  static calculateIN303(config) {
    console.log("🔧 Calcul IN303 (Charnières invisibles 80kg)");

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      console.log("❌ Pas de porte, aucune charnière IN303 nécessaire");
      return {
        ref: "IN303",
        description: "Charnière invisible 80kg",
        quantity: 0,
        length: null,
        unitPrice: 0,
        totalPrice: 0,
        category: "quincaillerie",
        finition: null,
      };
    }

    // Si charnières visibles, quantité = 0
    const charniereType = config.porte?.charniereType || "visible";
    if (charniereType === "visible") {
      console.log("❌ Charnières visibles, aucune charnière IN303 nécessaire");
      return {
        ref: "IN303",
        description: "Charnière invisible 80kg",
        quantity: 0,
        length: null,
        unitPrice: 0,
        totalPrice: 0,
        category: "quincaillerie",
        finition: null,
      };
    }

    // Tableau de correspondance IN303
    const in303Table = {
      // hauteur: { largeur: quantité }
      2040: { 830: 0, 930: 0, 1030: 0, 1130: 0, 1230: 0 },
      2100: { 830: 0, 930: 0, 1030: 0, 1130: 0, 1230: 0 },
      2200: { 830: 0, 930: 0, 1030: 0, 1130: 0, 1230: 0 },
      2300: { 830: 0, 930: 0, 1030: 0, 1130: 0, 1230: 0 },
      2400: { 830: 0, 930: 0, 1030: 0, 1130: 0, 1230: 5 },
      2500: { 830: 0, 930: 0, 1030: 0, 1130: 0, 1230: 5 },
      2600: { 830: 0, 930: 0, 1030: 0, 1130: 4, 1230: 5 },
      2700: { 830: 0, 930: 0, 1030: 0, 1130: 4, 1230: 5 },
      2800: { 830: 0, 930: 0, 1030: 0, 1130: 4, 1230: 5 },
      2900: { 830: 0, 930: 0, 1030: 0, 1130: 5, 1230: 5 },
      3000: { 830: 0, 930: 0, 1030: 0, 1130: 5, 1230: 5 },
    };

    const quantity = this.getQuantityFromTable(config, in303Table, "IN303");

    return {
      ref: "IN303",
      description: "Charnière invisible 80kg",
      quantity: quantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: null,
    };
  }

  // Méthode utilitaire pour lire les tableaux
  static getQuantityFromTable(config, table, accessoryName) {
    const { porte } = config;
    const porteWidth = porte?.porteWidth || 0;
    const porteHeight = porte?.porteHeight || 0;
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";

    console.log(
      `📏 ${accessoryName} - Porte: ${porteWidth}mm × ${porteHeight}mm`
    );

    // Définir les bornes du tableau
    const widths = [830, 930, 1030, 1130, 1230];
    const heights = [
      2040, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000,
    ];

    // Trouver la largeur de référence (borne inférieure si < min, borne supérieure si > max)
    let refWidth;
    if (porteWidth < widths[0]) {
      refWidth = widths[0];
    } else if (porteWidth > widths[widths.length - 1]) {
      refWidth = widths[widths.length - 1];
    } else {
      // Trouver la largeur immédiatement supérieure ou égale
      refWidth =
        widths.find((w) => porteWidth <= w) || widths[widths.length - 1];
    }

    // Trouver la hauteur de référence
    let refHeight;
    if (porteHeight < heights[0]) {
      refHeight = heights[0];
    } else if (porteHeight > heights[heights.length - 1]) {
      refHeight = heights[heights.length - 1];
    } else {
      // Trouver la hauteur immédiatement supérieure ou égale
      refHeight =
        heights.find((h) => porteHeight <= h) || heights[heights.length - 1];
    }

    console.log(
      `🔍 ${accessoryName} - Référence tableau: ${refWidth}mm × ${refHeight}mm`
    );

    // Récupérer la quantité depuis le tableau
    let quantity = table[refHeight]?.[refWidth] || 0;

    console.log(`📊 ${accessoryName} - Quantité de base: ${quantity}`);

    // Si porte avec tierce, doubler la quantité
    if (withTierce && quantity > 0) {
      quantity = quantity * 2;
      console.log(
        `🚪 ${accessoryName} - Porte avec tierce → quantité doublée: ${quantity}`
      );
    }

    console.log(`✅ ${accessoryName} - Total: ${quantity} charnières`);

    return quantity;
  }

  static calculateCAPOTCI53(config) {
    console.log("🔧 Calcul CAPOTCI53 (Capot assemblage 53)");

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      console.log("❌ Pas de porte, aucun capot CAPOTCI53 nécessaire");
      return {
        ref: "CAPOTCI53",
        description: "Capot d'assemblage 53 (sachet de 2)",
        quantity: 0,
        length: null,
        unitPrice: 0,
        totalPrice: 0,
        category: "quincaillerie",
        finition: null,
      };
    }

    // Quantité = quantité de POCI53
    const poci53Quantity = this.calculatePOCI53Quantity(config);

    // Finition selon la couleur du profil
    const colorProfile = config.options?.colorProfile || "noir";
    const finition = this.getProfileColorLabel(colorProfile);

    console.log(`📊 CAPOTCI53 - Quantité POCI53: ${poci53Quantity}`);
    console.log(`🎨 CAPOTCI53 - Finition: ${finition}`);
    console.log(`✅ Total CAPOTCI53: ${poci53Quantity} sachets`);

    return {
      ref: "CAPOTCI53",
      description: "Capot d'assemblage 53 (sachet de 2)",
      quantity: poci53Quantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: finition,
    };
  }

  static calculateCAPOTOUV(config) {
    console.log("🔧 Calcul CAPOTOUV (Capot assemblage 40)");

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      console.log("❌ Pas de porte, aucun capot CAPOTOUV nécessaire");
      return {
        ref: "CAPOTOUV",
        description: "Capot d'assemblage 40 (sachet de 2)",
        quantity: 0,
        length: null,
        unitPrice: 0,
        totalPrice: 0,
        category: "quincaillerie",
        finition: null,
      };
    }

    // Quantité = quantité de PO40
    const po40Quantity = this.calculatePO40Quantity(config);

    // Finition selon la couleur du profil
    const colorProfile = config.options?.colorProfile || "noir";
    const finition = this.getProfileColorLabel(colorProfile);

    console.log(`📊 CAPOTOUV - Quantité PO40: ${po40Quantity}`);
    console.log(`🎨 CAPOTOUV - Finition: ${finition}`);
    console.log(`✅ Total CAPOTOUV: ${po40Quantity} sachets`);

    return {
      ref: "CAPOTOUV",
      description: "Capot d'assemblage 40 (sachet de 2)",
      quantity: po40Quantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: finition,
    };
  }

  static calculateCAPOTOUV66(config) {
    console.log("🔧 Calcul CAPOTOUV66 (Capot assemblage 66)");

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      console.log("❌ Pas de porte, aucun capot CAPOTOUV66 nécessaire");
      return {
        ref: "CAPOTOUV66",
        description: "Capot d'assemblage 66 (sachet de 2)",
        quantity: 0,
        length: null,
        unitPrice: 0,
        totalPrice: 0,
        category: "quincaillerie",
        finition: null,
      };
    }

    // Quantité = quantité de PO66 + PO6622U
    const po66Quantity = this.calculatePO66Quantity(config);
    const po6622uQuantity = this.calculatePO6622UQuantity(config);
    const totalQuantity = po66Quantity + po6622uQuantity;

    // Finition selon la couleur du profil
    const colorProfile = config.options?.colorProfile || "noir";
    const finition = this.getProfileColorLabel(colorProfile);

    console.log(`📊 CAPOTOUV66 - Quantité PO66: ${po66Quantity}`);
    console.log(`📊 CAPOTOUV66 - Quantité PO6622U: ${po6622uQuantity}`);
    console.log(`📊 CAPOTOUV66 - Total: ${totalQuantity}`);
    console.log(`🎨 CAPOTOUV66 - Finition: ${finition}`);
    console.log(`✅ Total CAPOTOUV66: ${totalQuantity} sachets`);

    return {
      ref: "CAPOTOUV66",
      description: "Capot d'assemblage 66 (sachet de 2)",
      quantity: totalQuantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: finition,
    };
  }

  // Méthodes utilitaires pour calculer les quantités de profils porte
  // (Reprend la logique de PorteProfilesCalculator.js)

  static calculatePOCI53Quantity(config) {
    const { porte } = config;
    const isInvisible = porte?.charniereType === "invisible";
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";

    if (!isInvisible) {
      return 0; // POCI53 seulement pour charnières invisibles
    }

    return withTierce ? 2 : 1;
  }

  static calculatePO40Quantity(config) {
    const { porte } = config;
    const isVisible = porte?.charniereType === "visible";
    const isInvisible = porte?.charniereType === "invisible";
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";
    const isSerpen35m = porte?.serrure === "SERPEN35M";

    let quantity = 0;

    if (!withTierce) {
      // Sans tierce
      if (isVisible) {
        quantity = isSerpen35m ? 1 : 2;
      } else if (isInvisible) {
        quantity = isSerpen35m ? 0 : 1;
      }
    } else {
      // Avec tierce
      if (isVisible) {
        quantity = isSerpen35m ? 3 : 4;
      } else if (isInvisible) {
        quantity = isSerpen35m ? 1 : 2;
      }
    }

    return quantity;
  }

  static calculatePO66Quantity(config) {
    const { porte } = config;
    const isSerpen35m = porte?.serrure === "SERPEN35M";
    const profileType = porte?.profile || "po66";

    // PO66 seulement si serrure SERPEN35M ET profile = "po66"
    if (isSerpen35m && profileType === "po66") {
      return 1;
    }

    return 0;
  }

  static calculatePO6622UQuantity(config) {
    const { porte } = config;
    const isSerpen35m = porte?.serrure === "SERPEN35M";
    const profileType = porte?.profile || "po66";

    // PO6622U seulement si serrure SERPEN35M ET profile = "po6622u"
    if (isSerpen35m && profileType === "po6622u") {
      return 1;
    }

    return 0;
  }

  static calculateBEQUILLE(config) {
    console.log("🔧 Calcul BEQUILLE");

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      console.log("❌ Pas de porte, aucune béquille nécessaire");
      return {
        ref: "BEQUILLE",
        description: "Béquille",
        quantity: 0,
        length: null,
        unitPrice: 0,
        totalPrice: 0,
        category: "quincaillerie",
        finition: null,
      };
    }

    const { porte } = config;
    const serrure = porte?.serrure || "SERROULM";

    // Quantité = 1 si serrure SERPEN35M, sinon 0
    const quantity = serrure === "SERPEN35M" ? 1 : 0;

    // Finition selon porte.colorBequille
    const colorBequille = porte?.colorBequille || "noir";
    const finition = this.getBequilleColorLabel(colorBequille);

    console.log(`🔐 BEQUILLE - Serrure: ${serrure}`);
    console.log(
      `🎨 BEQUILLE - Couleur béquille: ${colorBequille} → ${finition}`
    );
    console.log(`✅ Total BEQUILLE: ${quantity} béquille(s)`);

    return {
      ref: "BEQUILLE",
      description: "Béquille",
      quantity: quantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: finition,
    };
  }

  static calculatePTIROUV(config) {
    console.log("🔧 Calcul PTIROUV (Poignée de tirage)");

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      console.log("❌ Pas de porte, aucune poignée de tirage nécessaire");
      return {
        ref: "PTIROUV",
        description: "Poignée de tirage",
        quantity: 0,
        length: null,
        unitPrice: 0,
        totalPrice: 0,
        category: "quincaillerie",
        finition: null,
      };
    }

    const { porte } = config;
    const serrure = porte?.serrure || "SERROULM";

    // Quantité = 1 si serrure SERROULM ou SERROULPENM, sinon 0
    const quantity =
      serrure === "SERROULM" || serrure === "SERROULPENM" ? 1 : 0;

    // Finition selon options.colorProfile
    const colorProfile = config.options?.colorProfile || "noir";
    const finition = this.getProfileColorLabel(colorProfile);

    console.log(`🔐 PTIROUV - Serrure: ${serrure}`);
    console.log(`🎨 PTIROUV - Couleur profil: ${colorProfile} → ${finition}`);
    console.log(`✅ Total PTIROUV: ${quantity} poignée(s)`);

    return {
      ref: "PTIROUV",
      description: "Poignée de tirage",
      quantity: quantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: finition,
    };
  }

  // Méthode utilitaire pour les couleurs de béquille
  static getBequilleColorLabel(colorBequille) {
    const colorMap = {
      noir: "Noir",
      inox: "Inox",
    };
    return colorMap[colorBequille] || "Noir";
  }

  static calculateSERPENE35M(config) {
    console.log("🔧 Calcul SERPENE35M (Serrure pour béquille)");

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      return this.createEmptyAccessory("SERPENE35M", "Serrure pour béquille");
    }

    const serrure = config.porte?.serrure || "SERROULM";
    const quantity = serrure === "SERPEN35M" ? 1 : 0;

    console.log(`🔐 SERPENE35M - Serrure: ${serrure} → quantité: ${quantity}`);

    return {
      ref: "SERPENE35M",
      description: "Serrure pour béquille",
      quantity: quantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: null,
    };
  }

  static calculateCYLINDRE35X35(config) {
    console.log("🔧 Calcul CYLINDRE35X35 (Cylindre avec clés)");

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      return this.createEmptyAccessory("CYLINDRE35X35", "Cylindre avec clés");
    }

    const serrure = config.porte?.serrure || "SERROULM";
    const quantity = serrure === "SERPEN35M" ? 1 : 0;

    console.log(
      `🔐 CYLINDRE35X35 - Serrure: ${serrure} → quantité: ${quantity}`
    );

    return {
      ref: "CYLINDRE35X35",
      description: "Cylindre avec clés",
      quantity: quantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: null,
    };
  }

  static calculateSERROULM(config) {
    console.log("🔧 Calcul SERROULM (Serrure à rouleau)");

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      return this.createEmptyAccessory("SERROULM", "Serrure à rouleau");
    }

    const serrure = config.porte?.serrure || "SERROULM";
    const quantity = serrure === "SERROULM" ? 1 : 0;

    console.log(`🔐 SERROULM - Serrure: ${serrure} → quantité: ${quantity}`);

    return {
      ref: "SERROULM",
      description: "Serrure à rouleau",
      quantity: quantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: null,
    };
  }

  static calculateSERROULPENM(config) {
    console.log(
      "🔧 Calcul SERROULPENM (Serrure à rouleau + pene + demi-cylindre)"
    );

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      return this.createEmptyAccessory(
        "SERROULPENM",
        "Serrure à rouleau + pene + demi-cylindre"
      );
    }

    const serrure = config.porte?.serrure || "SERROULM";
    const quantity = serrure === "SERROULPENM" ? 1 : 0;

    console.log(`🔐 SERROULPENM - Serrure: ${serrure} → quantité: ${quantity}`);

    return {
      ref: "SERROULPENM",
      description: "Serrure à rouleau + pene + demi-cylindre",
      quantity: quantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: null,
    };
  }

  static calculateGACHEPOUVM(config) {
    console.log("🔧 Calcul GACHEPOUVM (Gache de fermeture)");

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      return this.createEmptyAccessory(
        "GACHEPOUVM",
        "Gache de fermeture (Kit)"
      );
    }

    const serrure = config.porte?.serrure || "SERROULM";
    let quantity = 0;

    // Logique selon le type de serrure
    if (serrure === "SERPEN35M") {
      quantity = 2;
    } else if (serrure === "SERROULM") {
      quantity = 1;
    } else if (serrure === "SERROULPENM") {
      quantity = 2;
    }

    // Finition selon options.colorProfile
    const colorProfile = config.options?.colorProfile || "noir";
    const finition = this.getGacheColorLabel(colorProfile);

    console.log(`🔐 GACHEPOUVM - Serrure: ${serrure} → quantité: ${quantity}`);
    console.log(
      `🎨 GACHEPOUVM - Couleur profil: ${colorProfile} → finition: ${finition}`
    );

    return {
      ref: "GACHEPOUVM",
      description: "Gache de fermeture (Kit)",
      quantity: quantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: finition,
    };
  }

  static calculateVERROU23M(config) {
    console.log("🔧 Calcul VERROU23M (Verrou à onglet)");

    // Si pas de porte, quantité = 0
    if (config.type !== "porte") {
      return this.createEmptyAccessory("VERROU23M", "Verrou à onglet");
    }

    const withTierce =
      config.porte?.withTierce === true || config.porte?.withTierce === "true";
    const quantity = withTierce ? 2 : 0;

    console.log(
      `🚪 VERROU23M - Avec tierce: ${withTierce} → quantité: ${quantity}`
    );

    return {
      ref: "VERROU23M",
      description: "Verrou à onglet",
      quantity: quantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: null,
    };
  }

  // Méthodes utilitaires

  static createEmptyAccessory(ref, description) {
    return {
      ref: ref,
      description: description,
      quantity: 0,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: null,
    };
  }

  static getGacheColorLabel(colorProfile) {
    // Noir si noir ou gris, Blanc si blanc
    if (colorProfile === "blanc") {
      return "Blanc";
    } else {
      return "Noir"; // pour noir et gris
    }
  }

  static calculatePVITRAGE(config) {
    console.log("🔧 Calcul PVITRAGE (Profil de vitrage)");

    // Si pas de porte, aucun PVITRAGE nécessaire
    if (config.type !== "porte") {
      console.log("❌ Pas de porte, aucun PVITRAGE nécessaire");
      return [];
    }

    const pvitrageLines = [];

    // Finition selon porte.colorPvitrage
    const colorPvitrage = config.porte?.colorPvitrage || "noir";
    const finition = this.getPvitrageColorLabel(colorPvitrage);

    console.log(
      `🎨 PVITRAGE - Couleur: ${colorPvitrage} → finition: ${finition}`
    );

    // 1. CALCUL POUR PROFILS STRUCTURE_PORTE
    const structurePorteData = this.calculatePvitrageForStructurePorte(
      config,
      finition
    );
    if (structurePorteData.quantity > 0) {
      pvitrageLines.push(structurePorteData);
    }

    // 2. CALCUL POUR PROFILS TRAVERSE
    const traverseLines = this.calculatePvitrageForTraverse(config, finition);
    pvitrageLines.push(...traverseLines);

    console.log(`✅ Total PVITRAGE: ${pvitrageLines.length} ligne(s)`);

    return pvitrageLines;
  }

  static calculatePvitrageForStructurePorte(config, finition) {
    console.log("📊 PVITRAGE - Calcul pour profils structure_porte");

    // Récupérer tous les profils structure_porte et leurs quantités
    const structurePorteProfiles = this.getPorteProfilesQuantities(
      config,
      "structure_porte"
    );

    // Somme des quantités
    const totalQuantity = structurePorteProfiles.reduce(
      (sum, profile) => sum + profile.quantity,
      0
    );

    // Longueur = porte.porteHeight - 70
    const longueur = (config.porte?.porteHeight || 0) - 70;

    console.log(
      `📏 Structure porte - Profils trouvés:`,
      structurePorteProfiles
    );
    console.log(`📊 Structure porte - Quantité totale: ${totalQuantity}`);
    console.log(
      `📏 Structure porte - Longueur: ${
        config.porte?.porteHeight || 0
      } - 70 = ${longueur}mm`
    );

    return {
      ref: "PVITRAGE",
      description: "Profil de vitrage",
      quantity: totalQuantity,
      length: longueur > 0 ? `${longueur} mm` : null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: finition,
    };
  }

  static calculatePvitrageForTraverse(config, finition) {
    console.log("📊 PVITRAGE - Calcul pour profils traverse");

    const pvitrageLines = [];

    // Récupérer tous les profils traverse et leurs données
    const traverseProfiles = this.getPorteProfilesQuantities(
      config,
      "traverse"
    );

    console.log(`📏 Traverse - Profils trouvés:`, traverseProfiles);

    // Grouper par longueur pour créer une ligne par longueur différente
    const lengthGroups = new Map();

    traverseProfiles.forEach((profile) => {
      const length = profile.length;
      const currentData = lengthGroups.get(length) || {
        totalQuantity: 0,
        profiles: [],
      };

      // Calcul de la quantité selon le profil
      let quantity;
      if (profile.ref === "THB40") {
        quantity = profile.quantity * 1; // THB40 : quantité * 1
      } else {
        quantity = profile.quantity * 2; // Autres traverses : quantité * 2
      }

      currentData.totalQuantity += quantity;
      currentData.profiles.push({ ...profile, calculatedQuantity: quantity });

      lengthGroups.set(length, currentData);
    });

    // Créer une ligne PVITRAGE pour chaque longueur
    lengthGroups.forEach((data, length) => {
      console.log(
        `📏 Traverse longueur ${length}mm - Quantité totale: ${data.totalQuantity}`
      );
      console.log(
        `📊 Détail:`,
        data.profiles
          .map(
            (p) =>
              `${p.ref}(${p.quantity}×${p.ref === "THB40" ? "1" : "2"}=${
                p.calculatedQuantity
              })`
          )
          .join(", ")
      );

      if (data.totalQuantity > 0 && length > 0) {
        pvitrageLines.push({
          ref: "PVITRAGE",
          description: "Profil de vitrage",
          quantity: data.totalQuantity,
          length: `${length} mm`,
          unitPrice: 0,
          totalPrice: 0,
          category: "quincaillerie",
          finition: finition,
        });
      }
    });

    return pvitrageLines;
  }

  // Méthode utilitaire pour récupérer les profils de porte avec leurs quantités
  static getPorteProfilesQuantities(config, categoryFilter) {
    const profiles = [];

    // Simuler les calculs des profils de porte (reprend la logique de PorteProfilesCalculator)
    const { porte } = config;
    if (!porte) return profiles;

    const isVisible = porte.charniereType === "visible";
    const isInvisible = porte.charniereType === "invisible";
    const withTierce = porte.withTierce === true || porte.withTierce === "true";
    const isSerpen35m = porte.serrure === "SERPEN35M";
    const longueurPorte = (porte.porteHeight || 0) - 5;
    const profileType = porte.profile || "po66";

    if (categoryFilter === "structure_porte") {
      // POCI53
      if (isInvisible) {
        const quantitePOCI53 = withTierce ? 2 : 1;
        profiles.push({
          ref: "POCI53",
          quantity: quantitePOCI53,
          length: longueurPorte,
          category: "structure_porte",
        });
      }

      // PO40
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
          quantity: quantitePO40,
          length: longueurPorte,
          category: "structure_porte",
        });
      }

      // PO66/PO6622U
      if (isSerpen35m) {
        const profileRef = profileType === "po6622u" ? "PO6622U" : "PO66";
        profiles.push({
          ref: profileRef,
          quantity: 1,
          length: longueurPorte,
          category: "structure_porte",
        });
      }
    }

    if (categoryFilter === "traverse") {
      // THB40 - Calculer selon la logique existante
      const porteWidth = porte.porteWidth || 0;
      const tierceWidth = porte.tierceWidth || 0;

      // Largeur porte interne
      let largeurPorteInterne;
      if (isVisible) {
        largeurPorteInterne = isSerpen35m
          ? porteWidth - 40 - 66
          : porteWidth - 40 - 40;
      } else {
        largeurPorteInterne = isSerpen35m
          ? porteWidth - 53 - 66
          : porteWidth - 53 - 40;
      }

      profiles.push({
        ref: "THB40",
        quantity: 2, // 2 traverses pour la porte
        length: largeurPorteInterne,
        category: "traverse",
      });

      // THB40 tierce si applicable
      if (withTierce) {
        let largeurTierceInterne;
        if (isVisible) {
          largeurTierceInterne = tierceWidth - 40 - 40;
        } else {
          largeurTierceInterne = tierceWidth - 53 - 40;
        }

        profiles.push({
          ref: "THB40",
          quantity: 2, // 2 traverses pour la tierce
          length: largeurTierceInterne,
          category: "traverse",
        });
      }

      // TI28 et TI37 selon traversesPorte
      if (config.traversesPorte && config.traversesPorte.length > 0) {
        config.traversesPorte.forEach((traverse) => {
          const ref = traverse.type === "28" ? "TI28" : "TI37";
          const longueur = traverse.onPorte
            ? largeurPorteInterne - 2
            : withTierce
            ? largeurTierceInterne - 2
            : 0;

          if (longueur > 0) {
            profiles.push({
              ref: ref,
              quantity: 1,
              length: longueur,
              category: "traverse",
            });
          }
        });
      }
    }

    return profiles;
  }

  static getPvitrageColorLabel(colorPvitrage) {
    const colorMap = {
      noir: "Noir",
      transp: "Transparent",
      blanc: "Blanc",
    };
    return colorMap[colorPvitrage] || "Noir";
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
      length: accessory.length
        ? accessory.ref === "PVITRAGE"
          ? accessory.length
          : `${accessory.length} ml`
        : "-",
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
