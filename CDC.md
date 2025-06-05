# Cahier des charges - Configurateur Verrière V40

> **Version** : 2.0  
> **Date** : Juin 2025  
> **Statut** : Spécifications optimisées pour développement

---

## 📋 1. Présentation du projet

### 🎯 Contexte

Application web de configuration interactive pour verrières industrielles modèle V40, permettant la personnalisation complète et la génération automatique des nomenclatures de fabrication.

### 🚀 Objectifs

- **Principal** : Configurateur temps réel avec prévisualisation SVG dynamique
- **Secondaire** : Génération automatique des débits et nomenclatures

### 👥 Utilisateurs cibles

- **Commerciaux** → Création de devis clients
- **Bureau d'études** → Validation technique des configurations
- **Atelier** → Consultation des nomenclatures de fabrication
- **Clients** → Visualisation et personnalisation

---

## ⚙️ 2. Spécifications fonctionnelles

### 📐 2.1 Configuration des dimensions principales

#### Dimensions de la verrière

- **Largeur** : 400 à 5000 mm (pas de 1 mm)
- **Hauteur** : 400 à 5000 mm (pas de 1 mm)
- **Affichage** : Cotation automatique sur rendu SVG

#### Types de verrière

- **Verrière pleine** : Structure complète sans ouverture
- **Verrière avec porte** : Intégration d'une porte ouvrante

> **Règle métier** : Le type détermine l'affichage conditionnel des options

### 🚪 2.2 Configuration de la porte

#### Paramètres de base

| Paramètre            | Plage                   | Contraintes            |
| -------------------- | ----------------------- | ---------------------- |
| **Largeur porte**    | 400 à 1230 mm           | Pas de 1 mm            |
| **Hauteur porte**    | 500 à 4000 mm           | Dépendante des options |
| **Sens d'ouverture** | Poussant droit / gauche | Sélection unique       |
| **Emplacement**      | Module 1 à N            | Selon répartition      |

#### Options constructives

**Porte avec tierce**

- Choix : Oui/Non
- Si Oui : Largeur tierce 300 à 1230 mm

**Porte avec imposte**

- Choix : Oui/Non
- Si Oui : Hauteur imposte calculée (min. 250 mm)
- Hauteur porte devient modifiable

**Porte avec dormant haut**

- Choix : Oui/Non (masqué si imposte = Oui)
- Impact sur calcul hauteur porte: -51 mm

#### Calcul automatique hauteur porte

```javascript
// Sans imposte : hauteur calculée et verrouillée
hauteurPorte = hauteurTotale - 15 - (dormantHaut ? 51 : 0);

// Avec imposte : hauteur modifiable
hauteurMaxPorte = hauteurTotale - 40 - 250 - 51 - 15;
```

#### Quincaillerie et finitions

**Charnières**

- Visible : +10 mm largeur ouverture
- Invisible : +6 mm largeur ouverture

**Serrures**

- `SERROULM` : Rouleau seul
- `SERROULPENM` : Rouleau + Pêne + 1/2 cylindre
- `SERPEN35M` : Pêne demi-tour + Pêne dormant

**Profils et finitions**

- Profil porte : PO66 / PO6622U
- Couleur béquille : Noir / Inox
- Couleur joint vitrage : Noir / Transparent / Blanc

### 🔧 2.3 Configuration des modules

#### Répartition modulaire

- **Largeur par module** : 200 à 2000 mm
- **Nombre de modules** : Calculé selon largeur totale
- **Contrainte** : `largeurTotale = Σ(modules) + profilés`
- **Profilés** : `(nbModules + 1) × 40 + (hasPorte ? 22 : 0)` mm

#### Gestion dynamique

- **Calcul initial** : Répartition équitable automatique
- **Modification manuelle** : Ajustement libre sauf le dernier module libre, peux importe sont emplacement, qui est imposé
- **Module porte** : Largeur imposée par la porte
- **Bouton reset** : Retour à la répartition équitable

### ↔️ 2.4 Configuration des traverses

#### Traverses principales (verrière)

**Paramètres**

- **Position** : Hauteur depuis le bas (mm)
- **Contraintes** : Entre 240 mm et `hauteur - 240` mm
- **Modules concernés** : Sélection par cases à cocher

**Interface**

- Formulaire dynamique d'ajout
- Liste des traverses existantes
- Suppression individuelle
- Validation anti-doublon

#### Traverses sur porte

**Paramètres**

- **Position** : Hauteur depuis le bas (mm)
- **Type** : 28 mm / 37 mm
- **Sur tierce** : Case à cocher (si applicable)

**Contraintes**

- Hauteur entre 200 mm et `hauteurPorte - 240` mm
- Pas de superposition

### 🎨 2.5 Options de finition

#### Couleurs structure

- **Laqué noir** RAL 9005 granité
- **Laqué gris** RAL 7016 granité
- **Laqué blanc** RAL 9003 granité

#### Remplissage

- **Épaisseur** : 6 mm / 8 mm
- **Couleur joints** : Noir / Transparent / Blanc

---

## 💻 3. Spécifications techniques

### 🖼️ 3.1 Interface utilisateur

#### Layout principal

```
┌─────────────────────────────────────────────────────────────┐
│                 Configurateur Verrière V40                  │
├─────────────────────────────────────┬───────────────────────┤
│                                     │                       │
│        Prévisualisation SVG         │    Formulaires        │
│           (900×550px)               │   de configuration    │
│      • Structure à l'échelle        │                       │
│      • Cotations dynamiques         │                       │
│      • Couleurs réelles             │   • Dimensions        │
│                                     │   • Type & options    │
│                                     │   • Modules           │
│                                     │   • Traverses         │
│                                     │   • Finitions         │
├─────────────────────────────────────┴───────────────────────┤
│                    Tableaux récapitulatifs                  │
│           Profilés  |  Accessoires  |  Remplissage          │
│                                                             │
│  [Export PDF]  [Export XML]          Total: XXX,XX €        │
└─────────────────────────────────────────────────────────────┘
```

#### Formulaires dynamiques

**Validation temps réel**

- Attributs HTML `min`/`max` sur tous les champs numériques
- Messages d'erreur contextuels sous chaque champ
- Désactivation des boutons si configuration invalide

**Affichage conditionnel**

- Sections masquées/affichées selon les choix
- Génération dynamique des listes (modules, emplacements)
- Verrouillage des champs calculés (fond grisé)

**Champs calculés automatiquement**

- Hauteur porte (selon dormant/imposte)
- Largeur module restante
- Dimensions d'ouverture
- Largeur disponible pour modules

### 🎯 3.2 Prévisualisation SVG

#### Système de coordonnées

```javascript
// Échelle automatique pour zone 900×550px
const scale = Math.min(
  (900 - 100) / largeurVerriere,
  (550 - 100) / hauteurVerriere
);

// Origine : coin bas-gauche
const origin = { x: 50, y: 500 };
```

#### Éléments graphiques

- **Structure** : Profilés avec épaisseurs réelles
- **Modules** : Divisions avec cotations
- **Traverses** : Positionnement précis
- **Porte** : Zone différenciée + poignée directionnelle
- **Couleurs** : Respect des choix utilisateur

#### Cotations

- Largeur totale et hauteur
- Largeur de chaque module
- Position des traverses
- Dimensions porte et tierce

### ⚡ 3.3 Architecture logicielle

#### Structure modulaire

À définir
Les codes de gestion de l'ui et de config et de calculs risquent d'être très fournis
Exemple :

```javascript
src/
├── js/
│   ├── main.js           // Initialisation et orchestration
│   ├── config.js         // Gestion configuration centrale
│   ├── events.js         // Système d'événements (Observer)
│   ├── ui.js             // Interface utilisateur dynamique
│   ├── calculations.js   // Calculs métier et débits
│   ├── renderer.js       // Rendu SVG
│   ├── references.js     // Base de données produits
│   ├── export.js         // Export PDF/XML
│   └── utils.js          // Utilitaires et helpers
├── css/
│   └── style.css
└── index.html
```

#### Flux de données

```
Input utilisateur → Config → Validation → Calculs → UI + SVG
                      ↓
                 Configuration centrale (source unique de vérité)
```

#### Gestion d'état

- **Configuration centrale** : Objet unique dans `configManager`
- **Événements** : Communication inter-modules via `EventBus`
- **Pas de persistance** : Configuration perdue au rechargement
- **Debug** : Console de configuration en mode développement

```javascript
const configExample = {
  width: 4000,
  height: 2500,
  type: "pleine",
  modulesCount: 4,
  porteIndex: 3,
  modules: [
    { width: 950, type: "fixe" },
    { width: 950, type: "fixe" },
    { width: 950, type: "fixe" },
    { width: 950, type: "fixe" },
  ],
  traverses: [{ id: traverseId, height: height, modules: selectedModules }],
  porte: {
    withTierce: false,
    withImposte: false,
    withDormant: false,
    charniereType: "visible",
    porteWidth: 730,
    tierceWidth: 350,
    porteHeight: 2200,
    sensOuverture: "droit",
    serrure: "SERROULM",
    profile: "po66",
    colorBequille: "noir",
    colorPvitrage: "noir",
    traverseType: "28",
  },
  traversesPorte: [
    {
      id: traverseId,
      height: height,
      type: traverseType,
      onTierce: onTierce,
    },
  ],
  options: {
    colorProfile: "noir",
    remplissageEp: 6,
    colorJoint: "noir",
  },
};
```

### 🧮 3.4 Calculs métier

#### Dimensions d'ouverture

```javascript
function calculateOuverture(config) {
  // Hauteur
  const hauteur = config.porte?.withImposte
    ? config.porte.porteHeight + 15 + 51
    : config.height;

  // Largeur
  const base = config.porte.porteWidth + 102;
  const charniere = config.porte.charniereType === "invisible" ? 6 : 10;
  const tierce = config.porte.withTierce ? config.porte.tierceWidth + 5 : 0;

  const largeur = base + charniere + tierce;

  return { hauteur, largeur };
}
```

#### Règles d'arrondi

- **Dimensions générales** : Arrondi au mm
- **Calculs de débits** : Arrondi au 0,1 mm si nécessaire
- **Surfaces vitrage** : Arrondi 0,1 mm si nécessaire (largeur x hauteur)
- **Prix** : Arrondi au centime

#### Débits profilés

Suivant la configuration
Une même référence peut avoir des quantité et longueurs différentes (à afficher sur différents lignes du tableau)

### 🗄️ 3.5 Base de données statique

#### Structure des références

Exemple :

```javascript
const REFERENCES_DB = {
  profiles: {
    MT40: {
      ref: "MT40",
      description: "Montant 40mm",
      price: 15.5,
      unit: "ml",
      category: "structure",
    },
    TR28: {
      ref: "TR28",
      description: "Traverse 28mm",
      price: 12.3,
      unit: "ml",
      category: "traverse",
    },
    // ... autres profils
  },

  accessories: {
    CHARN_VIS: {
      ref: "CHARN_VIS",
      description: "Charnière visible",
      price: 25.0,
      unit: "pcs",
      category: "quincaillerie",
    },
    // ... autres accessoires
  },

  glass: {
    VITR6: {
      ref: "VITR6",
      description: "Vitrage 6mm transparent",
      price: 45.0,
      unit: "m²",
      category: "remplissage",
    },
    // ... autres vitrages
  },
};
```

---

## 📊 4. Tableaux et exports

### 📝 4.1 Tableaux récapitulatifs

#### Table Profilés

| Référence | Désignation   | Finition | Longueur | Qté | Prix unit. | Total    |
| --------- | ------------- | -------- | -------- | --- | ---------- | -------- |
| MT40      | Montant 40mm  | RAL 9005 | 2500 mm  | 5   | 15,50 €/ml | 193,75 € |
| TR28      | Traverse 28mm | RAL 9005 | 1200 mm  | 3   | 12,30 €/ml | 44,28 €  |

#### Table Accessoires

| Référence | Désignation       | Qté | Longueur | Finition | Prix unit. | Total   |
| --------- | ----------------- | --- | -------- | -------- | ---------- | ------- |
| CHARN_VIS | Charnière visible | 3   | 3 ml     | Inox     | 25,00 €    | 75,00 € |
| SERPEN35M | Serrure pêne      | 1   | 0        | Standard | 45,00 €    | 45,00 € |

#### Table Remplissage

| Référence | Désignation | Épaisseur | Dimensions  | Surface | Prix unit. | Total   |
| --------- | ----------- | --------- | ----------- | ------- | ---------- | ------- |
| VITR6     | Vitrage 6mm | 6 mm      | 1180×780 mm | 0,92 m² | 45,00 €/m² | 41,40 € |

### 📤 4.2 Système d'export

#### Export PDF

- **Contenu** : Configuration + tableaux complets
- **Format** : A4, mise en page professionnelle
- **Sections** :
  - Résumé configuration (dimensions, options)
  - Visualisation de la verrière
  - Tableaux de débits détaillés
  - Total général

#### Export XML

- **Structure** : Format standardisé pour import ERP
- **Contenu** : Données techniques uniquement
- **Exemple** :

```xml
<verriere>
  <config>
    <dimensions largeur="3000" hauteur="2500" />
    <type>porte</type>
  </config>
  <debits>
    <profil ref="MT40" qte="5" longueur="2500" />
    <accessoire ref="CHARN_VIS" qte="3" />
  </debits>
</verriere>
```

---

## ⚡ 5. Performance et qualité

### 🎯 5.1 Objectifs de performance

- **Mise à jour config** : < 50 ms
- **Rendu SVG** : < 100 ms
- **Calcul débits** : < 30 ms
- **Export PDF/XML** : < 500 ms

### 🌐 5.2 Compatibilité

- **Navigateurs** : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Résolutions** : 1024×768 minimum, responsive jusqu'à 2560×1440
- **JavaScript** : ES6+ (pas de transpilation)

### 🛡️ 5.3 Robustesse

- **Gestion d'erreurs** : Try/catch sur tous les calculs
- **Validation** : Contrôles avant chaque calcul
- **Fallback** : Configuration par défaut si données corrompues
- **Messages** : Erreurs explicites avec suggestions de correction

### ♿ 5.4 Accessibilité

- **Labels** : Tous les champs avec labels explicites
- **Contrastes** : Respect WCAG 2.1 niveau AA
- **Navigation** : Support clavier complet
- **ARIA** : Attributs pour lecteurs d'écran

---

## 🧪 6. Tests et validation

### ✅ 6.1 Scénarios de test fonctionnels

#### Configuration de base

- [ ] Verrière simple 2000×2500 mm, 3 modules
- [ ] Modification dimensions temps réel
- [ ] Ajout/suppression traverses
- [ ] Changement couleurs et finitions

#### Configuration avec porte

- [ ] Porte standard 800×2200 mm
- [ ] Porte + tierce 300 mm
- [ ] Porte + imposte (hauteur modifiable)
- [ ] Porte + tierce + imposte
- [ ] Traverses sur porte et tierce

#### Cas limites

- [ ] Configuration minimale (400×400 mm)
- [ ] Configuration maximale (5000×5000 mm)
- [ ] 10+ traverses sur verrière complexe
- [ ] Tous types de quincaillerie

### 🔧 6.2 Tests techniques

- [ ] Validation contraintes dimensionnelles
- [ ] Précision calculs débits (±0,1 mm)
- [ ] Rendu SVG toutes configurations
- [ ] Export PDF/XML format correct
- [ ] Gestion erreurs et récupération

### 📱 6.3 Tests d'intégration

- [ ] Cohérence données modules
- [ ] Synchronisation UI ↔ Config ↔ SVG
- [ ] Responsive design 1024px → 2560px
- [ ] Performance configurations complexes

---

## 🚀 7. Plan de développement

### 📋 7.1 Phase 1 : Fondations (Semaines 1-2)

**Objectif** : Interface basique fonctionnelle

- [ ] Structure HTML/CSS responsive
- [ ] Architecture modulaire (config, events, ui)
- [ ] Configuration verrière simple (dimensions + modules)
- [ ] Rendu SVG basique avec cotations
- [ ] Formulaires dynamiques (validation temps réel)

**Livrables** : Configurateur de verrière pleine opérationnel

### ⚙️ 7.2 Phase 2 : Fonctionnalités avancées (Semaines 3-4)

**Objectif** : Configuration complète

- [ ] Ajout configuration porte (toutes options)
- [ ] Système de traverses (verrière + porte)
- [ ] Calculs débits et nomenclatures
- [ ] Tableaux récapitulatifs dynamiques
- [ ] Base de données références complète

**Livrables** : Configurateur complet avec tous calculs

### 🎨 7.3 Phase 3 : Finitions et exports (Semaine 5)

**Objectif** : Application finalisée

- [ ] Système d'export PDF/XML
- [ ] Optimisations performance
- [ ] Tests complets et débogage
- [ ] Documentation utilisateur
- [ ] Interface mobile (responsive)

**Livrables** : Application prête pour production

### 🔍 7.4 Outils de développement

#### Debug et développement

- Console de configuration (mode dev)
- Logs détaillés des calculs
- Visualisation état config en temps réel
- Tests unitaires pour calculs critiques

#### Structure recommandée

```javascript
// Mode développement
const DEV_MODE = true;

if (DEV_MODE) {
  window.debugConfig = () => console.table(currentConfig);
  window.exportConfig = () => JSON.stringify(currentConfig, null, 2);
}
```

---

## 📚 8. Ressources et documentation

### 📖 8.1 Documentation technique

- **API interne** : JSDoc sur toutes les fonctions
- **Architecture** : Diagrammes et flux de données
- **Calculs** : Formules et règles métier documentées
- **Base de données** : Structure et références complètes

### 👤 8.2 Guide utilisateur

- **Prise en main** : Tutorial étape par étape
- **Fonctionnalités** : Guide de chaque section
- **Cas d'usage** : Exemples de configurations types
- **FAQ** : Questions fréquentes et solutions

### 🛠️ 8.3 Guide installation

- **Prérequis** : Navigateur et serveur local
- **Déploiement** : Instructions de mise en ligne
- **Configuration** : Paramètres et personnalisation
- **Maintenance** : Mise à jour base de données

---

## 🔮 9. Évolutions futures

### 🚀 9.1 Fonctionnalités envisagées

#### Court terme

- **Verrière d'angle** : Configuration L avec panneau frontal + latéral
- **Templates** : Configurations prédéfinies sauvegardables
- **Comparateur** : Comparaison de plusieurs configurations

#### Moyen terme

- **Mode administrateur** : Gestion prix et références
- **API REST** : Intégration avec ERP externe
- **Mobile native** : Application dédiée tablette/smartphone

#### Long terme

- **3D** : Visualisation tridimensionnelle
- **AR** : Réalité augmentée pour intégration site
- **IA** : Suggestions automatiques de configuration

### 🔧 9.2 Optimisations techniques

- **Performance** : Web Workers pour calculs lourds
- **Cache** : Mise en cache des rendus SVG
- **PWA** : Application web progressive (offline)
- **WebAssembly** : Calculs critiques optimisés

---

## ⚠️ 10. Contraintes et limites

### 🔒 10.1 Contraintes techniques

- **JavaScript pur** : Pas de frameworks (apprentissage)
- **Client seul** : Aucun serveur requis
- **Navigateur moderne** : Support ES6+ obligatoire
- **Base statique** : Pas de modification des références

### 🎯 10.2 Limites fonctionnelles

- **Formes standard** : Pas de verrières spéciales/courbes
- **Prix indicatifs** : Pas de gestion commerciale avancée
- **Validation basique** : Contrôles techniques simplifiés
- **Configuration unique** : Pas de sauvegarde multiple

### 🔍 10.3 Hypothèses projet

- **Utilisateur formé** : Connaissance métier verrière
- **Données fiables** : Base références correcte et complète
- **Usage interne** : Pas d'authentification requise
- **Maintenance légère** : Mise à jour occasionnelle des prix

---

## ✅ 11. Critères de succès

### 🎯 11.1 Fonctionnels

- [ ] **Configuration complète** : Toutes options verrière V40 disponibles
- [ ] **Prévisualisation fidèle** : SVG représentatif de la réalité
- [ ] **Calculs précis** : Débits conformes aux attentes métier
- [ ] **Interface intuitive** : Prise en main < 10 minutes

### ⚡ 11.2 Techniques

- [ ] **Performance** : Réactivité < 100ms sur config standard
- [ ] **Fiabilité** : Aucun crash sur utilisation normale
- [ ] **Compatibilité** : Fonctionnel sur navigateurs cibles
- [ ] **Maintenabilité** : Code modulaire et documenté

### 📈 11.3 Pédagogiques

- [ ] **FullStack** : Maîtrise architecture complète application
- [ ] **JavaScript avancé** : Concepts modernes (modules, events, DOM)
- [ ] **Gestion d'état** : Patterns de synchronisation données
- [ ] **UI/UX** : Interface responsive et ergonomique

---

_Ce cahier des charges constitue la référence technique pour le développement du configurateur de verrière V40. Il servira de guide tout au long du projet d'apprentissage du développement FullStack._
