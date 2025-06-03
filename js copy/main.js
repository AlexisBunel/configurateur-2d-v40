/**
 * main.js - Point d'entrée de l'application
 * Responsable de l'initialisation et de l'orchestration des modules
 */

// Configuration globale de l'application
const APP_CONFIG = {
  version: "1.0.0",
  debug: true, // Mode debug pour afficher les logs pendant le développement
  autoSaveInterval: 30000, // Sauvegarde automatique toutes les 30 secondes
};

/**
 * Point d'entrée principal de l'application
 * Initialise tous les modules dans le bon ordre
 */
function initApp() {
  if (APP_CONFIG.debug) {
    console.log("🚀 Initialisation de l'application Verrière V40");
  }

  try {
    // 1. Initialiser la configuration
    ConfigManager.init();
    if (APP_CONFIG.debug) console.log("✅ Configuration initialisée");

    // 2. Initialiser le gestionnaire d'événements
    EventBus.init();
    if (APP_CONFIG.debug) console.log("✅ Événements initialisés");

    // 3. Initialiser l'interface utilisateur
    UIManager.init();
    if (APP_CONFIG.debug) console.log("✅ Interface utilisateur initialisée");

    // 4. Initialiser le rendu SVG
    Renderer.init();
    if (APP_CONFIG.debug) console.log("✅ Rendu SVG initialisé");

    // 5. Charger une configuration sauvegardée (si elle existe)
    loadSavedConfig();

    // 6. Première mise à jour de l'affichage
    EventBus.emit("config-loaded");

    // 7. Démarrer la sauvegarde automatique
    startAutoSave();

    if (APP_CONFIG.debug) {
      console.log("🎉 Application initialisée avec succès !");
      console.log("Configuration actuelle:", ConfigManager.getConfig());
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    showErrorMessage(
      "Erreur lors du chargement de l'application. Veuillez recharger la page."
    );
  }
}

/**
 * Charge la configuration sauvegardée depuis localStorage
 */
function loadSavedConfig() {
  try {
    const savedConfig = localStorage.getItem("verriere-config");
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      ConfigManager.loadConfig(config);
      if (APP_CONFIG.debug)
        console.log("📁 Configuration chargée depuis localStorage");
    }
  } catch (error) {
    console.warn(
      "⚠️ Impossible de charger la configuration sauvegardée:",
      error
    );
  }
}

/**
 * Sauvegarde la configuration actuelle dans localStorage
 */
function saveConfig() {
  try {
    const config = ConfigManager.getConfig();
    localStorage.setItem("verriere-config", JSON.stringify(config));
    if (APP_CONFIG.debug) console.log("💾 Configuration sauvegardée");
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde:", error);
  }
}

/**
 * Démarre la sauvegarde automatique
 */
function startAutoSave() {
  setInterval(() => {
    saveConfig();
  }, APP_CONFIG.autoSaveInterval);

  if (APP_CONFIG.debug) {
    console.log(
      `⏰ Sauvegarde automatique activée (${
        APP_CONFIG.autoSaveInterval / 1000
      }s)`
    );
  }
}

/**
 * Affiche un message d'erreur à l'utilisateur
 */
function showErrorMessage(message) {
  // Pour l'instant, utilise alert, mais on peut améliorer plus tard
  alert(message);
}

/**
 * Fonction utilitaire pour activer/désactiver le mode debug
 */
function toggleDebug() {
  APP_CONFIG.debug = !APP_CONFIG.debug;
  console.log(`Debug mode: ${APP_CONFIG.debug ? "ON" : "OFF"}`);
}

// Démarrage de l'application quand le DOM est chargé
document.addEventListener("DOMContentLoaded", initApp);

// Sauvegarde avant fermeture de la page
window.addEventListener("beforeunload", saveConfig);

// Export pour utilisation dans la console (debug)
if (APP_CONFIG.debug) {
  window.VerriereApp = {
    config: () => ConfigManager.getConfig(),
    save: saveConfig,
    toggleDebug: toggleDebug,
    version: APP_CONFIG.version,
  };
}
