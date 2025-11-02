import Phaser from "phaser";
import type { GameScene } from "../scenes/GameScene";
import { HealthBar } from "./HealthBar";

/**
 * Phase 3 — Fully Autonomous Destructible Object
 * ----------------------------------------------
 * Features:
 * - Integrated universal HealthBar
 * - Flash feedback on damage
 * - Optional explosion particles / sound
 * - 20% power-up drop chance (triggered internally)
 * - Auto cleanup on destruction
 * - Scene-agnostic, plug into GameScene via collision
 */
export default class DestructibleObject extends Phaser.Physics.Arcade.Sprite {
  private currentHealth: number;
  private maxHealth: number;
  private healthBar: HealthBar;
  private isDestroyed: boolean = false;

  private flashTween?: Phaser.Tweens.Tween;
  private flashDuration: number = 120;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string = "barrel",
    health: number = 50
  ) {
    super(scene, x, y, texture);

    // --- Add physics + setup ---
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5);
    this.setImmovable(true);
    this.setCollideWorldBounds(true);

    // --- Health setup ---
    this.maxHealth = health;
    this.currentHealth = health;

    // --- Health bar (universal component) ---
    this.healthBar = new HealthBar(scene, x, y - 40, this.maxHealth, {
      width: 60,
      height: 8,
      lowHealthFlash: true,
      followTarget: this,
    });

    // --- Optional idle animation / bounce ---
    this.setAlpha(1);
  }

  /**
   * Called externally (e.g. when hit by projectile)
   */
  public takeDamage(amount: number): boolean {
    if (this.isDestroyed) return false;

    this.currentHealth = Phaser.Math.Clamp(
      this.currentHealth - amount,
      0,
      this.maxHealth
    );

    // Flash red feedback
    this.flashDamage();

    // Update universal health bar
    this.healthBar.update();

    if (this.currentHealth <= 0) {
      this.destroyObject();
      return true;
    }

    return false;
  }

  /**
   * Short red flash effect when taking damage
   */
  private flashDamage(): void {
    if (this.flashTween) this.flashTween.stop();

    this.setTintFill(0xff0000);
    this.flashTween = this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.4, to: 1 },
      duration: this.flashDuration,
      ease: "Linear",
      yoyo: true,
      onComplete: () => this.clearTint(),
    });
  }

  /**
   * Fully autonomous destruction sequence
   */
  private destroyObject(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // --- Optional: explosion particle effect ---
    const particles = this.scene.add.particles(0, 0, "explosionParticle", {
      x: this.x,
      y: this.y,
      speed: { min: -150, max: 150 },
      scale: { start: 0.5, end: 0 },
      lifespan: 600,
      quantity: 12,
      tint: 0xff6600,
      blendMode: "ADD",
    });
    this.scene.time.delayedCall(500, () => particles.destroy());

    // --- Optional: explosion sound ---
    if (this.scene.sound) this.scene.sound.play("explosion", { volume: 0.4 });

    // --- Power-up spawn chance ---
    if (Phaser.Math.RND.frac() < 0.2) {
      const gameScene = this.scene as GameScene;
      // if (gameScene.spawnPowerup) gameScene.spawnPowerup(this.x, this.y);
    }

    // --- Fade + cleanup ---
    this.scene.tweens.add({
      targets: [this, this.healthBar],
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.healthBar.destroy();
        this.destroy();
      },
    });
  }

  /**
   * Called every frame if needed
   */
  public preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.healthBar.update();
  }

  /**
   * Manual cleanup (safety for scene shutdown)
   */
  public destroy(fromScene?: boolean): void {
    this.healthBar?.destroy();
    super.destroy(fromScene);
  }
}
