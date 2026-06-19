export default class Elevator {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.startX = x;
    this.startY = y;
    this.endX = config.endX !== undefined ? config.endX : x;
    this.endY = config.endY !== undefined ? config.endY : y - 200;
    this.width = config.width || 80;
    this.height = config.height || 16;
    this.speed = config.speed || 60;
    this.autoStart = config.autoStart !== false;
    this.waitTime = config.waitTime || 1000;

    this.paused = false;
    this.moving = this.autoStart;
    this.direction = 1;
    this.waitTimer = 0;
    this.isWaiting = false;

    this.createGraphics();
    this.createPhysics();
  }

  createGraphics() {
    const graphics = this.scene.make.graphics({ add: false });

    graphics.fillStyle(0x654321);
    graphics.fillRect(0, 0, this.width, this.height);

    graphics.fillStyle(0x8b7355);
    graphics.fillRect(2, 2, this.width - 4, this.height - 4);

    graphics.fillStyle(0x4a4a4a);
    for (let i = 0; i < this.width; i += 16) {
      graphics.fillRect(i + 4, 4, 8, this.height - 8);
    }

    graphics.fillStyle(0x2f2f2f);
    graphics.fillRect(0, this.height - 4, this.width, 4);

    graphics.generateTexture(`elevator-${this.width}-${this.height}`, this.width, this.height);
    graphics.destroy();

    this.sprite = this.scene.add.image(this.startX, this.startY, `elevator-${this.width}-${this.height}`);
    this.sprite.setOrigin(0.5, 0.5);

    const pathGraphics = this.scene.add.graphics();
    pathGraphics.lineStyle(2, 0x4a4a4a, 0.3);
    pathGraphics.beginPath();
    pathGraphics.moveTo(this.startX, this.startY);
    pathGraphics.lineTo(this.endX, this.endY);
    pathGraphics.strokePath();
  }

  createPhysics() {
    this.body = this.scene.physics.add.image(this.startX, this.startY, `elevator-${this.width}-${this.height}`);
    this.body.setSize(this.width, this.height);
    this.body.setImmovable(true);
    this.body.visible = false;
    this.body.body.allowGravity = false;
    this.body.setFriction(1, 0);
  }

  update(time, delta) {
    if (this.paused) return;

    if (this.isWaiting) {
      this.waitTimer -= delta;
      if (this.waitTimer <= 0) {
        this.isWaiting = false;
        this.direction *= -1;
        this.moving = true;
      }
      return;
    }

    if (!this.moving) return;

    const dx = this.endX - this.startX;
    const dy = this.endY - this.startY;
    const totalDist = Math.sqrt(dx * dx + dy * dy);

    let targetX, targetY;
    if (this.direction === 1) {
      targetX = this.endX;
      targetY = this.endY;
    } else {
      targetX = this.startX;
      targetY = this.startY;
    }

    const moveDx = targetX - this.sprite.x;
    const moveDy = targetY - this.sprite.y;
    const distToTarget = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

    if (distToTarget < 5) {
      this.sprite.setPosition(targetX, targetY);
      this.body.setPosition(targetX, targetY);
      this.moving = false;
      this.isWaiting = true;
      this.waitTimer = this.waitTime;
      return;
    }

    const moveSpeed = (this.speed * delta) / 1000;
    const ratio = moveSpeed / distToTarget;
    const newX = this.sprite.x + moveDx * ratio;
    const newY = this.sprite.y + moveDy * ratio;

    const velX = (newX - this.sprite.x) / (delta / 1000);
    const velY = (newY - this.sprite.y) / (delta / 1000);

    this.sprite.setPosition(newX, newY);
    this.body.setPosition(newX, newY);
    this.body.setVelocity(velX, velY);

    if (this.scene.player && this.scene.player.sprite.body.touching.down) {
      const playerBottom = this.scene.player.sprite.y + this.scene.player.sprite.height / 2;
      const platformTop = this.sprite.y - this.height / 2;

      if (Math.abs(playerBottom - platformTop) < 10 &&
          Math.abs(this.scene.player.sprite.x - this.sprite.x) < this.width / 2) {
        this.scene.player.sprite.x += moveDx * ratio;
        this.scene.player.sprite.y += moveDy * ratio;
      }
    }
  }

  pauseMechanic() {
    this.paused = true;
    this.sprite.setTint(0x8888ff);
    this.body.setVelocity(0, 0);
  }

  resumeMechanic() {
    this.paused = false;
    this.sprite.clearTint();
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.body) this.body.destroy();
  }
}
