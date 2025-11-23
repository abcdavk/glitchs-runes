import { world, system, MolangVariableMap } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:sound",
    itemId: "runes:sound",
    displayName: "Sound",
    onDamage: (({ player, enemy, cause }) => {
        if (cause == "entityAttack") {
            const view = player.getViewDirection()
            enemy.applyKnockback(view.x, view.z, 1.5, 0.5)
            enemy.dimension.playSound("note.bass", enemy.location)
        }
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        const cloud = player.dimension.spawnEntity("runes:sound_cloud", Vector3Utils.add(player.location, { x: 0, y: 3, z: 0 }))

        const cloudRide = cloud.getComponent("minecraft:rideable")
        cloudRide.addRider(player)
    }),
    onSneak: (({ player, setCooldown }) => {
        setCooldown(7)
        player.dimension.getPlayers({
            location: player.location,
            maxDistance: 5,
        }).forEach((p) => {
            p.addEffect("minecraft:strength", 20 * 10, { amplifier: 1, showParticles: false })
            p.addEffect("minecraft:speed", 20 * 10, { amplifier: 1, showParticles: false })
            p.addEffect("minecraft:regeneration", 20 * 10, { amplifier: 3, showParticles: false })
        })
        player.dimension.playSound("guitar_riff", player.location)
    }),
    onShoot: (({ hitVector, enemy }) => {
        enemy.dimension.playSound("note.harp", enemy.location)
        enemy.applyKnockback(
            hitVector.x,
            hitVector.z,
            1.5,
            0.5
        )
    })
})

let runnedEntity = []

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (entity.typeId === "runes:sound_cloud") {
        entity.setDynamicProperty("spawned", system.currentTick)
    }
})

const getViewYAngle = (viewDirection) => {
    const angleRadians = Math.asin(viewDirection.y)
    const angleDegrees = (angleRadians * 180) / Math.PI
    return angleDegrees
}

system.runInterval(() => {
    world.getAllPlayers().forEach((player) => {
        const entities = player.dimension.getEntities({
            type: "runes:sound_cloud"
        }).filter((e) => !runnedEntity.includes(e))

        entities.forEach((cloud) => {
            runnedEntity.push(cloud)

            const cloudRide = cloud.getComponent("minecraft:rideable")
            const riders = cloudRide.getRiders()
            const rider = riders[0]
            const spawnedTick = cloud.getDynamicProperty("spawned") ?? system.currentTick

            if (system.currentTick >= (spawnedTick + 200)) {
                if (riders.find(r => runes.getPlayerRune(r) == "runes:sound") == undefined)
                    return cloud.remove()
            }

            if (rider == undefined) return

            try {
                const viewAngle = getViewYAngle(rider.getViewDirection())
                const liftAmplifier = viewAngle > 0 ? viewAngle > 20 ? 5 : 1 : viewAngle > -20 ? 0 : -1
                if (cloud.isInWater && viewAngle > -20) {
                    cloud.applyImpulse({ x: 0, y: 0.2, z: 0 })
                }
                if (viewAngle > -20) {
                    cloud.addEffect('levitation', 2, { amplifier: liftAmplifier, showParticles: false })
                } else {
                    cloud.removeEffect('levitation')
                    cloud.addEffect('slow_falling', 2, { amplifier: 0, showParticles: false })
                }
                const particleLocations = [
                    { x: -0.25, y: 0, z: -0.25 },
                    { x: 0.25, y: 0, z: 0.25 },
                    { x: 0.25, y: 0, z: -0.25 },
                    { x: -0.25, y: 0, z: 0.25 },
                ]
                const molang = new MolangVariableMap()
                molang.setColorRGB("note_color", {
                    red: Math.random(),
                    green: Math.random(),
                    blue: Math.random()
                })
                particleLocations.forEach((location) => {
                    cloud.dimension.spawnParticle(
                        "runes:music_note",
                        Vector3Utils.add(cloud.location, location),
                        molang
                    )
                })
            } catch (e) { console.error(e) }
        })
    })

    runnedEntity = []
})