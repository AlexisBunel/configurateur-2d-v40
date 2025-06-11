// ===== js/export/TableRenderer.js =====
import { DebitsCalculator } from "../calculations/DebitsCalculator.js";

export class TableRenderer {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.currentDebits = null;

    this.init();
  }

  init() {
    // Écoute les changements de configuration pour recalculer
    this.eventBus.on("configChanged", (config) => {
      this.updateTables(config);
    });
  }

  /**
   * Met à jour tous les tableaux
   */
  updateTables(config) {
    try {
      console.log("🔄 Mise à jour des tableaux avec config:", config);

      // Calcul des débits
      this.currentDebits = DebitsCalculator.calculateDebits(config);

      console.log("📊 Débits calculés:", this.currentDebits);

      // Mise à jour des tableaux
      this.renderProfilesTable(this.currentDebits.profiles);
      this.renderAccessoriesTable(this.currentDebits.accessories);
      this.renderGlassTable(this.currentDebits.glass);
      this.updateTotals(this.currentDebits.totals);

      // Validation
      const validation = DebitsCalculator.validateDebits(
        this.currentDebits,
        config
      );
      this.displayValidation(validation);
    } catch (error) {
      console.error("❌ Erreur calcul débits:", error);
      this.showError("Erreur lors du calcul des débits: " + error.message);
    }
  }

  /**
   * Rendu du tableau des profilés
   */
  renderProfilesTable(profiles) {
    const tbody = document.querySelector("#profiles tbody");
    if (!tbody) {
      console.warn("⚠️ Tableau profiles non trouvé");
      return;
    }

    if (!profiles || profiles.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="empty-state">Aucun profilé calculé</td></tr>';
      return;
    }

    console.log("🔧 Rendu tableau profiles:", profiles);

    tbody.innerHTML = profiles
      .map(
        (profile) => `
      <tr data-category="${profile.category || "unknown"}">
        <td class="ref-cell">${profile.ref || "N/A"}</td>
        <td class="description-cell">${profile.description || "N/A"}</td>
        <td class="finish-cell">${profile.finition || "Standard"}</td>
        <td class="length-cell">${profile.length || 0} mm</td>
        <td class="quantity-cell">${profile.quantity || 0}</td>
        <td class="unit-price-cell">${this.formatPrice(
          profile.unitPrice || 0
        )}</td>
        <td class="total-price-cell">${this.formatPrice(
          profile.totalPrice || 0
        )}</td>
      </tr>
    `
      )
      .join("");

    // Ajouter ligne de sous-total général
    this.addTableSubtotal(tbody, profiles, "Profilés");
  }

  /**
   * Rendu du tableau des accessoires
   */
  renderAccessoriesTable(accessories) {
    const tbody = document.querySelector("#accessoires tbody");
    if (!tbody) {
      console.warn("⚠️ Tableau accessoires non trouvé");
      return;
    }

    if (!accessories || accessories.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="empty-state">Aucun accessoire</td></tr>';
      return;
    }

    tbody.innerHTML = accessories
      .map(
        (accessory) => `
      <tr data-category="${accessory.category || "unknown"}">
        <td class="ref-cell">${accessory.ref || "N/A"}</td>
        <td class="description-cell">${accessory.description || "N/A"}</td>
        <td class="quantity-cell">${accessory.quantity || 0}</td>
        <td class="length-cell">${accessory.length || "-"}</td>
        <td class="finish-cell">${accessory.finition || "Standard"}</td>
        <td class="unit-price-cell">${this.formatPrice(
          accessory.unitPrice || 0
        )}</td>
        <td class="total-price-cell">${this.formatPrice(
          accessory.totalPrice || 0
        )}</td>
      </tr>
    `
      )
      .join("");

    // Ajouter ligne de sous-total général
    this.addTableSubtotal(tbody, accessories, "Accessoires");
  }

  /**
   * Rendu du tableau du vitrage
   */
  renderGlassTable(glass) {
    const tbody = document.querySelector("#remplissage tbody");
    if (!tbody) {
      console.warn("⚠️ Tableau remplissage non trouvé");
      return;
    }

    if (!glass || glass.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="empty-state">Aucun vitrage</td></tr>';
      return;
    }

    tbody.innerHTML = glass
      .map(
        (g) => `
      <tr>
        <td class="ref-cell">${g.ref || "N/A"}</td>
        <td class="description-cell">${g.description || "N/A"}</td>
        <td class="thickness-cell">${g.epaisseur || "N/A"}</td>
        <td class="dimensions-cell">${g.dimensions || "N/A"}</td>
        <td class="surface-cell">${this.formatSurface(g.surface || 0)}</td>
        <td class="unit-price-cell">${this.formatPrice(
          g.unitPrice || 0
        )}/m²</td>
        <td class="total-price-cell">${this.formatPrice(g.totalPrice || 0)}</td>
      </tr>
    `
      )
      .join("");

    // Ajouter ligne de sous-total général
    this.addTableSubtotal(tbody, glass, "Remplissage");
  }

  /**
   * Met à jour les totaux
   */
  updateTotals(totals) {
    const totalElement = document.getElementById("total-amount");
    if (totalElement) {
      totalElement.innerHTML = `
        <div class="totals-breakdown">
          <div class="total-line">
            <span>Profilés :</span>
            <span>${this.formatPrice(totals.profiles)}</span>
          </div>
          <div class="total-line">
            <span>Accessoires :</span>
            <span>${this.formatPrice(totals.accessories)}</span>
          </div>
          <div class="total-line">
            <span>Vitrage :</span>
            <span>${this.formatPrice(totals.glass)}</span>
          </div>
          <div class="total-line grand-total">
            <span><strong>Total général :</strong></span>
            <span><strong>${this.formatPrice(totals.grandTotal)}</strong></span>
          </div>
        </div>
      `;
    }
  }

  /**
   * Ajoute un sous-total unique par tableau
   */
  addTableSubtotal(tbody, items, tableLabel) {
    if (!items || items.length === 0) return;

    const total = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    if (total > 0) {
      const subtotalRow = document.createElement("tr");
      subtotalRow.className = "table-subtotal-row";
      subtotalRow.style.borderTop = "2px solid #007bff";
      subtotalRow.style.backgroundColor = "#f8f9fa";
      subtotalRow.style.fontWeight = "bold";

      // Adapter le nombre de colonnes selon le tableau
      const colCount = tableLabel === "Accessoires" ? 7 : 7;

      subtotalRow.innerHTML = `
        <td colspan="${
          colCount - 1
        }" class="table-subtotal-label" style="text-align: right; padding: 12px;">
          Sous-total ${tableLabel} :
        </td>
        <td class="table-subtotal-amount" style="padding: 12px; text-align: right;">
          ${this.formatPrice(total)}
        </td>
      `;

      tbody.appendChild(subtotalRow);
    }
  }

  /**
   * Affiche la validation des débits
   */
  displayValidation(validation) {
    // Supprime les anciens messages
    this.clearValidationMessages();

    if (!validation.valid) {
      validation.errors.forEach((error) => {
        this.showValidationMessage(error, "error");
      });
    }

    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        this.showValidationMessage(warning, "warning");
      });
    }
  }

  /**
   * Affiche un message de validation
   */
  showValidationMessage(message, type = "info") {
    const container = document.getElementById("recapitulatif");
    if (!container) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `validation-message validation-${type}`;
    messageDiv.innerHTML = `
      <span class="validation-icon">${this.getValidationIcon(type)}</span>
      <span class="validation-text">${message}</span>
      <button class="validation-close" onclick="this.parentElement.remove()">×</button>
    `;

    // Insérer au début du conteneur
    container.insertBefore(messageDiv, container.firstChild);

    // Suppression automatique après 5 secondes pour les avertissements
    if (type === "warning") {
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 5000);
    }
  }

  /**
   * Supprime tous les messages de validation
   */
  clearValidationMessages() {
    document
      .querySelectorAll(".validation-message")
      .forEach((msg) => msg.remove());
  }

  // ===== FORMATAGE =====

  /**
   * Formate une longueur (supprimée car on affiche directement en mm)
   */
  formatLength(length) {
    // Cette méthode n'est plus utilisée - on affiche directement en mm
    return `${length || 0} mm`;
  }

  /**
   * Formate un prix
   */
  formatPrice(price) {
    return `${(price || 0).toFixed(2)} €`;
  }

  /**
   * Formate une surface
   */
  formatSurface(surface) {
    return `${(surface || 0).toFixed(2)} m²`;
  }

  /**
   * Retourne le label d'une catégorie
   */
  getCategoryLabel(category) {
    const labels = {
      structure: "Structure",
      parclose: "Parclose",
      porte: "Porte",
      quincaillerie: "Quincaillerie",
      etancheite: "Étanchéité",
      remplissage: "Remplissage",
    };
    return labels[category] || category;
  }

  /**
   * Retourne l'icône pour un type de validation
   */
  getValidationIcon(type) {
    const icons = {
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
      success: "✅",
    };
    return icons[type] || "ℹ️";
  }

  /**
   * Affiche un message d'erreur général
   */
  showError(message) {
    console.error("TableRenderer Error:", message);

    // Vider tous les tableaux
    ["#profiles tbody", "#accessoires tbody", "#remplissage tbody"].forEach(
      (selector) => {
        const tbody = document.querySelector(selector);
        if (tbody) {
          tbody.innerHTML = `<tr><td colspan="7" class="error-state">${message}</td></tr>`;
        }
      }
    );

    // Réinitialiser les totaux
    const totalElement = document.getElementById("total-amount");
    if (totalElement) {
      totalElement.textContent = "Erreur de calcul";
    }
  }

  // ===== MÉTHODES PUBLIQUES =====

  /**
   * Exporte les débits actuels
   */
  exportCurrentDebits() {
    if (!this.currentDebits) {
      throw new Error("Aucun débit calculé à exporter");
    }
    return this.currentDebits;
  }

  /**
   * Retourne un résumé des débits
   */
  getSummary() {
    if (!this.currentDebits) return null;
    return DebitsCalculator.generateSummary(this.currentDebits);
  }

  /**
   * Force le recalcul avec la configuration actuelle
   */
  refresh(config) {
    this.updateTables(config);
  }
}
