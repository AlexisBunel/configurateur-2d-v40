import { EVENTS } from "../constants.js";

/**
 * Gère l'ajout, suppression et édition des traverses
 * Remplace la logique éparpillée dans main.js
 */
export class TraverseManager {
  constructor(appState) {
    this._appState = appState;
    this._activeForm = null;
  }

  /**
   * Initialise le gestionnaire de traverses
   */
  initialize() {
    this._attachEventListeners();

    // S'abonner aux changements de config pour mettre à jour les listes
    this._appState.subscribe(EVENTS.CONFIG_CHANGED, (data) => {
      this._updateTraversesLists(data.newState);
    });

    console.log("✅ TraverseManager initialisé");
  }

  /**
   * Met à jour les listes de traverses
   */
  updateLists(config) {
    this._updateTraversesLists(config);
  }

  // ============================================
  // TRAVERSES PRINCIPALES
  // ============================================

  /**
   * Ajoute une traverse principale
   */
  addTraverse() {
    if (this._activeForm) {
      console.warn("⚠️ Formulaire déjà actif");
      return;
    }

    const config = this._appState.get();
    const formHTML = this._createTraverseForm(config);

    const addButton = document.getElementById("add-traverse");
    addButton.insertAdjacentHTML("afterend", formHTML);
    addButton.style.display = "none";

    this._activeForm = "traverse";
    this._attachTraverseFormListeners();
  }

  /**
   * Supprime une traverse principale
   */
  deleteTraverse() {
    const select = document.getElementById("list-traverses");
    const selectedId = select.value;

    if (!selectedId) {
      alert("Veuillez sélectionner une traverse à supprimer");
      return;
    }

    const config = this._appState.get();
    const updatedTraverses = (config.traverses || []).filter(
      (traverse) => traverse.id != selectedId
    );

    this._appState.update("traverses", updatedTraverses);

    console.log("🗑️ Traverse supprimée:", selectedId);
  }

  // ============================================
  // TRAVERSES PORTE
  // ============================================

  /**
   * Ajoute une traverse de porte
   */
  addTraversePorte() {
    if (this._activeForm) {
      console.warn("⚠️ Formulaire déjà actif");
      return;
    }

    const config = this._appState.get();

    if (config.type !== "porte") {
      alert("Cette fonction n'est disponible qu'avec une porte");
      return;
    }

    const formHTML = this._createTraversePorteForm(config);

    const addButton = document.getElementById("add-traverse-porte");
    addButton.insertAdjacentHTML("afterend", formHTML);
    addButton.style.display = "none";

    this._activeForm = "traverse-porte";
    this._attachTraversePorteFormListeners();
  }

  /**
   * Supprime une traverse de porte
   */
  deleteTraversePorte() {
    const select = document.getElementById("list-traverses-tierce");
    const selectedId = select.value;

    if (!selectedId) {
      alert("Veuillez sélectionner une traverse à supprimer");
      return;
    }

    const config = this._appState.get();
    const updatedTraverses = (config.traversesPorte || []).filter(
      (traverse) => traverse.id != selectedId
    );

    this._appState.update("traversesPorte", updatedTraverses);

    console.log("🗑️ Traverse porte supprimée:", selectedId);
  }

  // ============================================
  // MÉTHODES PRIVÉES
  // ============================================

  /**
   * Attache les listeners principaux
   */
  _attachEventListeners() {
    // Boutons d'ajout
    const addTraverseBtn = document.getElementById("add-traverse");
    if (addTraverseBtn) {
      addTraverseBtn.addEventListener("click", () => this.addTraverse());
    }

    const deleteTraverseBtn = document.getElementById("delete-traverse");
    if (deleteTraverseBtn) {
      deleteTraverseBtn.addEventListener("click", () => this.deleteTraverse());
    }

    const addTraversePorteBtn = document.getElementById("add-traverse-porte");
    if (addTraversePorteBtn) {
      addTraversePorteBtn.addEventListener("click", () =>
        this.addTraversePorte()
      );
    }

    const deleteTraversePorteBtn = document.getElementById(
      "delete-traverse-tierce"
    );
    if (deleteTraversePorteBtn) {
      deleteTraversePorteBtn.addEventListener("click", () =>
        this.deleteTraversePorte()
      );
    }
  }

  /**
   * Crée le formulaire d'ajout de traverse
   */
  _createTraverseForm(config) {
    return `
      <div id="traverse-form" class="traverse-form">
        <h4>Nouvelle traverse</h4>
        <label>
          Hauteur (mm) : 
          <input type="number" id="traverse-height" value="1200" min="100" max="${
            config.height - 100
          }" />
        </label>
        <br><br>
        <label>Modules concernés :</label><br>
        ${this._generateModuleCheckboxes(config.modulesCount)}
        <br>
        <button type="button" id="confirm-traverse">Confirmer</button>
        <button type="button" id="cancel-traverse">Annuler</button>
      </div>
    `;
  }

  /**
   * Crée le formulaire d'ajout de traverse porte
   */
  _createTraversePorteForm(config) {
    const traverseType = config.porte?.traverseType || "28";
    const withTierce = config.porte?.withTierce || false;
    const maxHeight = config.porte?.porteHeight || 2200;

    const tierceOption = withTierce
      ? `
      <label>
        <input type="checkbox" id="traverse-on-tierce" />
        Également sur la tierce
      </label>
      <br><br>
    `
      : "";

    return `
      <div id="traverse-porte-form" class="traverse-form">
        <h4>Nouvelle traverse de porte</h4>
        <label>
          Hauteur depuis le sol (mm) : 
          <input type="number" id="traverse-porte-height" value="1000" min="100" max="${
            maxHeight - 100
          }" />
        </label>
        <br><br>
        <label>Type : ${traverseType}mm (défini dans les options)</label>
        <br><br>
        ${tierceOption}
        <button type="button" id="confirm-traverse-porte">Confirmer</button>
        <button type="button" id="cancel-traverse-porte">Annuler</button>
      </div>
    `;
  }

  /**
   * Génère les checkboxes pour les modules
   */
  _generateModuleCheckboxes(modulesCount) {
    let checkboxes = "";
    for (let i = 1; i <= modulesCount; i++) {
      checkboxes += `
        <label class="module-checkbox">
          <input type="checkbox" id="module-${i}" value="${i}" ${
        i === 1 ? "checked" : ""
      } />
          Module ${i}
        </label>
        <br>
      `;
    }
    return checkboxes;
  }

  /**
   * Attache les listeners du formulaire traverse
   */
  _attachTraverseFormListeners() {
    const confirmBtn = document.getElementById("confirm-traverse");
    const cancelBtn = document.getElementById("cancel-traverse");

    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => this._confirmTraverse());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this._cancelTraverse());
    }
  }

  /**
   * Attache les listeners du formulaire traverse porte
   */
  _attachTraversePorteFormListeners() {
    const confirmBtn = document.getElementById("confirm-traverse-porte");
    const cancelBtn = document.getElementById("cancel-traverse-porte");

    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => this._confirmTraversePorte());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this._cancelTraversePorte());
    }
  }

  /**
   * Confirme l'ajout d'une traverse
   */
  _confirmTraverse() {
    const heightInput = document.getElementById("traverse-height");
    const height = parseInt(heightInput.value);

    // Récupérer les modules sélectionnés
    const selectedModules = [];
    const checkboxes = document.querySelectorAll('[id^="module-"]:checked');
    checkboxes.forEach((checkbox) => {
      selectedModules.push(parseInt(checkbox.value));
    });

    if (selectedModules.length === 0) {
      alert("Veuillez sélectionner au moins un module");
      return;
    }

    // Vérifier les doublons
    const config = this._appState.get();
    const existingTraverse = this._findExistingTraverse(
      height,
      selectedModules,
      config.traverses
    );

    if (existingTraverse) {
      alert(
        `Une traverse existe déjà à ${height}mm sur un ou plusieurs de ces modules.`
      );
      return;
    }

    // Ajouter la traverse
    const newTraverse = {
      id: Date.now(),
      height: height,
      modules: selectedModules,
    };

    const updatedTraverses = [...(config.traverses || []), newTraverse];
    this._appState.update("traverses", updatedTraverses);

    this._cleanupForm();

    console.log("✅ Traverse ajoutée:", newTraverse);
  }

  /**
   * Confirme l'ajout d'une traverse porte
   */
  _confirmTraversePorte() {
    const heightInput = document.getElementById("traverse-porte-height");
    const height = parseInt(heightInput.value);

    const onTierceCheckbox = document.getElementById("traverse-on-tierce");
    const onTierce = onTierceCheckbox ? onTierceCheckbox.checked : false;

    const config = this._appState.get();
    const traverseType = config.porte?.traverseType || "28";

    // Chercher une traverse existante à cette hauteur
    const existingTraverse = this._findExistingTraversePorte(
      height,
      config.traversesPorte
    );

    if (existingTraverse) {
      if (existingTraverse.onTierce === onTierce) {
        alert(
          `Une traverse existe déjà à ${height}mm sur ${
            onTierce ? "porte + tierce" : "porte uniquement"
          }.`
        );
        return;
      } else {
        // Mettre à jour l'existante
        existingTraverse.onTierce = onTierce;
        existingTraverse.type = traverseType;

        const updatedTraverses = config.traversesPorte.map((t) =>
          t.id === existingTraverse.id ? existingTraverse : t
        );

        this._appState.update("traversesPorte", updatedTraverses);

        const tierceText = onTierce ? "porte + tierce" : "porte uniquement";
        alert(
          `Traverse à ${height}mm mise à jour : maintenant sur ${tierceText}`
        );
      }
    } else {
      // Créer nouvelle traverse
      const newTraverse = {
        id: Date.now(),
        height: height,
        type: traverseType,
        onTierce: onTierce,
      };

      const updatedTraverses = [...(config.traversesPorte || []), newTraverse];
      this._appState.update("traversesPorte", updatedTraverses);

      console.log("✅ Traverse porte ajoutée:", newTraverse);
    }

    this._cleanupForm();
  }

  /**
   * Annule l'ajout de traverse
   */
  _cancelTraverse() {
    this._cleanupForm();
  }

  /**
   * Annule l'ajout de traverse porte
   */
  _cancelTraversePorte() {
    this._cleanupForm();
  }

  /**
   * Nettoie le formulaire actif
   */
  _cleanupForm() {
    // Supprimer le formulaire
    const forms = ["traverse-form", "traverse-porte-form"];
    forms.forEach((formId) => {
      const form = document.getElementById(formId);
      if (form) {
        form.remove();
      }
    });

    // Réafficher les boutons d'ajout
    const buttons = ["add-traverse", "add-traverse-porte"];
    buttons.forEach((buttonId) => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.style.display = "block";
      }
    });

    this._activeForm = null;
  }

  /**
   * Met à jour les listes déroulantes de traverses
   */
  _updateTraversesLists(config) {
    // Liste traverses principales
    const mainSelect = document.getElementById("list-traverses");
    if (mainSelect) {
      this._populateTraverseSelect(mainSelect, config.traverses, "Traverse");
    }

    // Liste traverses porte
    const porteSelect = document.getElementById("list-traverses-tierce");
    if (porteSelect) {
      this._populateTraversePorteSelect(porteSelect, config.traversesPorte);
    }
  }

  /**
   * Remplit une liste de traverses principales
   */
  _populateTraverseSelect(select, traverses, prefix) {
    select.innerHTML =
      '<option value="" selected>Sélectionner une traverse</option>';

    if (traverses?.length > 0) {
      traverses.forEach((traverse) => {
        const option = document.createElement("option");
        option.value = traverse.id;
        option.textContent = `${prefix} ${
          traverse.height
        }mm (modules: ${traverse.modules.join(", ")})`;
        select.appendChild(option);
      });
    }
  }

  /**
   * Remplit une liste de traverses porte
   */
  _populateTraversePorteSelect(select, traverses) {
    select.innerHTML =
      '<option value="" selected>Sélectionner une traverse</option>';

    if (traverses?.length > 0) {
      traverses.forEach((traverse) => {
        const option = document.createElement("option");
        option.value = traverse.id;

        let text = `Traverse ${traverse.height}mm (type ${traverse.type})`;
        if (traverse.onTierce) {
          text += " + tierce";
        }

        option.textContent = text;
        select.appendChild(option);
      });
    }
  }

  /**
   * Cherche une traverse existante
   */
  _findExistingTraverse(height, selectedModules, existingTraverses) {
    if (!existingTraverses || existingTraverses.length === 0) {
      return null;
    }

    return existingTraverses.find((traverse) => {
      return (
        traverse.height === height &&
        traverse.modules.some((module) => selectedModules.includes(module))
      );
    });
  }

  /**
   * Cherche une traverse porte existante
   */
  _findExistingTraversePorte(height, existingTraverses) {
    if (!existingTraverses || existingTraverses.length === 0) {
      return null;
    }

    return existingTraverses.find((traverse) => traverse.height === height);
  }
}
