import { system } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils, VECTOR3_RIGHT, VECTOR3_LEFT } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:frost",
    itemId: "runes:frost",
    displayName: "Frost",
    onDamage: (({ player, enemy, cause }) => {
        if (cause == "entityAttack")
            enemy.dimension.playSound("mace.smash_ground", enemy.location)
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        const playerLocation = player.location;
        const viewDirection = player.getViewDirection();

        const baseLocation = Vector3Utils.add(
            playerLocation,
            {
                x: viewDirection.x * 3,
                y: 2,
                z: viewDirection.z * 3
            }
        );

        setCooldown(3)
        player.dimension.playSound("mob.player.hurt_freeze", baseLocation)
        const isLookingAlongX = Math.abs(viewDirection.x) > Math.abs(viewDirection.z);
        for (let offset = -1; offset <= 1; offset++) {
            const blockLocation = Vector3Utils.add(
                baseLocation,
                {
                    x: isLookingAlongX ? 0 : offset,
                    y: 0,
                    z: isLookingAlongX ? offset : 0
                }
            )

            const rayCast = player.dimension.getBlockFromRay(
                blockLocation,
                { x: 0, y: -1, z: 0 },
                { maxDistance: 10 }
            );

            if (rayCast && rayCast.block) {
                let above = rayCast.block.above();
                for (let i = 0; i < 3; i++) {
                    if (!above.isAir) break;
                    above.setType("minecraft:ice");
                    above = above.above();
                }
            }
        }
    }),
    onSneak: (({ player, setCooldown }) => {
        const entities = player.dimension.getEntities({
            location: player.location,
            maxDistance: 5,
        }).filter(p => p != player)

        setCooldown(4.25)
        entities.forEach((e) => {
            try {
                e.addEffect("minecraft:slowness", 20 * 2, { amplifier: 1, showParticles: false })
                e.addEffect("minecraft:weakness", 20 * 2, { amplifier: 1, showParticles: false })
            } catch (e) { }
        })
    }),
    passive: (({ player }) => {
        player.addEffect("minecraft:haste", 20000000, { amplifier: 1, showParticles: false })
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:haste")
    })
})