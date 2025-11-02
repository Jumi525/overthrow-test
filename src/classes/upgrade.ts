// Define a type for Upgrade
export type UpgradeType = "damage" | "speed" | "health";

// Simple Upgrade class (if you don’t already have one)
export class Upgrade extends Phaser.Physics.Arcade.Sprite {
  type: UpgradeType;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    type: UpgradeType
  ) {
    super(scene, x, y, texture);
    this.type = type;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
  }
}
