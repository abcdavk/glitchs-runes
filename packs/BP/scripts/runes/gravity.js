import { system } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:gravity",
    itemId: "runes:gravity",
    displayName: "Gravity",
    onDamage: ({ enemy, cause }) => {
        if (cause === "entityAttack") {
            enemy.applyKnockback(0, 0, 0, 0.65)
            enemy.dimension.playSound("mace.smash_ground", enemy.location)
        }
    },
    onDoubleJump: (({ player, setCooldown }) => {
        player.applyKnockback(0, 0, 0, 1)
        setCooldown(1)
    }),
    onSneak: (({ player, setCooldown }) => {
        if (!player.isOnGround) {
            const blockBelow = player.dimension.getBlockFromRay(
                player.location,
                { x: 0, y: -1, z: 0 }
            )

            setCooldown(5)
            const distance = Math.abs(player.location.y - blockBelow.block.y)
            player.applyKnockback(0, 0, 0, distance * -0.25)
            let runId = system.runInterval(() => {
                if (!player.isValid()) return system.clearRun(runId)
                if (player.isOnGround) {
                    try {
                        const entities = player.dimension.getEntities({
                            location: player.location,
                            maxDistance: 7
                        }).filter(p => p != player)

                        player.dimension.playSound("random.totem", player.location)
                        entities.forEach((e) => {
                            try {
                                e.applyDamage(distance * 1.2)
                                e.applyKnockback(
                                    e.location.x - player.location.x,
                                    e.location.z - player.location.z,
                                    distance * 0.1,
                                    0.5
                                )
                            } catch (e) { }
                        })
                    } catch (e) { }

                    return system.clearRun(runId)
                }
            })
        } else {
            const entities = player.dimension.getEntities({
                location: player.location,
                maxDistance: 5
            }).filter(p => p != player)

            setCooldown(3)
            entities.forEach((e) => {
                e.addEffect("minecraft:slowness", 20 * 2, { amplifier: 3, showParticles: false })
            })
            let runId = system.runInterval(() => {
                if (!player.isValid()) return
                entities
                    .filter((e) => e.isValid())
                    .forEach((e) => e.applyDamage(0.5, { cause: "none", damagingEntity: player }))
            }, 20)
            system.runTimeout(() => {
                system.clearRun(runId)
            }, 20 * 3)
        }
    })
})