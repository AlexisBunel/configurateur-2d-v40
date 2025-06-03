// 1. Une fonction pour démarrer l'app
function init() {
  console.log("App démarrée !");
  bindFormElements();
}

function bindFormElements() {
  // 1. Récupérer tous les éléments avec data-config-key
  const elements = document.querySelectorAll("[data-config-key]");

  // 2. Pour chaque élément...
  elements.forEach((element) => {
    const configKey = element.getAttribute("data-config-key");

    const getValue = () => {
      switch (element.type) {
        case "checkbox":
          return /* element.checked ou element.value ? */;
        case "radio":
          return /* Comment gérer les radios ? */;
        case "number":
          return /* Nombre ou string ? */;
        default:
          return /* element.value normal */;
      }
    };

    const getEventType = () => {
      switch (element.type) {
        case "checkbox":
        case "radio":
        case "range":
          return "change";
        case "number":
          return "blur"; // Validation uniquement à la perte de focus
        default:
          return element.tagName.toLowerCase() === "select" ? "change" : "blur";
      }
    };

    // 3. Ajouter un écouteur d'événement
    element.addEventListener(getEventType(), (event) => {
      const value = getValue();
      updateConfig(configKey, value);
    });
  });
}

// 2. Démarrer quand le DOM est prêt
document.addEventListener("DOMContentLoaded", init);
