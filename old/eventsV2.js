// GESTIONNAIRE D'ÉVÉNEMENTS

class ConfigEventManager {
  constructor() {
    this.listeners = new Map();
    console.log("EventManager initialisé");
  }

  subscribe(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }

    this.listeners.get(eventName).push(callback);
    console.log(
      `Nouvel abonné pour "${eventName}". Total: ${
        this.listeners.get(eventName).length
      }`
    );
  }

  // Déclencher un événement
  emit(eventName, data) {
    if (this.listeners.has(eventName)) {
      const subscribers = this.listeners.get(eventName);

      console.log(
        `Émission "${eventName}" vers ${subscribers.length} abonné(s)`
      );

      subscribers.forEach((callback, index) => {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `Erreur dans l'abonné ${index + 1} de "${eventName}":`,
            error
          );
        }
      });
    } else {
      console.warn(`Aucun abonné pour l'événement "${eventName}"`);
    }
  }

  // Notifier un changement de configuration
  notifyConfigChanged(newConfig, oldConfig = null) {
    this.emit("configChanged", {
      newConfig: newConfig,
      oldConfig: oldConfig,
      hasChanged: this.hasConfigChanged(oldConfig, newConfig),
    });
  }

  // Comparer deux configurations
  hasConfigChanged(oldConfig, newConfig) {
    if (!oldConfig) return { everything: true };

    const changes = {};

    if (oldConfig.width !== newConfig.width) changes.dimensions = true;
    if (oldConfig.height !== newConfig.height) changes.dimensions = true;
    if (oldConfig.type !== newConfig.type) changes.type = true;
    if (oldConfig.modulesCount !== newConfig.modulesCount)
      changes.modules = true;

    if (JSON.stringify(oldConfig.porte) !== JSON.stringify(newConfig.porte)) {
      changes.porte = true;
    }

    return changes;
  }

  // Générer la configuration depuis les formulaires HTML
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

      console.log(`📝 ${key} = ${value} (type: ${typeof value})`);
    });

    return config;
  }

  loadConfig() {
    try {
      this.config = this.generateConfigFromForm();
      this.updateConfig(this.config);

      console.log("Configuration générée depuis les formulaires:", this.config);
      return this.config;
    } catch (error) {
      console.error("Erreur lors de la génération de la configuration:", error);
      this.emit("errorOccurred", {
        type: "loadConfig",
        error: error,
        message: "Impossible de lire les formulaires",
      });

      throw error;
    }
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

const configManager = new ConfigEventManager();

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
