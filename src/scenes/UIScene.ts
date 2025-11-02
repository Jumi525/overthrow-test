import { HealthBar } from "../classes/HealthBar";

export class UIScene extends Phaser.Scene {
  private healthValueText!: Phaser.GameObjects.Text;
  private healthBar!: HealthBar;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private pauseOverlay!: Phaser.GameObjects.Container; // NEW: Container for all pause elements
  private comboNotification!: Phaser.GameObjects.Text; // NEW: Separate notification text

  private comboCount: number = 0;
  private comboTimer?: Phaser.Time.TimerEvent;
  private indicatorGraphic!: Phaser.GameObjects.Graphics;

  constructor() {
    super("UIScene");
  }

  create(): void {
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    // --- 1. HUD ELEMENTS (Health Bar and Score) ---

    // A. Graphical Health Bar
    this.healthBar = new HealthBar(this, 30, 30, 100);

    // B. Health Value Text
    this.healthValueText = this.add.text(35, 30, "100 HP", {
      fontSize: "16px",
      color: "#FFFFFF",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    });

    // C. Score Display (High-Contrast Neon)
    this.scoreText = this.add
      .text(screenWidth - 30, 30, "SCORE: 0", {
        fontSize: "28px",
        color: "#ff00ff",
        fontFamily: "monospace",
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#ff00ff",
          blur: 10,
          fill: true,
          stroke: false,
        },
      })
      .setOrigin(1, 0);

    // D. Combo Counter (Stays centered at the top)
    this.comboText = this.add
      .text(screenWidth / 2, 80, "", {
        fontSize: "64px",
        color: "#FFFFFF",
        fontStyle: "extra-bold",
        stroke: "#FFD700",
        strokeThickness: 8,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#FFD700",
          blur: 20,
          fill: true,
          stroke: false,
        },
      })
      .setOrigin(0.5, 0)
      .setVisible(false)
      .setDepth(10);

    // --- 2. COMBO POP-UP NOTIFICATION (More advanced than just the counter) ---
    this.comboNotification = this.add
      .text(screenWidth / 2, 180, "", {
        fontSize: "40px",
        color: "#00FFFF", // Neon Cyan
        fontStyle: "bold",
        backgroundColor: "#000000DD", // Dark background for contrast
        padding: { x: 20, y: 10 },
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#00FFFF",
          blur: 10,
          fill: true,
          stroke: false,
        },
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(11);

    // 1. Create the Graphics object to draw the arrow
    this.indicatorGraphic = this.add.graphics({
      lineStyle: { width: 3, color: 0xff0000 },
    });
    this.indicatorGraphic.setDepth(500); // Ensure it's on top

    // 2. Set up event listener from GameScene
    this.scene
      .get("GameScene")

      .events.on("updateIndicator", this.handleIndicatorUpdate, this);

    // Initially hide it
    this.indicatorGraphic.setVisible(false);

    // --- 3. PAUSE/SETTINGS BUTTON (Stays visible in the corner) ---
    this.createPauseButton(screenWidth - 30, screenHeight - 30);

    // --- 4. PAUSE MENU OVERLAY ---
    this.createPauseOverlay(screenWidth / 2, screenHeight / 2);

    // --- 5. Event Listeners ---
    const gameScene = this.scene.get("GameScene");

    if (gameScene) {
      gameScene.events.on("updateHealth", this.updateHealth, this);
      gameScene.events.on("updateScore", this.updateScore, this);
      gameScene.events.on("enemyDefeated", this.startCombo, this);
      this.input.keyboard!.on("keydown-P", this.togglePause, this); // 'P' key for quick pause
    }
  }

  // --- PAUSE MENU LOGIC ---

  private createPauseButton(x: number, y: number): void {
    const pauseButton = this.add
      .text(x, y, "PAUSE | P", {
        fontSize: "20px",
        color: "#00FFFF",
        backgroundColor: "#00000099",
        padding: { x: 10, y: 5 },
        fontStyle: "bold",
      })
      .setOrigin(1, 1) // Bottom-right anchor
      .setInteractive({ useHandCursor: true })
      .setDepth(100);

    pauseButton.on("pointerdown", this.togglePause, this);
    pauseButton.on("pointerover", () => pauseButton.setColor("#FFD700"));
    pauseButton.on("pointerout", () => pauseButton.setColor("#00FFFF"));
  }

  private createPauseOverlay(centerX: number, centerY: number): void {
    const boxWidth = 350;
    const boxHeight = 400;

    // Dark background layer (covers the screen to dim the game)
    const darkBackground = this.add.rectangle(
      centerX,
      centerY,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.8
    );

    // Frame/Box (Neon outline for sci-fi look)
    const frame = this.add.graphics();
    frame.lineStyle(4, 0x00ffff, 1);
    frame.strokeRect(
      centerX - boxWidth / 2,
      centerY - boxHeight / 2,
      boxWidth,
      boxHeight
    );

    // Title Text
    const title = this.add
      .text(centerX, centerY - 150, "SYSTEM PAUSED", {
        fontSize: "32px",
        color: "#FFD700",
        fontStyle: "bold",
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#FFD700",
          blur: 10,
          fill: true,
        },
      })
      .setOrigin(0.5);

    // Function to create a stylish button
    const createButton = (
      yOffset: number,
      text: string,
      callback: () => void
    ) => {
      const button = this.add
        .text(centerX, centerY + yOffset, text, {
          fontSize: "20px",
          color: "#FFFFFF",
          backgroundColor: "#333333",
          padding: { x: 20, y: 10 },
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      button.on("pointerdown", callback);
      button.on("pointerover", () =>
        button.setBackgroundColor("#00FFFF").setColor("#000000")
      );
      button.on("pointerout", () =>
        button.setBackgroundColor("#333333").setColor("#FFFFFF")
      );
      return button;
    };

    // Buttons
    const resumeButton = createButton(-50, "RESUME (PLAY)", () =>
      this.togglePause()
    );
    const settingsButton = createButton(50, "SETTINGS", () => {
      console.log("Open Settings Menu");
      this.scene.pause();
      this.scene.launch("SettingsScene", { callingSceneKey: "GameScene" });
    });
    const quitButton = createButton(150, "QUIT TO MAIN MENU", () =>
      this.endGame(false, true)
    ); // New 'quit' handler

    // Create the container and hide it
    this.pauseOverlay = this.add
      .container(0, 0, [
        darkBackground,
        frame,
        title,
        resumeButton,
        settingsButton,
        quitButton,
      ])
      .setVisible(false)
      .setDepth(101);
  }

  public togglePause(): void {
    const gameScene = this.scene.get("GameScene");
    if (!gameScene) return;

    if (this.scene.isPaused(gameScene)) {
      // Unpause
      this.scene.resume(gameScene);
      this.pauseOverlay.setVisible(false);
      console.log("Game Resumed");
    } else {
      // Pause
      this.scene.pause(gameScene);
      this.pauseOverlay.setVisible(true);
      console.log("Game Paused");
    }
  }

  // --- HUD UPDATERS ---

  private updateHealth(health: number): void {
    this.healthBar.update(health);
    this.healthValueText.setText(`${health} HP`);
  }

  private updateScore(score: number): void {
    this.scoreText.setText(`SCORE: ${score}`);
  }

  // --- COMBO LOGIC (Updated to use the new Combo Notification) ---
  private startCombo(): void {
    this.comboCount++;

    if (this.comboTimer) {
      this.comboTimer.remove(false);
    }

    // 1. Update the Main Combo Counter (at the top)
    this.comboText.setText(`COMBO x${this.comboCount}!`);
    this.comboText.setVisible(true);
    this.tweens.add({
      targets: this.comboText,
      scale: { from: 1.2, to: 1.0 },
      alpha: 1.0,
      duration: 100,
      ease: "Sine.easeOut",
    });

    // 2. Show the separate Pop-up Notification
    this.comboNotification.setText(`+${this.comboCount} BONUS!`);
    this.comboNotification.setVisible(true);
    this.comboNotification.setAlpha(1);

    // Animation for Pop-up (More advanced motion/effect)
    this.tweens.add({
      targets: this.comboNotification,
      y: { from: 200, to: 150 }, // Float upwards
      alpha: 0, // Fade out
      duration: 800,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.comboNotification.y = 180; // Reset position for next pop-up
        this.comboNotification.setVisible(false);
      },
    });

    // Extend the timer based on combo length
    const comboDuration = 1500 + this.comboCount * 50;
    this.comboTimer = this.time.delayedCall(
      comboDuration,
      this.endCombo,
      [],
      this
    );
  }

  private endCombo(): void {
    if (this.comboCount > 1) {
      this.tweens.add({
        targets: this.comboText,
        alpha: 0,
        duration: 500,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.comboText.setVisible(false);
          this.comboText.setAlpha(1);
        },
      });
      console.log(`Combo ended! Final count: ${this.comboCount}`);
    } else {
      this.comboText.setVisible(false);
    }
    this.comboCount = 0;
  }

  // Public method for GameScene to use when ending the game (e.g., from Quit button)
  public endGame(win: boolean, quitToMenu: boolean = false): void {
    this.scene.stop("UIScene");
    this.scene.stop("GameScene");
    if (quitToMenu) {
      // Assuming "MainMenuScene" is the name of your main menu scene
      this.scene.start("MainMenuScene");
    } else {
      this.scene.start("GameOverScene", {
        score: this.scoreText.text.replace("SCORE: ", ""),
        win,
      });
    }
  }
  private handleIndicatorUpdate(data: {
    visible: boolean;
    angle?: number;
  }): void {
    this.indicatorGraphic.setVisible(data.visible);

    if (data.visible && data.angle !== undefined) {
      this.indicatorGraphic.clear();
      const angle = data.angle;
      const radius = 20; // Size of the arrow
      const padding = 20; // Distance from the screen edge

      // Calculate the position on the edge of the screen
      const indicatorX =
        this.scale.width / 2 +
        (this.scale.width / 2 - padding) * Math.cos(angle);
      const indicatorY =
        this.scale.height / 2 +
        (this.scale.height / 2 - padding) * Math.sin(angle);

      // Draw a simple triangle/chevron pointing outward
      this.indicatorGraphic.fillStyle(0xff0000, 1.0);
      this.indicatorGraphic.fillTriangle(
        indicatorX + radius * Math.cos(angle),
        indicatorY + radius * Math.sin(angle),
        indicatorX + radius * Math.cos(angle + 2.5),
        indicatorY + radius * Math.sin(angle + 2.5),
        indicatorX + radius * Math.cos(angle - 2.5),
        indicatorY + radius * Math.sin(angle - 2.5)
      );
    }
  }
}
