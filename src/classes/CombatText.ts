// src/classes/CombatText.ts
import Phaser from "phaser";

export type CombatTextType =
  | "normal"
  | "critical"
  | "heal"
  | "burn"
  | "poison"
  | "stun";

export class CombatText extends Phaser.GameObjects.Text {
  private floatDistance: number = 60;
  private floatDuration: number = 900;
  private fadeDuration: number = 700;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    value: number | string,
    type: CombatTextType = "normal"
  ) {
    const { text, color } = CombatText.resolveTextAndColor(value, type);

    super(scene, x, y, text, {
      fontFamily: "Electrolize, Arial",
      fontSize: "28px",
      color,
      stroke: "#000000",
      strokeThickness: 4,
      align: "center",
      shadow: { offsetX: 2, offsetY: 2, fill: true, color: "#000000" },
    });

    scene.add.existing(this);
    this.setOrigin(0.5);
    this.setDepth(200); // Always above most objects

    // Add slight random offset for natural variation
    this.x += Phaser.Math.Between(-10, 10);
    this.y += Phaser.Math.Between(-10, 10);

    // Apply initial pop scale
    this.scene.tweens.add({
      targets: this,
      scale: 1.3,
      duration: 120,
      yoyo: true,
      ease: "Sine.easeOut",
    });

    // Float & fade away
    this.scene.tweens.add({
      targets: this,
      y: this.y - this.floatDistance,
      alpha: 0,
      duration: this.floatDuration,
      ease: "Cubic.easeOut",
      delay: Phaser.Math.Between(0, 50),
      onComplete: () => this.destroy(),
    });
  }

  public static show(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.Sprite | { x: number; y: number },
    value: number | string,
    type: CombatTextType = "normal"
  ): void {
    const posX = "x" in target ? target.x : 0;
    const posY = "y" in target ? target.y : 0;
    new CombatText(scene, posX, posY - 40, value, type);
  }

  private static resolveTextAndColor(
    value: number | string,
    type: CombatTextType
  ): { text: string; color: string } {
    switch (type) {
      case "critical":
        return { text: `-${value}!`, color: "#FF2E2E" };
      case "heal":
        return { text: `+${value}`, color: "#00FF88" };
      case "burn":
        return { text: `-${value}`, color: "#FF6F00" };
      case "poison":
        return { text: `-${value}`, color: "#9B59B6" };
      case "stun":
        return { text: "STUN!", color: "#FFD700" };
      default:
        return { text: `-${value}`, color: "#FFFFFF" };
    }
  }
}
