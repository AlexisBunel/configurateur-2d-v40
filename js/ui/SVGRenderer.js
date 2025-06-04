import { SVG, COLORS, SELECTORS } from "../constants.js";
import { Calculator } from "../core/Calculator.js";

/**
 * Gestionnaire de rendu SVG avec cache et optimisations
 * Remplace le rendu.js existant
 */
export class SVGRenderer {
  constructor() {
    this._svg = null;
    this._cache = new Map();
    this._lastConfig = null;
  }

  /**
   * Initialise le renderer
   */
  initialize() {
    this._svg = document.querySelector(SELECTORS.SVG_PREVIEW);
    if (!this._svg) {
      throw new Error("SVG container non trouvé");
    }

    console.log("✅ SVGRenderer initialisé");
  }

  /**
   * Rend la verrière selon la configuration
   */
  render(config) {
    if (!this._svg) {
      console.warn("⚠️ SVG non initialisé");
      return;
    }

    try {
      // Vérifier si un re-rendu est nécessaire
      if (this._isSameConfig(config)) {
        return; // Pas de changement, économiser les ressources
      }

      // Vérifier le cache
      const cacheKey = this._getCacheKey(config);
      const cached = this._cache.get(cacheKey);

      if (cached) {
        this._svg.innerHTML = cached;
        this._lastConfig = config;
        return;
      }

      // Rendu complet
      const svgContent = this._buildSVG(config);

      // Mettre en cache
      this._cache.set(cacheKey, svgContent);
      this._cleanupCache();

      // Afficher
      this._svg.innerHTML = svgContent;
      this._lastConfig = config;

      console.log("🎨 SVG rendu:", cacheKey);
    } catch (error) {
      console.error("❌ Erreur rendu SVG:", error);
      this._renderError();
    }
  }

  /**
   * Force un nouveau rendu sans cache
   */
  forceRender(config) {
    this._cache.clear();
    this._lastConfig = null;
    this.render(config);
  }

  /**
   * Vide le cache
   */
  clearCache() {
    this._cache.clear();
    console.log("🗑️ Cache SVG vidé");
  }

  // ============================================
  // MÉTHODES PRIVÉES
  // ============================================

  /**
   * Construit le contenu SVG complet
   */
  _buildSVG(config) {
    const { width: configWidth, height: configHeight } = config;

    // Calculer l'échelle
    const scale = this._calculateScale(configWidth, configHeight);
    const scaledWidth = configWidth * scale;
    const scaledHeight = configHeight * scale;

    // Centrer dans le viewport
    const offsetX = (SVG.VIEWPORT.WIDTH - scaledWidth) / 2;
    const offsetY = (SVG.VIEWPORT.HEIGHT - scaledHeight) / 2;

    // Construire le SVG
    let svgContent = "";

    // Groupe principal
    svgContent += `<g transform="translate(${offsetX}, ${offsetY})">`;

    // Cadre principal
    svgContent += this._buildCadre(scaledWidth, scaledHeight, config);

    // Modules
    svgContent += this._buildModules(scaledWidth, scaledHeight, config, scale);

    // Traverses
    if (config.traverses?.length > 0) {
      svgContent += this._buildTraverses(
        scaledWidth,
        scaledHeight,
        config,
        scale
      );
    }

    // Traverses porte
    if (config.traversesPorte?.length > 0 && config.type === "porte") {
      svgContent += this._buildTraversesPorte(
        scaledWidth,
        scaledHeight,
        config,
        scale
      );
    }

    svgContent += "</g>";

    // Cotations
    svgContent += this._buildDimensions(
      config,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    );

    return svgContent;
  }

  /**
   * Construit le cadre principal
   */
  _buildCadre(width, height, config) {
    const color = this._getProfileColor(config.options?.colorProfile);

    return `
      <rect 
        x="0" 
        y="0" 
        width="${width}" 
        height="${height}"
        fill="none"
        stroke="${color}"
        stroke-width="3"
      />
    `;
  }

  /**
   * Construit les modules
   */
  _buildModules(totalWidth, totalHeight, config, scale) {
    const { modulesCount, type, porteIndex } = config;
    const moduleWidths = Calculator.distributeModuleWidths(config);

    let content = "";
    let currentX = 0;
    const profilWidth = 40 * scale;

    for (let i = 1; i <= modulesCount; i++) {
      const moduleWidth = moduleWidths[i - 1] * scale;
      const isPorteModule = type === "porte" && i === porteIndex;

      // Profil vertical gauche (sauf premier module)
      if (i > 1) {
        content += this._buildProfil(
          currentX - profilWidth / 2,
          0,
          profilWidth,
          totalHeight,
          config
        );
      }

      // Module
      if (isPorteModule) {
        content += this._buildPorteModule(
          currentX,
          0,
          moduleWidth,
          totalHeight,
          config,
          scale
        );
      } else {
        content += this._buildStandardModule(
          currentX,
          0,
          moduleWidth,
          totalHeight,
          config
        );
      }

      // Label du module
      content += this._buildModuleLabel(
        currentX + moduleWidth / 2,
        totalHeight + 20,
        `M${i}`,
        isPorteModule
      );

      currentX += moduleWidth;
    }

    return content;
  }

  /**
   * Construit un module standard (vitré)
   */
  _buildStandardModule(x, y, width, height, config) {
    return `
      <rect 
        x="${x + 5}" 
        y="${y + 5}" 
        width="${width - 10}" 
        height="${height - 10}"
        fill="rgba(173, 216, 230, 0.3)"
        stroke="#4682B4"
        stroke-width="1"
        stroke-dasharray="5,5"
      />
    `;
  }

  /**
   * Construit le module porte
   */
  _buildPorteModule(x, y, moduleWidth, height, config, scale) {
    const { porte } = config;
    const porteWidth = (porte?.porteWidth || 730) * scale;
    const withTierce = porte?.withTierce || false;

    let content = "";
    let currentX = x;

    // Zone porte
    content += `
      <rect 
        x="${currentX + 5}" 
        y="${y + 5}" 
        width="${porteWidth - 10}" 
        height="${height - 10}"
        fill="rgba(255, 255, 255, 0.8)"
        stroke="#333"
        stroke-width="2"
      />
    `;

    // Poignée
    const poigneeX =
      porte?.sensOuverture === "gauche"
        ? currentX + 15
        : currentX + porteWidth - 15;

    content += `
      <circle 
        cx="${poigneeX}" 
        cy="${height / 2}" 
        r="3"
        fill="#666"
      />
    `;

    currentX += porteWidth;

    // Tierce si présente
    if (withTierce) {
      const tierceWidth = (porte?.tierceWidth || 350) * scale;

      content += `
        <rect 
          x="${currentX + 5}" 
          y="${y + 5}" 
          width="${tierceWidth - 10}" 
          height="${height - 10}"
          fill="rgba(255, 255, 255, 0.6)"
          stroke="#333"
          stroke-width="1"
          stroke-dasharray="3,3"
        />
      `;
    }

    return content;
  }

  /**
   * Construit un profil
   */
  _buildProfil(x, y, width, height, config) {
    const color = this._getProfileColor(config.options?.colorProfile);

    return `
      <rect 
        x="${x}" 
        y="${y}" 
        width="${width}" 
        height="${height}"
        fill="${color}"
        stroke="#222"
        stroke-width="1"
      />
    `;
  }

  /**
   * Construit les traverses principales
   */
  _buildTraverses(totalWidth, totalHeight, config, scale) {
    let content = "";

    config.traverses.forEach((traverse) => {
      const traverseY = totalHeight - traverse.height * scale;

      traverse.modules.forEach((moduleIndex) => {
        const { moduleX, moduleWidth } = this._getModulePosition(
          moduleIndex,
          config,
          scale
        );

        content += `
          <rect 
            x="${moduleX + 5}" 
            y="${traverseY - 2}" 
            width="${moduleWidth - 10}" 
            height="4"
            fill="${this._getProfileColor(config.options?.colorProfile)}"
            stroke="#222"
            stroke-width="1"
          />
        `;
      });
    });

    return content;
  }

  /**
   * Construit les traverses de porte
   */
  _buildTraversesPorte(totalWidth, totalHeight, config, scale) {
    let content = "";
    const { porteIndex, porte } = config;

    config.traversesPorte.forEach((traverse) => {
      const traverseY = totalHeight - traverse.height * scale;
      const { moduleX } = this._getModulePosition(porteIndex, config, scale);

      // Traverse sur porte
      const porteWidth = (porte?.porteWidth || 730) * scale;
      content += `
        <rect 
          x="${moduleX + 5}" 
          y="${traverseY - 1}" 
          width="${porteWidth - 10}" 
          height="2"
          fill="#d63384"
          stroke="#222"
          stroke-width="0.5"
        />
      `;

      // Traverse sur tierce si activée
      if (traverse.onTierce && porte?.withTierce) {
        const tierceWidth = (porte?.tierceWidth || 350) * scale;
        const tierceX = moduleX + porteWidth;

        content += `
          <rect 
            x="${tierceX + 5}" 
            y="${traverseY - 1}" 
            width="${tierceWidth - 10}" 
            height="2"
            fill="#d63384"
            stroke="#222"
            stroke-width="0.5"
          />
        `;
      }
    });

    return content;
  }

  /**
   * Construit les cotations
   */
  _buildDimensions(config, offsetX, offsetY, width, height) {
    let content = "";

    // Cotation largeur (en bas)
    content += this._buildDimensionLine(
      offsetX,
      offsetY + height + 30,
      offsetX + width,
      offsetY + height + 30,
      `${config.width}mm`,
      "horizontal"
    );

    // Cotation hauteur (à droite)
    content += this._buildDimensionLine(
      offsetX + width + 30,
      offsetY,
      offsetX + width + 30,
      offsetY + height,
      `${config.height}mm`,
      "vertical"
    );

    return content;
  }

  /**
   * Construit une ligne de cotation
   */
  _buildDimensionLine(x1, y1, x2, y2, text, orientation) {
    const textX = (x1 + x2) / 2;
    const textY = (y1 + y2) / 2;
    const transform =
      orientation === "vertical"
        ? `transform="rotate(-90, ${textX}, ${textY})"`
        : "";

    return `
      <line 
        x1="${x1}" 
        y1="${y1}" 
        x2="${x2}" 
        y2="${y2}"
        stroke="#666"
        stroke-width="1"
      />
      <text 
        x="${textX}" 
        y="${textY}" 
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="12"
        fill="#333"
        ${transform}
      >${text}</text>
    `;
  }

  /**
   * Construit un label de module
   */
  _buildModuleLabel(x, y, text, isPorte) {
    const color = isPorte ? "#d63384" : "#333";
    const weight = isPorte ? "bold" : "normal";

    return `
      <text 
        x="${x}" 
        y="${y}" 
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="10"
        font-weight="${weight}"
        fill="${color}"
      >${text}</text>
    `;
  }

  /**
   * Rend un message d'erreur
   */
  _renderError() {
    if (!this._svg) return;

    this._svg.innerHTML = `
      <text 
        x="450" 
        y="275" 
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="16"
        fill="#f44336"
      >❌ Erreur de rendu</text>
    `;
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  /**
   * Calcule l'échelle pour faire tenir la verrière dans le viewport
   */
  _calculateScale(width, height) {
    const maxWidth = SVG.VIEWPORT.WIDTH - 2 * SVG.MARGINS;
    const maxHeight = SVG.VIEWPORT.HEIGHT - 2 * SVG.MARGINS;

    return Math.min(maxWidth / width, maxHeight / height, SVG.SCALE);
  }

  /**
   * Obtient la couleur d'un profil
   */
  _getProfileColor(colorProfile) {
    return COLORS.PROFILES[colorProfile?.toUpperCase()] || COLORS.PROFILES.NOIR;
  }

  /**
   * Calcule la position d'un module
   */
  _getModulePosition(moduleIndex, config, scale) {
    const moduleWidths = Calculator.distributeModuleWidths(config);

    let moduleX = 0;
    for (let i = 1; i < moduleIndex; i++) {
      moduleX += moduleWidths[i - 1] * scale;
    }

    const moduleWidth = moduleWidths[moduleIndex - 1] * scale;

    return { moduleX, moduleWidth };
  }

  /**
   * Génère une clé de cache pour la configuration
   */
  _getCacheKey(config) {
    // Créer une clé basée sur les éléments qui affectent le rendu
    const key = {
      w: config.width,
      h: config.height,
      t: config.type,
      mc: config.modulesCount,
      pi: config.porteIndex,
      pw: config.porte?.porteWidth,
      tw: config.porte?.tierceWidth,
      wt: config.porte?.withTierce,
      so: config.porte?.sensOuverture,
      c: config.options?.colorProfile,
      tr: config.traverses
        ?.map((t) => `${t.height}-${t.modules?.join(",")}`)
        .join("|"),
      tp: config.traversesPorte
        ?.map((t) => `${t.height}-${t.onTierce}`)
        .join("|"),
      m: config.modules?.map((m) => m.width).join(","),
    };

    return JSON.stringify(key);
  }

  /**
   * Vérifie si la config est identique à la précédente
   */
  _isSameConfig(config) {
    if (!this._lastConfig) return false;
    return this._getCacheKey(config) === this._getCacheKey(this._lastConfig);
  }

  /**
   * Nettoie le cache si trop volumineux
   */
  _cleanupCache() {
    const MAX_CACHE_SIZE = 50;

    if (this._cache.size > MAX_CACHE_SIZE) {
      // Supprimer les entrées les plus anciennes
      const keysToDelete = Array.from(this._cache.keys()).slice(0, 10);
      keysToDelete.forEach((key) => this._cache.delete(key));

      console.log("🧹 Cache SVG nettoyé");
    }
  }
}
