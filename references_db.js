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

          // PROFILS CADRES VERTICAUX (gauche et droite)
          let quantiteVerticale = 2; // Par défaut, gauche + droite

          if (hasPorte) {
            // Si porte sur premier module (index 1) ou dernier module
            if (porteIndex === 1 || porteIndex === modulesCount) {
              quantiteVerticale = 1; // Un seul côté a le cadre
            }
          }

          if (quantiteVerticale > 0) {
            variantes.push({
              type: "vertical",
              longueur: hauteur,
              quantite: quantiteVerticale,
              description: `Profil cadre vertical ${hauteur}mm`,
            });
          }

          // PROFILS CADRES HORIZONTAUX (haut et bas)
          if (hasPorte && withImposte) {
            // Avec imposte : profil haut interrompu au niveau de la porte
            const largeurPorteModule = config.porte?.porteWidth || 730;
            const largeurTierce = config.porte?.withTierce
              ? config.porte?.tierceWidth || 350
              : 0;
            const largeurOuverture = largeurPorteModule + largeurTierce;

            // Calculer les longueurs de part et d'autre de l'ouverture
            let largeurGauche = 0;
            let largeurDroite = 0;

            // Position de l'ouverture selon l'index de la porte
            for (let i = 1; i <= modulesCount; i++) {
              const moduleWidth =
                config.modules?.[i - 1]?.width || largeur / modulesCount;

              if (i < porteIndex) {
                largeurGauche += moduleWidth;
              } else if (i > porteIndex) {
                largeurDroite += moduleWidth;
              }
            }

            // Profil haut - partie gauche
            if (largeurGauche > 0) {
              variantes.push({
                type: "horizontal_haut_gauche",
                longueur: largeurGauche,
                quantite: 1,
                description: `Profil cadre haut gauche ${largeurGauche}mm (avec imposte)`,
              });
            }

            // Profil haut - partie droite
            if (largeurDroite > 0) {
              variantes.push({
                type: "horizontal_haut_droite",
                longueur: largeurDroite,
                quantite: 1,
                description: `Profil cadre haut droite ${largeurDroite}mm (avec imposte)`,
              });
            }

            // Profil bas - pleine largeur
            variantes.push({
              type: "horizontal_bas",
              longueur: largeur,
              quantite: 1,
              description: `Profil cadre bas ${largeur}mm`,
            });
          } else {
            // Sans imposte OU sans porte : profils haut et bas pleine largeur
            variantes.push({
              type: "horizontal_haut",
              longueur: largeur,
              quantite: 1,
              description: `Profil cadre haut ${largeur}mm`,
            });

            variantes.push({
              type: "horizontal_bas",
              longueur: largeur,
              quantite: 1,
              description: `Profil cadre bas ${largeur}mm`,
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
