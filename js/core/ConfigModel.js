// ===== js/core/ConfigModel.js =====
import { ModulesCalculator } from "../calculations/ModulesCalculator.js";
import { PorteCalculator } from "../calculations/PorteCalculator.js";
import { ValidationRules } from "./ValidationRules.js";

export class ConfigModel {
  constructor(initialConfig = {}, eventBus = null) {
    this.eventBus = eventBus;
    this.state = this.getDefaultConfig();
    this.isUpdating = false; // Évite les boucles infinies

    // Applique la config initiale
    if (Object.keys(initialConfig).length > 0) {
      this.updateState(initialConfig, false);
    }

    this.validate();
  }

  /**
   * Configuration par défaut
   */
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

  /**
   * Met à jour l'état de manière contrôlée
   */
  updateState(newValues = {}, notify = true) {
    if (this.isUpdating) return this.state;

    this.isUpdating = true;

    try {
      // CORRECTION: Vérifier si les valeurs ont vraiment changé avant de notifier
      const hasChanged = this.hasStateChanged(newValues);

      // Mise à jour de l'état
      this.state = { ...this.state, ...newValues };

      // Recalculs automatiques si nécessaire
      this.performAutomaticCalculations();

      // Validation
      this.validate();

      // Notification seulement si vraiment changé
      if (notify && hasChanged && this.eventBus) {
        this.eventBus.emit("configChanged", this.getConfig());
      }
    } finally {
      this.isUpdating = false;
    }

    return this.state;
  }

  /**
   * Vérifie si l'état a vraiment changé
   */
  hasStateChanged(newValues) {
    for (const [key, newValue] of Object.entries(newValues)) {
      if (this.state[key] !== newValue) {
        return true;
      }
    }
    return false;
  }

  /**
   * Effectue les calculs automatiques nécessaires
   */
  performAutomaticCalculations() {
    // Recalcul des modules (inclut maintenant la logique des profilés)
    this.updateModulesStructure();

    // Recalcul hauteur porte si verrouillée
    this.updatePorteHeight();

    // Validation du porteIndex
    this.validatePorteIndex();
  }

  /**
   * CORRECTION: Recalcule les largeurs des modules libres (non porte) selon la logique des profilés
   */
  recalculateFreeModulesWidths() {
    const { modulesCount, width, porteIndex, type } = this.state;

    if (type === "porte") {
      // AVEC PORTE : (width - dimensions.largeur - ((modulesCount - 1) * 40)) / (modulesCount - 1)

      // Calculer les dimensions d'ouverture (incluent les profilés 51mm)
      const dimensionsOuverture = PorteCalculator.calculateDimensionsOuverture(
        this.state
      );
      const porteModuleWidth = dimensionsOuverture.largeur - 102;

      // Mettre à jour le module porte
      if (this.state.modules[porteIndex - 1]) {
        this.state.modules[porteIndex - 1].width = porteModuleWidth;
        this.state.modules[porteIndex - 1].type = "porte";
      }

      // CORRECTION: Calculer la largeur des modules libres selon la formule métier corrigée
      const freeModulesCount = modulesCount - 1;
      if (freeModulesCount > 0) {
        const clairVitrage =
          (width - dimensionsOuverture.largeur - (modulesCount - 1) * 40) /
          freeModulesCount;

        // Appliquer cette largeur à tous les modules libres
        for (let i = 0; i < modulesCount; i++) {
          if (i + 1 !== porteIndex && this.state.modules[i]) {
            this.state.modules[i].width = Math.floor(clairVitrage);
            this.state.modules[i].type = "fixe";
          }
        }
      }
    } else {
      // SANS PORTE : (width - (modulesCount+1) * 40) / modulesCount
      const clairVitrage = (width - (modulesCount + 1) * 40) / modulesCount;

      // Appliquer cette largeur à tous les modules
      for (let i = 0; i < modulesCount; i++) {
        if (this.state.modules[i]) {
          this.state.modules[i].width = Math.floor(clairVitrage);
          this.state.modules[i].type = "fixe";
        }
      }
    }
  }

  /**
   * Met à jour la structure des modules
   */
  updateModulesStructure() {
    const { modulesCount, width, type, porteIndex } = this.state;

    // CORRECTION: NE PAS modifier modulesCount ici, seulement ajuster le tableau modules

    // Ajuste le nombre de modules dans le tableau pour correspondre à modulesCount
    while (this.state.modules.length < modulesCount) {
      this.state.modules.push({ width: 800, type: "fixe" });
    }
    while (this.state.modules.length > modulesCount) {
      this.state.modules.pop();
    }

    if (type === "porte") {
      // AVEC PORTE : Calculer selon la formule corrigée
      const dimensionsOuverture = PorteCalculator.calculateDimensionsOuverture(
        this.state
      );
      const porteModuleWidth = dimensionsOuverture.largeur - 102;

      // CORRECTION: Largeur des modules libres selon la formule corrigée
      const freeModulesCount = modulesCount - 1;
      const clairVitrage =
        freeModulesCount > 0
          ? (width - dimensionsOuverture.largeur - (modulesCount - 1) * 40) /
            freeModulesCount
          : 0;

      // Mettre à jour tous les modules
      for (let i = 0; i < modulesCount; i++) {
        if (!this.state.modules[i]) {
          this.state.modules[i] = { width: 800, type: "fixe" };
        }

        const isPorteModule = i + 1 === porteIndex;

        if (isPorteModule) {
          this.state.modules[i].type = "porte";
          this.state.modules[i].width = porteModuleWidth;
        } else {
          this.state.modules[i].type = "fixe";
          this.state.modules[i].width = Math.floor(clairVitrage);
        }
      }
    } else {
      // SANS PORTE : (width - (modulesCount+1) * 40) / modulesCount
      const clairVitrage = (width - (modulesCount + 1) * 40) / modulesCount;

      for (let i = 0; i < modulesCount; i++) {
        if (!this.state.modules[i]) {
          this.state.modules[i] = { width: 800, type: "fixe" };
        }

        this.state.modules[i].type = "fixe";
        this.state.modules[i].width = Math.floor(clairVitrage);
      }
    }
  }

  /**
   * Met à jour la hauteur de porte si calculée automatiquement
   */
  updatePorteHeight() {
    if (this.state.type !== "porte") return;

    const isLocked = PorteCalculator.isPorteHeightLocked(this.state);
    if (isLocked) {
      const calculatedHeight = PorteCalculator.calculateImposedPorteHeight(
        this.state
      );
      this.state.porte.porteHeight = calculatedHeight;
    }
  }

  /**
   * Valide et corrige le porteIndex
   */
  validatePorteIndex() {
    if (this.state.type === "porte") {
      const maxIndex = this.state.modulesCount;
      if (this.state.porteIndex > maxIndex) {
        this.state.porteIndex = maxIndex;
      }
      if (this.state.porteIndex < 1) {
        this.state.porteIndex = 1;
      }
    }
  }

  /**
   * Validation des données avec corrections automatiques
   */
  validate() {
    // Validation et correction des dimensions principales
    this.state.width = this.clamp(this.state.width, 400, 5000);
    this.state.height = this.clamp(this.state.height, 400, 5000);

    // CORRECTION: Ne pas forcer la validation du nombre de modules
    // Laisser l'utilisateur choisir, la validation se fera dans l'UI si nécessaire
    // const bounds = ModulesCalculator.calculateModulesBounds(this.state.width);
    // this.state.modulesCount = this.clamp(this.state.modulesCount, bounds.min, bounds.max);

    // Validation minimale : au moins 1 module, maximum raisonnable
    this.state.modulesCount = this.clamp(this.state.modulesCount, 1, 20);

    // Validation porte si applicable
    if (this.state.type === "porte" && this.state.porte) {
      this.validatePorteConfig();
    }

    // Validation des modules individuels
    this.validateModules();

    // Validation des traverses
    this.validateTraverses();

    return this.state;
  }

  /**
   * Valide la configuration porte
   */
  validatePorteConfig() {
    const porte = this.state.porte;

    // Largeurs avec bornes
    porte.porteWidth = this.clamp(porte.porteWidth, 400, 1230);
    porte.tierceWidth = this.clamp(porte.tierceWidth, 300, 1230);

    // Hauteur porte
    if (!PorteCalculator.isPorteHeightLocked(this.state)) {
      const maxHeight = PorteCalculator.calculateMaxPorteHeight(this.state);
      porte.porteHeight = this.clamp(porte.porteHeight, 500, maxHeight);
    }

    // Valeurs par défaut pour les énumérations
    if (!["visible", "invisible"].includes(porte.charniereType)) {
      porte.charniereType = "visible";
    }
    if (!["droit", "gauche"].includes(porte.sensOuverture)) {
      porte.sensOuverture = "droit";
    }
    if (!["SERROULM", "SERROULPENM", "SERPEN35M"].includes(porte.serrure)) {
      porte.serrure = "SERROULM";
    }
  }

  /**
   * Valide les largeurs des modules
   */
  validateModules() {
    this.state.modules.forEach((module) => {
      if (module.type !== "porte") {
        module.width = this.clamp(module.width, 200, 2000);
      }
    });
  }

  /**
   * Valide les traverses
   */
  validateTraverses() {
    // Filtrer les traverses invalides
    this.state.traverses = this.state.traverses.filter((traverse) => {
      return (
        traverse.height >= 240 &&
        traverse.height <= this.state.height - 240 &&
        Array.isArray(traverse.modules) &&
        traverse.modules.length > 0
      );
    });

    this.state.traversesPorte = this.state.traversesPorte.filter((traverse) => {
      return (
        traverse.height >= 200 &&
        traverse.height <= (this.state.porte?.porteHeight || 2200) - 240
      );
    });
  }

  /**
   * Utilitaire pour contraindre une valeur dans des bornes
   */
  clamp(value, min, max) {
    if (typeof value !== "number" || isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  // ===== MODULES =====

  /**
   * Modifie la largeur d'un module spécifique
   */
  setModuleWidth(index, width) {
    if (index < 0 || index >= this.state.modules.length) {
      throw new Error("Index de module invalide");
    }

    if (this.state.modules[index].type === "porte") {
      throw new Error("Impossible de modifier la largeur d'un module porte");
    }

    const validatedWidth = this.clamp(width, 200, 2000);
    this.state.modules[index].width = validatedWidth;

    if (this.eventBus) {
      this.eventBus.emit("configChanged", this.getConfig());
    }

    return this.state;
  }

  /**
   * Remet à zéro les largeurs des modules (répartition équitable)
   */
  resetModulesWidths() {
    const distribution = ModulesCalculator.calculateEquitableDistribution(
      this.state
    );

    distribution.forEach((newModule, index) => {
      if (
        this.state.modules[index] &&
        this.state.modules[index].type !== "porte"
      ) {
        this.state.modules[index].width = newModule.width;
      }
    });

    return this.getConfig();
  }

  // ===== TRAVERSES =====

  /**
   * Ajoute une traverse principale
   */
  addTraverse(height, modules = [1]) {
    // Validation
    if (height < 240 || height > this.state.height - 240) {
      throw new Error(
        `Hauteur de traverse invalide (${240} - ${this.state.height - 240})`
      );
    }

    if (!Array.isArray(modules) || modules.length === 0) {
      throw new Error("Au moins un module doit être sélectionné");
    }

    // Vérification des conflits
    const conflict = this.state.traverses.some(
      (t) => t.height === height && t.modules.some((m) => modules.includes(m))
    );

    if (conflict) {
      throw new Error("Conflit avec une traverse existante");
    }

    const id = Date.now() + Math.floor(Math.random() * 10000);
    this.state.traverses.push({ id, height, modules: [...modules] });

    return id;
  }

  /**
   * Supprime une traverse principale
   */
  removeTraverse(id) {
    this.state.traverses = this.state.traverses.filter((t) => t.id !== id);
    return this.state;
  }

  /**
   * Ajoute une traverse de porte
   */
  addTraversePorte(height, { type = "28", onTierce = false } = {}) {
    const maxHeight = (this.state.porte?.porteHeight || 2200) - 240;

    if (height < 200 || height > maxHeight) {
      throw new Error(
        `Hauteur de traverse porte invalide (200 - ${maxHeight})`
      );
    }

    // Vérification des conflits
    const conflict = this.state.traversesPorte.some(
      (t) => t.height === height && t.type === type && t.onTierce === onTierce
    );

    if (conflict) {
      throw new Error("Traverse de porte déjà existante avec ces paramètres");
    }

    const id = Date.now() + Math.floor(Math.random() * 10000);
    this.state.traversesPorte.push({ id, height, type, onTierce });

    return id;
  }

  /**
   * Supprime une traverse de porte
   */
  removeTraversePorte(id) {
    this.state.traversesPorte = this.state.traversesPorte.filter(
      (t) => t.id !== id
    );
    return this.state;
  }

  // ===== MÉTHODES STATIQUES DE CALCUL =====

  /**
   * Calcule les dimensions d'ouverture
   */
  static calculateDimensionsOuverture(config) {
    return PorteCalculator.calculateDimensionsOuverture(config);
  }

  // ===== ACCESSEURS ET UTILITAIRES =====

  /**
   * Retourne une copie profonde de la configuration
   */
  getConfig() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Résumé de la configuration pour affichage
   */
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

  // ===== PERSISTANCE =====

  /**
   * Sauvegarde en localStorage
   */
  saveToStorage(key = "verriere_config") {
    try {
      localStorage.setItem(key, JSON.stringify(this.state));
      return true;
    } catch (e) {
      console.error("Erreur sauvegarde :", e);
      return false;
    }
  }

  /**
   * Chargement depuis localStorage
   */
  loadFromStorage(key = "verriere_config") {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const loaded = JSON.parse(item);
        this.state = { ...this.getDefaultConfig(), ...loaded };
        this.validate();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Erreur chargement :", e);
      return false;
    }
  }

  /**
   * Export JSON
   */
  toJSON() {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Import JSON
   */
  fromJSON(jsonString) {
    try {
      const obj = JSON.parse(jsonString);
      this.state = { ...this.getDefaultConfig(), ...obj };
      this.validate();
      return true;
    } catch (e) {
      console.error("JSON invalide :", e);
      return false;
    }
  }
}
