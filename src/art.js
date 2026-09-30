/* Generated vector textures shared by both scenes. */
function createGameArtwork(scene) {
  if (scene.textures.exists('runner')) return;
      const art = scene.make.graphics({x: 0, y: 0}, false);
      // Equal-size frames animate the artwork without moving the collision box.
      const poses = [
        { key: 'runner', back: 15, front: 31, arm: 29 },
        { key: 'run-0', back: 8, front: 36, arm: 30 },
        { key: 'run-1', back: 19, front: 26, arm: 24 },
        { key: 'run-2', back: 36, front: 8, arm: 12 },
        { key: 'run-3', back: 26, front: 19, arm: 24 }
      ];
      for (const pose of poses) {
        art.lineStyle(8, 0x416457).lineBetween(27, 54, pose.back, 66);
        art.fillStyle(0xd5dfd4).fillRoundedRect(pose.back - 5, 65, 13, 6, 2);
        art.lineStyle(8, 0x24493f).lineBetween(17, 54, pose.front, 66);
        art.fillStyle(0xf8faf0).fillRoundedRect(pose.front - 5, 65, 13, 6, 2);
        art.fillStyle(0x214e43).fillRoundedRect(9, 29, 28, 30, 8);
        art.fillStyle(0xf4b48c).fillCircle(24, 17, 12);
        art.fillStyle(0x594b40).fillRoundedRect(12, 3, 24, 10, 4);
        art.lineStyle(7, 0xf4b48c).lineBetween(25, 34, pose.arm + 5, 43);
        art.fillStyle(0xf4e4b6).fillCircle(24, 42, 4);
        art.generateTexture(pose.key, 48, 72); art.clear();
      }
      art.fillStyle(0x79995b).fillCircle(12, 12, 11).fillCircle(32, 10, 10);
      art.fillStyle(0xd28662).fillRoundedRect(2, 19, 42, 33, 4);
      art.fillStyle(0xe49c75).fillRoundedRect(0, 17, 46, 8, 2);
      art.generateTexture('planter', 46, 52); art.clear();
      art.fillStyle(0x517447).fillRoundedRect(3, 12, 76, 36, 8);
      art.fillStyle(0x789858).fillCircle(19, 18, 16).fillCircle(42, 17, 17).fillCircle(64, 18, 16);
      art.fillStyle(0xa4bc72).fillCircle(17, 12, 4).fillCircle(47, 10, 4).fillCircle(65, 18, 4);
      art.generateTexture('hedge', 82, 48); art.clear();
      art.fillStyle(0x9b684b).fillRect(5, 8, 8, 62).fillRect(37, 8, 8, 62);
      art.fillStyle(0xe9a65c).fillRoundedRect(0, 0, 50, 17, 3);
      art.fillStyle(0xfff3d5).fillRect(8, 2, 8, 13).fillRect(30, 2, 8, 13);
      art.generateTexture('hurdle', 50, 70); art.clear();
      // Branch hangs into the path; there is deliberately no trunk blocking the ground.
      art.fillStyle(0x76543b).fillRect(93, 0, 14, 200).fillRoundedRect(4, 188, 110, 16, 7);
      art.fillStyle(0x365c3b).fillRoundedRect(4, 166, 112, 70, 16);
      art.fillStyle(0x527c45).fillCircle(25, 187, 20).fillCircle(61, 185, 22).fillCircle(94, 190, 20);
      art.fillStyle(0x7a9b52).fillCircle(22, 178, 7).fillCircle(64, 176, 8);
      art.fillStyle(0x365c3b).fillRoundedRect(10, 224, 14, 21, 5).fillRoundedRect(81, 220, 17, 25, 5);
      art.generateTexture('branch', 120, 245); art.clear();
      art.fillStyle(0x344d48).fillRect(29, 0, 6, 178).fillRoundedRect(4, 169, 56, 12, 4);
      art.fillStyle(0x344d48).fillRoundedRect(9, 179, 46, 59, 5);
      art.fillStyle(0xf3ce70).fillRect(15, 184, 34, 44);
      art.fillStyle(0xffebaa).fillRect(19, 188, 11, 32);
      art.fillStyle(0x344d48).fillRect(29, 180, 6, 53).fillRoundedRect(4, 234, 56, 11, 4);
      art.generateTexture('lamp', 64, 245); art.destroy();

  const wingArt = scene.make.graphics({x:0,y:0}, false);
  wingArt.fillStyle(0xf6d36a).fillCircle(36,27,25);
  wingArt.fillStyle(0xfff9dd).fillEllipse(19,24,32,16).fillEllipse(16,17,30,12).fillEllipse(53,24,32,16).fillEllipse(56,17,30,12);
  wingArt.fillStyle(0xe5ae43).fillCircle(36,29,7);
  wingArt.generateTexture('wings',72,54); wingArt.destroy();
}

