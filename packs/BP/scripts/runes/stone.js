import { world } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:stone",
    itemId: "runes:stone",
    displayName: "Stone",
    onDamage: (({ enemy, cause }) => {
        if (cause == "entityAttack") {
            enemy.dimension.playSound("hit.stone", enemy.location, { volume: 100 })
        }
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        const block = player.dimension.getBlock(player.location).above()
        const blockBelow = block.below()

        setCooldown(3)
        block.setType("minecraft:structure_void")
        blockBelow.setType("minecraft:pointed_dripstone")
        block.setType("minecraft:air")
    }),
    onSneak: (({ player, setCooldown }) => {
        setCooldown(10)
        player.addEffect("minecraft:resistance", 20 * 8, { amplifier: 1, showParticles: false })
        player.addEffect("minecraft:speed", 20 * 8, { amplifier: 1, showParticles: false })
    }),
    passive: (({ player }) => {
        player.addEffect("minecraft:haste", 20000000, { amplifier: 1, showParticles: false })
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:haste")
    })
})