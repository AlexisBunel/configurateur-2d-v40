import { References } from "../data/References.js";
import { PorteCalculator } from "./PorteCalculator.js";
import { PC40Calculator } from "./PC40Calculator.js";
import { PT40Calculator } from "./PT40Calculator.js";
import { PorteProfilesCalculator } from "./PorteProfilesCalculator.js";
import { AccessoriesCalculator } from "./AccessoriesCalculator.js";
import { GlassCalculator } from "./GlassCalculator.js";

export class DebitsCalculator {
  static calculateDebits(config) {
    const profiles = this.calculateProfiles(config);
    const accessories = this.calculateAccessories(config);
    const glass = this.calculateGlass(config);

    const totals = this.calculateTotals(profiles, accessories, glass);

    return { profiles, accessories, glass, totals };
  }

  static calculateProfiles(config) {
    const profiles = [];

    try {
      const pc40Report = PC40Calculator.generateReport(config);

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
    } catch (error) {
      console.error("Erreur calcul PC40:", error);

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

    try {
      const traversesReport = PT40Calculator.generateReport(config);

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

      if (traversesReport.validation.warnings.length > 0) {
      }
    } catch (error) {
      console.error("Erreur calcul Traverses:", error);

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

    if (config.type === "porte") {
      try {
        const porteProfilesReport =
          PorteProfilesCalculator.generateReport(config);

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
      } catch (error) {
        console.error("Erreur calcul Profils Porte:", error);
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

  static calculateAccessories(config) {
    try {
      const accessoriesReport = AccessoriesCalculator.generateReport(config);

      const accessories = accessoriesReport.tableLines.map((line) => ({
        ref: line.ref,
        description: line.description,
        quantity: line.quantity,
        length: line.length,
        finition: line.finition || "-",
        unitPrice: line.unitPrice,
        totalPrice: line.totalPrice,
        category: line.category,
      }));

      return accessories;
    } catch (error) {
      console.error("Erreur calcul Accessoires:", error);
      return [];
    }
  }

  static calculateGlass(config) {
    try {
      const glassReport = GlassCalculator.generateReport(config);

      const glass = glassReport.tableLines.map((line) => ({
        description: line.description,
        epaisseur: line.epaisseur,
        dimensions: line.dimensions,
        surface: line.surface,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        totalPrice: line.totalPrice,
        category: line.category,
      }));

      return glass;
    } catch (error) {
      console.error("Erreur calcul Remplissage:", error);
      return [];
    }
  }

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

  static validateDebits(debits, config) {
    const errors = [];
    const warnings = [];

    if (!debits.profiles || debits.profiles.length === 0) {
      errors.push("Aucun profilé calculé");
    }

    const pc40Items = debits.profiles.filter((p) => p.ref === "PC40");
    const pac40Items = debits.profiles.filter((p) => p.ref === "PAC40");

    if (pc40Items.length !== pac40Items.length) {
      warnings.push("Incohérence entre PC40 et PAC40");
    }

    const negativeLength = debits.profiles.find((p) => p.length < 0);
    if (negativeLength) {
      errors.push(`Longueur négative détectée: ${negativeLength.ref}`);
    }

    if (config.type === "porte") {
      const ptciv51Items = debits.profiles.filter((p) => p.ref === "PTCIV51");
      const ptpv51Items = debits.profiles.filter((p) => p.ref === "PTPV51");
      const patp65Items = debits.profiles.filter((p) => p.ref === "PATP65");

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

  static formatForExport(debits, config) {
    return {
      configuration: {
        dimensions: `${config.width}x${config.height}mm`,
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

  static getFinishDescription(colorProfile) {
    const colorMap = {
      noir: "Laqué noir RAL 9005 granité",
      gris: "Laqué gris RAL 7016 granité",
      blanc: "Laqué blanc RAL 9003 granité",
    };
    return colorMap[colorProfile] || "RAL 9005 granité";
  }
}
