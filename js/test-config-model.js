import { EventBus } from "./events/EventBus.js";

const bus = new EventBus();

function onConfigChange(data) {
  console.log("Config changée !", data);
}

bus.on("configChanged", onConfigChange);

// Émettre un event
bus.emit("configChanged", { test: 123 });

// Se désabonner et réémettre pour vérifier
bus.off("configChanged", onConfigChange);
bus.emit("configChanged", { test: 456 }); // Ne doit RIEN afficher
