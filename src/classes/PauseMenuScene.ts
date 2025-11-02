// import Phaser from "phaser";

// export default class PauseMenuScene extends Phaser.Scene {
//   constructor() {
//     super("PauseMenuScene");
//   }

//   create(): void {
//     const centerX = this.scale.width / 2;
//     const centerY = this.scale.height / 2;

//     // 1. Create a semi-transparent dark background
//     const background = this.add
//       .rectangle(
//         centerX,
//         centerY,
//         this.scale.width,
//         this.scale.height,
//         0x000000,
//         0.7
//       )
//       .setDepth(100);

//     // 2. Display Title
//     this.add
//       .text(centerX, centerY - 150, "GAME PAUSED", {
//         fontSize: "64px",
//         color: "#FFFFFF",
//         fontStyle: "bold",
//       })
//       .setOrigin(0.5)
//       .setDepth(101);

//     // 3. Create Buttons (Resume, Settings, Main Menu)
//     this.createButton(centerX, centerY - 50, "RESUME", this.handleResume);
//     this.createButton(centerX, centerY + 50, "SETTINGS", this.handleSettings);
//     this.createButton(centerX, centerY + 150, "MAIN MENU", this.handleMainMenu);

//     // Re-enable pause key to unpause from the menu
//     this.input.keyboard!.on("keydown-P", this.handleResume, this);
//     this.input.keyboard!.on("keydown-ESC", this.handleResume, this);
//   }

//   // --- Button Handlers ---
//   private handleResume(): void {
//     // Stops this menu scene and resumes the others
//     this.scene.stop();
//     this.scene.resume("GameScene");
//     this.scene.resume("UIScene");
//   }

//   private handleSettings(): void {
//     // If you had a SettingsScene
//     // this.scene.launch("SettingsScene");
//   }

//   private handleMainMenu(): void {
//     // Stop all active game scenes and return to the main menu
//     this.scene.stop("UIScene");
//     this.scene.stop("GameScene");
//     this.scene.stop("PauseMenuScene");
//     this.scene.start("MainMenuScene");
//   }

//   private createButton(x: number, y: number, text: string, callback: Function) {
//     const button = this.add
//       .text(x, y, text, {
//         fontSize: "32px",
//         color: "#FFFFFF",
//         backgroundColor: "#222222",
//         padding: { x: 30, y: 10 },
//       })
//       .setOrigin(0.5)
//       .setInteractive({ useHandCursor: true })
//       .setDepth(101);

//     button.on("pointerdown", callback, this);
//     button.on("pointerover", () =>
//       button.setBackgroundColor("#00FFFF").setColor("#000000")
//     );
//     button.on("pointerout", () =>
//       button.setBackgroundColor("#222222").setColor("#FFFFFF")
//     );

//     return button;
//   }
// }

import Phaser from "phaser";

interface PauseMenuConfig {
  title?: string;
  backgroundColor?: number;
  backgroundAlpha?: number;
  textColor?: string;
  highlightColor?: string;
  buttonSpacing?: number;
}

/**
 * PauseMenuScene
 * -------------------
 * Fully autonomous overlay scene that handles pause menu display,
 * input handling, and scene transitions.
 *
 * Launch via: this.scene.launch("PauseMenuScene");
 */
export default class PauseMenuScene extends Phaser.Scene {
  private config: PauseMenuConfig;

  constructor(config?: PauseMenuConfig) {
    super("PauseMenuScene");
    this.config = {
      title: config?.title ?? "GAME PAUSED",
      backgroundColor: config?.backgroundColor ?? 0x000000,
      backgroundAlpha: config?.backgroundAlpha ?? 0.7,
      textColor: config?.textColor ?? "#FFFFFF",
      highlightColor: config?.highlightColor ?? "#00FFFF",
      buttonSpacing: config?.buttonSpacing ?? 100,
    };
  }

  create(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // 1️⃣ Create fade-in background
    const background = this.add
      .rectangle(
        centerX,
        centerY,
        this.scale.width,
        this.scale.height,
        this.config.backgroundColor,
        0
      )
      .setDepth(100);

    this.tweens.add({
      targets: background,
      alpha: this.config.backgroundAlpha,
      duration: 300,
      ease: "Sine.easeOut",
    });

    // 2️⃣ Title text
    this.add
      .text(centerX, centerY - 150, this.config.title, {
        fontSize: "64px",
        color: this.config.textColor,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(101);

    // 3️⃣ Buttons
    const buttons = [
      { label: "RESUME", action: this.handleResume },
      { label: "SETTINGS", action: this.handleSettings },
      { label: "MAIN MENU", action: this.handleMainMenu },
    ];

    buttons.forEach((b, i) => {
      this.createButton(
        centerX,
        centerY - 50 + i * this.config.buttonSpacing ?? 0,
        b.label,
        b.action
      );
    });

    // 4️⃣ Keyboard shortcuts (auto-unpause)
    this.input.keyboard!.on("keydown-P", this.handleResume, this);
    this.input.keyboard!.on("keydown-ESC", this.handleResume, this);
  }

  // --- Handlers ---
  private handleResume(): void {
    this.sound?.play("menu_click", { volume: 0.5 });
    this.fadeOutAndClose(() => {
      this.scene.stop();
      this.scene.resume("GameScene");
      this.scene.resume("UIScene");
    });
  }

  private handleSettings(): void {
    // Optional: launch settings overlay
    this.scene.launch("SettingsScene");
  }

  private handleMainMenu(): void {
    this.fadeOutAndClose(() => {
      this.scene.stop("UIScene");
      this.scene.stop("GameScene");
      this.scene.stop("PauseMenuScene");
      this.scene.start("MainMenuScene");
    });
  }

  private fadeOutAndClose(onComplete: Function) {
    const overlay = this.add
      .rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x000000,
        0
      )
      .setDepth(999);

    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 200,
      ease: "Sine.easeIn",
      onComplete: () => onComplete(),
    });
  }

  // --- UI Builder ---
  private createButton(x: number, y: number, text: string, callback: Function) {
    const button = this.add
      .text(x, y, text, {
        fontSize: "32px",
        color: this.config.textColor,
        backgroundColor: "#222222",
        padding: { x: 30, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(101);

    button.on("pointerdown", callback, this);
    button.on("pointerover", () =>
      button
        .setBackgroundColor(this.config.highlightColor as string)
        .setColor("#000000")
    );
    button.on("pointerout", () =>
      button
        .setBackgroundColor("#222222")
        .setColor(this.config.textColor as string)
    );

    return button;
  }
}
