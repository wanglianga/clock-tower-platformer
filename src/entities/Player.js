export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setSize(24, 36);
    this.sprite.setOffset(4, 4);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setFriction(0.1);

    this.isOnChain = false;
    this.isPushing = false;
    this.canJump = true;
    this.jumpCount = 0;
    this.maxJumps = 2;
    this.facing = 1;

    this.speed = 220;
    this.jumpForce = -380;
    this.chainSpeed = 120;

    this.timeFreezeActive = false;
    this.timeFreezeDuration = 2000;
    this.timeFreezeCooldown = 8000;
    this.lastTimeFreeze = 0;

    this.createGraphics();
    this.createAnimations();
  }

  createGraphics() {
    const graphics = this.scene.make.graphics({ add: false });
    graphics.fillStyle(0xcd853f);
    graphics.fillRect(4, 4, 24, 28);
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(8, 0, 16, 12);
    graphics.fillStyle(0x000000);
    graphics.fillRect(10, 4, 4, 4);
    graphics.fillRect(18, 4, 4, 4);
    graphics.fillStyle(0x654321);
    graphics.fillRect(4, 32, 10, 8);
    graphics.fillRect(18, 32, 10, 8);
    graphics.generateTexture('player', 32, 40);
    graphics.destroy();
  }

  createAnimations() {
    if (!this.scene.anims.exists('player-idle')) {
      this.scene.anims.create({
        key: 'player-idle',
        frames: [{ key: 'player' }],
        frameRate: 10
      });
      this.scene.anims.create({
        key: 'player-run',
        frames: [{ key: 'player' }],
        frameRate: 10,
        repeat: -1
      });
    }
  }

  update(cursors, keys) {
    if (!this.sprite.active) return;

    const onGround = this.sprite.body.blocked.down || this.sprite.body.touching.down;

    if (this.isOnChain) {
      this.sprite.setVelocityX(0);
      this.sprite.setGravityY(0);
      this.sprite.setImmovable(true);

      if (cursors.up.isDown || keys.W.isDown) {
        this.sprite.setVelocityY(-this.chainSpeed);
      } else if (cursors.down.isDown || keys.S.isDown) {
        this.sprite.setVelocityY(this.chainSpeed);
      } else {
        this.sprite.setVelocityY(0);
      }

      if (cursors.left.isDown || keys.A.isDown) {
        this.facing = -1;
        this.sprite.setVelocityX(-this.speed * 0.3);
      } else if (cursors.right.isDown || keys.D.isDown) {
        this.facing = 1;
        this.sprite.setVelocityX(this.speed * 0.3);
      }

      if (Phaser.Input.Keyboard.JustDown(cursors.space) && this.canJump) {
        this.isOnChain = false;
        this.sprite.setGravityY(800);
        this.sprite.setImmovable(false);
        this.sprite.setVelocityY(this.jumpForce * 0.8);
        this.jumpCount = 1;
      }

      this.sprite.anims.play('player-idle', true);
      return;
    }

    this.sprite.setGravityY(800);
    this.sprite.setImmovable(false);

    if (onGround) {
      this.jumpCount = 0;
      this.canJump = true;
    }

    if (cursors.left.isDown || keys.A.isDown) {
      this.sprite.setVelocityX(-this.speed);
      this.facing = -1;
      this.sprite.setFlipX(true);
      if (onGround) this.sprite.anims.play('player-run', true);
    } else if (cursors.right.isDown || keys.D.isDown) {
      this.sprite.setVelocityX(this.speed);
      this.facing = 1;
      this.sprite.setFlipX(false);
      if (onGround) this.sprite.anims.play('player-run', true);
    } else {
      this.sprite.setVelocityX(this.sprite.body.velocity.x * 0.85);
      if (onGround) this.sprite.anims.play('player-idle', true);
    }

    if (Phaser.Input.Keyboard.JustDown(cursors.space) && this.jumpCount < this.maxJumps) {
      this.sprite.setVelocityY(this.jumpForce);
      this.jumpCount++;
      if (this.scene.playSound) this.scene.playSound('jump');
    }

    if (Phaser.Input.Keyboard.JustDown(keys.E) && this.scene.time.now - this.lastTimeFreeze > this.timeFreezeCooldown) {
      this.activateTimeFreeze();
    }
  }

  activateTimeFreeze() {
    this.timeFreezeActive = true;
    this.lastTimeFreeze = this.scene.time.now;

    this.scene.mechanics.forEach(m => {
      if (m.pauseMechanic) m.pauseMechanic();
    });

    this.scene.events.emit('timeFreeze', {
      duration: this.timeFreezeDuration,
      cooldown: this.timeFreezeCooldown
    });

    this.scene.time.delayedCall(this.timeFreezeDuration, () => {
      this.timeFreezeActive = false;
      this.scene.mechanics.forEach(m => {
        if (m.resumeMechanic) m.resumeMechanic();
      });
    });
  }

  getTimeFreezeProgress() {
    const elapsed = this.scene.time.now - this.lastTimeFreeze;
    if (elapsed < this.timeFreezeDuration) {
      return 1 - (elapsed / this.timeFreezeDuration);
    }
    return Math.min(1, elapsed / this.timeFreezeCooldown);
  }

  respawn(x, y) {
    this.sprite.setPosition(x, y);
    this.sprite.setVelocity(0, 0);
    this.sprite.setActive(true);
    this.sprite.setVisible(true);
    this.isOnChain = false;
    this.jumpCount = 0;
  }

  destroy() {
    this.sprite.destroy();
  }
}
