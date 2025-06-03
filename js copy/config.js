/**
 * config.js - Gestionnaire de configuration
 * Responsable de la gestion centralisée de toute la configuration de la verrière
 */

/**
 * Configuration par défaut de la verrière
 * Cette configuration est utilisée au premier démarrage ou pour reset
 */
const DEFAULT_CONFIG = {
    // Dimensions principales
    width: 4000,
    height: 2500,
    type: 'pleine', // 'pleine' ou 'porte'
    
    // Configuration des modules
    modulesCount: 4,
    moduleWidths: [1000, 1000, 1000, 1000], // Largeurs individuelles des modules
    porteIndex: 3, // Index du module contenant la porte (0-based)
    
    // Configuration de la porte
    porte: {
        porteWidth: 730,
        porteHeight: 2200,
        tierceWidth: 350,
        withTierce: false,
        withImposte: false,
        withDormant: false,
        charniereType: 'visible', // 'visible' ou 'invisible'
        sensOuverture: 'droit', // 'droit' ou 'gauche'
        serrure: 'SERROULM',
        profile: 'po66',
        colorBequille: 'noir',
        colorPvitrage: 'noir',
        traverseType: '28' // Type de traverse sur porte
    },
    
    // Traverses principales
    traverses: [
        // Exemple: { id: 1, position: 1200, type: 'TI28' }
    ],
    
    // Traverses sur porte
    traversesPorte: [
        // Exemple: { id: 1, position: 1100, type: '28' }
    ],
    
    // Options générales
    options: {
        colorProfile: 'noir', // 'noir', 'gris', 'blanc'
        remplissageEp: '6', // '6' ou '8' mm
        colorJoint: 'noir' // 'noir', 'transp', 'blanc'
    }
};

/**
 * Gestionnaire de configuration
 */
const ConfigManager = {
    
    /**
     * Configuration actuelle
     * @private
     */
    _config: null,
    
    /**
     * Initialise le gestionnaire de configuration
     */
    init() {
        this._config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); // Clone profond
        console.log('🔧 ConfigManager initialisé');
    },
    
    /**
     * Retourne la configuration complète
     * @returns {Object} Configuration actuelle
     */
    getConfig() {
        return JSON.parse(JSON.stringify(this._config)); // Retourne une copie pour éviter les modifications externes
    },
    
    /**
     * Retourne une valeur spécifique de la configuration
     * @param {string} key - Clé de configuration (supporte la notation pointée ex: 'porte.porteWidth')
     * @returns {*} Valeur de la configuration
     */
    get(key) {
        return this._getNestedValue(this._config, key);
    },
    
    /**
     * Met à jour une valeur de configuration
     * @param {string} key - Clé de configuration (supporte la notation pointée)
     * @param {*} value - Nouvelle valeur
     */
    set(key, value) {
        const oldValue = this.get(key);
        
        // Validation avant mise à jour
        if (!this._validateValue(key, value)) {
            console.warn(`⚠️ Valeur invalide pour ${key}:`, value);
            return false;
        }
        
        // Mise à jour de la valeur
        this._setNestedValue(this._config, key, value);
        
        // Émission de l'événement de mise à jour
        EventBus.emit('config-updated', {
            key: key,
            oldValue: oldValue,
            newValue: value
        });
        
        console.log(`📝 Configuration mise à jour: ${key} = ${value}`);
        return true;
    },
    
    /**
     * Charge une configuration complète
     * @param {Object} config - Nouvelle configuration
     */
    loadConfig(config) {
        // Fusion avec la configuration par défaut pour éviter les propriétés manquantes
        this._config = this._mergeConfigs(DEFAULT_CONFIG, config);
        EventBus.emit('config-loaded');
        console.log('📁 Configuration chargée');
    },
    
    /**
     * Remet la configuration aux valeurs par défaut
     */
    reset() {
        this._config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        EventBus.emit('config-reset');
        console.log('🔄 Configuration remise à zéro');
    },
    
    /**
     * Valide une valeur selon sa clé
     * @private
     */
    _validateValue(key, value) {
        switch (key) {
            case 'width':
            case 'height':
                return value >= 400 && value <= 5000;
            
            case 'porte.porteWidth':
                return value >= 400 && value <= 1230;
                
            case 'porte.porteHeight':
                return value >= 500 && value <= 4000;
                
            case 'porte.tierceWidth':
                return value >= 300 && value <= 1230;
                
            case 'type':
                return ['pleine', 'porte'].includes(value);
                
            case 'porte.charniereType':
                return ['visible', 'invisible'].includes(value);
                
            case 'porte.sensOuverture':
                return ['droit', 'gauche'].includes(value);
                
            case 'options.colorProfile':
                return ['noir', 'gris', 'blanc'].includes(value);
                
            case 'options.remplissageEp':
                return ['6', '8'].includes(value);
                
            case 'options.colorJoint':
                return ['noir', 'transp', 'blanc'].includes(value);
                
            default:
                return true; // Pas de validation spécifique
        }
    },
    
    /**
     * Récupère une valeur imbriquée avec notation pointée
     * @private
     */
    _getNestedValue(obj, key) {
        return key.split('.').reduce((current, prop) => {
            return current && current[prop] !== undefined ? current[prop] : undefined;
        }, obj);
    },
    
    /**
     * Définit une valeur imbriquée avec notation pointée
     * @private
     */
    _setNestedValue(obj, key, value) {
        const keys = key.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, prop) => {
            if (!current[prop]) current[prop] = {};
            return current[prop];
        }, obj);
        target[lastKey] = value;
    },
    
    /**
     * Fusionne deux configurations
     * @private
     */
    _mergeConfigs(defaultConfig, userConfig) {
        const result = JSON.parse(JSON.stringify(defaultConfig));
        
        function merge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    merge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        
        merge(result, userConfig);
        return result;
    }
};

// Export pour utilisation en mode debug
if (typeof window !== 'undefined' && window.VerriereApp) {
    window.VerriereApp.ConfigManager = ConfigManager;
}