export class ConfigModel {
  constructor(initialConfig = {}, eventBus = null) {
    this.state = this.getDefaultConfig();
    this.update(initialConfig);
    this.eventBus = eventBus;
  }

  getDefaultConfig() {
    return {
      width: 4000,
      height: 2500,
      type: "pleine",
      modulesCount: 4,
      porteIndex: 3,
      modules: [
        { width: 950, type: "fixe" },
        { width: 950, type: "fixe" },
        { width: 950, type: "fixe" },
        { width: 950, type: "fixe" },
      ],
      traverses: [],
      porte: {
        withTierce: false,
        withImposte: false,
        withDormant: false,
        charniereType: "visible",
        porteWidth: 730,
        tierceWidth: 350,
        porteHeight: 2200,
        sensOuverture: "droit",
        serrure: "SERROULM",
        profile: "po66",
        colorBequille: "noir",
        colorPvitrage: "noir",
        traverseType: "28",
      },
      traversesPorte: [],
      options: {
        colorProfile: "noir",
        remplissageEp: 6,
        colorJoint: "noir",
      },
    };
  }

  setOnChange(callback) {
    this._onChange = callback;
  }

  // À appeler à chaque changement significatif
  _notifyChange() {
    if (this.eventBus) {
      this.eventBus.emit("configChanged", this.getConfig());
    }
  }

  update(newValues = {}) {
    this.state = { ...this.state, ...newValues };
    this.syncModules();
    this._notifyChange();
    return this.state;
  }

  // Gestion des modules
  syncModules() {
    const count = this.state.modulesCount || 1;
    const width = this.state.width || 4000;
    const defaultModuleWidth = Math.floor(width / count);

    // S’assurer que le tableau existe
    if (!Array.isArray(this.state.modules)) this.state.modules = [];

    // Ajuster la taille du tableau modules
    while (this.state.modules.length < count) {
      this.state.modules.push({ width: defaultModuleWidth, type: "fixe" });
    }
    if (this.state.modules.length > count) {
      this.state.modules = this.state.modules.slice(0, count);
    }

    // Mettre à jour toutes les largeurs à la valeur par défaut si la somme diffère trop
    const totalWidth = this.state.modules.reduce(
      (sum, m) => sum + (m.width || 0),
      0
    );
    if (Math.abs(totalWidth - width) > 10) {
      this.state.modules.forEach((m) => (m.width = defaultModuleWidth));
    }
  }

  setModuleWidth(index, width) {
    // Vérifie que l’index est valide et borné
    if (
      !this.state.modules ||
      index < 0 ||
      index >= this.state.modules.length
    ) {
      throw new Error("Index de module invalide");
    }
    // Applique la valeur avec bornes “logiques”
    this.state.modules[index].width = Math.max(100, Math.min(2000, width));
    this._notifyChange();
    return this.state;
  }

  setModuleType(index, type) {
    if (
      !this.state.modules ||
      index < 0 ||
      index >= this.state.modules.length
    ) {
      throw new Error("Index de module invalide");
    }
    this.state.modules[index].type = type;
    return this.state;
  }

  // Gestion des traverses
  // Traverses verrière
  addTraverse(height, modules = [1]) {
    // Check doublon
    const exists = this.state.traverses.some(
      (t) =>
        t.height === height &&
        JSON.stringify(t.modules) === JSON.stringify(modules)
    );
    if (exists)
      throw new Error(
        "Traverse déjà existante à cette hauteur sur ces modules"
      );
    const id = Date.now() + Math.floor(Math.random() * 10000);
    this.state.traverses.push({ id, height, modules });
    return id;
  }

  removeTraverse(id) {
    this.state.traverses = this.state.traverses.filter(
      (trav) => trav.id !== id
    );
    return this.state;
  }

  // Obtenir toutes les traverses
  getTraverses() {
    return [...this.state.traverses];
  }

  // Traverses porte
  addTraversePorte(height, { type = "28", onTierce = false } = {}) {
    // Recherche de doublon (même hauteur, même type, même tierce)
    const exists = this.state.traversesPorte.some(
      (t) => t.height === height && t.type === type && t.onTierce === onTierce
    );
    if (exists)
      throw new Error(
        "Traverse de porte déjà existante à cette hauteur, de ce type et avec ce paramètre tierce"
      );

    const id = Date.now() + Math.floor(Math.random() * 10000);
    this.state.traversesPorte.push({ id, height, type, onTierce });
    return id;
  }

  removeTraversePorte(id) {
    this.state.traversesPorte = this.state.traversesPorte.filter(
      (trav) => trav.id !== id
    );
    return this.state;
  }

  getTraversesPorte() {
    return [...this.state.traversesPorte];
  }

  // Options porte
  setCharniereType(type) {
    if (!["visible", "invisible"].includes(type)) {
      throw new Error("Type de charnière invalide");
    }
    this.state.porte.charniereType = type;
    return this.state;
  }

  // Change la largeur de la porte (avec bornes)
  setPorteWidth(width) {
    this.state.porte.porteWidth = Math.max(400, Math.min(1230, width));
    return this.state;
  }

  // Change la largeur de la tierce (avec bornes)
  setTierceWidth(width) {
    this.state.porte.tierceWidth = Math.max(300, Math.min(1230, width));
    return this.state;
  }

  // Change la hauteur de la porte (avec bornes)
  setPorteHeight(height) {
    this.state.porte.porteHeight = Math.max(500, Math.min(4000, height));
    return this.state;
  }

  // (etc.) pour les autres propriétés
  setWithTierce(value) {
    this.state.porte.withTierce = Boolean(value);
    return this.state;
  }
  setWithImposte(value) {
    this.state.porte.withImposte = Boolean(value);
    return this.state;
  }
  setWithDormant(value) {
    this.state.porte.withDormant = Boolean(value);
    return this.state;
  }
  setSensOuverture(value) {
    if (!["droit", "gauche"].includes(value)) {
      throw new Error("Sens d'ouverture invalide");
    }
    this.state.porte.sensOuverture = value;
    return this.state;
  }

  //Valider les valeurs rentrées
  validate() {
    this.state.width = Math.max(400, Math.min(5000, this.state.width));
    this.state.height = Math.max(400, Math.min(5000, this.state.height));
    this.state.modulesCount = Math.max(1, Math.min(8, this.state.modulesCount));

    // Auto-ajuster les modules si la somme dépasse la largeur
    const totalModuleWidth = this.state.modules.reduce(
      (sum, m) => sum + (m.width || 0),
      0
    );
    if (totalModuleWidth > this.state.width) {
      const ratio = this.state.width / totalModuleWidth;
      this.state.modules.forEach(
        (m) => (m.width = Math.floor((m.width || 0) * ratio))
      );
    }

    // Porte
    const porte = this.state.porte;
    porte.porteWidth = Math.max(400, Math.min(1230, porte.porteWidth));
    porte.tierceWidth = porte.withTierce
      ? Math.max(300, Math.min(1230, porte.tierceWidth))
      : 0;
    porte.porteHeight = Math.max(500, Math.min(4000, porte.porteHeight));

    // Si dormant, diminuer la hauteur de porte
    if (porte.withDormant && !porte.withImposte) {
      porte.porteHeight = Math.max(500, porte.porteHeight - 51); // exemple valeur
    }
    return this.state;
  }

  // Récupérer la config
  getConfig() {
    // Fournit un clone profond (pour éviter les bugs de référence)
    return JSON.parse(JSON.stringify(this.state));
  }

  // Ajoute à ta classe ConfigModel
  getSummary() {
    const cfg = this.state;
    return {
      dimensions: `${cfg.width}mm × ${cfg.height}mm`,
      type: cfg.type,
      modules: `${cfg.modulesCount} modules`,
      porte:
        cfg.type === "porte"
          ? {
              largeur: `${cfg.porte.porteWidth}mm`,
              hauteur: `${cfg.porte.porteHeight}mm`,
              tierce: cfg.porte.withTierce
                ? `${cfg.porte.tierceWidth}mm`
                : "Non",
              imposte: cfg.porte.withImposte ? "Oui" : "Non",
            }
          : null,
      traverses: {
        principales: cfg.traverses?.length || 0,
        porte: cfg.traversesPorte?.length || 0,
      },
      couleur: cfg.options.colorProfile,
    };
  }

  // Sauvegarde l’état courant dans localStorage (ou autre storage)
  saveToStorage(key = "verriere_config") {
    try {
      localStorage.setItem(key, JSON.stringify(this.state));
      return true;
    } catch (e) {
      console.error("Erreur lors de la sauvegarde :", e);
      return false;
    }
  }

  // Charge la configuration depuis le storage
  loadFromStorage(key = "verriere_config") {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        this.state = JSON.parse(item);
        this.validate();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Erreur lors du chargement :", e);
      return false;
    }
  }

  // Export JSON (par ex. pour télécharger)
  toJSON() {
    return JSON.stringify(this.state, null, 2);
  }

  // Import JSON (par ex. pour charger un projet)
  fromJSON(jsonString) {
    try {
      const obj = JSON.parse(jsonString);
      this.state = obj;
      this.validate();
      return true;
    } catch (e) {
      console.error("JSON invalide :", e);
      return false;
    }
  }
}
