export class TraversesCalculator {
  /**
   * Valide la position d'une traverse sur verrière principale
   * @param {number} height - Hauteur de la traverse depuis le bas
   * @param {number} maxHeight - Hauteur totale de la verrière
   * @returns {{valid: boolean, message?: string}}
   */
  static validateTraversePosition(height, maxHeight) {
    const minPosition = 240; // Distance minimum du bas
    const maxPosition = maxHeight - 240; // Distance minimum du haut

    if (height < minPosition) {
      return {
        valid: false,
        message: `Position minimum: ${minPosition}mm du bas`,
      };
    }

    if (height > maxPosition) {
      return {
        valid: false,
        message: `Position maximum: ${maxPosition}mm du bas (${240}mm du haut)`,
      };
    }

    return { valid: true };
  }

  /**
   * Valide la position d'une traverse sur porte
   * @param {number} height - Hauteur de la traverse depuis le bas de la porte
   * @param {number} porteHeight - Hauteur totale de la porte
   * @returns {{valid: boolean, message?: string}}
   */
  static validateTraversePortePosition(height, porteHeight) {
    const minPosition = 200; // Distance minimum du bas pour porte
    const maxPosition = porteHeight - 240; // Distance minimum du haut

    if (height < minPosition) {
      return {
        valid: false,
        message: `Position minimum: ${minPosition}mm du bas de la porte`,
      };
    }

    if (height > maxPosition) {
      return {
        valid: false,
        message: `Position maximum: ${maxPosition}mm du bas (${240}mm du haut)`,
      };
    }

    return { valid: true };
  }

  /**
   * Vérifie s'il y a conflit entre traverses principales
   * @param {Array} existingTraverses - Traverses existantes
   * @param {number} newHeight - Nouvelle hauteur à tester
   * @param {Array} newModules - Modules concernés par la nouvelle traverse
   * @returns {{conflict: boolean, message?: string, conflictingTraverse?: Object}}
   */
  static checkTraverseConflict(existingTraverses, newHeight, newModules) {
    for (const traverse of existingTraverses) {
      // Même hauteur ET modules qui se chevauchent
      if (traverse.height === newHeight) {
        const hasOverlap = traverse.modules.some((m) => newModules.includes(m));
        if (hasOverlap) {
          const overlappingModules = traverse.modules.filter((m) =>
            newModules.includes(m)
          );
          return {
            conflict: true,
            message: `Conflit à ${newHeight}mm sur module(s): ${overlappingModules.join(
              ", "
            )}`,
            conflictingTraverse: traverse,
          };
        }
      }
    }

    return { conflict: false };
  }

  /**
   * Vérifie s'il y a conflit entre traverses de porte
   * @param {Array} existingTraverses - Traverses porte existantes
   * @param {number} newHeight - Nouvelle hauteur
   * @param {string} newType - Type de traverse (28 ou 37)
   * @param {boolean} newOnTierce - Sur tierce ou non
   * @returns {{conflict: boolean, message?: string}}
   */
  static checkTraversePorteConflict(
    existingTraverses,
    newHeight,
    newType,
    newOnTierce
  ) {
    for (const traverse of existingTraverses) {
      if (
        traverse.height === newHeight &&
        traverse.type === newType &&
        traverse.onTierce === newOnTierce
      ) {
        return {
          conflict: true,
          message: `Traverse ${newType}mm déjà présente à ${newHeight}mm ${
            newOnTierce ? "sur tierce" : ""
          }`,
        };
      }
    }

    return { conflict: false };
  }

  /**
   * Calcule les positions recommandées pour les traverses
   * @param {number} totalHeight - Hauteur totale disponible
   * @param {number} count - Nombre de traverses souhaitées
   * @returns {Array<number>} Positions optimales
   */
  static calculateRecommendedPositions(totalHeight, count = 1) {
    const minFromBottom = 240;
    const minFromTop = 240;
    const usableHeight = totalHeight - minFromBottom - minFromTop;

    if (count === 1) {
      // Une seule traverse : au centre
      return [minFromBottom + usableHeight / 2];
    }

    // Plusieurs traverses : répartition équitable
    const positions = [];
    const spacing = usableHeight / (count + 1);

    for (let i = 1; i <= count; i++) {
      positions.push(Math.round(minFromBottom + spacing * i));
    }

    return positions;
  }

  /**
   * Calcule les positions recommandées pour traverses de porte
   * @param {number} porteHeight - Hauteur de la porte
   * @param {number} count - Nombre de traverses souhaitées
   * @returns {Array<number>} Positions optimales
   */
  static calculateRecommendedPortePositions(porteHeight, count = 1) {
    const minFromBottom = 200;
    const minFromTop = 240;
    const usableHeight = porteHeight - minFromBottom - minFromTop;

    if (count === 1) {
      // Position standard à mi-hauteur ou légèrement plus bas
      return [Math.round(minFromBottom + usableHeight * 0.4)];
    }

    // Plusieurs traverses
    const positions = [];
    const spacing = usableHeight / (count + 1);

    for (let i = 1; i <= count; i++) {
      positions.push(Math.round(minFromBottom + spacing * i));
    }

    return positions;
  }

  /**
   * Valide qu'un ensemble de modules existe dans la configuration
   * @param {Array<number>} modules - Modules à valider
   * @param {number} totalModules - Nombre total de modules disponibles
   * @returns {{valid: boolean, message?: string}}
   */
  static validateModulesSelection(modules, totalModules) {
    if (!Array.isArray(modules) || modules.length === 0) {
      return {
        valid: false,
        message: "Au moins un module doit être sélectionné",
      };
    }

    // Vérifier que tous les modules sont dans la plage valide
    const invalidModules = modules.filter((m) => m < 1 || m > totalModules);
    if (invalidModules.length > 0) {
      return {
        valid: false,
        message: `Modules invalides: ${invalidModules.join(
          ", "
        )} (1-${totalModules} autorisés)`,
      };
    }

    // Vérifier les doublons
    const uniqueModules = [...new Set(modules)];
    if (uniqueModules.length !== modules.length) {
      return {
        valid: false,
        message: "Modules en double détectés",
      };
    }

    return { valid: true };
  }

  /**
   * Calcule les longueurs de traverse nécessaires selon les modules
   * @param {Array<number>} modules - Modules concernés (numéros)
   * @param {Array<Object>} modulesConfig - Configuration des modules
   * @returns {{totalLength: number, segments: Array<{module: number, length: number}>}}
   */
  static calculateTraverseLengths(modules, modulesConfig) {
    let totalLength = 0;
    const segments = [];

    modules.forEach((moduleNumber) => {
      const moduleIndex = moduleNumber - 1;
      const moduleConfig = modulesConfig[moduleIndex];

      if (moduleConfig) {
        const length = moduleConfig.width || 0;
        totalLength += length;
        segments.push({
          module: moduleNumber,
          length: length,
        });
      }
    });

    return { totalLength, segments };
  }

  /**
   * Optimise l'ordre des modules pour minimiser les chutes
   * @param {Array<number>} modules - Modules sélectionnés
   * @returns {Array<number>} Modules triés de manière optimale
   */
  static optimizeModulesOrder(modules) {
    // Trie les modules par ordre croissant pour un tracé plus logique
    return [...modules].sort((a, b) => a - b);
  }

  /**
   * Calcule les contraintes de hauteur pour une traverse donnée
   * @param {Object} config - Configuration globale
   * @param {string} traverseType - 'main' ou 'porte'
   * @returns {{min: number, max: number, available: number}}
   */
  static calculateHeightConstraints(config, traverseType = "main") {
    if (traverseType === "porte") {
      const porteHeight = config.porte?.porteHeight || 2200;
      return {
        min: 200,
        max: porteHeight - 240,
        available: porteHeight - 200 - 240,
      };
    } else {
      // Traverse principale
      const totalHeight = config.height || 2500;
      return {
        min: 240,
        max: totalHeight - 240,
        available: totalHeight - 240 - 240,
      };
    }
  }

  /**
   * Analyse la répartition des traverses existantes
   * @param {Array} traverses - Traverses existantes
   * @param {number} totalHeight - Hauteur totale
   * @returns {{density: number, gaps: Array<{start: number, end: number, size: number}>, recommendations: Array<string>}}
   */
  static analyzeTraverseDistribution(traverses, totalHeight) {
    if (!traverses || traverses.length === 0) {
      return {
        density: 0,
        gaps: [{ start: 240, end: totalHeight - 240, size: totalHeight - 480 }],
        recommendations: ["Aucune traverse définie"],
      };
    }

    // Trie les traverses par hauteur
    const sortedTraverses = [...traverses].sort((a, b) => a.height - b.height);

    // Calcule les espaces entre traverses
    const gaps = [];
    const recommendations = [];

    // Écart avant la première traverse
    if (sortedTraverses[0].height > 240) {
      const gapSize = sortedTraverses[0].height - 240;
      gaps.push({ start: 240, end: sortedTraverses[0].height, size: gapSize });

      if (gapSize > 800) {
        recommendations.push(
          `Grand espace avant première traverse (${gapSize}mm)`
        );
      }
    }

    // Écarts entre traverses
    for (let i = 0; i < sortedTraverses.length - 1; i++) {
      const current = sortedTraverses[i];
      const next = sortedTraverses[i + 1];
      const gapSize = next.height - current.height;

      if (gapSize > 0) {
        gaps.push({ start: current.height, end: next.height, size: gapSize });

        if (gapSize > 1000) {
          recommendations.push(
            `Grand espace entre traverses à ${current.height}mm et ${next.height}mm (${gapSize}mm)`
          );
        }
      }
    }

    // Écart après la dernière traverse
    const lastTraverse = sortedTraverses[sortedTraverses.length - 1];
    if (lastTraverse.height < totalHeight - 240) {
      const gapSize = totalHeight - 240 - lastTraverse.height;
      gaps.push({
        start: lastTraverse.height,
        end: totalHeight - 240,
        size: gapSize,
      });

      if (gapSize > 800) {
        recommendations.push(
          `Grand espace après dernière traverse (${gapSize}mm)`
        );
      }
    }

    // Calcule la densité (% de la hauteur utilisable couverte)
    const usableHeight = totalHeight - 480; // Total moins marges haut/bas
    const coveredHeight =
      usableHeight - gaps.reduce((sum, gap) => sum + gap.size, 0);
    const density = (coveredHeight / usableHeight) * 100;

    return { density, gaps, recommendations };
  }

  /**
   * Génère des suggestions pour améliorer la répartition des traverses
   * @param {Object} config - Configuration globale
   * @param {Array} existingTraverses - Traverses existantes
   * @returns {Array<{type: string, message: string, position?: number}>}
   */
  static generateTraverseSuggestions(config, existingTraverses = []) {
    const suggestions = [];
    const analysis = this.analyzeTraverseDistribution(
      existingTraverses,
      config.height
    );

    // Suggestions basées sur les grands espaces
    analysis.gaps.forEach((gap) => {
      if (gap.size > 1200) {
        const suggestedPosition = Math.round(gap.start + gap.size / 2);
        suggestions.push({
          type: "add",
          message: `Ajouter une traverse vers ${suggestedPosition}mm`,
          position: suggestedPosition,
        });
      }
    });

    // Suggestions basées sur la hauteur totale
    const totalHeight = config.height;
    if (totalHeight > 3000 && existingTraverses.length === 0) {
      suggestions.push({
        type: "structural",
        message: "Verrière haute : au moins une traverse recommandée",
        position: Math.round(totalHeight / 2),
      });
    }

    if (totalHeight > 4000 && existingTraverses.length < 2) {
      suggestions.push({
        type: "structural",
        message: "Verrière très haute : deux traverses recommandées minimum",
      });
    }

    return suggestions;
  }

  /**
   * Calcule l'impact structurel des traverses
   * @param {Array} traverses - Traverses définies
   * @param {Object} config - Configuration globale
   * @returns {{structuralRating: number, stability: string, recommendations: Array<string>}}
   */
  static calculateStructuralImpact(traverses, config) {
    const totalHeight = config.height;
    const moduleWidth = config.width / config.modulesCount;

    let structuralRating = 50; // Base 50%
    const recommendations = [];

    // Bonus pour chaque traverse
    structuralRating += traverses.length * 15;

    // Bonus pour répartition équilibrée
    if (traverses.length > 1) {
      const analysis = this.analyzeTraverseDistribution(traverses, totalHeight);
      if (analysis.density > 60) {
        structuralRating += 10;
      }
    }

    // Pénalité pour verrière haute sans traverse
    if (totalHeight > 3000 && traverses.length === 0) {
      structuralRating -= 20;
      recommendations.push(
        "Traverse recommandée pour une verrière de cette hauteur"
      );
    }

    // Pénalité pour modules larges sans traverse
    if (moduleWidth > 1200 && traverses.length === 0) {
      structuralRating -= 15;
      recommendations.push("Traverse recommandée pour des modules larges");
    }

    // Limite à 100%
    structuralRating = Math.min(100, Math.max(0, structuralRating));

    // Détermination du niveau de stabilité
    let stability;
    if (structuralRating >= 80) {
      stability = "Excellente";
    } else if (structuralRating >= 60) {
      stability = "Bonne";
    } else if (structuralRating >= 40) {
      stability = "Acceptable";
    } else {
      stability = "Insuffisante";
    }

    return { structuralRating, stability, recommendations };
  }

  /**
   * Valide la cohérence globale des traverses
   * @param {Object} config - Configuration complète
   * @returns {{valid: boolean, errors: Array<string>, warnings: Array<string>}}
   */
  static validateGlobalTraverseCoherence(config) {
    const errors = [];
    const warnings = [];

    // Validation traverses principales
    if (config.traverses) {
      config.traverses.forEach((traverse, index) => {
        const validation = this.validateTraversePosition(
          traverse.height,
          config.height
        );
        if (!validation.valid) {
          errors.push(`Traverse ${index + 1}: ${validation.message}`);
        }

        const moduleValidation = this.validateModulesSelection(
          traverse.modules,
          config.modulesCount
        );
        if (!moduleValidation.valid) {
          errors.push(`Traverse ${index + 1}: ${moduleValidation.message}`);
        }
      });
    }

    // Validation traverses porte
    if (config.type === "porte" && config.traversesPorte) {
      const porteHeight = config.porte?.porteHeight || 2200;
      config.traversesPorte.forEach((traverse, index) => {
        const validation = this.validateTraversePortePosition(
          traverse.height,
          porteHeight
        );
        if (!validation.valid) {
          errors.push(`Traverse porte ${index + 1}: ${validation.message}`);
        }
      });
    }

    // Avertissements structurels
    const structural = this.calculateStructuralImpact(
      config.traverses || [],
      config
    );
    if (structural.structuralRating < 60) {
      warnings.push(`Stabilité structurelle: ${structural.stability}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Utilitaire pour formater une liste de modules
   * @param {Array<number>} modules - Numéros de modules
   * @returns {string} Format lisible
   */
  static formatModulesList(modules) {
    if (!modules || modules.length === 0) return "Aucun";

    // Trie et groupe les modules consécutifs
    const sorted = [...modules].sort((a, b) => a - b);
    const groups = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        groups.push(start === end ? `M${start}` : `M${start}-M${end}`);
        start = sorted[i];
        end = sorted[i];
      }
    }
    groups.push(start === end ? `M${start}` : `M${start}-M${end}`);

    return groups.join(", ");
  }

  /**
   * Génère un identifiant unique pour une traverse
   * @param {number} height - Hauteur de la traverse
   * @param {Array<number>} modules - Modules concernés
   * @param {string} type - Type de traverse (optionnel)
   * @returns {string} Identifiant unique
   */
  static generateTraverseId(height, modules = [], type = "main") {
    const moduleString = modules.sort().join("-");
    return `${type}_${height}_${moduleString}_${Date.now()}`;
  }

  /**
   * Compare deux traverses pour déterminer si elles sont identiques
   * @param {Object} traverse1 - Première traverse
   * @param {Object} traverse2 - Seconde traverse
   * @returns {boolean} True si identiques
   */
  static areTraversesIdentical(traverse1, traverse2) {
    if (traverse1.height !== traverse2.height) return false;
    if (traverse1.type !== traverse2.type) return false;

    // Compare les modules (ordre indifférent)
    if (traverse1.modules && traverse2.modules) {
      const modules1 = [...traverse1.modules].sort();
      const modules2 = [...traverse2.modules].sort();
      return JSON.stringify(modules1) === JSON.stringify(modules2);
    }

    return true;
  }
}
