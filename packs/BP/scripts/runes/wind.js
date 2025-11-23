import { world, system } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:wind",
    itemId: "runes:wind",
    displayName: "Wind",
    onDamage: (({ player, enemy, cause }) => {
        if (cause == "entityAttack") {
            const view = player.getViewDirection()
            enemy.applyKnockback(view.x, view.z, 1.5, 0.5)
            enemy.dimension.playSound("breeze_wind_charge.burst", enemy.location)
        }
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        const cloud = player.dimension.spawnEntity("runes:wind_cloud", Vector3Utils.add(player.location, { x: 0, y: 3, z: 0 }))

        const cloudRide = cloud.getComponent("minecraft:rideable")
        cloudRide.addRider(player)
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
                    0.65,
                    1
                )
                e.dimension.playSound("breeze_wind_charge.burst", e.location)
            } catch (e) { }
        })
    }),
    passive: (({ player }) => {
        if (player.isSprinting) {
            player.addEffect("minecraft:invisibility", 10, { showParticles: false })
            player.addEffect("minecraft:speed", 10, { amplifier: 1, showParticles: false })
        }
    })
})

let runnedEntity = []

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (entity.typeId === "runes:wind_cloud") {
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
            type: "runes:wind_cloud"
        }).filter((e) => !runnedEntity.includes(e))

        entities.forEach((cloud) => {
            runnedEntity.push(cloud)

            const cloudRide = cloud.getComponent("minecraft:rideable")
            const rider = cloudRide.getRiders()[0]
            const spawnedTick = cloud.getDynamicProperty("spawned") ?? system.currentTick

            if (system.currentTick >= (spawnedTick + 200) && rider == undefined) {
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
                cloud.dimension.spawnParticle("minecraft:cauldron_explosion_emitter", cloud.location)
            } catch (e) { console.error(e) }
        })
    })

    runnedEntity = []
})