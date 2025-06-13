// ===== js/rendering/SVGRenderer.js =====
export class SVGRenderer {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.svg = document.getElementById("svg-preview");
    this.scale = 1;
    this.origin = { x: 50, y: 500 };

    this.init();
  }

  init() {
    this.eventBus.on("configChanged", (config) => {
      this.render(config);
    });
  }

  render(config) {
    try {
      this.clearSVG();
      this.calculateScale(config);

      const profileColor = this.getProfileColorHex(
        config.options?.colorProfile
      );

      // Modifier le fond du SVG si profil blanc
      if (profileColor === "#ffffff") {
        this.svg.style.backgroundColor = "#ddd";
      } else {
        this.svg.style.backgroundColor = "white"; // ou ce que tu veux en fond normal
      }

      this.drawModules(config, profileColor);

      if (config.type === "porte") {
        this.drawPorte(config, profileColor);
      }
    } catch (error) {
      console.error("\u274C Erreur rendu SVG:", error);
    }
  }

  clearSVG() {
    this.svg.innerHTML = "";
  }

  calculateScale(config) {
    const maxWidth = 800;
    const maxHeight = 450;

    const scaleX = maxWidth / config.width;
    const scaleY = maxHeight / config.height;

    this.scale = Math.min(scaleX, scaleY);

    const scaledWidth = config.width * this.scale;
    const scaledHeight = config.height * this.scale;

    this.origin = {
      x: (900 - scaledWidth) / 2,
      y: 550 - (550 - scaledHeight) / 2,
    };
  }

  getProfileColorHex(colorProfile) {
    switch (colorProfile) {
      case "noir":
        return "#222";
      case "gris":
        return "#999";
      case "blanc":
        return "#ffffff";
      default:
        return "#222";
    }
  }

  drawModules(config, profileColor) {
    let currentX = this.origin.x;

    for (let i = 0; i < config.modulesCount; i++) {
      const module = config.modules[i];
      const isPorteModule =
        config.type === "porte" && config.porteIndex === i + 1;

      const moduleWidth = module.width * this.scale;
      const height = config.height * this.scale;

      // --- Profil gauche du module ---
      if (i === 0 || isPorteModule) {
        const x = currentX;
        const y = this.origin.y - height;

        if (isPorteModule) {
          const dormantThickness = 51 * this.scale;
          this.porteDormantGaucheX = currentX;
          console.log(
            "✅ Mémorisation porteDormantGaucheX =",
            this.porteDormantGaucheX
          );
          this.drawRect(x, y, dormantThickness, height, profileColor);
          currentX += dormantThickness;
        } else {
          const frameThickness = 40 * this.scale;
          this.drawRect(x, y, frameThickness, height, profileColor);
          currentX += frameThickness;
        }
      }

      // --- Profils horizontaux du module ---
      const topY = this.origin.y - height;
      const bottomY = this.origin.y - 40 * this.scale;

      if (isPorteModule) {
        if (config.porte?.withImposte) {
          const frameThickness = 40 * this.scale;
          this.drawRect(
            currentX,
            topY,
            moduleWidth,
            frameThickness,
            profileColor
          );

          const dormantThickness = 51 * this.scale;
          const yDormant =
            this.origin.y - (config.porte?.porteHeight + 66) * this.scale;
          this.drawRect(
            currentX,
            yDormant,
            moduleWidth,
            dormantThickness,
            profileColor
          );
        } else if (config.porte?.withDormant) {
          const dormantThickness = 51 * this.scale;
          this.drawRect(
            currentX,
            topY,
            moduleWidth,
            dormantThickness,
            profileColor
          );
        }
        // En bas : rien
      } else {
        // PC40 haut + bas prolongés jusqu'au prochain module porte ou bord droit
        let totalWidth = moduleWidth;

        for (let j = i + 1; j < config.modulesCount; j++) {
          const isNextPorteModule =
            config.type === "porte" && config.porteIndex === j + 1;
          if (isNextPorteModule) break;

          totalWidth += config.modules[j].width * this.scale;
        }

        const frameThickness = 40 * this.scale;
        this.drawRect(currentX, topY, totalWidth, frameThickness, profileColor);
        this.drawRect(
          currentX,
          bottomY,
          totalWidth,
          frameThickness,
          profileColor
        );

        // Traverses horizontales du module courant
        const traverses = config.traverses || [];
        traverses.forEach((traverse) => {
          if (traverse.modules.includes(i + 1)) {
            const traverseY =
              this.origin.y - traverse.height * this.scale - 20 * this.scale;
            const traverseThickness = 40 * this.scale;
            this.drawRect(
              currentX,
              traverseY,
              moduleWidth,
              traverseThickness,
              profileColor
            );
          }
        });
      }

      // --- Séparateur vertical (droite du module) ---
      if (i < config.modulesCount - 1) {
        const nextIsPorteModule =
          config.type === "porte" && config.porteIndex === i + 2;
        const x = currentX + moduleWidth;
        const y = this.origin.y - height;

        if (isPorteModule) {
          // Si le module courant est la porte → dormant 51mm à droite
          const dormantThickness = 51 * this.scale;
          const dormantDroitX = currentX + moduleWidth;
          this.porteDormantDroitX = dormantDroitX;
          console.log(
            "✅ Mémorisation porteDormantDroitX =",
            this.porteDormantDroitX
          );
          this.drawRect(
            currentX + moduleWidth,
            y,
            dormantThickness,
            height,
            profileColor
          );
        } else {
          if (nextIsPorteModule) {
            const dormantThickness = 51 * this.scale;
            const dormantDroitX = currentX + moduleWidth;
            this.porteDormantDroitX = dormantDroitX;
            console.log(
              "✅ Mémorisation porteDormantDroitX =",
              this.porteDormantDroitX
            );
            this.drawRect(
              currentX + moduleWidth,
              y,
              dormantThickness,
              height,
              profileColor
            );
          } else {
            const pt40Thickness = 40 * this.scale;
            this.drawRect(
              currentX + moduleWidth,
              y,
              pt40Thickness,
              height,
              profileColor
            );
          }
        }
      }

      // --- Avancer X de la largeur du module ---
      currentX += moduleWidth;
    }
    // --- Profil vertical droit de la verrière (après le dernier module) ---
    const lastModule = config.modules[config.modulesCount - 1];
    const isLastPorteModule =
      config.type === "porte" && config.porteIndex === config.modulesCount;
    const height = config.height * this.scale;
    const y = this.origin.y - height;

    if (isLastPorteModule) {
      const dormantThickness = 51 * this.scale;
      const dormantDroitX = currentX;
      this.porteDormantDroitX = dormantDroitX;
      console.log(
        "✅ Mémorisation porteDormantDroitX =",
        this.porteDormantDroitX
      );
      this.drawRect(currentX, y, dormantThickness, height, profileColor);
    } else {
      const pt40Thickness = 40 * this.scale;
      this.drawRect(currentX, y, pt40Thickness, height, profileColor);
    }
  }

  getDormantTopY(config) {
    return this.origin.y - config.height * this.scale;
  }

  getDormantHeight(config) {
    return config.height * this.scale;
  }

  getPorteProfiles(config) {
    const serrure = config.porte?.serrure;
    const charniereType = config.porte?.charniereType;
    const sensOuverture = config.porte?.sensOuverture;
    const withTierce = config.porte?.withTierce;

    // Profils porte
    let porteGauche = 40;
    let porteDroite = 40;

    // Profils tierce
    let tierceGauche = 40;
    let tierceDroite = 40;

    if (sensOuverture === "droit") {
      if (charniereType === "visible") {
        tierceGauche = 40;
        tierceDroite = 40;
        if (serrure === "SERPEN35M") {
          porteGauche = 66;
          porteDroite = 40;
        } else {
          porteGauche = 40;
          porteDroite = 40;
        }
      } else {
        // invisible
        tierceGauche = 53;
        tierceDroite = 40;
        if (serrure === "SERPEN35M") {
          porteGauche = 66;
          porteDroite = 53;
        } else {
          porteGauche = 40;
          porteDroite = 53;
        }
      }

      if (withTierce === true || withTierce === "true") {
        return {
          tierceGauche,
          tierceDroite,
          porteGauche,
          porteDroite,
        };
      } else {
        return {
          porteGauche,
          porteDroite,
        };
      }
    } else {
      tierceGauche = 40;
      tierceDroite = 40;
      if (charniereType === "visible") {
        if (serrure === "SERPEN35M") {
          porteGauche = 40;
          porteDroite = 66;
        } else {
          porteGauche = 40;
          porteDroite = 40;
        }
      } else {
        // invisible
        tierceGauche = 40;
        tierceDroite = 53;
        if (serrure === "SERPEN35M") {
          porteGauche = 53;
          porteDroite = 66;
        } else {
          porteGauche = 53;
          porteDroite = 40;
        }
      }

      if (withTierce === true || withTierce === "true") {
        return {
          porteGauche,
          porteDroite,
          tierceGauche,
          tierceDroite,
        };
      } else {
        return {
          porteGauche,
          porteDroite,
        };
      }
    }
  }

  drawPorte(config, profileColor) {
    const scale = this.scale;
    const height = config.height * scale;

    // Valeur d'espacement configurable
    const spacing = 8 * scale;

    // Sécurisation
    if (typeof this.porteDormantGaucheX !== "number") {
      console.warn(
        "⚠️ porteDormantGaucheX non défini → on ne dessine pas la porte"
      );
      return;
    }

    if (typeof this.porteDormantDroitX !== "number") {
      console.warn(
        "⚠️ porteDormantDroitX non défini → on ne dessine pas la porte"
      );
      return;
    }

    // Récupérer les profils
    const profiles = this.getPorteProfiles(config);
    const keys = Object.keys(profiles);

    // Largeurs nettes de la porte et de la tierce (en mm)
    const porteWidthMM = Number(config.porte?.porteWidth || 0);
    const tierceWidthMM =
      config.porte?.withTierce === true || config.porte?.withTierce === "true"
        ? Number(config.porte?.tierceWidth || 0)
        : 0;

    // Espace disponible entre les 2 PTPV51/PTCI51
    const dormantGaucheX = this.porteDormantGaucheX;
    const dormantDroitX = this.porteDormantDroitX;
    const dormantThickness = 51 * scale;

    const availableSpace = dormantDroitX - (dormantGaucheX + dormantThickness);

    // Nombre d'espacements :
    let spacingsCount = 2; // entre dormant gauche et 1er profil + dernier profil et dormant droit
    spacingsCount += keys.length - 1; // entre chaque profil

    const totalSpacing = spacingsCount * spacing;

    // Total épaisseurs de profils
    let totalProfilesThickness = 0;
    for (const key of keys) {
      totalProfilesThickness += profiles[key] * scale;
    }

    // Espace restant pour les largeurs nettes (porte et tierce)
    const spaceForWidths =
      availableSpace - totalSpacing - totalProfilesThickness;

    // Calcul des ratios
    const sumWidthsMM = porteWidthMM + tierceWidthMM;
    const porteRatio = porteWidthMM / sumWidthsMM;
    const tierceRatio = tierceWidthMM / sumWidthsMM;

    // Largeurs réelles en px
    const porteWidthPx = porteRatio * spaceForWidths;
    const tierceWidthPx = tierceRatio * spaceForWidths;

    // --- Calcul de la hauteur des profils ---
    let profileHeight;

    if (
      config.porte?.withImposte === true ||
      config.porte?.withImposte === "true"
    ) {
      // Il faut être "spacing" en dessous du dormant imposte
      const yDormant =
        this.origin.y - (config.porte?.porteHeight + 66) * this.scale;
      const dormantThicknessImposte = 51 * this.scale;
      const bottomOfDormant = yDormant + dormantThicknessImposte;
      profileHeight = this.origin.y - bottomOfDormant - spacing;
    } else if (
      config.porte?.withDormant === true ||
      config.porte?.withDormant === "true"
    ) {
      // On enlève 51 mm + spacing
      profileHeight = height - (51 * scale + spacing);
    } else {
      // Cas par défaut : pleine hauteur
      profileHeight = height;
    }

    // --- On dessine les profils ---
    let currentX = dormantGaucheX + dormantThickness + spacing;

    let tierceStartX = null;
    let porteStartX = null;

    for (const key of keys) {
      const thickness = profiles[key] * scale;

      // Dessin du profil vertical "posé au sol"
      const yProfile = this.origin.y - profileHeight;
      this.drawRect(currentX, yProfile, thickness, profileHeight, profileColor);

      // Avancer après le profil + spacing
      currentX += thickness + spacing;

      // Si c'est un "profil gauche", on mémorise la position de départ
      if (key === "tierceGauche") {
        tierceStartX = currentX - spacing;
        currentX += tierceWidthPx;
      }
      if (key === "porteGauche") {
        porteStartX = currentX - spacing;
        currentX += porteWidthPx;
      }
    }

    // --- Traverses hautes et basses ---
    const traverseThickness = 40 * scale;

    // Traverses tierce
    if (tierceStartX !== null) {
      // Traverse haute tierce
      this.drawRect(
        tierceStartX,
        this.origin.y - profileHeight,
        tierceWidthPx + spacing,
        traverseThickness,
        profileColor
      );

      // Traverse basse tierce
      this.drawRect(
        tierceStartX,
        this.origin.y - traverseThickness,
        tierceWidthPx + spacing,
        traverseThickness,
        profileColor
      );
    }

    // Traverses porte
    if (porteStartX !== null) {
      // Traverse haute porte
      this.drawRect(
        porteStartX,
        this.origin.y - profileHeight,
        porteWidthPx + spacing,
        traverseThickness,
        profileColor
      );

      // Traverse basse porte
      this.drawRect(
        porteStartX,
        this.origin.y - traverseThickness,
        porteWidthPx + spacing,
        traverseThickness,
        profileColor
      );
    }

    // --- Traverses intermédiaires (porte et tierce) ---
    const traversesPorte = config.traversesPorte || [];

    traversesPorte.forEach((traverse) => {
      const traverseY = this.origin.y - traverse.height * scale - 20 * scale;
      const traverseThickness = Number(traverse.type) * scale; // 28 mm ou 37 mm

      // Traverse sur la tierce
      if (traverse.onTierce && tierceStartX !== null) {
        this.drawRect(
          tierceStartX,
          traverseY,
          tierceWidthPx,
          traverseThickness,
          profileColor
        );
      }

      // Traverse sur la porte
      if (traverse.onPorte && porteStartX !== null) {
        this.drawRect(
          porteStartX,
          traverseY,
          porteWidthPx,
          traverseThickness,
          profileColor
        );
      }
    });
  }

  drawRect(x, y, width, height, color) {
    const rect = this.createSVGElement("rect", {
      x,
      y,
      width,
      height,
      fill: color,
      stroke: "none",
      // "stroke-width": 1,
    });

    this.svg.appendChild(rect);
  }

  createSVGElement(tag, attrs) {
    const elem = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attrs)) {
      elem.setAttribute(key, value);
    }
    return elem;
  }
}
