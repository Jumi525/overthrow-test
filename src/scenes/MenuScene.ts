// src/scenes/MenuScene.ts

export class MenuScene extends Phaser.Scene {
  private selectedTheme: string = "arena_dark";
  private selectedPlayerKey: string = "player";

  private playerSelectionElements: {
    sprite: Phaser.GameObjects.Sprite;
    key: string;
  }[] = [];
  private themeButtons: Phaser.GameObjects.Text[] = [];

  // --- NEW: Property to hold the active selection border ---
  private playerSelectionBorder!: Phaser.GameObjects.Rectangle;
  // ---------------------------------------------------------

  // Player and Theme options
  private playerOptions: { key: string; name: string; description: string }[] =
    [
      {
        key: "player",
        name: "CYBORG ZERO",
        description: "Balanced melee unit with high mobility.",
      },
      {
        key: "player_ranger",
        name: "RANGED UNIT",
        description: "Low health, high ranged attack damage.",
      },
      {
        key: "player_heavy",
        name: "HEAVY DRONE",
        description: "Slow, but heavily armored tank unit.",
      },
    ];
  private themeOptions: { key: string; name: string; color: string }[] = [
    { key: "arena_dark", name: "CYBER DARK", color: "#00ffff" },
    { key: "arena_neon", name: "NEON GRID", color: "#ff00ff" },
    { key: "arena_toxic", name: "TOXIC WASTE", color: "#00ff00" },
  ];

  // Colors for the Light Theme
  private HEADER_COLOR = "#0000ff";
  private GLOW_COLOR = 0x0000ff;
  private BACKGROUND_COLOR = "#f0f0f5";
  private TEXT_COLOR_DARK = "#333333";

  private playerDescriptionText!: Phaser.GameObjects.Text;

  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.createBackground();
    this.createHeaderAndTitle();
    this.createThemeSelector();
    this.createEnemyShowcase();
    this.createPlayerSelection();
    this.createStartButton();

    // Initialize the description text AND the selection border for the default player
    this.selectPlayer(this.selectedPlayerKey, true);
  }

  // --- UI Creation Methods (unchanged methods omitted for brevity) ---
  private createBackground() {
    // Light, high-tech lab background
    this.cameras.main.setBackgroundColor(this.BACKGROUND_COLOR);
    // Optional: Add a subtle grid/floor texture here
  }

  private createHeaderAndTitle() {
    // --- HEADER ---
    const headerText = this.add.text(30, 30, "PROJECT_OVERTHROW", {
      fontFamily: "Electrolize, Arial",
      fontSize: "18px",
      color: this.HEADER_COLOR,
    });
    this.applyFlicker(headerText, this.TEXT_COLOR_DARK, 30);

    // --- MAIN TITLE ---
    const titleText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.15, "UNIT SELECTION", {
        fontFamily: "Electrolize, Arial",
        fontSize: "48px",
        color: this.TEXT_COLOR_DARK,
      })
      .setOrigin(0.5);
    // Apply Glow and the Glitch effect
    if (this.game.renderer.type === Phaser.WEBGL) {
      titleText.postFX.addGlow(this.GLOW_COLOR, 0, 0, false, 0.1, 32);
    }
    this.applyFlicker(titleText, this.HEADER_COLOR);

    // Apply Glow (using blue glow on dark text)
    if (this.game.renderer.type === Phaser.WEBGL) {
      titleText.postFX.addGlow(this.GLOW_COLOR, 0, 0, false, 0.1, 32);
    }
  }

  private createThemeSelector() {
    const startY = this.scale.height * 0.2;
    const startX = 50;

    // Section Header
    this.add.text(startX, startY, "SELECT ARENA THEME ::", {
      fontFamily: "Electrolize, Arial",
      fontSize: "18px",
      color: this.TEXT_COLOR_DARK,
    });

    this.add
      .rectangle(startX, startY + 28, this.scale.width - 100, 2, 0x0000ff)
      .setOrigin(0, 0.5)
      .setAlpha(0.5);

    // Theme Buttons
    this.themeOptions.forEach((theme, index) => {
      const themeBtn = this.add
        .text(startX + 10 + index * 180, startY + 50, theme.name, {
          fontFamily: "Electrolize, Arial",
          fontSize: "18px",
          color: this.TEXT_COLOR_DARK, // Start with dark color
        })
        .setInteractive()
        .setName(theme.key);

      this.themeButtons.push(themeBtn);

      themeBtn.on("pointerdown", () => {
        this.selectTheme(theme.key, theme.color);
      });

      // Initialize selection and highlight the default theme
      if (theme.key === this.selectedTheme) {
        this.selectTheme(theme.key, theme.color, true);
      }
    });
  }
  private selectTheme(
    themeKey: string,
    colorHex: string,
    initial: boolean = false
  ) {
    this.selectedTheme = themeKey;
    const numericColor = parseInt(colorHex.substring(1), 16);

    // Update all buttons for visual feedback
    this.themeButtons.forEach((btn) => {
      if (btn.name === themeKey) {
        btn.setColor(colorHex); // Use the theme's vibrant color
        btn.setScale(1.1);
        if (!initial && this.game.renderer.type === Phaser.WEBGL) {
          btn.postFX.addGlow(numericColor, 0, 0, false, 0.1, 12);
        }
      } else {
        btn.setColor(this.TEXT_COLOR_DARK); // Unselected buttons are dark
        btn.setScale(1.0);
        btn.postFX.list.forEach((fx) => fx.destroy());
      }
    });
  }

  private createEnemyShowcase() {
    const startY = this.scale.height * 0.45;
    const startX = this.scale.width * 0.6; // Position on the right

    // Section Header
    this.add.text(startX, startY, "THREAT ASSESSMENT ::", {
      fontFamily: "Electrolize, Arial",
      fontSize: "18px",
      color: this.TEXT_COLOR_DARK,
    });

    this.add
      .rectangle(startX, startY + 28, this.scale.width * 0.35, 2, 0xff0000)
      .setOrigin(0, 0.5)
      .setAlpha(0.5); // Red Separator line

    // Display the enemy sprite and its name/stats
    const enemyX = startX + 250;
    const enemySprite = this.add
      .sprite(enemyX, startY + 120, "player", "player")
      .setScale(2.5);

    enemySprite.play("player_idle", true);

    this.add
      .text(enemyX, startY + 220, "BASIC DRONE [D-01]", {
        fontFamily: "Electrolize, Arial",
        fontSize: "16px",
        color: "#ff0000",
      })
      .setOrigin(0.5);

    // Simple stats panel
    this.add.text(
      startX,
      startY + 60,
      [
        "ENEMY TYPE: Melee Assault",
        "HEALTH: 50 | DAMAGE: 1",
        "TACTIC: Relentless Pursuit",
        "VULNERABILITY: Knockback",
      ].join("\n"),
      {
        fontFamily: "Arial",
        fontSize: "14px",
        color: this.TEXT_COLOR_DARK,
        lineSpacing: 8,
      }
    );
  }

  private createPlayerSelection() {
    const startY = this.scale.height * 0.45;
    const startX = 50;

    // Section Header
    this.add.text(startX, startY, "SELECT PLAYER UNIT ::", {
      fontFamily: "Electrolize, Arial",
      fontSize: "18px",
      color: this.TEXT_COLOR_DARK,
    });
    this.add
      .rectangle(startX, startY + 28, this.scale.width * 0.45, 2, 0x0000ff)
      .setOrigin(0, 0.5)
      .setAlpha(0.5);

    // Description text
    this.playerDescriptionText = this.add.text(startX, startY + 240, "", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: this.TEXT_COLOR_DARK,
      wordWrap: { width: this.scale.width * 0.45 },
    });

    // --- Player Unit Options ---
    this.playerOptions.forEach((unit, index) => {
      const spriteKey = unit.key === "player" ? "player" : "player1_idle";

      const containerX = startX + 100 + index * 180;
      const containerY = startY + 130;

      // Unit Name
      this.add
        .text(containerX, containerY - 60, unit.name, {
          fontFamily: "Electrolize, Arial",
          fontSize: "16px",
          color: this.TEXT_COLOR_DARK,
        })
        .setOrigin(0.5);

      // Unit Sprite (Interactive)
      const sprite = this.add
        .sprite(containerX, containerY, spriteKey, "idle_1")
        .setScale(2.0)
        .setInteractive();

      sprite.setData("key", unit.key);
      this.playerSelectionElements.push({ sprite, key: unit.key });

      // Interaction Logic
      sprite.on("pointerdown", () => {
        this.selectPlayer(unit.key);
      });
    });
  }

  private selectPlayer(playerKey: string, initial: boolean = false) {
    this.selectedPlayerKey = playerKey;
    const unit = this.playerOptions.find((p) => p.key === playerKey);

    let selectedSprite: Phaser.GameObjects.Sprite | null = null;

    // 1. Update Visuals (Tint, Scale, and find the selected sprite)
    this.playerSelectionElements.forEach((element) => {
      if (element.key === playerKey) {
        // SELECTED: Full visibility and blue tint/glow
        element.sprite.setAlpha(1.0);
        element.sprite.setTint(this.GLOW_COLOR);
        element.sprite.setScale(2.2);
        element.sprite.play("player_idle", true);
        selectedSprite = element.sprite;
      } else {
        // UNSELECTED: Reduced alpha for an "offline/deactivated" look
        element.sprite.setAlpha(0.4);
        element.sprite.clearTint();
        element.sprite.setScale(2.0);
        element.sprite.stop();
      }
    });

    // 2. Update Description Text
    if (unit) {
      this.playerDescriptionText.setText(
        `Unit: ${unit.name}\n${unit.description}`
      );
    }

    // --- NEW: Selection Border Feedback ---
    if (selectedSprite) {
      if (this.playerSelectionBorder) {
        this.playerSelectionBorder.destroy(); // Destroy previous border if it exists
      }
      // Create a new border around the selected sprite
      this.playerSelectionBorder = this.add.rectangle(
        selectedSprite.x,
        selectedSprite.y,
        selectedSprite.displayWidth + 20, // Slightly larger than the sprite
        selectedSprite.displayHeight + 20, // Slightly larger than the sprite
        0, // No fill
        0 // No alpha for fill
      );
      this.playerSelectionBorder.setStrokeStyle(3, this.GLOW_COLOR, 1); // Blue outline, 3px thick
    }
    // ------------------------------------
  }

  private createStartButton() {
    const startButton = this.add
      .text(this.scale.width / 2, this.scale.height * 0.93, "GAME START", {
        fontFamily: "Electrolize, Arial",
        fontSize: "36px",
        color: this.TEXT_COLOR_DARK,
      })
      .setOrigin(0.5)
      .setInteractive();

    // Add pointer events for hover/glow effects (using the light theme colors)
    startButton.on("pointerover", () => {
      startButton.setColor(this.HEADER_COLOR); // Blue hover color
      this.tweens.add({
        targets: startButton,
        scale: 1.05,
        duration: 150,
        ease: "Sine.easeOut",
      });
      if (this.game.renderer.type === Phaser.WEBGL) {
        startButton.postFX.addGlow(this.GLOW_COLOR, 0, 0, false, 0.1, 16);
      }
    });

    startButton.on("pointerout", () => {
      startButton.setColor(this.TEXT_COLOR_DARK);
      this.tweens.add({
        targets: startButton,
        scale: 1.0,
        duration: 150,
        ease: "Sine.easeOut",
      });
      startButton.postFX.list.forEach((fx) => fx.destroy());
    });

    startButton.on("pointerdown", () => {
      // Pass selected theme and player key to GameScene
      this.cameras.main.fadeOut(
        500,
        0,
        0,
        0,
        (camera: Phaser.Cameras.Scene2D.Camera, progress: number) => {
          if (progress === 1) {
            this.scene.start("GameScene", {
              theme: this.selectedTheme,
              playerKey: this.selectedPlayerKey,
            });
          }
        }
      );
    });
  }

  private applyFlicker(
    target: Phaser.GameObjects.Text,
    color: string,
    duration: number = 50
  ): void {
    this.time.addEvent({
      delay: 1000, // Check roughly every second
      callback: () => {
        if (Math.random() < 0.2) {
          // 20% chance to flicker
          const originalColor = target.style.color;
          target.setColor(color);
          this.time.delayedCall(duration, () => {
            target.setColor(originalColor);
          });
        }
      },
      callbackScope: this,
      loop: true,
    });
  }
}
