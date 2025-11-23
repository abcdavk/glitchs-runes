import { world, StructureAnimationMode } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:plant",
    itemId: "runes:plant",
    displayName: "Plant",
    onDamage: (({ enemy, cause }) => {
        if (cause == "entityAttack") {
            enemy.addEffect("minecraft:slowness", 20, { showParticles: true })
            enemy.addEffect("minecraft:weakness", 20, { amplifier: 1, showParticles: true })
        }
    }),
    onDoubleJump: (({ player, locationBeforeJump, setCooldown }) => {
        setCooldown(5)
        player.applyKnockback(0, 0, 0, 1)
        locationBeforeJump = locationBeforeJump ?? player.location;
        world.structureManager.place(
            "mystructure:plant_tree",
            player.dimension,
            Vector3Utils.subtract(
                locationBeforeJump,
                { x: 2, y: 0, z: 2 }
            ),
            {
                animationMode: StructureAnimationMode.Layers,
                animationSeconds: 0.5
            }
        )
    }),
    onSneak: (({ player, setCooldown }) => {
        setCooldown(8)
        player.dimension.getEntities({
            location: player.location,
            maxDistance: 5,
            type: "minecraft:player"
        })
            .forEach((p) => {
                player.addEffect("minecraft:regeneration", 20 * 5, { showParticles: false, amplifier: 2 })
                player.addEffect("minecraft:strength", 20 * 5, { showParticles: false, amplifier: 1 })
            })
    }),
    passive: (({ player }) => {
        player.addEffect("minecraft:regeneration", 20000000, { showParticles: false, amplifier: 1 })
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:regeneration")
    })
})