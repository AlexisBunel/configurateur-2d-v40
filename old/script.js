// Variable globale pour stocker la configuration
let config = null;

// Fonction pour charger la configuration depuis config.json
async function loadConfig() {
  try {
    const response = await fetch("config.json");
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    config = await response.json();
    console.log("Configuration chargée depuis config.json:", config);
    return config;
  } catch (error) {
    console.error("Erreur lors du chargement de config.json:", error);
    // Configuration de secours en cas d'erreur
    config = {
      width: 4000,
      height: 2500,
      type: "pleine",
      modulesCount: 3,
      porteIndex: 2,
      porte: {
        withTierce: false,
        withImposte: false,
        charniereType: "visible",
        traverseType: "28",
        traverseTierce: "false",
        porteWidth: 730,
        tierceWidth: 350,
        porteHeight: 2200,
        sensOuverture: "droit",
        serrure: "SERROULM",
        profile: "po66",
        colorBequille: "noir",
        colorPvitrage: "noir",
      },
      modules: [],
      traverses: [],
      traversesPorte: [],
      options: {
        colorProfile: "noir",
        remplissageEp: 6,
        colorJoint: "noir",
      },
    };
    console.log("Configuration de secours utilisée:", config);
    return config;
  }
}

// Fonction pour sauvegarder la configuration dans le fichier (optionnel - nécessite un serveur)
async function saveConfig() {
  try {
    const response = await fetch("config.json", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config, null, 2),
    });

    if (response.ok) {
      console.log("Configuration sauvegardée avec succès");
    } else {
      console.warn("Impossible de sauvegarder - serveur requis");
    }
  } catch (error) {
    console.warn("Sauvegarde impossible (mode fichier local):", error.message);
  }
}

// Fonction pour mettre à jour la config depuis un input
function updateConfig(key, value, inputElement) {
  // Vérifie que la config est chargée
  if (!config) {
    console.error("Configuration non chargée");
    return;
  }

  // Gestion des propriétés imbriquées (ex: porte.withTierce)
  const keys = key.split(".");
  let target = config;

  // Navigue jusqu'à l'objet parent
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) {
      target[keys[i]] = {};
    }
    target = target[keys[i]];
  }

  // Convertit la valeur selon le type d'input
  let convertedValue = value;
  if (inputElement.type === "number") {
    convertedValue = parseInt(value) || 0;
  } else if (inputElement.type === "checkbox") {
    convertedValue = inputElement.checked;
  } else if (value === "true") {
    convertedValue = true;
  } else if (value === "false") {
    convertedValue = false;
  }

  // Met à jour la valeur finale
  target[keys[keys.length - 1]] = convertedValue;

  console.log(`Config mise à jour: ${key} = ${convertedValue}`);
  console.log("Config complète:", config);

  // Optionnel: sauvegarde automatique (nécessite un serveur)
  // saveConfig();
}

// Fonction pour synchroniser tous les inputs avec la config actuelle
function syncInputsWithConfig() {
  // Vérifie que la config est chargée
  if (!config) {
    console.error("Configuration non chargée, impossible de synchroniser");
    return;
  }

  const inputs = document.querySelectorAll("[data-config-key]");

  inputs.forEach((input) => {
    const key = input.getAttribute("data-config-key");
    const value = getConfigValue(key);

    if (input.type === "radio") {
      input.checked = input.value === value;
    } else if (input.type === "checkbox") {
      input.checked = value;
    } else {
      input.value = value;
      console.log(input.type, value);
    }
  });
}

// Fonction utilitaire pour récupérer une valeur de la config
function getConfigValue(key) {
  if (!config) {
    console.error("Configuration non chargée");
    return undefined;
  }

  const keys = key.split(".");
  let value = config;

  for (const k of keys) {
    if (value && typeof value === "object") {
      value = value[k];
    } else {
      return undefined;
    }
  }

  return value;
}

// Fonction pour gérer les changements spéciaux (modules, traverses, etc.)
function handleSpecialUpdates(key, value, inputElement) {
  switch (key) {
    case "type":
      // Montre/cache les options de porte selon le type
      const porteForm = document.getElementById("configuration-porte");
      const porteOptionsForm = document.getElementById(
        "configuration-options-porte"
      );
      const traversesPorteForm = document.getElementById(
        "configuration-traverses-porte"
      );
      const labelModulePorte = document.getElementById("label-modulePorte");
      const indexPorte = document.getElementById("modulePorte");

      if (value === "porte") {
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
      break;

    case "withTierce":
      // Montre/cache le champ largeur tierce
      const tierceLabel = document.getElementById("widthTierce");
      if (value === true || value === "true") {
        tierceLabel.classList.remove("hidden");
      } else {
        tierceLabel.classList.add("hidden");
      }
      break;

    case "modulesCount":
      // Met à jour les options de position de porte
      updatePorteIndexOptions(parseInt(value));
      break;
  }
}

// Met à jour les options du select "emplacement de la porte"
function updatePorteIndexOptions(count) {
  if (!config) return;

  const select = document.getElementById("modulePorte");
  select.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Module ${i}`;
    if (i === config.porteIndex) {
      option.selected = true;
    }
    select.appendChild(option);
  }
}

// Initialisation - attache les événements à tous les inputs avec data-config-key
function initConfigListeners() {
  const inputs = document.querySelectorAll("[data-config-key]");

  inputs.forEach((input) => {
    const eventType = input.type === "radio" ? "change" : "input";

    input.addEventListener(eventType, function (e) {
      const key = this.getAttribute("data-config-key");
      const value = this.type === "checkbox" ? this.checked : this.value;

      // Gestion spéciale pour les boutons radio
      if (this.type === "radio" && !this.checked) {
        return; // Ne traite que le bouton radio sélectionné
      }

      // Met à jour la config
      updateConfig(key, value, this);

      // Gère les mises à jour spéciales
      handleSpecialUpdates(key, value, this);
    });
  });
}

// Fonction d'initialisation principale
async function initializeApp() {
  try {
    // 1. Charge la configuration depuis config.json
    await loadConfig();

    // 2. Synchronise les inputs avec la config chargée
    syncInputsWithConfig();

    // 3. Attache les listeners aux éléments du formulaire
    initConfigListeners();

    // 4. Initialise l'état de l'interface selon la config
    handleSpecialUpdates("type", config.type);
    handleSpecialUpdates("withTierce", config.porte?.withTierce || false);
    handleSpecialUpdates("modulesCount", config.modulesCount);

    console.log("Application initialisée avec succès");
  } catch (error) {
    console.error("Erreur lors de l'initialisation:", error);
  }
}

// Initialise tout au chargement de la page
document.addEventListener("DOMContentLoaded", initializeApp);
