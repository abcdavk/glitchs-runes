import { world, system } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

const badPotion = [
    "blindness",
    "darkness",
    "fatal_poison",
    "hunger",
    "infested",
    "instant_damage",
    "levitation",
    "mining_fatigue",
    "nausea",
    "poison",
    "slowness",
    "weakness",
    "wither"
]

runes.registerPower({
    id: "runes:smoke",
    itemId: "runes:smoke",
    displayName: "Smoke",
    onDamage: (({ player, enemy, cause }) => {
        if (cause == "entityAttack") {
            enemy.runCommand("camera @s fade time 0 1 0.1 color 110 110 110")

            const view = player.getViewDirection()
            enemy.applyKnockback(view.x, view.z, 0.5, 0.5)
            enemy.dimension.playSound("extinguish.candle", enemy.location)
        }
    }),
    onDoubleJump: (({ player, setCooldown, locationBeforeJump }) => {
        setCooldown(5)
        const size = 5
        const random = () => {
            let r = Math.random()
            if (Math.random() >= 0.5) r = -r

            return r
        }

        const raycast = player.dimension.getBlockFromRay(player.location, { x: 0, y: -1, z: 0 })
        const location = raycast && raycast.block ? raycast.block.location : locationBeforeJump

        player.addEffect("minecraft:invisibility", 20 * 3, { amplifier: 1, showParticles: false })
        for (let x = -size; x <= size; x++) {
            for (let z = -size; z <= size; z++) {
                for (let y = 0; y <= 2; y++) {
                    try {
                        player.dimension.spawnParticle("runes:gray_smoke", Vector3Utils.add(
                            location,
                            { x: x + random(), y, z: z + random() }
                        ))
                    } catch (e) { }
                }
            }
        }
    }),
    onSneak: (({ player, setCooldown }) => {
        const size = 5
        const random = () => {
            let r = Math.random()
            if (Math.random() >= 0.5) r = -r

            return r
        }
        const location = player.location
        setCooldown(5)
        for (let x = -size; x <= size; x++) {
            for (let z = -size; z <= size; z++) {
                for (let y = 0; y <= 2; y++) {
                    try {
                        player.dimension.spawnParticle("runes:gray_smoke", Vector3Utils.add(
                            location,
                            { x: x + random(), y, z: z + random() }
                        ))
                    } catch (e) { }
                }
            }
        }
        const entities = player.dimension.getEntities({
            location: location,
            maxDistance: 10,
        }).filter(p => p != player)
        entities.forEach((e) => {
            e.runCommand("camera @s fade time 0 3 0.1 color 110 110 110")
        })

        player.dimension.playSound("breeze_wind_charge.burst", player.location)
        const damageEntities = () => {
            entities.forEach((e) => {
                try {
                    e.applyDamage(2, { cause: "magic", damagingEntity: player })
                } catch (e) { }
            })
        }

        for (let i = 0; i < 5; i++) {
            system.runTimeout(damageEntities, 20 * i)
        }
    }),
    passive: (({ player }) => {
        player.addEffect("minecraft:jump_boost", 20000000, { amplifier: 1, showParticles: false })
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:jump_boost")
    })
})