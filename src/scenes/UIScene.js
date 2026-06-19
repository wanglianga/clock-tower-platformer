import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.deathScreen = null;
    this.victoryScreen = null;
    this.controlsPanel = null;
    this.timeFreezeIndicator = null;
    this.deathCount = 0;

    this.createControlsPanel();
    this.createTimeFreezeIndicator();
    this.createDeathTypeLegend();

    this.input.keyboard.on('keydown-H', () => {
      this.toggleControlsPanel();
    });

    this.scene.get('GameScene').events.on('timeFreeze', (data) => {
      this.updateTimeFreezeIndicator(data);
    });
  }

  createControlsPanel() {
    const panelX = 20;
    const panelY = 20;
    const panelWidth = 220;
    const panelHeight = 280;

    this.controlsPanel = this.add.container(panelX, panelY);

    const bg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x1a1a2e, 0.9);
    bg.setStrokeStyle(2, 0x8b7355);
    bg.setOrigin(0);

    const title = this.add.text(panelWidth / 2, 15, '操作说明 [H] 隐藏', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5, 0);

    const controls = [
      { key: 'A / ←', action: '向左移动' },
      { key: 'D / →', action: '向右移动' },
      { key: 'W / ↑', action: '向上攀爬' },
      { key: 'S / ↓', action: '向下攀爬' },
      { key: '空格', action: '跳跃 (二段跳)' },
      { key: 'Q', action: '切换最近齿轮方向' },
      { key: 'R', action: '打开最近发条门' },
      { key: 'E', action: '短暂暂停机关' }
    ];

    controls.forEach((ctrl, i) => {
      const y = 50 + i * 28;

      const keyBg = this.add.rectangle(15, y, 60, 22, 0x333333);
      keyBg.setOrigin(0, 0.5);
      keyBg.setStrokeStyle(1, 0x666666);

      const keyText = this.add.text(45, y, ctrl.key, {
        fontSize: '11px',
        fontFamily: 'Courier New',
        color: '#ffffff'
      });
      keyText.setOrigin(0.5, 0.5);

      const actionText = this.add.text(85, y, ctrl.action, {
        fontSize: '12px',
        fontFamily: 'Courier New',
        color: '#cccccc'
      });
      actionText.setOrigin(0, 0.5);

      this.controlsPanel.add([keyBg, keyText, actionText]);
    });

    const hintText = this.add.text(panelWidth / 2, panelHeight - 25, '按 H 显示/隐藏', {
      fontSize: '10px',
      fontFamily: 'Courier New',
      color: '#888888'
    });
    hintText.setOrigin(0.5);

    this.controlsPanel.add([bg, title, hintText]);
    this.controlsPanel.setVisible(true);
  }

  createTimeFreezeIndicator() {
    const x = 960 - 40;
    const y = 600;

    this.timeFreezeIndicator = this.add.container(x, y);

    const bg = this.add.circle(0, 0, 25, 0x1a1a2e, 0.8);
    bg.setStrokeStyle(2, 0x8888ff);

    const icon = this.add.text(0, 0, '⏱', {
      fontSize: '24px',
      color: '#8888ff'
    });
    icon.setOrigin(0.5);

    this.cooldownCircle = this.add.graphics();
    this.cooldownCircle.setDepth(bg.depth + 1);

    const label = this.add.text(0, 35, 'E - 时间暂停', {
      fontSize: '11px',
      fontFamily: 'Courier New',
      color: '#8888ff'
    });
    label.setOrigin(0.5);

    this.timeFreezeIndicator.add([bg, icon, this.cooldownCircle, label]);
    this.timeFreezeIndicator.setScrollFactor(0);
  }

  updateTimeFreezeIndicator(data) {
    const gameScene = this.scene.get('GameScene');
    const player = gameScene.player;

    this.time.delayedCall(100, () => {
      this.cooldownCircle.clear();
      const progress = player.getTimeFreezeProgress();

      if (progress < 1) {
        const angle = progress * Math.PI * 2;
        this.cooldownCircle.lineStyle(4, 0x444488);
        this.cooldownCircle.beginPath();
        this.cooldownCircle.arc(
          this.timeFreezeIndicator.x,
          this.timeFreezeIndicator.y,
          28,
          -Math.PI / 2,
          -Math.PI / 2 + angle,
          false
        );
        this.cooldownCircle.strokePath();
      }
    }, [], this);
  }

  createDeathTypeLegend() {
    const legend = [
      { icon: '⚙', color: '#ff6666', desc: '齿轮夹住' },
      { icon: '🕳', color: '#6666ff', desc: '机井坠落' },
      { icon: '⏰', color: '#ffaa00', desc: '错过发条' },
      { icon: '🔨', color: '#ff4444', desc: '摆锤撞击' }
    ];

    const container = this.add.container(960 + 250, 600);

    legend.forEach((item, i) => {
      const y = (i - 1.5) * 28;

      const icon = this.add.text(0, y, item.icon, {
        fontSize: '18px',
        color: item.color
      });
      icon.setOrigin(0, 0.5);

      const text = this.add.text(28, y, item.desc, {
        fontSize: '11px',
        fontFamily: 'Courier New',
        color: '#cccccc'
      });
      text.setOrigin(0, 0.5);

      container.add([icon, text]);
    });

    container.setScrollFactor(0);
  }

  toggleControlsPanel() {
    if (this.controlsPanel) {
      this.controlsPanel.setVisible(!this.controlsPanel.visible);
    }
  }

  showDeathScreen(data) {
    this.deathCount++;

    if (this.deathScreen) {
      this.deathScreen.destroy();
    }

    this.deathScreen = this.add.container(480, 320);

    const overlay = this.add.rectangle(480, 320, 960, 640, 0x000000, 0.7);
    overlay.setScrollFactor(0);

    const bg = this.add.rectangle(0, 0, 500, 350, 0x2d2d44);
    bg.setStrokeStyle(3, 0xff4444);

    const icons = {
      'gear-crush': { icon: '⚙', color: '#ff6666' },
      'pit-fall': { icon: '🕳', color: '#6666ff' },
      'spring-door': { icon: '⏰', color: '#ffaa00' },
      'pendulum-hit': { icon: '🔨', color: '#ff4444' }
    };

    const deathInfo = icons[data.type] || { icon: '💀', color: '#ffffff' };

    const deathIcon = this.add.text(0, -120, deathInfo.icon, {
      fontSize: '64px',
      color: deathInfo.color
    });
    deathIcon.setOrigin(0.5);

    const title = this.add.text(0, -60, '你失败了！', {
      fontSize: '28px',
      fontFamily: 'Courier New',
      color: '#ff4444',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const typeLabels = {
      'gear-crush': '被齿轮夹住',
      'pit-fall': '掉进机井',
      'spring-door': '错过发条窗口',
      'pendulum-hit': '被摆锤撞落'
    };
    const typeLabel = typeLabels[data.type] || '未知原因';

    const typeText = this.add.text(0, -20, `原因：${typeLabel}`, {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: deathInfo.color
    });
    typeText.setOrigin(0.5);

    const messageBg = this.add.rectangle(0, 40, 450, 80, 0x1a1a2e, 0.8);
    messageBg.setStrokeStyle(1, 0x666666);

    const message = this.add.text(0, 40, data.message, {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#cccccc',
      align: 'center',
      wordWrap: { width: 420 }
    });
    message.setOrigin(0.5);

    const tips = this.getDeathTip(data.type);
    const tipText = this.add.text(0, 100, `💡 提示：${tips}`, {
      fontSize: '13px',
      fontFamily: 'Courier New',
      color: '#ffd700',
      align: 'center',
      wordWrap: { width: 420 }
    });
    tipText.setOrigin(0.5);

    const deathsText = this.add.text(-180, 150, `死亡次数: ${this.deathCount}`, {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#888888'
    });
    deathsText.setOrigin(0, 0.5);

    const button = this.add.rectangle(150, 150, 140, 40, 0x4a7c59);
    button.setStrokeStyle(2, 0x6ab07a);
    button.setInteractive({ useHandCursor: true });

    const buttonText = this.add.text(150, 150, '按空格复活', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#ffffff'
    });
    buttonText.setOrigin(0.5);

    button.on('pointerdown', () => this.respawn());
    this.input.keyboard.once('keydown-SPACE', () => this.respawn());

    this.deathScreen.add([
      bg, deathIcon, title, typeText, messageBg, message,
      tipText, deathsText, button, buttonText
    ]);
    this.deathScreen.setScrollFactor(0);

    this.cameras.main.shake(300, 0.01);
    this.cameras.main.flash(200, 255, 0, 0, true);
  }

  getDeathTip(type) {
    const tips = {
      'gear-crush': '齿轮的齿牙在旋转时会夹住玩家。站在齿轮顶部平面最安全，或者在齿牙间隙时快速通过。按 E 暂停机关可以给你更多反应时间。',
      'pit-fall': '注意观察平台之间的空隙。使用二段跳可以跨过更远的距离。如果不确定，先在边缘停留观察，再决定跳跃时机。',
      'spring-door': '发条门开启后有绿色安全窗口和橙色警告窗口。务必在绿色窗口期间通过。如果来不及，按 E 暂停机关可以延长时间。',
      'pendulum-hit': '摆锤在两端最高点时速度最慢，是跳跃的最佳时机。在最低点时速度最快，一定要避开。也可以站在摆锤顶部作为移动平台使用。'
    };
    return tips[type] || '仔细观察机关的运动规律，找到安全的通过时机。';
  }

  respawn() {
    if (this.deathScreen) {
      this.deathScreen.destroy();
      this.deathScreen = null;
    }

    const gameScene = this.scene.get('GameScene');
    gameScene.respawnPlayer();

    this.cameras.main.flash(200, 0, 255, 100, true);
  }

  showVictoryScreen() {
    if (this.victoryScreen) {
      this.victoryScreen.destroy();
    }

    this.victoryScreen = this.add.container(480, 320);

    const overlay = this.add.rectangle(480, 320, 960, 640, 0x000000, 0.8);
    overlay.setScrollFactor(0);

    const bg = this.add.rectangle(0, 0, 500, 400, 0x2d2d44);
    bg.setStrokeStyle(3, 0xffd700);

    const clockIcon = this.add.text(0, -130, '⏰', {
      fontSize: '72px'
    });
    clockIcon.setOrigin(0.5);

    const title = this.add.text(0, -60, '钟楼修复完成！', {
      fontSize: '32px',
      fontFamily: 'Courier New',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(0, -20, '你成功让钟楼重新运转', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#cccccc'
    });
    subtitle.setOrigin(0.5);

    const stars = this.add.text(0, 30, '★ ★ ★', {
      fontSize: '36px',
      color: '#ffd700'
    });
    stars.setOrigin(0.5);

    const stats = this.add.text(0, 80, `死亡次数: ${this.deathCount}`, {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#888888'
    });
    stats.setOrigin(0.5);

    const message = this.add.text(0, 110, '感谢你的游玩！修钟学徒的任务完成了。', {
      fontSize: '13px',
      fontFamily: 'Courier New',
      color: '#aaaaaa',
      align: 'center'
    });
    message.setOrigin(0.5);

    const button = this.add.rectangle(0, 160, 180, 45, 0xffd700);
    button.setStrokeStyle(2, 0xffa500);
    button.setInteractive({ useHandCursor: true });

    const buttonText = this.add.text(0, 160, '按 R 重新开始', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#1a1a2e',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5);

    button.on('pointerdown', () => this.restartGame());
    this.input.keyboard.once('keydown-R', () => this.restartGame());

    this.victoryScreen.add([
      bg, clockIcon, title, subtitle, stars, stats,
      message, button, buttonText
    ]);
    this.victoryScreen.setScrollFactor(0);

    this.cameras.main.flash(500, 255, 215, 0, true);
  }

  restartGame() {
    if (this.victoryScreen) {
      this.victoryScreen.destroy();
      this.victoryScreen = null;
    }
    if (this.deathScreen) {
      this.deathScreen.destroy();
      this.deathScreen = null;
    }

    this.deathCount = 0;
    this.scene.stop('GameScene');
    this.scene.start('GameScene');
  }

  update() {
    const gameScene = this.scene.get('GameScene');
    if (gameScene.player && this.timeFreezeIndicator) {
      const progress = gameScene.player.getTimeFreezeProgress();
      this.cooldownCircle.clear();

      if (progress < 1) {
        const angle = progress * Math.PI * 2;
        this.cooldownCircle.lineStyle(4, 0x444488);
        this.cooldownCircle.beginPath();
        this.cooldownCircle.arc(
          this.timeFreezeIndicator.x,
          this.timeFreezeIndicator.y,
          28,
          -Math.PI / 2,
          -Math.PI / 2 + angle,
          false
        );
        this.cooldownCircle.strokePath();
      } else {
        this.cooldownCircle.lineStyle(4, 0x88ff88);
        this.cooldownCircle.beginPath();
        this.cooldownCircle.arc(
          this.timeFreezeIndicator.x,
          this.timeFreezeIndicator.y,
          28,
          0,
          Math.PI * 2,
          false
        );
        this.cooldownCircle.strokePath();
      }
    }
  }
}
