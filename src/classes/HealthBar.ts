// export class HealthBar {
//   private bar: Phaser.GameObjects.Graphics;
//   private x: number;
//   private y: number;
//   private width: number = 200;
//   private height: number = 20;
//   private maxValue: number = 100;
//   private currentValue: number;

//   constructor(scene: Phaser.Scene, x: number, y: number, maxValue: number) {
//     this.bar = new Phaser.GameObjects.Graphics(scene);
//     this.x = x;
//     this.y = y;
//     this.maxValue = maxValue;
//     this.currentValue = maxValue;

//     // Add the bar to the scene
//     scene.add.existing(this.bar);

//     // Initial draw
//     this.draw();
//   }

//   private draw(): void {
//     this.bar.clear();

//     // 1. Draw Background (Black/Dark Gray Frame)
//     this.bar.fillStyle(0x111111, 0.8);
//     this.bar.fillRect(this.x, this.y, this.width, this.height);

//     // 2. Draw Frame Border (Neon Cyan)
//     this.bar.lineStyle(2, 0x00ffff, 1);
//     this.bar.strokeRect(
//       this.x - 1,
//       this.y - 1,
//       this.width + 2,
//       this.height + 2
//     );

//     // 3. Draw Health Value (The moving bar)
//     const healthPercent = this.currentValue / this.maxValue;
//     const healthWidth = Math.floor(this.width * healthPercent);

//     let color = 0x00ff00; // Green
//     if (healthPercent < 0.5) color = 0xffa500; // Orange
//     if (healthPercent < 0.25) color = 0xff0000; // Red

//     this.bar.fillStyle(color, 1);
//     this.bar.fillRect(this.x, this.y, healthWidth, this.height);

//     // 4. Draw Inner Glare/Sophistication (optional)
//     this.bar.fillStyle(0xffffff, 0.2);
//     this.bar.fillRect(this.x, this.y, healthWidth, this.height / 3);
//   }

//   public update(health: number): void {
//     this.currentValue = health;
//     this.draw();
//   }
// }

import Phaser from "phaser";

/**
 * HealthBar
 * ----------
 * A reusable, self-contained health bar that:
 * - Smoothly animates between health values
 * - Follows a target sprite automatically
 * - Changes color and flashes at low health
 * - Cleans itself up when its target is destroyed
 */

interface HealthBarOptions {
  width?: number;
  height?: number;
  fillColor?: number;
  backgroundColor?: number;
  lowHealthFlash?: boolean;
  followTarget?: Phaser.GameObjects.Sprite;
  offsetY?: number;
  smooth?: boolean; // smooth animation when health changes
}

export class HealthBar {
  private scene: Phaser.Scene;
  private bar: Phaser.GameObjects.Graphics;
  private followTarget?: Phaser.GameObjects.Sprite;
  private offsetY: number = -40;

  private width: number = 200;
  private height: number = 20;
  private maxValue: number;
  private currentValue: number;

  private flashTween?: Phaser.Tweens.Tween;
  private lowHealthThreshold: number = 0.25; // 25%
  private isFlashing: boolean = false;
  private fillColor: number;
  private backgroundColor: number;

  private smooth: boolean;
  private smoothTween?: Phaser.Tweens.Tween;

  // constructor(
  //   scene: Phaser.Scene,
  //   x: number,
  //   y: number,
  //   maxValue: number,
  //   options?: { width?: number; height?: number; lowHealthFlash?: boolean }
  // ) {
  //   this.scene = scene;
  //   this.maxValue = maxValue;
  //   this.currentValue = maxValue;
  //   this.width = options?.width ?? 200;
  //   this.height = options?.height ?? 20;
  //   this.lowHealthThreshold = options?.lowHealthFlash ? 0.25 : 0;

  //   this.bar = new Phaser.GameObjects.Graphics(scene);
  //   this.bar.setPosition(x, y);
  //   scene.add.existing(this.bar);

  //   this.draw();
  // }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    maxValue: number,
    options?: HealthBarOptions
  ) {
    this.scene = scene;
    this.maxValue = maxValue;
    this.currentValue = maxValue;

    // Defaults + overrides
    this.width = options?.width ?? 200;
    this.height = options?.height ?? 20;
    this.fillColor = options?.fillColor ?? 0x00ff00;
    this.backgroundColor = options?.backgroundColor ?? 0x222222;
    this.lowHealthThreshold = options?.lowHealthFlash ? 0.25 : 0;
    this.followTarget = options?.followTarget;
    this.offsetY = options?.offsetY ?? -40;
    this.smooth = options?.smooth ?? false;

    // Create graphics object
    this.bar = new Phaser.GameObjects.Graphics(scene);
    this.bar.setPosition(x, y);
    this.bar.setScrollFactor(0);
    scene.add.existing(this.bar);

    this.draw();
  }

  /**
   * Make the health bar follow a specific sprite.
   * @param target - The target sprite or game object
   * @param offsetY - Optional vertical offset (default: -40)
   */
  public follow(
    target: Phaser.GameObjects.Sprite,
    offsetY: number = -40
  ): void {
    this.followTarget = target;
    this.offsetY = offsetY;

    // Auto-destroy bar when target is removed
    target.on("destroy", () => this.destroy());
  }

  /**
   * Set new health and animate towards it smoothly.
   * @param newValue - New health value (0–max)
   */
  public setHealth(newValue: number): void {
    const clamped = Phaser.Math.Clamp(newValue, 0, this.maxValue);

    // Cancel existing tween if any
    if (this.flashTween) this.flashTween.stop();

    // Smooth transition
    this.scene.tweens.addCounter({
      from: this.currentValue,
      to: clamped,
      duration: 300,
      ease: "Sine.easeOut",
      onUpdate: (tween) => {
        this.currentValue = tween.getValue() as number;
        this.draw();
      },
      onComplete: () => {
        if (this.getPercent() < this.lowHealthThreshold) {
          this.startLowHealthFlash();
        } else {
          this.stopLowHealthFlash();
        }
      },
    });
  }

  /**
   * Called every frame (from GameScene.update)
   * Keeps the bar aligned to its target.
   */
  public update(): void {
    if (!this.followTarget) return;

    const target = this.followTarget;
    this.bar.setPosition(target.x - this.width / 2, target.y + this.offsetY);
  }

  /**
   * Internal drawing logic.
   */
  private draw(): void {
    this.bar.clear();

    // Draw background frame
    this.bar.fillStyle(0x111111, 0.8);
    this.bar.fillRect(0, 0, this.width, this.height);

    // Draw border
    this.bar.lineStyle(2, 0x00ffff, 1);
    this.bar.strokeRect(-1, -1, this.width + 2, this.height + 2);

    // Health percentage
    const percent = this.getPercent();
    const healthWidth = Math.floor(this.width * percent);

    // Color transitions
    let color = 0x00ff00; // Green
    if (percent < 0.5) color = 0xffa500; // Orange
    if (percent < 0.25) color = 0xff0000; // Red

    // Fill health
    this.bar.fillStyle(color, 1);
    this.bar.fillRect(0, 0, healthWidth, this.height);

    // Glare effect (optional polish)
    this.bar.fillStyle(0xffffff, 0.2);
    this.bar.fillRect(0, 0, healthWidth, this.height / 3);
  }

  /**
   * Get health ratio (0–1).
   */
  private getPercent(): number {
    return this.currentValue / this.maxValue;
  }

  /**
   * Flash red when in critical health.
   */
  private startLowHealthFlash(): void {
    if (this.isFlashing) return;

    this.isFlashing = true;
    this.flashTween = this.scene.tweens.add({
      targets: this.bar,
      alpha: { from: 1, to: 0.5 },
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
  }

  private stopLowHealthFlash(): void {
    if (this.flashTween) {
      this.flashTween.stop();
      this.bar.setAlpha(1);
    }
    this.isFlashing = false;
  }

  /**
   * Hide or show the bar.
   */
  public setVisible(visible: boolean): void {
    this.bar.setVisible(visible);
  }

  /**
   * Clean up resources.
   */
  public destroy(): void {
    this.stopLowHealthFlash();
    this.bar.destroy();
  }
}
