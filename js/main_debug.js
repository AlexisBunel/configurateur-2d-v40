// Version simplifiée de main.js pour débugger
import { appState } from "./core/AppState.js";
import { EVENTS } from "./constants.js";

/**
 * 🔧 Version simplifiée pour identifier les problèmes
 */
class VerriereAppDebug {
  constructor() {
    this._isInitializing = false;
    this._changeCount = 0;
  }

  async initialize() {
    console.log("🚀 [DEBUG] Démarrage version debug...");

    if (this._isInitializing) {
      console.warn("⚠️ [DEBUG] Initialisation déjà en cours !");
      return;
    }

    this._isInitializing = true;

    try {
      // 1. Initialiser SEULEMENT l'état
      console.log("📦 [DEBUG] Initialisation AppState...");
      await appState.initialize();

      // 2. Écouter les changements avec compteur
      appState.subscribe(EVENTS.CONFIG_CHANGED, (data) => {
        this._changeCount++;
        console.log(`🔄 [DEBUG] Changement #${this._changeCount}:`, {
          path: data.path,
          source: data.source,
          timestamp: Date.now(),
        });

        // 🚨 Arrêt d'urgence si trop de changements
        if (this._changeCount > 50) {
          console.error(
            "🚨 [DEBUG] ARRÊT D'URGENCE - Trop de changements détectés !"
          );
          this._emergencyStop();
          return;
        }
      });

      // 3. Attacher SEULEMENT quelques listeners de base
      this._attachBasicListeners();

      console.log("✅ [DEBUG] Initialisation terminée");
      this._isInitializing = false;
    } catch (error) {
      console.error("❌ [DEBUG] Erreur:", error);
      this._isInitializing = false;
      throw error;
    }
  }

  _attachBasicListeners() {
    console.log("🔗 [DEBUG] Attachement listeners de base...");

    // Seulement les champs de base SANS auto-sync
    const basicInputs = [
      document.getElementById("width"),
      document.getElementById("height"),
      document.querySelector('input[name="type"]'),
    ].filter(Boolean);

    basicInputs.forEach((input, index) => {
      const handler = () => {
        console.log(`📝 [DEBUG] Input ${index + 1} changé:`, input.value);
        // PAS de syncFromDOM pour l'instant !
      };

      input.addEventListener("change", handler);
      console.log(`✅ [DEBUG] Listener ${index + 1} attaché`);
    });
  }

  _emergencyStop() {
    console.log("🛑 [DEBUG] Arrêt d'urgence activé");

    // Supprimer tous les listeners
    document.querySelectorAll("input, select").forEach((element) => {
      element.removeEventListener("change", () => {});
      element.removeEventListener("input", () => {});
    });

    // Afficher l'état actuel
    console.log("📊 [DEBUG] État final:", appState.get());
  }

  // Méthodes pour inspection manuelle
  getState() {
    return appState.get();
  }

  triggerManualSync() {
    console.log("🔄 [DEBUG] Synchronisation manuelle...");
    return appState.syncFromDOM();
  }

  resetChangeCount() {
    this._changeCount = 0;
    console.log("🔄 [DEBUG] Compteur remis à zéro");
  }
}

// ============================================
// INITIALISATION DEBUG
// ============================================

async function initializeDebugApp() {
  const app = new VerriereAppDebug();

  try {
    await app.initialize();

    // Exposer pour tests manuels
    window.verriereDebug = app;
    window.testSync = () => app.triggerManualSync();
    window.resetCount = () => app.resetChangeCount();

    console.log("🎉 [DEBUG] App prête ! Utilisez:");
    console.log("  - window.verriereDebug.getState()");
    console.log("  - window.testSync()");
    console.log("  - window.resetCount()");

    return app;
  } catch (error) {
    console.error("💥 [DEBUG] Échec complet:", error);

    // Interface d'urgence
    document.body.innerHTML = `
      <div style="padding: 20px; background: #f44336; color: white; font-family: monospace;">
        <h2>🚨 ERREUR DE CHARGEMENT</h2>
        <p>L'application n'a pas pu démarrer. Vérifiez la console.</p>
        <pre>${error.message}</pre>
        <button onclick="location.reload()">🔄 Recharger</button>
      </div>
    `;

    throw error;
  }
}

// Auto-initialisation
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDebugApp);
} else {
  initializeDebugApp();
}

export { VerriereAppDebug, initializeDebugApp };
