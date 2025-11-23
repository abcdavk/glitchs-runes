import { world } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

const usedTrident = []
world.afterEvents.projectileHitBlock.subscribe(({ projectile }) => {
    if (usedTrident.includes(projectile)) projectile.kill()
})

runes.registerPower({
    id: "runes:aqua",
    itemId: "runes:aqua",
    displayName: "Aqua",
    onDamage: (({ player, enemy, cause }) => {
        if (cause == "entityAttack")
            enemy.dimension.playSound("bubble.pop", enemy.location)
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        const entities = player.dimension.getEntities({
            location: player.location,
            maxDistance: 10,
        }).filter(p => p != player && p.getComponent("minecraft:health") != undefined)

        setCooldown(5)
        player.dimension.playSound("item.trident.riptide_2", player.location)
        entities.forEach((e) => {
            const tridentLocation = Vector3Utils.add(player.getHeadLocation(), { x: 0, y: 2, z: 0 })
            const entityLocation = e.location

            const direction = Vector3Utils.subtract(entityLocation, tridentLocation)
            const normalizedDirection = Vector3Utils.normalize(direction)
            const power = 2

            const trident = player.dimension.spawnEntity(
                "minecraft:thrown_trident",
                tridentLocation
            )
            usedTrident.push(trident)
            const projectile = trident.getComponent("minecraft:projectile")
            projectile.owner = player
            projectile.shouldBounceOnHit = false
            projectile.shoot(Vector3Utils.scale(normalizedDirection, power), { uncertainty: 0 })
        })
    }),
    onSneak: (({ player, setCooldown }) => {
        const entities = player.dimension.getEntities({
            location: player.location,
            maxDistance: 5,
        }).filter(p => p != player)

        const { x, z } = player.location

        setCooldown(3)
        entities.forEach((e) => {
            try {
                e.applyKnockback(
                    e.location.x - x,
                    e.location.z - z,
                    1.5 / Vector3Utils.distance(player.location, e.location),
                    0.5
                )
                e.dimension.playSound("mob.axolotl.splash", e.location)
            } catch (e) { }
        })
    }),
    passive: (({ player }) => {
        player.addEffect("minecraft:water_breathing", 20000000, { showParticles: false })
        player.addEffect("minecraft:conduit_power", 20000000, { showParticles: false })
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:water_breathing")
        player.removeEffect("minecraft:conduit_power")
    })
})