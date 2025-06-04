# DEVBOOK.md – Architecture & Refonte du configurateur verrière V40

## 1. Architecture cible

### 1.1. Fichiers principaux

- **core/ConfigModel.js**  
  Modèle de données métier de la configuration, méthodes de modification, validation, synchronisation modules/traverses.  
  _Zéro accès DOM._

- **core/CalculationService.js**  
  Calcul des profils/accessoires/remplissages selon la config.  
  _Prend une config pure, retourne les calculs nécessaires._

- **events/EventBus.js**  
  Gestionnaire d’événements (subscribe, emit).

- **ui/UIManager.js**  
  Gestion du mapping DOM <-> modèle de config (lecture form, MAJ inputs, écoute des changements).

- **ui/SVGRenderer.js**  
  Prend une config, produit le SVG dans le DOM.

- **ui/TablesRenderer.js**  
  Prend les résultats du calcul, met à jour les tableaux HTML.

- **main.js**  
  Bootstrap, initialisation, “glue” entre les modules.

---

### 1.2. Relations/Dépendances

- `main.js` crée l’`EventBus`, le `ConfigModel`, les renderers UI.
- Les renderers et UIManager s’abonnent à l’EventBus pour écouter les changements de config et afficher.
- Seule l’UI modifie la config via le modèle.
- Aucun module ne dépend de variables globales ou du DOM pour le core métier.

---

## 2. Étapes de refonte

1. **Identifier toutes les responsabilités métier (config, calcul, validation, modification…) et extraire du code actuel vers `ConfigModel.js` & `CalculationService.js`.**
2. **Créer un `EventBus.js` simple et central, utilisé partout.**
3. **Déplacer tout accès DOM dans un `UIManager.js` : il lit/écrit dans le DOM, et informe le modèle métier.**
4. **Adapter le rendu SVG et les tableaux pour qu’ils prennent des données en argument, jamais depuis le DOM ni des globals.**
5. **Supprimer tout code redondant/dupliqué (notamment synchronisations, validation, gestion traverses/modules).**
6. **Supprimer tous les logs et variables/fonctions globales inutilisées.**
7. **Renommer tous les fichiers/managers pour coller à cette architecture.**
8. **Écrire des tests unitaires sur le core (facultatif, mais recommandé).**

---

## 3. Règles de bonnes pratiques à respecter

- **Jamais de mélange logique métier / UI** : une fonction fait soit de la logique, soit de l’affichage.
- **Un module = une responsabilité**.
- **Aucune variable globale, tout est instancié explicitement.**
- **Pas de duplication de fonctions (une seule méthode pour chaque responsabilité).**
- **Privilégier la clarté, la lisibilité et la simplicité.**
- **Des noms explicites et cohérents partout.**
- **Séparer clairement les couches (modèle métier, calcul, rendu, UI).**
- **Le core métier doit pouvoir être testé indépendamment du DOM.**
- **Aucune dépendance implicite entre modules.**

---

## 4. Exemple d’arborescence recommandée

```
/core/
ConfigModel.js
CalculationService.js

/events/
EventBus.js

/ui/
UIManager.js
SVGRenderer.js
TablesRenderer.js

main.js
index.html
style.css
```

---

## 5. FAQ

**Q : Peut-on garder l’automatisation du DOM (formulaires dynamiques, affichage/masquage, inputs verrouillés, etc.) ?**  
**R : Oui, mais toute cette logique doit être dans l’UIManager. Le modèle de config n’a aucune connaissance du DOM.**

**Q : Les résultats des calculs (tableaux, SVG) restent-ils exploitables côté code ?**  
**R : Oui, tous les calculs partent d’un objet “config” pur, qui peut être utilisé partout sans accès au DOM.**

---

**Cette refonte rendra le projet lisible, modulaire, testable et évolutif.**

---

## 6. Conseils finaux

- _Si une fonction a plus de 50 lignes, éclate-la !_
- _Supprime sans pitié tout code mort, log de debug, variable globale, ou duplication._
- _Teste chaque module séparément (même manuellement au début)._
- _Documente l’API du modèle métier et des services de calculs._
- _Prends le temps d’organiser le projet AVANT d’ajouter de nouvelles fonctionnalités !_

---
