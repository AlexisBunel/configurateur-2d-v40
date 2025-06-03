/**
 * calculations.js - Gestionnaire de calculs
 * Responsable de tous les calculs métier (débits, quantités, dimensions)
 */

/**
 * Gestionnaire de calculs métier
 */
const Calculator = {
  /**
   * Initialise le gestionnaire de calculs
   */
  init() {
    console.log("🧮 Initialisation du gestionnaire de calculs");

    // Configure les écouteurs d'événements
    this._setupEventListeners();

    console.log("✅ Gestionnaire de calculs initialisé");
  },

  /**
   * Configure les écouteurs d'événements
   * @private
   */
  _setupEventListeners() {
    // Recalcule quand la configuration change
    EventBus.on(EVENTS.CONFIG_UPDATED, () => {
      this.calculateAll();
    });

    EventBus.on(EVENTS.CONFIG_LOADED, () => {
      this.calculateAll();
    });
  },

  /**
   * Calcule les dimensions d'ouverture de la porte
   * @param {Object} config - Configuration de la verrière
   * @returns {Object} Dimensions d'ouverture
   */
  calculateDimensionsOuverture(config) {
    if (config.type !== "porte") {
      return { hauteur: 0, largeur: 0, hasOuverture: false };
    }

    let hauteur, largeur;

    // Calcul de la hauteur
    if (config.porte?.withImposte) {
      hauteur = (config.porte?.porteHeight || 0) + 15 + 51;
    } else {
      hauteur = config.height || 0;
    }

    // Calcul de la largeur
    const porteWidth = config.porte?.porteWidth || 0;
    const charniere = config.porte?.charniereType || "visible";
    const withTierce = config.porte?.withTierce || false;
    const tierceWidth = config.porte?.tierceWidth || 0;

    if (!withTierce) {
      largeur = porteWidth + 102 + (charniere === "invisible" ? 6 : 10);
    } else {
      largeur =
        porteWidth + tierceWidth + 102 + (charniere === "invisible" ? 11 : 15);
    }

    return {
      hauteur,
      largeur,
      hasOuverture: config.type === "porte",
    };
  },

  /**
   * Calcule la largeur disponible pour les modules
   * @param {Object} config - Configuration de la verrière
   * @returns {number} Largeur disponible en mm
   */
  calculateAvailableModuleWidth(config) {
    const totalWidth = config.width;
    const modulesCount = config.modulesCount;
    const hasPorte = config.type === "porte";

    let profilsWidth = (Number(modulesCount) + 1) * 40;

    if (hasPorte) {
      profilsWidth += 22;
    }

    const availableWidth = totalWidth - profilsWidth;
    console.log(`📏 Largeur disponible pour modules: ${availableWidth}mm`);

    return availableWidth;
  },

  /**
   * Calcule la largeur du module contenant la porte
   * @param {Object} config - Configuration de la verrière
   * @returns {number} Largeur du module porte en mm
   */
  calculatePorteModuleWidth(config) {
    if (!config.porte) return 0;

    const porteWidth = config.porte.porteWidth || 730;
    const charniereType = config.porte.charniereType || "visible";
    const withTierce = config.porte.withTierce || false;
    const tierceWidth = config.porte.tierceWidth || 350;

    let totalWidth = porteWidth;

    // Ajout charnières
    if (charniereType === "invisible") {
      totalWidth += 6;
    } else {
      totalWidth += 10;
    }

    // Ajout tierce si présente
    if (withTierce) {
      totalWidth += 5 + tierceWidth;
    }

    return totalWidth;
  },

  /**
   * Distribue les largeurs de modules
   * @param {Object} config - Configuration de la verrière
   * @returns {Array} Largeurs des modules en mm
   */
  distributeModuleWidths(config) {
    const availableWidth = this.calculateAvailableModuleWidth(config);
    const modulesCount = config.modulesCount;
    const porteIndex = config.porteIndex;
    const hasPorte = config.type === "porte";

    let moduleWidths = [];

    if (hasPorte) {
      const porteModuleWidth = this.calculatePorteModuleWidth(config);
      const remainingWidth = availableWidth - porteModuleWidth;
      const freeModulesCount = modulesCount - 1;
      const standardModuleWidth = Math.floor(remainingWidth / freeModulesCount);

      // Répartir les largeurs
      for (let i = 0; i < modulesCount; i++) {
        if (i === porteIndex) {
          moduleWidths.push(porteModuleWidth);
        } else {
          moduleWidths.push(standardModuleWidth);
        }
      }
    } else {
      // Pas de porte = répartition égale
      const standardModuleWidth = Math.floor(availableWidth / modulesCount);
      for (let i = 0; i < modulesCount; i++) {
        moduleWidths.push(standardModuleWidth);
      }
    }

    console.log(`📐 Largeurs modules calculées:`, moduleWidths);
    return moduleWidths;
  },

  /**
   * Valide la hauteur de porte selon les contraintes
   * @param {Object} config - Configuration de la verrière
   * @returns {Object} Résultat de validation avec hauteur corrigée
   */
  validatePorteHeight(config) {
    if (config.type !== "porte") return { isValid: true, height: 0 };

    const withImposte = config.porte?.withImposte || false;
    const withDormant = config.porte?.withDormant || false;
    const totalHeight = config.height || 2500;
    const currentHeight = config.porte?.porteHeight || 2200;

    let result = {
      isValid: true,
      height: currentHeight,
      isReadOnly: false,
      minHeight: 500,
      maxHeight: totalHeight,
    };

    if (!withImposte) {
      // Sans imposte : hauteur calculée automatiquement
      let calculatedHeight = totalHeight - 15; // Jeu de 15mm par défaut

      if (withDormant) {
        calculatedHeight -= 51; // Soustraire 51mm pour le dormant haut
      }

      result.height = calculatedHeight;
      result.isReadOnly = true;
    } else {
      // Avec imposte : hauteur modifiable par l'utilisateur
      const maxHeight = totalHeight - 40 - 250 - 51 - 15; // 40 (traverse), 250 (min imposte), 51 (dormant), 15 (jeu)

      result.maxHeight = maxHeight;
      result.isReadOnly = false;

      // Vérifier et ajuster la valeur actuelle si nécessaire
      if (currentHeight > maxHeight) {
        result.height = maxHeight;
        result.isValid = false;
      } else if (currentHeight < 500) {
        result.height = 500;
        result.isValid = false;
      }
    }

    return result;
  },

  /**
   * Calcule la largeur de porte pour un module unique
   * @param {Object} config - Configuration de la verrière
   * @returns {Object} Résultat avec largeurs calculées
   */
  calculateSingleModulePorte(config) {
    if (config.modulesCount !== 1 || config.type !== "porte") {
      return { isSingleModule: false };
    }

    const width = config.width || 4000;
    const withTierce = config.porte?.withTierce || false;
    const charniereType = config.porte?.charniereType || "visible";
    const currentPorteWidth = config.porte?.porteWidth || 730;

    let result = {
      isSingleModule: true,
      porteWidth: currentPorteWidth,
      tierceWidth: config.porte?.tierceWidth || 350,
      isPorteReadOnly: false,
      isTierceReadOnly: false,
    };

    if (!withTierce) {
      // Largeur de porte imposée = largeur totale - profils - charnières
      if (charniereType === "visible") {
        result.porteWidth = width - 102 - 10; // 102 = profils, 10 = charnières visibles
      } else {
        result.porteWidth = width - 102 - 6; // 102 = profils, 6 = charnières invisibles
      }
      result.isPorteReadOnly = true;
    } else {
      // Avec tierce : calcul des limites
      const availableWidth =
        width - 51 - 51 - (charniereType === "visible" ? 15 : 11);
      const minPorteWidth = Math.ceil(availableWidth / 2);
      const maxPorteWidth = availableWidth - 200; // 200 = largeur mini tierce

      // Ajuster la largeur de porte si nécessaire
      if (currentPorteWidth < minPorteWidth) {
        result.porteWidth = minPorteWidth;
      } else if (currentPorteWidth > maxPorteWidth) {
        result.porteWidth = maxPorteWidth;
      }

      // Calculer la largeur de tierce
      result.tierceWidth = availableWidth - result.porteWidth;
      result.isTierceReadOnly = true;

      result.minPorteWidth = minPorteWidth;
      result.maxPorteWidth = maxPorteWidth;
    }

    return result;
  },

  /**
   * Lance tous les calculs
   */
  calculateAll() {
    try {
      const config = ConfigManager.getConfig();

      // Calcule les débits de profilés
      const profiles = this.calculateProfiles(config);

      // Calcule les accessoires
      const accessories = this.calculateAccessories(config);

      // Calcule le remplissage
      const filling = this.calculateFilling(config);

      // Émet l'événement avec tous les résultats
      EventBus.emit(EVENTS.CALC_COMPLETED, {
        profiles,
        accessories,
        filling,
      });
    } catch (error) {
      console.error("❌ Erreur de calcul:", error);
      EventBus.emit(EVENTS.ERROR_CALCULATION, { message: error.message });
    }
  },

  /**
   * Calcule les débits de profilés
   * @param {Object} config - Configuration de la verrière
   * @returns {Array} Liste des profilés avec quantités
   */
  calculateProfiles(config) {
    const profiles = [];

    // Montants verticaux
    const montantsCount = config.modulesCount + 1; // Un montant de plus que de modules
    profiles.push({
      reference: "MT40",
      designation: "Montant 40",
      finition: this._getFinitionText(config.options.colorProfile),
      longueur: config.height,
      quantite: montantsCount,
      prixUnitaire: 15.5, // Prix au mètre linéaire
      total: (config.height / 1000) * montantsCount * 15.5,
    });

    // Traverses hautes et basses
    profiles.push({
      reference: "TR40",
      designation: "Traverse haute/basse 40",
      finition: this._getFinitionText(config.options.colorProfile),
      longueur: config.width,
      quantite: 2, // Une en haut, une en bas
      prixUnitaire: 12.3,
      total: (config.width / 1000) * 2 * 12.3,
    });

    // Traverses intermédiaires
    config.traverses.forEach((traverse) => {
      profiles.push({
        reference: traverse.type === "TI37" ? "TI37" : "TI28",
        designation: `Traverse intermédiaire ${
          traverse.type === "TI37" ? "37" : "28"
        }`,
        finition: this._getFinitionText(config.options.colorProfile),
        longueur: config.width,
        quantite: 1,
        prixUnitaire: traverse.type === "TI37" ? 14.2 : 11.8,
        total: (config.width / 1000) * (traverse.type === "TI37" ? 14.2 : 11.8),
      });
    });

    // Profilés de porte si applicable
    if (config.type === "porte") {
      profiles.push(...this._calculatePorteProfiles(config));
    }

    return profiles;
  },

  /**
   * Calcule les profilés spécifiques à la porte
   * @private
   */
  _calculatePorteProfiles(config) {
    const porteProfiles = [];

    // Dormant de porte
    const dormantPerimeter =
      2 * (config.porte.porteWidth + config.porte.porteHeight);
    porteProfiles.push({
      reference: "DO66",
      designation: "Dormant porte 66",
      finition: this._getFinitionText(config.options.colorProfile),
      longueur: dormantPerimeter,
      quantite: 1,
      prixUnitaire: 18.5,
      total: (dormantPerimeter / 1000) * 18.5,
    });

    // Ouvrant de porte
    const ouvrantPerimeter =
      2 * (config.porte.porteWidth + config.porte.porteHeight);
    const profilePorteRef =
      config.porte.profile === "po6622u" ? "PO6622U" : "PO66";
    const profilePortePrice = config.porte.profile === "po6622u" ? 22.3 : 19.8;

    porteProfiles.push({
      reference: profilePorteRef,
      designation:
        config.porte.profile === "po6622u"
          ? "Profil porte 66 usiné"
          : "Profil porte 66",
      finition: this._getFinitionText(config.options.colorProfile),
      longueur: ouvrantPerimeter,
      quantite: 1,
      prixUnitaire: profilePortePrice,
      total: (ouvrantPerimeter / 1000) * profilePortePrice,
    });

    // Traverses sur porte
    config.traversesPorte.forEach((traverse) => {
      const traverseType = config.porte.traverseType;
      porteProfiles.push({
        reference: `TRP${traverseType}`,
        designation: `Traverse porte ${traverseType}mm`,
        finition: this._getFinitionText(config.options.colorProfile),
        longueur: config.porte.porteWidth,
        quantite: 1,
        prixUnitaire: traverseType === "37" ? 16.2 : 13.8,
        total:
          (config.porte.porteWidth / 1000) *
          (traverseType === "37" ? 16.2 : 13.8),
      });
    });

    // Tierce si applicable
    if (config.porte.withTierce) {
      const tiercePerimeter =
        2 * (config.porte.tierceWidth + config.porte.porteHeight);
      porteProfiles.push({
        reference: "TIERCE",
        designation: "Tierce fixe",
        finition: this._getFinitionText(config.options.colorProfile),
        longueur: tiercePerimeter,
        quantite: 1,
        prixUnitaire: 16.5,
        total: (tiercePerimeter / 1000) * 16.5,
      });
    }

    return porteProfiles;
  },

  /**
   * Calcule les accessoires nécessaires
   * @param {Object} config - Configuration de la verrière
   * @returns {Array} Liste des accessoires avec quantités
   */
  calculateAccessories(config) {
    const accessories = [];

    // Accessoires de base pour la structure
    accessories.push({
      reference: "ANGLE40",
      designation: "Équerre d'assemblage 40",
      quantite: this._calculateCornerCount(config),
      finition: "-",
      longueur: "-",
      prixUnitaire: 3.5,
      total: this._calculateCornerCount(config) * 3.5,
    });

    // Joints d'étanchéité
    const jointPerimeter = 2 * (config.width + config.height);
    accessories.push({
      reference: "JOINT6",
      designation: "Joint d'étanchéité EPDM",
      quantite: Math.ceil(jointPerimeter / 1000), // Au mètre linéaire
      finition: this._getJointColor(config.options.colorJoint),
      longueur: `${jointPerimeter}mm`,
      prixUnitaire: 4.2,
      total: Math.ceil(jointPerimeter / 1000) * 4.2,
    });

    // Accessoires de porte si applicable
    if (config.type === "porte") {
      accessories.push(...this._calculatePorteAccessories(config));
    }

    return accessories;
  },

  /**
   * Calcule les accessoires spécifiques à la porte
   * @private
   */
  _calculatePorteAccessories(config) {
    const porteAccessories = [];

    // Charnières
    const charniereCount = this._calculateCharniereCount(
      config.porte.porteHeight
    );
    const charniereRef =
      config.porte.charniereType === "invisible" ? "CHARNINV" : "CHARNVIS";
    const charnierePrice =
      config.porte.charniereType === "invisible" ? 45.0 : 25.0;

    porteAccessories.push({
      reference: charniereRef,
      designation:
        config.porte.charniereType === "invisible"
          ? "Charnière invisible"
          : "Charnière visible",
      quantite: charniereCount,
      finition:
        config.porte.charniereType === "invisible" ? "Inox" : "Laqué noir",
      longueur: "-",
      prixUnitaire: charnierePrice,
      total: charniereCount * charnierePrice,
    });

    // Serrure
    const serrurePrice = this._getSerrurePrice(config.porte.serrure);
    porteAccessories.push({
      reference: config.porte.serrure,
      designation: this._getSerrureDesignation(config.porte.serrure),
      quantite: 1,
      finition: config.porte.colorBequille === "inox" ? "Inox" : "Noir",
      longueur: "-",
      prixUnitaire: serrurePrice,
      total: serrurePrice,
    });

    // Béquille
    porteAccessories.push({
      reference: "BEQUILLE",
      designation: "Béquille de porte",
      quantite: 1,
      finition: config.porte.colorBequille === "inox" ? "Inox" : "Noir",
      longueur: "-",
      prixUnitaire: 35.0,
      total: 35.0,
    });

    // Joint de vitrage porte
    const jointVitrageLength =
      2 * (config.porte.porteWidth + config.porte.porteHeight);
    porteAccessories.push({
      reference: "JOINTVIT",
      designation: "Joint de vitrage porte",
      quantite: Math.ceil(jointVitrageLength / 1000),
      finition:
        config.porte.colorPvitrage === "transp" ? "Transparent" : "Noir",
      longueur: `${jointVitrageLength}mm`,
      prixUnitaire: 2.8,
      total: Math.ceil(jointVitrageLength / 1000) * 2.8,
    });

    return porteAccessories;
  },

  /**
   * Calcule le remplissage (vitrage)
   * @param {Object} config - Configuration de la verrière
   * @returns {Array} Liste des éléments de remplissage
   */
  calculateFilling(config) {
    const filling = [];

    // Calcule la surface de vitrage pour chaque module
    config.moduleWidths.forEach((moduleWidth, index) => {
      // Hauteur effective (moins les traverses)
      let effectiveHeight = config.height;

      // Si c'est le module avec porte, calcule différemment
      if (config.type === "porte" && index === config.porteIndex) {
        // Vitrage de porte
        filling.push({
          reference: `VITR${config.options.remplissageEp}`,
          designation: `Vitrage ${config.options.remplissageEp}mm`,
          epaisseur: `${config.options.remplissageEp}mm`,
          dimensions: `${config.porte.porteWidth}mm x ${config.porte.porteHeight}mm`,
          surface:
            (config.porte.porteWidth * config.porte.porteHeight) / 1000000, // m²
          type: "Porte",
        });

        // Vitrage imposte si applicable
        if (config.porte.withImposte) {
          const imposteHeight = config.height - config.porte.porteHeight;
          if (imposteHeight > 0) {
            filling.push({
              reference: `VITR${config.options.remplissageEp}`,
              designation: `Vitrage ${config.options.remplissageEp}mm`,
              epaisseur: `${config.options.remplissageEp}mm`,
              dimensions: `${config.porte.porteWidth}mm x ${imposteHeight}mm`,
              surface: (config.porte.porteWidth * imposteHeight) / 1000000,
              type: "Imposte",
            });
          }
        }

        // Vitrage tierce si applicable
        if (config.porte.withTierce) {
          filling.push({
            reference: `VITR${config.options.remplissageEp}`,
            designation: `Vitrage ${config.options.remplissageEp}mm`,
            epaisseur: `${config.options.remplissageEp}mm`,
            dimensions: `${config.porte.tierceWidth}mm x ${config.porte.porteHeight}mm`,
            surface:
              (config.porte.tierceWidth * config.porte.porteHeight) / 1000000,
            type: "Tierce",
          });
        }
      } else {
        // Vitrage standard pour les autres modules
        filling.push({
          reference: `VITR${config.options.remplissageEp}`,
          designation: `Vitrage ${config.options.remplissageEp}mm`,
          epaisseur: `${config.options.remplissageEp}mm`,
          dimensions: `${moduleWidth}mm x ${effectiveHeight}mm`,
          surface: (moduleWidth * effectiveHeight) / 1000000,
          type: `Module ${index + 1}`,
        });
      }
    });

    return filling;
  },

  /**
   * Calcule le nombre de charnières nécessaires selon la hauteur de porte
   * @private
   */
  _calculateCharniereCount(porteHeight) {
    if (porteHeight <= 1500) return 2;
    if (porteHeight <= 2500) return 3;
    return 4; // Pour les portes très hautes
  },

  /**
   * Calcule le nombre d'équerres d'assemblage
   * @private
   */
  _calculateCornerCount(config) {
    // 4 coins de base + 2 par traverse + jonctions modules
    let count = 4; // Coins de base
    count += config.traverses.length * 2; // 2 équerres par traverse
    count += (config.modulesCount - 1) * 2; // Jonctions entre modules

    if (config.type === "porte") {
      count += 8; // Dormant de porte (4 coins + liaisons)
    }

    return count;
  },

  /**
   * Retourne le texte de finition selon la couleur
   * @private
   */
  _getFinitionText(color) {
    const finitions = {
      noir: "Laqué noir RAL 9005 granité",
      gris: "Laqué gris RAL 7016 granité",
      blanc: "Laqué blanc RAL 9003 granité",
    };
    return finitions[color] || finitions["noir"];
  },

  /**
   * Retourne la couleur du joint
   * @private
   */
  _getJointColor(color) {
    const colors = {
      noir: "Noir",
      transp: "Transparent",
      blanc: "Blanc",
    };
    return colors[color] || colors["noir"];
  },

  /**
   * Retourne le prix de la serrure selon le type
   * @private
   */
  _getSerrurePrice(serrureType) {
    const prices = {
      SERROULM: 85.0,
      SERROULPENM: 125.0,
      SERPEN35M: 95.0,
    };
    return prices[serrureType] || prices["SERROULM"];
  },

  /**
   * Retourne la désignation de la serrure
   * @private
   */
  _getSerrureDesignation(serrureType) {
    const designations = {
      SERROULM: "Serrure à rouleau seul",
      SERROULPENM: "Serrure rouleau + pêne + 1/2 cylindre",
      SERPEN35M: "Serrure pêne demi-tour + pêne dormant",
    };
    return designations[serrureType] || designations["SERROULM"];
  },

  /**
   * Calcule les dimensions d'ouverture de la porte
   * @param {Object} config - Configuration de la verrière
   * @returns {Object} Dimensions d'ouverture
   */
  calculatePorteOpeningDimensions(config) {
    if (config.type !== "porte") return null;

    // Calculs simplifiés pour l'instant
    const ouvertureLargeur = config.porte.porteWidth - 40; // Moins les profils
    const ouvertureHauteur = config.porte.porteHeight - 40; // Moins les profils

    return {
      largeur: ouvertureLargeur,
      hauteur: ouvertureHauteur,
      surface: (ouvertureLargeur * ouvertureHauteur) / 1000000, // m²
    };
  },

  /**
   * Valide que les modules tiennent dans la largeur totale
   * @param {Array} moduleWidths - Largeurs des modules
   * @param {number} totalWidth - Largeur totale de la verrière
   * @returns {Object} Résultat de validation
   */
  validateModuleWidths(moduleWidths, totalWidth) {
    const sumModules = moduleWidths.reduce((sum, width) => sum + width, 0);
    const profilesWidth = (moduleWidths.length + 1) * 40; // Largeur des montants
    const totalCalculated = sumModules + profilesWidth;

    return {
      isValid: Math.abs(totalCalculated - totalWidth) <= 10, // Tolérance de 10mm
      difference: totalCalculated - totalWidth,
      totalCalculated: totalCalculated,
    };
  },
};

// Export pour utilisation en mode debug
if (typeof window !== "undefined" && window.VerriereApp) {
  window.VerriereApp.Calculator = Calculator;
}
