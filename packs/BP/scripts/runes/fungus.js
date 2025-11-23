import { world, Player } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

world.afterEvents.projectileHitEntity.subscribe((d) => {
    if (d.projectile.typeId === "runes:fungus_mushroom") {
        const entityData = d.getEntityHit()
        if (entityData && entityData.entity) {
            const { entity } = entityData
            if (entity.isValid()) {
                entity.addEffect("minecraft:poison", 20 * 5)
            }
        }
    }
})

const FungusModes = [
    "Fighting", "Speed", "Protection"
]

/**
 * @param {Player} player
 */
const changeMode = (player) => {
    const currentIndexMode = player.getDynamicProperty("fungus_modes")
    let nextIndexMode = currentIndexMode != undefined ? currentIndexMode + 1 : 0
    if (nextIndexMode >= FungusModes.length) nextIndexMode = 0

    player.setDynamicProperty("fungus_modes", nextIndexMode)
    return player.onScreenDisplay.setActionBar(`Mode changed to ${FungusModes[nextIndexMode]}.`)
}

runes.registerPower({
    id: "runes:fungus",
    itemId: "runes:fungus",
    displayName: "Fungus",
    onDamage: (({ player, enemy, cause }) => {
        if (cause == "entityAttack" && Math.random() > 0.5) {
            const randomEffect = [
                "minecraft:poison", "minecraft:wither", "minecraft:weakness"
            ]
            const getRandomInteger = (min, max) => {
                min = Math.ceil(min)
                max = Math.floor(max)

                return Math.floor(Math.random() * (max - min)) + min
            }

            const effect = randomEffect[getRandomInteger(0, randomEffect.length)]
            enemy.addEffect(effect, 20 * 3, { showParticles: false })
        }
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        const entities = player.dimension.getEntities({
            location: player.location,
            maxDistance: 10,
        }).filter(p => p != player && p.getComponent("minecraft:health") != undefined)

        setCooldown(5)
        entities.forEach((e) => {
            const mushroomLocation = Vector3Utils.add(player.getHeadLocation(), { x: 0, y: 2, z: 0 })
            const entityLocation = e.location

            const direction = Vector3Utils.subtract(entityLocation, mushroomLocation)
            const normalizedDirection = Vector3Utils.normalize(direction)
            const power = 1.5

            const mushroom = player.dimension.spawnEntity(
                "runes:fungus_mushroom",
                mushroomLocation
            )
            const projectile = mushroom.getComponent("minecraft:projectile")
            projectile.owner = player
            projectile.shoot(Vector3Utils.scale(normalizedDirection, power), { uncertainty: 0 })
        })
    }),
    onSneak: (({ player, setCooldown }) => {
        changeMode(player)
    }),
    passive: (({ player }) => {
        const currentIndexMode = player.getDynamicProperty("fungus_modes")
        const currentMode = FungusModes[currentIndexMode]

        switch (currentMode) {
            case "Fighting":
                player.addEffect("minecraft:strength", 20, { amplifier: 1, showParticles: false })
                player.addEffect("minecraft:jump_boost", 20, { showParticles: false })
                break
            case "Speed":
                player.addEffect("minecraft:speed", 20, { amplifier: 1, showParticles: false })
                player.addEffect("minecraft:slow_falling", 20, { showParticles: false })
                break
            case "Protection":
                player.addEffect("minecraft:resistance", 20, { showParticles: false })
                player.addEffect("minecraft:regeneration", 20, { amplifier: 1, showParticles: false })
                break
        }
    })
})