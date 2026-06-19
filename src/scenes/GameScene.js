import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Gear from '../mechanics/Gear.js';
import Pendulum from '../mechanics/Pendulum.js';
import Chain from '../mechanics/Chain.js';
import Elevator from '../mechanics/Elevator.js';
import SpringDoor from '../mechanics/SpringDoor.js';
import PushableGear from '../mechanics/PushableGear.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.mechanics = [];
    this.platforms = [];
    this.deathZones = [];
    this.spawnPoint = { x: 80, y: 500 };
    this.checkpoints = [];
    this.currentCheckpoint = 0;
    this.levelComplete = false;
    this.rewindTimer = 0;
    this.rewindInterval = 20000;
    this.rewindWarningTime = 3000;
    this.isRewinding = false;

    this.createSoundEffects();
    this.createBackground();
    this.createLevel();
    this.createPlayer();
    this.createCollision();
    this.createRewindSystem();
    this.setupInput();
    this.setupEventListeners();

    this.cameras.main.setBounds(0, 0, 1920, 720);
    this.cameras.main.startFollow(this.player.sprite, false, 0.1, 0.1);
    this.physics.world.setBounds(0, 0, 1920, 720);
  }

  createSoundEffects() {
    this.sfxEnabled = false;
    this.audioContext = null;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.sfxEnabled = true;
    } catch (e) {
      console.log('Web Audio API not supported, sound effects disabled');
    }
  }

  playSound(type) {
    if (!this.sfxEnabled || !this.audioContext) return;

    const sounds = {
      jump: { freq: 440, duration: 0.1, type: 'square' },
      'chain-grab': { freq: 220, duration: 0.15, type: 'sine' },
      'gear-reverse': { freq: 180, duration: 0.2, type: 'sawtooth' },
      'spring-open': { freq: 660, duration: 0.2, type: 'sine' },
      'spring-close': { freq: 330, duration: 0.2, type: 'sine' },
      'rewind-start': { freq: 150, duration: 0.3, type: 'sawtooth' },
      'rewind-end': { freq: 500, duration: 0.2, type: 'sine' },
      death: { freq: 100, duration: 0.4, type: 'sawtooth' },
      victory: { freq: 523, duration: 0.5, type: 'sine' }
    };

    const sound = sounds[type] || sounds.jump;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.type = sound.type;
      oscillator.frequency.setValueAtTime(sound.freq, this.audioContext.currentTime);

      if (type === 'victory') {
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.3);
      }

      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + sound.duration);
    } catch (e) {
    }
  }

  createBackground() {
    const bg = this.add.graphics();

    bg.fillStyle(0x1a1a2e);
    bg.fillRect(0, 0, 1920, 720);

    bg.fillStyle(0x2d2d44);
    for (let i = 0; i < 1920; i += 64) {
      for (let j = 0; j < 720; j += 64) {
        if ((i + j) % 128 === 0) {
          bg.fillRect(i, j, 64, 64);
        }
      }
    }

    bg.fillStyle(0x3d3d5c);
    bg.fillRect(0, 0, 1920, 40);
    bg.fillRect(0, 680, 1920, 40);

    for (let i = 0; i < 1920; i += 80) {
      bg.fillStyle(0x4a4a6a);
      bg.fillRect(i + 20, 40, 40, 8);
      bg.fillRect(i + 20, 672, 40, 8);
    }

    const decorGears = [
      { x: 1600, y: 120, r: 60, speed: 0.3 },
      { x: 1700, y: 180, r: 40, speed: -0.5 },
      { x: 150, y: 100, r: 50, speed: 0.2 },
      { x: 80, y: 160, r: 30, speed: -0.4 }
    ];

    decorGears.forEach(g => {
      const gear = new Gear(this, g.x, g.y, g.r, {
        speed: g.speed,
        isPlatform: false,
        isDangerous: false
      });
      gear.sprite.setAlpha(0.3);
      this.mechanics.push(gear);
    });
  }

  createLevel() {
    this.createPlatform(0, 640, 300, 40);
    this.createPlatform(350, 600, 150, 20);
    this.createPlatform(550, 560, 120, 20);
    this.createPlatform(750, 600, 200, 20);

    this.createPlatform(1000, 550, 150, 20);
    this.createPlatform(1200, 500, 150, 20);
    this.createPlatform(1400, 450, 200, 20);
    this.createPlatform(1650, 400, 200, 20);

    const gear1 = new Gear(this, 420, 480, 60, {
      speed: 1.2,
      direction: -1,
      isPlatform: true,
      isDangerous: true,
      canReverse: true
    });
    this.mechanics.push(gear1);

    const gear2 = new Gear(this, 680, 420, 50, {
      speed: 1.5,
      direction: 1,
      isPlatform: true,
      isDangerous: true,
      canReverse: true
    });
    this.mechanics.push(gear2);

    const gear3 = new Gear(this, 900, 380, 55, {
      speed: 1,
      direction: -1,
      isPlatform: true,
      isDangerous: true,
      canReverse: true
    });
    this.mechanics.push(gear3);

    const pendulum1 = new Pendulum(this, 500, 80, 250, {
      amplitude: Math.PI / 3,
      period: 2500,
      isPlatform: true
    });
    this.mechanics.push(pendulum1);

    const pendulum2 = new Pendulum(this, 850, 80, 280, {
      amplitude: Math.PI / 3.5,
      period: 3000,
      phase: 1500,
      isPlatform: true
    });
    this.mechanics.push(pendulum2);

    const pendulum3 = new Pendulum(this, 1250, 80, 260, {
      amplitude: Math.PI / 4,
      period: 2200,
      phase: 800,
      isPlatform: true
    });
    this.mechanics.push(pendulum3);

    const chain1 = new Chain(this, 1080, 100, 400);
    this.mechanics.push(chain1);

    const chain2 = new Chain(this, 1500, 100, 350);
    this.mechanics.push(chain2);

    const elevator1 = new Elevator(this, 250, 450, {
      endY: 250,
      width: 80,
      speed: 80,
      waitTime: 1500
    });
    this.mechanics.push(elevator1);

    const elevator2 = new Elevator(this, 1150, 300, {
      endX: 1350,
      endY: 300,
      width: 100,
      speed: 60,
      waitTime: 2000
    });
    this.mechanics.push(elevator2);

    const springDoor1 = new SpringDoor(this, 720, 600, {
      width: 60,
      height: 80,
      openDuration: 4000,
      windowDuration: 2000
    });
    this.mechanics.push(springDoor1);

    const springDoor2 = new SpringDoor(this, 1600, 450, {
      width: 60,
      height: 80,
      openDuration: 3500,
      windowDuration: 1800
    });
    this.mechanics.push(springDoor2);

    const pushGear1 = new PushableGear(this, 150, 580, 35, {
      speed: 100
    });
    this.mechanics.push(pushGear1);

    const pushGear2 = new PushableGear(this, 1050, 520, 30, {
      speed: 90
    });
    this.mechanics.push(pushGear2);

    this.createDeathZone(0, 710, 1920, 20, 'pit');
    this.createDeathZone(980, 450, 120, 80, 'pit');

    this.checkpoints.push({ x: 80, y: 500, activated: true });
    this.checkpoints.push({ x: 550, y: 520, activated: false });
    this.checkpoints.push({ x: 1100, y: 500, activated: false });
    this.checkpoints.push({ x: 1500, y: 400, activated: false });

    this.checkpointSprites = [];
    this.checkpoints.forEach((cp, i) => {
      const sprite = this.add.rectangle(cp.x, cp.y - 30, 20, 40, 0x444444);
      const flag = this.add.triangle(cp.x + 5, cp.y - 40, 0, 0, 20, 10, 0, 20, i === 0 ? 0x00ff00 : 0x666666);
      this.checkpointSprites.push({ sprite, flag });
    });

    const goalX = 1820;
    const goalY = 360;
    this.goal = this.add.graphics();
    this.goal.fillStyle(0xffd700);
    this.goal.fillRect(goalX - 25, goalY - 60, 50, 60);
    this.goal.fillStyle(0xffa500);
    this.goal.fillRect(goalX - 20, goalY - 55, 40, 50);
    this.goal.fillStyle(0xffffff);
    this.goal.fillRect(goalX - 5, goalY - 50, 10, 15);

    this.goalBody = this.physics.add.staticImage(goalX, goalY - 30);
    this.goalBody.setSize(50, 60);
    this.goalBody.visible = false;
  }

  createPlatform(x, y, width, height) {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x5c4033);
    graphics.fillRect(x, y, width, height);
    graphics.fillStyle(0x8b7355);
    graphics.fillRect(x + 2, y + 2, width - 4, height - 6);
    graphics.fillStyle(0x654321);
    for (let i = 0; i < width; i += 20) {
      graphics.fillRect(x + i + 4, y + 4, 12, 4);
    }

    const plat = this.physics.add.staticImage(x + width / 2, y + height / 2);
    plat.setSize(width, height);
    plat.visible = false;
    this.platforms.push(plat);

    return plat;
  }

  createDeathZone(x, y, width, height, type) {
    const zone = this.physics.add.staticImage(x + width / 2, y + height / 2);
    zone.setSize(width, height);
    zone.visible = false;
    zone.deathType = type;
    this.deathZones.push(zone);
    return zone;
  }

  createPlayer() {
    this.player = new Player(this, this.spawnPoint.x, this.spawnPoint.y);
  }

  createCollision() {
    this.physics.add.collider(this.player.sprite, this.platforms);

    this.mechanics.forEach(m => {
      if (m.body && m.body.body && m.body.body.immovable) {
        this.physics.add.collider(this.player.sprite, m.body);
      }
      if (m.topSurface) {
        this.physics.add.collider(this.player.sprite, m.topSurface);
      }
      if (m instanceof PushableGear && m.body) {
        this.physics.add.collider(this.player.sprite, m.body);
        this.physics.add.collider(m.body, this.platforms);
        this.mechanics.forEach(other => {
          if (other !== m && other.body && other.body.body) {
            this.physics.add.collider(m.body, other.body);
          }
        });
      }
    });

    this.physics.add.overlap(this.player.sprite, this.goalBody, () => {
      if (!this.levelComplete) {
        this.completeLevel();
      }
    });

    this.deathZones.forEach(zone => {
      this.physics.add.overlap(this.player.sprite, zone, () => {
        if (zone.deathType === 'pit') {
          this.events.emit('playerDeath', {
            type: 'pit-fall',
            message: '掉进机井了！注意脚下的平台边缘，必要时使用二段跳。',
            position: { x: this.player.sprite.x, y: this.player.sprite.y }
          });
        }
      });
    });
  }

  createRewindSystem() {
    this.rewindTimer = this.rewindInterval;

    this.rewindBarBg = this.add.rectangle(960, 60, 300, 16, 0x333333, 0.8);
    this.rewindBarBg.setScrollFactor(0);
    this.rewindBarBg.setStrokeStyle(2, 0x8b7355);

    this.rewindBar = this.add.rectangle(960 - 150, 60, 300, 12, 0xffd700);
    this.rewindBar.setOrigin(0, 0.5);
    this.rewindBar.setScrollFactor(0);

    this.rewindLabel = this.add.text(960, 38, '发条能量', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#ffd700'
    });
    this.rewindLabel.setOrigin(0.5);
    this.rewindLabel.setScrollFactor(0);
  }

  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,Q,R');

    this.input.keyboard.on('keydown-Q', () => {
      const nearestGear = this.findNearestReversibleGear();
      if (nearestGear) {
        nearestGear.reverse();
      }
    });

    this.input.keyboard.on('keydown-R', () => {
      const nearestDoor = this.findNearestSpringDoor();
      if (nearestDoor && !nearestDoor.isOpen) {
        nearestDoor.open();
      }
    });
  }

  setupEventListeners() {
    this.events.on('playerDeath', (data) => this.handlePlayerDeath(data));
    this.events.on('timeFreeze', (data) => this.handleTimeFreeze(data));
    this.events.on('springDoorStateChange', (data) => this.handleSpringDoorChange(data));
  }

  findNearestReversibleGear() {
    let nearest = null;
    let minDist = 100;

    this.mechanics.forEach(m => {
      if (m instanceof Gear && m.canReverse) {
        const dx = this.player.sprite.x - m.x;
        const dy = this.player.sprite.y - m.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearest = m;
        }
      }
    });

    return nearest;
  }

  findNearestSpringDoor() {
    let nearest = null;
    let minDist = 100;

    this.mechanics.forEach(m => {
      if (m instanceof SpringDoor) {
        const dx = this.player.sprite.x - m.x;
        const dy = this.player.sprite.y - (m.y - m.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearest = m;
        }
      }
    });

    return nearest;
  }

  handlePlayerDeath(data) {
    if (!this.player.sprite.active) return;

    this.player.sprite.setActive(false);
    this.player.sprite.setVisible(false);
    this.player.sprite.setVelocity(0, 0);

    this.playSound('death');

    this.scene.get('UIScene').showDeathScreen(data);
  }

  respawnPlayer() {
    const cp = this.checkpoints[this.currentCheckpoint];
    this.player.respawn(cp.x, cp.y);
  }

  handleTimeFreeze(data) {
    this.cameras.main.flash(100, 136, 136, 255, true);
  }

  handleSpringDoorChange(data) {
  }

  completeLevel() {
    this.levelComplete = true;
    this.player.sprite.setVelocity(0, 0);
    this.playSound('victory');

    this.cameras.main.flash(500, 255, 215, 0, true);

    this.scene.get('UIScene').showVictoryScreen();
  }

  triggerRewind() {
    this.isRewinding = true;
    this.playSound('rewind-start');
    this.cameras.main.flash(500, 255, 100, 0, true);

    this.mechanics.forEach(m => {
      if (m instanceof SpringDoor) {
        m.close();
      }
    });

    this.time.delayedCall(500, () => {
      this.shuffleLevel();
      this.playSound('rewind-end');
      this.isRewinding = false;
      this.rewindTimer = this.rewindInterval;
    });
  }

  shuffleLevel() {
    this.mechanics.forEach(m => {
      if (m instanceof Gear && m.canReverse) {
        if (Math.random() > 0.5) {
          m.reverse();
        }
      }
      if (m instanceof Elevator) {
        if (Math.random() > 0.5) {
          m.direction *= -1;
        }
      }
    });

    this.cameras.main.shake(200, 0.01);
  }

  update(time, delta) {
    if (this.levelComplete) return;

    this.player.update(this.cursors, this.keys);

    this.mechanics.forEach(m => {
      if (m.update) m.update(time, delta);
    });

    this.checkpoints.forEach((cp, i) => {
      if (!cp.activated) {
        const dx = this.player.sprite.x - cp.x;
        const dy = this.player.sprite.y - cp.y;
        if (Math.sqrt(dx * dx + dy * dy) < 50) {
          cp.activated = true;
          this.currentCheckpoint = i;
          this.checkpointSprites[i].flag.setFillStyle(0x00ff00);
        }
      }
    });

    if (!this.isRewinding) {
      this.rewindTimer -= delta;

      const progress = this.rewindTimer / this.rewindInterval;
      this.rewindBar.width = Math.max(0, 300 * progress);

      if (this.rewindTimer < this.rewindWarningTime) {
        const color = progress < 0.1 ? 0xff0000 : 0xff6600;
        this.rewindBar.setFillStyle(color);
        this.rewindLabel.setColor('#ff6600');

        if (Math.floor(time / 200) % 2 === 0) {
          this.rewindBar.setAlpha(0.5);
        } else {
          this.rewindBar.setAlpha(1);
        }
      } else {
        this.rewindBar.setFillStyle(0xffd700);
        this.rewindLabel.setColor('#ffd700');
        this.rewindBar.setAlpha(1);
      }

      if (this.rewindTimer <= 0) {
        this.triggerRewind();
      }
    }

    this.updateGearSurfaceVelocity();
  }

  updateGearSurfaceVelocity() {
    if (this.player.isOnChain) return;

    this.mechanics.forEach(m => {
      if (m instanceof Gear && m.body && m.isPlatform) {
        const onGround = this.player.sprite.body.blocked.down || this.player.sprite.body.touching.down;
        if (onGround) {
          const playerBottom = this.player.sprite.y + this.player.sprite.height / 2;
          const gearTop = m.y - m.radius;

          if (Math.abs(playerBottom - gearTop) < 20) {
            const vel = m.getSurfaceVelocityAtPoint(this.player.sprite.x, this.player.sprite.y);
            this.player.sprite.x += vel.x;
          }
        }
      }
    });
  }
}
