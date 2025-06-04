export class EventBus {
  constructor() {
    this.listeners = {};
  }

  // S'abonner à un événement
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Se désabonner d'un événement (optionnel mais propre)
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(
      (fn) => fn !== callback
    );
  }

  // Émettre un événement
  emit(event, data) {
    if (!this.listeners[event]) return;
    for (const cb of this.listeners[event]) {
      try {
        cb(data);
      } catch (e) {
        console.error("Erreur callback EventBus :", e);
      }
    }
  }
}
