export class References {
  /**
   * Données des serrures
   */
  static SERRURES = {
    SERROULM: "Rouleau seul",
    SERROULPENM: "Rouleau + Pêne + 1/2 cylindre",
    SERPEN35M: "Pêne demi-tour + Pêne dormant",
  };

  /**
   * Codes des profils selon leur utilisation
   */
  static PROFILE_CODES = {
    cadre_vertical: "PCV40_V",
    cadre_horizontal: "PCV40_H",
    cadre_imposte: "PCV40_IMP",
    intermediate: "PIV40",
    traverse_main: "TR40",
    traverse_porte: "TRP40",
  };

  /**
   * Descriptions des accessoires
   */
  static ACCESSOIRES = {
    CHARN_VIS: {
      nom: "Charnière visible",
      description: "Charnière visible acier thermolaqué",
      unite: "pcs",
    },
    CHARN_INV: {
      nom: "Charnière invisible",
      description: "Charnière invisible acier thermolaqué",
      unite: "pcs",
    },
    BEQ_NOIR: {
      nom: "Béquille noire",
      description: "Béquille aluminium thermolaqué noir",
      unite: "pcs",
    },
    BEQ_INOX: {
      nom: "Béquille inox",
      description: "Béquille aluminium finition inox",
      unite: "pcs",
    },
    JOINT_NOIR: {
      nom: "Joint vitrage noir",
      description: "Joint EPDM noir pour vitrage",
      unite: "ml",
    },
    JOINT_TRANSP: {
      nom: "Joint vitrage transparent",
      description: "Joint EPDM transparent pour vitrage",
      unite: "ml",
    },
    VISS_STD: {
      nom: "Visserie standard",
      description: "Kit visserie inox A2",
      unite: "kit",
    },
  };

  /**
   * Types de vitrages
   */
  static VITRAGES = {
    VITR_6: {
      nom: "Vitrage 6mm",
      description: "Verre feuilleté 33.1 - 6mm",
      unite: "m²",
    },
    VITR_8: {
      nom: "Vitrage 8mm",
      description: "Verre feuilleté 44.1 - 8mm",
      unite: "m²",
    },
  };

  /**
   * Obtient la description d'une serrure
   */
  static getSerrureDescription(code) {
    return this.SERRURES[code] || "Serrure inconnue";
  }

  /**
   * Obtient les informations d'un accessoire
   */
  static getAccessoire(code) {
    return (
      this.ACCESSOIRES[code] || {
        nom: "Accessoire inconnu",
        description: code,
        unite: "pcs",
      }
    );
  }

  /**
   * Obtient les informations d'un vitrage
   */
  static getVitrage(code) {
    return (
      this.VITRAGES[code] || {
        nom: "Vitrage inconnu",
        description: code,
        unite: "m²",
      }
    );
  }

  /**
   * Obtient le code d'un profil
   */
  static getProfileCode(type) {
    return this.PROFILE_CODES[type] || "PROF_UNK";
  }

  /**
   * Génère un code vitrage selon l'épaisseur
   */
  static getVitrageCode(epaisseur, type = "standard") {
    const suffix = type !== "standard" ? `_${type.toUpperCase()}` : "";
    return `VITR_${epaisseur}${suffix}`;
  }

  /**
   * Génère un code accessoire coloré
   */
  static getColoredAccessoireCode(base, color) {
    return `${base}_${color.toUpperCase()}`;
  }

  /**
   * Valide qu'un code existe
   */
  static isValidCode(code, category) {
    switch (category) {
      case "serrure":
        return code in this.SERRURES;
      case "accessoire":
        return code in this.ACCESSOIRES;
      case "vitrage":
        return code in this.VITRAGES;
      default:
        return false;
    }
  }

  /**
   * Obtient tous les codes d'une catégorie
   */
  static getAllCodes(category) {
    switch (category) {
      case "serrures":
        return Object.keys(this.SERRURES);
      case "accessoires":
        return Object.keys(this.ACCESSOIRES);
      case "vitrages":
        return Object.keys(this.VITRAGES);
      case "profiles":
        return Object.keys(this.PROFILE_CODES);
      default:
        return [];
    }
  }

  /**
   * Recherche une référence par mot-clé
   */
  static search(keyword, category = null) {
    const results = [];
    const searchTerm = keyword.toLowerCase();

    const searchInCategory = (items, cat) => {
      Object.entries(items).forEach(([code, info]) => {
        const searchableText =
          typeof info === "string"
            ? `${code} ${info}`.toLowerCase()
            : `${code} ${info.nom} ${info.description}`.toLowerCase();

        if (searchableText.includes(searchTerm)) {
          results.push({
            code,
            category: cat,
            info,
          });
        }
      });
    };

    if (!category || category === "serrures") {
      searchInCategory(this.SERRURES, "serrures");
    }
    if (!category || category === "accessoires") {
      searchInCategory(this.ACCESSOIRES, "accessoires");
    }
    if (!category || category === "vitrages") {
      searchInCategory(this.VITRAGES, "vitrages");
    }

    return results;
  }

  /**
   * Exporte toutes les références (pour debug ou export)
   */
  static exportAll() {
    return {
      serrures: this.SERRURES,
      accessoires: this.ACCESSOIRES,
      vitrages: this.VITRAGES,
      profiles: this.PROFILE_CODES,
    };
  }

  /**
   * Importe des références (pour extension future)
   */
  static import(data) {
    if (data.serrures) {
      Object.assign(this.SERRURES, data.serrures);
    }
    if (data.accessoires) {
      Object.assign(this.ACCESSOIRES, data.accessoires);
    }
    if (data.vitrages) {
      Object.assign(this.VITRAGES, data.vitrages);
    }
    if (data.profiles) {
      Object.assign(this.PROFILE_CODES, data.profiles);
    }

    console.log("📦 Références importées");
  }
}
