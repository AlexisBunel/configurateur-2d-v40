/**
 * ui.js - Gestionnaire d'interface utilisateur
 * Responsable de la liaison entre les formulaires HTML et la configuration
 */

/**
 * Gestionnaire de l'interface utilisateur
 */
const UIManager = {
  /**
   * Éléments de formulaire liés à la configuration
   * @private
   */
  _formElements: new Map(),

  /**
   * Initialise le gestionnaire d'interface
   */
  init() {
    console.log("🖥️ Initialisation de l'interface utilisateur");

    // Lie tous les éléments de formulaire à la configuration
    this._bindFormElements();

    // Configure les écouteurs d'événements
    this._setupEventListeners();

    // Met à jour l'affichage initial
    this._updateFormVisibility();

    console.log("✅ Interface utilisateur initialisée");
  },

  /**
   * Lie tous les éléments avec data-config-key à la configuration
   * @private
   */
  _bindFormElements() {
    // Trouve tous les éléments avec data-config-key
    const elements = document.querySelectorAll("[data-config-key]");

    elements.forEach((element) => {
      const configKey = element.getAttribute("data-config-key");
      this._formElements.set(configKey, element);

      // Ajoute un écouteur pour mettre à jour la config
      this._addElementListener(element, configKey);

      // Met à jour la valeur initiale depuis la config
      this._updateElementFromConfig(element, configKey);
    });

    console.log(`🔗 ${elements.length} éléments liés à la configuration`);
  },

  /**
   * Ajoute un écouteur d'événement à un élément de formulaire
   * @private
   */
  _addElementListener(element, configKey) {
    const eventType = this._getEventType(element);

    element.addEventListener(eventType, (event) => {
      let value = this._getElementValue(element);

      // Conversion de type si nécessaire
      value = this._convertValue(element, value, configKey);

      // Validation avant mise à jour
      if (!this._validateInput(configKey, value)) {
        this._showValidationError(element, configKey, value);
        return;
      }

      // Efface les erreurs précédentes
      this._clearValidationError(element);

      // Met à jour la configuration
      if (ConfigManager.set(configKey, value)) {
        console.log(`📝 ${configKey} mis à jour: ${value} (${typeof value})`);
      }
    });
  },

  /**
   * Détermine le type d'événement à écouter selon l'élément
   * @private
   */
  _getEventType(element) {
    switch (element.type) {
      case "checkbox":
      case "radio":
      case "range":
        return "change";
      case "number":
        return "blur"; // Validation uniquement à la perte de focus
      default:
        return element.tagName.toLowerCase() === "select" ? "change" : "blur";
    }
  },

  /**
   * Récupère la valeur d'un élément de formulaire
   * @private
   */
  _getElementValue(element) {
    switch (element.type) {
      case "checkbox":
        return element.checked;
      case "radio":
        return element.checked ? element.value : null;
      case "number":
      case "range":
        return parseFloat(element.value);
      default:
        return element.value;
    }
  },

  /**
   * Convertit la valeur selon le type d'élément et la clé de configuration
   * @private
   */
  _convertValue(element, value, configKey) {
    // Conversion pour les radio buttons
    if (element.type === "radio" && value === null) {
      return ConfigManager.get(configKey);
    }

    // Conversion des strings boolean
    if (value === "true") return true;
    if (value === "false") return false;

    // Conversion pour les champs numériques
    if (element.type === "number") {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? 0 : numValue;
    }

    // Conversion pour certaines clés spécifiques
    if (this._isNumericConfigKey(configKey) && typeof value === "string") {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? 0 : numValue;
    }

    return value;
  },

  /**
   * Vérifie si une clé de configuration doit être numérique
   * @private
   */
  _isNumericConfigKey(configKey) {
    const numericKeys = [
      "width",
      "height",
      "modulesCount",
      "porteIndex",
      "porte.porteWidth",
      "porte.porteHeight",
      "porte.tierceWidth",
    ];
    return numericKeys.includes(configKey);
  },

  /**
   * Met à jour un élément depuis la configuration
   * @private
   */
  _updateElementFromConfig(element, configKey) {
    const value = ConfigManager.get(configKey);

    if (value === undefined) return;

    switch (element.type) {
      case "checkbox":
        element.checked = Boolean(value);
        break;
      case "radio":
        element.checked = element.value === String(value);
        break;
      default:
        element.value = value;
    }
  },

  /**
   * Configure les écouteurs d'événements pour l'interface
   * @private
   */
  _setupEventListeners() {
    // Écoute les changements de configuration pour mettre à jour l'interface
    EventBus.on(EVENTS.CONFIG_UPDATED, (data) => {
      this._onConfigUpdated(data);
    });

    // Écoute le chargement de configuration
    EventBus.on(EVENTS.CONFIG_LOADED, () => {
      this._updateAllFormElements();
    });

    // Écoute la remise à zéro
    EventBus.on(EVENTS.CONFIG_RESET, () => {
      this._updateAllFormElements();
    });

    // Boutons spéciaux
    this._setupSpecialButtons();

    // Écouteurs spéciaux pour les changements importants
    this._setupSpecialListeners();
  },

  /**
   * Gère la mise à jour d'une valeur de configuration
   * @private
   */
  _onConfigUpdated(data) {
    // Vérification de sécurité
    if (!data || !data.key) {
      console.log(
        "⚠️ Événement config-updated sans données - mise à jour complète"
      );
      this._updateAllFormElements();
      return;
    }

    const { key } = data;

    // Met à jour l'élément correspondant
    const element = this._formElements.get(key);
    if (element) {
      this._updateElementFromConfig(element, key);
    }

    // Met à jour la visibilité des formulaires si nécessaire
    if (key === "type" || key.startsWith("porte.")) {
      this._updateFormVisibility();
      this._handlePorteLogic();
    }

    // Met à jour les modules si nécessaire
    if (key === "modulesCount" || key === "width") {
      this._updateModulesInterface();
    }

    // Met à jour spécifiquement les options si c'est la largeur qui change
    if (key === "width") {
      this._updateModulesCountOptions();
    }

    // Gestion spéciale de la porte
    if (key.startsWith("porte.")) {
      this._handlePorteLogic();
      this._updateDimensionsOuverture();
    }
  },

  /**
   * Gère la logique complexe de la porte
   * @private
   */
  _handlePorteLogic() {
    const config = ConfigManager.getConfig();

    if (config.type !== "porte") return;

    // 1. Gestion du dormant selon imposte
    this._handleDormantOptions(config);

    // 2. Gestion de la hauteur de porte
    this._handlePorteHeight(config);

    // 3. Gestion module unique avec porte
    this._handleSingleModulePorte(config);

    // 4. Redistribution des modules si nécessaire
    this._redistributeModuleWidths();
  },

  /**
   * Gère l'affichage du dormant selon l'imposte
   * @private
   */
  _handleDormantOptions(config) {
    const withImposte = config.porte?.withImposte || false;
    const dormantSelect = document.getElementById("dormant");
    const dormantLabel = document.getElementById("label-dormant");

    if (!dormantLabel || !dormantSelect) return;

    if (withImposte) {
      // Avec imposte : cacher l'option dormant et forcer à false
      dormantLabel.classList.add("hidden");
      dormantSelect.classList.add("hidden");
      dormantSelect.value = "false";

      if (config.porte && config.porte.withDormant !== false) {
        ConfigManager.set("porte.withDormant", false);
      }
    } else {
      // Sans imposte : afficher l'option dormant
      dormantLabel.classList.remove("hidden");
      dormantSelect.classList.remove("hidden");
    }
  },

  /**
   * Gère la hauteur de porte selon les contraintes
   * @private
   */
  _handlePorteHeight(config) {
    const porteHeightInput = document.querySelector(
      '[data-config-key="porte.porteHeight"]'
    );
    if (!porteHeightInput) return;

    const validation = Calculator.validatePorteHeight(config);

    // Applique les contraintes à l'input
    porteHeightInput.readOnly = validation.isReadOnly;
    porteHeightInput.style.backgroundColor = validation.isReadOnly
      ? "#f0f0f0"
      : "";
    porteHeightInput.min = validation.minHeight;
    porteHeightInput.max = validation.maxHeight;

    // Met à jour la valeur si nécessaire
    if (porteHeightInput.value != validation.height) {
      porteHeightInput.value = validation.height;
      ConfigManager.set("porte.porteHeight", validation.height);
    }

    // Met à jour le tooltip
    if (validation.isReadOnly) {
      porteHeightInput.title =
        "Calculé automatiquement selon la hauteur totale";
    } else {
      porteHeightInput.title = `Hauteur entre ${validation.minHeight}mm et ${validation.maxHeight}mm`;
    }
  },

  /**
   * Gère le cas spécial d'un module unique avec porte
   * @private
   */
  _handleSingleModulePorte(config) {
    const singleModuleData = Calculator.calculateSingleModulePorte(config);

    const porteWidthInput = document.querySelector(
      '[data-config-key="porte.porteWidth"]'
    );
    const tierceWidthInput = document.querySelector(
      '[data-config-key="porte.tierceWidth"]'
    );

    if (!singleModuleData.isSingleModule) {
      // Pas en mode module unique : déverrouiller les inputs
      this._unlockPorteInputs();
      return;
    }

    // Mode module unique : appliquer les contraintes
    if (porteWidthInput) {
      porteWidthInput.value = singleModuleData.porteWidth;
      porteWidthInput.readOnly = singleModuleData.isPorteReadOnly;
      porteWidthInput.style.backgroundColor = singleModuleData.isPorteReadOnly
        ? "#f0f0f0"
        : "";

      if (singleModuleData.isPorteReadOnly) {
        porteWidthInput.title = "Calculé automatiquement (module unique)";
      } else {
        porteWidthInput.min = singleModuleData.minPorteWidth;
        porteWidthInput.max = singleModuleData.maxPorteWidth;
        porteWidthInput.title = `Largeur entre ${singleModuleData.minPorteWidth}mm et ${singleModuleData.maxPorteWidth}mm`;
      }

      // Met à jour la config si nécessaire
      if (config.porte.porteWidth !== singleModuleData.porteWidth) {
        ConfigManager.set("porte.porteWidth", singleModuleData.porteWidth);
      }
    }

    if (tierceWidthInput && config.porte.withTierce) {
      tierceWidthInput.value = singleModuleData.tierceWidth;
      tierceWidthInput.readOnly = singleModuleData.isTierceReadOnly;
      tierceWidthInput.style.backgroundColor = singleModuleData.isTierceReadOnly
        ? "#f0f0f0"
        : "";
      tierceWidthInput.title = singleModuleData.isTierceReadOnly
        ? "Calculé automatiquement (largeur restante)"
        : "";

      // Met à jour la config si nécessaire
      if (config.porte.tierceWidth !== singleModuleData.tierceWidth) {
        ConfigManager.set("porte.tierceWidth", singleModuleData.tierceWidth);
      }
    }
  },

  /**
   * Déverrouille les inputs de porte (mode normal)
   * @private
   */
  _unlockPorteInputs() {
    const porteWidthInput = document.querySelector(
      '[data-config-key="porte.porteWidth"]'
    );
    const tierceWidthInput = document.querySelector(
      '[data-config-key="porte.tierceWidth"]'
    );

    if (porteWidthInput) {
      porteWidthInput.readOnly = false;
      porteWidthInput.style.backgroundColor = "";
      porteWidthInput.title = "";
      porteWidthInput.min = "400";
      porteWidthInput.max = "1230";
    }

    if (tierceWidthInput) {
      tierceWidthInput.readOnly = false;
      tierceWidthInput.style.backgroundColor = "";
      tierceWidthInput.title = "";
    }
  },

  /**
   * Met à jour l'affichage des dimensions d'ouverture
   * @private
   */
  _updateDimensionsOuverture() {
    const displayElement = document.getElementById("ouverture-info");
    if (!displayElement) return;

    const config = ConfigManager.getConfig();
    const dimensions = Calculator.calculateDimensionsOuverture(config);

    if (dimensions.hasOuverture) {
      displayElement.textContent = `${dimensions.hauteur}mm x ${dimensions.largeur}mm`;
      displayElement.style.fontWeight = "bold";
      displayElement.style.color = "#0066cc";
    } else {
      displayElement.textContent = "Aucune ouverture (verrière pleine)";
      displayElement.style.fontWeight = "normal";
      displayElement.style.color = "#666";
    }
  },

  /**
   * Met à jour tous les éléments de formulaire depuis la configuration
   * @private
   */
  _updateAllFormElements() {
    this._formElements.forEach((element, configKey) => {
      this._updateElementFromConfig(element, configKey);
    });
    this._updateFormVisibility();
    this._updateModulesInterface();
    this._updateDimensionsOuverture();
  },

  /**
   * Met à jour la visibilité des formulaires selon le type de verrière
   * @private
   */
  _updateFormVisibility() {
    const config = ConfigManager.getConfig();
    const isPorte = config.type === "porte";

    // Affiche/masque les sections liées à la porte
    this._toggleElement("#configuration-porte", isPorte);
    this._toggleElement("#configuration-options-porte", isPorte);
    this._toggleElement("#configuration-traverses-porte", isPorte);

    // Gère l'affichage des options de porte
    this._toggleElement("#widthTierce", config.porte.withTierce);
    this._toggleElement("#label-modulePorte", isPorte);
    this._toggleElement("#modulePorte", isPorte);

    console.log(`👁️ Visibilité mise à jour (porte: ${isPorte})`);
  },

  /**
   * Affiche ou masque un élément
   * @private
   */
  _toggleElement(selector, show) {
    const element = document.querySelector(selector);
    if (element) {
      if (show) {
        element.classList.remove("hidden");
      } else {
        element.classList.add("hidden");
      }
    }
  },

  /**
   * Met à jour les options du select pour l'index de la porte
   * @private
   */
  _updatePorteIndexOptions(count) {
    const select = document.getElementById("modulePorte");
    if (!select) return;

    // Vide les options existantes
    select.innerHTML = "";

    // Ajoute une option pour chaque module
    for (let i = 0; i < count; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `Module ${i + 1}`;
      select.appendChild(option);
    }

    // Sélectionne la valeur actuelle
    const currentIndex = ConfigManager.get("porteIndex");
    if (currentIndex < count) {
      select.value = currentIndex;
    } else {
      select.value = count - 1;
      ConfigManager.set("porteIndex", count - 1);
    }
  },

  /**
   * Met à jour l'interface des modules
   * @private
   */
  _updateModulesInterface() {
    const config = ConfigManager.getConfig();

    // 1. D'abord mettre à jour les options de nombre de modules
    this._updateModulesCountOptions();

    // 2. Redistribuer les largeurs avec la logique avancée
    this._redistributeModuleWidths();

    // 3. Générer les champs selon le nombre actuel
    this._generateModuleInputs(config.modulesCount);

    // 4. Enfin mettre à jour les options de porte
    this._updatePorteIndexOptions(config.modulesCount);

    // 5. Mettre à jour les dimensions d'ouverture
    this._updateDimensionsOuverture();
  },

  /**
   * Génère les champs de saisie pour les largeurs de modules
   * @private
   */
  _generateModuleInputs(count) {
    const container = document.getElementById("modules-width");
    if (!container) return;

    // Vide le conteneur
    container.innerHTML = "";

    const config = ConfigManager.getConfig();
    let totalWidth = 0;

    // Crée un input pour chaque module
    for (let i = 0; i < count; i++) {
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";
      wrapper.style.gap = "10px";
      wrapper.style.marginBottom = "5px";

      const label = document.createElement("label");
      label.textContent = `Module ${i + 1} :`;
      label.style.minWidth = "80px";
      label.style.fontWeight =
        config.type === "porte" && i === config.porteIndex ? "bold" : "normal";
      label.style.color =
        config.type === "porte" && i === config.porteIndex
          ? "#0066cc"
          : "inherit";

      // Ajoute une indication si c'est le module avec porte
      if (config.type === "porte" && i === config.porteIndex) {
        label.textContent += " (🚪)";
      }

      const input = document.createElement("input");
      input.type = "number";
      input.min = "200";
      input.max = "2000";
      input.value = config.moduleWidths[i] || 1000;
      input.style.width = "100px";
      input.dataset.moduleIndex = i;

      // Écouteur pour mettre à jour la configuration
      input.addEventListener("blur", () => {
        this._updateModuleWidth(i, parseInt(input.value) || 1000);
      });

      // Validation en temps réel (visual feedback seulement)
      input.addEventListener("input", () => {
        const value = parseInt(input.value) || 0;
        if (value < 200 || value > 2000) {
          input.style.borderColor = "#ff4444";
        } else {
          input.style.borderColor = "#44ff44";
        }
      });

      const unit = document.createElement("span");
      unit.textContent = "mm";

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      wrapper.appendChild(unit);

      container.appendChild(wrapper);

      totalWidth += config.moduleWidths[i] || 1000;
    }

    // Ajoute un résumé en bas
    this._addModulesSummary(container, totalWidth, config.width);

    console.log(
      `📏 ${count} champs de modules générés (total: ${totalWidth}mm)`
    );
  },

  /**
   * Met à jour la largeur d'un module spécifique
   * @private
   */
  _updateModuleWidth(index, width) {
    const config = ConfigManager.getConfig();
    const newWidths = [...config.moduleWidths];

    // Validation
    if (width < 200) width = 200;
    if (width > 2000) width = 2000;

    newWidths[index] = width;
    ConfigManager.set("moduleWidths", newWidths);

    // Met à jour le résumé
    const container = document.getElementById("modules-width");
    const totalWidth = newWidths.reduce((sum, w) => sum + w, 0);
    this._updateModulesSummary(totalWidth, config.width);

    console.log(`📝 Module ${index + 1} mis à jour: ${width}mm`);
  },

  /**
   * Ajoute un résumé des modules
   * @private
   */
  _addModulesSummary(container, totalModules, totalVerriere) {
    const summaryDiv = document.createElement("div");
    summaryDiv.id = "modules-summary";
    summaryDiv.style.marginTop = "10px";
    summaryDiv.style.padding = "8px";
    summaryDiv.style.backgroundColor = "#f5f5f5";
    summaryDiv.style.borderRadius = "4px";
    summaryDiv.style.fontSize = "0.9em";

    const difference = totalVerriere - totalModules;
    const isValid = Math.abs(difference) <= 10; // Tolérance 10mm

    summaryDiv.innerHTML = `
            <strong>Résumé :</strong><br>
            Largeur modules: ${totalModules}mm<br>
            Largeur verrière: ${totalVerriere}mm<br>
            <span style="color: ${isValid ? "green" : "red"}">
                Différence: ${difference > 0 ? "+" : ""}${difference}mm 
                ${isValid ? "✓" : "⚠️"}
            </span>
        `;

    container.appendChild(summaryDiv);
  },

  /**
   * Met à jour le résumé des modules
   * @private
   */
  _updateModulesSummary(totalModules, totalVerriere) {
    const summary = document.getElementById("modules-summary");
    if (!summary) return;

    const difference = totalVerriere - totalModules;
    const isValid = Math.abs(difference) <= 10;

    summary.innerHTML = `
            <strong>Résumé :</strong><br>
            Largeur modules: ${totalModules}mm<br>
            Largeur verrière: ${totalVerriere}mm<br>
            <span style="color: ${isValid ? "green" : "red"}">
                Différence: ${difference > 0 ? "+" : ""}${difference}mm 
                ${isValid ? "✓" : "⚠️"}
            </span>
        `;
  },

  /**
   * Met à jour les options du select pour le nombre de modules selon la largeur
   * @private
   */
  _updateModulesCountOptions() {
    const modulesCountSelect = document.getElementById("modulesCount");
    if (!modulesCountSelect) return;

    const config = ConfigManager.getConfig();
    const width = config.width || 4000;

    // Calculer le nombre maximum de modules basé sur la largeur
    // Chaque module doit faire au minimum 300mm
    const maxModules = Math.floor(width / 300);
    const minModules = Math.ceil(width / 1500);

    // Garder la valeur actuelle si elle est valide
    const currentValue = parseInt(modulesCountSelect.value) || minModules;

    // Vider le select
    modulesCountSelect.innerHTML = "";

    // Générer les options
    for (let i = minModules; i <= maxModules; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;

      // Garder la sélection actuelle si elle est encore valide
      if (
        i === currentValue &&
        currentValue >= minModules &&
        currentValue <= maxModules
      ) {
        option.selected = true;
      } else if (
        i === minModules &&
        (currentValue < minModules || currentValue > maxModules)
      ) {
        // Si la valeur actuelle devient invalide, sélectionner minModules par défaut
        option.selected = true;
      }

      modulesCountSelect.appendChild(option);
    }

    // Si la valeur actuelle devient invalide, mettre à jour la config
    if (currentValue < minModules || currentValue > maxModules) {
      const newValue = minModules;
      modulesCountSelect.value = newValue.toString();

      // Mettre à jour la configuration
      ConfigManager.set("modulesCount", newValue);

      console.log(
        `📐 Nombre de modules ajusté: ${newValue} (largeur: ${width}mm, range: ${minModules}-${maxModules})`
      );
    }

    console.log(
      `📊 Options modules mises à jour: ${minModules} à ${maxModules} modules possibles (largeur: ${width}mm)`
    );
  },

  /**
   * Configure les boutons spéciaux
   * @private
   */
  _setupSpecialButtons() {
    // Bouton de réinitialisation des modules
    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this._resetModuleWidths();
      });
    }

    // Boutons pour les traverses (placeholder pour l'instant)
    this._setupTraversesButtons();
  },

  /**
   * Configure les écouteurs spéciaux
   * @private
   */
  _setupSpecialListeners() {
    // Écouteur pour le changement de largeur totale
    const widthInput = document.querySelector('[data-config-key="width"]');
    if (widthInput) {
      widthInput.addEventListener("blur", () => {
        // Les options de modules se mettront à jour via l'événement config-updated
        this._redistributeModuleWidths();
      });
    }
  },

  /**
   * Redistribue les largeurs de modules avec la logique avancée
   * @private
   */
  _redistributeModuleWidths() {
    const config = ConfigManager.getConfig();

    // Utilise la logique de calcul avancée
    const newWidths = Calculator.distributeModuleWidths(config);

    // Met à jour la configuration
    ConfigManager.set("moduleWidths", newWidths);

    console.log(`📏 Largeurs redistribuées avec logique porte:`, newWidths);
  },

  /**
   * Configure les boutons pour les traverses (placeholder)
   * @private
   */
  _setupTraversesButtons() {
    // Pour l'instant, juste des placeholders
    const addTraverseBtn = document.getElementById("add-traverse");
    const deleteTraverseBtn = document.getElementById("delete-traverse");

    if (addTraverseBtn) {
      addTraverseBtn.addEventListener("click", () => {
        console.log("🔧 TODO: Ajouter traverse (Phase suivante)");
      });
    }

    if (deleteTraverseBtn) {
      deleteTraverseBtn.addEventListener("click", () => {
        console.log("🔧 TODO: Supprimer traverse (Phase suivante)");
      });
    }
  },

  /**
   * Remet les largeurs de modules à une répartition équitable
   * @private
   */
  _resetModuleWidths() {
    const config = ConfigManager.getConfig();
    const totalWidth = config.width;
    const moduleCount = config.modulesCount;

    // Calcul de la largeur par module (simplifié pour l'instant)
    const moduleWidth = Math.floor(totalWidth / moduleCount);
    const newWidths = new Array(moduleCount).fill(moduleWidth);

    ConfigManager.set("moduleWidths", newWidths);

    // Regénère l'interface
    this._generateModuleInputs(moduleCount);

    console.log("🔄 Largeurs de modules réinitialisées");
  },

  /**
   * Affiche un message d'erreur dans l'interface
   * @param {string} message - Message à afficher
   * @param {string} type - Type d'erreur ('error', 'warning', 'info')
   */
  showMessage(message, type = "info") {
    // Pour l'instant, utilise console.log
    // Plus tard, on pourra créer une zone de messages dans l'interface
    const prefix = {
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    console.log(`${prefix[type]} ${message}`);

    // TODO: Implémenter une vraie zone de messages dans l'interface
  },

  /**
   * Met à jour le compteur de modules disponible
   * @param {number} width - Largeur totale de la verrière
   */
  updateModulesCountOptions(width) {
    const select = document.getElementById("modulesCount");
    if (!select) return;

    // Calcule le nombre max de modules possible
    const minModuleWidth = 200;
    const maxModules = Math.floor(width / minModuleWidth);

    // Limite à 10 modules max pour l'interface
    const actualMax = Math.min(maxModules, 10);

    // Sauvegarde la valeur actuelle
    const currentValue = parseInt(select.value);

    // Vide et recrée les options
    select.innerHTML = "";
    for (let i = 2; i <= actualMax; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i.toString();
      select.appendChild(option);
    }

    // Restaure la valeur si possible
    if (currentValue <= actualMax) {
      select.value = currentValue;
    } else {
      select.value = actualMax;
      ConfigManager.set("modulesCount", actualMax);
    }
  },

  /**
   * Valide les valeurs saisies dans les formulaires
   * @param {string} configKey - Clé de configuration à valider
   * @param {*} value - Valeur à valider
   * @returns {boolean} True si valide
   */
  _validateInput(configKey, value) {
    // Utilise la validation du ConfigManager
    return ConfigManager._validateValue(configKey, value);
  },

  /**
   * Affiche une erreur de validation sur un élément
   * @private
   */
  _showValidationError(element, configKey, value) {
    // Ajoute une classe d'erreur
    element.classList.add("error");

    // Cherche ou crée un message d'erreur
    let errorMsg = element.parentNode.querySelector(".error-message");
    if (!errorMsg) {
      errorMsg = document.createElement("span");
      errorMsg.className = "error-message";
      errorMsg.style.color = "red";
      errorMsg.style.fontSize = "0.8em";
      errorMsg.style.display = "block";
      element.parentNode.appendChild(errorMsg);
    }

    // Message d'erreur personnalisé
    errorMsg.textContent = this._getValidationErrorMessage(configKey, value);

    console.warn(`⚠️ Erreur de validation ${configKey}: ${value}`);
  },

  /**
   * Efface les erreurs de validation sur un élément
   * @private
   */
  _clearValidationError(element) {
    element.classList.remove("error");
    const errorMsg = element.parentNode.querySelector(".error-message");
    if (errorMsg) {
      errorMsg.remove();
    }
  },

  /**
   * Retourne un message d'erreur personnalisé selon la clé
   * @private
   */
  _getValidationErrorMessage(configKey, value) {
    switch (configKey) {
      case "width":
      case "height":
        return `Dimension doit être entre 400mm et 5000mm (actuel: ${value}mm)`;
      case "porte.porteWidth":
        return `Largeur porte doit être entre 400mm et 1230mm (actuel: ${value}mm)`;
      case "porte.porteHeight":
        return `Hauteur porte doit être entre 500mm et 4000mm (actuel: ${value}mm)`;
      case "porte.tierceWidth":
        return `Largeur tierce doit être entre 300mm et 1230mm (actuel: ${value}mm)`;
      default:
        return `Valeur invalide: ${value}`;
    }
  },
};

// Export pour utilisation en mode debug
if (typeof window !== "undefined" && window.VerriereApp) {
  window.VerriereApp.UIManager = UIManager;
}
