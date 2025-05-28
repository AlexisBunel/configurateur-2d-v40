// Base de données des références avec leurs règles de calcul
const REFERENCES_DB = {
  profils: {
    // Profils verticaux
    PV40: {
      nom: "Profil Vertical 40",
      description: "Profil vertical standard",
      unite: "ml",
      couleurs: ["noir", "gris", "blanc"],
      calcul: {
        // Fonction qui calcule la quantité et longueur basée sur la config
        quantite: (config) => {
          // Nombre de profils verticaux = modules + 1
          return config.modulesCount + 1;
        },
        longueur: (config) => {
          // Hauteur de la verrière
          return config.height;
        },
        conditions: (config) => {
          // Toujours présent
          return true;
        },
      },
    },

    PH40: {
      nom: "Profil Horizontal 40",
      description: "Profil horizontal standard",
      unite: "ml",
      couleurs: ["noir", "gris", "blanc"],
      calcul: {
        quantite: (config) => {
          // 2 profils horizontaux (haut et bas)
          return 2;
        },
        longueur: (config) => {
          return config.width;
        },
        conditions: (config) => true,
      },
    },
  }

  accessoires: {
    SERROULM: {
      nom: "Serrure à rouleau seul",
      description: "Mécanisme de fermeture standard",
      unite: "u",
      calcul: {
        quantite: (config) => {
          return config.type === "porte" && config.porte.serrure === "SERROULM"
            ? 1
            : 0;
        },
        conditions: (config) =>
          config.type === "porte" && config.porte.serrure === "SERROULM",
      },
    },

    SERROULPENM: {
      nom: "Serrure rouleau + pêne + 1/2 cylindre",
      description: "Mécanisme de fermeture renforcé",
      unite: "u",
      calcul: {
        quantite: (config) => {
          return config.type === "porte" &&
            config.porte.serrure === "SERROULPENM"
            ? 1
            : 0;
        },
        conditions: (config) =>
          config.type === "porte" && config.porte.serrure === "SERROULPENM",
      },
    },

  remplissages: {
    VERRE_6MM: {
      nom: "Verre 6mm",
      description: "Panneau de verre standard 6mm",
      unite: "m²",
      calcul: {
        quantite: (config) => {
          // Calcule la surface totale
          const surfaceTotale = (config.width * config.height) / 1000000; // conversion mm² vers m²
          return Math.round(surfaceTotale * 100) / 100; // arrondi à 2 décimales
        },
        conditions: (config) => config.options.remplissageEp === 6,
      },
    },

    VERRE_8MM: {
      nom: "Verre 8mm",
      description: "Panneau de verre renforcé 8mm",
      unite: "m²",
      calcul: {
        quantite: (config) => {
          const surfaceTotale = (config.width * config.height) / 1000000;
          return Math.round(surfaceTotale * 100) / 100;
        },
        conditions: (config) => config.options.remplissageEp === 8,
      },
    },
  }
};

// Fonction pour calculer toutes les références actives
function calculateActiveReferences(config) {
  const activeRefs = {
    profils: [],
    accessoires: [],
    remplissages: [],
  };

  // Parcourt chaque catégorie
  Object.keys(REFERENCES_DB).forEach((categorie) => {
    Object.entries(REFERENCES_DB[categorie]).forEach(([code, reference]) => {
      // Vérifie si la référence doit être incluse
      if (reference.calcul.conditions(config)) {
        const quantite = reference.calcul.quantite(config);
        const longueur = reference.calcul.longueur
          ? reference.calcul.longueur(config)
          : null;

        // N'inclut que si quantité > 0
        if (quantite > 0) {
          activeRefs[categorie].push({
            code,
            nom: reference.nom,
            description: reference.description,
            unite: reference.unite,
            quantite,
            longueur: longueur,
            longueurTotale: longueur ? quantite * longueur : null,
            couleur: getSelectedColor(reference, config),
            reference: reference, // Garde la référence complète pour le SVG
          });
        }
      }
    });
  });

  return activeRefs;
}

// Fonction pour déterminer la couleur sélectionnée
function getSelectedColor(reference, config) {
  if (!reference.couleurs) return null;

  // Logique pour déterminer la couleur selon le type de produit
  if (reference.nom.includes("Profil")) {
    return config.options.colorProfile;
  } else if (reference.nom.includes("Béquille")) {
    return config.porte?.colorBequille || "noir";
  } else if (reference.nom.includes("Joint")) {
    return config.options.colorJoint;
  }

  return reference.couleurs[0]; // Couleur par défaut
}

// Fonction pour générer les tableaux HTML
function generateTables(activeRefs) {
  const container =
    document.getElementById("tables-container") || createTablesContainer();
  container.innerHTML = "";

  Object.entries(activeRefs).forEach(([categorie, references]) => {
    if (references.length > 0) {
      const table = createTable(categorie, references);
      container.appendChild(table);
    }
  });
}

// Crée le conteneur des tableaux s'il n'existe pas
function createTablesContainer() {
  const container = document.createElement("div");
  container.id = "tables-container";
  container.style.cssText =
    "margin: 20px; padding: 20px; border: 1px solid #ccc;";
  document.body.appendChild(container);
  return container;
}

// Crée un tableau pour une catégorie
function createTable(categorie, references) {
  const section = document.createElement("section");
  section.innerHTML = `
    <h3>${categorie.charAt(0).toUpperCase() + categorie.slice(1)}</h3>
    <table border="1" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
      <thead>
        <tr>
          <th>Code</th>
          <th>Désignation</th>
          <th>Quantité</th>
          <th>Unité</th>
          ${
            references[0].longueur !== null
              ? "<th>Longueur unitaire (mm)</th><th>Longueur totale (mm)</th>"
              : ""
          }
          <th>Couleur</th>
        </tr>
      </thead>
      <tbody>
        ${references
          .map(
            (ref) => `
          <tr>
            <td>${ref.code}</td>
            <td>${ref.nom}</td>
            <td>${ref.quantite}</td>
            <td>${ref.unite}</td>
            ${
              ref.longueur !== null
                ? `<td>${ref.longueur}</td><td>${ref.longueurTotale}</td>`
                : ""
            }
            <td>${ref.couleur || "-"}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  return section;
}

// Fonction principale à appeler lors des changements de config
function updateReferencesAndTables() {
  const activeRefs = calculateActiveReferences(config);
  generateTables(activeRefs);
  console.log("Références actives:", activeRefs);
  return activeRefs;
}

// Hook dans le système de mise à jour de config existant
const originalUpdateConfigForTables = updateConfig;
updateConfig = function (key, value, inputElement) {
  // Appelle la fonction originale
  originalUpdateConfigForTables(key, value, inputElement);

  // Met à jour les tableaux
  updateReferencesAndTables();
};
