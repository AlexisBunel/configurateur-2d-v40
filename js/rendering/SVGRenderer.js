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
      if (profileColor === "#ddd") {
        this.svg.style.backgroundColor = "#e9ecef";
      } else {
        this.svg.style.backgroundColor = "white"; // ou ce que tu veux en fond normal
      }

      this.drawModules(config, profileColor);
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
        return "#ddd";
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
