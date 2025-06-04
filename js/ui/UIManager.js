export class UIManager {
  constructor(configModel, eventBus) {
    this.configModel = configModel;
    this.eventBus = eventBus;

    // Méthode d'init rapide
    this.attachInputs();
    this.attachListeners();

    // Réagit à tout changement du modèle (ex: autre onglet, import...)
    this.eventBus.on("configChanged", (config) => {
      this.updateFormFromModel(config);
      this.updateModulesInputs(config);
      this.updateTraversesSelect(config);
      this.updateTraversesPorteSelect(config);
      console.log("Config à jour :", JSON.parse(JSON.stringify(config)));
    });

    document
      .getElementById("add-traverse")
      .addEventListener("click", () => this.showAddTraverseForm());

    document.getElementById("delete-traverse").addEventListener("click", () => {
      const select = document.getElementById("list-traverses");
      const selectedId = select.value;
      if (!selectedId) return;

      this.configModel.removeTraverse(Number(selectedId));
      this.eventBus.emit("configChanged", this.configModel.getConfig());
    });

    document
      .getElementById("add-traverse-porte")
      .addEventListener("click", () => this.showAddTraversePorteForm());

    document
      .getElementById("delete-traverse-porte")
      .addEventListener("click", () => {
        const select = document.getElementById("list-traverses-porte");
        const selectedId = select.value;
        if (!selectedId) return;

        this.configModel.removeTraversePorte(Number(selectedId));
        this.eventBus.emit("configChanged", this.configModel.getConfig());
      });
  }

  // Lie chaque input du formulaire à la méthode métier correspondante
  attachInputs() {
    document.querySelectorAll("[data-config-key]").forEach((input) => {
      // Ici, tu attaches le listener seulement une fois à l'initialisation,
      // et UNIQUEMENT pour les inputs qui ne sont pas détruits/recréés.
      input.addEventListener("change", (e) => {
        const key = input.getAttribute("data-config-key");
        let value;

        if (input.type === "checkbox") {
          value = input.checked;
        } else if (input.type === "number") {
          value = input.value === "" ? null : Number(input.value);
        } else if (input.type === "radio") {
          if (!input.checked) return;
          value = input.value;
          if (value === "true") value = true;
          if (value === "false") value = false;
        } else {
          value = input.value;
          if (value === "true") value = true;
          if (value === "false") value = false;
          if (value === "null") value = null;
        }
        this.setConfigValueByKey(key, value);
      });
    });
  }

  setConfigValueByKey(key, value) {
    const keys = key.split(".");
    let target = this.configModel.state;

    for (let i = 0; i < keys.length - 1; i++) {
      // Si la clé est un nombre => tableau
      if (!isNaN(keys[i])) {
        const index = Number(keys[i]);
        if (!Array.isArray(target))
          throw new Error("Accès tableau sur un objet non tableau");
        if (!target[index]) target[index] = {}; // crée si inexistant
        target = target[index];
      }
      // Si clé style modules.1.width => modules est un tableau, 1 est l'index
      else if (Array.isArray(target[keys[i]])) {
        // Si la clé suivante est un nombre, on avance dans le tableau
        const arr = target[keys[i]];
        const nextKey = keys[i + 1];
        if (!isNaN(nextKey)) {
          const idx = Number(nextKey);
          if (!arr[idx]) arr[idx] = {};
          target = arr[idx];
          i++; // On saute un cran dans la clé (modules, 1, width)
        } else {
          target = arr;
        }
      } else {
        // Clé objet classique
        if (!(keys[i] in target)) target[keys[i]] = {};
        target = target[keys[i]];
      }
    }
    // Application de la valeur à la dernière clé
    target[keys[keys.length - 1]] = value;

    // Validation et notification
    this.configModel.validate();
    this.eventBus.emit("configChanged", this.configModel.getConfig());
  }

  // Écoute les événements UI spéciaux (ex : boutons “reset”, “import”, “export”…)
  attachListeners() {
    // Exemple : bouton de reset
    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.configModel.state = this.configModel.getDefaultConfig();
        this.configModel.validate();
        this.eventBus.emit("configChanged", this.configModel.getConfig());
      });
    }
  }

  // Met à jour le formulaire (inputs, selects…) à partir de la config métier
  updateFormFromModel(config) {
    document.querySelectorAll("[data-config-key]").forEach((input) => {
      const key = input.getAttribute("data-config-key");
      let value = this.getConfigValueByKey(config, key);

      if (input.type === "checkbox") {
        input.checked = Boolean(value);
      } else if (input.type === "radio") {
        input.checked = input.value == value;
      } else {
        input.value = value ?? "";
      }
    });
  }

  updateModulesInputs(config) {
    const container = document.getElementById("modules-width");
    if (!container) return;
    container.innerHTML = ""; // Nettoie tout

    for (let i = 0; i < config.modulesCount; i++) {
      const module = config.modules[i] || {};
      const label = document.createElement("label");
      label.style.display = "block";
      label.textContent = `Module ${i + 1} : `;

      const input = document.createElement("input");
      input.type = "number";
      input.min = 100;
      input.max = 2000;
      input.value = module.width ?? "";
      input.setAttribute("data-config-key", `modules.${i}.width`);
      input.style.width = "80px";

      // === Ajoute le listener UNIQUE pour ce champ ===
      input.addEventListener("change", (e) => {
        const key = input.getAttribute("data-config-key");
        let value = input.value === "" ? null : Number(input.value);
        this.setConfigValueByKey(key, value);
      });

      label.appendChild(input);
      container.appendChild(label);
    }
  }

  updateTraversesSelect(config) {
    const select = document.getElementById("list-traverses");
    if (!select) return;

    // Vide les options existantes
    select.innerHTML =
      '<option value="" selected>Sélectionner une traverse</option>';

    // Ajoute une option par traverse
    if (config.traverses && config.traverses.length > 0) {
      config.traverses.forEach((traverse) => {
        const option = document.createElement("option");
        option.value = traverse.id;
        option.textContent = `Traverse ${
          traverse.height
        }mm (modules: ${traverse.modules.join(", ")})`;
        select.appendChild(option);
      });
    }
  }

  updateTraversesPorteSelect(config) {
    const select = document.getElementById("list-traverses-porte");
    if (!select) return;

    select.innerHTML =
      '<option value="" selected>Sélectionner une traverse</option>';

    if (config.traversesPorte && config.traversesPorte.length > 0) {
      config.traversesPorte.forEach((traverse) => {
        const option = document.createElement("option");
        option.value = traverse.id;
        const tierceTxt = traverse.onTierce ? " + tierce" : "";
        option.textContent = `Traverse ${traverse.height}mm (type ${traverse.type}${tierceTxt})`;
        select.appendChild(option);
      });
    }
  }

  showAddTraverseForm() {
    // Vérifie s’il y a déjà un formulaire affiché
    if (document.getElementById("add-traverse-form")) return;

    const form = document.createElement("form");
    form.id = "add-traverse-form";
    form.style.margin = "10px 0";
    form.innerHTML = `
      <label>
        Hauteur (mm) :
        <input type="number" min="100" max="2400" name="height" required style="width:80px" />
      </label>
      <br>
      <label>Modules concernés :</label>
      <div id="add-traverse-modules"></div>
      <br>
      <button type="submit">Ajouter</button>
      <button type="button" id="cancel-add-traverse">Annuler</button>
    `;

    // Génère les checkboxes pour chaque module
    const modulesDiv = form.querySelector("#add-traverse-modules");
    const modulesCount = this.configModel.state.modulesCount;
    for (let i = 0; i < modulesCount; i++) {
      const moduleId = i + 1;
      const label = document.createElement("label");
      label.style.marginRight = "8px";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = moduleId;
      cb.checked = true;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(` M${moduleId} `));
      modulesDiv.appendChild(label);
    }

    // Ajoute le formulaire juste après le bouton "Ajouter une traverse"
    const addBtn = document.getElementById("add-traverse");
    addBtn.insertAdjacentElement("afterend", form);

    // Gère la soumission du formulaire
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const height = parseInt(form.height.value);
      const selectedModules = Array.from(
        form.querySelectorAll('input[type="checkbox"]:checked')
      ).map((cb) => parseInt(cb.value));
      if (selectedModules.length === 0) {
        alert("Sélectionne au moins un module !");
        return;
      }
      this.configModel.addTraverse(height, selectedModules);
      this.eventBus.emit("configChanged", this.configModel.getConfig());
      form.remove();
    });

    // Bouton Annuler
    form
      .querySelector("#cancel-add-traverse")
      .addEventListener("click", () => form.remove());
  }

  showAddTraversePorteForm() {
    if (document.getElementById("add-traverse-porte-form")) return;

    const form = document.createElement("form");
    form.id = "add-traverse-porte-form";
    form.style.margin = "10px 0";
    form.innerHTML = `
      <label>
        Hauteur (mm) :
        <input type="number" min="100" max="2200" name="height" required style="width:80px" />
      </label>
      <br>
      <label>
        Type de traverse :
        <select name="type">
          <option value="28">28</option>
          <option value="37">37</option>
        </select>
      </label>
      <br>
      <label>
        Sur la tierce ?
        <input type="checkbox" name="onTierce" />
      </label>
      <br>
      <button type="submit">Ajouter</button>
      <button type="button" id="cancel-add-traverse-porte">Annuler</button>
    `;

    // Ajoute le formulaire juste après le bouton "Ajouter une traverse porte"
    const addBtn = document.getElementById("add-traverse-porte");
    addBtn.insertAdjacentElement("afterend", form);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const height = parseInt(form.height.value);
      const type = form.type.value;
      const onTierce = form.onTierce.checked;
      this.configModel.addTraversePorte(height, { type, onTierce });
      this.eventBus.emit("configChanged", this.configModel.getConfig());
      form.remove();
    });

    form
      .querySelector("#cancel-add-traverse-porte")
      .addEventListener("click", () => form.remove());
  }

  // Utilitaire pour récupérer la valeur d'une clé imbriquée
  getConfigValueByKey(obj, key) {
    return key.split(".").reduce((acc, k) => {
      // Prend en compte les accès tableau style modules.1.width
      if (!isNaN(k) && Array.isArray(acc)) {
        return acc[Number(k)];
      }
      return acc ? acc[k] : undefined;
    }, obj);
  }
}
