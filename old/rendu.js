class RenduManager {
  constructor() {
    this.svg = document.getElementById("svg-preview");
    this.scale = 0.15; // Échelle pour l'affichage (1mm = 0.15px)
  }

  // Met à jour le rendu SVG selon la configuration
  updateRendu(config) {
    if (!this.svg) {
      console.warn("Élément SVG non trouvé");
      return;
    }

    // Vider le SVG
    this.svg.innerHTML = "";

    try {
      // Dessiner la verrière
      this.drawVerriere(config);
      console.log("Rendu SVG mis à jour");
    } catch (error) {
      console.error("Erreur lors du rendu SVG:", error);
    }
  }

  // Dessine la structure de base de la verrière
  drawVerriere(config) {
    const width = (config.width || 4000) * this.scale;
    const height = (config.height || 2500) * this.scale;

    // Décalage pour centrer dans le SVG
    const offsetX = (900 - width) / 2;
    const offsetY = (550 - height) / 2;

    // Créer un groupe pour la verrière
    const verriereGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    verriereGroup.setAttribute(
      "transform",
      `translate(${offsetX}, ${offsetY})`
    );

    // Dessiner le cadre principal
    this.drawCadre(verriereGroup, width, height, config);

    // Dessiner les modules
    this.drawModules(verriereGroup, width, height, config);

    // Dessiner les traverses si présentes
    if (config.traverses && config.traverses.length > 0) {
      this.drawTraverses(verriereGroup, width, height, config);
    }

    // Ajouter le groupe au SVG
    this.svg.appendChild(verriereGroup);

    // Ajouter les dimensions
    this.drawDimensions(config, offsetX, offsetY, width, height);
  }

  // Dessine le cadre principal
  drawCadre(parent, width, height, config) {
    const cadre = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    cadre.setAttribute("x", 0);
    cadre.setAttribute("y", 0);
    cadre.setAttribute("width", width);
    cadre.setAttribute("height", height);
    cadre.setAttribute("fill", "none");
    cadre.setAttribute("stroke", "#333");
    cadre.setAttribute("stroke-width", "3");

    parent.appendChild(cadre);
  }

  // Dessine les modules
  drawModules(parent, totalWidth, totalHeight, config) {
    const modulesCount = config.modulesCount || 1;
    const hasPorte = config.type === "porte";
    const porteIndex = config.porteIndex || 1;

    let currentX = 0;
    const profilWidth = 40 * this.scale;

    for (let i = 1; i <= modulesCount; i++) {
      // Largeur du module
      const moduleWidth =
        config.modules && config.modules[i - 1]
          ? config.modules[i - 1].width * this.scale
          : totalWidth / modulesCount;

      // Dessiner le profil vertical gauche (sauf pour le premier module)
      if (i > 1) {
        const profil = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        profil.setAttribute("x", currentX - profilWidth / 2);
        profil.setAttribute("y", 0);
        profil.setAttribute("width", profilWidth);
        profil.setAttribute("height", totalHeight);
        profil.setAttribute(
          "fill",
          this.getColorFill(config.options?.colorProfile)
        );
        profil.setAttribute("stroke", "#222");
        profil.setAttribute("stroke-width", "1");
        parent.appendChild(profil);
      }

      // Dessiner le module
      const isPorteModule = hasPorte && i == porteIndex;

      if (isPorteModule) {
        this.drawPorteModule(
          parent,
          currentX,
          0,
          moduleWidth,
          totalHeight,
          config
        );
      } else {
        this.drawStandardModule(
          parent,
          currentX,
          0,
          moduleWidth,
          totalHeight,
          config
        );
      }

      // Ajouter un label du module
      this.addModuleLabel(
        parent,
        currentX + moduleWidth / 2,
        totalHeight + 20,
        `M${i}`,
        isPorteModule
      );

      currentX += moduleWidth;
    }
  }

  // Dessine un module standard (vitré)
  drawStandardModule(parent, x, y, width, height, config) {
    // Zone vitrée
    const vitrage = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    vitrage.setAttribute("x", x + 5);
    vitrage.setAttribute("y", y + 5);
    vitrage.setAttribute("width", width - 10);
    vitrage.setAttribute("height", height - 10);
    vitrage.setAttribute("fill", "rgba(173, 216, 230, 0.3)"); // Bleu clair transparent
    vitrage.setAttribute("stroke", "#4682B4");
    vitrage.setAttribute("stroke-width", "1");
    vitrage.setAttribute("stroke-dasharray", "5,5");

    parent.appendChild(vitrage);
  }

  // Dessine le module porte
  drawPorteModule(parent, x, y, width, height, config) {
    const porteWidth = (config.porte?.porteWidth || 730) * this.scale;
    const withTierce = config.porte?.withTierce || false;
    const withImposte = config.porte?.withImposte || false;

    let currentX = x;

    // Dessiner la porte
    const porte = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    porte.setAttribute("x", currentX + 5);
    porte.setAttribute("y", y + 5);
    porte.setAttribute("width", porteWidth);
    porte.setAttribute("height", height - 10);
    porte.setAttribute("fill", "rgba(255, 255, 255, 0.8)");
    porte.setAttribute("stroke", "#333");
    porte.setAttribute("stroke-width", "2");

    parent.appendChild(porte);

    // Ajouter une poignée
    const poignee = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    const poigneeX =
      config.porte?.sensOuverture === "gauche"
        ? currentX + 15
        : currentX + porteWidth - 10;
    poignee.setAttribute("cx", poigneeX);
    poignee.setAttribute("cy", height / 2);
    poignee.setAttribute("r", "3");
    poignee.setAttribute("fill", "#666");

    parent.appendChild(poignee);

    currentX += porteWidth;

    // Dessiner la tierce si présente
    if (withTierce) {
      const tierceWidth = (config.porte?.tierceWidth || 350) * this.scale;

      const tierce = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      tierce.setAttribute("x", currentX + 5);
      tierce.setAttribute("y", y + 5);
      tierce.setAttribute("width", tierceWidth);
      tierce.setAttribute("height", height - 10);
      tierce.setAttribute("fill", "rgba(255, 255, 255, 0.6)");
      tierce.setAttribute("stroke", "#333");
      tierce.setAttribute("stroke-width", "1");
      tierce.setAttribute("stroke-dasharray", "3,3");

      parent.appendChild(tierce);
    }
  }

  // Dessine les traverses
  drawTraverses(parent, totalWidth, totalHeight, config) {
    if (!config.traverses) return;

    config.traverses.forEach((traverse) => {
      const traverseY = totalHeight - traverse.height * this.scale;

      traverse.modules.forEach((moduleIndex) => {
        // Calculer la position X du module
        let moduleX = 0;
        for (let i = 1; i < moduleIndex; i++) {
          const moduleWidth =
            config.modules && config.modules[i - 1]
              ? config.modules[i - 1].width * this.scale
              : totalWidth / config.modulesCount;
          moduleX += moduleWidth;
        }

        const moduleWidth =
          config.modules && config.modules[moduleIndex - 1]
            ? config.modules[moduleIndex - 1].width * this.scale
            : totalWidth / config.modulesCount;

        // Dessiner la traverse
        const traverseRect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        traverseRect.setAttribute("x", moduleX + 5);
        traverseRect.setAttribute("y", traverseY - 2);
        traverseRect.setAttribute("width", moduleWidth - 10);
        traverseRect.setAttribute("height", 4);
        traverseRect.setAttribute(
          "fill",
          this.getColorFill(config.options?.colorProfile)
        );
        traverseRect.setAttribute("stroke", "#222");
        traverseRect.setAttribute("stroke-width", "1");

        parent.appendChild(traverseRect);
      });
    });
  }

  // Ajoute les cotes et dimensions
  drawDimensions(config, offsetX, offsetY, width, height) {
    // Dimension largeur (en bas)
    this.addDimension(
      offsetX,
      offsetY + height + 30,
      offsetX + width,
      offsetY + height + 30,
      `${config.width || 4000}mm`,
      "horizontal"
    );

    // Dimension hauteur (à droite)
    this.addDimension(
      offsetX + width + 30,
      offsetY,
      offsetX + width + 30,
      offsetY + height,
      `${config.height || 2500}mm`,
      "vertical"
    );
  }

  // Ajoute une ligne de cote
  addDimension(x1, y1, x2, y2, text, orientation) {
    // Ligne de cote
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "#666");
    line.setAttribute("stroke-width", "1");

    this.svg.appendChild(line);

    // Texte de la dimension
    const textElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    textElement.setAttribute("x", (x1 + x2) / 2);
    textElement.setAttribute("y", (y1 + y2) / 2);
    textElement.setAttribute("text-anchor", "middle");
    textElement.setAttribute("font-family", "Arial, sans-serif");
    textElement.setAttribute("font-size", "12");
    textElement.setAttribute("fill", "#333");

    if (orientation === "vertical") {
      textElement.setAttribute(
        "transform",
        `rotate(-90, ${(x1 + x2) / 2}, ${(y1 + y2) / 2})`
      );
    }

    textElement.textContent = text;
    this.svg.appendChild(textElement);
  }

  // Ajoute un label de module
  addModuleLabel(parent, x, y, text, isPorte) {
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", x);
    label.setAttribute("y", y);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-family", "Arial, sans-serif");
    label.setAttribute("font-size", "10");
    label.setAttribute("fill", isPorte ? "#d63384" : "#333");
    label.setAttribute("font-weight", isPorte ? "bold" : "normal");
    label.textContent = text;

    parent.appendChild(label);
  }

  // Retourne la couleur de remplissage selon le profil
  getColorFill(colorProfile) {
    const colors = {
      noir: "#2c2c2c",
      gris: "#6c757d",
      blanc: "#f8f9fa",
    };

    return colors[colorProfile] || colors["noir"];
  }

  // Méthode appelée quand la configuration change
  onConfigChanged(eventData) {
    const config = eventData.newConfig;
    console.log("Configuration mise à jour, rendu SVG...");
    this.updateRendu(config);
  }
}

// Instance globale du gestionnaire de rendu
const renduManager = new RenduManager();

// Fonction d'initialisation pour connecter avec le gestionnaire de config
function initRenduManager() {
  // S'abonner aux changements de configuration
  configManager.subscribe("configChanged", (eventData) => {
    renduManager.onConfigChanged(eventData);
  });

  // Effectuer le premier rendu
  const currentConfig = configManager.getConfig();
  if (currentConfig) {
    renduManager.updateRendu(currentConfig);
  }

  console.log("RenduManager initialisé avec succès");
}
