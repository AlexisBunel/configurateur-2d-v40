class ConfigEventManager {
  constructor() {
    this.listeners = new Map();
    this.config = null;
  }

  subscribe(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }

  emit(eventName, data) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach((fonction) => {
        try {
          fonction(data);
        } catch (error) {
          console.error("Message:", error);
        }
      });
    }
  }

  updateConfig(newConfig) {
    const oldConfig = this.config ? { ...this.config } : null;
    this.config = newConfig;
    this.emit("configChanged", {
      newConfig: this.config,
      oldConfig: oldConfig,
    });
  }

  getConfig() {
    return this.config;
  }

  generateConfigFromForm() {
    const config = {
      modules: [],
      traverses: [],
      traversesPorte: [],
    };

    const inputs = document.querySelectorAll("[data-config-key]");

    inputs.forEach((input) => {
      const key = input.getAttribute("data-config-key");
      let value;

      if (input.type === "radio") {
        if (input.checked) {
          value = input.value;
        } else {
          return;
        }
      } else if (input.type === "checkbox") {
        value = input.checked;
      } else {
        value = input.value;

        if (input.type === "number") {
          value = parseInt(value) || 0;
        } else if (value === "true") {
          value = true;
        } else if (value === "false") {
          value = false;
        }
      }

      // Gestion des sous-propriétés (ex: "porte.width")
      const keys = key.split(".");
      let target = config;

      for (let i = 0; i < keys.length - 1; i++) {
        const currentKey = keys[i];
        if (!target[currentKey]) {
          target[currentKey] = {};
        }
        target = target[currentKey];
      }

      const finalKey = keys[keys.length - 1];
      target[finalKey] = value;
    });

    return config;
  }

  loadConfig() {
    this.config = this.generateConfigFromForm();
    this.updateConfig(this.config);
    // console.log(this.config);
    return this.config;
  }

  // Écouter automatiquement les changements
  attachFormListeners() {
    const inputs = document.querySelectorAll("[data-config-key]");

    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        this.generateAndEmitConfigFromForm();
      });
    });
  }
}

// Instance globale du gestionnaire d'événements
const configManager = new ConfigEventManager();

// Fonction d'initialisation pour les autres modules
async function initConfigManager() {
  try {
    await configManager.loadConfig();
    configManager.attachFormListeners();

    console.log("EventManager initialisé avec succès");
    return configManager;
  } catch (error) {
    console.error("Erreur lors de l'initialisation d'EventManager:", error);
    throw error;
  }
}
