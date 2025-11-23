import { system, world } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:silk",
    itemId: "runes:silk",
    displayName: "Silk",
    onDamage: (({ player, enemy, cause }) => {
        if (cause == "entityAttack") {
            enemy.addEffect("minecraft:slowness", 20 * 3, { showParticles: false })
            enemy.addEffect("minecraft:weakness", 20 * 3, { showParticles: false })
            enemy.dimension.playSound("sweep", enemy.location)
        }
    }),
    onDoubleJump: (({ player, setCooldown, locationBeforeJump }) => {
        setCooldown(2)
        const view = player.getViewDirection()
        player.applyKnockback(view.x, view.z, 1, 1)

        player.dimension.getEntities({
            location: locationBeforeJump,
            maxDistance: 5,
        }).filter(p => p != player)
            .forEach((e) => {
                e.dimension.setBlockType(e.location, "minecraft:web")
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

                const view = player.getViewDirection()
                const distance = 7

                const location = Vector3Utils.add(
                    player.location,
                    {
                        x: view.x * distance,
                        y: view.y * distance,
                        z: view.z * distance,
                    }
                )

                entitiesGrab.forEach((e) => {
                    if (e.isValid()) e.teleport(location)
                })
            } else {
                const view = player.getViewDirection()
                const distance = 7

                const location = Vector3Utils.add(
                    player.location,
                    {
                        x: view.x * distance,
                        y: view.y * distance,
                        z: view.z * distance,
                    }
                )

                if (entitiesGrab.length > 0) {
                    world.structureManager.place(
                        "mystructure:silk_cocoon",
                        player.dimension,
                        Vector3Utils.subtract(
                            location,
                            { x: 1, y: 1, z: 1 }
                        )
                    )
                }

                entitiesGrab.forEach((e) => {
                    if (e.isValid()) e.teleport(location)
                })

                setCooldown(3)
                return system.clearRun(runId)
            }
        })
    }),
    passive: (({ player }) => {
        if (world.getTimeOfDay() < 23000 && world.getTimeOfDay() > 13000) {
            player.addEffect("minecraft:strength", 20, { amplifier: 1, showParticles: false })
            player.addEffect("minecraft:speed", 20, { amplifier: 1, showParticles: false })
        }

        const block = player.dimension.getBlock(player.location)
        if (block && block.typeId === "minecraft:web") {
            player.addEffect("minecraft:regeneration", 20 * 3, { amplifier: 2, showParticles: false })
        }
    })
})