export default class SpringDoor {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = config.width || 60;
    this.height = config.height || 100;
    this.openDuration = config.openDuration || 3000;
    this.windowDuration = config.windowDuration || 1500;

    this.isOpen = false;
    this.paused = false;
    this.timer = 0;
    this.isInWindow = false;

    this.createGraphics();
    this.createPhysics();
  }

  createGraphics() {
    const graphics = this.scene.make.graphics({ add: false });

    graphics.fillStyle(0x4a4a4a);
    graphics.fillRect(0, 0, this.width, this.height);

    graphics.fillStyle(0x654321);
    graphics.fillRect(4, 4, this.width - 8, this.height - 8);

    graphics.fillStyle(0x8b7355);
    graphics.fillRect(8, 8, this.width - 16, this.height - 16);

    graphics.fillStyle(0x2f2f2f);
    graphics.fillRect(this.width / 2 - 3, 8, 6, this.height - 16);

    const springY = this.height - 20;
    graphics.fillStyle(0xcd853f);
    for (let i = 0; i < 4; i++) {
      graphics.fillRect(8, springY + i * 4, this.width - 16, 2);
    }

    graphics.generateTexture(`spring-door-${this.width}-${this.height}`, this.width, this.height);
    graphics.destroy();

    this.sprite = this.scene.add.image(this.x, this.y, `spring-door-${this.width}-${this.height}`);
    this.sprite.setOrigin(0.5, 1);

    this.windowIndicator = this.scene.add.rectangle(
      this.x,
      this.y - this.height - 20,
      this.width,
      8,
      0x444444
    );
    this.windowIndicator.setOrigin(0.5, 0.5);

    this.windowFill = this.scene.add.rectangle(
      this.x - this.width / 2,
      this.y - this.height - 20,
      0,
      8,
      0xff6600
    );
    this.windowFill.setOrigin(0, 0.5);
  }

  createPhysics() {
    this.body = this.scene.physics.add.staticImage(this.x, this.y, `spring-door-${this.width}-${this.height}`);
    this.body.setSize(this.width, this.height);
    this.body.setOrigin(0.5, 1);
    this.body.visible = false;
  }

  setCollisionEnabled(enabled) {
    if (this.body.body) {
      this.body.body.enable = enabled;
    }
  }

  update(time, delta) {
    if (this.paused) return;

    if (this.isOpen) {
      this.timer -= delta;

      const totalProgress = this.timer / this.openDuration;
      const windowProgress = Math.max(0, this.timer - (this.openDuration - this.windowDuration)) / this.windowDuration;

      if (this.timer > this.openDuration - this.windowDuration) {
        this.isInWindow = true;
        this.windowFill.setFillStyle(0x00ff00);
        this.windowFill.width = this.width * windowProgress;
      } else if (this.timer > 0) {
        this.isInWindow = false;
        this.windowFill.setFillStyle(0xff6600);
        this.windowFill.width = this.width * totalProgress;
      }

      if (this.timer <= 0) {
        this.close();
      }
    }
  }

  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.isInWindow = true;
    this.timer = this.openDuration;

    this.sprite.setAlpha(0.3);
    this.setCollisionEnabled(false);
    this.windowIndicator.setFillStyle(0x444444);
    this.windowFill.setFillStyle(0x00ff00);
    this.windowFill.width = this.width;

    if (this.scene.playSound) this.scene.playSound('spring-open');
    this.scene.events.emit('springDoorStateChange', { open: true, door: this });
  }

  close() {
    this.isOpen = false;
    this.isInWindow = false;
    this.timer = 0;

    this.sprite.setAlpha(1);
    this.setCollisionEnabled(true);
    this.windowFill.width = 0;

    if (this.scene.player && this.scene.player.sprite.active) {
      const overlap = this.scene.physics.overlap(this.body, this.scene.player.sprite);
      if (overlap) {
        this.scene.events.emit('playerDeath', {
          type: 'spring-door',
          message: '错过了发条窗口！门在你身上关上了。注意观察绿灯窗口，在窗口关闭前通过。',
          position: { x: this.x, y: this.y - this.height / 2 }
        });
      }
    }

    if (this.scene.playSound) this.scene.playSound('spring-close');
    this.scene.events.emit('springDoorStateChange', { open: false, door: this });
  }

  isPassable() {
    return this.isOpen;
  }

  getTimeRemaining() {
    return Math.max(0, this.timer);
  }

  pauseMechanic() {
    this.paused = true;
    this.sprite.setTint(0x8888ff);
  }

  resumeMechanic() {
    this.paused = false;
    this.sprite.clearTint();
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.body) this.body.destroy();
    if (this.windowIndicator) this.windowIndicator.destroy();
    if (this.windowFill) this.windowFill.destroy();
  }
}
