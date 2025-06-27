export class TraversesCalculator {
  static validateTraversePosition(height, maxHeight) {
    const minPosition = 240;
    const maxPosition = maxHeight - 240;

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

  static validateTraversePortePosition(height, porteHeight) {
    const minPosition = 200;
    const maxPosition = porteHeight - 240;

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

  static checkTraverseConflict(existingTraverses, newHeight, newModules) {
    for (const traverse of existingTraverses) {
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

  static checkTraversePorteConflict(
    existingTraverses,
    newHeight,
    newType,
    newOnTierce
  ) {
    if (!existingTraverses || existingTraverses.length === 0) {
      return { conflict: false };
    }

    for (const existingTraverse of existingTraverses) {
      if (existingTraverse.height === newHeight) {
        return {
          conflict: true,
          message: `Une traverse existe déjà à ${newHeight}mm. Choisissez une autre hauteur.`,
        };
      }

      const distance = Math.abs(existingTraverse.height - newHeight);
      if (distance < 200) {
        return {
          conflict: true,
          message: `Trop proche d'une traverse à ${existingTraverse.height}mm (écart: ${distance}mm). Minimum 200mm requis.`,
        };
      }
    }

    return { conflict: false };
  }

  static checkTraversePorteSpecificConflict(
    existingTraverses,
    newHeight,
    checkOnPorte,
    checkOnTierce
  ) {
    if (!existingTraverses || existingTraverses.length === 0) {
      return { conflict: false };
    }

    for (const existingTraverse of existingTraverses) {
      // Vérifier seulement les traverses du même emplacement
      const sameLocation =
        (checkOnPorte && existingTraverse.onPorte) ||
        (checkOnTierce && existingTraverse.onTierce);

      if (!sameLocation) continue;

      // RÈGLE 1: Pas deux traverses au même emplacement à la même hauteur
      if (existingTraverse.height === newHeight) {
        const location = checkOnPorte ? "porte" : "tierce";
        return {
          conflict: true,
          message: `Une traverse existe déjà sur la ${location} à ${newHeight}mm.`,
        };
      }

      // RÈGLE 2: Distance minimum de 200mm entre traverses sur le même emplacement
      const distance = Math.abs(existingTraverse.height - newHeight);
      if (distance < 200) {
        const location = checkOnPorte ? "porte" : "tierce";
        return {
          conflict: true,
          message: `Trop proche d'une traverse sur la ${location} à ${existingTraverse.height}mm (écart: ${distance}mm).`,
        };
      }
    }

    return { conflict: false };
  }

  static calculateRecommendedPositions(totalHeight, count = 1) {
    const minFromBottom = 240;
    const minFromTop = 240;
    const usableHeight = totalHeight - minFromBottom - minFromTop;

    if (count === 1) {
      return [minFromBottom + usableHeight / 2];
    }

    const positions = [];
    const spacing = usableHeight / (count + 1);

    for (let i = 1; i <= count; i++) {
      positions.push(Math.round(minFromBottom + spacing * i));
    }

    return positions;
  }

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

  static validateModulesSelection(modules, totalModules) {
    if (!Array.isArray(modules) || modules.length === 0) {
      return {
        valid: false,
        message: "Au moins un module doit être sélectionné",
      };
    }

    const invalidModules = modules.filter((m) => m < 1 || m > totalModules);
    if (invalidModules.length > 0) {
      return {
        valid: false,
        message: `Modules invalides: ${invalidModules.join(
          ", "
        )} (1-${totalModules} autorisés)`,
      };
    }

    const uniqueModules = [...new Set(modules)];
    if (uniqueModules.length !== modules.length) {
      return {
        valid: false,
        message: "Modules en double détectés",
      };
    }

    return { valid: true };
  }

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

  static optimizeModulesOrder(modules) {
    return [...modules].sort((a, b) => a - b);
  }

  static calculateHeightConstraints(config, traverseType = "main") {
    if (traverseType === "porte") {
      const porteHeight = config.porte?.porteHeight || 2200;
      return {
        min: 200,
        max: porteHeight - 240,
        available: porteHeight - 200 - 240,
      };
    } else {
      const totalHeight = config.height || 2500;
      return {
        min: 240,
        max: totalHeight - 240,
        available: totalHeight - 240 - 240,
      };
    }
  }

  static analyzeTraverseDistribution(traverses, totalHeight) {
    if (!traverses || traverses.length === 0) {
      return {
        density: 0,
        gaps: [{ start: 240, end: totalHeight - 240, size: totalHeight - 480 }],
        recommendations: ["Aucune traverse définie"],
      };
    }

    const sortedTraverses = [...traverses].sort((a, b) => a.height - b.height);

    const gaps = [];
    const recommendations = [];

    if (sortedTraverses[0].height > 240) {
      const gapSize = sortedTraverses[0].height - 240;
      gaps.push({ start: 240, end: sortedTraverses[0].height, size: gapSize });

      if (gapSize > 800) {
        recommendations.push(`Espace avant première traverse (${gapSize}mm)`);
      }
    }

    for (let i = 0; i < sortedTraverses.length - 1; i++) {
      const current = sortedTraverses[i];
      const next = sortedTraverses[i + 1];
      const gapSize = next.height - current.height;

      if (gapSize > 0) {
        gaps.push({ start: current.height, end: next.height, size: gapSize });

        if (gapSize > 1000) {
          recommendations.push(
            `Espace entre traverses à ${current.height}mm et ${next.height}mm (${gapSize}mm)`
          );
        }
      }
    }

    const lastTraverse = sortedTraverses[sortedTraverses.length - 1];
    if (lastTraverse.height < totalHeight - 240) {
      const gapSize = totalHeight - 240 - lastTraverse.height;
      gaps.push({
        start: lastTraverse.height,
        end: totalHeight - 240,
        size: gapSize,
      });

      if (gapSize > 800) {
        recommendations.push(`Espace après dernière traverse (${gapSize}mm)`);
      }
    }

    const usableHeight = totalHeight - 480;
    const coveredHeight =
      usableHeight - gaps.reduce((sum, gap) => sum + gap.size, 0);
    const density = (coveredHeight / usableHeight) * 100;

    return { density, gaps, recommendations };
  }

  static generateTraverseSuggestions(config, existingTraverses = []) {
    const suggestions = [];
    const analysis = this.analyzeTraverseDistribution(
      existingTraverses,
      config.height
    );

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

    const totalHeight = config.height;
    if (totalHeight > 3000 && existingTraverses.length === 0) {
      suggestions.push({
        type: "structural",
        message: "Au moins une traverse recommandée",
        position: Math.round(totalHeight / 2),
      });
    }

    if (totalHeight > 4000 && existingTraverses.length < 2) {
      suggestions.push({
        type: "structural",
        message: "Deux traverses recommandées minimum",
      });
    }

    return suggestions;
  }

  static calculateStructuralImpact(traverses, config) {
    const totalHeight = config.height;
    const moduleWidth = config.width / config.modulesCount;

    let structuralRating = 50;
    const recommendations = [];

    structuralRating += traverses.length * 15;

    if (traverses.length > 1) {
      const analysis = this.analyzeTraverseDistribution(traverses, totalHeight);
      if (analysis.density > 60) {
        structuralRating += 10;
      }
    }

    if (totalHeight > 3000 && traverses.length === 0) {
      structuralRating -= 20;
      recommendations.push(
        "Traverse recommandée pour une verrière de cette hauteur"
      );
    }

    if (moduleWidth > 1200 && traverses.length === 0) {
      structuralRating -= 15;
      recommendations.push("Traverse recommandée pour des modules larges");
    }

    structuralRating = Math.min(100, Math.max(0, structuralRating));

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

  static validateGlobalTraverseCoherence(config) {
    const errors = [];
    const warnings = [];

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

  static formatModulesList(modules) {
    if (!modules || modules.length === 0) return "Aucun";

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

  static generateTraverseId(height, modules = [], type = "main") {
    const moduleString = modules.sort().join("-");
    return `${type}_${height}_${moduleString}_${Date.now()}`;
  }

  static areTraversesIdentical(traverse1, traverse2) {
    if (traverse1.height !== traverse2.height) return false;
    if (traverse1.type !== traverse2.type) return false;

    if (traverse1.modules && traverse2.modules) {
      const modules1 = [...traverse1.modules].sort();
      const modules2 = [...traverse2.modules].sort();
      return JSON.stringify(modules1) === JSON.stringify(modules2);
    }

    return true;
  }
}
