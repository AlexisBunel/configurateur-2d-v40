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

      // Gestion des propriétés imbriquées
      const keys = key.split("."); // ← Sépare "porte.width" en ["porte", "width"]
      let target = config;

      // Navigue jusqu'à l'objet parent
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) {
          target[keys[i]] = {};
        }
        target = target[keys[i]];
      }

      // Met à jour la valeur finale
      target[keys[keys.length - 1]] = value;
    });

    return config;
  }

  loadConfig() {
    this.config = this.generateConfigFromForm();
    this.updateConfig(this.config);
    // console.log(this.config);
    return this.config;
  }
}

// Instance globale du gestionnaire d'événements
const configManager = new ConfigEventManager();

// Fonction d'initialisation pour les autres modules
async function initConfigManager() {
  await configManager.loadConfig();
  // console.log("ConfigManager initialisé avec succès");
  return configManager;
}
