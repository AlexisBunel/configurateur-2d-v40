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
          const porteIndex = parseInt(config.porteIndex) || 1; // ← CONVERSION
          const modulesCount = parseInt(config.modulesCount) || 1; // ← CONVERSION
          const withImposte = config.porte?.withImposte || false;

          // FORCER LA SYNCHRONISATION DES MODULES
          if (typeof syncModulesToConfig === "function") {
            syncModulesToConfig(config);
            console.log("🔄 Modules synchronisés:", config.modules);
          } else {
            // Alternative : récupérer les largeurs depuis le DOM
            console.log(
              "⚠️ syncModulesToConfig non disponible, lecture DOM..."
            );
            if (!config.modules) config.modules = [];

            for (let i = 1; i <= modulesCount; i++) {
              const input = document.getElementById(`widthModule${i}`);
              if (input && input.value) {
                const moduleIndex = i - 1;
                if (!config.modules[moduleIndex]) {
                  config.modules[moduleIndex] = {};
                }
                config.modules[moduleIndex].width =
                  parseInt(input.value) || largeur / modulesCount;
                console.log(
                  `📝 Module ${i} depuis DOM: ${config.modules[moduleIndex].width}mm`
                );
              }
            }
          }

          console.log("🔍 Calcul PCV40 - Config:", {
            hasPorte,
            porteIndex: typeof porteIndex + " = " + porteIndex,
            modulesCount: typeof modulesCount + " = " + modulesCount,
            withImposte,
          });

          if (!hasPorte) {
            // ============= CAS SANS PORTE =============
            console.log("📝 Cas sans porte");

            variantes.push({
              type: "vertical",
              longueur: hauteur,
              quantite: 2, // Gauche + droite
              description: `Profil cadre vertical`,
            });

            variantes.push({
              type: "horizontal",
              longueur: largeur - 80, // -40mm de chaque côté
              quantite: 2, // Haut + bas
              description: `Profil cadre horizontal`,
            });
          } else {
            // ============= CAS AVEC PORTE =============
            console.log("🚪 Cas avec porte");

            const dimensionsOuverture = calculateDimensionsOuverture(config);
            console.log("📐 Dimensions ouverture:", dimensionsOuverture);

            // PROFILS VERTICAUX
            let quantiteVerticale = 2; // Par défaut gauche + droite

            // Si la porte est sur un côté, on enlève un profil vertical
            if (porteIndex === 1 || porteIndex === modulesCount) {
              quantiteVerticale = 1;
              console.log(
                `📍 Porte en position ${porteIndex}, profils verticaux: ${quantiteVerticale}`
              );
            }

            variantes.push({
              type: "vertical",
              longueur: hauteur,
              quantite: quantiteVerticale,
              description: `Profil cadre vertical`,
            });

            // PROFILS HORIZONTAUX
            if (!withImposte) {
              // ===== SANS IMPOSTE =====
              console.log("🔸 Sans imposte");

              if (porteIndex === 1) {
                // Porte à gauche : profil horizontal seulement à droite
                const longueurDroite =
                  largeur - dimensionsOuverture.largeur - 40;
                console.log(
                  `➡️ Porte à gauche, longueur droite: ${longueurDroite}mm`
                );

                if (longueurDroite > 0) {
                  variantes.push({
                    type: "horizontal_droite",
                    longueur: longueurDroite,
                    quantite: 2, // Haut + bas
                    description: `Profil cadre horizontal`,
                  });
                }
              } else if (porteIndex === modulesCount) {
                // Porte à droite : profil horizontal seulement à gauche
                const longueurGauche =
                  largeur - dimensionsOuverture.largeur - 40;
                console.log(
                  `⬅️ Porte à droite, longueur gauche: ${longueurGauche}mm`
                );

                if (longueurGauche > 0) {
                  variantes.push({
                    type: "horizontal_gauche",
                    longueur: longueurGauche,
                    quantite: 2, // Haut + bas
                    description: `Profil cadre horizontal`,
                  });
                }
              } else {
                // Porte au centre : profils horizontaux des deux côtés
                console.log("🎯 Porte au centre");

                // Calculer la largeur à gauche de la porte
                let longueurGauche = 0;
                console.log(`🔍 Calcul gauche - porteIndex: ${porteIndex}`);

                for (let i = 1; i < porteIndex; i++) {
                  const moduleIndex = i - 1; // Index dans le tableau (commence à 0)
                  const moduleWidth =
                    config.modules?.[moduleIndex]?.width ||
                    largeur / modulesCount;

                  console.log(
                    `📏 Module ${i} (index ${moduleIndex}): ${moduleWidth}mm`
                  );
                  console.log(
                    `   config.modules[${moduleIndex}]:`,
                    config.modules?.[moduleIndex]
                  );

                  longueurGauche += moduleWidth;
                }
                // Ajouter les profils entre les modules à gauche
                const profilsGauche = Math.max(0, porteIndex - 2); // Nombre de profils entre modules
                longueurGauche += profilsGauche * 40;
                console.log(
                  `🔗 Profils à gauche: ${profilsGauche} × 40mm = ${
                    profilsGauche * 40
                  }mm`
                );
                console.log(`📊 Total gauche: ${longueurGauche}mm`);

                // Calculer la largeur à droite de la porte
                let longueurDroite = 0;
                console.log(
                  `🔍 Calcul droite - porteIndex: ${porteIndex}, modulesCount: ${modulesCount}`
                );
                console.log(`📋 Modules config:`, config.modules);

                // VÉRIFICATION DE SÉCURITÉ
                if (porteIndex >= modulesCount) {
                  console.error("❌ ERREUR: porteIndex >= modulesCount");
                  return variantes;
                }

                const startIndex = parseInt(porteIndex) + 1;
                const endIndex = parseInt(modulesCount);
                console.log(`🔄 Boucle de ${startIndex} à ${endIndex}`);

                for (let i = startIndex; i <= endIndex; i++) {
                  const moduleIndex = i - 1; // Index dans le tableau (commence à 0)
                  const moduleWidth =
                    config.modules?.[moduleIndex]?.width ||
                    largeur / modulesCount;

                  console.log(
                    `📏 Module ${i} (index ${moduleIndex}): ${moduleWidth}mm`
                  );
                  console.log(
                    `   config.modules[${moduleIndex}]:`,
                    config.modules?.[moduleIndex]
                  );

                  longueurDroite += moduleWidth;
                }
                // Ajouter les profils entre les modules à droite
                const profilsDroite = Math.max(
                  0,
                  modulesCount - porteIndex - 1
                );
                longueurDroite += profilsDroite * 40;
                console.log(
                  `🔗 Profils à droite: ${profilsDroite} × 40mm = ${
                    profilsDroite * 40
                  }mm`
                );
                console.log(`📊 Total droite: ${longueurDroite}mm`);

                console.log(
                  `🔄 Centre - Gauche: ${longueurGauche}mm, Droite: ${longueurDroite}mm`
                );

                if (longueurGauche > 0) {
                  variantes.push({
                    type: "horizontal_gauche",
                    longueur: longueurGauche,
                    quantite: 2,
                    description: `Profil cadre horizontal gauche`,
                  });
                }

                if (longueurDroite > 0) {
                  variantes.push({
                    type: "horizontal_droite",
                    longueur: longueurDroite,
                    quantite: 2,
                    description: `Profil cadre horizontal droite`,
                  });
                }
              }
            } else {
              // ===== AVEC IMPOSTE =====
              console.log("🔹 Avec imposte");

              let longueurGauche = 0;
              let longueurDroite = 0;
              let longueurImposte = dimensionsOuverture.largeur - 102;

              if (porteIndex === 1) {
                // Porte à gauche
                longueurDroite = largeur - dimensionsOuverture.largeur - 40;
              } else if (porteIndex === modulesCount) {
                // Porte à droite
                longueurGauche = largeur - dimensionsOuverture.largeur - 40;
              } else {
                // Porte au centre - même calcul que sans imposte
                for (let i = 1; i < porteIndex; i++) {
                  const moduleWidth =
                    config.modules?.[i - 1]?.width || largeur / modulesCount;
                  longueurGauche += moduleWidth;
                }
                // Profils entre modules à gauche
                longueurGauche += Math.max(0, porteIndex - 2) * 40;

                for (let i = porteIndex + 1; i <= modulesCount; i++) {
                  const moduleWidth =
                    config.modules?.[i - 1]?.width || largeur / modulesCount;
                  longueurDroite += moduleWidth;
                }
                // Profils entre modules à droite
                longueurDroite +=
                  Math.max(0, modulesCount - porteIndex - 1) * 40;
              }

              console.log(
                `🏗️ Imposte - Gauche: ${longueurGauche}mm, Droite: ${longueurDroite}mm, Imposte: ${longueurImposte}mm`
              );

              // Profils horizontaux gauche
              if (longueurGauche > 0) {
                variantes.push({
                  type: "horizontal_haut_gauche",
                  longueur: longueurGauche,
                  quantite: 2, // Haut + bas
                  description: `Profil cadre horizontal`,
                });
              }

              // Profils horizontaux droite
              if (longueurDroite > 0) {
                variantes.push({
                  type: "horizontal_haut_droite",
                  longueur: longueurDroite,
                  quantite: 2, // Haut + bas
                  description: `Profil cadre horizontal`,
                });
              }

              // Profil de l'imposte
              if (longueurImposte > 0) {
                variantes.push({
                  type: "horizontal_imposte",
                  longueur: longueurImposte,
                  quantite: 1,
                  description: `Profil cadre imposte`,
                });
              }
            }
          }

          console.log("✅ Variantes calculées:", variantes);
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
