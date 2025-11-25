import { Player, world } from "@minecraft/server";
import { Vector3Utils } from "./modules/minecraft-math"

world.afterEvents.worldInitialize.subscribe(() => {
    world.afterEvents.itemStopUse.subscribe(({ itemStack, source: player, useDuration }) => {
        if (!(player instanceof Player)) return;
        if (itemStack.typeId !== "weapons:vortex_gauntlet") return;
        if (useDuration <= 199960) {
            const dimension = player.dimension;

            dimension.spawnParticle("weapons:vortex_explosion", player.location);

            const forward = player.getViewDirection();

            const targetPoint = {
                x: player.location.x + forward.x * 2.0,
                y: player.location.y + 1,
                z: player.location.z + forward.z * 2.0
            };

            dimension.getEntities({
                location: player.location,
                maxDistance: 10
            }).forEach(entity => {
                if (entity === player) return;

                const pullVector = {
                    x: targetPoint.x - entity.location.x,
                    y: targetPoint.y - entity.location.y,
                    z: targetPoint.z - entity.location.z
                };
                const strength = 0.4;

                entity.applyImpulse({
                    x: pullVector.x * strength,
                    y: pullVector.y * strength,
                    z: pullVector.z * strength
                });
                entity.addEffect("slowness", 2, { amplifier: 10, showParticles: false })
                entity.applyDamage(8, { cause: "contact", damagingEntity: player })
                if (entity instanceof Player) entity.runCommand("camerashake add @s 1.0 3")
            })
        }
    });
});
