export default class Chain {
  constructor(scene, x, y, height, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.height = height;
    this.width = config.width || 20;
    this.linkHeight = config.linkHeight || 12;

    this.paused = false;
    this.isGrabbable = true;

    this.createGraphics();
    this.createPhysics();
  }

  createGraphics() {
    const graphics = this.scene.make.graphics({ add: false });
    const links = Math.floor(this.height / this.linkHeight);

    for (let i = 0; i < links; i++) {
      const y = i * this.linkHeight;
      const isAlternate = i % 2 === 0;

      graphics.fillStyle(0x8b7355);
      if (isAlternate) {
        graphics.fillRect(4, y, this.width - 8, this.linkHeight - 2);
        graphics.fillStyle(0x654321);
        graphics.fillRect(2, y + 2, 4, this.linkHeight - 6);
        graphics.fillRect(this.width - 6, y + 2, 4, this.linkHeight - 6);
      } else {
        graphics.fillRect(2, y + 2, this.width - 4, this.linkHeight - 6);
        graphics.fillStyle(0x654321);
        graphics.fillRect(4, y, this.width - 8, 4);
        graphics.fillRect(4, y + this.linkHeight - 6, this.width - 8, 4);
      }
    }

    graphics.fillStyle(0x4a4a4a);
    graphics.fillRect(0, 0, this.width, 8);
    graphics.fillRect(0, this.height - 8, this.width, 8);

    graphics.generateTexture(`chain-${this.height}`, this.width, this.height);
    graphics.destroy();

    this.sprite = this.scene.add.image(this.x, this.y + this.height / 2, `chain-${this.height}`);
    this.sprite.setOrigin(0.5, 0.5);

    this.highlight = this.scene.add.rectangle(
      this.x,
      this.y + this.height / 2,
      this.width + 10,
      this.height,
      0xffff00,
      0
    );
  }

  createPhysics() {
    this.body = this.scene.physics.add.staticImage(
      this.x,
      this.y + this.height / 2,
      `chain-${this.height}`
    );
    this.body.setSize(this.width, this.height);
    this.body.visible = false;
    this.body.setImmovable(true);
    this.body.body.allowGravity = false;
  }

  update(time, delta) {
    if (!this.scene.player) return;

    const player = this.scene.player.sprite;
    const overlap = this.scene.physics.overlap(this.body, player);

    if (overlap && this.isGrabbable) {
      this.highlight.setFillStyle(0xffff00, 0.2);

      if (!this.scene.player.isOnChain) {
        const keys = this.scene.input.keyboard.addKeys('W,S,UP,DOWN');
        if (keys.W.isDown || keys.UP.isDown || keys.S.isDown || keys.DOWN.isDown) {
          this.scene.player.isOnChain = true;
          player.setPosition(this.x, player.y);
          if (this.scene.playSound) this.scene.playSound('chain-grab');
        }
      }
    } else {
      this.highlight.setFillStyle(0xffff00, 0);
      if (this.scene.player.isOnChain) {
        const dist = Math.abs(player.x - this.x);
        if (dist > this.width + 10) {
          this.scene.player.isOnChain = false;
        }
      }
    }
  }

  containsPoint(px, py) {
    return (
      px >= this.x - this.width / 2 &&
      px <= this.x + this.width / 2 &&
      py >= this.y &&
      py <= this.y + this.height
    );
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
    if (this.highlight) this.highlight.destroy();
  }
}
