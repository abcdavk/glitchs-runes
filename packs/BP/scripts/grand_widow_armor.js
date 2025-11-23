import { world, system, ItemStack, Player, EquipmentSlot } from "@minecraft/server"
import { Vector3Utils } from "./modules/minecraft-math"
import events from "./modules/events"

/**
* @param {Player} player
* @returns {Object.<string, ItemStack>}
*/
const getArmors = (player) => {
    const equippable = player.getComponent("minecraft:equippable")
    const slots = [EquipmentSlot.Chest, EquipmentSlot.Feet, EquipmentSlot.Head, EquipmentSlot.Legs]

    const armors = {}
    for (const slot of slots) {
        const armor = equippable.getEquipment(slot)
        if (armor) armors[slot] = armor
    }

    return armors
}

const grandWidowArmor = {
    [EquipmentSlot.Head]: "armor:grand_widow_helmet",
    [EquipmentSlot.Chest]: "armor:grand_widow_chestplate",
    [EquipmentSlot.Legs]: "armor:grand_widow_leggings",
    [EquipmentSlot.Feet]: "armor:grand_widow_boots",
}

const isFullArmor = (armors, selectedArmor) => {
    let sameCount = 0
    for (const slot in armors) {
        const armor = armors[slot]
        if (armor.typeId == selectedArmor[slot]) sameCount += 1
    }

    return sameCount >= 4
}

world.afterEvents.worldInitialize.subscribe(() => {

    events.jumpAfterEvent.subscribe(({ player }) => {
        if (!player.hasTag("has_full_grand_widow")) return
        if (player.isFalling && !player.isGliding) {
            player.dimension.playSound("double_jump", player.location)
            player.dimension.spawnParticle("armor:cloud_effect", player.location)
            player.applyKnockback(0, 0, 0, 1.15)
        }
    })

    events.sneakAfterEvent.subscribe(({ player }) => {
        if (!player.hasTag("has_full_grand_widow")) return
        if (Date.now() < (player.getDynamicProperty("crouchCooldown") ?? Date.now())) return

        player.setDynamicProperty("crouchCooldown", Date.now() + 5000)
        if (!player.isOnGround && !player.isGliding) {
            let runId = system.runInterval(() => {
                if (player.isValid() && !player.isOnGround) {
                    player.applyKnockback(0, 0, 0, -1.5)
                } else {
                    system.clearRun(runId)
                    player.dimension.playSound("landing", player.location)
                    player.dimension.spawnParticle("armor:cloud_effect", player.location)
                    player.dimension.getEntities({ location: player.location, maxDistance: 5 })
                        .filter((e) => e != player)
                        .forEach((e) => {
                            try { e.applyKnockback(0, 0, 0, 1.25) } catch (e) { }
                        })
                }
            })
        } else if (player.isOnGround) {
            const size = 3
            const random = () => {
                let r = Math.random()
                if (Math.random() >= 0.5) r = -r

                return r
            }
            const location = player.location
            for (let x = -size; x <= size; x++) {
                for (let z = -size; z <= size; z++) {
                    for (let y = 0; y <= 2; y++) {
                        try {
                            player.dimension.spawnParticle("armor:red_smoke", Vector3Utils.add(
                                location,
                                { x: x + random(), y, z: z + random() }
                            ))
                        } catch (e) { }
                    }
                }
            }
            player.dimension.getEntities({
                location: location,
                maxDistance: 5,
            }).filter(p => p != player)
                .forEach((e) => {
                    e.applyKnockback(
                        e.location.x - location.x,
                        e.location.z - location.z,
                        3 / Vector3Utils.distance(location, e.location),
                        0.75
                    )
                    e.runCommand("camera @s fade time 0 1 0.1 color 175 0 0")
                })
        }
    })

    world.afterEvents.entityDie.subscribe(({ deadEntity: player }) => {
        if (!player.hasTag("has_full_grand_widow")) return

        player.dimension.createExplosion(player.location, 5, { breaksBlocks: false })

        player.removeTag("has_full_grand_widow")
    }, { entityTypes: ["minecraft:player"] })

    let isRunning = false
    system.runInterval(() => {
        if (isRunning) return
        isRunning = true
        world.getAllPlayers().forEach((player) => {
            if (player.getComponent("minecraft:health").currentValue <= 0) return
            const armors = getArmors(player)

            const isFull = isFullArmor(armors, grandWidowArmor)
            const target = isFull ? "add" : "remove"

            player.triggerEvent(`armor:${target}_grand_widow`)

            if (isFull) {
                if (!player.hasTag("has_full_grand_widow")) {
                    player.addTag("has_full_grand_widow")

                    world.sendMessage("§cSomething Dark Awakens...")
                    player.runCommand("playsound boss_theme")
                    player.dimension.spawnEntity("minecraft:lightning_bolt", player.location)
                }

                player.addEffect("minecraft:speed", 20000000, { amplifier: 1, showParticles: false })
                player.addEffect("minecraft:strength", 20000000, { showParticles: false })
                player.addEffect("minecraft:jump_boost", 20000000, { amplifier: 1, showParticles: false })
                player.addEffect("minecraft:regeneration", 20000000, { amplifier: 3, showParticles: false })
            } else if (player.hasTag("has_full_grand_widow")) {
                player.removeEffect("minecraft:speed")
                player.removeEffect("minecraft:strength")
                player.removeEffect("minecraft:jump_boost")
                player.removeEffect("minecraft:regeneration")
                player.removeTag("has_full_grand_widow")
            }
        })

        isRunning = false
    })
})