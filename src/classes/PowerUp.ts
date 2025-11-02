// src/classes/Powerup.ts
import Phaser from "phaser";

export default class Powerup extends Phaser.Physics.Arcade.Sprite {
  public type: string = "";
  private lifespan: number = 5000; // how long before auto-deactivation
  private destroyTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, texture = "powerup") {
    super(scene, x, y, texture);

    // Add to scene & physics world
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5);
    this.setDepth(10);
    this.setImmovable(true);
    this.setActive(false);
    this.setVisible(false);
  }

  public activate(x: number, y: number, type: string): void {
    this.type = type;
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this.body!.enable = true;

    this.applyTint(type);
    this.startFloatAnimation();

    // Lifespan timer: auto deactivate after delay
    this.destroyTimer = this.scene.time.delayedCall(
      this.lifespan,
      () => this.deactivate(),
      [],
      this
    );
  }

  public deactivate(): void {
    if (!this.active) return;

    this.setActive(false).setVisible(false);
    this.body!.stop();
    this.body!.enable = false;

    if (this.destroyTimer) {
      this.destroyTimer.remove(false);
      this.destroyTimer = undefined;
    }
  }

  private applyTint(type: string): void {
    let tintColor;
    switch (type) {
      case "speed":
        // this.setTexture("powerup_health");
        tintColor = 0x00ffff; // Cyan
        break;
      case "health":
        tintColor = 0x00ff00; // Green
        break;
      case "fire":
        tintColor = 0xffa500; // Orange
        break;
      default:
        tintColor = 0xffffff;
    }
    this.setTint(tintColor);
  }

  private startFloatAnimation(): void {
    // Cancel any previous tween if reused
    this.scene.tweens.killTweensOf(this);

    this.scene.tweens.add({
      targets: this,
      y: this.y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}

// import Phaser from "phaser";

// export default class Powerup extends Phaser.Physics.Arcade.Sprite {
//   public type: string = "";

//   constructor(scene: Phaser.Scene, x: number, y: number, texture = "powerup") {
//     super(scene, x, y, texture);

//     scene.add.existing(this);
//     scene.physics.add.existing(this);
//     this.setActive(false);
//     this.setVisible(false);
//     this.body.enable = false;
//   }

//   // Activate and show the powerup
//   public activate(x: number, y: number, type: string) {
//     this.type = type;
//     this.setPosition(x, y);
//     this.setActive(true);
//     this.setVisible(true);

//     // Ensure body exists
//     if (!this.body) {
//       this.scene.physics.add.existing(this);
//     }
//     this.body.enable = true;

//     console.log("Powerup activated:", this.type);
//   }

//   // Deactivate for pooling
//   public deactivate() {
//     this.setActive(false);
//     this.setVisible(false);

//     // Only disable body if it exists
//     if (this.body) {
//       this.body.enable = false;
//     }
//   }
// }
