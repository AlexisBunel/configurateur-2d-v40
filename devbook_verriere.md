# DEVBOOK - Configurateur Verrière V40

**Projet d'apprentissage FullStack** | **Débutant en programmation**

js/
├── core/
│ ├── EventBus.js // Système événements centralisé
│ ├── VerriereConfig.js // Modèle de données pur
│ └── ConfigValidator.js // Validation des données
├── services/
│ ├── ConfigService.js // Gestion état + persistance
│ ├── CalculationService.js // Calculs métier purs
│ └── RenderService.js // Rendu SVG
├── managers/
│ ├── FormManager.js // Gestion formulaires
│ ├── TableManager.js // Gestion tableaux
│ └── UIManager.js // Orchestration UI
├── data/
│ ├── References.js // Base données produits
│ └── DefaultConfig.js // Configuration par défaut
└── main.js // Point d'entrée + initialisation

---

## 🎯 Vue d'ensemble du projet

**Objectif** : Créer un configurateur interactif de verrières avec prévisualisation SVG en temps réel
**Technologies** : HTML, CSS, JavaScript (Vanilla)
**Durée estimée** : 4-6 semaines

---

## 📋 PHASE 1 : FONDATIONS (Semaine 1)

### 🔧 Configuration de l'environnement

- [x] Créer la structure de fichiers du projet
- [x] Configurer un serveur local (Live Server VS Code ou équivalent)
- [x] Tester que le HTML/CSS s'affiche correctement
- [x] Créer les fichiers JavaScript vides selon l'architecture

### 📁 Structure des fichiers

```
projet-verriere/
├── index.html (✓ existant)
├── style.css (✓ existant)
├── js/
│   ├── main.js
│   ├── config.js
│   ├── events.js
│   ├── calculations.js
│   ├── ui.js
│   ├── renderer.js
│   └── references.js
└── README.md
```

### 🎨 CSS et mise en page

- [ ] Vérifier que le CSS fonctionne sur différentes tailles d'écran
- [ ] Ajuster les styles si nécessaire
- [ ] Tester l'affichage des formulaires

---

## 📋 PHASE 2 : SYSTÈME DE CONFIGURATION (Semaine 1-2)

### ⚙️ Configuration de base (`config.js`)

- [ ] Créer l'objet de configuration principal

```javascript
const defaultConfig = {
  width: 4000,
  height: 2500,
  type: "pleine",
  // ... autres propriétés
};
```

- [ ] Implémenter la fonction `getConfig()`
- [ ] Implémenter la fonction `updateConfig(key, value)`
- [ ] Implémenter la fonction `resetConfig()`
- [ ] Tester les fonctions de base en console

### 🎪 Gestionnaire d'événements (`events.js`)

- [ ] Créer le système d'événements personnalisés

```javascript
const eventBus = {
  emit: (event, data) => { ... },
  on: (event, callback) => { ... }
};
```

- [ ] Tester l'émission et la réception d'événements
- [ ] Documenter les événements disponibles

### 🔄 Liaison formulaires → configuration (`ui.js`)

- [ ] Récupérer tous les éléments avec `data-config-key`
- [ ] Créer la fonction `bindFormElements()`
- [ ] Implémenter la mise à jour auto de la config depuis les formulaires
- [ ] Tester : modifier un champ → voir la config se mettre à jour
- [ ] Gérer les types de données (number, boolean, string)

**Test milestone 1** : Les formulaires modifient la configuration en temps réel ✅

---

## 📋 PHASE 3 : RENDU SVG BASIQUE (Semaine 2)

### 🖼️ Rendu SVG de base (`renderer.js`)

- [ ] Créer la fonction `clearSVG()`
- [ ] Implémenter le calcul d'échelle automatique

```javascript
function calculateScale(width, height) {
  const maxWidth = 850; // 900 - marges
  const maxHeight = 500; // 550 - marges
  return Math.min(maxWidth / width, maxHeight / height);
}
```

- [ ] Dessiner le rectangle principal de la verrière
- [ ] Ajouter les cotations de largeur et hauteur
- [ ] Tester avec différentes dimensions

### 🎨 Styles SVG

- [ ] Définir les couleurs et styles des éléments
- [ ] Implémenter les différentes couleurs de profils
- [ ] Ajouter les styles pour les cotations

### 🔗 Liaison configuration → rendu

- [ ] Connecter les événements de config au rendu SVG
- [ ] Tester : modifier largeur/hauteur → SVG se met à jour
- [ ] Optimiser les performances (éviter les rendus multiples)

**Test milestone 2** : Rectangle verrière qui se redimensionne en temps réel ✅

---

## 📋 PHASE 4 : GESTION DES TYPES (Semaine 2-3)

### 🚪 Affichage conditionnel

- [ ] Implémenter `showElement()` et `hideElement()`
- [ ] Gérer l'affichage des formulaires selon le type

```javascript
function updateFormVisibility() {
  const isPorte = config.type === "porte";
  toggleElement("#configuration-porte", isPorte);
  toggleElement("#configuration-options-porte", isPorte);
  // ...
}
```

- [ ] Connecter au changement de type de verrière
- [ ] Tester le masquage/affichage des sections

### 🎯 Validation des données

- [ ] Créer les fonctions de validation dans `config.js`

```javascript
function validateDimensions(width, height) { ... }
function validatePorteDimensions(porteWidth, porteHeight) { ... }
```

- [ ] Implémenter la validation en temps réel
- [ ] Afficher les messages d'erreur
- [ ] Empêcher les valeurs invalides

**Test milestone 3** : Formulaires adaptatifs selon le type de verrière ✅

---

## 📋 PHASE 5 : MODULES ET RÉPARTITION (Semaine 3)

### 📐 Calculs de modules (`calculations.js`)

- [ ] Implémenter `calculateModulesCount()`
- [ ] Créer la fonction `distributeWidth(totalWidth, moduleCount)`
- [ ] Gérer les contraintes min/max par module
- [ ] Calculer les largeurs par défaut équitablement

### 🔧 Interface modules (`ui.js`)

- [ ] Générer dynamiquement les champs de largeur des modules

```javascript
function generateModuleInputs(count) {
  const container = document.getElementById("modules-width");
  // Créer les inputs...
}
```

- [ ] Implémenter le bouton "Réinitialiser"
- [ ] Gérer la sélection de l'emplacement de la porte
- [ ] Valider que la somme = largeur totale

### 🖼️ Rendu modules dans SVG

- [ ] Dessiner les séparations entre modules
- [ ] Afficher les cotations de chaque module
- [ ] Mettre en évidence le module avec porte
- [ ] Gérer l'affichage responsive

**Test milestone 4** : Modules configurables avec rendu SVG ✅

---

## 📋 PHASE 6 : CONFIGURATION DE LA PORTE (Semaine 3-4)

### 🚪 Paramètres de porte

- [ ] Gérer les dimensions porte/tierce/imposte
- [ ] Calculer automatiquement les dimensions d'ouverture
- [ ] Implémenter les contraintes (hauteur mini imposte, etc.)
- [ ] Valider que la porte tient dans le module sélectionné

### 🎨 Rendu de la porte

- [ ] Dessiner la porte dans le bon module
- [ ] Afficher le sens d'ouverture (poignée)
- [ ] Gérer l'affichage tierce et imposte
- [ ] Différencier visuellement la zone porte

### ⚙️ Options porte

- [ ] Lier tous les selects d'options porte à la config
- [ ] Implémenter l'affichage conditionnel (tierce, imposte, dormant)
- [ ] Valider les combinaisons d'options

**Test milestone 5** : Porte complètement configurable et visible ✅

---

## 📋 PHASE 7 : TRAVERSES (Semaine 4)

### ➖ Gestion des traverses principales

- [ ] Créer le système d'ajout/suppression de traverses

```javascript
function addTraverse(position, type) { ... }
function removeTraverse(id) { ... }
```

- [ ] Gérer la liste déroulante des traverses existantes
- [ ] Valider les positions (pas de superposition)
- [ ] Limiter les positions selon la hauteur

### ➖ Traverses sur porte

- [ ] Système indépendant pour traverses porte
- [ ] Gérer les types de traverses (28/37)
- [ ] Options traverses sur tierce
- [ ] Interface d'ajout/suppression spécifique

### 🖼️ Rendu traverses SVG

- [ ] Dessiner les traverses principales
- [ ] Dessiner les traverses sur porte
- [ ] Gérer les différents types visuellement
- [ ] Afficher les cotations de position

**Test milestone 6** : Traverses ajoutables/supprimables avec rendu ✅

---

## 📋 PHASE 8 : CALCULS MÉTIER (Semaine 4-5)

### 📊 Base de données références (`references.js`)

- [ ] Créer la structure des données produits

```javascript
const REFERENCES_DB = {
  profiles: { ... },
  accessories: { ... },
  glass: { ... }
};
```

- [ ] Implémenter les fonctions de recherche
- [ ] Gérer les variantes (couleurs, finitions)

### 🧮 Calculs débits (`calculations.js`)

- [ ] Calculer les longueurs de montants
- [ ] Calculer les longueurs de traverses
- [ ] Calculer les surfaces de vitrage
- [ ] Calculer les quantités d'accessoires
- [ ] Gérer les spécificités porte

### 💰 Calculs de prix

- [ ] Implémenter le calcul des totaux
- [ ] Gérer les unités (ml, m², pcs)
- [ ] Calculer les sous-totaux par catégorie

**Test milestone 7** : Calculs précis et cohérents ✅

---

## 📋 PHASE 9 : TABLEAUX RÉCAPITULATIFS (Semaine 5)

### 📋 Génération des tableaux

- [ ] Créer la fonction `generateProfilesTable()`
- [ ] Créer la fonction `generateAccessoriesTable()`
- [ ] Créer la fonction `generateGlassTable()`
- [ ] Formater les données (prix, dimensions)

### 🎨 Mise en forme tableaux

- [ ] Appliquer les styles CSS existants
- [ ] Gérer l'affichage responsive des tableaux
- [ ] Ajouter les totaux par catégorie
- [ ] Implémenter le tri si nécessaire

### 🔄 Mise à jour temps réel

- [ ] Connecter les tableaux aux événements de config
- [ ] Optimiser les performances (pas de recalcul inutile)
- [ ] Tester avec configurations complexes

**Test milestone 8** : Tableaux complets et à jour en temps réel ✅

---

## 📋 PHASE 10 : PERSISTANCE ET FINITIONS (Semaine 5-6)

### 💾 Sauvegarde localStorage (`main.js`)

- [ ] Implémenter `saveConfig()`
- [ ] Implémenter `loadConfig()`
- [ ] Sauvegarde automatique (toutes les 30s)
- [ ] Gestion des erreurs de sauvegarde

### 🏁 Initialisation application

- [ ] Créer la fonction `initApp()`
- [ ] Charger la config sauvegardée au démarrage
- [ ] Initialiser tous les modules dans le bon ordre
- [ ] Gérer les cas d'erreur au démarrage

### 🐛 Debug et optimisation

- [ ] Ajouter des logs de debug (mode développement)
- [ ] Optimiser les performances critiques
- [ ] Tester les cas limites
- [ ] Corriger les bugs identifiés

### ✨ Finitions UX

- [ ] Ajouter des animations CSS subtiles
- [ ] Améliorer les messages de validation
- [ ] Optimiser l'ergonomie mobile
- [ ] Tester l'accessibilité de base

**Test milestone 9** : Application complète et fonctionnelle ✅

---

## 📋 PHASE 11 : TESTS ET DOCUMENTATION (Semaine 6)

### 🧪 Tests fonctionnels

- [ ] Tester toutes les configurations du cahier des charges
- [ ] Vérifier les calculs sur des cas complexes
- [ ] Tester les performances sur configurations lourdes
- [ ] Valider la persistance des données

### 📖 Documentation

- [ ] Documenter toutes les fonctions (JSDoc)
- [ ] Créer un guide utilisateur
- [ ] Documenter l'architecture technique
- [ ] Créer des exemples d'utilisation

### 🚀 Déploiement

- [ ] Tester sur différents navigateurs
- [ ] Optimiser pour la production
- [ ] Préparer le déploiement
- [ ] Créer une checklist de mise en production

**Test milestone 10** : Application prête pour production ✅

---

## 🎉 BONUS - ÉVOLUTIONS FUTURES

### 🔧 Fonctionnalités avancées

- [ ] Export PDF des récapitulatifs
- [ ] Mode administrateur (gestion prix)
- [ ] Verrières d'angle
- [ ] Templates de configuration

### 📱 Améliorations techniques

- [ ] Progressive Web App (PWA)
- [ ] Mode hors ligne
- [ ] Interface mobile optimisée
- [ ] API backend pour synchronisation

---

## 📚 RESSOURCES D'APPRENTISSAGE

### Concepts JavaScript à maîtriser

- [ ] Manipulation du DOM
- [ ] Événements et callbacks
- [ ] Objects et Arrays
- [ ] LocalStorage
- [ ] Modules et organisation du code

### Outils recommandés

- [ ] VS Code avec extensions (Live Server, Prettier)
- [ ] DevTools navigateur pour debug
- [ ] Git pour versioning

### Documentation utile

- [ ] MDN Web Docs (JavaScript, SVG)
- [ ] W3Schools pour exemples pratiques
- [ ] Stack Overflow pour problèmes spécifiques

---

## 🏆 CRITÈRES DE RÉUSSITE

- ✅ Application fonctionnelle selon cahier des charges
- ✅ Code organisé et documenté
- ✅ Interface intuitive et responsive
- ✅ Calculs précis et validation robuste
- ✅ Performance acceptable (<200ms par interaction)
- ✅ Sauvegarde fiable des configurations

---

**Date de début** : \***\*\_\_\_\*\***
**Date de fin prévue** : \***\*\_\_\_\*\***
**Temps investi** : **\_** heures

_Conseil_ : Cochez chaque étape et notez vos difficultés pour tracker votre progression ! 🚀
