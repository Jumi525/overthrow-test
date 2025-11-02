// src/scenes/GameOverScene.ts

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(data: { score: number; win: boolean }): void {
    this.cameras.main.setBackgroundColor(data.win ? "#051005" : "#100505"); // Green or Red background tone

    const statusText = data.win ? "MISSION ACCOMPLISHED" : "MISSION FAILED";
    const color = data.win ? "#00ff00" : "#ff0000";
    // --- FIX: Define the numeric color required for the postFX glow ---
    // Remove the '#' prefix and parse the string as a hexadecimal number
    const colorNumeric = parseInt(color.substring(1), 16);

    // --- 1. Game Status Text with Glow ---
    const titleText = this.add
      .text(this.scale.width / 2, this.scale.height * 0.3, statusText, {
        fontFamily: "Electrolize, Arial",
        fontSize: "70px",
        color: color,
      })
      .setOrigin(0.5);

    // Apply PostFX Glow
    if (this.game.renderer.type === Phaser.WEBGL) {
      titleText.postFX.addGlow(colorNumeric, 0, 0, false, 0.1, 32);
    }

    // --- 2. Final Score Display ---
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height * 0.45,
        `SCORE: ${data.score}`,
        {
          fontFamily: "Electrolize, Arial",
          fontSize: "40px",
          color: "#ffffff",
        }
      )
      .setOrigin(0.5);

    // --- 3. Play Again Button (Eye-Catching Element) ---
    const retryButton = this.add
      .text(this.scale.width / 2, this.scale.height * 0.7, "RESTART", {
        fontFamily: "Electrolize, Arial",
        fontSize: "40px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setInteractive();

    // Button Interaction Logic (similar to MenuScene)
    retryButton.on("pointerover", () => retryButton.setColor("#00ffff"));
    retryButton.on("pointerout", () => retryButton.setColor("#ffffff"));

    retryButton.on("pointerdown", () => {
      // Feature 9: The "Play Again" button resets the game state
      this.cameras.main.fadeOut(300);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          // Must stop the UIScene before restarting GameScene
          this.scene.stop("UIScene");
          this.scene.start("GameScene");
        }
      );
    });
  }
}
