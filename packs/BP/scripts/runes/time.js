import { system, Entity } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:time",
    itemId: "runes:time",
    displayName: "Time",
    onDamage: (({ enemy, cause }) => {
        if (cause == "entityAttack") {
            enemy.dimension.playSound("clock_tick", enemy.location, { volume: 100 })
        }
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        setCooldown(10)
        const entities = player.dimension.getEntities({
            location: player.location,
            maxDistance: 10
        }).filter((e) => e != player && e.getComponent("minecraft:health") != undefined)

        player.dimension.playSound("breeze_wind_charge.burst", player.location)
        entities.forEach((e) => {
            e.applyKnockback(0, 0, 0, 2.1)
        })
        system.runTimeout(() => {
            entities.forEach((e) => e.dimension.playSound("time_reverse", e.location))
        }, 20 * 0.25)
        system.runTimeout(() => {
            entities.forEach((e) => e.applyKnockback(0, 0, 0, -1))
        }, 20 * 1.25)
    }),
    onSneak: (({ player, setCooldown }) => {
        const stoppedEntities = {}
        let running = false

        let runId = system.runInterval(() => {
            if (running) return
            running = true

            // Check entity no longer close
            const entities = player.dimension.getEntities({
                location: player.location,
                maxDistance: 20
            }).filter((e) => e != player)

            for (const [id, data] of Object.entries(stoppedEntities)) {
                if (entities.find((e) => e.id == id) == undefined) {
                    const { entity } = data
                    if (entity.isValid() && data.velocity) {
                        try { entity.applyImpulse(data.velocity) } catch (e) { }
                    }
                    delete stoppedEntities[entity.id]
                }
            }

            if (player.isValid() && player.isSneaking) {
                entities.forEach((e) => {
                    if (stoppedEntities[e.id] == undefined) stoppedEntities[e.id] = {}
                    const data = stoppedEntities[e.id]
                    data.entity = e

                    if (!data.rotation) data.rotation = e.getRotation()
                    if (!data.velocity) data.velocity = e.getVelocity()
                    if (!data.location) data.location = e.location

                    const { x, y, z } = data.location
                    const { y: yRot, x: xRot } = data.rotation
                    e.teleport({ x, y, z }, { rotation: { y: yRot, x: xRot } })
                })
            } else {
                setCooldown(30)
                system.clearRun(runId)
                for (const [id, data] of Object.entries(stoppedEntities)) {
                    const { entity } = data
                    if (entity.isValid() && data.velocity) {
                        try { entity.applyImpulse(data.velocity) } catch (e) { }
                    }
                }
            }
            running = false
        })
    }),
    passive: (({ player }) => {
        const nextRepair = player.getDynamicProperty("time_nextRepair") ?? 0

        if (Date.now() >= nextRepair) {
            const inventory = player.getComponent("minecraft:inventory").container
            const slot = inventory.getSlot(player.selectedSlotIndex)
            if (slot.hasItem()) {
                const itemStack = slot.getItem()
                const durability = itemStack.getComponent("minecraft:durability")
                if (durability && durability.damage > 0) {
                    durability.damage -= durability.damage >= 10 ? 10 : durability.damage
                    slot.setItem(itemStack)
                }
            }

            player.setDynamicProperty("time_nextRepair", Date.now() + 1000)
        }
    })
})