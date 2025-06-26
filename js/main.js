import { EventBus } from "./core/EventBus.js";
import { ConfigModel } from "./core/ConfigModel.js";
import { UIManager } from "./ui/UIManager.js";
import { TableRenderer } from "./export/TableRenderer.js";
import { PDFExporter } from "./export/PDFExporter.js";
import { SVGRenderer } from "./rendering/SVGRenderer.js";

class VerrierApp {
  constructor() {
    this.eventBus = new EventBus();
    this.configModel = null;
    this.uiManager = null;
    this.tableRenderer = null;

    this.init();
  }

  async init() {
    try {
      console.log("🚀 Initialisation Configurateur Verrière V40...");

      this.configModel = new ConfigModel({}, this.eventBus);
      console.log("✅ ConfigModel initialisé");

      this.uiManager = new UIManager(this.configModel, this.eventBus);
      console.log("✅ UIManager initialisé");

      this.tableRenderer = new TableRenderer(this.eventBus);
      console.log("✅ TableRenderer initialisé");

      this.pdfExporter = new PDFExporter(this.eventBus);
      console.log("✅ PDFExporter initialisé");

      this.svgRenderer = new SVGRenderer(this.eventBus);
      console.log("✅ SVGRenderer initialisé");

      this.setupGlobalEvents();

      this.loadSavedConfig();

      this.configModel.validate();
      this.eventBus.emit("configChanged", this.configModel.getConfig());

      console.log("Configuration initiale :", this.configModel.getSummary());

      // Mode développement
      if (this.isDevelopmentMode()) {
        this.enableDebugMode();
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation :", error);
      this.showErrorMessage("Erreur d'initialisation de l'application");
    }
  }

  setupGlobalEvents() {
    window.addEventListener("error", (event) => {
      console.error("Erreur globale capturée :", event.error);
      this.showErrorMessage(`Erreur: ${event.error.message}`);
    });

    window.addEventListener("unhandledrejection", (event) => {
      console.error("Promesse rejetée non gérée :", event.reason);
      this.showErrorMessage(`Erreur async: ${event.reason}`);
      event.preventDefault();
    });

    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "s":
            event.preventDefault();
            this.saveConfig();
            break;
          case "r":
            event.preventDefault();
            this.resetConfig();
            break;
          case "z":
            if (event.shiftKey) {
              event.preventDefault();
              // TODO: Redo
            } else {
              event.preventDefault();
              // TODO: Undo
            }
            break;
        }
      }
    });

    this.eventBus.on("configChanged", (config) => {
      this.onConfigChanged(config);
    });
  }

  onConfigChanged(config) {
    if (this.isDevelopmentMode()) {
      console.log("Configuration mise à jour :", config);
    }

    try {
      const validation = this.validateConfiguration(config);
      if (!validation.valid) {
        console.warn("Configuration invalide :", validation.errors);
      }
    } catch (error) {
      console.error("Erreur de validation :", error);
    }
  }

  loadSavedConfig() {
    console.log(
      "Utilisation de la configuration par défaut (chargement désactivé)"
    );
    try {
      localStorage.removeItem("verriere_config");
      localStorage.removeItem("autosave_config");
    } catch (error) {
      console.warn("Impossible de nettoyer le stockage :", error);
    }

    // try {
    //   const loaded = this.configModel.loadFromStorage();
    //   if (loaded) {
    //     console.log("Configuration chargée depuis le stockage");
    //   } else {
    //     console.log("Utilisation de la configuration par défaut");
    //   }
    // } catch (error) {
    //   console.warn(
    //     "Impossible de charger la configuration sauvegardée :",
    //     error
    //   );
    // }
  }

  saveConfig() {
    try {
      const success = this.configModel.saveToStorage();
      if (success) {
        this.showSuccessMessage("Configuration sauvegardée");
      } else {
        this.showErrorMessage("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Erreur de sauvegarde :", error);
      this.showErrorMessage("Erreur lors de la sauvegarde");
    }
  }

  resetConfig() {
    if (
      confirm("Êtes-vous sûr de vouloir remettre à zéro la configuration ?")
    ) {
      try {
        this.configModel.state = this.configModel.getDefaultConfig();
        this.configModel.validate();
        this.eventBus.emit("configChanged", this.configModel.getConfig());
        this.showSuccessMessage("Configuration remise à zéro");
      } catch (error) {
        console.error("Erreur lors de la remise à zéro :", error);
        this.showErrorMessage("Erreur lors de la remise à zéro");
      }
    }
  }

  validateConfiguration(config) {
    const errors = [];

    if (!config.width || config.width < 400 || config.width > 5000) {
      errors.push("Largeur invalide");
    }
    if (!config.height || config.height < 400 || config.height > 5000) {
      errors.push("Hauteur invalide");
    }

    if (!config.modulesCount || config.modulesCount < 1) {
      errors.push("Nombre de modules invalide");
    }

    if (config.type === "porte") {
      if (!config.porte) {
        errors.push("Configuration porte manquante");
      } else {
        if (
          !config.porte.porteWidth ||
          config.porte.porteWidth < 400 ||
          config.porte.porteWidth > 1230
        ) {
          errors.push("Largeur porte invalide");
        }
        if (
          !config.porte.porteHeight ||
          config.porte.porteHeight < 500 ||
          config.porte.porteHeight > 4000
        ) {
          errors.push("Hauteur porte invalide");
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  showErrorMessage(message) {
    this.showMessage(message, "error");
  }

  showSuccessMessage(message) {
    this.showMessage(message, "success");
  }

  showMessage(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    Object.assign(toast.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      borderRadius: "6px",
      color: "white",
      fontWeight: "600",
      zIndex: "9999",
      maxWidth: "300px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      transform: "translateX(100%)",
      transition: "transform 0.3s ease",
    });

    switch (type) {
      case "error":
        toast.style.backgroundColor = "#dc3545";
        break;
      case "success":
        toast.style.backgroundColor = "#28a745";
        break;
      default:
        toast.style.backgroundColor = "#007bff";
    }

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transform = "translateX(0)";
    }, 100);

    setTimeout(() => {
      toast.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  isDevelopmentMode() {
    return (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.search.includes("debug=true")
    );
  }

  enableDebugMode() {
    console.log("Mode développement activé");

    window.VerrierApp = this;
    window.debugConfig = () => {
      console.table(this.configModel.state);
      return this.configModel.state;
    };
    window.exportConfig = () => {
      const json = this.configModel.toJSON();
      console.log("Configuration exportée :");
      console.log(json);
      return json;
    };
    window.importConfig = (jsonString) => {
      try {
        const success = this.configModel.fromJSON(jsonString);
        if (success) {
          this.eventBus.emit("configChanged", this.configModel.getConfig());
          console.log("Configuration importée");
        }
        return success;
      } catch (error) {
        console.error("Erreur d'import :", error);
        return false;
      }
    };
    window.resetApp = () => {
      this.resetConfig();
    };

    this.eventBus.on("configChanged", () => {
      console.time("UI Update");
      setTimeout(() => {
        console.timeEnd("UI Update");
      }, 0);
    });

    const debugIndicator = document.createElement("div");
    debugIndicator.innerHTML = "🔧 DEBUG";
    Object.assign(debugIndicator.style, {
      position: "fixed",
      bottom: "10px",
      left: "10px",
      padding: "5px 10px",
      backgroundColor: "#ff6b35",
      color: "white",
      fontSize: "12px",
      fontWeight: "bold",
      borderRadius: "4px",
      zIndex: "9999",
    });
    document.body.appendChild(debugIndicator);
  }

  autoSaveEnabled() {
    // return localStorage.getItem("verriere_autosave") !== "false";
    return false;
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  getConfig() {
    return this.configModel.getConfig();
  }

  setConfig(newConfig) {
    this.configModel.state = { ...this.configModel.state, ...newConfig };
    this.configModel.validate();
    this.eventBus.emit("configChanged", this.configModel.getConfig());
  }

  getSummary() {
    return this.configModel.getSummary();
  }

  exportJSON() {
    return this.configModel.toJSON();
  }

  importJSON(jsonString) {
    const success = this.configModel.fromJSON(jsonString);
    if (success) {
      this.eventBus.emit("configChanged", this.configModel.getConfig());
    }
    return success;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  try {
    const app = new VerrierApp();

    window.verrierApp = app;
  } catch (error) {
    console.error("Erreur lors du démarrage :", error);

    document.body.innerHTML = `
      <div style="
        display: flex; 
        justify-content: center; 
        align-items: center; 
        min-height: 100vh; 
        flex-direction: column;
        font-family: sans-serif;
        background-color: #f8f9fa;
      ">
        <div style="
          background: white; 
          padding: 40px; 
          border-radius: 12px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          max-width: 500px;
          text-align: center;
        ">
          <h1 style="color: #dc3545; margin-bottom: 20px;">⚠️ Erreur de démarrage</h1>
          <p style="color: #6c757d; margin-bottom: 20px;">
            L'application n'a pas pu se charger correctement.
          </p>
          <details style="text-align: left; margin-top: 20px;">
            <summary style="cursor: pointer; color: #007bff;">Détails techniques</summary>
            <pre style="
              background: #f8f9fa; 
              padding: 15px; 
              border-radius: 6px; 
              margin-top: 10px;
              overflow-x: auto;
              font-size: 12px;
            ">${error.stack || error.message}</pre>
          </details>
          <button onclick="window.location.reload()" style="
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            cursor: pointer;
            margin-top: 20px;
            font-weight: 600;
          ">Recharger la page</button>
        </div>
      </div>
    `;
  }
});
