// src/classes/Enemy.ts
import Phaser from "phaser";
import { HealthBar } from "./HealthBar";

export interface StatusEffect {
  type: "slow" | "burn" | "stun";
  duration: number; // milliseconds
  power?: number; // effect strength (e.g., slow %, damage per tick)
  startTime: number;
}

/**
 * Enemy class - autonomous AI-driven enemy with health, effects, and visuals
 */
export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private target: Phaser.Physics.Arcade.Sprite;
  private baseSpeed: number = 100;
  private moveSpeed: number = this.baseSpeed;
  private followRange: number = 300;

  private maxHealth: number = 10;
  private currentHealth: number = this.maxHealth;

  private isStunned: boolean = false;
  private activeEffects: StatusEffect[] = [];

  private hitEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private healthBar: HealthBar;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    target: Phaser.Physics.Arcade.Sprite,
    frame?: string | number
  ) {
    super(scene, x, y, texture, frame); // Add to scene + physics

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setBodySize(this.width * 0.7, this.height * 0.7);

    this.target = target;
    this.currentHealth = this.maxHealth; // Set initial animation state (assuming 'enemy_idle' animation is created) // This animation key must be defined in your BootScene

    this.play("player1_idle"); // --- Health bar (reusable global HealthBar class)

    this.healthBar = new HealthBar(scene, this.x, this.y - 20, this.maxHealth, {
      width: 32,
      height: 4,
      fillColor: 0xff5555,
      backgroundColor: 0x333333,
      followTarget: this, // bar will auto-follow
      offsetY: -20,
      smooth: true,
    }); // --- Hit particles

    this.hitEmitter = this.scene.add.particles(this.x, this.y, "hit_particle", {
      follow: this,
      speed: { min: 80, max: 200 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 300,
      quantity: 3,
      frequency: -1,
      blendMode: "ADD",
      active: true,
    }); // We can remove the redundant play here since we set the initial one above // if (this.anims.exists("enemy_charge")) { //   this.play("enemy_charge"); // }
  }
  /**
   * Update - movement and AI loop, with animation logic added
   */

  public update(): void {
    if (!this.active || this.isStunned) {
      this.setVelocity(0, 0); // Ensure enemy idles when stunned or inactive
      if (this.anims.currentAnim?.key !== "player1_idle") {
        this.play("player1_idle");
      }
      return;
    }

    const distance = Phaser.Math.Distance.BetweenPoints(this, this.target);

    if (distance < this.followRange) {
      this.scene.physics.moveToObject(this, this.target, this.moveSpeed);
      this.setFlipX(this.body!.velocity.x < 0); // Play running animation

      if (this.anims.currentAnim?.key !== "player1_run") {
        this.play("player1_run");
      }
    } else {
      this.setVelocity(0, 0); // Play idle animation
      if (this.anims.currentAnim?.key !== "player1_idle") {
        this.play("player1_idle");
      }
    }
  }
  /**
   * Called each frame — processes status effects & updates visuals
   */

  public preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta); // Update effects

    this.updateStatusEffects(time); // Bar follows automatically via HealthBar internals
  }
  /**
   * Handle taking damage — triggers visual, particles, and health bar updates
   */

  public takeDamage(amount: number): void {
    if (!this.active) return;

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.healthBar.setHealth(this.currentHealth); // Visual feedback

    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => this.clearTint());
    this.hitEmitter.explode(Math.min(6, amount * 0.6));

    if (amount >= 10) this.scene.cameras.main.shake(100, 0.004);

    if (this.currentHealth <= 0) this.die();
  }
  /**
   * Apply a timed status effect (burn, slow, stun)
   */

  public applyStatusEffect(effect: Omit<StatusEffect, "startTime">): void {
    const now = this.scene.time.now; // Find an existing effect of the same type
    const existing = this.activeEffects.find((e) => e.type === effect.type);

    if (existing) {
      // Refresh duration
      existing.duration = effect.duration;
      existing.startTime = now;
    } else {
      // Add new effect
      this.activeEffects.push({ ...effect, startTime: now });
    }

    this.setEffectTint(effect.type);
  }
  /**
   * Update active status effects
   */

  private updateStatusEffects(time: number): void {
    if (this.activeEffects.length === 0) return;

    this.isStunned = false;
    this.moveSpeed = this.baseSpeed; // Filter out expired effects and apply active effects

    this.activeEffects = this.activeEffects.filter((effect) => {
      const elapsed = time - effect.startTime;
      const expired = elapsed >= effect.duration;

      if (!expired) {
        switch (effect.type) {
          case "burn": // Apply burn damage periodically (e.g., every 600ms)
            if (
              elapsed > 0 &&
              Math.floor(elapsed / 600) !==
                Math.floor((elapsed - this.scene.game.loop.delta) / 600)
            ) {
              this.takeDamage(effect.power || 1);
            }
            break;
          case "slow": // Apply speed reduction
            this.moveSpeed = this.baseSpeed * (1 - (effect.power || 0.4));
            break;
          case "stun": // Stop movement
            this.isStunned = true;
            break;
        }
      }

      return !expired;
    }); // Clear tint when no effects remain and the sprite hasn't been re-tinted by damage

    if (this.activeEffects.length === 0 && this.tintTopLeft === 0xffffff) {
      this.clearTint();
    }
  }
  /**
   * Visual feedback for different effects
   */

  private setEffectTint(type: StatusEffect["type"]): void {
    const tints: Record<StatusEffect["type"], number> = {
      slow: 0x00bfff, // Light Blue
      burn: 0xff6600, // Orange
      stun: 0xffff33, // Yellow
    };
    this.setTint(tints[type]);
  }
  /**
   * Handles enemy death and cleanup
   */

  private die(): void {
    this.setActive(false);
    this.setVisible(false);
    this.body!.checkCollision.none = true;
    this.setVelocity(0, 0);

    this.createExplosionFragments();
    this.hitEmitter.stop();

    this.scene.events.emit("enemyDefeated", this);

    this.scene.time.delayedCall(200, () => {
      this.destroy();
    });
  }
  /**
   * Create a short explosion animation from small fragments
   */

  private createExplosionFragments(): void {
    const fragmentCount = 6;
    const speed = 150;
    const duration = 500;

    for (let i = 0; i < fragmentCount; i++) {
      const fragment = this.scene.add.rectangle(this.x, this.y, 8, 8, 0xffaa00);
      this.scene.physics.add.existing(fragment);
      const body = fragment.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);

      const angle = Phaser.Math.DegToRad(
        i * (360 / fragmentCount) + Phaser.Math.Between(-20, 20)
      );

      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

      this.scene.tweens.add({
        targets: fragment,
        alpha: 0,
        scale: 0.1,
        duration,
        ease: "Cubic.easeOut",
        onComplete: () => fragment.destroy(),
      });
    }
  }
  /**
   * Proper cleanup of attached resources
   */

  public destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
    this.healthBar.destroy();
    this.hitEmitter.destroy();
  }
}
