/**
 * renderer.js - Gestionnaire de rendu SVG
 * Responsable du dessin de la verrière en SVG selon la configuration
 */

/**
 * Gestionnaire de rendu SVG
 */
const Renderer = {
  /**
   * Élément SVG principal
   * @private
   */
  _svg: null,

  /**
   * Dimensions de la zone de dessin
   * @private
   */
  _viewport: {
    width: 900,
    height: 550,
    margin: 50,
  },

  /**
   * Échelle de rendu calculée
   * @private
   */
  _scale: 1,

  /**
   * Point d'origine pour le dessin
   * @private
   */
  _origin: { x: 0, y: 0 },

  /**
   * Initialise le gestionnaire de rendu
   */
  init() {
    console.log("🎨 Initialisation du rendu SVG");

    // Récupère l'élément SVG
    this._svg = document.getElementById("svg-preview");
    if (!this._svg) {
      console.error("❌ Élément SVG non trouvé");
      return;
    }

    // Configure les écouteurs d'événements
    this._setupEventListeners();

    // Premier rendu
    this.render();

    console.log("✅ Rendu SVG initialisé");
  },

  /**
   * Configure les écouteurs d'événements
   * @private
   */
  _setupEventListeners() {
    // Écoute les changements de configuration
    EventBus.on(EVENTS.CONFIG_UPDATED, () => {
      this.render();
    });

    EventBus.on(EVENTS.CONFIG_LOADED, () => {
      this.render();
    });

    EventBus.on(EVENTS.CONFIG_RESET, () => {
      this.render();
    });
  },

  /**
   * Lance le rendu complet de la verrière
   */
  render() {
    try {
      const config = ConfigManager.getConfig();

      // Vide le SVG
      this._clearSVG();

      // Calcule l'échelle et l'origine
      this._calculateScale(config.width, config.height);

      // Dessine la structure principale
      this._drawMainStructure(config);

      // Dessine les modules
      this._drawModules(config);

      // Dessine la porte si applicable
      if (config.type === "porte") {
        this._drawPorte(config);
      }

      // Dessine les traverses
      this._drawTraverses(config);

      // Ajoute les cotations
      this._drawDimensions(config);

      // Émet l'événement de fin de rendu
      EventBus.emit(EVENTS.RENDER_COMPLETED);
    } catch (error) {
      console.error("❌ Erreur de rendu:", error);
      EventBus.emit(EVENTS.ERROR_RENDER, { message: error.message });
    }
  },

  /**
   * Vide le contenu du SVG
   * @private
   */
  _clearSVG() {
    if (this._svg) {
      this._svg.innerHTML = "";
    }
  },

  /**
   * Calcule l'échelle de rendu pour adapter la verrière à la zone d'affichage
   * @private
   */
  _calculateScale(width, height) {
    const availableWidth = this._viewport.width - this._viewport.margin * 2;
    const availableHeight = this._viewport.height - this._viewport.margin * 2;

    // Calcule l'échelle pour que la verrière tienne dans la zone
    const scaleX = availableWidth / width;
    const scaleY = availableHeight / height;
    this._scale = Math.min(scaleX, scaleY);

    // Calcule l'origine pour centrer la verrière
    const scaledWidth = width * this._scale;
    const scaledHeight = height * this._scale;

    this._origin = {
      x: (this._viewport.width - scaledWidth) / 2,
      y: this._viewport.height - (this._viewport.height - scaledHeight) / 2,
    };

    console.log(
      `📐 Échelle calculée: ${this._scale.toFixed(
        3
      )} | Origine: (${this._origin.x.toFixed(1)}, ${this._origin.y.toFixed(
        1
      )})`
    );
  },

  /**
   * Dessine la structure principale de la verrière
   * @private
   */
  _drawMainStructure(config) {
    const rect = this._createSVGElement("rect", {
      x: this._origin.x,
      y: this._origin.y - config.height * this._scale,
      width: config.width * this._scale,
      height: config.height * this._scale,
      fill: "none",
      stroke: "#333",
      "stroke-width": "6",
    });

    this._svg.appendChild(rect);
  },

  /**
   * Dessine les modules de la verrière
   * @private
   */
  _drawModules(config) {
    let currentX = this._origin.x;

    config.moduleWidths.forEach((width, index) => {
      const scaledWidth = width * this._scale;

      // Dessine la séparation entre modules (sauf pour le premier)
      if (index > 0) {
        const line = this._createSVGElement("line", {
          x1: currentX,
          y1: this._origin.y - config.height * this._scale,
          x2: currentX,
          y2: this._origin.y,
          stroke: "#666",
          "stroke-width": "6",
        });
        this._svg.appendChild(line);
      }

      // Marque le module contenant la porte
      if (config.type === "porte" && index === config.porteIndex) {
        const highlight = this._createSVGElement("rect", {
          x: currentX,
          y: this._origin.y - config.height * this._scale,
          width: scaledWidth,
          height: config.height * this._scale,
          fill: "rgba(255, 255, 0, 0.1)",
          stroke: "orange",
          "stroke-width": "1",
          "stroke-dasharray": "3,3",
        });
        this._svg.appendChild(highlight);
      }

      currentX += scaledWidth;
    });
  },

  /**
   * Dessine la porte
   * @private
   */
  _drawPorte(config) {
    // Calcule la position du module contenant la porte
    let moduleX = this._origin.x;
    for (let i = 0; i < config.porteIndex; i++) {
      moduleX += config.moduleWidths[i] * this._scale;
    }

    const moduleWidth = config.moduleWidths[config.porteIndex] * this._scale;
    const porteWidth = config.porte.porteWidth * this._scale;
    const porteHeight = config.porte.porteHeight * this._scale;

    // Centre la porte dans le module
    const porteX = moduleX + (moduleWidth - porteWidth) / 2;
    const porteY = this._origin.y - porteHeight;

    // Dessine le cadre de la porte
    const porteRect = this._createSVGElement("rect", {
      x: porteX,
      y: porteY,
      width: porteWidth,
      height: porteHeight,
      fill: "rgba(200, 200, 255, 0.3)",
      stroke: "#0066cc",
      "stroke-width": "2",
    });
    this._svg.appendChild(porteRect);

    // Dessine l'indication du sens d'ouverture (poignée)
    this._drawPorteHandle(config, porteX, porteY, porteWidth, porteHeight);

    // Dessine la tierce si applicable
    if (config.porte.withTierce) {
      this._drawTierce(config, porteX, porteY, porteWidth, porteHeight);
    }

    // Dessine l'imposte si applicable
    if (config.porte.withImposte) {
      this._drawImposte(config, porteX, porteY, porteWidth, porteHeight);
    }
  },

  /**
   * Dessine l'indication du sens d'ouverture de la porte
   * @private
   */
  _drawPorteHandle(config, porteX, porteY, porteWidth, porteHeight) {
    const handleSize = 8;
    const handleY = porteY + porteHeight / 2;

    let handleX;
    if (config.porte.sensOuverture === "droit") {
      handleX = porteX + porteWidth - 20;
    } else {
      handleX = porteX + 20;
    }

    const handle = this._createSVGElement("circle", {
      cx: handleX,
      cy: handleY,
      r: handleSize,
      fill: "#333",
      stroke: "#000",
      "stroke-width": "1",
    });
    this._svg.appendChild(handle);

    // Ajoute une petite ligne pour indiquer le sens
    const lineLength = 15;
    const lineX2 =
      config.porte.sensOuverture === "droit"
        ? handleX - lineLength
        : handleX + lineLength;

    const sensLine = this._createSVGElement("line", {
      x1: handleX,
      y1: handleY,
      x2: lineX2,
      y2: handleY,
      stroke: "#333",
      "stroke-width": "2",
    });
    this._svg.appendChild(sensLine);
  },

  /**
   * Dessine la tierce
   * @private
   */
  _drawTierce(config, porteX, porteY, porteWidth, porteHeight) {
    const tierceWidth = config.porte.tierceWidth * this._scale;

    const tierce = this._createSVGElement("rect", {
      x: porteX + porteWidth,
      y: porteY,
      width: tierceWidth,
      height: porteHeight,
      fill: "rgba(150, 255, 150, 0.3)",
      stroke: "#00aa00",
      "stroke-width": "1",
      "stroke-dasharray": "2,2",
    });
    this._svg.appendChild(tierce);
  },

  /**
   * Dessine l'imposte
   * @private
   */
  _drawImposte(config, porteX, porteY, porteWidth, porteHeight) {
    const imposteHeight =
      (config.height - config.porte.porteHeight) * this._scale;

    if (imposteHeight > 0) {
      const imposte = this._createSVGElement("rect", {
        x: porteX,
        y: porteY - imposteHeight,
        width: porteWidth,
        height: imposteHeight,
        fill: "rgba(255, 200, 200, 0.3)",
        stroke: "#cc6600",
        "stroke-width": "1",
        "stroke-dasharray": "2,2",
      });
      this._svg.appendChild(imposte);
    }
  },

  /**
   * Dessine les traverses
   * @private
   */
  _drawTraverses(config) {
    // Traverses principales
    config.traverses.forEach((traverse) => {
      const y = this._origin.y - traverse.position * this._scale;

      const line = this._createSVGElement("line", {
        x1: this._origin.x,
        y1: y,
        x2: this._origin.x + config.width * this._scale,
        y2: y,
        stroke: "#aa4400",
        "stroke-width": "3",
      });
      this._svg.appendChild(line);
    });

    // Traverses sur porte (si porte présente)
    if (config.type === "porte" && config.traversesPorte.length > 0) {
      // TODO: Implémenter le dessin des traverses sur porte
    }
  },

  /**
   * Ajoute les cotations
   * @private
   */
  _drawDimensions(config) {
    // Cotation largeur
    this._drawDimension(
      this._origin.x,
      this._origin.y + 30,
      this._origin.x + config.width * this._scale,
      this._origin.y + 30,
      `${config.width}mm`,
      "horizontal"
    );

    // Cotation hauteur
    this._drawDimension(
      this._origin.x - 30,
      this._origin.y,
      this._origin.x - 30,
      this._origin.y - config.height * this._scale,
      `${config.height}mm`,
      "vertical"
    );
  },

  /**
   * Dessine une cotation
   * @private
   */
  _drawDimension(x1, y1, x2, y2, text, orientation) {
    // Ligne de cotation
    const line = this._createSVGElement("line", {
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      stroke: "#666",
      "stroke-width": "1",
    });
    this._svg.appendChild(line);

    // Flèches (simplifiées)
    const arrowSize = 5;

    // Flèche début
    const arrow1 = this._createSVGElement("polygon", {
      points:
        orientation === "horizontal"
          ? `${x1},${y1} ${x1 + arrowSize},${y1 - arrowSize / 2} ${
              x1 + arrowSize
            },${y1 + arrowSize / 2}`
          : `${x1},${y1} ${x1 - arrowSize / 2},${y1 + arrowSize} ${
              x1 + arrowSize / 2
            },${y1 + arrowSize}`,
      fill: "#666",
    });
    this._svg.appendChild(arrow1);

    // Flèche fin
    const arrow2 = this._createSVGElement("polygon", {
      points:
        orientation === "horizontal"
          ? `${x2},${y2} ${x2 - arrowSize},${y2 - arrowSize / 2} ${
              x2 - arrowSize
            },${y2 + arrowSize / 2}`
          : `${x2},${y2} ${x2 - arrowSize / 2},${y2 - arrowSize} ${
              x2 + arrowSize / 2
            },${y2 - arrowSize}`,
      fill: "#666",
    });
    this._svg.appendChild(arrow2);

    // Texte
    const textX = (x1 + x2) / 2;
    const textY = (y1 + y2) / 2;

    const textElement = this._createSVGElement("text", {
      x: textX,
      y: textY,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      fill: "#333",
      "font-size": "12",
      "font-family": "Arial, sans-serif",
    });
    textElement.textContent = text;

    this._svg.appendChild(textElement);
  },

  /**
   * Crée un élément SVG avec les attributs spécifiés
   * @private
   */
  _createSVGElement(tagName, attributes) {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      tagName
    );

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    return element;
  },

  /**
   * Retourne les informations de rendu actuelles (pour debug)
   */
  getRenderInfo() {
    return {
      scale: this._scale,
      origin: this._origin,
      viewport: this._viewport,
    };
  },
};

// Export pour utilisation en mode debug
if (typeof window !== "undefined" && window.VerriereApp) {
  window.VerriereApp.Renderer = Renderer;
}
