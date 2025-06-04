import { SELECTORS, COLORS } from "../constants.js";
import { Calculator } from "../core/Calculator.js";
import { References } from "../data/References.js";

/**
 * Gestionnaire de rendu des tableaux de débits
 * Remplace debits.js avec une approche plus propre
 */
export class TableRenderer {
  constructor() {
    this._tables = {
      profiles: null,
      accessoires: null,
      remplissage: null,
    };
  }

  /**
   * Initialise le renderer de tableaux
   */
  initialize() {
    // Récupérer les éléments DOM
    this._tables.profiles = document.querySelector(SELECTORS.TABLES.PROFILES);
    this._tables.accessoires = document.querySelector(
      SELECTORS.TABLES.ACCESSOIRES
    );
    this._tables.remplissage = document.querySelector(
      SELECTORS.TABLES.REMPLISSAGE
    );

    // Vérifier que tous les tableaux existent
    Object.entries(this._tables).forEach(([name, table]) => {
      if (!table) {
        console.warn(`⚠️ Tableau ${name} non trouvé`);
      }
    });

    console.log("✅ TableRenderer initialisé");
  }

  /**
   * Met à jour tous les tableaux avec la nouvelle configuration
   */
  update(config) {
    try {
      // Calculer tous les éléments nécessaires
      const elements = this._calculateAllElements(config);

      // Rendre chaque tableau
      this._renderProfilesTable(elements.profiles);
      this._renderAccessoiresTable(elements.accessoires);
      this._renderRemplissageTable(elements.remplissages);

      console.log("📊 Tableaux mis à jour");
    } catch (error) {
      console.error("❌ Erreur mise à jour tableaux:", error);
      this._renderErrorTables();
    }
  }

  /**
   * Vide tous les tableaux
   */
  clear() {
    Object.values(this._tables).forEach((table) => {
      if (table) {
        table.innerHTML = "<caption>Chargement...</caption>";
      }
    });
  }

  // ============================================
  // MÉTHODES PRIVÉES
  // ============================================

  /**
   * Calcule tous les éléments nécessaires
   */
  _calculateAllElements(config) {
    const profiles = Calculator.calculateProfiles(config);
    const accessoires = this._calculateAccessoires(config);
    const remplissages = this._calculateRemplissages(config);

    return {
      profiles: this._processProfiles(profiles, config),
      accessoires,
      remplissages,
    };
  }

  /**
   * Traite les profils calculés pour le tableau
   */
  _processProfiles(profiles, config) {
    const colorProfile = config.options?.colorProfile || "noir";

    return profiles.map((profile) => ({
      codeBase: this._getProfileCode(profile.type),
      description: profile.description,
      longueur: profile.longueur,
      quantite: profile.quantite,
      couleur: colorProfile,
      type: profile.type,
    }));
  }

  /**
   * Calcule les accessoires nécessaires
   */
  _calculateAccessoires(config) {
    const accessoires = [];

    if (config.type === "porte") {
      const { porte } = config;

      // Charnières
      const charniereQty = 3; // Standard 3 charnières par porte
      accessoires.push({
        code: porte.charniereType === "visible" ? "CHARN_VIS" : "CHARN_INV",
        nom: "Charnières",
        description: `Charnière ${porte.charniereType}`,
        quantite: charniereQty,
        couleur: config.options?.colorProfile || "noir",
      });

      // Serrure
      accessoires.push({
        code: porte.serrure || "SERROULM",
        nom: "Serrure",
        description: References.getSerrureDescription(porte.serrure),
        quantite: 1,
        couleur: "standard",
      });

      // Béquille
      accessoires.push({
        code: `BEQ_${(porte.colorBequille || "noir").toUpperCase()}`,
        nom: "Béquille",
        description: `Béquille ${porte.colorBequille || "noir"}`,
        quantite: 1,
        couleur: porte.colorBequille || "noir",
      });

      // Joints vitrage
      const vitrageSurface = this._calculateVitrageSurface(config);
      if (vitrageSurface > 0) {
        accessoires.push({
          code: `JOINT_${(porte.colorPvitrage || "noir").toUpperCase()}`,
          nom: "Joint vitrage",
          description: `Joint vitrage ${porte.colorPvitrage || "noir"}`,
          quantite: Math.ceil(vitrageSurface),
          couleur: porte.colorPvitrage || "noir",
        });
      }
    }

    // Visserie (toujours présente)
    accessoires.push({
      code: "VISS_STD",
      nom: "Visserie",
      description: "Visserie standard inox",
      quantite: 1,
      couleur: "inox",
    });

    return accessoires;
  }

  /**
   * Calcule les remplissages (vitrages)
   */
  _calculateRemplissages(config) {
    const remplissages = [];
    const { width, height, type, modulesCount, porte } = config;
    const epaisseur = config.options?.remplissageEp || 6;

    if (type === "porte") {
      // Modules vitrés (non-porte)
      const moduleWidths = Calculator.distributeModuleWidths(config);

      moduleWidths.forEach((moduleWidth, index) => {
        const moduleIndex = index + 1;
        const isPorteModule = moduleIndex === config.porteIndex;

        if (!isPorteModule) {
          remplissages.push({
            code: `VITR_${epaisseur}`,
            nom: `Vitrage ${epaisseur}mm`,
            description: `Vitrage module ${moduleIndex}`,
            dimensions: `${moduleWidth - 20}mm x ${height - 20}mm`,
            quantite: 1,
            epaisseur: `${epaisseur}mm`,
          });
        }
      });

      // Vitrage porte
      const porteVitrageWidth = (porte?.porteWidth || 730) - 120; // Cadre porte
      const porteVitrageHeight = (porte?.porteHeight || 2200) - 120;

      remplissages.push({
        code: `VITR_PORTE_${epaisseur}`,
        nom: `Vitrage porte ${epaisseur}mm`,
        description: "Vitrage porte ouvrante",
        dimensions: `${porteVitrageWidth}mm x ${porteVitrageHeight}mm`,
        quantite: 1,
        epaisseur: `${epaisseur}mm`,
      });

      // Vitrage tierce
      if (porte?.withTierce) {
        const tierceVitrageWidth = (porte?.tierceWidth || 350) - 80;
        const tierceVitrageHeight = porteVitrageHeight;

        remplissages.push({
          code: `VITR_TIERCE_${epaisseur}`,
          nom: `Vitrage tierce ${epaisseur}mm`,
          description: "Vitrage tierce fixe",
          dimensions: `${tierceVitrageWidth}mm x ${tierceVitrageHeight}mm`,
          quantite: 1,
          epaisseur: `${epaisseur}mm`,
        });
      }

      // Vitrage imposte
      if (porte?.withImposte) {
        const imposteWidth =
          Calculator.calculateDimensionsOuverture(config).largeur - 102;
        const imposteHeight = height - (porte?.porteHeight || 2200) - 100;

        remplissages.push({
          code: `VITR_IMPOSTE_${epaisseur}`,
          nom: `Vitrage imposte ${epaisseur}mm`,
          description: "Vitrage imposte fixe",
          dimensions: `${imposteWidth}mm x ${imposteHeight}mm`,
          quantite: 1,
          epaisseur: `${epaisseur}mm`,
        });
      }
    } else {
      // Verrière pleine : tous modules vitrés
      const moduleWidths = Calculator.distributeModuleWidths(config);

      moduleWidths.forEach((moduleWidth, index) => {
        remplissages.push({
          code: `VITR_${epaisseur}`,
          nom: `Vitrage ${epaisseur}mm`,
          description: `Vitrage module ${index + 1}`,
          dimensions: `${moduleWidth - 20}mm x ${height - 20}mm`,
          quantite: 1,
          epaisseur: `${epaisseur}mm`,
        });
      });
    }

    return remplissages;
  }

  /**
   * Rend le tableau des profils
   */
  _renderProfilesTable(profiles) {
    const table = this._tables.profiles;
    if (!table) return;

    if (profiles.length === 0) {
      table.innerHTML = "<caption>Aucun profil à afficher</caption>";
      return;
    }

    const header = `
      <caption>PROFILS</caption>
      <thead>
        <tr>
          <th>Référence</th>
          <th>Description</th>
          <th>Longueur (mm)</th>
          <th>Quantité</th>
          <th>Finition</th>
        </tr>
      </thead>
    `;

    let tbody = "<tbody>";
    profiles.forEach((profile) => {
      tbody += `
        <tr>
          <td>${profile.codeBase}</td>
          <td>${profile.description}</td>
          <td>${profile.longueur || "-"}</td>
          <td>${profile.quantite}</td>
          <td>${this._getColorLabel(profile.couleur)}</td>
        </tr>
      `;
    });
    tbody += "</tbody>";

    table.innerHTML = header + tbody;
  }

  /**
   * Rend le tableau des accessoires
   */
  _renderAccessoiresTable(accessoires) {
    const table = this._tables.accessoires;
    if (!table) return;

    if (accessoires.length === 0) {
      table.innerHTML = "<caption>Aucun accessoire à afficher</caption>";
      return;
    }

    const header = `
      <caption>ACCESSOIRES</caption>
      <thead>
        <tr>
          <th>Code</th>
          <th>Nom</th>
          <th>Description</th>
          <th>Quantité</th>
          <th>Couleur</th>
        </tr>
      </thead>
    `;

    let tbody = "<tbody>";
    accessoires.forEach((accessoire) => {
      tbody += `
        <tr>
          <td>${accessoire.code}</td>
          <td>${accessoire.nom}</td>
          <td>${accessoire.description}</td>
          <td>${accessoire.quantite}</td>
          <td>${this._getColorLabel(accessoire.couleur)}</td>
        </tr>
      `;
    });
    tbody += "</tbody>";

    table.innerHTML = header + tbody;
  }

  /**
   * Rend le tableau des remplissages
   */
  _renderRemplissageTable(remplissages) {
    const table = this._tables.remplissage;
    if (!table) return;

    if (remplissages.length === 0) {
      table.innerHTML = "<caption>Aucun remplissage à afficher</caption>";
      return;
    }

    const header = `
      <caption>REMPLISSAGES</caption>
      <thead>
        <tr>
          <th>Code</th>
          <th>Nom</th>
          <th>Description</th>
          <th>Dimensions</th>
          <th>Quantité</th>
          <th>Épaisseur</th>
        </tr>
      </thead>
    `;

    let tbody = "<tbody>";
    remplissages.forEach((remplissage) => {
      tbody += `
        <tr>
          <td>${remplissage.code}</td>
          <td>${remplissage.nom}</td>
          <td>${remplissage.description}</td>
          <td>${remplissage.dimensions || "-"}</td>
          <td>${remplissage.quantite}</td>
          <td>${remplissage.epaisseur || "-"}</td>
        </tr>
      `;
    });
    tbody += "</tbody>";

    table.innerHTML = header + tbody;
  }

  /**
   * Affiche des tableaux d'erreur
   */
  _renderErrorTables() {
    Object.values(this._tables).forEach((table) => {
      if (table) {
        table.innerHTML =
          '<caption style="background-color: #f44336;">❌ Erreur de calcul</caption>';
      }
    });
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  /**
   * Obtient le code d'un profil selon son type
   */
  _getProfileCode(type) {
    const codes = {
      vertical: "PCV40_V",
      horizontal: "PCV40_H",
      horizontal_droite: "PCV40_H",
      horizontal_gauche: "PCV40_H",
      horizontal_haut_gauche: "PCV40_H",
      horizontal_haut_droite: "PCV40_H",
      horizontal_imposte: "PCV40_IMP",
      intermediate_vertical: "PIV40",
      traverse_principale: "TR40",
      traverse_porte: "TRP40",
    };

    return codes[type] || "PROF_UNK";
  }

  /**
   * Convertit un code couleur en libellé
   */
  _getColorLabel(colorCode) {
    return COLORS.LABELS[colorCode] || colorCode;
  }

  /**
   * Calcule la surface de vitrage pour les joints
   */
  _calculateVitrageSurface(config) {
    if (config.type !== "porte") return 0;

    const { porte } = config;
    let surface = 0;

    // Surface porte
    const porteWidth = (porte?.porteWidth || 730) - 120;
    const porteHeight = (porte?.porteHeight || 2200) - 120;
    surface += (porteWidth * porteHeight) / 1000000; // en m²

    // Surface tierce
    if (porte?.withTierce) {
      const tierceWidth = (porte?.tierceWidth || 350) - 80;
      surface += (tierceWidth * porteHeight) / 1000000;
    }

    // Surface imposte
    if (porte?.withImposte) {
      const imposteWidth =
        Calculator.calculateDimensionsOuverture(config).largeur - 102;
      const imposteHeight = config.height - (porte?.porteHeight || 2200) - 100;
      surface += (imposteWidth * imposteHeight) / 1000000;
    }

    return Math.ceil(surface * 10) / 10; // Arrondi à 0.1 m²
  }
}
