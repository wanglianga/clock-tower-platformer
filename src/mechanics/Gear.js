export default class Gear {
  constructor(scene, x, y, radius, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = config.speed || 1;
    this.direction = config.direction || 1;
    this.isPlatform = config.isPlatform !== false;
    this.isDangerous = config.isDangerous || false;
    this.canReverse = config.canReverse || false;
    this.paused = false;

    this.angle = 0;
    this.teeth = Math.floor(radius / 8);

    this.createGraphics();
    this.createPhysics();
  }

  createGraphics() {
    const graphics = this.scene.make.graphics({ add: false });
    const teeth = this.teeth;
    const outerR = this.radius;
    const innerR = this.radius * 0.75;
    const toothHeight = this.radius * 0.15;

    graphics.fillStyle(0x8b7355);
    graphics.fillCircle(this.radius, this.radius, innerR);

    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      const toothWidth = Math.PI / teeth * 0.6;
      graphics.slice(
        this.radius,
        this.radius,
        outerR,
        angle - toothWidth / 2,
        angle + toothWidth / 2,
        false
      );
      graphics.slice(
        this.radius,
        this.radius,
        innerR,
        angle + toothWidth / 2,
        angle - toothWidth / 2,
        true
      );
      graphics.fillPath();
    }

    graphics.fillStyle(0x654321);
    graphics.fillCircle(this.radius, this.radius, this.radius * 0.25);

    graphics.fillStyle(0x8b7355);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const sx = this.radius + Math.cos(a) * this.radius * 0.45;
      const sy = this.radius + Math.sin(a) * this.radius * 0.45;
      graphics.fillCircle(sx, sy, this.radius * 0.08);
    }

    graphics.generateTexture(`gear-${this.radius}`, this.radius * 2, this.radius * 2);
    graphics.destroy();

    this.sprite = this.scene.add.image(this.x, this.y, `gear-${this.radius}`);
    this.sprite.setOrigin(0.5);
  }

  createPhysics() {
    if (this.isPlatform) {
      this.body = this.scene.physics.add.image(this.x, this.y, `gear-${this.radius}`);
      this.body.setCircle(this.radius * 0.8);
      this.body.setOrigin(0.5);
      this.body.visible = false;
      this.body.setImmovable(true);
      this.body.body.allowGravity = false;
      this.body.body.moves = false;
    }
  }

  update(time, delta) {
    if (this.paused) return;

    this.angle += this.speed * this.direction * delta * 0.05;
    this.sprite.rotation = this.angle;

    if (this.body) {
      this.body.rotation = this.angle;
    }

    if (this.isDangerous && this.scene.player) {
      const dx = this.scene.player.sprite.x - this.x;
      const dy = this.scene.player.sprite.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.radius + 15 && dist > this.radius * 0.6) {
        const toothAngle = Math.atan2(dy, dx);
        const localAngle = toothAngle - this.angle;
        const normalized = ((localAngle % (Math.PI * 2 / this.teeth)) + Math.PI * 2 / this.teeth) % (Math.PI * 2 / this.teeth);

        if (normalized < 0.3 || normalized > Math.PI * 2 / this.teeth - 0.3) {
          if (!this.scene.player.isOnChain) {
            this.scene.events.emit('playerDeath', {
              type: 'gear-crush',
              message: '被齿轮夹住了！观察齿轮齿牙的位置，等待安全时机再通过。',
              position: { x: this.x, y: this.y }
            });
          }
        }
      }
    }
  }

  reverse() {
    if (!this.canReverse) return;
    this.direction *= -1;
    if (this.scene.playSound) this.scene.playSound('gear-reverse');
  }

  pauseMechanic() {
    this.paused = true;
    this.sprite.setTint(0x8888ff);
  }

  resumeMechanic() {
    this.paused = false;
    this.sprite.clearTint();
  }

  getSurfaceVelocityAtPoint(px, py) {
    if (this.paused) return { x: 0, y: 0 };
    const dx = px - this.x;
    const dy = py - this.y;
    const tangentX = -dy * this.direction * this.speed * 0.02;
    const tangentY = dx * this.direction * this.speed * 0.02;
    return { x: tangentX, y: tangentY };
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.body) this.body.destroy();
  }
}
