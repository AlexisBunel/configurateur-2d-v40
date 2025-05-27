let fixedModules = new Set();

function setupEventListeners() {
  const inputs = document.querySelectorAll("[data-config-key]");

  inputs.forEach((input) => {
    input.addEventListener("change", () => {
      configManager.loadConfig();
    });
  });
}

function updateUIVisibility(eventData) {
  const configData = eventData.newConfig;
  const oldConfig = eventData.oldConfig;
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

  console.log("Mise à jour de l'interface avec:", configData);
}

function calculateModuleWidths(configData) {
  const totalWidth = configData.width;
  const modulesCount = configData.modulesCount;
  const hasPorte = configData.type === "porte";

  let profilsWidth = (Number(modulesCount) + 1) * 40;

  if (hasPorte) {
    profilsWidth += 22;
  }

  const availableWidth = totalWidth - profilsWidth;
  console.log(`Largeur disponible pour modules: ${availableWidth}mm`);

  return availableWidth;
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
  console.log(moduleWidths);

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

document.addEventListener("DOMContentLoaded", async () => {
  await initConfigManager();
  setupEventListeners();
  configManager.subscribe("configChanged", updateUIVisibility);
  updateUIVisibility({ newConfig: configManager.getConfig() });
  document.getElementById("reset-btn").addEventListener("click", resetModules);
});
