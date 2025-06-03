class DebitsManager {
  constructor() {
    this.debits = {
      profils: [],
      accessoires: [],
      remplissages: [],
    };
  }

  // Calcule tous les débits selon la configuration
  calculateDebits(config) {
    try {
      console.log("🎯 DebitsManager - Début calcul avec config:", config);

      // REGÉNÉRER la config depuis le DOM pour être sûr d'avoir les dernières valeurs
      if (
        typeof configManager !== "undefined" &&
        configManager.generateConfigFromForm
      ) {
        console.log("🔄 Régénération complète de la config depuis le DOM...");
        const freshConfig = configManager.generateConfigFromForm();
        console.log("✅ Config fraîche:", freshConfig);

        // Utiliser la config fraîche pour les calculs
        config = freshConfig;
      }

      // FORCER LA SYNCHRONISATION DES MODULES AVANT CALCUL
      if (typeof syncModulesToConfig === "function") {
        console.log("🔄 Synchronisation des modules...");
        syncModulesToConfig(config);
        console.log("✅ Modules après sync:", config.modules);
      } else if (typeof syncModulesFromDOM === "function") {
        console.log("🔄 Synchronisation depuis DOM...");
        syncModulesFromDOM(config);
        console.log("✅ Modules après sync DOM:", config.modules);
      } else {
        console.warn("⚠️ Aucune fonction de synchronisation disponible");
      }

      // Utiliser la fonction de references_db.js pour récupérer les éléments actifs
      const activeReferences = getActiveReferences(config);

      this.debits = {
        profils: activeReferences.profils,
        accessoires: activeReferences.accessoires,
        remplissages: activeReferences.remplissages,
      };

      console.log("Débits calculés:", this.debits);
      return this.debits;
    } catch (error) {
      console.error("Erreur lors du calcul des débits:", error);
      // Retourner des tableaux vides en cas d'erreur
      this.debits = {
        profils: [],
        accessoires: [],
        remplissages: [],
      };
      return this.debits;
    }
  }

  // Met à jour l'affichage des tableaux dans le DOM
  updateTables() {
    this.updateProfilsTable();
    this.updateAccessoiresTable();
    this.updateRemplissageTable();
  }

  // Affiche le tableau des profils
  updateProfilsTable() {
    const table = document.getElementById("profiles");
    if (!table) {
      console.warn("Table 'profiles' non trouvée");
      return;
    }

    // Vider le tableau
    table.innerHTML = "";

    if (this.debits.profils.length === 0) {
      table.innerHTML = "<caption>Aucun profil à afficher</caption>";
      return;
    }

    // Créer l'en-tête du tableau
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

    // Créer le corps du tableau
    let tbody = "<tbody>";

    this.debits.profils.forEach((profil) => {
      tbody += `
        <tr>
          <td>${profil.codeBase}</td>
          <td>${profil.description}</td>
          <td>${profil.longueur || "-"}</td>
          <td>${profil.quantite}</td>
          <td>${this.getColorLabel(profil.couleur)}</td>
        </tr>
      `;
    });

    tbody += "</tbody>";

    table.innerHTML = header + tbody;
  }

  // Affiche le tableau des accessoires
  updateAccessoiresTable() {
    const table = document.getElementById("accessoires");
    if (!table) {
      console.warn("Table 'accessoires' non trouvée");
      return;
    }

    // Vider le tableau
    table.innerHTML = "";

    if (this.debits.accessoires.length === 0) {
      table.innerHTML = "<caption>Aucun accessoire à afficher</caption>";
      return;
    }

    // Créer l'en-tête du tableau
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

    // Créer le corps du tableau
    let tbody = "<tbody>";

    this.debits.accessoires.forEach((accessoire) => {
      tbody += `
        <tr>
          <td>${accessoire.code}</td>
          <td>${accessoire.nom}</td>
          <td>${accessoire.description}</td>
          <td>${accessoire.quantite}</td>
          <td>${this.getColorLabel(accessoire.couleur)}</td>
        </tr>
      `;
    });

    tbody += "</tbody>";

    table.innerHTML = header + tbody;
  }

  // Affiche le tableau des remplissages
  updateRemplissageTable() {
    const table = document.getElementById("remplissage");
    if (!table) {
      console.warn("Table 'remplissage' non trouvée");
      return;
    }

    // Vider le tableau
    table.innerHTML = "";

    if (this.debits.remplissages.length === 0) {
      table.innerHTML = "<caption>Aucun remplissage à afficher</caption>";
      return;
    }

    // Créer l'en-tête du tableau
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

    // Créer le corps du tableau
    let tbody = "<tbody>";

    this.debits.remplissages.forEach((remplissage) => {
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

  // Convertit le code couleur en libellé lisible
  getColorLabel(colorCode) {
    const colorLabels = {
      noir: "Laqué noir RAL 9005",
      gris: "Laqué gris RAL 7016",
      blanc: "Laqué blanc RAL 9003",
    };

    return colorLabels[colorCode] || colorCode;
  }

  // Méthode appelée quand la configuration change
  onConfigChanged(eventData) {
    const config = eventData.newConfig;
    console.log("Configuration mise à jour, recalcul des débits...");

    // Recalculer les débits
    this.calculateDebits(config);

    // Mettre à jour l'affichage
    this.updateTables();
  }
}

// Instance globale du gestionnaire de débits
const debitsManager = new DebitsManager();

// Fonction d'initialisation pour connecter avec le gestionnaire de config
function initDebitsManager() {
  // S'abonner aux changements de configuration
  configManager.subscribe("configChanged", (eventData) => {
    debitsManager.onConfigChanged(eventData);
  });

  // Calculer les débits initiaux
  const currentConfig = configManager.getConfig();
  if (currentConfig) {
    debitsManager.calculateDebits(currentConfig);
    debitsManager.updateTables();
  }

  console.log("DebitsManager initialisé avec succès");
}
