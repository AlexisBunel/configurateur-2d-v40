import { ConfigModel } from "./core/ConfigModel.js";
import { EventBus } from "./events/EventBus.js";
import { UIManager } from "./ui/UIManager.js";

document.addEventListener("DOMContentLoaded", () => {
  const eventBus = new EventBus();
  const configModel = new ConfigModel({}, eventBus);
  const uiManager = new UIManager(configModel, eventBus);
});
