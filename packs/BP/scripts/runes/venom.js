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
    id: "runes:venom",
    itemId: "runes:venom",
    displayName: "Venom",
    onDamage: (({ enemy, cause }) => {
        if (cause == "entityAttack") {
            enemy.addEffect("minecraft:poison", 20 * 3, { amplifier: 2, showParticles: false })
            enemy.dimension.playSound("random.glass", enemy.location)
        }
    }),
    onShoot: (({ player, projectile, enemy }) => {
        if (projectile.typeId === "minecraft:arrow") {
            enemy.addEffect("minecraft:poison", 20 * 15, { amplifier: 2 })
        }
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        setCooldown(8)
        world.structureManager.place("mystructure:venom_poison", player.dimension, player.location)
    }),
    onSneak: (({ player, setCooldown }) => {
        const size = 3
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
                        player.dimension.spawnParticle("runes:green_smoke", Vector3Utils.add(
                            location,
                            { x: x + random(), y, z: z + random() }
                        ))
                    } catch (e) { }
                }
            }
        }
        player.dimension.getEntities({
            location: location,
            maxDistance: 5,
        }).filter(p => p != player)
            .forEach((e) => {
                e.applyKnockback(
                    e.location.x - location.x,
                    e.location.z - location.z,
                    1.5 / Vector3Utils.distance(location, e.location),
                    0.75
                )
            })
    }),
    beforeEffectAdd: ((data) => {
        const effectName = data.effectType.replace(" ", "_").toLowerCase()
        if (badPotion.includes(effectName)) data.cancel = true
    })
})