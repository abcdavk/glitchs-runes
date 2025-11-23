import { system } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:shadow",
    itemId: "runes:shadow",
    displayName: "Shadow",
    onDamage: (({ player, enemy, cause }) => {
        if (cause == "entityAttack") {
            enemy.addEffect("minecraft:blindness", 20 * 1.5, { showParticles: false })
            enemy.addEffect("minecraft:slowness", 20 * 1.5, { showParticles: false })
            enemy.dimension.playSound("mob.blaze.death", enemy.location)

            const cloudEntity = player.getDynamicProperty("shadow_cloudentity") ?? 0
            if (cloudEntity > 0) {
                enemy.applyDamage(3 * 2, { cause: "magic", damagingEntity: player })
                player.setDynamicProperty("shadow_cloudentity", cloudEntity - 1)
                for (let i = 0; i < 5; i++) {
                    enemy.dimension.spawnParticle("runes:black_smoke", enemy.location)
                }
            }
        }
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        setCooldown(2)
        const location = player.location
        for (let i = 0; i < 5; i++) {
            player.dimension.spawnParticle("runes:black_smoke", location)
        }

        player.dimension.getEntities({
            location,
            maxDistance: 3,
        }).filter(p => p != player)
            .forEach((e) => {
                e.addEffect("minecraft:wither", 20 * 3, { amplifier: 1, showParticles: false })
            })
    }),
    onSneak: (({ player, setCooldown }) => {
        setCooldown(2)
        player.setDynamicProperty("shadow_cloudentity", 2)
        let timeoutId = system.runTimeout(() => {
            player.setDynamicProperty("shadow_cloudentity")
        }, 20 * 5)
        let runId = system.runInterval(() => {
            if (player.isValid() && player.getDynamicProperty("shadow_cloudentity")) {
                const headLocation = player.getHeadLocation()
                const playerRotation = player.getRotation()
                const yaw = playerRotation.y

                const radians = (yaw * Math.PI) / 180
                const distance = 1.5
                const rightOffset = {
                    x: Math.cos(radians) * distance,
                    y: 0.25,
                    z: Math.sin(radians) * distance
                }
                const leftOffset = {
                    x: -rightOffset.x,
                    y: rightOffset.y,
                    z: -rightOffset.z
                }

                const locations = [
                    Vector3Utils.add(
                        headLocation,
                        rightOffset
                    ), Vector3Utils.add(
                        headLocation,
                        leftOffset
                    )
                ]

                for (let i = 0; i < player.getDynamicProperty("shadow_cloudentity"); i++) {
                    const location = locations[i % locations.length]
                    player.dimension.spawnParticle("runes:black_smoke", location)
                }
            } else {
                setCooldown(5)
                system.clearRun(timeoutId)
                return system.clearRun(runId)
            }
            setCooldown(2)
        })
    }),
    passive: (({ player }) => {
        player.addEffect("minecraft:night_vision", 20000000, { showParticles: false })
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:night_vision")
    })
})