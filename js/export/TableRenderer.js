import { DebitsCalculator } from "../calculations/DebitsCalculator.js";

export class TableRenderer {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.currentDebits = null;

    this.init();
  }

  init() {
    this.eventBus.on("configChanged", (config) => {
      this.updateTables(config);
    });
  }

  updateTables(config) {
    try {
      this.currentDebits = DebitsCalculator.calculateDebits(config);

      this.renderProfilesTable(this.currentDebits.profiles);
      this.renderAccessoriesTable(this.currentDebits.accessories);
      this.renderGlassTable(this.currentDebits.glass);
      this.updateTotals(this.currentDebits.totals);

      const validation = DebitsCalculator.validateDebits(
        this.currentDebits,
        config
      );
      this.displayValidation(validation);
    } catch (error) {
      console.error("Erreur calcul débits:", error);
      this.showError("Erreur lors du calcul des débits: " + error.message);
    }
  }

  renderProfilesTable(profiles) {
    const tbody = document.querySelector("#profiles tbody");
    if (!tbody) {
      console.warn("Tableau profiles non trouvé");
      return;
    }

    if (!profiles || profiles.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="empty-state">Aucun profilé calculé</td></tr>';
      return;
    }

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

    this.addTableSubtotal(tbody, profiles, "Profilés");
  }

  renderAccessoriesTable(accessories) {
    const tbody = document.querySelector("#accessoires tbody");
    if (!tbody) {
      console.warn("Tableau accessoires non trouvé");
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

    this.addTableSubtotal(tbody, accessories, "Accessoires");
  }

  renderGlassTable(glass) {
    const tbody = document.querySelector("#remplissage tbody");
    if (!tbody) {
      console.warn("Tableau remplissage non trouvé");
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
        <td class="description-cell">${g.description || "N/A"}</td>
        <td class="thickness-cell">${g.epaisseur || "N/A"}</td>
        <td class="dimensions-cell">${g.dimensions || "N/A"}</td>
        <td class="surface-cell">${this.formatSurface(g.surface || 0)}</td>
        <td class="quantity-cell">${g.quantity || 0}</td>
        <td class="unit-price-cell">${this.formatPrice(
          g.unitPrice || 0
        )}/m²</td>
        <td class="total-price-cell">${this.formatPrice(g.totalPrice || 0)}</td>
      </tr>
    `
      )
      .join("");

    this.addTableSubtotal(tbody, glass, "Remplissage");
  }

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

  addTableSubtotal(tbody, items, tableLabel) {
    if (!items || items.length === 0) return;

    const total = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    if (total > 0) {
      const subtotalRow = document.createElement("tr");
      subtotalRow.className = "table-subtotal-row";
      subtotalRow.style.borderTop = "2px solid #007bff";
      subtotalRow.style.backgroundColor = "#f8f9fa";
      subtotalRow.style.fontWeight = "bold";

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

  displayValidation(validation) {
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

  clearValidationMessages() {
    document
      .querySelectorAll(".validation-message")
      .forEach((msg) => msg.remove());
  }

  formatLength(length) {
    return `${length || 0} mm`;
  }

  formatPrice(price) {
    return `${(price || 0).toFixed(2)} €`;
  }

  formatSurface(surface) {
    return `${(surface || 0).toFixed(2)} m²`;
  }

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

  getValidationIcon(type) {
    const icons = {
      error: "X",
      warning: "!",
      info: "i",
      success: "v",
    };
    return icons[type] || "i";
  }

  showError(message) {
    console.error("TableRenderer Error:", message);

    ["#profiles tbody", "#accessoires tbody", "#remplissage tbody"].forEach(
      (selector) => {
        const tbody = document.querySelector(selector);
        if (tbody) {
          tbody.innerHTML = `<tr><td colspan="7" class="error-state">${message}</td></tr>`;
        }
      }
    );

    const totalElement = document.getElementById("total-amount");
    if (totalElement) {
      totalElement.textContent = "Erreur de calcul";
    }
  }

  exportCurrentDebits() {
    if (!this.currentDebits) {
      throw new Error("Aucun débit calculé à exporter");
    }
    return this.currentDebits;
  }

  getSummary() {
    if (!this.currentDebits) return null;
    return DebitsCalculator.generateSummary(this.currentDebits);
  }

  refresh(config) {
    this.updateTables(config);
  }
}
