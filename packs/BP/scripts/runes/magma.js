import { system, EntityDamageCause } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:magma",
    itemId: "runes:magma",
    displayName: "Magma",
    onDamage: (({ enemy, cause }) => {
        if (cause === "entityAttack")
            enemy.setOnFire(3)
    }),
    onDoubleJump: (({ player, locationBeforeJump, setCooldown }) => {
        setCooldown(5)
        player.applyKnockback(0, 0, 0, 0.75)
        const location = locationBeforeJump

        player.dimension.createExplosion(location, 3, { causesFire: true, source: player, breaksBlocks: true })
    }),
    onSneak: (({ player, setCooldown }) => {
        const entities = player.dimension.getEntities({
            location: player.location,
            maxDistance: 5,
        }).filter(p => p != player)

        setCooldown(5)
        entities.forEach((e) => {
            try {
                e.applyDamage(
                    3 / Vector3Utils.distance(player.location, e.location),
                    { cause: "fire", damagingEntity: player }
                )
                e.setOnFire(3)
                e.runCommand("camerashake add @s 1.5 2 positional")
            } catch (e) { }
        })
    }),
    passive: (({ player }) => {
        player.addEffect("minecraft:fire_resistance", 20000000, { showParticles: false })
        if (player.dimension.getBlock(player.location)?.typeId === "minecraft:lava") {
            player.addEffect("minecraft:resistance", 20, { showParticles: false, amplifier: 2 })
        }
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:fire_resistance")
    })
})