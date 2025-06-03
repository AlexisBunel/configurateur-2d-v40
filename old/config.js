// GESTIONNAIRE DE CONFIGURATION

class ConfigManager {
  constructor(eventManager) {
    this.eventManager = eventManager;
    this.config = null;
    this.storageKey = "verriere_config";
    this.defaultConfig = this.getDefaultConfig();
    this.calculationService = null;
  }

  setCalculationService(calculationService) {
    this.calculationService = calculationService;
  }

  updateConfig(newConfig, notify = true) {
    const oldConfig = this.config ? { ...this.config } : null;

    this.config = {
      ...this.config,
      ...newConfig,
    };

    if (this.calculationService) {
      this.config = this.calculationService.processConfig(this.config);
    } else {
      console.warn("CalculationService non disponible, pas de validation");
    }

    // Sauvegarder
    this.saveToStorage();

    // Notifier
    if (notify && this.eventManager) {
      this.eventManager.notifyConfigChanged(this.config, oldConfig);
    }

    console.log("✅ Configuration mise à jour et sauvegardée");
    return this.config;
  }

  // Configuration par défaut
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

  async initialize() {
    try {
      const savedConfig = this.loadFromStorage();

      if (savedConfig) {
        console.log("Configuration chargée depuis localStorage");
        this.config = savedConfig;
      } else {
        console.log("Création d'une nouvelle configuration");
        this.config = { ...this.defaultConfig };
      }
      this.syncModulesWithDimensions();

      this.validateConfig();

      this.saveToStorage();

      console.log("ConfigManager initialisé avec succès");
      return this.config;
    } catch (error) {
      console.error("Erreur lors de l'initialisation:", error);
      this.config = { ...this.defaultConfig };
      this.saveToStorage();

      return this.config;
    }
  }

  saveToStorage() {
    try {
      const configString = JSON.stringify(this.config);
      localStorage.setItem(this.storageKey, configString);
      console.log("Configuration sauvegardée dans localStorage");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  }

  loadFromStorage() {
    try {
      const configString = localStorage.getItem(this.storageKey);
      if (configString) {
        const config = JSON.parse(configString);
        console.log("Configuration chargée");
        return config;
      }
    } catch (error) {
      console.error("Erreur lors du chargement depuis localStorage:", error);
    }
    return null;
  }

  // Gestion des modules
  syncModulesWithDimensions() {
    const modulesCount = this.config.modulesCount || 4;
    const totalWidth = this.config.width || 4000;
    const defaultModuleWidth = Math.floor(totalWidth / modulesCount);

    if (!this.config.modules) {
      this.config.modules = [];
    }

    while (this.config.modules.length < modulesCount) {
      this.config.modules.push({
        width: defaultModuleWidth,
        type: "fixe",
      });
    }

    if (this.config.modules.length > modulesCount) {
      this.config.modules = this.config.modules.slice(0, modulesCount);
    }

    const currentTotal = this.config.modules.reduce(
      (sum, module) => sum + (module.width || 0),
      0
    );

    if (Math.abs(currentTotal - totalWidth) > 10) {
      this.config.modules.forEach((module) => {
        module.width = defaultModuleWidth;
      });
    }
  }

  validateConfig() {
    const config = this.config;

    config.width = Math.max(400, Math.min(5000, config.width || 4000));
    config.height = Math.max(400, Math.min(5000, config.height || 2500));

    config.modulesCount = Math.max(1, Math.min(8, config.modulesCount || 4));
    config.porteIndex = Math.max(
      1,
      Math.min(config.modulesCount, config.porteIndex || 1)
    );

    if (config.porte) {
      config.porte.porteWidth = Math.max(
        400,
        Math.min(1230, config.porte.porteWidth || 730)
      );
      config.porte.tierceWidth = Math.max(
        300,
        Math.min(1230, config.porte.tierceWidth || 350)
      );
      config.porte.porteHeight = Math.max(
        500,
        Math.min(4000, config.porte.porteHeight || 2200)
      );
    }
  }

  updateModuleWidth(moduleIndex, width) {
    if (!this.config.modules[moduleIndex]) {
      return;
    }

    const oldWidth = this.config.modules[moduleIndex].width;
    this.config.modules[moduleIndex].width = Math.max(
      100,
      Math.min(2000, width)
    );

    console.log(`🏗️ Module ${moduleIndex + 1}: ${oldWidth}mm → ${width}mm`);
    this.updateConfig({ modules: this.config.modules });
  }

  // Gestion des traverses
  addTraverse(hauteur, type = "principale") {
    const targetArray = type === "porte" ? "traversesPorte" : "traverses";

    if (!this.config[targetArray]) {
      this.config[targetArray] = [];
    }

    // Vérifier que la hauteur est valide
    const maxHeight = this.config.height - 100;
    const validHeight = Math.max(100, Math.min(maxHeight, hauteur));

    // Ajouter la traverse
    this.config[targetArray].push({
      hauteur: validHeight,
      id: Date.now(),
    });

    // Trier par hauteur
    this.config[targetArray].sort((a, b) => a.hauteur - b.hauteur);

    console.log(`Traverse ${type} ajoutée à ${validHeight}mm`);

    this.updateConfig(this.config);
  }

  // Supprimer une traverse
  removeTraverse(traverseId, type = "principale") {
    const targetArray = type === "porte" ? "traversesPorte" : "traverses";

    if (!this.config[targetArray]) return;

    const initialLength = this.config[targetArray].length;
    this.config[targetArray] = this.config[targetArray].filter(
      (t) => t.id !== traverseId
    );

    if (this.config[targetArray].length < initialLength) {
      console.log(`Traverse ${type} supprimée (ID: ${traverseId})`);
      this.updateConfig(this.config);
    }
  }

  getConfig() {
    return this.config ? { ...this.config } : null;
  }

  resetConfig(confirm = false) {
    if (!confirm) {
      return false;
    }

    this.config = { ...this.defaultConfig };
    this.syncModulesWithDimensions();
    this.saveToStorage();

    this.updateConfig(this.config);

    return true;
  }

  getConfigSummary() {
    if (!this.config) return null;

    return {
      dimensions: `${this.config.width}mm × ${this.config.height}mm`,
      type: this.config.type,
      modules: `${this.config.modulesCount} modules`,
      porte:
        this.config.type === "porte"
          ? {
              largeur: `${this.config.porte.porteWidth}mm`,
              hauteur: `${this.config.porte.porteHeight}mm`,
              tierce: this.config.porte.withTierce
                ? `${this.config.porte.tierceWidth}mm`
                : "Non",
              imposte: this.config.porte.withImposte ? "Oui" : "Non",
            }
          : null,
      traverses: {
        principales: this.config.traverses?.length || 0,
        porte: this.config.traversesPorte?.length || 0,
      },
      couleur: this.config.options.colorProfile,
    };
  }
}

async function initConfigManager(eventManager) {
  try {
    const configManager = new ConfigManager(eventManager);
    await configManager.initialize();

    console.log("ConfigManager initialisé avec succès");
    console.log("Résumé:", configManager.getConfigSummary());

    return configManager;
  } catch (error) {
    console.error("Erreur lors de l'initialisation de ConfigManager:", error);
    throw error;
  }
}
