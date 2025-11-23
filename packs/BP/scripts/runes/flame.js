import { system } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:flame",
    itemId: "runes:flame",
    displayName: "Flame",
    onDamage: (({ enemy, cause }) => {
        if (cause === "entityAttack") {
            enemy.dimension.playSound("mob.blaze.shoot", enemy.location)
            enemy.setOnFire(3)
        }
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        const block3x3 = [
            { x: 1, y: 0, z: -1 }, { x: 1, y: 0, z: 0 }, { x: 1, y: 0, z: 1 },
            { x: 0, y: 0, z: -1 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 },
            { x: -1, y: 0, z: -1 }, { x: -1, y: 0, z: 0 }, { x: -1, y: 0, z: 1 }
        ]

        setCooldown(4)
        const below = player.dimension.getBlock(player.location).below()
        player.dimension.playSound("mob.blaze.shoot", below.location)
        block3x3.forEach((l) => {
            const rayCast = player.dimension.getBlockFromRay(
                Vector3Utils.add(below.location, l),
                { x: 0, y: -1, z: 0 },
                { maxDistance: 5 }
            )
            if (rayCast && rayCast.block) {
                rayCast.block.above().setType("minecraft:fire")
            }
        })
    }),
    onSneak: (({ player, setCooldown }) => {
        const block4x3 = [
            { x: 2, y: 0, z: -1 }, { x: 2, y: 0, z: 0 }, { x: 2, y: 0, z: 1 },
            { x: 1, y: 0, z: 2 }, { x: 0, y: 0, z: 2 }, { x: -1, y: 0, z: 2 },
            { x: -2, y: 0, z: 1 }, { x: -2, y: 0, z: 0 }, { x: -2, y: 0, z: -1 },
            { x: -1, y: 0, z: -2 }, { x: 0, y: 0, z: -2 }, { x: 1, y: 0, z: -2 }
        ]

        setCooldown(5)
        const location = player.location
        block4x3.forEach((l) => {
            const rayCast = player.dimension.getBlockFromRay(
                Vector3Utils.add(location, l),
                { x: 0, y: -1, z: 0 },
                { maxDistance: 3 }
            )
            if (rayCast && rayCast.block) {
                rayCast.block.above().setType("minecraft:fire")
            }
        })
        const dimension = player.dimension
        player.dimension.playSound("mob.blaze.shoot", player.location)
        let runId = system.runInterval(() => {
            dimension.getEntities({
                location,
                maxDistance: 3
            }).filter(p => p != player)
                .forEach((e) => {
                    try {
                        e.applyKnockback(
                            e.location.x - location.x,
                            e.location.z - location.z,
                            1.5 / Vector3Utils.distance(location, e.location),
                            0.5
                        )
                    } catch (e) { }
                })
        })
        system.runTimeout(() => system.clearRun(runId), 20 * 3)
    }),
    passive: (({ player }) => {
        player.addEffect("minecraft:fire_resistance", 20000000, { showParticles: false })
        if (player.dimension.getBlock(player.location)?.typeId === "minecraft:fire") {
            player.addEffect("minecraft:regeneration", 20, { showParticles: false, amplifier: 4 })
        }
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:fire_resistance")
    })
})