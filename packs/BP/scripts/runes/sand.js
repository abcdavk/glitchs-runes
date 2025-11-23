import { system, world } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

const sandParticle = (player) => {
    const random = (min, max) => {
        return Math.random() * (max - min) + min
    }
    for (let i = 0; i <= 10; i++) {
        const location = Vector3Utils.add(
            player.location,
            {
                x: random(-1, 1),
                y: random(1, 2),
                z: random(-1, 1)
            }
        )
        player.dimension.spawnParticle("minecraft:falling_dust_sand_particle", location)
    }
}

runes.registerPower({
    id: "runes:sand",
    itemId: "runes:sand",
    displayName: "Sand",
    onDamage: (({ player, enemy, cause }) => {
        if (cause == "entityAttack") {
            if (Math.random() >= 0.7) {
                enemy.addEffect("minecraft:wither", 20, { showParticles: false })
                enemy.dimension.playSound("dig.sand", enemy.location, { volume: 100 })
            }

            sandParticle(player)
        }
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        const view = player.getViewDirection()

        setCooldown(1.5)
        player.dimension.playSound("dig.sand", player.location, { volume: 100 })
        player.applyKnockback(
            view.x,
            view.z,
            2,
            view.y * 1
        )
    }),
    onSneak: (({ player, setCooldown }) => {
        const entities = player.dimension.getEntities({
            location: player.location,
            maxDistance: 4,
        }).filter(p => p != player && p.getComponent("minecraft:health") != undefined)

        setCooldown(5)
        sandParticle(player)
        entities.forEach((e) => {
            try {
                e.addEffect("minecraft:wither", 20 * 3, { amplifier: 1, showParticles: false })
                const eHealth = e.getComponent("minecraft:health")
                e.runCommand("camerashake add @s 1.5 2 positional")
                for (let i = 0; i <= 3; i++) {
                    system.runTimeout(() => {
                        if (e.isValid()) eHealth.setCurrentValue(eHealth.currentValue - 2)
                    }, 20 * i)
                }
            } catch (e) { }
        })
        player.addEffect("minecraft:regeneration", 20 * 5, { showParticles: false })
    }),
    passive: (({ player }) => {
        player.addEffect("minecraft:speed", 20000000, { showParticles: false })
        if (world.getTimeOfDay() >= 100 && world.getTimeOfDay() <= 12500) {
            player.addEffect("minecraft:strength", 10, { amplifier: 3, showParticles: false })
            player.addEffect("minecraft:fire_resistance", 10, { showParticles: false })
        }
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:speed")
    })
})