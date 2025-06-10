// ===== Mise à jour de js/calculations/DebitsCalculator.js =====
// ===== Section à ajouter après l'import des modules =====

import { References } from "../data/References.js";
import { PorteCalculator } from "./PorteCalculator.js";
import { PC40Calculator } from "./PC40Calculator.js";
import { PT40Calculator } from "./PT40Calculator.js";
import { PorteProfilesCalculator } from "./PorteProfilesCalculator.js";

export class DebitsCalculator {
  /**
   * Calcule tous les débits pour une configuration
   * @param {Object} config - Configuration complète
   * @returns {{profiles: Array, accessories: Array, glass: Array, totals: Object}}
   */
  static calculateDebits(config) {
    const profiles = this.calculateProfiles(config);
    const accessories = this.calculateAccessories(config);
    const glass = this.calculateGlass(config);

    // Calcul des totaux
    const totals = this.calculateTotals(profiles, accessories, glass);

    return { profiles, accessories, glass, totals };
  }

  /**
   * Calcule les débits de profilés
   */
  static calculateProfiles(config) {
    const profiles = [];

    console.log("🔧 Calcul des profils pour config:", config);

    // ===== CALCUL PC40 et PAC40 =====
    try {
      const pc40Report = PC40Calculator.generateReport(config);

      console.log("📊 Rapport PC40:", pc40Report);

      // Ajouter les lignes PC40
      pc40Report.tableLines.PC40.forEach((line) => {
        profiles.push({
          ref: line.ref,
          description: line.description,
          finition: this.getFinishDescription(
            config.options?.colorProfile || "noir"
          ),
          length: line.length,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          totalPrice: line.totalPrice,
          category: line.category,
        });
      });

      // Ajouter les lignes PAC40
      pc40Report.tableLines.PAC40.forEach((line) => {
        profiles.push({
          ref: line.ref,
          description: line.description,
          finition: this.getFinishDescription(
            config.options?.colorProfile || "noir"
          ),
          length: line.length,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          totalPrice: line.totalPrice,
          category: line.category,
        });
      });

      // Afficher les avertissements s'il y en a
      if (pc40Report.validation.warnings.length > 0) {
        console.warn("⚠️ Avertissements PC40:", pc40Report.validation.warnings);
      }
    } catch (error) {
      console.error("❌ Erreur calcul PC40:", error);

      // En cas d'erreur, ajouter des entrées par défaut
      profiles.push({
        ref: "PC40",
        description: "PC40 - Erreur de calcul",
        finition: "Standard",
        length: 0,
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
        category: "structure",
      });
    }

    // ===== CALCUL PT40 et PAT40 (traverses) =====
    try {
      const traversesReport = PT40Calculator.generateReport(config);

      console.log("📊 Rapport Traverses:", traversesReport);

      // Ajouter les lignes PT40 et PAT40
      traversesReport.tableLines.forEach((line) => {
        profiles.push({
          ref: line.ref,
          description: line.description,
          finition: this.getFinishDescription(
            config.options?.colorProfile || "noir"
          ),
          length: line.length,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          totalPrice: line.totalPrice,
          category: line.category,
        });
      });

      // Afficher les avertissements s'il y en a
      if (traversesReport.validation.warnings.length > 0) {
        console.warn(
          "⚠️ Avertissements Traverses:",
          traversesReport.validation.warnings
        );
      }
    } catch (error) {
      console.error("❌ Erreur calcul Traverses:", error);

      // En cas d'erreur, ajouter des entrées par défaut
      profiles.push({
        ref: "PT40",
        description: "PT40 - Erreur de calcul",
        finition: "Standard",
        length: 0,
        quantity: 0,
        unitPrice: 0,
        totalPrice: 0,
        category: "structure",
      });
    }

    // ===== CALCUL PROFILS DE PORTE =====
    if (config.type === "porte") {
      try {
        const porteProfilesReport =
          PorteProfilesCalculator.generateReport(config);

        console.log("📊 Rapport Profils Porte:", porteProfilesReport);

        // Ajouter les lignes des profils de porte
        porteProfilesReport.tableLines.forEach((line) => {
          profiles.push({
            ref: line.ref,
            description: line.description,
            finition: this.getFinishDescription(
              config.options?.colorProfile || "noir"
            ),
            length: line.length,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            totalPrice: line.totalPrice,
            category: line.category,
          });
        });

        // Afficher les avertissements s'il y en a
        if (porteProfilesReport.validation.warnings.length > 0) {
          console.warn(
            "⚠️ Avertissements Profils Porte:",
            porteProfilesReport.validation.warnings
          );
        }
      } catch (error) {
        console.error("❌ Erreur calcul Profils Porte:", error);

        // En cas d'erreur, ajouter des entrées par défaut
        profiles.push({
          ref: "PTPV51",
          description: "PTPV51 - Erreur de calcul",
          finition: "Standard",
          length: 0,
          quantity: 0,
          unitPrice: 0,
          totalPrice: 0,
          category: "structure",
        });
      }
    }

    return profiles;
  }

  /**
   * Calcule les accessoires (temporairement vide)
   */
  static calculateAccessories(config) {
    // Pour l'instant, retourner un tableau vide
    // À implémenter plus tard selon les besoins
    return [];
  }

  /**
   * Calcule le remplissage vitrage (temporairement vide)
   */
  static calculateGlass(config) {
    // Pour l'instant, retourner un tableau vide
    // À implémenter plus tard selon les besoins
    return [];
  }

  /**
   * Calcule les totaux généraux
   */
  static calculateTotals(profiles, accessories, glass) {
    const profilesTotal = profiles.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0
    );
    const accessoriesTotal = accessories.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0
    );
    const glassTotal = glass.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0
    );

    const grandTotal = profilesTotal + accessoriesTotal + glassTotal;

    return {
      profiles: Math.round(profilesTotal * 100) / 100,
      accessories: Math.round(accessoriesTotal * 100) / 100,
      glass: Math.round(glassTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      currency: "€",
    };
  }

  /**
   * Validation des débits calculés
   */
  static validateDebits(debits, config) {
    const errors = [];
    const warnings = [];

    // Vérification profilés
    if (!debits.profiles || debits.profiles.length === 0) {
      errors.push("Aucun profilé calculé");
    }

    // Vérification cohérence PC40/PAC40
    const pc40Items = debits.profiles.filter((p) => p.ref === "PC40");
    const pac40Items = debits.profiles.filter((p) => p.ref === "PAC40");

    if (pc40Items.length !== pac40Items.length) {
      warnings.push("Incohérence entre PC40 et PAC40");
    }

    // Vérification longueurs négatives
    const negativeLength = debits.profiles.find((p) => p.length < 0);
    if (negativeLength) {
      errors.push(`Longueur négative détectée: ${negativeLength.ref}`);
    }

    // Vérification spécifique aux profils de porte
    if (config.type === "porte") {
      const ptciv51Items = debits.profiles.filter((p) => p.ref === "PTCIV51");
      const ptpv51Items = debits.profiles.filter((p) => p.ref === "PTPV51");
      const patp65Items = debits.profiles.filter((p) => p.ref === "PATP65");

      // Vérifier que si on a des profils PTCIV51 ou PTPV51, on a aussi des PATP65
      if (
        (ptciv51Items.length > 0 || ptpv51Items.length > 0) &&
        patp65Items.length === 0
      ) {
        warnings.push("Profils de porte sans parcloses PATP65");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Génère un résumé des débits
   */
  static generateSummary(debits) {
    const { profiles, accessories, glass, totals } = debits;

    return {
      items: {
        profiles: profiles.length,
        accessories: accessories.length,
        glass: glass.length,
      },
      quantities: {
        profilesLength: profiles.reduce(
          (sum, p) => sum + p.length * p.quantity,
          0
        ),
        accessoriesCount: accessories.reduce(
          (sum, a) => sum + (a.quantity || 0),
          0
        ),
        glassArea: glass.reduce((sum, g) => sum + (g.surface || 0), 0),
      },
      costs: totals,
      formatted: {
        profilesLength: `${Math.round(
          profiles.reduce((sum, p) => sum + p.length * p.quantity, 0) / 1000
        )}m`,
        glassArea: `${glass
          .reduce((sum, g) => sum + (g.surface || 0), 0)
          .toFixed(2)}m²`,
        grandTotal: `${totals.grandTotal.toFixed(2)}€`,
      },
    };
  }

  /**
   * Convertit les débits pour export
   */
  static formatForExport(debits, config) {
    return {
      configuration: {
        dimensions: `${config.width}×${config.height}mm`,
        type: config.type,
        modules: config.modulesCount,
        date: new Date().toISOString().split("T")[0],
      },
      debits: {
        profiles: debits.profiles.map((p) => ({
          reference: p.ref,
          designation: p.description,
          finition: p.finition || "Standard",
          longueur: `${p.length}mm`,
          quantite: p.quantity,
          prix_unitaire: `${(p.unitPrice || 0).toFixed(2)}€`,
          prix_total: `${(p.totalPrice || 0).toFixed(2)}€`,
        })),
        accessories: debits.accessories.map((a) => ({
          reference: a.ref || "N/A",
          designation: a.description || "N/A",
          quantite: a.quantity || 0,
          finition: a.finition || "Standard",
          prix_unitaire: `${(a.unitPrice || 0).toFixed(2)}€`,
          prix_total: `${(a.totalPrice || 0).toFixed(2)}€`,
        })),
        glass: debits.glass.map((g) => ({
          reference: g.ref || "N/A",
          designation: g.description || "N/A",
          epaisseur: g.epaisseur || "6mm",
          dimensions: g.dimensions || "N/A",
          surface: `${(g.surface || 0).toFixed(2)}m²`,
          prix_unitaire: `${(g.unitPrice || 0).toFixed(2)}€/m²`,
          prix_total: `${(g.totalPrice || 0).toFixed(2)}€`,
        })),
      },
      totaux: {
        profiles: `${debits.totals.profiles.toFixed(2)}€`,
        accessories: `${debits.totals.accessories.toFixed(2)}€`,
        glass: `${debits.totals.glass.toFixed(2)}€`,
        total_general: `${debits.totals.grandTotal.toFixed(2)}€`,
      },
    };
  }

  /**
   * Retourne la description de finition selon la couleur
   */
  static getFinishDescription(colorProfile) {
    const colorMap = {
      noir: "Laqué noir RAL 9005 granité",
      gris: "Laqué gris RAL 7016 granité",
      blanc: "Laqué blanc RAL 9003 granité",
    };
    return colorMap[colorProfile] || "RAL 9005 granité";
  }
}
