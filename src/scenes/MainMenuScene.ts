export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  preload(): void {
    // You would load your menu background and button textures here
    // For now, we'll use simple colors and text.
    this.load.image("menu_bg", "./images/arena_bg.png"); // Re-use existing background for simplicity
  }

  create(): void {
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    // 1. Background
    this.add
      .image(screenWidth / 2, screenHeight / 2, "menu_bg")
      .setDisplaySize(screenWidth, screenHeight)
      .setAlpha(0.5);

    // 2. Game Title (Large and Stylized)
    this.add
      .text(screenWidth / 2, screenHeight * 0.25, "NEON ARENA", {
        fontSize: "100px",
        color: "#00FFFF", // Neon Cyan
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 8,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: "#00FFFF",
          blur: 15,
          fill: true,
        },
      })
      .setOrigin(0.5);

    // 3. Button Positions
    const buttonYStart = screenHeight * 0.5;
    const buttonSpacing = 80;

    // 4. Create Interactive Buttons

    // Function to create a clean, interactive button
    const createMenuButton = (
      y: number,
      text: string,
      sceneKey: string | (() => void)
    ) => {
      const button = this.add
        .text(screenWidth / 2, y, text, {
          fontSize: "36px",
          color: "#FFFFFF",
          backgroundColor: "#22222299",
          padding: { x: 30, y: 15 },
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      button.on("pointerdown", () => {
        if (typeof sceneKey === "string") {
          this.scene.start(sceneKey);
        } else {
          sceneKey();
        }
      });

      button.on("pointerover", () =>
        button.setBackgroundColor("#00FFFF").setColor("#000000")
      );
      button.on("pointerout", () =>
        button.setBackgroundColor("#22222299").setColor("#FFFFFF")
      );

      return button;
    };

    // --- Start Game Button ---
    createMenuButton(buttonYStart, "START GAME", "GameScene");

    // --- Settings Button ---
    createMenuButton(buttonYStart + buttonSpacing, "SETTINGS", () => {
      // Stop the current scene and launch settings

      this.scene.pause();
      this.scene.launch("SettingsScene", { callingSceneKey: "MainMenuScene" });
    });

    // --- Exit Button ---
    createMenuButton(buttonYStart + buttonSpacing * 2, "EXIT GAME", () => {
      console.log("Exiting game (In a real build, this would close the app)");
      // In a browser, you might navigate away or display a message
      this.add
        .text(screenWidth / 2, screenHeight - 50, "Thank you for playing!", {
          fontSize: "24px",
          color: "#FFD700",
        })
        .setOrigin(0.5);
    });

    // Ensure the Settings Scene is available when called
    if (!this.scene.get("SettingsScene")) {
      console.warn(
        "SettingsScene not registered. Please ensure it's in your main config file."
      );
    }
  }
}
