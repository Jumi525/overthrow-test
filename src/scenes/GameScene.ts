// src/scenes/GameScene.ts
import Phaser from "phaser";
import Player from "../classes/Player";
import DestructibleObject from "../classes/DestructibleObject";
import { CombatText, type CombatTextType } from "../classes/CombatText";
import { OffScreenIndicator } from "../classes/OffScreenIndicator";
import { Enemy, type StatusEffect } from "../classes/Enemy";
import Powerup from "../classes/PowerUp";
import { HealthBar } from "../classes/HealthBar";
import { Projectile } from "../classes/Projectile";
import { Upgrade } from "../classes/upgrade";

interface ProjectileHitEvent {
  projectile: Projectile;
  enemy: Phaser.GameObjects.GameObject;
  damage: number;
  effect: StatusEffect | null;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private projectiles!: Phaser.GameObjects.Group;
  private enemies!: Phaser.GameObjects.Group;
  private destructibles!: Phaser.GameObjects.Group;
  private powerups!: Phaser.GameObjects.Group;
  private indicators!: OffScreenIndicator[];
  private upgradeGroup!: Phaser.GameObjects.Group;
  // private barrel!: DestructibleObject;

  private spawnTimer: number = 0;
  private spawnInterval: number = 4000; // 4 seconds between enemy spawns

  constructor() {
    super("GameScene");
  }

  preload(): void {
    // Assets are assumed to be fully preloaded in the BootScene.
    // We leave this empty to prevent redundant loading.
  }

  create(): void {
    // --- WORLD SETUP ---
    this.physics.world.setBounds(0, 0, 1920, 1080);
    this.cameras.main.setBounds(0, 0, 1920, 1080); // --- BACKGROUND ---

    this.createBackground(); // --- PLAYER --- // Using the asset key 'player' (e.g., loaded from spritesheets/player.png)

    this.player = new Player(this, 400, 300, "player_idle");
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.scene.launch("UIScene"); // show UI overlay // --- GROUPS ---

    this.enemies = this.add.group({
      classType: Enemy,
      runChildUpdate: true, // so preUpdate() runs
      maxSize: 20,
    });
    this.destructibles = this.add.group({
      classType: DestructibleObject,
      runChildUpdate: true, // so preUpdate() runs
      maxSize: 20,
    }); // This group uses Phaser.Physics.Arcade.Group for physics operations

    this.powerups = this.physics.add.group({
      classType: Powerup,
      runChildUpdate: true,
      maxSize: 10,
    });

    this.indicators = [];
    this.upgradeGroup = this.physics.add.group({ classType: Upgrade });
    this.projectiles = this.physics.add.group({
      classType: Projectile,
      runChildUpdate: true, // so preUpdate() runs
      maxSize: 20,
    });

    setInterval(() => {
      this.spawnTimedPowerup(5000, "health");
    }, 10000); // spawn a new powerup every 10 seconds // --- INITIAL OBJECTS ---

    this.spawnInitialDestructibles();
    this.spawnEnemyWave(); // --- COLLISIONS ---

    this.physics.add.collider(this.player, this.destructibles);
    this.physics.add.collider(this.enemies, this.destructibles);
    this.physics.add.collider(this.enemies, this.enemies); // --- CAMERA FX ---

    this.cameras.main.fadeIn(500, 0, 0, 0); // --- EVENTS ---

    this.events.on("playerAttack", this.handlePlayerAttack, this);
    this.events.on("updateHealth", this.handleHealthUpdate, this);

    this.events.on("projectileHit", (event: ProjectileHitEvent) => {
      console.log("Hit enemy for", event.damage, "damage");
      (event.enemy as Enemy).takeDamage(event.damage);
      (event.enemy as Enemy).applyStatusEffect({
        type: "burn",
        duration: 1500,
        power: 2,
      });
    });

    this.events.on("projectileDeactivated", (proj: Projectile) => {
      console.log("Projectile deactivated");
    }); // Player collects powerup

    this.physics.add.overlap(this.player, this.powerups, (player, powerup) => {
      const p = powerup as Powerup;
      (player as Player).collectPowerup(p);
    }); // Player collects upgrade

    this.physics.add.overlap(
      this.player,
      this.upgradeGroup,
      (player, upgrade) => {
        const p = player as Player;
        const u = upgrade as Upgrade;
        console.log(u.type, "upgrade");
        p.applyUpgrade(u.type);
        u.destroy();
      }
    ); // Projectile hits enemy

    this.physics.add.overlap(this.projectiles, this.enemies, (proj, enemy) => {
      if (!(proj instanceof Projectile)) return;

      const p = proj as Projectile;
      const e = enemy as Enemy;

      p.handleHit(e); // Apply stun effect to this enemy

      e.applyStatusEffect({ type: "stun", duration: 1500, power: 2 });
    }); // Player overlaps with enemy (Melee/Contact Damage)

    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      // Call the Player's method to handle contact
      (player as Player).onEnemyHit(enemy as Enemy); // Optionally apply damage to the enemy

      (enemy as Enemy).takeDamage(2);
    }); // This is a duplicate overlap check for damage, keeping the original logic for reference

    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      // Cast player to Player class
      (player as Player).takeDamage(2);
    });
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta); // Spawn enemies periodically

    this.spawnTimer += delta;
    if (this.spawnTimer > this.spawnInterval) {
      this.spawnEnemyWave();
      this.spawnTimer = 0;
    } // Update offscreen indicators

    this.indicators.forEach((indicator) => indicator.update());
  } // --------------------------- // BACKGROUND METHOD // ---------------------------

  private createBackground(): void {
    // Uses the asset key 'background'
    const bg = this.add.image(0, 0, "background").setOrigin(0, 0); // This ensures the background covers the entire game world (1920x1080)

    bg.displayWidth = 1920;
    bg.displayHeight = 1080;
  } // --------------------------- // SPAWNING & MANAGEMENT LOGIC // ---------------------------

  private spawnEnemyWave(): void {
    const spawnCount = Phaser.Math.Between(2, 5);
    for (let i = 0; i < spawnCount; i++) {
      const x = Phaser.Math.Between(100, 1820);
      const y = Phaser.Math.Between(100, 980); // Create an Enemy instance using the new key 'enemy_asset'

      const enemy = new Enemy(this, x, y, "player1_run", this.player); // Add enemy to the enemies group

      this.enemies.add(enemy); // Add off-screen indicator // Uses the asset key 'indicator'

      const indicator = new OffScreenIndicator(this, enemy, "indicator", {
        margin: 30,
        color: 0xff0000,
        scale: 0.9,
      });
      this.indicators.push(indicator);
    }
  }

  private spawnInitialDestructibles(): void {
    const positions = [
      { x: 600, y: 400 },
      { x: 900, y: 300 },
      { x: 1200, y: 500 },
    ];

    positions.forEach((pos) => {
      // Creates a DestructibleObject using the 'barrel' asset key
      const barrel = new DestructibleObject(this, pos.x, pos.y, "barrel");
      this.destructibles.add(barrel);
    });
  } /** Spawn a single powerup that appears for `displayTime` ms at a random position */

  public spawnTimedPowerup(displayTime: number, type: string): void {
    // Get an inactive powerup from the pool
    // Note: The Powerup class will use the 'powerup' asset key internally.
    const powerup = this.powerups.get(0, 0) as Powerup;

    if (!powerup) {
      console.warn("No available powerup in pool!");
      return;
    } // Set random position

    const x = Phaser.Math.Between(100, 1820);
    const y = Phaser.Math.Between(100, 980); // Activate the powerup

    powerup.activate(x, y, type); // Automatically deactivate after `displayTime` milliseconds

    setTimeout(() => {
      if (powerup.active) {
        powerup.deactivate();
      }
    }, displayTime);
  } // --------------------------- // COMBAT FEEDBACK // ---------------------------

  public showDamageText(x: number, y: number, amount: number): void {
    const value = (amount > 20 ? "critical" : "burn") as CombatTextType;
    new CombatText(this, x, y, amount, value);
  }

  public attachHealthBar(
    target: Phaser.GameObjects.Sprite,
    maxHealth: number
  ): HealthBar {
    return new HealthBar(this, target.x, target.y, maxHealth);
  }

  private handlePlayerAttack({
    x,
    y,
    dir,
  }: {
    x: number;
    y: number;
    dir: Phaser.Math.Vector2;
  }): void {
    // Create a small attack hitbox in front of the player
    const hitboxRange = 60;
    const hitbox = new Phaser.Geom.Circle(
      x + dir.x * hitboxRange,
      y + dir.y * hitboxRange,
      40
    ); // Check collisions with enemies

    this.enemies.getChildren().forEach((enemy: any) => {
      if (Phaser.Geom.Intersects.CircleToRectangle(hitbox, enemy.getBounds())) {
        enemy.takeDamage?.(Phaser.Math.Between(10, 25));
        enemy.applyStatusEffect({ type: "burn", duration: 1500, power: 2 });
        this.showDamageText(enemy.x, enemy.y - 40, Phaser.Math.Between(10, 25));
      }
    });
  }

  private handleHealthUpdate(currentHealth: number): void {
    console.log("Health updated:", currentHealth);
    this.attachHealthBar(this.player, currentHealth).update();
  }
}
