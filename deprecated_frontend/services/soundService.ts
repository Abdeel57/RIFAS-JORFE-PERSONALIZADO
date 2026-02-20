
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(mute: boolean) {
    this.isMuted = mute;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Sonido al seleccionar un boleto (Bling ascendente)
  playSelect() {
    this.playTone(800, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(1200, 'sine', 0.1, 0.05), 50);
  }

  // Sonido al quitar un boleto (Bloop descendente)
  playDeselect() {
    this.playTone(600, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(400, 'sine', 0.1, 0.05), 50);
  }

  // Sonido de la máquina de la suerte (Secuencia arcade)
  playMachineRoll() {
    let count = 0;
    const interval = setInterval(() => {
      this.playTone(200 + (Math.random() * 600), 'square', 0.05, 0.02);
      count++;
      if (count > 15) clearInterval(interval);
    }, 60);
  }

  // Sonido de "Premio" o boletos entregados por la máquina
  playJackpot() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Acorde C mayor
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 'triangle', 0.4, 0.05), i * 100);
    });
  }

  // Sonido de monedas al finalizar compra
  playCoins() {
    for(let i=0; i<5; i++) {
      setTimeout(() => this.playTone(1500 + (i*100), 'sine', 0.2, 0.03), i * 80);
    }
  }
}

export const soundService = new SoundManager();
