// ===== js/export/PDFExporter.js =====
export class PDFExporter {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.jsPDF = null;
    this.logoBase64 = null;
    this.init();
  }

  async init() {
    await this.loadJsPDF();

    this.attachExportListener();
  }

  async loadJsPDF() {
    if (window.jsPDF) {
      this.jsPDF = window.jsPDF.jsPDF || window.jsPDF;
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

      script.onload = () => {
        setTimeout(() => {
          try {
            if (window.jsPDF && window.jsPDF.jsPDF) {
              this.jsPDF = window.jsPDF.jsPDF;
              resolve();
            } else if (window.jsPDF) {
              this.jsPDF = window.jsPDF;
              resolve();
            } else if (window.jspdf && window.jspdf.jsPDF) {
              this.jsPDF = window.jspdf.jsPDF;
              resolve();
            } else if (window.jspdf && window.jspdf.default) {
              this.jsPDF = window.jspdf.default;
              resolve();
            } else {
              console.error("jsPDF non trouvé dans window");

              reject(new Error("jsPDF non accessible"));
            }
          } catch (error) {
            console.error("Erreur accès jsPDF:", error);
            reject(error);
          }
        }, 100);
      };

      script.onerror = (error) => {
        console.error("Erreur chargement script jsPDF:", error);
        reject(new Error("Impossible de charger jsPDF"));
      };

      document.head.appendChild(script);
    });
  }

  async loadLogo() {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = "/img/logo.png";

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        this.logoBase64 = canvas.toDataURL("image/png");
        resolve();
      };

      img.onerror = () => {
        console.warn("Impossible de charger le logo : img/logo.png");
        this.logoBase64 = null;
        resolve();
      };
    });
  }

  attachExportListener() {
    const exportBtn = document.getElementById("export-pdf");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        this.exportPDF();
      });

      exportBtn.title = "Générer un PDF avec le récapitulatif et les débits";
    } else {
      console.warn("Bouton export-pdf non trouvé");
    }
  }

  async exportPDF() {
    try {
      if (!this.jsPDF) {
        await this.loadJsPDF();
        await this.loadLogo();
      }

      if (!this.jsPDF) {
        throw new Error("jsPDF non disponible après chargement");
      }

      const config = this.getConfigurationData();
      const profilesData = this.getProfilesData();

      // Créer le PDF
      const doc = new this.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      this.generatePDFContent(doc, config, profilesData);

      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const newWindow = window.open(pdfUrl, "_blank");

      if (!newWindow) {
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `verriere_config_${new Date().getTime()}.pdf`;
        link.click();
      }
    } catch (error) {
      console.error("Erreur génération PDF:", error);

      const errorMsg = `Erreur lors de la génération du PDF:\n${error.message}\n\nVérifiez la console pour plus de détails.`;
      alert(errorMsg);
    }
  }

  generatePDFContent(doc, config, profilesData) {
    let yPosition = 15;

    // ----- HEADER -----
    // Logo
    if (this.logoBase64) {
      doc.addImage(this.logoBase64, "PNG", 15, yPosition - 5, 30, 30);
    }

    // Titre
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Verrière V40", 105, yPosition + 5, { align: "center" });

    // Date + heure
    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR");
    const timeStr = now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateTimeStr = `Le ${dateStr} à ${timeStr}`;

    doc.setFontSize(10);
    doc.text(dateTimeStr, 200 - 15, yPosition + 13, { align: "right" });

    // Ligne de séparation
    doc.setLineWidth(0.5);
    doc.line(15, yPosition + 15, 200 - 15, yPosition + 15);

    yPosition += 30;

    doc.setFontSize(14);
    doc.text("Récapitulatif de la configuration", 20, yPosition);
    yPosition += 10;
  }

  getConfigurationData() {
    try {
      const config = window.verrierApp?.getConfig();
      if (!config) {
        throw new Error("Configuration non accessible");
      }

      return {
        dimensions: `${config.width} x ${config.height} mm`,
        type:
          config.type === "porte" ? "Avec porte battante" : "Verrière pleine",
        modules: `${config.modulesCount} modules`,
        finition: this.getFinitionLabel(config.options?.colorProfile),
        porte:
          config.type === "porte"
            ? {
                largeur: `${config.porte?.porteWidth || 0} mm`,
                hauteur: `${config.porte?.porteHeight || 0} mm`,
                tierce: config.porte?.withTierce ? "Oui" : "Non",
                imposte: config.porte?.withImposte ? "Oui" : "Non",
              }
            : null,
        date: new Date().toLocaleDateString("fr-FR"),
      };
    } catch (error) {
      console.error("❌ Erreur récupération config:", error);
      return {
        dimensions: "N/A",
        type: "N/A",
        modules: "N/A",
        finition: "N/A",
        date: new Date().toLocaleDateString("fr-FR"),
      };
    }
  }

  getProfilesData() {
    const profiles = [];

    try {
      const tbody = document.querySelector("#profiles tbody");
      if (!tbody) {
        throw new Error("Tableau profiles non trouvé");
      }

      const rows = tbody.querySelectorAll("tr:not(.table-subtotal-row)");

      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 7 && !row.classList.contains("empty-state")) {
          profiles.push({
            ref: cells[0]?.textContent?.trim() || "",
            description: cells[1]?.textContent?.trim() || "",
            finition: cells[2]?.textContent?.trim() || "",
            longueur: cells[3]?.textContent?.trim() || "",
            quantite: cells[4]?.textContent?.trim() || "",
            prixUnit: cells[5]?.textContent?.trim() || "",
            total: cells[6]?.textContent?.trim() || "",
          });
        }
      });

      let totalProfiles = "0,00 €";
      const subtotalRow = tbody.querySelector(".table-subtotal-row");
      if (subtotalRow) {
        const totalCell = subtotalRow.querySelector(".table-subtotal-amount");
        if (totalCell) {
          totalProfiles = totalCell.textContent.trim();
        }
      }

      return { profiles, total: totalProfiles };
    } catch (error) {
      console.error("Erreur récupération profiles:", error);
      return { profiles: [], total: "0,00 €" };
    }
  }
}
