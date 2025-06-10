// ===== js/export/PDFExporter.js =====
export class PDFExporter {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.jsPDF = null;
    this.init();
  }

  async init() {
    // Charger jsPDF depuis CDN
    await this.loadJsPDF();

    // Attacher le listener au bouton
    this.attachExportListener();
  }

  /**
   * Charge la bibliothèque jsPDF depuis CDN
   */
  async loadJsPDF() {
    // Vérifier si jsPDF est déjà chargé
    if (window.jsPDF) {
      this.jsPDF = window.jsPDF.jsPDF || window.jsPDF;
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";

      script.onload = () => {
        // Attendre un peu que la bibliothèque soit complètement chargée
        setTimeout(() => {
          try {
            if (window.jsPDF && window.jsPDF.jsPDF) {
              // Ancienne détection, peu probable ici
              this.jsPDF = window.jsPDF.jsPDF;
              resolve();
            } else if (window.jsPDF) {
              this.jsPDF = window.jsPDF;
              resolve();
            } else if (window.jspdf && window.jspdf.jsPDF) {
              // C’EST TON CAS ACTUEL !
              this.jsPDF = window.jspdf.jsPDF;
              resolve();
            } else if (window.jspdf && window.jspdf.default) {
              // Certains CDN font ça
              this.jsPDF = window.jspdf.default;
              resolve();
            } else {
              console.error("❌ jsPDF non trouvé dans window");
              console.log(
                "Window keys:",
                Object.keys(window).filter((k) =>
                  k.toLowerCase().includes("pdf")
                )
              );
              reject(new Error("jsPDF non accessible"));
            }
          } catch (error) {
            console.error("❌ Erreur accès jsPDF:", error);
            reject(error);
          }
        }, 100);
      };

      script.onerror = (error) => {
        console.error("❌ Erreur chargement script jsPDF:", error);
        reject(new Error("Impossible de charger jsPDF"));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Attache le listener au bouton d'export
   */
  attachExportListener() {
    const exportBtn = document.getElementById("export-pdf");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        this.exportPDF();
      });

      // Ajouter un titre informatif
      exportBtn.title = "Générer un PDF avec le récapitulatif et les débits";

      console.log("✅ Listener export PDF attaché");
    } else {
      console.warn("⚠️ Bouton export-pdf non trouvé");
    }
  }

  /**
   * Génère et ouvre le PDF
   */
  async exportPDF() {
    try {
      console.log("🔄 Début génération PDF...");

      // Vérifier que jsPDF est chargé
      if (!this.jsPDF) {
        console.log("📥 Rechargement de jsPDF...");
        await this.loadJsPDF();
      }

      if (!this.jsPDF) {
        throw new Error("jsPDF non disponible après chargement");
      }

      console.log("📊 Récupération des données...");

      // Récupérer les données nécessaires
      const config = this.getConfigurationData();
      const profilesData = this.getProfilesData();

      console.log("📄 Création du document PDF...");

      // Créer le PDF
      const doc = new this.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Générer le contenu
      this.generatePDFContent(doc, config, profilesData);

      console.log("🚀 Ouverture du PDF...");

      // Ouvrir dans un nouvel onglet
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Ouvrir dans un nouvel onglet
      const newWindow = window.open(pdfUrl, "_blank");

      if (!newWindow) {
        // Si le popup est bloqué, proposer le téléchargement
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `verriere_config_${new Date().getTime()}.pdf`;
        link.click();
        console.log("📥 PDF téléchargé (popup bloqué)");
      } else {
        console.log("✅ PDF ouvert dans nouvel onglet");
      }
    } catch (error) {
      console.error("❌ Erreur génération PDF:", error);

      // Message d'erreur détaillé pour debug
      const errorMsg = `Erreur lors de la génération du PDF:\n${error.message}\n\nVérifiez la console pour plus de détails.`;
      alert(errorMsg);
    }
  }

  /**
   * Récupère les données de configuration
   */
  getConfigurationData() {
    try {
      // Récupérer depuis le configModel via l'app globale
      const config = window.verrierApp?.getConfig();
      if (!config) {
        throw new Error("Configuration non accessible");
      }

      return {
        dimensions: `${config.width} × ${config.height} mm`,
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

  /**
   * Récupère les données du tableau des profilés
   */
  getProfilesData() {
    const profiles = [];

    try {
      // Récupérer depuis le tableau DOM
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

      // Récupérer le total depuis le sous-total
      let totalProfiles = "0,00 €";
      const subtotalRow = tbody.querySelector(".table-subtotal-row");
      if (subtotalRow) {
        const totalCell = subtotalRow.querySelector(".table-subtotal-amount");
        if (totalCell) {
          totalProfiles = totalCell.textContent.trim();
        }
      }

      console.log(`📊 ${profiles.length} profils récupérés pour le PDF`);

      return { profiles, total: totalProfiles };
    } catch (error) {
      console.error("❌ Erreur récupération profiles:", error);
      return { profiles: [], total: "0,00 €" };
    }
  }

  /**
   * Génère le contenu du PDF
   */
  generatePDFContent(doc, config, profilesData) {
    let yPosition = 20;

    // ===== EN-TÊTE =====
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Configurateur Verrière V40", 105, yPosition, { align: "center" });

    yPosition += 20;

    // ===== RÉCAPITULATIF CONFIGURATION =====
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Récapitulatif de la configuration", 20, yPosition);

    yPosition += 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    const configLines = [
      `Dimensions : ${config.dimensions}`,
      `Type : ${config.type}`,
      `Nombre de modules : ${config.modules}`,
      `Finition : ${config.finition}`,
    ];

    // Ajouter infos porte si applicable
    if (config.porte) {
      configLines.push(
        `Porte - Largeur : ${config.porte.largeur}`,
        `Porte - Hauteur : ${config.porte.hauteur}`,
        `Avec tierce : ${config.porte.tierce}`,
        `Avec imposte : ${config.porte.imposte}`
      );
    }

    configLines.forEach((line) => {
      doc.text(line, 25, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // ===== TABLEAU DES PROFILÉS =====
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Débits des profilés", 20, yPosition);

    yPosition += 10;

    // Vérifier qu'on a des données
    if (profilesData.profiles.length === 0) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      doc.text("Aucun profilé calculé", 25, yPosition);
      return;
    }

    // En-têtes du tableau
    const headers = ["Réf.", "Désignation", "Finition", "Long.", "Qté"];
    // Tu peux ajuster les largeurs au besoin :
    const colWidths = [20, 50, 35, 25, 15];
    const colX = [20, 40, 90, 125, 150];

    // Style en-têtes
    doc.setFillColor(73, 80, 87); // Gris foncé
    doc.setTextColor(255, 255, 255); // Blanc
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");

    // Dessiner l'en-tête
    doc.rect(20, yPosition, 175, 8, "F");
    headers.forEach((header, i) => {
      doc.text(header, colX[i] + 2, yPosition + 6);
    });

    yPosition += 8;

    // Style données
    doc.setTextColor(0, 0, 0); // Noir
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    let isEvenRow = true;

    profilesData.profiles.forEach((profile, index) => {
      // Vérifier si on a assez de place (garde 30mm pour le total)
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;

        // Redessiner l'en-tête sur la nouvelle page
        doc.setFillColor(73, 80, 87);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.rect(20, yPosition, 175, 8, "F");
        headers.forEach((header, i) => {
          doc.text(header, colX[i] + 2, yPosition + 6);
        });
        yPosition += 8;

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        isEvenRow = true;
      }

      // Alternance couleur lignes
      if (isEvenRow) {
        doc.setFillColor(248, 249, 250); // Gris très clair
        doc.rect(20, yPosition, 175, 7, "F");
      }

      // Données
      const rowData = [
        profile.ref,
        this.truncateText(profile.description, 25),
        this.truncateText(profile.finition, 18),
        profile.longueur,
        profile.quantite,
      ];

      rowData.forEach((data, i) => {
        doc.text(data, colX[i] + 2, yPosition + 5);
      });

      // Bordure de ligne
      doc.setDrawColor(233, 236, 239);
      doc.line(20, yPosition + 7, 195, yPosition + 7);

      yPosition += 7;
      isEvenRow = !isEvenRow;
    });
  }

  /**
   * Tronque un texte pour l'adapter aux colonnes
   */
  truncateText(text, maxLength) {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  /**
   * Convertit le code couleur en label
   */
  getFinitionLabel(colorProfile) {
    const colorMap = {
      noir: "Laqué noir RAL 9005 granité",
      gris: "Laqué gris RAL 7016 granité",
      blanc: "Laqué blanc RAL 9003 granité",
    };
    return colorMap[colorProfile] || "RAL 9005 granité";
  }

  /**
   * Méthode publique pour export manuel
   */
  async export(configData = null, profilesData = null) {
    const config = configData || this.getConfigurationData();
    const profiles = profilesData || this.getProfilesData();

    await this.exportPDF();
  }
}
