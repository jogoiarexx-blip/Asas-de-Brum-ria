export class AudioSystem {
  constructor() { this.ctx = null; this.muted = false; }
  unlock() {
    if (this.muted) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx ??= new AudioContext();
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    } catch { this.ctx = null; }
  }
  tone(frequency, duration = .18, waveform = 'sine', volume = .06, glide = 0) {
    if (!this.ctx || this.muted || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
    osc.type = waveform; osc.frequency.setValueAtTime(Math.max(50,frequency),t);
    if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(50,frequency+glide),t+duration);
    gain.gain.setValueAtTime(.0001,t); gain.gain.exponentialRampToValueAtTime(volume,t+.018);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain).connect(this.ctx.destination);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
    osc.start(t); osc.stop(t+duration+.01);
  }
  play(name) {
    if (name === 'mount') { this.tone(250,.16,'triangle',.08,270); this.tone(480,.36,'sine',.06,220); }
    else if (name === 'pickup') { this.tone(540,.15,'sine',.07,250); setTimeout(()=>this.tone(820,.26,'sine',.055,170),110); }
    else if (name === 'fire') { this.tone(150,.25,'sawtooth',.045,-80); }
    else if (name === 'hit') { this.tone(260,.2,'triangle',.08,-155); }
    else if (name === 'complete') { [440,554,659,880].forEach((hz,i)=>setTimeout(()=>this.tone(hz,.42,'sine',.055),i*140)); }
    else if (name === 'enemyFire') { this.tone(220,.2,'sawtooth',.026,-140); }
    else if (name === 'hurt') { this.tone(120,.37,'square',.055,-64);this.tone(76,.26,'sine',.1,-20); }
    else if (name === 'rescue') { [700,880,1050].forEach((hz,i)=>setTimeout(()=>this.tone(hz,.32,'sine',.045),i*105)); }
    else if (name === 'error') { this.tone(160,.13,'square',.025,-70); }
  }
}
