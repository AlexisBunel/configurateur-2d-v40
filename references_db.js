const REFERENCES_DB = {
  profils: {
    // Profil cadre de verrière
    PCV40: {
      nom: "PROFIL CADRE V40",
      description: "Profil de cadre périphérique de la verrière",
      unite: "mm",
      couleurs: ["noir", "gris", "blanc"],
      calcul: {
        variantes: (config) => {
          const variantes = [];
          const hauteur = config.height || 2500;
          const largeur = config.width || 4000;
          const hasPorte = config.type === "porte";
          const porteIndex = config.porteIndex || 1;
          const modulesCount = config.modulesCount || 1;
          const withImposte = config.porte?.withImposte || false;
          let dimensionsOuverture = null;

          // PROFILS CADRES VERTICAUX (gauche et droite)
          let quantiteVerticale = 2; // Par défaut, gauche + droite

          // PROFILS CADRES HORIZONTAUX
          let quantiteHorizontale = 2;

          if (hasPorte) {
            dimensionsOuverture = calculateDimensionsOuverture(config);

            if (porteIndex === 1 || porteIndex === modulesCount) {
              quantiteVerticale = 1;
            }

            variantes.push({
              type: "vertical",
              longueur: hauteur,
              quantite: quantiteVerticale,
              description: `Profil cadre vertical`,
            });

            if (withImposte) {
              let longeurGauche = 0;
              let longeurDroite = 0;
              let longueurImposte = dimensionsOuverture.largeur - 102;
              if (porteIndex === 1) {
                longeurDroite = largeur - dimensionsOuverture.largeur - 40;
              } else if (porteIndex === modulesCount) {
                longeurGauche = largeur - dimensionsOuverture.largeur - 40;
              } else {
                // Calculer la largeur à gauche de la porte
                for (let i = 1; i < porteIndex; i++) {
                  const moduleWidth =
                    config.modules?.[i - 1]?.width || largeur / modulesCount;
                  longeurGauche += moduleWidth;
                }
                longeurGauche += (porteIndex - 2) * 40;

                // Calculer la largeur à droite de la porte
                for (let i = porteIndex + 1; i <= modulesCount; i++) {
                  const moduleWidth =
                    config.modules?.[i - 1]?.width || largeur / modulesCount;
                  longeurDroite += moduleWidth;
                }
                // Ajouter les profils intermédiaires à droite
                longeurDroite += (modulesCount - porteIndex - 1) * 40;
              }
              if (longeurGauche > 0) {
                variantes.push({
                  type: "horizontal_haut_gauche",
                  longueur: longeurGauche,
                  quantite: 2,
                  description: `Profil cadre horizontal`,
                });
              }

              if (longeurDroite > 0) {
                variantes.push({
                  type: "horizontal_haut_droite",
                  longueur: longeurDroite,
                  quantite: 2,
                  description: `Profil cadre horizontal`,
                });
              }

              // Profil de l'imposte
              variantes.push({
                type: "horizontal_imposte",
                longueur: longueurImposte,
                quantite: 1,
                description: `Profil cadre imposte`,
              });
            }
          } else {
            variantes.push({
              type: "vertical",
              longueur: hauteur,
              quantite: quantiteVerticale,
              description: `Profil cadre vertical`,
            });

            variantes.push({
              type: "horizontal",
              longueur: largeur - 80,
              quantite: quantiteHorizontale,
              description: `Profil cadre vertical`,
            });
          }
          return variantes;
        },
        conditions: (config) => true, // Toujours présent
      },
    },

    // Autres profils à définir...
    // TODO: Ajouter les profils intermédiaires, profils de porte, traverses, etc.
  },

  accessoires: {
    // TODO: Définir les accessoires selon vos spécifications
  },

  remplissages: {
    // TODO: Définir les remplissages selon vos spécifications
  },
};

// Fonction utilitaire pour récupérer tous les éléments actifs selon une config
function getActiveReferences(config) {
  const result = {
    profils: [],
    accessoires: [],
    remplissages: [],
  };

  // Parcourir chaque catégorie
  Object.keys(REFERENCES_DB).forEach((categorie) => {
    Object.entries(REFERENCES_DB[categorie]).forEach(([code, reference]) => {
      if (reference.calcul.conditions(config)) {
        // Cas spécial pour les éléments avec variantes
        if (reference.calcul.variantes) {
          const variantes = reference.calcul.variantes(config);

          variantes.forEach((variante, index) => {
            if (variante.quantite > 0) {
              result[categorie].push({
                code: index === 0 ? code : `${code}_${variante.type}`, // Code unique pour chaque variante
                codeBase: code, // Code de base pour regroupement
                nom: reference.nom,
                description: variante.description || reference.description,
                unite: reference.unite,
                quantite: variante.quantite,
                longueur: variante.longueur,
                couleur: config.options?.colorProfile || "noir",
                type: variante.type, // Type spécifique (vertical, horizontal_haut, etc.)
              });
            }
          });
        }
        // Cas normal pour les autres éléments
        else {
          const quantite = reference.calcul.quantite(config);
          if (quantite > 0) {
            result[categorie].push({
              code,
              codeBase: code,
              nom: reference.nom,
              description: reference.description,
              unite: reference.unite,
              quantite,
              longueur: reference.calcul.longueur
                ? reference.calcul.longueur(config)
                : null,
              couleur: config.options?.colorProfile || "noir",
            });
          }
        }
      }
    });
  });

  return result;
}
