/**
 * events.js - Gestionnaire d'événements
 * Système de communication entre les modules via des événements personnalisés
 */

/**
 * Gestionnaire d'événements centralisé
 * Permet aux différents modules de communiquer sans dépendances directes
 */
const EventBus = {
    
    /**
     * Stockage des écouteurs d'événements
     * @private
     */
    _listeners: {},
    
    /**
     * Mode debug pour tracer les événements
     * @private
     */
    _debug: true,
    
    /**
     * Initialise le gestionnaire d'événements
     */
    init() {
        this._listeners = {};
        if (this._debug) {
            console.log('📡 EventBus initialisé');
        }
    },
    
    /**
     * Émet un événement avec des données optionnelles
     * @param {string} eventName - Nom de l'événement
     * @param {*} data - Données à transmettre (optionnel)
     */
    emit(eventName, data = null) {
        if (this._debug) {
            console.log(`📤 Événement émis: ${eventName}`, data);
        }
        
        // Vérifie s'il y a des écouteurs pour cet événement
        if (!this._listeners[eventName]) {
            if (this._debug) {
                console.log(`📭 Aucun écouteur pour l'événement: ${eventName}`);
            }
            return;
        }
        
        // Appelle tous les écouteurs de cet événement
        this._listeners[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`❌ Erreur dans l'écouteur de ${eventName}:`, error);
            }
        });
    },
    
    /**
     * Ajoute un écouteur pour un événement
     * @param {string} eventName - Nom de l'événement à écouter
     * @param {Function} callback - Fonction à appeler quand l'événement est émis
     */
    on(eventName, callback) {
        if (typeof callback !== 'function') {
            console.error('❌ Le callback doit être une fonction');
            return;
        }
        
        // Crée le tableau d'écouteurs si nécessaire
        if (!this._listeners[eventName]) {
            this._listeners[eventName] = [];
        }
        
        // Ajoute le callback
        this._listeners[eventName].push(callback);
        
        if (this._debug) {
            console.log(`📥 Écouteur ajouté pour: ${eventName}`);
        }
    },
    
    /**
     * Retire un écouteur pour un événement
     * @param {string} eventName - Nom de l'événement
     * @param {Function} callback - Fonction à retirer
     */
    off(eventName, callback) {
        if (!this._listeners[eventName]) {
            return;
        }
        
        const index = this._listeners[eventName].indexOf(callback);
        if (index > -1) {
            this._listeners[eventName].splice(index, 1);
            if (this._debug) {
                console.log(`📤 Écouteur retiré pour: ${eventName}`);
            }
        }
    },
    
    /**
     * Retire tous les écouteurs d'un événement
     * @param {string} eventName - Nom de l'événement
     */
    removeAllListeners(eventName) {
        if (this._listeners[eventName]) {
            delete this._listeners[eventName];
            if (this._debug) {
                console.log(`🗑️ Tous les écouteurs retirés pour: ${eventName}`);
            }
        }
    },
    
    /**
     * Retourne la liste des événements écoutés
     * @returns {Array} Liste des noms d'événements
     */
    getEventNames() {
        return Object.keys(this._listeners);
    },
    
    /**
     * Active/désactive le mode debug
     * @param {boolean} enabled - État du mode debug
     */
    setDebug(enabled) {
        this._debug = enabled;
        console.log(`Debug EventBus: ${enabled ? 'ON' : 'OFF'}`);
    }
};

/**
 * Liste des événements utilisés dans l'application
 * Documentation pour les développeurs
 */
const EVENTS = {
    // Événements de configuration
    CONFIG_UPDATED: 'config-updated',     // Émis quand une valeur de config change
    CONFIG_LOADED: 'config-loaded',       // Émis quand une config complète est chargée
    CONFIG_RESET: 'config-reset',         // Émis quand la config est remise à zéro
    
    // Événements d'interface
    UI_FORM_UPDATED: 'ui-form-updated',   // Émis quand un formulaire est modifié
    UI_MODULE_ADDED: 'ui-module-added',   // Émis quand un module est ajouté
    UI_MODULE_REMOVED: 'ui-module-removed', // Émis quand un module est supprimé
    
    // Événements de traverses
    TRAVERSE_ADDED: 'traverse-added',     // Émis quand une traverse est ajoutée
    TRAVERSE_REMOVED: 'traverse-removed', // Émis quand une traverse est supprimée
    TRAVERSE_UPDATED: 'traverse-updated', // Émis quand une traverse est modifiée
    
    // Événements de rendu
    RENDER_REQUESTED: 'render-requested', // Demande de rendu SVG
    RENDER_COMPLETED: 'render-completed', // Rendu SVG terminé
    
    // Événements de calculs
    CALC_REQUESTED: 'calc-requested',     // Demande de recalcul
    CALC_COMPLETED: 'calc-completed',     // Calculs terminés
    
    // Événements d'erreurs
    ERROR_VALIDATION: 'error-validation', // Erreur de validation
    ERROR_CALCULATION: 'error-calculation', // Erreur de calcul
    ERROR_RENDER: 'error-render'          // Erreur de rendu
};

/**
 * Fonctions utilitaires pour faciliter l'utilisation des événements
 */
const EventUtils = {
    
    /**
     * Émet un événement de mise à jour de configuration
     * @param {string} key - Clé de configuration modifiée
     * @param {*} value - Nouvelle valeur
     */
    emitConfigUpdate(key, value) {
        EventBus.emit(EVENTS.CONFIG_UPDATED, { key, value });
    },
    
    /**
     * Émet un événement d'erreur avec contexte
     * @param {string} type - Type d'erreur (validation, calculation, render)
     * @param {string} message - Message d'erreur
     * @param {*} context - Contexte supplémentaire
     */
    emitError(type, message, context = null) {
        const eventName = `error-${type}`;
        EventBus.emit(eventName, { message, context, timestamp: new Date() });
    },
    
    /**
     * Configure les écouteurs de base pour le debug
     */
    setupDebugListeners() {
        // Écoute tous les événements d'erreur
        Object.values(EVENTS).filter(event => event.startsWith('error')).forEach(errorEvent => {
            EventBus.on(errorEvent, (data) => {
                console.error(`🚨 ${errorEvent}:`, data);
            });
        });
        
        // Log des événements principaux
        EventBus.on(EVENTS.CONFIG_UPDATED, (data) => {
            console.log('⚙️ Configuration mise à jour:', data);
        });
        
        EventBus.on(EVENTS.RENDER_COMPLETED, () => {
            console.log('🎨 Rendu SVG terminé');
        });
    }
};

// Export pour utilisation en mode debug
if (typeof window !== 'undefined' && window.VerriereApp) {
    window.VerriereApp.EventBus = EventBus;
    window.VerriereApp.EVENTS = EVENTS;
}