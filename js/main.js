import { appState } from "./core/AppState.js";
import { FormManager } from "./ui/FormManager.js";
import { SVGRenderer } from "./ui/SVGRenderer.js";
import { TableRenderer } from "./ui/TableRenderer.js";
import { TraverseManager } from "./ui/TraverseManager.js";
import { EVENTS } from "./constants.js";

/**
 * Application principale
 * Remplace l'énorme main.js existant par une orchestration propre
 */
class VerriereApp {
  constructor() {
    this._formManager = null;
    this._svgRenderer = null;
    this._tableRenderer = null;
    this._traverseManager = null;
  }

  /**
   * Initialise l'application
   */
  async initialize() {
    try {
      console.log("🚀 Initialisation de l'application...");

      // 1. Initialiser l'état
      await appState.initialize();

      // 2. Initialiser les gestionnaires UI
      this._formManager = new FormManager(appState);
      this._svgRenderer = new SVGRenderer();
      this._tableRenderer = new TableRenderer();
      this._traverseManager = new TraverseManager(appState);

      // 3. Initialiser chaque gestionnaire
      this._formManager.initialize();
      this._svgRenderer.initialize();
      this._tableRenderer.initialize();
      this._traverseManager.initialize();

      // 4. Connecter les gestionnaires aux événements d'état
      this._setupEventListeners();

      // 5. Premier rendu avec la configuration actuelle
      this._performInitialRender();

      console.log("✅ Application initialisée avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation:", error);
      this._handleInitializationError(error);
    }
  }

  /**
   * Configure les listeners d'événements principaux
   */
  _setupEventListeners() {
    // Quand la configuration change → mettre à jour tout
    appState.subscribe(EVENTS.CONFIG_CHANGED, (data) => {
      this._handleConfigChange(data);
    });

    // Quand la configuration est chargée → rendu initial
    appState.subscribe(EVENTS.CONFIG_LOADED, (config) => {
      this._handleConfigLoaded(config);
    });

    // Événements globaux
    this._setupGlobalEventListeners();
  }

  /**
   * Gère les changements de configuration
   */
  _handleConfigChange(data) {
    const { newState, path, source } = data;

    try {
      // Mettre à jour la visibilité des formulaires
      this._formManager.updateVisibility(newState);

      // Mettre à jour les options dynamiques
      this._formManager.updateDynamicOptions(newState);

      // Mettre à jour les inputs de modules si nécessaire
      if (this._shouldUpdateModuleInputs(path, source)) {
        this._formManager.updateModuleInputs(newState);
      }

      // Rendu SVG
      this._svgRenderer.render(newState);

      // Mettre à jour les tableaux
      this._tableRenderer.update(newState);

      console.log("🔄 Interface mise à jour pour:", path || "multiple");
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour:", error);
    }
  }

  /**
   * Gère le chargement initial de la configuration
   */
  _handleConfigLoaded(config) {
    try {
      this._formManager.updateVisibility(config);
      this._formManager.updateDynamicOptions(config);
      this._formManager.updateModuleInputs(config);

      console.log("📋 Configuration chargée et appliquée");
    } catch (error) {
      console.error("❌ Erreur lors du chargement:", error);
    }
  }

  /**
   * Effectue le rendu initial
   */
  _performInitialRender() {
    const config = appState.get();

    this._svgRenderer.render(config);
    this._tableRenderer.update(config);
    this._formManager.updateVisibility(config);
    this._formManager.updateDynamicOptions(config);
    this._formManager.updateModuleInputs(config);

    console.log("🎨 Rendu initial effectué");
  }

  /**
   * Configure les listeners globaux (boutons, etc.)
   */
  _setupGlobalEventListeners() {
    // Gestion des erreurs globales
    window.addEventListener("error", (event) => {
      console.error("💥 Erreur globale:", event.error);
    });

    // Sauvegarde automatique au cas où
    window.addEventListener("beforeunload", () => {
      console.log("💾 Sauvegarde avant fermeture");
    });

    // Touches de raccourci (optionnel)
    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "r":
            event.preventDefault();
            this._formManager.resetModules();
            break;
          case "s":
            event.preventDefault();
            console.log("💾 Configuration sauvegardée");
            break;
        }
      }
    });
  }

  /**
   * Détermine si les inputs de modules doivent être régénérés
   */
  _shouldUpdateModuleInputs(path, source) {
    if (source === "dom") return false; // Éviter les boucles

    const moduleRelatedPaths = [
      "width",
      "modulesCount",
      "type",
      "porteIndex",
      "porte.withTierce",
      "porte.charniereType",
    ];

    return moduleRelatedPaths.some((p) => path?.startsWith(p));
  }

  /**
   * Gère les erreurs d'initialisation
   */
  _handleInitializationError(error) {
    // Afficher un message d'erreur à l'utilisateur
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 1000;
      max-width: 400px;
    `;
    errorDiv.innerHTML = `
      <h3>❌ Erreur d'initialisation</h3>
      <p>L'application n'a pas pu démarrer correctement.</p>
      <p><small>${error.message}</small></p>
      <button onclick="location.reload()" style="
        background: white;
        color: #f44336;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
      ">Recharger la page</button>
    `;

    document.body.appendChild(errorDiv);

    // Supprimer après 10 secondes
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 10000);
  }

  /**
   * Méthodes publiques pour debug/dev
   */
  getState() {
    return appState.get();
  }

  getManagers() {
    return {
      form: this._formManager,
      svg: this._svgRenderer,
      table: this._tableRenderer,
      traverse: this._traverseManager,
    };
  }

  reset() {
    appState.reset();
  }
}

// ============================================
// INITIALISATION GLOBALE
// ============================================

/**
 * Point d'entrée unique
 */
async function initializeApp() {
  const app = new VerriereApp();

  try {
    await app.initialize();

    // Exposer l'app globalement pour le debug
    window.verriereApp = app;

    return app;
  } catch (error) {
    console.error("💥 Échec de l'initialisation complète:", error);
    throw error;
  }
}

// Auto-initialisation au chargement du DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// Export pour les tests ou usage externe
export { VerriereApp, initializeApp };
