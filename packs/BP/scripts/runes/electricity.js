import { world } from '@minecraft/server'
import runes from "../modules/runes.js"

runes.registerPower({
    id: "runes:electricity",
    itemId: "runes:electricity",
    displayName: "Electricity",
    onDamage: (({ enemy, cause }) => {
        if (cause === "entityAttack" && Math.random() >= 0.7) {
            enemy.dimension.playSound("zap_effect", enemy.location)
            enemy.addEffect("minecraft:slowness", 20 * 1.5, { amplifier: 7, showParticles: false })
        }
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        const location = player.location
        const view = player.getViewDirection()
        const distance = 10
        location.x += view.x * distance
        location.y += view.y * distance
        location.z += view.z * distance

        setCooldown(2)
        player.dimension.playSound("zap_effect", location)
        player.teleport(location)
    }),
    onSneak: (({ player, setCooldown }) => {
        const entities = player.getEntitiesFromViewDirection({
            maxDistance: 5
        }).filter(e => e != player)

        setCooldown(3)
        entities.forEach(({ entity: e }) => {
            e.dimension.spawnEntity("minecraft:lightning_bolt", e.location)
        })
    }),
    onDie: (({ player }) => {
        player.setDynamicProperty("electricity_laststand", false)
    }),
    passive: (({ player }) => {
        player.addEffect("minecraft:speed", 20000000, { showParticles: false, amplifier: 2 })
        player.addEffect("minecraft:fire_resistance", 20000000, { showParticles: false })

        const health = player.getComponent("minecraft:health")
        if (health.currentValue <= 4 && !player.getDynamicProperty("electricity_laststand")) {
            player.setDynamicProperty("electricity_laststand", true)
        } else if (health.currentValue >= health.effectiveMax && player.getDynamicProperty("electricity_laststand")) {
            player.setDynamicProperty("electricity_laststand", false)
        }

        if (player.getDynamicProperty("electricity_laststand")) {
            player.addEffect("minecraft:strength", 20, { showParticles: false, amplifier: 1 })
            player.addEffect("minecraft:regeneration", 20, { showParticles: false, amplifier: 1 })
        }
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:speed")
        player.removeEffect("minecraft:fire_resistance")
    })
})