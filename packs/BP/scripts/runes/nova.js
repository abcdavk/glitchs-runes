import { DimensionTypes, world, Player, Entity, system } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

/**
 * @param {string} face 
 * @returns {{x: number, y: number, z: number}}
 */
const getDirectionLocation = (face) => {
    const location = { x: 0, y: 0, z: 0 }
    switch (face) {
        // Y POSITION
        case "Up":
            location.y += 1
            break

        case "Down":
            location.y += -1
            break

        // Z POSITION
        case "South":
            location.z += 1
            break

        case "North":
            location.z += -1
            break

        // X POSITION
        case "East":
            location.x += 1
            break

        case "West":
            location.x += -1
            break

        default:
            break
    }

    return location
}

/**
 * @param {string} type
 * @param {string} playerName
 * @returns {Entity}
 */
const getPortalsByName = (type, playerName) => {
    for (const { typeId: dimensionId } of DimensionTypes.getAll()) {
        const entities = world.getDimension(dimensionId).getEntities({ type })
        const entity = entities.find((e) => e.getDynamicProperty("ownerName") == playerName)

        if (entity)
            return entity
    }
}

/**
 * @param {Player} player
 * @returns {{blue?: Entity, orange?: Entity}}
 */
const getPortals = (player) => {
    const blue = getPortalsByName("runes:nova_blue", player.name)
    const orange = getPortalsByName("runes:nova_orange", player.name)

    return {
        blue, orange
    }
}

runes.registerPower({
    id: "runes:nova",
    itemId: "runes:nova",
    displayName: "Nova",
    onDamage: ({ player, enemy, cause }) => {
        if (cause === "entityAttack") {
            enemy.dimension.playSound("respawn_anchor.charge", enemy.location)

            const lastHit = player.getDynamicProperty("nova_lastm1") ?? 0
            const stackHit = player.getDynamicProperty("nova_stackm1") ?? 0
            if (Date.now() < lastHit + 1000) {
                player.setDynamicProperty("nova_stackm1", stackHit + 1)
            } else {
                if (stackHit < 10) player.setDynamicProperty("nova_stackm1", 0)
            }

            player.setDynamicProperty("nova_lastm1", Date.now())
        }
    },
    onDamaged: (({ player }) => {
        player.setDynamicProperty("nova_stackm1", 0)
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        player.dimension.playSound("breeze_wind_charge.burst", player.location)
        player.applyKnockback(0, 0, 0, 1.25)
        setCooldown(1)
    }),
    onSneak: (({ player, setCooldown }) => {
        const stackHit = player.getDynamicProperty("nova_stackm1") ?? 0
        if (stackHit >= 10 && (!player.isOnGround && !player.isGliding)) {
            player.setDynamicProperty("nova_stackm1", 0)

            const blockBelow = player.dimension.getBlockFromRay(
                player.location,
                { x: 0, y: -1, z: 0 }
            )

            setCooldown(5)
            const distance = Math.abs(player.location.y - blockBelow.block.y)
            player.applyKnockback(0, 0, 0, distance * -0.25)

            player.dimension.createExplosion(
                blockBelow.block.location,
                10,
                {
                    causesFire: false, breaksBlocks: true, source: player
                }
            )
        } else {
            const raycast = player.getBlockFromViewDirection({ maxDistance: 6 })
            if (raycast) {
                const { block, face } = raycast
                const portalLocation = Vector3Utils.add(block.center(), getDirectionLocation(face))
                portalLocation.y -= 0.5

                const placedPortals = getPortals(player)

                const currentPortal = player.getDynamicProperty("nova_currentPortal") ?? 0

                setCooldown(1.5)
                if (currentPortal == 0) {
                    if (placedPortals.blue != undefined) {
                        placedPortals.blue.remove()
                    }

                    const portal = block.dimension.spawnEntity("runes:nova_blue", portalLocation)
                    portal.setDynamicProperty("ownerName", player.name)

                    player.setDynamicProperty("nova_blue", portal.id)
                    player.setDynamicProperty("nova_currentPortal", 1)
                } else if (currentPortal == 1) {
                    if (placedPortals.orange != undefined) {
                        placedPortals.orange.remove()
                    }

                    const portal = block.dimension.spawnEntity("runes:nova_orange", portalLocation)
                    portal.setDynamicProperty("ownerName", player.name)

                    player.setDynamicProperty("nova_orange", portal.id)
                    player.setDynamicProperty("nova_currentPortal", 0)
                }
            }
        }
    }),
    passive: (({ player }) => {
        // Jump Boost
        player.addEffect("minecraft:jump_boost", 20000000, { amplifier: 1, showParticles: false })

        // Supernova
        const stackHit = player.getDynamicProperty("nova_stackm1") ?? 0
        if (stackHit >= 10) player.onScreenDisplay.setActionBar("SUPERNOVA IS READY")
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:jump_boost")

        const placedPortals = getPortals(player)
        Object.values(placedPortals).forEach((portal) => {
            if (portal) {
                try { portal.remove() } catch (e) { }
            }
        })

        player.setDynamicProperty("nova_blue")
        player.setDynamicProperty("nova_orange")
        player.setDynamicProperty("nova_currentPortal")
    })
})

system.runInterval(() => {
    world.getAllPlayers().forEach((player) => {
        const portal = player.dimension.getEntities({
            location: player.location,
            maxDistance: 1,
            families: ["runes:nova_portal"],
            closest: 1
        })[0]

        if (portal && !player.getDynamicProperty("teleporting")) {
            const ownerName = portal.getDynamicProperty("ownerName")
            const portalToTarget = {
                "runes:nova_blue": getPortalsByName("runes:nova_orange", ownerName),
                "runes:nova_orange": getPortalsByName("runes:nova_blue", ownerName)
            }

            if (portalToTarget["runes:nova_blue"] == undefined || portalToTarget["runes:nova_orange"] == undefined) return

            player.setDynamicProperty("teleporting", true)
            const targetPortal = portalToTarget[portal.typeId]

            player.teleport(
                targetPortal.location,
                { dimension: targetPortal.dimension }
            )
        } else if (portal == undefined && player.getDynamicProperty("teleporting")) {
            player.setDynamicProperty("teleporting")
        }
    })
})

world.afterEvents.entityHitEntity.subscribe(({ damagingEntity: player, hitEntity: portal }) => {
    const portalTypes = ["runes:nova_blue", "runes:nova_orange"]

    if (player instanceof Player && portalTypes.includes(portal.typeId)) {
        const placedPortals = getPortals(player)

        if (!Object.values(placedPortals).find(p => p.id == portal.id)) {
            portal.remove()
        }
    }
})