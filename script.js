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
  console.log(totalWidth);

  // Ajout tierce si présente
  if (withTierce) {
    totalWidth += 5 + tierceWidth;
  }
  console.log(totalWidth);

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
    console.log("largeur porte : ", porteModuleWidth);
    console.log("index porte : ", porteIndex);

    // Largeur restante pour les autres modules
    const remainingWidth = availableWidth - porteModuleWidth;
    const freeModulesCount = modulesCount - 1;
    const standardModuleWidth = Math.floor(remainingWidth / freeModulesCount);

    // Répartir les largeurs
    for (let i = 1; i <= modulesCount; i++) {
      if (i == porteIndex) {
        moduleWidths.push(porteModuleWidth);
        console.log("porteIndex / i", i);
      } else {
        console.log("module standard");
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
  newInputs.forEach((input) => {
    input.addEventListener("change", () => {
      configManager.loadConfig();
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await initConfigManager();
  setupEventListeners();
  configManager.subscribe("configChanged", updateUIVisibility);
  updateUIVisibility({ newConfig: configManager.getConfig() });
  console.log("Script.js chargé !");
});
