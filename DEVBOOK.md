# Structure du projet Configurateur V40

```
configurateur-v40/
├── index.html
├── style.css
└── js/
    ├── main.js                 # Point d'entrée et orchestration
    ├── core/
    │   ├── EventBus.js        # Système d'événements
    │   ├── ConfigModel.js     # Modèle de configuration (votre fichier)
    │   └── ValidationRules.js # Rules métier et contraintes
    ├── ui/
    │   ├── UIManager.js       # Gestionnaire UI principal (votre fichier)
    │   ├── FormsManager.js    # Gestion spécifique des formulaires
    │   └── ModalsManager.js   # Modales (ajout traverses, etc.)
    ├── rendering/
    │   ├── SVGRenderer.js     # Rendu SVG principal
    │   ├── CoordinatesHelper.js # Calculs coordonnées et échelle
    │   └── DrawingElements.js # Éléments graphiques (modules, traverses...)
    ├── calculations/
    │   ├── ModulesCalculator.js    # Calculs modules et répartition
    │   ├── PorteCalculator.js      # Calculs spécifiques porte
    │   ├── TraversesCalculator.js  # Calculs traverses
    │   └── DebitsCalculator.js     # Calculs débits et nomenclatures
    ├── data/
    │   ├── References.js      # Base de données produits/prix
    │   └── PricingRules.js    # Règles de tarification
    ├── export/
    │   ├── PDFExporter.js     # Export PDF
    │   ├── XMLExporter.js     # Export XML
    │   └── TableRenderer.js   # Génération tableaux récap
    └── utils/
        ├── MathUtils.js       # Utilitaires mathématiques
        ├── DOMUtils.js        # Helpers DOM
        └── FormatterUtils.js  # Formatage données (prix, dimensions)
```

## Priorités de développement immédiat

### Phase 1A - Fondations (1-2 jours)

**Objectif** : Application fonctionnelle basique

1. **EventBus.js** - Communication entre modules
2. **SVGRenderer.js** - Rendu visuel basique
3. **ModulesCalculator.js** - Calculs modules essentiels
4. **Finaliser UIManager.js** - Interface complète

### Phase 1B - Fonctionnalités core (2-3 jours)

**Objectif** : Configuration complète

5. **PorteCalculator.js** - Logique porte complète
6. **TraversesCalculator.js** - Gestion traverses
7. **DebitsCalculator.js** - Calculs matériaux
8. **References.js** - Base données produits

### Phase 1C - Finition (1-2 jours)

**Objectif** : Version production

9. **TableRenderer.js** - Tableaux récapitulatifs
10. **PDFExporter.js** - Export documents
11. **Optimisations et tests**

## Architecture des données

### État central (ConfigModel)

```javascript
{
  // Dimensions principales
  width: 4000, height: 2500, type: "porte",

  // Modules
  modulesCount: 4, porteIndex: 3,
  modules: [
    { width: 950, type: "fixe" },
    { width: 950, type: "fixe" },
    { width: 950, type: "fixe" },
    { width: 800, type: "porte" }
  ],

  // Configuration porte
  porte: {
    withTierce: false, withImposte: false, withDormant: false,
    porteWidth: 730, tierceWidth: 350, porteHeight: 2200,
    charniereType: "visible", sensOuverture: "droit",
    serrure: "SERROULM", profile: "po66",
    colorBequille: "noir", colorPvitrage: "noir"
  },

  // Traverses
  traverses: [
    { id: 1, height: 1200, modules: [1,2,3,4] }
  ],
  traversesPorte: [
    { id: 2, height: 800, type: "28", onTierce: false }
  ],

  // Options finition
  options: {
    colorProfile: "noir", remplissageEp: 6, colorJoint: "noir"
  }
}
```

### Flux de données

```
Input UI → ConfigModel.validate() → EventBus → [UIManager, SVGRenderer, Calculator] → Update
```

## Points d'attention pour la version entreprise

### Performance

- **Calculs différés** : Debounce sur les inputs (300ms)
- **Rendu optimisé** : Pas de re-rendu complet à chaque changement
- **Validation progressive** : Validation à la saisie, calculs à la validation

### Robustesse

- **Gestion d'erreurs** : Try/catch sur tous les calculs critiques
- **Valeurs par défaut** : Fallback sur toutes les propriétés
- **Validation stricte** : Contrôles métier avant chaque calcul

### Maintenabilité

- **Code modulaire** : Chaque fichier = responsabilité unique
- **Documentation** : JSDoc sur toutes les fonctions publiques
- **Tests unitaires** : Au moins sur les calculs critiques

## Prochaine étape

Je propose de commencer par créer l'**EventBus** et finaliser votre **ConfigModel**, puis d'enchaîner sur le **SVGRenderer** basique.

Voulez-vous que je commence par l'EventBus ou préférez-vous qu'on optimise d'abord votre ConfigModel existant ?
