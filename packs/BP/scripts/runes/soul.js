import { system, Entity } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

/**
 * @type {Object.<string, Entity[]>}
 */
const playerArmy = {}

runes.registerPower({
    id: "runes:soul",
    itemId: "runes:soul",
    displayName: "Soul",
    onDamage: (({ enemy, cause }) => {
        if (cause == "entityAttack") {
            enemy.dimension.playSound("mob.ghast.death", enemy.location)
        }
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        if (playerArmy[player.name]) {
            playerArmy[player.name].forEach((e) => {
                if (e.isValid()) e.remove()
            })
        }

        setCooldown(3)
        const entities = []
        entities.push(player.dimension.spawnEntity("minecraft:zombie", player.location))
        entities.push(player.dimension.spawnEntity("minecraft:skeleton", player.location))

        playerArmy[player.name] = entities
    }),
    onSneak: (({ player, setCooldown }) => {
        setCooldown(2)
        player.setDynamicProperty("soul_orb", true)
        let runId = system.runInterval(() => {
            if (player.isValid() && player.getDynamicProperty("soul_orb")) {
                const headLocation = player.getHeadLocation()
                const playerRotation = player.getRotation()
                const yaw = playerRotation.y

                const radians = (yaw * Math.PI) / 180
                const distance = 1
                const rightOffset = {
                    x: -(Math.cos(radians) * distance),
                    y: 0.25,
                    z: -(Math.sin(radians) * distance)
                }

                const rightLocation = Vector3Utils.add(
                    headLocation,
                    rightOffset
                )

                const health = player.getComponent("minecraft:health")
                health.setCurrentValue(health.currentValue + 0.1)
                player.dimension.spawnParticle("runes:soul_orb", rightLocation)
            } else {
                setCooldown(15)
                return system.clearRun(runId)
            }
            setCooldown(2)
        })
    }),
    passive: (({ player }) => {
        if (player.getDynamicProperty("soul_orb")) {
            const health = player.getComponent("minecraft:health")
            if (health.currentValue >= (health.effectiveMax / 2)) {
                player.setDynamicProperty("soul_orb")
            }
        }
        if (player.isSprinting) {
            player.addEffect("minecraft:invisibility", 10, { showParticles: false })
            player.addEffect("minecraft:speed", 10, { amplifier: 1, showParticles: false })
        }
    })
})