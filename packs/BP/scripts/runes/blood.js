import { world, system, Entity } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils, VECTOR3_DOWN } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:blood",
    itemId: "runes:blood",
    displayName: "Blood",
    onKilling: (({ player }) => {
        player.dimension.playSound("bone_break", player.location, { volume: 0.5 })
        player.getComponent("minecraft:health").resetToDefaultValue()
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        const entities = player.dimension.getEntities({
            location: Vector3Utils.add(player.location, VECTOR3_DOWN),
            maxDistance: 3,
        }).filter(p => p != player && p.getComponent("minecraft:health") !== undefined)

        setCooldown(4.5)
        entities.forEach((e) => {
            e.applyDamage(4, { cause: "entityAttack", damagingEntity: player })
            e.dimension.playSound("sweep", e.location)
        })
    }),
    onSneak: (({ player, setCooldown }) => {
        /**
         * @type {Entity[]}
         */
        const entitiesGrab = []
        let runId = system.runInterval(() => {
            if (player.isSneaking) {
                player.getEntitiesFromViewDirection({
                    maxDistance: 7
                })
                    .filter(e => e != player && entitiesGrab.find(t => e == t) == undefined)
                    .forEach(({ entity }) => {
                        entitiesGrab.push(entity)
                    })

                entitiesGrab.forEach((e) => {
                    if (!e.isValid()) return
                    const location = player.location
                    const view = player.getViewDirection()
                    const distance = player.selectedSlotIndex
                    location.x += view.x * distance
                    location.y += view.y * distance
                    location.z += view.z * distance

                    e.teleport(location)
                })
            } else {
                setCooldown(2)
                return system.clearRun(runId)
            }
        })
    })
})