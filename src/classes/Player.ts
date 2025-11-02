// src/classes/Player.ts
import Phaser from "phaser";
import type { Enemy } from "./Enemy";
import type Powerup from "./PowerUp";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  // --- Core Movement ---
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private speed = 200;
  private moveDir = new Phaser.Math.Vector2(); // --- Dash System ---

  private canDash = true;
  private isDashing = false;
  private dashSpeed = 600;
  private dashDuration = 200; // ms
  private dashCooldown = 800; // ms
  private dashTime = 0;
  private dashEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private invulnerable = false; // --- Combat System ---

  private attackKey: Phaser.Input.Keyboard.Key;
  private attackCooldown = 400;
  private lastAttackTime = 0;
  private attackDamage = 5; // --- Special Attack ---

  private specialKey: Phaser.Input.Keyboard.Key;
  private specialCharge = 0;
  private specialCost = 50; // --- Combo System ---

  private comboCount = 0;
  private comboTimer = 0;
  private comboTimeout = 3000; // ms
  private comboMultiplier = 1; // --- Player Stats & Health ---

  public playerHealth = 100;
  public maxHealth = 100;
  public currency = 0;
  public playerStats = {
    damageLevel: 1,
    speedLevel: 1,
    maxHealthLevel: 1,
  }; // --- References ---

  private sceneRef: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, texture = "player") {
    super(scene, x, y, texture);
    this.sceneRef = scene; // Add to scene & enable physics

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true); // Set initial animation state (assuming 'player_idle' animation is created)

    this.play("player_idle"); // Input setup

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.attackKey = scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.specialKey = scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SHIFT
    ); // Dash particles (optional)

    this.dashEmitter = scene.add.particles(0, 0, "flares", {
      frame: "white",
      lifespan: 200,
      speed: { min: 100, max: 200 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 }, // on: false,
    }) as Phaser.GameObjects.Particles.ParticleEmitter;

    this.setDepth(10);
  } // ====================== // MAIN UPDATE LOOP // ======================

  public update(time: number, delta: number): void {
    if (!this.active) return;
    this.handleMovement();
    this.handleAttack(time);
    this.handleDash(time);
    this.updateComboTimer(delta);
  } // ====================== // MOVEMENT & ANIMATION LOGIC // ======================

  private handleMovement(): void {
    if (this.isDashing) return;

    this.moveDir.set(0, 0);
    if (this.cursors.left?.isDown) this.moveDir.x = -1;
    if (this.cursors.right?.isDown) this.moveDir.x = 1;
    if (this.cursors.up?.isDown) this.moveDir.y = -1;
    if (this.cursors.down?.isDown) this.moveDir.y = 1;
    this.moveDir.normalize();

    this.setVelocity(this.moveDir.x * this.speed, this.moveDir.y * this.speed);

    if (this.moveDir.lengthSq() > 0) {
      this.setRotation(Math.atan2(this.moveDir.y, this.moveDir.x)); // Player is moving, play the running animation
      if (this.anims.currentAnim?.key !== "player_run*") {
        this.play("player_run");
      }
    } else {
      // Player is stationary, play the idle animation
      if (this.anims.currentAnim?.key !== "player_idle") {
        this.play("player_idle");
      }
    }
  } // ====================== // DASH SYSTEM // ======================

  private handleDash(time: number): void {
    const justPressed = Phaser.Input.Keyboard.JustDown(this.specialKey);

    if (justPressed && this.canDash && !this.isDashing) {
      this.startDash(time);
    }

    if (this.isDashing && time > this.dashTime + this.dashDuration) {
      this.endDash();
    }
  }

  private startDash(time: number): void {
    this.isDashing = true;
    this.canDash = false;
    this.invulnerable = true;
    this.dashTime = time;

    const dashDir = this.moveDir.clone().normalize();
    if (dashDir.lengthSq() === 0) dashDir.set(1, 0);

    this.setVelocity(dashDir.x * this.dashSpeed, dashDir.y * this.dashSpeed);
    this.setAlpha(0.6);

    this.sceneRef.time.delayedCall(this.dashDuration, () => this.endDash());
    this.sceneRef.time.delayedCall(
      this.dashCooldown,
      () => (this.canDash = true)
    );

    if (this.dashEmitter) {
      this.dashEmitter.startFollow(this);
      this.dashEmitter.explode(10, this.x, this.y);
    }
  }

  private endDash(): void {
    this.isDashing = false;
    this.invulnerable = false;
    this.setAlpha(1);
    this.setVelocity(0, 0);
  } // ====================== // COMBAT SYSTEM // ======================

  private handleAttack(time: number): void {
    if (
      Phaser.Input.Keyboard.JustDown(this.attackKey) &&
      time > this.lastAttackTime + this.attackCooldown
    ) {
      this.lastAttackTime = time; // Fire projectile or perform melee swing
      this.sceneRef.events.emit("playerAttack", {
        x: this.x,
        y: this.y,
        dir: this.moveDir,
      });
    }
  }

  public onEnemyHit(enemy: Enemy): void {
    this.comboCount++;
    this.comboTimer = this.comboTimeout;
    this.specialCharge = Math.min(100, this.specialCharge + 10);
    this.currency += 5 * this.getComboMultiplier(); // Floating text feedback

    this.showFloatingText("+" + 5 * this.getComboMultiplier(), "#ffff00");
  }

  private breakCombo(): void {
    this.comboCount = 0;
    this.comboMultiplier = 1;
  }

  private getComboMultiplier(): number {
    if (this.comboCount >= 20) return 3;
    if (this.comboCount >= 10) return 2;
    return 1;
  }

  private updateComboTimer(delta: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.breakCombo();
      }
    }
  } // ====================== // DAMAGE & HEALTH // ======================

  public takeDamage(amount: number): void {
    if (this.invulnerable || !this.active) return;

    this.playerHealth -= amount;
    if (this.playerHealth <= 0) {
      this.playerHealth = 0;
      this.die();
      return;
    } // Tint & shake feedback

    this.setTint(0xff0000);
    this.sceneRef.tweens.add({
      targets: this,
      tint: 0xffffff,
      duration: 300,
      ease: "Sine.easeInOut",
    });

    this.sceneRef.events.emit("updateHealth", this.playerHealth);
  }

  private die(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    this.sceneRef.time.delayedCall(2000, () => this.respawn());
  }

  private respawn(): void {
    this.playerHealth = this.maxHealth;
    this.clearTint();
    this.setActive(true);
    this.setVisible(true);
    this.x = this.sceneRef.scale.width / 2;
    this.y = this.sceneRef.scale.height / 2;
    this.sceneRef.events.emit("updateHealth", this.playerHealth);
    this.play("player_idle"); // Reset animation
  } // ====================== // POWERUPS // ======================

  public collectPowerup(powerup: Powerup): void {
    switch (powerup.type) {
      case "speed":
        this.applySpeedBoost();
        break;
      case "health":
        this.heal(30);
        break;
      case "fire":
        this.attackDamage += 2;
        break;
    }

    powerup.destroy();
  }

  private applySpeedBoost(): void {
    const originalSpeed = this.speed;
    this.speed += 100;
    this.sceneRef.time.delayedCall(5000, () => (this.speed = originalSpeed));
  }

  private heal(amount: number): void {
    this.playerHealth = Math.min(this.maxHealth, this.playerHealth + amount);
    this.sceneRef.events.emit("updateHealth", this.playerHealth);
    this.showFloatingText("HEAL +30", "#00ff00");
  } // ====================== // UPGRADES // ======================

  public applyUpgrade(type: string): void {
    switch (type) {
      case "damage":
        this.playerStats.damageLevel++;
        this.attackDamage += 2;
        break;
      case "speed":
        this.playerStats.speedLevel++;
        this.speed += 20;
        break;
      case "health":
        this.playerStats.maxHealthLevel++;
        this.maxHealth += 20;
        this.playerHealth = this.maxHealth;
        break;
    }

    this.showFloatingText(`UPGRADED ${type.toUpperCase()}!`, "#00ffff");
  } // ====================== // VISUAL FEEDBACK // ======================

  private showFloatingText(text: string, color = "#ffffff"): void {
    const txt = this.sceneRef.add
      .text(this.x, this.y - 30, text, {
        fontFamily: "Arial",
        fontSize: "16px",
        color,
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.sceneRef.tweens.add({
      targets: txt,
      y: txt.y - 30,
      alpha: 0,
      duration: 800,
      ease: "Sine.easeOut",
      onComplete: () => txt.destroy(),
    });
  }
}
