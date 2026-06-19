export default class Pendulum {
  constructor(scene, anchorX, anchorY, length, config = {}) {
    this.scene = scene;
    this.anchorX = anchorX;
    this.anchorY = anchorY;
    this.length = length;
    this.amplitude = config.amplitude || Math.PI / 4;
    this.period = config.period || 3000;
    this.isDangerous = config.isDangerous !== false;
    this.isPlatform = config.isPlatform || false;
    this.weightRadius = config.weightRadius || 30;
    this.rodWidth = config.rodWidth || 6;

    this.angle = 0;
    this.phase = config.phase || 0;
    this.paused = false;

    this.createGraphics();
    this.createPhysics();
  }

  createGraphics() {
    const graphics = this.scene.make.graphics({ add: false });

    graphics.fillStyle(0x4a4a4a);
    graphics.fillCircle(this.length + this.weightRadius, this.weightRadius, this.rodWidth / 2);

    graphics.fillStyle(0x696969);
    for (let i = 0; i < this.length; i += 20) {
      graphics.fillCircle(i + this.weightRadius, this.weightRadius, this.rodWidth / 2);
    }

    graphics.fillStyle(0x2f2f2f);
    graphics.fillCircle(this.weightRadius, this.weightRadius, this.weightRadius);

    graphics.fillStyle(0x8b0000);
    graphics.fillCircle(this.weightRadius, this.weightRadius, this.weightRadius * 0.6);

    graphics.fillStyle(0x4a4a4a);
    graphics.fillCircle(this.weightRadius, this.weightRadius, this.weightRadius * 0.2);

    graphics.generateTexture(`pendulum-${this.length}`, this.length + this.weightRadius * 2, this.weightRadius * 2);
    graphics.destroy();

    this.pendulumSprite = this.scene.add.sprite(this.anchorX, this.anchorY, `pendulum-${this.length}`);
    this.pendulumSprite.setOrigin(1, 0.5);

    this.rodLine = this.scene.add.graphics();
  }

  createPhysics() {
    this.weightBody = this.scene.physics.add.image(this.anchorX - this.length, this.anchorY);
    this.weightBody.setCircle(this.weightRadius * 0.8);
    this.weightBody.setImmovable(true);
    this.weightBody.visible = false;
    this.weightBody.body.allowGravity = false;

    if (this.isPlatform) {
      this.topSurface = this.scene.physics.add.image(
        this.anchorX - this.length,
        this.anchorY - this.weightRadius
      );
      this.topSurface.setSize(this.weightRadius * 1.5, 10);
      this.topSurface.visible = false;
      this.topSurface.setImmovable(true);
      this.topSurface.body.allowGravity = false;
      this.topSurface.body.moves = false;
    }
  }

  update(time, delta) {
    if (this.paused) return;

    const t = (time + this.phase) / this.period;
    this.angle = Math.sin(t * Math.PI * 2) * this.amplitude;

    const weightX = this.anchorX - Math.cos(this.angle) * this.length;
    const weightY = this.anchorY + Math.sin(this.angle) * this.length;

    this.pendulumSprite.setPosition(this.anchorX, this.anchorY);
    this.pendulumSprite.rotation = -this.angle;

    this.weightBody.setPosition(weightX, weightY);

    if (this.topSurface) {
      const surfaceX = weightX;
      const surfaceY = weightY - this.weightRadius;
      this.topSurface.setPosition(surfaceX, surfaceY);
    }

    this.rodLine.clear();
    this.rodLine.lineStyle(this.rodWidth, 0x4a4a4a);
    this.rodLine.beginPath();
    this.rodLine.moveTo(this.anchorX, this.anchorY);
    this.rodLine.lineTo(weightX, weightY);
    this.rodLine.strokePath();

    if (this.isDangerous && this.scene.player && !this.scene.player.isOnChain) {
      const dx = this.scene.player.sprite.x - weightX;
      const dy = this.scene.player.sprite.y - weightY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.weightRadius + 10) {
        const angleSpeed = Math.cos(t * Math.PI * 2) * this.amplitude * (Math.PI * 2 / this.period);
        const speed = Math.abs(angleSpeed * this.length);

        if (speed > 0.5) {
          this.scene.events.emit('playerDeath', {
            type: 'pendulum-hit',
            message: '被摆锤撞落了！摆锤在两端时速度最慢，在最低点最快。等待摆锤到达最高点时再通过。',
            position: { x: weightX, y: weightY }
          });
        }
      }
    }
  }

  getWeightPosition() {
    const weightX = this.anchorX - Math.cos(this.angle) * this.length;
    const weightY = this.anchorY + Math.sin(this.angle) * this.length;
    return { x: weightX, y: weightY };
  }

  isAtPeak() {
    const t = (this.scene.time.now + this.phase) / this.period;
    const phase = (t % 1) * Math.PI * 2;
    return Math.abs(Math.sin(phase)) < 0.2;
  }

  pauseMechanic() {
    this.paused = true;
    this.pendulumSprite.setTint(0x8888ff);
  }

  resumeMechanic() {
    this.paused = false;
    this.pendulumSprite.clearTint();
  }

  destroy() {
    if (this.pendulumSprite) this.pendulumSprite.destroy();
    if (this.weightBody) this.weightBody.destroy();
    if (this.topSurface) this.topSurface.destroy();
    if (this.rodLine) this.rodLine.destroy();
  }
}
