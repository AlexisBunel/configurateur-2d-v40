# Cahier des charges - Configurateur Verrière V40

## 1. Présentation du projet

### 1.1 Contexte

Application web de configuration interactive pour verrières industrielles modèle V40, permettant la personnalisation complète et la génération automatique des nomenclatures de fabrication.

### 1.2 Objectifs

- **Objectif principal** : Configurateur en temps réel avec prévisualisation SVG
- **Objectif secondaire** : Génération automatique des débits et nomenclatures
- **Objectif technique** : Apprentissage du développement FullStack via un projet concret

### 1.3 Utilisateurs cibles

- Commerciaux pour devis clients
- Bureau d'études pour validation technique
- Atelier de fabrication pour nomenclatures
- Clients finaux pour visualisation

---

## 2. Spécifications fonctionnelles

### 2.1 Configuration des dimensions principales

#### 2.1.1 Dimensions de la verrière

- **Largeur** : 400mm à 5000mm (par pas de 1mm)
- **Hauteur** : 400mm à 5000mm (par pas de 1mm)
- **Validation** : Contrôle des ratios largeur/hauteur acceptables
- **Affichage** : Cotation automatique sur le rendu SVG

#### 2.1.2 Type de verrière

- **Verrière pleine** : Structure complète sans ouverture
- **Verrière avec porte** : Intégration d'une porte ouvrante

**Règles métier** :

- Le type détermine l'affichage des options disponibles
- Masquage automatique des sections non applicables

### 2.2 Configuration de la porte

#### 2.2.1 Paramètres de base

- **Largeur porte** : 400mm à 1230mm
- **Hauteur porte** : 500mm à 4000mm
- **Sens d'ouverture** : Poussant droit / Poussant gauche
- **Emplacement** : Position dans la séquence des modules

#### 2.2.2 Options constructives

- **Porte avec tierce** : Oui/Non
  - Si oui : largeur tierce 300mm à 1230mm
- **Porte avec imposte** : Oui/Non
  - Si oui : calcul automatique hauteur imposte (hauteur mini : 250mm)
- **Porte avec dormant haut** : Oui/Non
  - Influence le calcul des profils

#### 2.2.3 Quincaillerie

- **Type de charnières** :
  - Visible : charnières apparentes
  - Invisible : charnières intégrées
- **Serrure** :
  - SERROULM : Rouleau seul
  - SERROULPENM : Rouleau + Pêne + 1/2 cylindre
  - SERPEN35M : Pêne demi-tour + Pêne dormant
- **Profil porte** :
  - PO66 : Profil standard
  - PO6622U : Profil usiné
- **Couleur béquille** : Noir / Inox
- **Couleur joint vitrage** : Noir / Transparent

### 2.3 Configuration des modules

#### 2.3.1 Répartition modulaire

- **Largeur par module** : Saisie individuelle avec contraintes
- **Nombre de modules** : Défini par la largeur de la verrière et des valeurs min/max des largeurs de modules
- **Calcul automatique** : Largeur totale = somme des modules + profilés
- **Validation** : Contrôle cohérence largeur totale

#### 2.3.2 Contraintes techniques

- **Largeur minimum par module** : 200mm
- **Largeur maximum par module** : 2000mm
- **Répartition équitable** : Bouton de réinitialisation automatique
- **Emplacement porte** : Sélection du module contenant la porte

### 2.4 Configuration des traverses

#### 2.4.1 Traverses principales (verrière)

- **Ajout/suppression** : Interface dynamique
- **Position** : Hauteur en mm depuis le bas
- **Type de profil** : TI28 / TI37
- **Validation** : Pas de superposition, positions cohérentes

#### 2.4.2 Traverses sur porte

- **Système indépendant** : Gestion séparée des traverses porte
- **Type spécifique** : Profils adaptés aux portes (28mm / 37mm)
- **Application tierce** : Traverses optionnelles sur la tierce

### 2.5 Options de finition

#### 2.5.1 Couleurs et finitions

- **Couleur structure** :
  - Laqué noir RAL 9005 granité
  - Laqué gris RAL 7016 granité
  - Laqué blanc RAL 9003 granité
- **Couleur joints** : Noir / Transparent / Blanc
- **Épaisseur remplissage** : 6mm / 8mm

#### 2.5.2 Répercussion sur les calculs

- La couleur impacte les références de commande

---

## 3. Spécifications techniques

### 3.1 Interface utilisateur

#### 3.1.1 Layout général

```
┌─────────────────────────────────────────────────────────┐
│               Configuration verrière V40                │
├─────────────────────────────────────┬───────────────────┤
│                                     │                   │
│   Prévisualisation SVG              │   Formulaires     │
│   (900x550px)                       │   de config       │
│                                     │   (500px)         │
│                                     │                   │
├─────────────────────────────────────┴───────────────────┤
│                 Tableaux récapitulatifs                 │
│            (Profils | Accessoires | Remplissage)        │
└─────────────────────────────────────────────────────────┘
```

#### 3.1.2 Formulaires

- **Organisation** : Formulaires séparés par thématique
- **Affichage conditionnel** : Masquage selon le contexte
- **Validation temps réel** : Feedback immédiat
- **Ergonomie** : Labels clairs, unités affichées

#### 3.1.3 Prévisualisation SVG

- **Dimensions** : 900x550px, responsive
- **Contenu** :
  - Structure de la verrière à l'échelle
  - Modules avec leurs dimensions
  - Traverses positionnées
  - Porte avec sens d'ouverture
  - Cotation principale
- **Interactivité** : Mise à jour temps réel
- **Couleurs** : Respect des choix utilisateur

### 3.2 Architecture logicielle

#### 3.2.1 Modules et responsabilités

```javascript
events.js; // Gestionnaire d'événements (pattern Observer)
config.js; // Gestion configuration et validation
calculations.js; // Calculs métier (débits, dimensions)
ui.js; // Interface utilisateur dynamique
renderer.js; // Rendu SVG
references.js; // Base de données produits
main.js; // Initialisation et orchestration
```

#### 3.2.2 Flux de données

```
User Input → Config Update → Validation → Calculations → UI Update
     ↓                                           ↓
Save State                                 SVG Rendering
```

#### 3.2.3 Gestion d'état

- **État central** : Configuration unique dans `configManager`
- **Événements** : Communication inter-modules via événements
- **Persistance** : Sauvegarde automatique localStorage
- **Restauration** : Chargement au démarrage

### 3.3 Calculs métier

#### 3.3.1 Dimensions d'ouverture

À déterminer le moment venu

#### 3.3.2 Débits profilés

À déterminer le moment venu

#### 3.3.3 Accessoires

À déterminer le moment venu

### 3.4 Base de données produits

#### 3.4.1 Structure des références

Exemple :

```javascript
REFERENCES_DB = {
  profiles: {
    MT40: { ref: "MT40", description: "Montant 40", price: 15.5, unit: "ml" },
    TR28: { ref: "TR28", description: "Traverse 28", price: 12.3, unit: "ml" },
  },
  accessories: {
    CHARN001: {
      ref: "CHARN001",
      description: "Charnière visible",
      price: 25.0,
      unit: "pcs",
    },
  },
  glass: {
    VITR6: {
      ref: "VITR6",
      description: "Vitrage 6mm",
      price: 45.0,
      unit: "m²",
    },
  },
};
```

#### 3.4.2 Système de prix

- **Prix unitaires** : Stockés en base
- **Calcul total** : Quantité × Prix unitaire
- **Remises** : Système extensible pour remises quantitatives

---

## 4. Règles métier et contraintes

### 4.1 Messages d'erreur

- **Contextuel** : Message précis selon l'erreur
- **Correctif** : Suggestion de correction
- **Non-bloquant** : Possibilité de forcer certaines valeurs

---

## 5. Spécifications d'affichage

### 5.1 Rendu SVG

#### 5.1.1 Système de coordonnées

```javascript
// Échelle automatique pour adapter à la zone 900x550
scale = Math.min(
  (900 - marges) / largeurVerrière,
  (550 - marges) / hauteurVerrière
);

// Point origine : coin bas-gauche de la verrière
origin = { x: 50, y: 500 };
```

#### 5.1.2 Éléments graphiques

- **Structure principale** : Rectangle ou ligne avec épaisseur profils
- **Modules** : Divisions verticales avec cotation
- **Traverses** : Lignes horizontales positionnées
- **Porte** : Zone différenciée avec indication sens (représentation poignée)
- **Cotations** : Dimensions principales affichées

#### 5.1.3 Conventions graphiques

```css
/* Couleurs standardisées */
```

### 5.2 Tableaux récapitulatifs

#### 5.2.1 Table Profilés

| Référence | Désignation | Finition                    | Longueur | Quantité | Prix unit. | Total   |
| --------- | ----------- | --------------------------- | -------- | -------- | ---------- | ------- |
| MT40      | Montant 40  | Laqué noir RAL 9005 granité | 2500mm   | 5        | 15.50€/ml  | 193.75€ |

#### 5.2.2 Table Accessoires

| Référence | Désignation | Quantité | Finition | Longueur | Prix unit. | Total  |
| --------- | ----------- | -------- | -------- | -------- | ---------- | ------ |
| CHARN001  | Charnière   | 3        | Inox     | 25ml     | 25.00€     | 75.00€ |

#### 5.2.3 Table Remplissage

| Référence | Désignation | Épaissaur | Dimensions     |
| --------- | ----------- | --------- | -------------- |
| VITR6     | Vitrage 6mm | 6mm       | 1200mm x 800mm |

---

## 6. Spécifications de performance

### 6.1 Temps de réponse

- **Mise à jour configuration** : < 100ms
- **Rendu SVG** : < 200ms
- **Calcul débits** : < 50ms
- **Sauvegarde** : < 10ms

### 6.2 Compatibilité

- **Navigateurs** : Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Résolutions** : 1024×768 minimum, responsive jusqu'à 4K
- **Accessibilité** : Conformité WCAG 2.1 niveau AA

### 6.3 Robustesse

- **Gestion d'erreurs** : Pas de crash sur données invalides
- **Récupération** : Fallback configuration par défaut
- **Persistance** : Sauvegarde auto toutes les 30 secondes

---

## 7. Livrables attendus

### 7.1 Code source

- **Structure modulaire** : Fichiers organisés selon architecture
- **Documentation** : Commentaires JSDoc sur toutes les fonctions
- **Tests** : Fonctions de test pour calculs critiques

### 7.2 Interface utilisateur

- **Application fonctionnelle** : Toutes fonctionnalités opérationnelles
- **Design responsive** : Adaptation écrans moyens/grands
- **Ergonomie** : Interface intuitive et fluide

### 7.3 Documentation

- **Guide utilisateur** : Mode d'emploi de l'interface
- **Documentation technique** : Architecture et API
- **Guide installation** : Déploiement de l'application

---

## 8. Évolutions futures possibles

### 8.1 Fonctionnalités avancées

- **Verrière d'angle** : Configuration d'une verrière à 90deg avec un panneau frontal et latéral
- **Export PDF** : Récapitulatif de la configuration avc les tableaux de débits
- **Export XML** : Export des tableau de débits
- **Mode administrateur** : Gestion prix et références

### 8.2 Optimisations

- **Performance** : Optimisation calculs complexes
- **Mobile** : Adaptation interface tactile
- **Offline** : Fonctionnement hors ligne

---

## 9. Contraintes et limites

### 9.1 Contraintes techniques

- **JavaScript pur** : Pas de frameworks lourds
- **Navigateur uniquement** : Application web pure
- **Calculs côté client** : Pas de serveur requis

### 9.2 Limites fonctionnelles

- **Configurations standard** : Pas de formes spéciales
- **Prix indicatifs** : Pas de gestion commerciale complète
- **Validation basique** : Contrôles techniques simplifiés

### 9.3 Hypothèses

- **Navigateur moderne** : Support ES6+
- **Résolution écran** : Minimum 1024px largeur
- **Utilisateur formé** : Connaissance métier verrière

---

## 10. Validation et tests

### 10.1 Tests fonctionnels

- [ ] Configuration complète verrière simple
- [ ] Configuration avec porte standard
- [ ] Configuration avec porte + tierce + imposte
- [ ] Ajout/suppression traverses
- [ ] Modification dimensions temps réel
- [ ] Sauvegarde/restauration configuration

### 10.2 Tests techniques

- [ ] Validation contraintes dimensionnelles
- [ ] Calculs débits précis
- [ ] Rendu SVG correct toutes configurations
- [ ] Performance sur configurations complexes
- [ ] Gestion erreurs et cas limites

### 10.3 Tests d'intégration

- [ ] Cohérence données entre modules
- [ ] Synchronisation interface/calculs/rendu
- [ ] Persistance données navigateur
- [ ] Comportement responsive design

---

**Version** : 1.0  
**Date** : Juin 2025  
**Statut** : Spécifications validées pour développement
