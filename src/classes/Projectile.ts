// // src/classes/Projectile.ts
// import Phaser from "phaser";
// import type { GameScene } from "../scenes/GameScene";
// import type { StatusEffect } from "./Enemy";

// export class Projectile extends Phaser.Physics.Arcade.Sprite {
//   public damage: number = 0;
//   public type: string = "";
//   private moveSpeed: number = 400;
//   public statusEffect: StatusEffect | null = null;

//   constructor(
//     scene: Phaser.Scene,
//     x: number,
//     y: number,
//     texture: string,
//     frame?: string | number
//   ) {
//     super(scene, x, y, texture, frame);
//     this.setDepth(1);
//   }

//   public getPlayerProjectiles(): Phaser.Physics.Arcade.Group {
//     return this.getPlayerProjectiles();
//   }

//   public fire(
//     startX: number,
//     startY: number,
//     targetX: number,
//     targetY: number,
//     type: string
//   ): void {
//     this.body.reset(startX, startY);
//     this.setActive(true).setVisible(true);
//     this.body.enable = true;

//     this.type = type;
//     this.damage = type === "fireball" ? 20 : 15;
//     this.setTexture(type);

//     this.scene.physics.moveTo(this, targetX, targetY, this.moveSpeed);

//     const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
//     this.setRotation(angle);

//     this.scene.time.delayedCall(2000, () => this.deactivate(), [], this);
//   }

//   private deactivate(): void {
//     if (!this.active) return;
//     this.setActive(false).setVisible(false);
//     this.body.stop();
//     this.body.enable = false;

//     // Return to pool
//     (this.scene as GameScene).getPlayerProjectiles().killAndHide(this);
//   }

//   preUpdate(time: number, delta: number): void {
//     super.preUpdate(time, delta);

//     // Auto-deactivate when leaving the screen
//     const cameraBounds = this.scene.cameras.main.worldView;
//     if (
//       !Phaser.Geom.Intersects.RectangleToRectangle(
//         this.getBounds(),
//         cameraBounds
//       )
//     ) {
//       this.deactivate();
//     }
//   }
// }

// src/classes/Projectile.ts
import Phaser from "phaser";
import type { StatusEffect } from "./Enemy";

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 0;
  public type: string = "";
  public statusEffect: StatusEffect | null = null;
  private moveSpeed: number = 400;
  private lifetime: number = 2000; // ms before auto-deactivation

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, frame);

    // Add to scene but inactive by default
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(1);
    this.setActive(false).setVisible(false);
  }

  /** Fires the projectile towards a target position */
  public fire(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    type: string
  ): void {
    this.body!.reset(startX, startY);
    this.setActive(true).setVisible(true);
    this.body!.enable = true;

    this.type = type;
    this.damage = type === "fireball" ? 20 : 15;
    this.setTexture(type);
    this.body!.enable = true;

    // Move in direction of target
    this.scene.physics.moveTo(this, targetX, targetY, this.moveSpeed);

    // Rotate sprite to direction of travel
    const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
    this.setRotation(angle);

    // Lifetime timer (auto deactivate)
    this.scene.time.delayedCall(
      this.lifetime,
      () => this.deactivate(),
      [],
      this
    );
  }

  /** Called when projectile leaves the screen or expires */
  private deactivate(): void {
    if (!this.active) return;

    this.setActive(false).setVisible(false);
    this.body!.stop();
    this.body!.enable = false;

    // Emit event instead of directly killing/hiding
    this.scene.events.emit("projectileDeactivated", this);
  }

  /** Called when this projectile hits an enemy */
  public handleHit(enemy: Phaser.GameObjects.GameObject): void {
    // Emit event so GameScene can apply damage, effects, etc.
    this.scene.events.emit("projectileHit", {
      projectile: this,
      enemy,
      damage: this.damage,
      effect: this.statusEffect,
    });

    this.deactivate(); // Deactivate after hit
  }

  /** Runs automatically each frame */
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    // Auto-deactivate when leaving camera bounds
    const cameraBounds = this.scene.cameras.main.worldView;
    if (
      !Phaser.Geom.Intersects.RectangleToRectangle(
        this.getBounds(),
        cameraBounds
      )
    ) {
      this.deactivate();
    }
  }
}
