let fixedModules = new Set();

function setupEventListeners() {
  const inputs = document.querySelectorAll("[data-config-key]");

  inputs.forEach((input) => {
    input.addEventListener("change", () => {
      configManager.loadConfig();
    });
  });

  const widthInput = document.getElementById("width");
  if (widthInput) {
    widthInput.addEventListener("change", () => {
      const config = configManager.getConfig();
      updateModulesCountOptions(config);
      handleSingleModulePorte(config);
      configManager.loadConfig();
    });
  }

  const modulesCountSelect = document.getElementById("modulesCount");
  if (modulesCountSelect) {
    modulesCountSelect.addEventListener("change", () => {
      const config = configManager.getConfig();
      updatePorteIndexOptions(config);
      handleSingleModulePorte(config);
      configManager.loadConfig(); // Recharger après la mise à jour des options
    });
  }

  const tierceSelect = document.getElementById("tierce");
  if (tierceSelect) {
    tierceSelect.addEventListener("change", () => {
      const config = configManager.getConfig();
      handleSingleModulePorte(config);
    });
  }

  // Listener spécial pour la largeur de porte en mode module unique avec tierce
  const porteWidthInput = document.querySelector(
    '[data-config-key="porte.porteWidth"]'
  );
  if (porteWidthInput) {
    porteWidthInput.addEventListener("change", () => {
      const config = configManager.getConfig();
      // Si on est en mode module unique avec tierce, recalculer la tierce
      if (
        config.modulesCount === 1 &&
        config.type === "porte" &&
        config.porte?.withTierce
      ) {
        handleSingleModulePorte(config);
      }
    });
  }

  const charniereSelect = document.getElementById("charniere");
  if (charniereSelect) {
    charniereSelect.addEventListener("change", () => {
      const config = configManager.getConfig();
      handleSingleModulePorte(config);
    });
  }

  const imposteSelect = document.getElementById("imposte");
  if (imposteSelect) {
    imposteSelect.addEventListener("change", () => {
      const config = configManager.getConfig();
      handleDormantOptions(config);
    });
  }

  // Listener pour le dormant (pour recalculer la hauteur de porte)
  const dormantSelect = document.getElementById("dormant");
  if (dormantSelect) {
    dormantSelect.addEventListener("change", () => {
      const config = configManager.getConfig();
      handlePorteHeight(config);
    });
  }

  // Listener pour la hauteur totale (pour recalculer la hauteur de porte)
  const heightInput = document.getElementById("height");
  if (heightInput) {
    heightInput.addEventListener("change", () => {
      const config = configManager.getConfig();
      if (config.type === "porte") {
        handlePorteHeight(config);
      }
    });
  }
}

function updateUIVisibility(eventData) {
  const configData = eventData.newConfig;
  const oldConfig = eventData.oldConfig;

  updateModulesCountOptions(configData);
  updatePorteIndexOptions(configData);

  if (
    !oldConfig ||
    oldConfig.type !== configData.type ||
    oldConfig.modulesCount !== configData.modulesCount
  ) {
    resetFixedModules();
  }

  const porteForm = document.getElementById("configuration-porte");
  const porteOptionsForm = document.getElementById(
    "configuration-options-porte"
  );
  const traversesPorteForm = document.getElementById(
    "configuration-traverses-porte"
  );
  const labelModulePorte = document.getElementById("label-modulePorte");
  const indexPorte = document.getElementById("modulePorte");

  if (configData.type === "porte") {
    porteForm.classList.remove("hidden");
    porteOptionsForm.classList.remove("hidden");
    traversesPorteForm.classList.remove("hidden");
    labelModulePorte.classList.remove("hidden");
    indexPorte.classList.remove("hidden");
    handleDormantOptions(configData);
    handleSingleModulePorte(configData);
  } else {
    porteForm.classList.add("hidden");
    porteOptionsForm.classList.add("hidden");
    traversesPorteForm.classList.add("hidden");
    labelModulePorte.classList.add("hidden");
    indexPorte.classList.add("hidden");
  }

  const widthTierce = document.getElementById("widthTierce");

  if (configData.porte && configData.porte.withTierce) {
    widthTierce.classList.remove("hidden");
  } else {
    widthTierce.classList.add("hidden");
  }

  updateModulesInputs(configData);
  updateDimensionsOuverture(configData);

  console.log("Mise à jour de l'interface avec:", configData);
}

//Fonctions imposte

function handleDormantOptions(configData) {
  const withImposte = configData.porte?.withImposte || false;
  const dormantSelect = document.getElementById("dormant");
  const dormantLabel = document.getElementById("label-dormant");

  if (!dormantLabel) return;

  if (withImposte) {
    dormantLabel.classList.add("hidden");
    dormantSelect.classList.add("hidden");
    dormantSelect.value = "false";

    // Forcer la valeur dans la config si nécessaire
    if (configData.porte && configData.porte.withDormant !== false) {
      configData.porte.withDormant = false;
      // Déclencher un événement change pour mettre à jour la config
      dormantSelect.dispatchEvent(new Event("change"));
    }
  } else {
    // Sans imposte : afficher l'option dormant
    dormantLabel.classList.remove("hidden");
    dormantSelect.classList.remove("hidden");
  }
  handlePorteHeight(configData);
}

function handlePorteHeight(configData) {
  const porteHeightInput = document.querySelector(
    '[data-config-key="porte.porteHeight"]'
  );

  if (!porteHeightInput) return;

  const withImposte = configData.porte?.withImposte || false;
  const withDormant = configData.porte?.withDormant || false;
  const totalHeight = configData.height || 2500;

  if (!withImposte) {
    // Sans imposte : hauteur calculée automatiquement
    let calculatedHeight = totalHeight - 15; // Jeu de 15mm par défaut

    if (withDormant) {
      calculatedHeight -= 51; // Soustraire 51mm pour le dormant haut
    }

    // Imposer la valeur et verrouiller
    porteHeightInput.value = calculatedHeight;
    porteHeightInput.readOnly = true;
    porteHeightInput.style.backgroundColor = "#f0f0f0";

    if (configData.porte && configData.porte.porteHeight !== calculatedHeight) {
      configData.porte.porteHeight = calculatedHeight;
      // Déclencher une mise à jour de la config sans déclencher une boucle
      porteHeightInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  } else {
    // Avec imposte : hauteur modifiable par l'utilisateur
    const maxHeight = totalHeight - 40 - 250 - 51 - 15; // 40 (traverse), 250 (min imposte), 51 (dormant), 15 (jeu)

    porteHeightInput.readOnly = false;
    porteHeightInput.style.backgroundColor = "";
    porteHeightInput.min = 500;
    porteHeightInput.max = maxHeight;

    // Vérifier et ajuster la valeur actuelle si nécessaire
    const currentValue = parseInt(porteHeightInput.value) || 2200;
    if (currentValue > maxHeight) {
      porteHeightInput.value = maxHeight;
      if (configData.porte) {
        configData.porte.porteHeight = maxHeight;
        porteHeightInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    } else if (currentValue < 500) {
      porteHeightInput.value = 500;
      if (configData.porte) {
        configData.porte.porteHeight = 500;
        porteHeightInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }
  updateDimensionsOuverture(configData);
}

function updateDimensionsOuverture(config) {
  const displayElement = document.getElementById("dimensions-ouverture");
  if (!displayElement) return;

  let hauteur, largeur;

  // Calcule de la hauteur
  if (config.porte?.withImposte) {
    hauteur = (config.porte?.porteHeight || 0) + 15 + 51;
  } else {
    hauteur = config.height || 0;
  }

  // Calcule de la largeur
  const porteWidth = config.porte?.porteWidth || 0;
  const charniere = config.porte?.charniereType || "visible";
  const withTierce = config.porte?.withTierce || false;
  const tierceWidth = config.porte?.tierceWidth || 0;

  if (!withTierce) {
    largeur = porteWidth + 102 + (charniere === "invisible" ? 6 : 10);
  } else {
    largeur =
      porteWidth + tierceWidth + 102 + (charniere === "invisible" ? 11 : 15);
  }

  displayElement.textContent = `Dimensions de l'ouverture : ${hauteur}mm x ${largeur}mm`;
}

// Fonctions modules

function calculateModuleWidths(configData) {
  const totalWidth = configData.width;
  const modulesCount = configData.modulesCount;
  const hasPorte = configData.type === "porte";

  let profilsWidth = (Number(modulesCount) + 1) * 40;

  if (hasPorte) {
    profilsWidth += 22;
  }

  const availableWidth = totalWidth - profilsWidth;
  // console.log(`Largeur disponible pour modules: ${availableWidth}mm`);

  return availableWidth;
}

function updateModulesCountOptions(configData) {
  const modulesCountSelect = document.getElementById("modulesCount");
  const width = configData.width || 4000;

  // Calculer le nombre maximum de modules basé sur la largeur
  // Chaque module doit faire au minimum 300mm
  const maxModules = Math.floor(width / 300);
  const minModules = Math.ceil(width / 1500);

  // Garder la valeur actuelle si elle est valide
  const currentValue = parseInt(modulesCountSelect.value) || minModules;

  modulesCountSelect.innerHTML = "";

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
      // Si la valeur actuelle devient invalide, sélectionner 1 par défaut
      option.selected = true;
    }

    modulesCountSelect.appendChild(option);
  }

  if (currentValue < minModules || currentValue > maxModules) {
    modulesCountSelect.value = minModules.toString();
    modulesCountSelect.dispatchEvent(new Event("change"));
  }
}

function updatePorteIndexOptions(configData) {
  const porteIndexSelect = document.getElementById("modulePorte");
  const modulesCount = configData.modulesCount || 1;

  // Garder la valeur actuelle si elle est valide
  const currentValue = parseInt(porteIndexSelect.value) || 1;

  porteIndexSelect.innerHTML = "";

  for (let i = 1; i <= modulesCount; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;

    // Garder la sélection actuelle si elle est encore valide
    if (i === currentValue && currentValue <= modulesCount) {
      option.selected = true;
    } else if (i === 1 && currentValue > modulesCount) {
      option.selected = true;
    }

    porteIndexSelect.appendChild(option);
  }

  if (currentValue > modulesCount) {
    porteIndexSelect.value = "1";
    porteIndexSelect.dispatchEvent(new Event("change"));
  }
}

function handleSingleModulePorte(configData) {
  // Vérifier si nous avons un seul module avec une porte
  if (Number(configData.modulesCount) !== 1 || configData.type !== "porte") {
    unlockPorteInputs();
    return;
  }

  const width = configData.width || 4000;
  const withTierce = configData.porte?.withTierce || false;
  const charniereType = configData.porte?.charniereType || "visible";

  console.log("width:", width);
  console.log("withTierce:", withTierce);
  console.log("charniereType:", charniereType);

  const porteWidthInput = document.querySelector(
    '[data-config-key="porte.porteWidth"]'
  );
  const tierceWidthInput = document.querySelector(
    '[data-config-key="porte.tierceWidth"]'
  );

  if (!withTierce) {
    // Largeur de porte imposée = largeur totale - profils - charnières
    let porteWidth;
    if (charniereType === "visible") {
      porteWidth = width - 102 - 10; // 102 = profils, 10 = charnières visibles
    } else {
      porteWidth = width - 102 - 6; // 102 = profils, 6 = charnières invisibles
    }
    // Verrouiller l'input de largeur de porte
    if (porteWidthInput) {
      porteWidthInput.value = porteWidth;
      porteWidthInput.readOnly = true;
      porteWidthInput.style.backgroundColor = "#f0f0f0";
      porteWidthInput.title = "Calculé automatiquement (module unique)";
    } else {
      console.log("❌ porteWidthInput non trouvé");
    }

    // S'assurer que la config est mise à jour
    if (configData.porte) {
      configData.porte.porteWidth = porteWidth;
    }
  } else {
    const currentPorteWidth = configData.porte?.porteWidth || 730;
    // Calculer les limites pour la largeur de porte
    let minPorteWidth, maxPorteWidth, tierceWidth;

    if (charniereType === "visible") {
      const availableWidth = width - 51 - 51 - 15; // 51+51 = profils, 15 = jeu
      minPorteWidth = Math.ceil(availableWidth / 2);
      maxPorteWidth = availableWidth - 200; // 200 = largeur mini tierce
      tierceWidth = availableWidth - currentPorteWidth;
    } else {
      const availableWidth = width - 51 - 51 - 11; // 51+51 = profils, 11 = jeu
      minPorteWidth = Math.ceil(availableWidth / 2);
      maxPorteWidth = availableWidth - 200; // 200 = largeur mini tierce
      tierceWidth = availableWidth - currentPorteWidth;
    }
    // Ajuster la largeur de porte si nécessaire
    let adjustedPorteWidth = currentPorteWidth;
    if (currentPorteWidth < minPorteWidth) {
      adjustedPorteWidth = minPorteWidth;
    } else if (currentPorteWidth > maxPorteWidth) {
      adjustedPorteWidth = maxPorteWidth;
    }

    // Recalculer la largeur de tierce
    if (charniereType === "visible") {
      tierceWidth = width - 51 - 51 - 15 - adjustedPorteWidth;
    } else {
      tierceWidth = width - 51 - 51 - 11 - adjustedPorteWidth;
    }

    // Mettre à jour les inputs
    if (porteWidthInput) {
      porteWidthInput.value = adjustedPorteWidth;
      porteWidthInput.min = minPorteWidth;
      porteWidthInput.max = maxPorteWidth;
      porteWidthInput.readOnly = false;
      porteWidthInput.style.backgroundColor = "";
      porteWidthInput.title = `Largeur entre ${minPorteWidth}mm et ${maxPorteWidth}mm`;
    } else {
      console.log("❌ porteWidthInput non trouvé");
    }

    if (tierceWidthInput) {
      tierceWidthInput.value = tierceWidth;
      tierceWidthInput.readOnly = true;
      tierceWidthInput.style.backgroundColor = "#f0f0f0";
      tierceWidthInput.title = "Calculé automatiquement (largeur restante)";
    } else {
      console.log("❌ tierceWidthInput non trouvé");
    }

    // Mettre à jour la config
    if (configData.porte) {
      configData.porte.porteWidth = adjustedPorteWidth;
      configData.porte.tierceWidth = tierceWidth;
    }
  }
}

function unlockPorteInputs() {
  // Fonction pour déverrouiller les inputs quand on n'est plus en mode "module unique"
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
}

function calculatePorteModuleWidth(configData) {
  if (!configData.porte) return 0;

  const porteWidth = configData.porte.porteWidth || 730;
  const charniereType = configData.porte.charniereType || "visible";
  const withTierce = configData.porte.withTierce || false;
  const tierceWidth = configData.porte.tierceWidth || 350;

  let totalWidth = porteWidth;

  // Ajout charnières
  if (charniereType === "invisible") {
    totalWidth += 6;
  } else {
    // visible
    totalWidth += 10;
  }

  // Ajout tierce si présente
  if (withTierce) {
    totalWidth += 5 + tierceWidth;
  }

  return totalWidth;
}

function distributeModuleWidths(configData) {
  const availableWidth = calculateModuleWidths(configData);
  const modulesCount = configData.modulesCount;
  const porteIndex = configData.porteIndex;
  const hasPorte = configData.type === "porte";

  let moduleWidths = [];

  if (hasPorte) {
    // Utiliser la nouvelle fonction de calcul
    const porteModuleWidth = calculatePorteModuleWidth(configData);

    // Largeur restante pour les autres modules
    const remainingWidth = availableWidth - porteModuleWidth;
    const freeModulesCount = modulesCount - 1;
    const standardModuleWidth = Math.floor(remainingWidth / freeModulesCount);

    // Répartir les largeurs
    for (let i = 1; i <= modulesCount; i++) {
      if (i == porteIndex) {
        moduleWidths.push(porteModuleWidth);
      } else {
        moduleWidths.push(standardModuleWidth);
      }
    }
  } else {
    // Pas de porte = répartition égale
    const standardModuleWidth = Math.floor(availableWidth / modulesCount);
    for (let i = 1; i <= modulesCount; i++) {
      moduleWidths.push(standardModuleWidth);
    }
  }

  return moduleWidths;
}

function updateModulesInputs(configData) {
  const modulesContainer = document.getElementById("modules-width");
  const modulesCount = configData.modulesCount;
  const porteIndex = configData.porteIndex;
  const hasPorte = configData.type === "porte";

  const moduleWidths = distributeModuleWidths(configData);
  // console.log(moduleWidths);

  modulesContainer.innerHTML = "";

  for (let i = 1; i <= modulesCount; i++) {
    const moduleWidthContainer = document.createElement("div");
    const isPorteModule = hasPorte && porteIndex == i;
    moduleWidthContainer.setAttribute("class", "moduleWidth");
    moduleWidthContainer.innerHTML = `
    <label>Module ${i} ${
      isPorteModule ? "(PORTE)" : ""
    } : <input id="widthModule${i}" type="number" data-config-key="modules.${
      i - 1
    }.width" value="${moduleWidths[i - 1]}" ${
      isPorteModule ? 'readonly style="background-color: #f0f0f0;"' : ""
    } min="300" max="2000"/></label>`;
    modulesContainer.appendChild(moduleWidthContainer);
  }

  const newInputs = modulesContainer.querySelectorAll("[data-config-key]");
  newInputs.forEach((input, index) => {
    input.addEventListener("change", (event) => {
      const moduleIndex = index; // Index dans le tableau
      const newValue = parseInt(event.target.value);

      // Marquer ce module comme fixé
      if (!isPorteModule(moduleIndex, configData)) {
        fixedModules.add(moduleIndex);
        handleManualModuleChange(configData, moduleIndex, newValue);
      }
    });
  });
}

function resetFixedModules() {
  fixedModules.clear();
}

function handleManualModuleChange(configData, changedIndex, newValue) {
  // console.log(`Module ${changedIndex + 1} fixé à ${newValue}mm`);
  // console.log("Modules fixés:", Array.from(fixedModules));

  // Synchroniser les modules avec la config
  syncModulesToConfig(configData);

  // Recalculer et mettre à jour les autres modules
  redistributeModules(configData);

  // Mettre à jour la config globale
  // configManager.updateConfig(configData);
}

function isPorteModule(moduleIndex, configData) {
  const hasPorte = configData.type === "porte";
  const porteIndex = configData.porteIndex;
  return hasPorte && moduleIndex + 1 == porteIndex; // +1 car index vs position
}

function redistributeModules(configData) {
  const availableWidth = calculateModuleWidths(configData);
  const modulesCount = configData.modulesCount;

  // Calculer la largeur utilisée par les modules fixés
  let usedWidth = 0;
  let freeModules = []; // Liste des modules libres

  for (let i = 0; i < modulesCount; i++) {
    if (isPorteModule(i, configData)) {
      usedWidth += calculatePorteModuleWidth(configData);
    } else if (fixedModules.has(i)) {
      // Module fixé par l'utilisateur
      const input = document.getElementById(`widthModule${i + 1}`);
      usedWidth += parseInt(input.value) || 300;
    } else {
      // Module libre
      freeModules.push(i);
    }
  }

  // Largeur restante pour les modules libres
  const remainingWidth = availableWidth - usedWidth;

  // Réinitialiser tous les inputs libres
  freeModules.forEach((moduleIndex) => {
    const input = document.getElementById(`widthModule${moduleIndex + 1}`);
    if (input) {
      // Supprimer l'ancien event listener en clonant l'élément
      const newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);
    }
  });

  if (freeModules.length === 1) {
    // Un seul module libre = il devient automatiquement calculé et verrouillé
    const lastFreeIndex = freeModules[0];
    const input = document.getElementById(`widthModule${lastFreeIndex + 1}`);
    if (input) {
      input.value = remainingWidth;
      input.readonly = true;
      input.disabled = true; // Plus sûr que readonly
      input.style.backgroundColor = "#e0e0e0";
      input.title = "Calculé automatiquement";
      // PAS d'event listener sur ce module
    }
  } else if (freeModules.length > 1) {
    // Plusieurs modules libres = répartition égale avec event listeners
    const standardModuleWidth = Math.floor(remainingWidth / freeModules.length);

    freeModules.forEach((moduleIndex) => {
      const input = document.getElementById(`widthModule${moduleIndex + 1}`);
      if (input) {
        input.value = standardModuleWidth;
        input.readonly = false;
        input.disabled = false;
        input.style.backgroundColor = "";
        input.title = "";

        // Rajouter l'event listener SEULEMENT sur les modules modifiables
        input.addEventListener("change", (event) => {
          const newValue = parseInt(event.target.value);
          fixedModules.add(moduleIndex);
          handleManualModuleChange(configData, moduleIndex, newValue);
        });
      }
    });
  }

  // Style pour les modules fixés par l'utilisateur
  fixedModules.forEach((moduleIndex) => {
    const input = document.getElementById(`widthModule${moduleIndex + 1}`);
    if (input) {
      input.style.backgroundColor = "#d4edda";
      input.title = "Fixé par l'utilisateur";
    }
  });

  // console.log(
  //   `Modules libres: ${freeModules.length}, Largeur restante: ${remainingWidth}mm`
  // );
  console.log(configData);
}

function resetModules() {
  // 1. Vider les modules fixés
  resetFixedModules();

  // 2. Récupérer la config actuelle
  const currentConfig = configManager.getConfig();

  // 3. Recalculer les largeurs par défaut (répartition équitable)
  const moduleWidths = distributeModuleWidths(currentConfig);

  // 4. Mettre à jour tous les inputs avec les valeurs par défaut
  const modulesCount = currentConfig.modulesCount;

  for (let i = 1; i <= modulesCount; i++) {
    const input = document.getElementById(`widthModule${i}`);
    if (input) {
      // Réinitialiser la valeur
      input.value = moduleWidths[i - 1];

      // Réinitialiser l'état visuel (sauf module porte)
      const isPorteModule =
        currentConfig.type === "porte" && currentConfig.porteIndex == i;

      if (!isPorteModule) {
        input.readonly = false;
        input.disabled = false;
        input.style.backgroundColor = "";
        input.title = "";
      }
    }
  }

  // 5. Réattacher les event listeners sur tous les modules libres
  updateModulesInputs(currentConfig);

  // 6. Synchroniser avec la config
  syncModulesToConfig(currentConfig);
  configManager.updateConfig(currentConfig);
}

function syncModulesToConfig(configData) {
  // S'assurer que config.modules existe et a la bonne taille
  if (!configData.modules) {
    configData.modules = [];
  }

  const modulesCount = configData.modulesCount;

  // Ajuster la taille du tableau modules
  while (configData.modules.length < modulesCount) {
    configData.modules.push({ width: 800 }); // valeur par défaut
  }
  while (configData.modules.length > modulesCount) {
    configData.modules.pop();
  }

  // Synchroniser avec les valeurs des inputs
  for (let i = 0; i < modulesCount; i++) {
    const input = document.getElementById(`widthModule${i + 1}`);
    if (input && input.value) {
      configData.modules[i].width = parseInt(input.value) || 800;
    }
  }

  return configData;
}

// Fonctions traverses
// Traverses Verrières

function addTraverse() {
  const currentConfig = configManager.getConfig();
  const modulesCount = currentConfig.modulesCount;

  // Créer un formulaire dynamique
  const formHTML = `
        <div id="traverse-form" style="border: 2px solid #333; padding: 15px; margin: 10px 0; background: #f9f9f9;">
            <h4>Nouvelle traverse</h4>
            <label>Hauteur (mm) : 
                <input type="number" id="traverse-height" value="1200" min="100" max="2400" />
            </label>
            <br><br>
            <label>Modules concernés :</label><br>
            ${generateModuleCheckboxes(modulesCount)}
            <br>
            <button type="button" id="confirm-traverse">Confirmer</button>
            <button type="button" id="cancel-traverse">Annuler</button>
        </div>
    `;

  // Ajouter le formulaire après le bouton "Ajouter"
  const addButton = document.getElementById("add-traverse");
  addButton.insertAdjacentHTML("afterend", formHTML);

  // Masquer le bouton "Ajouter" pendant l'édition
  addButton.style.display = "none";

  // Attacher les événements
  document
    .getElementById("confirm-traverse")
    .addEventListener("click", confirmTraverse);
  document
    .getElementById("cancel-traverse")
    .addEventListener("click", cancelTraverse);
}

function generateModuleCheckboxes(modulesCount) {
  let checkboxes = "";
  for (let i = 1; i <= modulesCount; i++) {
    checkboxes += `
            <label style="margin-right: 15px;">
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

function validateTraverseExists(height, selectedModules, existingTraverses) {
  if (!existingTraverses || existingTraverses.length === 0) {
    return false; // Aucune traverse existante
  }

  // Vérifier si une traverse existe déjà à cette hauteur sur un des modules sélectionnés
  return existingTraverses.some((existingTraverse) => {
    // Même hauteur ET au moins un module en commun
    return (
      existingTraverse.height === height &&
      existingTraverse.modules.some((module) =>
        selectedModules.includes(module)
      )
    );
  });
}

function confirmTraverse() {
  const currentConfig = configManager.getConfig();

  // Récupérer la hauteur
  const height = parseInt(document.getElementById("traverse-height").value);

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

  // VALIDATION : Vérifier les doublons
  if (
    validateTraverseExists(height, selectedModules, currentConfig.traverses)
  ) {
    alert(
      `Une traverse existe déjà à ${height}mm sur un ou plusieurs de ces modules.`
    );
    return;
  }

  // Ajouter à la config (code existant)
  const traverseId = Date.now();
  if (!currentConfig.traverses) {
    currentConfig.traverses = [];
  }

  currentConfig.traverses.push({
    id: traverseId,
    height: height,
    modules: selectedModules,
  });

  // Nettoyer et mettre à jour
  cleanupTraverseForm();
  updateTraversesSelect(currentConfig);
  configManager.updateConfig(currentConfig);

  console.log("Traverse ajoutée:", currentConfig.traverses);
}

function cancelTraverse() {
  cleanupTraverseForm();
}

function cleanupTraverseForm() {
  // Supprimer le formulaire
  const form = document.getElementById("traverse-form");
  if (form) {
    form.remove();
  }

  // Réafficher le bouton "Ajouter"
  document.getElementById("add-traverse").style.display = "block";
}

function updateTraversesSelect(configData) {
  const select = document.getElementById("list-traverses");

  // Vider le select (garder l'option par défaut)
  select.innerHTML =
    '<option value="" selected>Sélectionner une traverse</option>';

  // Ajouter une option pour chaque traverse
  if (configData.traverses) {
    configData.traverses.forEach((traverse) => {
      const option = document.createElement("option");
      option.value = traverse.id;
      option.textContent = `Traverse ${
        traverse.height
      }mm (modules: ${traverse.modules.join(", ")})`;
      select.appendChild(option);
    });
  }
}

function deleteTraverse() {
  const select = document.getElementById("list-traverses");
  const selectedId = select.value;

  if (!selectedId) {
    alert("Veuillez sélectionner une traverse à supprimer");
    return;
  }

  const currentConfig = configManager.getConfig();

  // Supprimer la traverse de la config
  if (currentConfig.traverses) {
    currentConfig.traverses = currentConfig.traverses.filter(
      (traverse) => traverse.id != selectedId
    );
  }

  // Mettre à jour l'interface
  updateTraversesSelect(currentConfig);

  // Mettre à jour la config
  configManager.updateConfig(currentConfig);

  console.log(
    "Traverse supprimée, traverses restantes:",
    currentConfig.traverses
  );
}

// Traverses Porte

// Fonctions traverses de porte
function addTraversePorte() {
  const currentConfig = configManager.getConfig();

  if (currentConfig.type !== "porte") {
    alert("Cette fonction n'est disponible qu'avec une porte");
    return;
  }

  const traverseType = currentConfig.porte?.traverseType || "28";
  const withTierce = currentConfig.porte?.withTierce || false;

  // Créer un formulaire avec option tierce si applicable
  const tierceOption = withTierce
    ? `
      <label>
          <input type="checkbox" id="traverse-on-tierce" />
          Également sur la tierce
      </label>
      <br><br>
  `
    : "";

  const formHTML = `
      <div id="traverse-porte-form" style="border: 2px solid #333; padding: 15px; margin: 10px 0; background: #f9f9f9;">
          <h4>Nouvelle traverse de porte</h4>
          <label>Hauteur depuis le sol (mm) : 
              <input type="number" id="traverse-porte-height" value="1000" min="100" max="2200" />
          </label>
          <br><br>
          <label>Type : ${traverseType}mm (défini dans les options)</label>
          <br><br>
          ${tierceOption}
          <button type="button" id="confirm-traverse-porte">Confirmer</button>
          <button type="button" id="cancel-traverse-porte">Annuler</button>
      </div>
  `;

  // Ajouter le formulaire après le bouton "Ajouter"
  const addButton = document.getElementById("add-traverse-porte");
  addButton.insertAdjacentHTML("afterend", formHTML);

  // Masquer le bouton "Ajouter" pendant l'édition
  addButton.style.display = "none";

  // Attacher les événements
  document
    .getElementById("confirm-traverse-porte")
    .addEventListener("click", confirmTraversePorte);
  document
    .getElementById("cancel-traverse-porte")
    .addEventListener("click", cancelTraversePorte);
}

function validateTraversePorteExists(height, onTierce, existingTraversesPorte) {
  if (!existingTraversesPorte || existingTraversesPorte.length === 0) {
    return false; // Aucune traverse existante
  }

  // Vérifier si une traverse existe déjà à cette hauteur avec le même état tierce
  return existingTraversesPorte.some((existingTraverse) => {
    return (
      existingTraverse.height === height &&
      existingTraverse.onTierce === onTierce
    );
  });
}

function findExistingTraversePorte(height, existingTraversesPorte) {
  if (!existingTraversesPorte || existingTraversesPorte.length === 0) {
    return null;
  }

  // Chercher une traverse à cette hauteur (peu importe l'état tierce)
  return existingTraversesPorte.find(
    (existingTraverse) => existingTraverse.height === height
  );
}

function confirmTraversePorte() {
  const currentConfig = configManager.getConfig();

  // Récupérer la hauteur
  const height = parseInt(
    document.getElementById("traverse-porte-height").value
  );
  const traverseType = currentConfig.porte?.traverseType || "28";

  // Récupérer l'état de la tierce
  const onTierceCheckbox = document.getElementById("traverse-on-tierce");
  const onTierce = onTierceCheckbox ? onTierceCheckbox.checked : false;

  // Initialiser la config si nécessaire
  if (!currentConfig.traversesPorte) {
    currentConfig.traversesPorte = [];
  }

  // NOUVELLE LOGIQUE : Chercher une traverse existante à cette hauteur
  const existingTraverse = findExistingTraversePorte(
    height,
    currentConfig.traversesPorte
  );

  if (existingTraverse) {
    // Traverse existante trouvée
    if (existingTraverse.onTierce === onTierce) {
      // Même configuration → erreur
      alert(
        `Une traverse existe déjà à ${height}mm sur ${
          onTierce ? "porte + tierce" : "porte uniquement"
        }.`
      );
      return;
    } else {
      // Configuration différente → mettre à jour
      existingTraverse.onTierce = onTierce;
      existingTraverse.type = traverseType; // Mettre à jour le type aussi

      const tierceText = onTierce ? "porte + tierce" : "porte uniquement";
      alert(
        `Traverse à ${height}mm mise à jour : maintenant sur ${tierceText}`
      );
    }
  } else {
    // Aucune traverse existante → créer une nouvelle
    const traverseId = Date.now();

    currentConfig.traversesPorte.push({
      id: traverseId,
      height: height,
      type: traverseType,
      onTierce: onTierce,
    });
  }

  // Nettoyer et mettre à jour
  cleanupTraversePorteForm();
  updateTraversesPorteSelect(currentConfig);
  configManager.updateConfig(currentConfig);

  console.log("Traverses de porte mises à jour:", currentConfig.traversesPorte);
}

function cancelTraversePorte() {
  cleanupTraversePorteForm();
}

function cleanupTraversePorteForm() {
  // Supprimer le formulaire
  const form = document.getElementById("traverse-porte-form");
  if (form) {
    form.remove();
  }

  // Réafficher le bouton "Ajouter"
  document.getElementById("add-traverse-porte").style.display = "block";
}

function updateTraversesPorteSelect(configData) {
  const select = document.getElementById("list-traverses-tierce");

  // Vider le select (garder l'option par défaut)
  select.innerHTML =
    '<option value="" selected>Sélectionner une traverse</option>';

  // Ajouter une option pour chaque traverse
  if (configData.traversesPorte) {
    configData.traversesPorte.forEach((traverse) => {
      const option = document.createElement("option");
      option.value = traverse.id;
      const tierceText = traverse.onTierce ? " + tierce" : "";
      option.textContent = `Traverse ${traverse.height}mm (type ${traverse.type}${tierceText})`;
      select.appendChild(option);
    });
  }
}

function deleteTraversePorte() {
  const select = document.getElementById("list-traverses-tierce");
  const selectedId = select.value;

  if (!selectedId) {
    alert("Veuillez sélectionner une traverse à supprimer");
    return;
  }

  const currentConfig = configManager.getConfig();

  // Supprimer la traverse de la config
  if (currentConfig.traversesPorte) {
    currentConfig.traversesPorte = currentConfig.traversesPorte.filter(
      (traverse) => traverse.id != selectedId
    );
  }

  // Mettre à jour l'interface
  updateTraversesPorteSelect(currentConfig);

  // Mettre à jour la config
  configManager.updateConfig(currentConfig);

  console.log("Traverse de porte supprimée:", currentConfig.traversesPorte);
}

document.addEventListener("DOMContentLoaded", async () => {
  await initConfigManager();
  setupEventListeners();
  configManager.subscribe("configChanged", updateUIVisibility);
  updateUIVisibility({ newConfig: configManager.getConfig() });
  document.getElementById("reset-btn").addEventListener("click", resetModules);
  document
    .getElementById("add-traverse")
    .addEventListener("click", addTraverse);
  document
    .getElementById("delete-traverse")
    .addEventListener("click", deleteTraverse);
  document
    .getElementById("add-traverse-porte")
    .addEventListener("click", addTraversePorte);

  document
    .getElementById("delete-traverse-tierce")
    .addEventListener("click", deleteTraversePorte);
});
