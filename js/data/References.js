// ===== js/data/References.js =====
export class References {
  /**
   * Base de données statique des produits
   */
  static profiles = {
    // Profils de cadre principaux
    PC40: {
      ref: "PC40",
      description: "Profil cadre 40",
      price: 0,
      unit: "mm",
      category: "structure",
      type: "cadre",
    },
    PAC40: {
      ref: "PAC40",
      description: "Parclose cadre 40",
      price: 0,
      unit: "mm",
      category: "parclose",
      type: "cadre",
    },
    PT40: {
      ref: "PT40",
      description: "Profil traverse 40",
      price: 0,
      unit: "mm",
      category: "structure",
      type: "traverse",
    },
    PAT40: {
      ref: "PAT40",
      description: "Parclose traverse 40",
      price: 0,
      unit: "mm",
      category: "parclose",
      type: "traverse",
    },
    PTPV51: {
      ref: "PTPV51",
      description: "Profil traverse paumelles visibles",
      price: 0,
      unit: "mm",
      category: "structure",
      type: "dormant",
    },
    PTCI51: {
      ref: "PTCI51",
      description: "Profil traverse charnières invisibles",
      price: 0,
      unit: "mm",
      category: "structure",
      type: "dormant",
    },
    PATP65: {
      ref: "PATP65",
      description: "Parclose traverse porte",
      price: 0,
      unit: "mm",
      category: "parclose",
      type: "dormant",
    },
    PIP14: {
      ref: "PIP14",
      description: "Profil imposte",
      price: 0,
      unit: "mm",
      category: "structure",
      type: "imposte",
    },
    PAIP65: {
      ref: "PAIP65",
      description: "Parclose imposte",
      price: 0,
      unit: "mm",
      category: "parclose",
      type: "imposte",
    },
    POCI53: {
      ref: "POCI53",
      description: "Profil ouvrant charnière invisible",
      price: 0,
      unit: "mm",
      category: "structure",
      type: "porte",
    },
    PO40: {
      ref: "PO40",
      description: "Profil ouvrant 40",
      price: 0,
      unit: "mm",
      category: "structure",
      type: "porte",
    },
    PO66: {
      ref: "PO66",
      description: "Profil ouvrant 66",
      price: 0,
      unit: "mm",
      category: "structure",
      type: "porte",
    },
    PO6622U: {
      ref: "PO6622U",
      description: "Profil ouvrant 66 usiné",
      price: 0,
      unit: "mm",
      category: "structure",
      type: "porte",
    },
    THB40: {
      ref: "THB40",
      description: "Traverse haute et basse 40",
      price: 0,
      unit: "mm",
      category: "traverse",
      type: "porte",
    },
    TI28: {
      ref: "TI28",
      description: "Traverse intermédiaire 28",
      price: 0,
      unit: "mm",
      category: "traverse",
      type: "porte",
    },
    TI37: {
      ref: "TI37",
      description: "Traverse intermédiaire 37",
      price: 0,
      unit: "mm",
      category: "traverse",
      type: "porte",
    },
    PF23: {
      ref: "PF23",
      description: "Profil de finition 23",
      price: 0,
      unit: "mm",
      category: "finition",
      type: "porte",
    },
    PF33: {
      ref: "PF33",
      description: "Profil de finition 33",
      price: 0,
      unit: "mm",
      category: "finition",
      type: "porte",
    },
  };

  /**
   * Quincaillerie et accessoires
   */
  static accessories = {
    // Charnières
    CHARN_VIS: {
      ref: "CHARN_VIS",
      description: "Charnière visible",
      price: 25.0,
      unit: "pcs",
      category: "quincaillerie",
      type: "charniere",
    },

    CHARN_INV: {
      ref: "CHARN_INV",
      description: "Charnière invisible",
      price: 35.0,
      unit: "pcs",
      category: "quincaillerie",
      type: "charniere",
    },

    // Serrures
    SERROULM: {
      ref: "SERROULM",
      description: "Serrure rouleau seul",
      price: 45.0,
      unit: "pcs",
      category: "quincaillerie",
      type: "serrure",
    },

    SERROULPENM: {
      ref: "SERROULPENM",
      description: "Serrure rouleau + pêne + 1/2 cylindre",
      price: 78.0,
      unit: "pcs",
      category: "quincaillerie",
      type: "serrure",
    },

    SERPEN35M: {
      ref: "SERPEN35M",
      description: "Serrure pêne demi-tour + pêne dormant",
      price: 89.0,
      unit: "pcs",
      category: "quincaillerie",
      type: "serrure",
    },

    // Béquilles
    BEQNOIR: {
      ref: "BEQNOIR",
      description: "Béquille noire",
      price: 12.5,
      unit: "pcs",
      category: "quincaillerie",
      type: "bequille",
    },

    BEQINOX: {
      ref: "BEQINOX",
      description: "Béquille inox",
      price: 18.0,
      unit: "pcs",
      category: "quincaillerie",
      type: "bequille",
    },

    // Joints
    JOINOIR: {
      ref: "JOINOIR",
      description: "Joint vitrage noir",
      price: 2.8,
      unit: "ml",
      category: "etancheite",
      type: "joint",
    },

    JOINTRANSP: {
      ref: "JOINTRANSP",
      description: "Joint vitrage transparent",
      price: 2.8,
      unit: "ml",
      category: "etancheite",
      type: "joint",
    },

    JOIBLANC: {
      ref: "JOIBLANC",
      description: "Joint vitrage blanc",
      price: 2.8,
      unit: "ml",
      category: "etancheite",
      type: "joint",
    },
  };

  /**
   * Remplissage vitrage
   */
  static glass = {
    VITR6: {
      ref: "VITR6",
      description: "Vitrage 6mm transparent",
      price: 45.0,
      unit: "m²",
      category: "remplissage",
      type: "vitrage",
      thickness: 6,
    },

    VITR8: {
      ref: "VITR8",
      description: "Vitrage 8mm transparent",
      price: 52.0,
      unit: "m²",
      category: "remplissage",
      type: "vitrage",
      thickness: 8,
    },
  };

  /**
   * Finitions et couleurs
   */
  static finishes = {
    RAL9005: {
      ref: "RAL9005",
      description: "Laquage noir RAL 9005 granité",
      price: 3.2,
      unit: "ml",
      category: "finition",
      color: "noir",
    },

    RAL7016: {
      ref: "RAL7016",
      description: "Laquage gris RAL 7016 granité",
      price: 3.2,
      unit: "ml",
      category: "finition",
      color: "gris",
    },

    RAL9003: {
      ref: "RAL9003",
      description: "Laquage blanc RAL 9003 granité",
      price: 3.5,
      unit: "ml",
      category: "finition",
      color: "blanc",
    },
  };

  /**
   * Récupère tous les produits d'une catégorie
   */
  static getByCategory(category) {
    const allProducts = {
      ...this.profiles,
      ...this.accessories,
      ...this.glass,
      ...this.finishes,
    };

    return Object.values(allProducts).filter(
      (product) => product.category === category
    );
  }

  /**
   * Récupère un produit par référence
   */
  static getByRef(ref) {
    const allProducts = {
      ...this.profiles,
      ...this.accessories,
      ...this.glass,
      ...this.finishes,
    };

    return allProducts[ref] || null;
  }

  /**
   * Calcule le prix avec finition
   */
  static calculatePriceWithFinish(baseProduct, finishColor, length = 1) {
    if (!baseProduct) return 0;

    let totalPrice = baseProduct.price * length;

    // Ajouter le coût de finition si applicable
    if (
      baseProduct.category === "structure" ||
      baseProduct.category === "porte"
    ) {
      const finishKey = `RAL${this.getColorRAL(finishColor)}`;
      const finish = this.finishes[finishKey];
      if (finish) {
        totalPrice += finish.price * length;
      }
    }

    return Math.round(totalPrice * 100) / 100;
  }

  /**
   * Convertit nom couleur en code RAL
   */
  static getColorRAL(colorName) {
    const colorMap = {
      noir: "9005",
      gris: "7016",
      blanc: "9003",
    };
    return colorMap[colorName] || "9005";
  }

  /**
   * Récupère la référence de joint selon la couleur
   */
  static getJointRef(color) {
    const jointMap = {
      noir: "JOINOIR",
      transp: "JOINTRANSP",
      blanc: "JOIBLANC",
    };
    return jointMap[color] || "JOINOIR";
  }

  /**
   * Récupère la référence de béquille selon la couleur
   */
  static getBequilleRef(color) {
    const bequilleMap = {
      noir: "BEQNOIR",
      inox: "BEQINOX",
    };
    return bequilleMap[color] || "BEQNOIR";
  }

  /**
   * Récupère la référence de charnière selon le type
   */
  static getCharniereRef(type) {
    const charniereMap = {
      visible: "CHARN_VIS",
      invisible: "CHARN_INV",
    };
    return charniereMap[type] || "CHARN_VIS";
  }

  /**
   * Récupère la référence de vitrage selon l'épaisseur
   */
  static getVitrageRef(thickness) {
    return thickness === 8 ? "VITR8" : "VITR6";
  }

  /**
   * Validations métier
   */
  static validateProductCompatibility(productRef, config) {
    const product = this.getByRef(productRef);
    if (!product) return { valid: false, message: "Produit inexistant" };

    // Validation hauteur pour profils porte
    if (product.type === "porte" && config.porte?.porteHeight) {
      if (config.porte.porteHeight > product.maxHeight) {
        return {
          valid: false,
          message: `Hauteur max: ${product.maxHeight}mm pour ${productRef}`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Recherche produits par critères
   */
  static search(criteria = {}) {
    const allProducts = {
      ...this.profiles,
      ...this.accessories,
      ...this.glass,
      ...this.finishes,
    };

    return Object.values(allProducts).filter((product) => {
      if (criteria.category && product.category !== criteria.category)
        return false;
      if (criteria.type && product.type !== criteria.type) return false;
      if (criteria.maxPrice && product.price > criteria.maxPrice) return false;
      if (criteria.minPrice && product.price < criteria.minPrice) return false;
      return true;
    });
  }

  /**
   * Statistiques prix
   */
  static getPriceStats(category = null) {
    const products = category
      ? this.getByCategory(category)
      : Object.values({
          ...this.profiles,
          ...this.accessories,
          ...this.glass,
          ...this.finishes,
        });

    if (products.length === 0) return null;

    const prices = products.map((p) => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg:
        Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) /
        100,
      count: products.length,
    };
  }
}
