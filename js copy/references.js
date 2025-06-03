/**
 * references.js - Base de données des références produits
 * Contient toutes les références, prix et caractéristiques des produits
 */

/**
 * Base de données des références produits
 */
const REFERENCES_DB = {
    
    /**
     * Profilés aluminium
     */
    profiles: {
        // Montants
        'MT40': {
            ref: 'MT40',
            designation: 'Montant 40',
            famille: 'Montant',
            section: '40x40mm',
            poids: 1.2, // kg/ml
            prix: {
                'noir': 15.50,
                'gris': 15.50,
                'blanc': 16.20
            },
            unite: 'ml',
            longueurMax: 6000,
            description: 'Montant principal pour structure verrière'
        },
        
        // Traverses principales
        'TR40': {
            ref: 'TR40',
            designation: 'Traverse haute/basse 40',
            famille: 'Traverse',
            section: '40x60mm',
            poids: 1.8,
            prix: {
                'noir': 12.30,
                'gris': 12.30,
                'blanc': 12.85
            },
            unite: 'ml',
            longueurMax: 6000,
            description: 'Traverse pour liaison haute et basse'
        },
        
        // Traverses intermédiaires
        'TI28': {
            ref: 'TI28',
            designation: 'Traverse intermédiaire 28',
            famille: 'Traverse',
            section: '28x40mm',
            poids: 0.8,
            prix: {
                'noir': 11.80,
                'gris': 11.80,
                'blanc': 12.35
            },
            unite: 'ml',
            longueurMax: 6000,
            description: 'Traverse intermédiaire pour renfort'
        },
        
        'TI37': {
            ref: 'TI37',
            designation: 'Traverse intermédiaire 37',
            famille: 'Traverse',
            section: '37x40mm',
            poids: 1.1,
            prix: {
                'noir': 14.20,
                'gris': 14.20,
                'blanc': 14.85
            },
            unite: 'ml',
            longueurMax: 6000,
            description: 'Traverse intermédiaire renforcée'
        },
        
        // Profilés de porte
        'DO66': {
            ref: 'DO66',
            designation: 'Dormant porte 66',
            famille: 'Porte',
            section: '66x40mm',
            poids: 2.1,
            prix: {
                'noir': 18.50,
                'gris': 18.50,
                'blanc': 19.35
            },
            unite: 'ml',
            longueurMax: 6000,
            description: 'Dormant fixe pour porte ouvrante'
        },
        
        'PO66': {
            ref: 'PO66',
            designation: 'Profil porte ouvrante 66',
            famille: 'Porte',
            section: '66x50mm',
            poids: 2.3,
            prix: {
                'noir': 19.80,
                'gris': 19.80,
                'blanc': 20.70
            },
            unite: 'ml',
            longueurMax: 6000,
            description: 'Ouvrant de porte standard'
        },
        
        'PO6622U': {
            ref: 'PO6622U',
            designation: 'Profil porte ouvrante 66 usiné',
            famille: 'Porte',
            section: '66x50mm',
            poids: 2.3,
            prix: {
                'noir': 22.30,
                'gris': 22.30,
                'blanc': 23.35
            },
            unite: 'ml',
            longueurMax: 6000,
            description: 'Ouvrant de porte avec usinage spécial'
        },
        
        // Traverses porte
        'TRP28': {
            ref: 'TRP28',
            designation: 'Traverse porte 28mm',
            famille: 'Porte',
            section: '28x40mm',
            poids: 0.8,
            prix: {
                'noir': 13.80,
                'gris': 13.80,
                'blanc': 14.45
            },
            unite: 'ml',
            longueurMax: 2000,
            description: 'Traverse pour renfort porte'
        },
        
        'TRP37': {
            ref: 'TRP37',
            designation: 'Traverse porte 37mm',
            famille: 'Porte',
            section: '37x40mm',
            poids: 1.1,
            prix: {
                'noir': 16.20,
                'gris': 16.20,
                'blanc': 16.95
            },
            unite: 'ml',
            longueurMax: 2000,
            description: 'Traverse renforcée pour porte'
        },
        
        // Tierce
        'TIERCE': {
            ref: 'TIERCE',
            designation: 'Tierce fixe',
            famille: 'Porte',
            section: '66x40mm',
            poids: 2.0,
            prix: {
                'noir': 16.50,
                'gris': 16.50,
                'blanc': 17.25
            },
            unite: 'ml',
            longueurMax: 6000,
            description: 'Profil pour tierce fixe'
        }
    },
    
    /**
     * Accessoires et quincaillerie
     */
    accessories: {
        // Équerres et assemblages
        'ANGLE40': {
            ref: 'ANGLE40',
            designation: 'Équerre d\'assemblage 40',
            famille: 'Assemblage',
            materiau: 'Acier zingué',
            prix: 3.50,
            unite: 'pcs',
            description: 'Équerre pour assemblage d\'angle'
        },
        
        'VIS4X12': {
            ref: 'VIS4X12',
            designation: 'Vis assemblage 4x12',
            famille: 'Assemblage',
            materiau: 'Acier inox',
            prix: 0.15,
            unite: 'pcs',
            description: 'Vis pour fixation équerres'
        },
        
        // Charnières
        'CHARNVIS': {
            ref: 'CHARNVIS',
            designation: 'Charnière visible',
            famille: 'Quincaillerie',
            materiau: 'Acier laqué',
            prix: 25.00,
            unite: 'pcs',
            poids: 0.3,
            chargeMax: 80, // kg
            description: 'Charnière apparente pour porte'
        },
        
        'CHARNINV': {
            ref: 'CHARNINV',
            designation: 'Charnière invisible',
            famille: 'Quincaillerie',
            materiau: 'Acier inoxydable',
            prix: 45.00,
            unite: 'pcs',
            poids: 0.4,
            chargeMax: 120, // kg
            description: 'Charnière intégrée dans le profil'
        },
        
        // Serrures
        'SERROULM': {
            ref: 'SERROULM',
            designation: 'Serrure à rouleau seul',
            famille: 'Serrurerie',
            materiau: 'Acier laqué',
            prix: 85.00,
            unite: 'pcs',
            description: 'Serrure simple avec rouleau'
        },
        
        'SERROULPENM': {
            ref: 'SERROULPENM',
            designation: 'Serrure rouleau + pêne + 1/2 cylindre',
            famille: 'Serrurerie',
            materiau: 'Acier laqué',
            prix: 125.00,
            unite: 'pcs',
            description: 'Serrure complète avec demi-cylindre'
        },
        
        'SERPEN35M': {
            ref: 'SERPEN35M',
            designation: 'Serrure pêne demi-tour + pêne dormant',
            famille: 'Serrurerie',
            materiau: 'Acier laqué',
            prix: 95.00,
            unite: 'pcs',
            description: 'Serrure à double pêne'
        },
        
        // Béquilles
        'BEQUILLE': {
            ref: 'BEQUILLE',
            designation: 'Béquille de porte',
            famille: 'Quincaillerie',
            prix: {
                'noir': 35.00,
                'inox': 42.00
            },
            unite: 'pcs',
            description: 'Poignée de porte avec mécanisme'
        },
        
        // Joints
        'JOINT6': {
            ref: 'JOINT6',
            designation: 'Joint d\'étanchéité EPDM',
            famille: 'Étanchéité',
            materiau: 'EPDM',
            prix: {
                'noir': 4.20,
                'transp': 4.50,
                'blanc': 4.35
            },
            unite: 'ml',
            durete: '65 Shore A',
            temperature: '-40°C à +120°C',
            description: 'Joint d\'étanchéité périphérique'
        },
        
        'JOINTVIT': {
            ref: 'JOINTVIT',
            designation: 'Joint de vitrage',
            famille: 'Étanchéité',
            materiau: 'EPDM',
            prix: {
                'noir': 2.80,
                'transp': 3.00
            },
            unite: 'ml',
            description: 'Joint pour maintien du vitrage'
        }
    },
    
    /**
     * Vitrages et remplissages
     */
    glass: {
        'VITR6': {
            ref: 'VITR6',
            designation: 'Vitrage simple 6mm',
            famille: 'Vitrage',
            epaisseur: 6,
            prix: 45.00,
            unite: 'm²',
            poids: 15, // kg/m²
            transmission: 0.90,
            description: 'Verre trempé sécurit 6mm'
        },
        
        'VITR8': {
            ref: 'VITR8',
            designation: 'Vitrage simple 8mm',
            famille: 'Vitrage',
            epaisseur: 8,
            prix: 55.00,
            unite: 'm²',
            poids: 20, // kg/m²
            transmission: 0.90,
            description: 'Verre trempé sécurit 8mm'
        },
        
        'VITRDOUBLE': {
            ref: 'VITRDOUBLE',
            designation: 'Double vitrage 4/16/4',
            famille: 'Vitrage',
            epaisseur: 24,
            prix: 85.00,
            unite: 'm²',
            poids: 20, // kg/m²
            transmission: 0.78,
            isolationThermique: 1.1, // Ug W/m².K
            description: 'Double vitrage isolant'
        }
    }
};

/**
 * Gestionnaire de références
 */
const ReferenceManager = {
    
    /**
     * Recherche une référence par code
     * @param {string} ref - Code de référence
     * @returns {Object|null} Référence trouvée ou null
     */
    getReference(ref) {
        // Cherche dans toutes les catégories
        for (const category of Object.values(REFERENCES_DB)) {
            if (category[ref]) {
                return { ...category[ref] }; // Retourne une copie
            }
        }
        return null;
    },
    
    /**
     * Obtient le prix d'une référence selon les options
     * @param {string} ref - Code de référence
     * @param {string} option - Option de prix (couleur, finition, etc.)
     * @returns {number|null} Prix ou null si non trouvé
     */
    getPrice(ref, option = null) {
        const reference = this.getReference(ref);
        if (!reference) return null;
        
        // Si le prix est un objet avec options
        if (typeof reference.prix === 'object') {
            return reference.prix[option] || Object.values(reference.prix)[0];
        }
        
        // Si le prix est direct
        return reference.prix;
    },
    
    /**
     * Recherche par famille de produits
     * @param {string} famille - Nom de la famille
     * @returns {Array} Liste des références de cette famille
     */
    getByFamily(famille) {
        const results = [];
        
        for (const category of Object.values(REFERENCES_DB)) {
            for (const ref of Object.values(category)) {
                if (ref.famille === famille) {
                    results.push({ ...ref });
                }
            }
        }
        
        return results;
    },
    
    /**
     * Obtient toutes les références d'une catégorie
     * @param {string} category - Nom de la catégorie (profiles, accessories, glass)
     * @returns {Object} Toutes les références de la catégorie
     */
    getCategory(category) {
        return REFERENCES_DB[category] ? { ...REFERENCES_DB[category] } : {};
    },
    
    /**
     * Vérifie si une référence existe
     * @param {string} ref - Code de référence
     * @returns {boolean} True si la référence existe
     */
    exists(ref) {
        return this.getReference(ref) !== null;
    },
    
    /**
     * Calcule le poids total d'une liste de références
     * @param {Array} items - Liste d'items avec {ref, quantite, longueur}
     * @returns {number} Poids total en kg
     */
    calculateTotalWeight(items) {
        let totalWeight = 0;
        
        items.forEach(item => {
            const reference = this.getReference(item.ref);
            if (reference && reference.poids) {
                const weight = reference.poids * item.quantite;
                if (reference.unite === 'ml' && item.longueur) {
                    totalWeight += weight * (item.longueur / 1000); // Conversion mm -> m
                } else {
                    totalWeight += weight;
                }
            }
        });
        
        return Math.round(totalWeight * 100) / 100; // Arrondi à 2 décimales
    },
    
    /**
     * Obtient les options disponibles pour une référence
     * @param {string} ref - Code de référence
     * @returns {Array} Liste des options disponibles
     */
    getAvailableOptions(ref) {
        const reference = this.getReference(ref);
        if (!reference) return [];
        
        if (typeof reference.prix === 'object') {
            return Object.keys(reference.prix);
        }
        
        return []; // Pas d'options
    },
    
    /**
     * Valide qu'une référence peut être utilisée avec les paramètres donnés
     * @param {string} ref - Code de référence
     * @param {number} longueur - Longueur demandée (pour les profilés)
     * @returns {Object} Résultat de validation
     */
    validateUsage(ref, longueur = null) {
        const reference = this.getReference(ref);
        if (!reference) {
            return { valid: false, message: 'Référence non trouvée' };
        }
        
        // Vérification de la longueur maximale
        if (longueur && reference.longueurMax && longueur > reference.longueurMax) {
            return {
                valid: false,
                message: `Longueur ${longueur}mm dépasse le maximum autorisé (${reference.longueurMax}mm)`
            };
        }
        
        return { valid: true, message: 'OK' };
    },
    
    /**
     * Recherche des références par mot-clé
     * @param {string} keyword - Mot-clé à rechercher
     * @returns {Array} Liste des références correspondantes
     */
    search(keyword) {
        const results = [];
        const searchTerm = keyword.toLowerCase();
        
        for (const category of Object.values(REFERENCES_DB)) {
            for (const ref of Object.values(category)) {
                if (
                    ref.ref.toLowerCase().includes(searchTerm) ||
                    ref.designation.toLowerCase().includes(searchTerm) ||
                    ref.description.toLowerCase().includes(searchTerm)
                ) {
                    results.push({ ...ref });
                }
            }
        }
        
        return results;
    }
};

/**
 * Utilitaires pour les calculs de prix
 */
const PriceUtils = {
    
    /**
     * Calcule le prix total d'une liste d'items
     * @param {Array} items - Liste d'items avec quantités et références
     * @param {Object} options - Options de prix (couleurs, finitions)
     * @returns {Object} Détail des prix
     */
    calculateTotal(items, options = {}) {
        let totalHT = 0;
        let totalWeight = 0;
        const details = [];
        
        items.forEach(item => {
            const reference = ReferenceManager.getReference(item.ref);
            if (!reference) return;
            
            const option = options[item.ref] || 'noir'; // Option par défaut
            const prixUnitaire = ReferenceManager.getPrice(item.ref, option);
            
            if (prixUnitaire) {
                let totalItem = 0;
                
                if (reference.unite === 'ml' && item.longueur) {
                    // Prix au mètre linéaire
                    totalItem = (item.longueur / 1000) * item.quantite * prixUnitaire;
                } else if (reference.unite === 'm²' && item.surface) {
                    // Prix au m²
                    totalItem = item.surface * prixUnitaire;
                } else {
                    // Prix à la pièce
                    totalItem = item.quantite * prixUnitaire;
                }
                
                totalHT += totalItem;
                
                // Calcul du poids si disponible
                if (reference.poids) {
                    if (reference.unite === 'ml' && item.longueur) {
                        totalWeight += reference.poids * (item.longueur / 1000) * item.quantite;
                    } else {
                        totalWeight += reference.poids * item.quantite;
                    }
                }
                
                details.push({
                    ...item,
                    designation: reference.designation,
                    prixUnitaire: prixUnitaire,
                    totalItem: Math.round(totalItem * 100) / 100
                });
            }
        });
        
        const tva = totalHT * 0.20; // TVA 20%
        const totalTTC = totalHT + tva;
        
        return {
            details: details,
            totalHT: Math.round(totalHT * 100) / 100,
            tva: Math.round(tva * 100) / 100,
            totalTTC: Math.round(totalTTC * 100) / 100,
            totalWeight: Math.round(totalWeight * 100) / 100
        };
    },
    
    /**
     * Applique une remise selon les quantités
     * @param {number} total - Total avant remise
     * @param {number} quantity - Quantité totale
     * @returns {Object} Total avec remise appliquée
     */
    applyQuantityDiscount(total, quantity) {
        let discountRate = 0;
        
        if (quantity >= 100) {
            discountRate = 0.15; // 15% de remise
        } else if (quantity >= 50) {
            discountRate = 0.10; // 10% de remise
        } else if (quantity >= 25) {
            discountRate = 0.05; // 5% de remise
        }
        
        const discount = total * discountRate;
        const finalTotal = total - discount;
        
        return {
            originalTotal: total,
            discountRate: discountRate,
            discount: Math.round(discount * 100) / 100,
            finalTotal: Math.round(finalTotal * 100) / 100
        };
    }
};

/**
 * Configuration des couleurs et finitions
 */
const FINITIONS = {
    couleurs: {
        'noir': {
            nom: 'Laqué noir RAL 9005 granité',
            ral: 'RAL 9005',
            finition: 'Granité',
            supplement: 0
        },
        'gris': {
            nom: 'Laqué gris RAL 7016 granité',
            ral: 'RAL 7016',
            finition: 'Granité',
            supplement: 0
        },
        'blanc': {
            nom: 'Laqué blanc RAL 9003 granité',
            ral: 'RAL 9003',
            finition: 'Granité',
            supplement: 4 // Supplément en %
        }
    },
    
    joints: {
        'noir': 'Noir',
        'transp': 'Transparent',
        'blanc': 'Blanc'
    },
    
    bequilles: {
        'noir': 'Noir',
        'inox': 'Inoxydable'
    }
};

// Export pour utilisation en mode debug
if (typeof window !== 'undefined' && window.VerriereApp) {
    window.VerriereApp.REFERENCES_DB = REFERENCES_DB;
    window.VerriereApp.ReferenceManager = ReferenceManager;
    window.VerriereApp.PriceUtils = PriceUtils;
    window.VerriereApp.FINITIONS = FINITIONS;
}