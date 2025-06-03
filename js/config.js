// Gestionnaire de configuration

const DEFAULT_CONFIG = {
  width: 4000,
  height: 2500,
  type: "pleine",
  modulesCount: 4,
  moduleWidths: [950, 950, 950, 950],
  porteIndex: 3,
  porte: {
    porteWidth: 730,
    porteHeight: 2200,
    tierceWidth: 350,
    withTierce: false,
    withImposte: false,
    withDormant: false,
    charniereType: "visible",
    sensOuverture: "droit",
    serrure: "SERROULM",
    profile: "po66",
    colorBequille: "noir",
    colorPvitrage: "noir",
    traverseType: "28",
  },
  traverses: [],
  traversesPorte: [],
  options: {
    colorProfile: "noir",
    remplissageEp: "6",
    colorJoint: "noir",
  },
};

// 1. Configuration actuelle (copie de DEFAULT_CONFIG)
let currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

// 2. Fonction pour récupérer la config
function getConfig() {
  return JSON.parse(JSON.stringify(currentConfig));
}

// 3. Fonction pour mettre à jour une valeur
function updateConfig(key, value) {
  const keys = key.split(".");

  // Variable temporaire pour naviguer
  let target = currentConfig;

  // Navigue jusqu'à l'objet parent
  for (let i = 0; i < keys.length - 1; i++) {
    if (!target[keys[i]]) {
      target[keys[i]] = {};
    }
    target = target[keys[i]]; // ← target change, pas currentConfig
  }

  // Met à jour la valeur finale
  target[keys[keys.length - 1]] = value;

  console.log("Config updated:", currentConfig);
}
