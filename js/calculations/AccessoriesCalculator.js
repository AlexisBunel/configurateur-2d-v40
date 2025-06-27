import { References } from "../data/References.js";

export class AccessoriesCalculator {
  static calculateAccessories(config) {
    const accessories = [];

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
      accessories.push(jtpe48);
    }

    const jrlp47 = this.calculateJRLP47(config);
    if (jrlp47.quantity > 0) {
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

  static calculateEQUER100(config) {
    const { modules, traverses, type, porte } = config;
    let totalQuantity = 0;
    modules.forEach((module, index) => {
      const moduleNumber = index + 1;
      const isPorteModule =
        type === "porte" && moduleNumber === config.porteIndex;

      if (!isPorteModule) {
        const traversesOnModule = this.countTraversesOnModule(
          traverses,
          moduleNumber
        );
        const moduleQuantity = (traversesOnModule + 1) * 4;
        totalQuantity += moduleQuantity;
      }
    });

    if (type === "porte") {
      let porteBonus = 0;

      if (porte?.withImposte === true || porte?.withImposte === "true") {
        porteBonus = 6;
      } else if (porte?.withDormant === true || porte?.withDormant === "true") {
        porteBonus = 2;
      } else {
        porteBonus = 0;
      }

      totalQuantity += porteBonus;
    }

    return {
      ref: "EQUER100",
      description: "Équerres 100x100",
      quantity: totalQuantity,
      length: null,
      unitPrice: 0,
      totalPrice: 0,
      category: "quincaillerie",
      finition: "-",
    };
  }

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

    modules.forEach((module, index) => {
      const moduleNumber = index + 1;
      const isPorteModule =
        type === "porte" && moduleNumber === config.porteIndex;

      if (!isPorteModule) {
        const traversesOnModule = this.countTraversesOnModule(
          traverses,
          moduleNumber
        );
        const moduleQuantity = traversesOnModule * 2 + 2;
        totalQuantity += moduleQuantity;
      }
    });

    if (type === "porte") {
      const porteBonus =
        config.porte?.withImposte === true ||
        config.porte?.withImposte === "true"
          ? 2
          : 0;
      totalQuantity += porteBonus;

      if (porteBonus > 0) {
      } else {
      }
    }

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
    let totalParcloseLength = 0;

    const pac40Length = this.calculatePAC40Length(config);
    totalParcloseLength += pac40Length;

    const pat40Length = this.calculatePAT40Length(config);
    totalParcloseLength += pat40Length;

    if (config.type === "porte") {
      const porteParcloseLength = this.calculatePorteParcloseLength(config);
      totalParcloseLength += porteParcloseLength;
    }

    const quantity = Math.ceil(totalParcloseLength / 250);

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
      totalLength += height * 2;
      totalLength += (width - 80) * 2;
    } else {
      const { modulesCount, porteIndex, porte } = config;

      const quantiteVerticale =
        porteIndex === 1 || porteIndex === modulesCount ? 1 : 2;
      totalLength += height * quantiteVerticale;

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

  static calculatePAC40Length(config) {
    const { width, height, type } = config;
    let totalLength = 0;

    if (type !== "porte") {
      totalLength += height * 2;
      totalLength += (width - 80) * 2;
    } else {
      const { modulesCount, porteIndex, porte } = config;

      const quantiteVerticale =
        porteIndex === 1 || porteIndex === modulesCount ? 1 : 2;
      totalLength += height * quantiteVerticale;

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

  static calculatePAT40Length(config) {
    const { height, modulesCount, type, porteIndex, traverses } = config;
    let totalLength = 0;

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

    const isVisible = porte?.charniereType === "visible";
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";
    const withImposte =
      porte?.withImposte === true || porte?.withImposte === "true";

    if (isVisible) {
      totalLength += height * 2;
    } else {
      const quantite = withTierce ? 3 : 2;
      totalLength += height * quantite;
    }

    const expectedPorteProfiles = withTierce ? 4 : 2;
    totalLength += longueurPorte * expectedPorteProfiles;

    const expectedTHB40 = withTierce ? 4 : 2;
    const avgThbLength = (porte?.porteWidth || 600) - 100;
    totalLength += avgThbLength * expectedTHB40;

    if (withImposte) {
      const modulePorteIndex = config.porteIndex - 1;
      const modulePorte = config.modules?.[modulePorteIndex];
      if (modulePorte) {
        totalLength += modulePorte.width;
      }
    }

    return totalLength;
  }

  static calculatePorteParcloseLength(config) {
    if (config.type !== "porte") return 0;

    let totalLength = 0;
    const { height, porte } = config;

    const isVisible = porte?.charniereType === "visible";
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";
    const withImposte =
      porte?.withImposte === true || porte?.withImposte === "true";

    if (isVisible) {
      totalLength += height * 2;
    } else {
      const quantite = withTierce ? 3 : 2;
      totalLength += height * quantite;
    }

    if (withImposte) {
      const modulePorteIndex = config.porteIndex - 1;
      const modulePorte = config.modules?.[modulePorteIndex];
      if (modulePorte) {
        totalLength += modulePorte.width;
      }
    }
    if (withImposte) {
      const dimensionsOuverture = this.calculateDimensionsOuverture(config);
      const longueurImposte = config.height - dimensionsOuverture.hauteur;
      totalLength += longueurImposte * 2;
    }

    return totalLength;
  }

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

  static calculateLongueursGaucheDroite(config) {
    const { modulesCount, porteIndex } = config;
    let longueurGauche = 0;
    let longueurDroite = 0;

    if (porteIndex < 1 || porteIndex > modulesCount) {
      return { longueurGauche: 0, longueurDroite: 0 };
    }

    for (let i = 1; i < porteIndex; i++) {
      const moduleIndex = i - 1;
      const moduleWidth = config.modules?.[moduleIndex]?.width || 0;
      longueurGauche += moduleWidth;
    }
    longueurGauche += Math.max(0, porteIndex - 2) * 40;

    for (let i = porteIndex + 1; i <= modulesCount; i++) {
      const moduleIndex = i - 1;
      const moduleWidth = config.modules?.[moduleIndex]?.width || 0;
      longueurDroite += moduleWidth;
    }
    longueurDroite += Math.max(0, modulesCount - porteIndex - 1) * 40;

    return { longueurGauche, longueurDroite };
  }

  static countTraversesOnModule(traverses, moduleNumber) {
    if (!traverses || traverses.length === 0) {
      return 0;
    }

    return traverses.filter(
      (traverse) => traverse.modules && traverse.modules.includes(moduleNumber)
    ).length;
  }

  static calculateJTPE48(config) {
    const remplissageEpRaw = config.options?.remplissageEp || 6;
    const remplissageEp = parseInt(remplissageEpRaw, 10);
    const colorJoint = config.options?.colorJoint || "noir";

    let longueur = null;

    if (remplissageEp === 8) {
      let totalStructureLength = 0;

      const pc40Length = this.calculatePC40Length(config);
      totalStructureLength += pc40Length;

      const pt40Length = this.calculatePT40StructureLength(config);
      totalStructureLength += pt40Length * 2;

      if (config.type === "porte") {
        const porteStructureLength = this.calculatePorteStructureLength(config);
        totalStructureLength += porteStructureLength;
      }

      longueur = Math.ceil(totalStructureLength / 1000);
    } else {
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

  static calculateJRLP47(config) {
    const remplissageEpRaw = config.options?.remplissageEp || 6;
    const remplissageEp = parseInt(remplissageEpRaw, 10);
    const colorJoint = config.options?.colorJoint || "noir";

    let longueur = null;

    if (remplissageEp === 6) {
      let totalLength = 0;

      const pc40Length = this.calculatePC40Length(config);
      totalLength += pc40Length;

      const pt40Length = this.calculatePT40StructureLength(config);
      totalLength += pt40Length * 2;

      if (config.type === "porte") {
        const porteStructureLength = this.calculatePorteStructureLength(config);
        totalLength += porteStructureLength;
      }

      const pac40Length = this.calculatePAC40Length(config);
      totalLength += pac40Length;

      const pat40Length = this.calculatePAT40Length(config);
      totalLength += pat40Length * 2;

      if (config.type === "porte") {
        const porteParcloseLength = this.calculatePorteParcloseLength(config);
        totalLength += porteParcloseLength;
      }

      longueur = Math.ceil(totalLength / 1000);
    } else if (remplissageEp === 8) {
      let totalParcloseLength = 0;

      const pac40Length = this.calculatePAC40Length(config);
      totalParcloseLength += pac40Length;

      const pat40Length = this.calculatePAT40Length(config);
      totalParcloseLength += pat40Length * 2;

      if (config.type === "porte") {
        const porteParcloseLength = this.calculatePorteParcloseLength(config);
        totalParcloseLength += porteParcloseLength;
      }

      longueur = Math.ceil(totalParcloseLength / 1000);
    } else {
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
    if (config.type !== "porte") {
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

    const charniereType = config.porte?.charniereType || "visible";
    if (charniereType === "invisible") {
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

    const porteHeight = porte?.porteHeight || 0;

    if (porteHeight <= 2050) {
      quantity = 3;
    } else {
      quantity = 4;
    }

    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";
    if (withTierce) {
      quantity = quantity * 2;
    }

    const colorProfile = config.options?.colorProfile || "noir";
    const finition = this.getProfileColorLabel(colorProfile);

    return {
      ref: "PAUMDG",
      description: "Paumelles",
      quantity: quantity,
      length: null,
      totalPrice: 0,
      category: "quincaillerie",
      finition: finition,
    };
  }

  static getProfileColorLabel(colorProfile) {
    const colorMap = {
      noir: "Noir",
      gris: "Gris",
      blanc: "Blanc",
    };
    return colorMap[colorProfile] || "Noir";
  }

  static calculateIN300(config) {
    if (config.type !== "porte") {
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

    const charniereType = config.porte?.charniereType || "visible";
    if (charniereType === "visible") {
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

    const in300Table = {
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
    if (config.type !== "porte") {
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

    const charniereType = config.porte?.charniereType || "visible";
    if (charniereType === "visible") {
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

    const in303Table = {
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

  static getQuantityFromTable(config, table, accessoryName) {
    const { porte } = config;
    const porteWidth = porte?.porteWidth || 0;
    const porteHeight = porte?.porteHeight || 0;
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";

    const widths = [830, 930, 1030, 1130, 1230];
    const heights = [
      2040, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000,
    ];

    let refWidth;
    if (porteWidth < widths[0]) {
      refWidth = widths[0];
    } else if (porteWidth > widths[widths.length - 1]) {
      refWidth = widths[widths.length - 1];
    } else {
      refWidth =
        widths.find((w) => porteWidth <= w) || widths[widths.length - 1];
    }

    let refHeight;
    if (porteHeight < heights[0]) {
      refHeight = heights[0];
    } else if (porteHeight > heights[heights.length - 1]) {
      refHeight = heights[heights.length - 1];
    } else {
      refHeight =
        heights.find((h) => porteHeight <= h) || heights[heights.length - 1];
    }

    let quantity = table[refHeight]?.[refWidth] || 0;

    if (withTierce && quantity > 0) {
      quantity = quantity * 2;
    }

    return quantity;
  }

  static calculateCAPOTCI53(config) {
    if (config.type !== "porte") {
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

    const poci53Quantity = this.calculatePOCI53Quantity(config);

    const colorProfile = config.options?.colorProfile || "noir";
    const finition = this.getProfileColorLabel(colorProfile);

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
    if (config.type !== "porte") {
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

    const po40Quantity = this.calculatePO40Quantity(config);

    const colorProfile = config.options?.colorProfile || "noir";
    const finition = this.getProfileColorLabel(colorProfile);

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
    if (config.type !== "porte") {
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

    const po66Quantity = this.calculatePO66Quantity(config);
    const po6622uQuantity = this.calculatePO6622UQuantity(config);
    const totalQuantity = po66Quantity + po6622uQuantity;

    const colorProfile = config.options?.colorProfile || "noir";
    const finition = this.getProfileColorLabel(colorProfile);

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

  static calculatePOCI53Quantity(config) {
    const { porte } = config;
    const isInvisible = porte?.charniereType === "invisible";
    const withTierce =
      porte?.withTierce === true || porte?.withTierce === "true";

    if (!isInvisible) {
      return 0;
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
      if (isVisible) {
        quantity = isSerpen35m ? 1 : 2;
      } else if (isInvisible) {
        quantity = isSerpen35m ? 0 : 1;
      }
    } else {
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

    if (isSerpen35m && profileType === "po66") {
      return 1;
    }

    return 0;
  }

  static calculatePO6622UQuantity(config) {
    const { porte } = config;
    const isSerpen35m = porte?.serrure === "SERPEN35M";
    const profileType = porte?.profile || "po66";

    if (isSerpen35m && profileType === "po6622u") {
      return 1;
    }

    return 0;
  }

  static calculateBEQUILLE(config) {
    if (config.type !== "porte") {
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

    const quantity = serrure === "SERPEN35M" ? 1 : 0;

    const colorBequille = porte?.colorBequille || "noir";
    const finition = this.getBequilleColorLabel(colorBequille);

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
    if (config.type !== "porte") {
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

    const quantity =
      serrure === "SERROULM" || serrure === "SERROULPENM" ? 1 : 0;

    const colorProfile = config.options?.colorProfile || "noir";
    const finition = this.getProfileColorLabel(colorProfile);

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

  static getBequilleColorLabel(colorBequille) {
    const colorMap = {
      noir: "Noir",
      inox: "Inox",
    };
    return colorMap[colorBequille] || "Noir";
  }

  static calculateSERPENE35M(config) {
    if (config.type !== "porte") {
      return this.createEmptyAccessory("SERPENE35M", "Serrure pour béquille");
    }

    const serrure = config.porte?.serrure || "SERROULM";
    const quantity = serrure === "SERPEN35M" ? 1 : 0;

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
    if (config.type !== "porte") {
      return this.createEmptyAccessory("CYLINDRE35X35", "Cylindre avec clés");
    }

    const serrure = config.porte?.serrure || "SERROULM";
    const quantity = serrure === "SERPEN35M" ? 1 : 0;

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
    if (config.type !== "porte") {
      return this.createEmptyAccessory("SERROULM", "Serrure à rouleau");
    }

    const serrure = config.porte?.serrure || "SERROULM";
    const quantity = serrure === "SERROULM" ? 1 : 0;

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
    if (config.type !== "porte") {
      return this.createEmptyAccessory(
        "SERROULPENM",
        "Serrure à rouleau + pene + demi-cylindre"
      );
    }

    const serrure = config.porte?.serrure || "SERROULM";
    const quantity = serrure === "SERROULPENM" ? 1 : 0;

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
    if (config.type !== "porte") {
      return this.createEmptyAccessory(
        "GACHEPOUVM",
        "Gache de fermeture (Kit)"
      );
    }

    const serrure = config.porte?.serrure || "SERROULM";
    let quantity = 0;
    if (serrure === "SERPEN35M") {
      quantity = 2;
    } else if (serrure === "SERROULM") {
      quantity = 1;
    } else if (serrure === "SERROULPENM") {
      quantity = 2;
    }

    const colorProfile = config.options?.colorProfile || "noir";
    const finition = this.getGacheColorLabel(colorProfile);

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
    if (config.type !== "porte") {
      return this.createEmptyAccessory("VERROU23M", "Verrou à onglet");
    }

    const withTierce =
      config.porte?.withTierce === true || config.porte?.withTierce === "true";
    const quantity = withTierce ? 2 : 0;

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
    if (colorProfile === "blanc") {
      return "Blanc";
    } else {
      return "Noir";
    }
  }

  static calculatePVITRAGE(config) {
    if (config.type !== "porte") {
      return [];
    }

    const pvitrageLines = [];

    const colorPvitrage = config.porte?.colorPvitrage || "noir";
    const finition = this.getPvitrageColorLabel(colorPvitrage);

    const structurePorteData = this.calculatePvitrageForStructurePorte(
      config,
      finition
    );
    if (structurePorteData.quantity > 0) {
      pvitrageLines.push(structurePorteData);
    }

    const traverseLines = this.calculatePvitrageForTraverse(config, finition);
    pvitrageLines.push(...traverseLines);

    return pvitrageLines;
  }

  static calculatePvitrageForStructurePorte(config, finition) {
    const structurePorteProfiles = this.getPorteProfilesQuantities(
      config,
      "structure_porte"
    );

    const totalQuantity = structurePorteProfiles.reduce(
      (sum, profile) => sum + profile.quantity,
      0
    );

    const longueur = (config.porte?.porteHeight || 0) - 70;

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
    const pvitrageLines = [];

    const traverseProfiles = this.getPorteProfilesQuantities(
      config,
      "traverse"
    );

    const lengthGroups = new Map();

    traverseProfiles.forEach((profile) => {
      const length = profile.length;
      const currentData = lengthGroups.get(length) || {
        totalQuantity: 0,
        profiles: [],
      };

      let quantity;
      if (profile.ref === "THB40") {
        quantity = profile.quantity * 1;
      } else {
        quantity = profile.quantity * 2;
      }

      currentData.totalQuantity += quantity;
      currentData.profiles.push({ ...profile, calculatedQuantity: quantity });

      lengthGroups.set(length, currentData);
    });

    lengthGroups.forEach((data, length) => {
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

  static getPorteProfilesQuantities(config, categoryFilter) {
    const profiles = [];

    const { porte } = config;
    if (!porte) return profiles;

    const isVisible = porte.charniereType === "visible";
    const isInvisible = porte.charniereType === "invisible";
    const withTierce = porte.withTierce === true || porte.withTierce === "true";
    const isSerpen35m = porte.serrure === "SERPEN35M";
    const longueurPorte = (porte.porteHeight || 0) - 5;
    const profileType = porte.profile || "po66";

    if (categoryFilter === "structure_porte") {
      if (isInvisible) {
        const quantitePOCI53 = withTierce ? 2 : 1;
        profiles.push({
          ref: "POCI53",
          quantity: quantitePOCI53,
          length: longueurPorte,
          category: "structure_porte",
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
          quantity: quantitePO40,
          length: longueurPorte,
          category: "structure_porte",
        });
      }

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
      const porteWidth = porte.porteWidth || 0;
      const tierceWidth = porte.tierceWidth || 0;

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
        quantity: 2,
        length: largeurPorteInterne,
        category: "traverse",
      });

      let largeurTierceInterne = 0;
      if (withTierce) {
        largeurTierceInterne = isVisible
          ? tierceWidth - 40 - 40
          : tierceWidth - 53 - 40;

        profiles.push({
          ref: "THB40",
          quantity: 2,
          length: largeurTierceInterne,
          category: "traverse",
        });
      }

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

  static validateAccessories(accessories, config) {
    const warnings = [];

    const negativeQuantity = accessories.find((a) => a.quantity < 0);
    if (negativeQuantity) {
      warnings.push(`Quantité négative: ${negativeQuantity.ref}`);
    }

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
