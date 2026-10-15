const relevantKeys = new Set(['w','a','s','d','e','f','r','m','p','t','c','n','g','escape',' ','shift','control','arrowup','arrowdown','arrowleft','arrowright']);
export const normalized = key => key === ' ' ? 'space' : key.toLowerCase() === 'control' ? 'ctrl' : key.toLowerCase();
export class Input {
  constructor() {
    this.down = new Set();
    this.justPressed = new Set();
    this.enabled = false;
    window.addEventListener('keydown', event => {
      if (relevantKeys.has(event.key.toLowerCase()) || event.key === ' ') event.preventDefault();
      const key = normalized(event.key);
      if (!this.down.has(key) && !event.repeat) this.justPressed.add(key);
      this.down.add(key);
    });
    window.addEventListener('keyup', event => this.down.delete(normalized(event.key)));
    window.addEventListener('blur', () => { this.down.clear(); this.justPressed.clear(); });
    document.querySelectorAll('[data-hold]').forEach(button => {
      const key = button.dataset.hold;
      const release = (event) => { event.preventDefault(); this.down.delete(key); button.classList.remove('active'); };
      button.addEventListener('pointerdown', event => {
        event.preventDefault(); button.setPointerCapture(event.pointerId);
        this.down.add(key); button.classList.add('active');
      });
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    });
    document.querySelectorAll('[data-tap]').forEach(button => {
      button.addEventListener('pointerdown', event => {
        event.preventDefault(); this.justPressed.add(button.dataset.tap);
        button.classList.add('active');
      });
      for (const eventName of ['pointerup','pointercancel','pointerleave']) button.addEventListener(eventName, () => button.classList.remove('active'));
    });
  }
  isDown(...keys) { return keys.some(key => this.down.has(key)); }
  consume(key) { const hit = this.justPressed.has(key); this.justPressed.delete(key); return hit; }
  clearActions() { this.justPressed.clear(); }
}
