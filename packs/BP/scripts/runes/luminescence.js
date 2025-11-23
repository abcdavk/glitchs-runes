import { system } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:luminescence",
    itemId: "runes:luminescence",
    displayName: "Luminescence",
    onDamage: (({ enemy, cause }) => {
        if (cause === "entityAttack" && Math.random() >= 0.7) {
            enemy.runCommand("camera @s fade time 0 1 0.1 color 255 255 255")
            enemy.dimension.playSound("random.orb", enemy.location)
        }
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        const rayCast = player.dimension.getBlockFromRay(player.location, { x: 0, y: 1, z: 0 }, { maxDistance: 15 })
        let teleportUp = 15
        if (rayCast && rayCast.block) {
            teleportUp = rayCast.block.y - player.location.y - 2
        }

        setCooldown(5)
        const targetLocation = Vector3Utils.add(player.location, { x: 0, y: teleportUp, z: 0 })
        player.dimension.playSound("random.orb", targetLocation)
        player.teleport(targetLocation)
        let runId = system.runInterval(() => {
            if (!player.isValid()) return system.clearRun(runId)
            if (!player.isOnGround) {
                player.addEffect("minecraft:slow_falling", 10, { showParticles: false })
            } else {
                player.removeEffect("minecraft:slow_falling")
                return system.clearRun(runId)
            }
        })
    }),
    onSneak: (({ player, setCooldown }) => {
        const entities = player.dimension.getPlayers({
            location: player.location,
            maxDistance: 5,
        }).filter(p => p != player)

        const lightLocation = [
            { x: 0, y: 1.75, z: 1 },
            { x: -0.75, y: 1.75, z: 0.75 },
            { x: -1, y: 1.75, z: 0 },
            { x: -0.75, y: 1.75, z: -0.75 },
            { x: 0, y: 1.75, z: -1 },
            { x: 0.75, y: 1.75, z: -0.75 },
            { x: 1, y: 1.75, z: 0 },
            { x: 0.75, y: 1.75, z: 0.75 }
        ]

        const lightCenter = player.location
        setCooldown(5)
        lightLocation.forEach((l) => {
            player.dimension.spawnParticle("minecraft:endrod", Vector3Utils.add(
                lightCenter,
                l
            ))
        })
        player.dimension.playSound("beacon.power", player.location)
        player.addEffect("minecraft:regeneration", 20 * 5, { amplifier: 2, showParticles: false })
        entities.forEach((p) => {
            try { p.runCommand("camera @s fade time 0 1 0.1 color 255 255 255") } catch (e) { }
        })
    }),
    passive: (({ player }) => {
        player.addEffect("minecraft:night_vision", 20000000, { showParticles: false })
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:night_vision")
    })
})