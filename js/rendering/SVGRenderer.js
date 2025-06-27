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

      if (profileColor === "#ffffff") {
        this.svg.style.backgroundColor = "#ddd";
      } else {
        this.svg.style.backgroundColor = "white";
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

      if (i === 0 || isPorteModule) {
        const x = currentX;
        const y = this.origin.y - height;

        if (isPorteModule) {
          const dormantThickness = 51 * this.scale;
          this.porteDormantGaucheX = currentX;
          console.log(
            "Mémorisation porteDormantGaucheX =",
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
      } else {
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

      if (i < config.modulesCount - 1) {
        const nextIsPorteModule =
          config.type === "porte" && config.porteIndex === i + 2;
        const x = currentX + moduleWidth;
        const y = this.origin.y - height;

        if (isPorteModule) {
          const dormantThickness = 51 * this.scale;
          const dormantDroitX = currentX + moduleWidth;
          this.porteDormantDroitX = dormantDroitX;
          console.log(
            "Mémorisation porteDormantDroitX =",
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
              "Mémorisation porteDormantDroitX =",
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
      currentX += moduleWidth;
    }

    const lastModule = config.modules[config.modulesCount - 1];
    const isLastPorteModule =
      config.type === "porte" && config.porteIndex === config.modulesCount;
    const height = config.height * this.scale;
    const y = this.origin.y - height;

    if (isLastPorteModule) {
      const dormantThickness = 51 * this.scale;
      const dormantDroitX = currentX;
      this.porteDormantDroitX = dormantDroitX;
      console.log("Mémorisation porteDormantDroitX =", this.porteDormantDroitX);
      this.drawRect(currentX, y, dormantThickness, height, profileColor);
    } else {
      const pt40Thickness = 40 * this.scale;
      this.drawRect(currentX, y, pt40Thickness, height, profileColor);
    }
  }

  getPorteProfiles(config) {
    const serrure = config.porte?.serrure;
    const charniereType = config.porte?.charniereType;
    const sensOuverture = config.porte?.sensOuverture;
    const withTierce = config.porte?.withTierce;

    let porteGauche = 40;
    let porteDroite = 40;

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

    const spacing = 8 * scale;

    if (typeof this.porteDormantGaucheX !== "number") {
      console.warn(
        "porteDormantGaucheX non défini → on ne dessine pas la porte"
      );
      return;
    }

    if (typeof this.porteDormantDroitX !== "number") {
      console.warn(
        "porteDormantDroitX non défini → on ne dessine pas la porte"
      );
      return;
    }

    const profiles = this.getPorteProfiles(config);
    const keys = Object.keys(profiles);

    const porteWidthMM = Number(config.porte?.porteWidth || 0);
    const tierceWidthMM =
      config.porte?.withTierce === true || config.porte?.withTierce === "true"
        ? Number(config.porte?.tierceWidth || 0)
        : 0;

    const dormantGaucheX = this.porteDormantGaucheX;
    const dormantDroitX = this.porteDormantDroitX;
    const dormantThickness = 51 * scale;

    const availableSpace = dormantDroitX - (dormantGaucheX + dormantThickness);

    let spacingsCount = 2;
    spacingsCount += keys.length - 1;

    const totalSpacing = spacingsCount * spacing;

    let totalProfilesThickness = 0;
    for (const key of keys) {
      totalProfilesThickness += profiles[key] * scale;
    }

    const spaceForWidths =
      availableSpace - totalSpacing - totalProfilesThickness;

    const sumWidthsMM = porteWidthMM + tierceWidthMM;
    const porteRatio = porteWidthMM / sumWidthsMM;
    const tierceRatio = tierceWidthMM / sumWidthsMM;

    const porteWidthPx = porteRatio * spaceForWidths;
    const tierceWidthPx = tierceRatio * spaceForWidths;

    let profileHeight;

    if (
      config.porte?.withImposte === true ||
      config.porte?.withImposte === "true"
    ) {
      const yDormant =
        this.origin.y - (config.porte?.porteHeight + 66) * this.scale;
      const dormantThicknessImposte = 51 * this.scale;
      const bottomOfDormant = yDormant + dormantThicknessImposte;
      profileHeight = this.origin.y - bottomOfDormant - spacing;
    } else if (
      config.porte?.withDormant === true ||
      config.porte?.withDormant === "true"
    ) {
      profileHeight = height - (51 * scale + spacing);
    } else {
      profileHeight = height;
    }

    let currentX = dormantGaucheX + dormantThickness + spacing;

    let tierceStartX = null;
    let porteStartX = null;

    for (const key of keys) {
      const thickness = profiles[key] * scale;

      const yProfile = this.origin.y - profileHeight;
      this.drawRect(currentX, yProfile, thickness, profileHeight, profileColor);

      currentX += thickness + spacing;

      if (key === "tierceGauche") {
        tierceStartX = currentX - spacing;
        currentX += tierceWidthPx;
      }
      if (key === "porteGauche") {
        porteStartX = currentX - spacing;
        currentX += porteWidthPx;
      }
    }

    const traverseThickness = 40 * scale;

    if (tierceStartX !== null) {
      this.drawRect(
        tierceStartX,
        this.origin.y - profileHeight,
        tierceWidthPx + spacing,
        traverseThickness,
        profileColor
      );

      this.drawRect(
        tierceStartX,
        this.origin.y - traverseThickness,
        tierceWidthPx + spacing,
        traverseThickness,
        profileColor
      );
    }

    if (porteStartX !== null) {
      this.drawRect(
        porteStartX,
        this.origin.y - profileHeight,
        porteWidthPx + spacing,
        traverseThickness,
        profileColor
      );

      this.drawRect(
        porteStartX,
        this.origin.y - traverseThickness,
        porteWidthPx + spacing,
        traverseThickness,
        profileColor
      );
    }

    const traversesPorte = config.traversesPorte || [];

    traversesPorte.forEach((traverse) => {
      const traverseY = this.origin.y - traverse.height * scale - 20 * scale;
      const traverseThickness = Number(traverse.type) * scale;

      if (traverse.onTierce && tierceStartX !== null) {
        this.drawRect(
          tierceStartX,
          traverseY,
          tierceWidthPx,
          traverseThickness,
          profileColor
        );
      }

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
