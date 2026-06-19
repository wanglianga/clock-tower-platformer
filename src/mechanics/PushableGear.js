export default class PushableGear {
  constructor(scene, x, y, radius, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = config.speed || 80;
    this.teeth = Math.floor(radius / 6);

    this.paused = false;
    this.isOnGround = false;
    this.targetY = y;

    this.createGraphics();
    this.createPhysics();
  }

  createGraphics() {
    const graphics = this.scene.make.graphics({ add: false });
    const teeth = this.teeth;
    const outerR = this.radius;
    const innerR = this.radius * 0.7;

    graphics.fillStyle(0xd2691e);
    graphics.fillCircle(this.radius, this.radius, innerR);

    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      const toothWidth = Math.PI / teeth * 0.5;
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

    graphics.fillStyle(0x8b4513);
    graphics.fillCircle(this.radius, this.radius, this.radius * 0.2);

    graphics.fillStyle(0xd2691e);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const sx = this.radius + Math.cos(a) * this.radius * 0.4;
      const sy = this.radius + Math.sin(a) * this.radius * 0.4;
      graphics.fillCircle(sx, sy, this.radius * 0.1);
    }

    graphics.generateTexture(`push-gear-${this.radius}`, this.radius * 2, this.radius * 2);
    graphics.destroy();

    this.sprite = this.scene.add.image(this.x, this.y, `push-gear-${this.radius}`);
    this.sprite.setOrigin(0.5);
  }

  createPhysics() {
    this.body = this.scene.physics.add.image(this.x, this.y, `push-gear-${this.radius}`);
    this.body.setCircle(this.radius * 0.9);
    this.body.setOrigin(0.5);
    this.body.visible = false;
    this.body.setDrag(200, 0);
    this.body.setFriction(1, 0);
    this.body.setBounce(0, 0);
    this.body.body.allowGravity = true;
  }

  update(time, delta) {
    if (this.paused) return;

    this.x = this.body.x;
    this.y = this.body.y;

    this.sprite.setPosition(this.x, this.y);

    const velX = this.body.body.velocity.x;
    if (Math.abs(velX) > 1) {
      this.sprite.rotation += (velX / this.radius) * (delta / 1000);
    }

    this.isOnGround = this.body.body.blocked.down || this.body.body.touching.down;

    if (this.scene.player && !this.scene.player.isOnChain) {
      const player = this.scene.player.sprite;
      const overlap = this.scene.physics.overlap(this.body, player);

      if (overlap) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.radius + 15) {
          const normalY = dy / dist;

          if (normalY < -0.5 && player.body.velocity.y > 0) {
            player.y = this.y - this.radius - player.height / 2;
            player.setVelocityY(0);
            player.body.blocked.down = true;
            player.body.touching.down = true;
          } else if (Math.abs(normalY) < 0.3) {
            this.scene.player.isPushing = true;
            const pushDir = Math.sign(dx) * -1;
            this.body.setVelocityX(pushDir * this.speed);
            player.setVelocityX(pushDir * this.speed * 0.5);
          }
        }
      } else {
        if (this.scene.player.isPushing) {
          this.scene.player.isPushing = false;
        }
      }
    }

    if (this.y > this.scene.physics.world.bounds.height + 100) {
      this.reset();
    }
  }

  reset() {
    this.body.setPosition(this.targetY > 0 ? this.x : this.targetY, this.targetY > 0 ? this.targetY : this.y);
    this.body.setVelocity(0, 0);
  }

  pauseMechanic() {
    this.paused = true;
    this.sprite.setTint(0x8888ff);
    this.body.setVelocity(0, 0);
    this.body.body.allowGravity = false;
  }

  resumeMechanic() {
    this.paused = false;
    this.sprite.clearTint();
    this.body.body.allowGravity = true;
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.body) this.body.destroy();
  }
}
