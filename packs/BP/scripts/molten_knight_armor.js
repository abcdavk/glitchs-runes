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

const moltenKnightArmor = {
    [EquipmentSlot.Head]: "armor:molten_knight_helmet",
    [EquipmentSlot.Chest]: "armor:molten_knight_chestplate",
    [EquipmentSlot.Legs]: "armor:molten_knight_leggings",
    [EquipmentSlot.Feet]: "armor:molten_knight_boots",
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
    
    
    

    // events.jumpAfterEvent.subscribe(({ player }) => {
    //     if (!player.hasTag("has_full_molten_knight")) return
    //     if (player.isFalling && !player.isGliding) {
    //         player.dimension.playSound("double_jump", player.location)
    //         player.dimension.spawnParticle("armor:cloud_effect", player.location)
    //         player.applyKnockback(0, 0, 0, 1.15)
    //     }
    // })

    // events.sneakAfterEvent.subscribe(({ player }) => {
    //     if (!player.hasTag("has_full_molten_knight")) return
    //     if (Date.now() < (player.getDynamicProperty("crouchCooldown") ?? Date.now())) return

    //     player.setDynamicProperty("crouchCooldown", Date.now() + 5000)
    //     if (player.isOnGround) {
    //         let runId = system.runInterval(() => {
    //             if (player.isValid() && !player.isOnGround) {
    //                 player.applyKnockback(0, 0, 0, -1.5)
    //             } else {
    //                 system.clearRun(runId)
    //                 player.dimension.playSound("landing", player.location)
    //                 player.dimension.spawnParticle("runes:campfire_smoke_particle", player.location)
    //                 dimension.spawnParticle("runes:basic_flame_particle", player.location);

    //                 player.dimension.getEntities({ location: player.location, maxDistance: 5 })
    //                     .filter((e) => e != player)
    //                     .forEach((e) => {
    //                         try { e.applyKnockback(0, 0, 0, 1.25) } catch (e) { }
    //                     })
    //             }
    //         })
    //     }
    // })

    world.afterEvents.entityDie.subscribe(({ deadEntity: player }) => {
        if (!player.hasTag("has_full_molten_knight")) return

        player.dimension.createExplosion(player.location, 5, { breaksBlocks: false })

        player.removeTag("has_full_molten_knight")
    }, { entityTypes: ["minecraft:player"] })

    let isRunning = false


    system.runInterval(() => {
        if (isRunning) return;
        isRunning = true
        world.getAllPlayers().forEach((player) => {
            
            if (player.sneakingTicks === undefined) player.sneakingTicks = 0;
            if (player.jumpTicks === undefined) player.jumpTicks = 0;
            if (player.cooldownSneakingTicks === undefined) player.cooldownSneakingTicks = 0;
            if (player.cooldownJumpTicks === undefined) player.cooldownJumpTicks = 0;
            if (player.explosionLevel === undefined) player.explosionLevel = 0;
            const dimension = player.dimension
            const playerHealth = player.getComponent("minecraft:health").currentValue;
            if (playerHealth <= 0) return
            const armors = getArmors(player)

            const isFull = isFullArmor(armors, moltenKnightArmor)
            const target = isFull ? "add" : "remove"

            player.triggerEvent(`armor:${target}_molten_knight`)

            if (isFull) {
                if (!player.hasTag("has_full_molten_knight")) {
                    player.addTag("has_full_molten_knight")

                    world.sendMessage("§cWARNING: CRITICALLY HIGH LEVELS OF HEAT DETECTED")
                    // player.runCommand("playsound boss_theme")
                    player.dimension.spawnEntity("minecraft:lightning_bolt", player.location)
                    player.getComponent("minecraft:health").setCurrentValue(player.getComponent("minecraft:health").currentValue+40);
                    player.healthLevel = 3;
                }
                let location = player.location
                const view = player.getViewDirection()
                const distance = 1.0
                const flyDirection = {}
                flyDirection.x = view.x * distance
                flyDirection.y = view.y * distance
                flyDirection.z = view.z * distance
                

                player.addEffect("minecraft:speed", 20000000, { amplifier: 1, showParticles: false })
                player.addEffect("minecraft:strength", 20000000, { amplifier: 2, showParticles: false })
                player.addEffect("minecraft:fire_resistance", 20000000, { amplifier: 1, showParticles: false })
                if (player.healthLevel === undefined) {
                    player.healthLevel = 3;
                }

                if (playerHealth <= 2 && player.healthLevel === 1) {
                    world.sendMessage("§cHealth: Depleted");
                    player.healthLevel = 0;

                } else if (playerHealth <= 20 && player.healthLevel === 2) {
                    world.sendMessage("§6Health: Critical");
                    player.healthLevel = 1;

                } else if (playerHealth <= 40 && player.healthLevel === 3) {
                    world.sendMessage("§eHealth: Moderate");
                    player.healthLevel = 2;
                }
                if (player.isJumping) {
                    if (player.cooldownJumpTicks > 0) {
                        player.cooldownJumpTicks--
                        return
                    }
                    player.jumpTicks++
                    if (player.jumpTicks <= 5 * 20) {
                        player.applyKnockback(flyDirection.x, flyDirection.z, 0.3, 0.4)
                        if (!player.hasTag("has_molten_explosion")) player.addTag("has_molten_explosion")
                    } else {
                        player.cooldownJumpTicks = 3 * 20
                    }

                } else if (player.isOnGround) {
                    if (player.hasTag("has_molten_explosion")) {
                        player.cooldownJumpTicks = 3 * 20;

                        player.explosionLevel = Math.max(0, Math.floor(player.jumpTicks / 12));
                        console.warn("explosionLevel:", player.explosionLevel);

                        dimension.createExplosion(player.location, player.explosionLevel, { source: player });

                        
                        dimension.spawnParticle("runes:basic_flame_particle", player.location);
                        player.removeTag("has_molten_explosion");
                    }

                    player.jumpTicks = 0;
                    if (player.cooldownJumpTicks > 0) {
                        player.cooldownJumpTicks--;
                    }

                    if (player.isSneaking) {
                        if (player.cooldownSneakingTicks > 0) {
                            player.sneakingTicks = 0;
                        } else {
                            player.sneakingTicks++;
                            if (player.sneakingTicks % 20 === 1) {
                                dimension.spawnParticle("runes:campfire_smoke_particle", player.location);
                                dimension.spawnParticle("runes:basic_flame_particle", player.location);
                            }

                            if (player.sneakingTicks >= 3 * 20) {
                                player.cooldownSneakingTicks = 30 * 20;
                                player.addEffect("levitation", 10 * 20, { amplifier: 3, showParticles: false });

                                if (!player.hasTag("has_molten_sneak_used")) player.addTag("has_molten_sneak_used");
                            }
                        }
                    } else {
                        player.sneakingTicks = 0;
                    }

                } else {
                    if (player.cooldownSneakingTicks > 0) {
                        player.cooldownSneakingTicks--;

                        if (player.cooldownSneakingTicks === 29 * 20) {
                            player.sneakingTicks = 0;
                            player.camera.fade({
                                fadeColor: { red: 1, green: 1, blue: 0 },
                                fadeTime: { fadeInTime: 0.1, fadeOutTime: 0.1, holdTime: 2.1 }
                            });
                        }

                        if (player.cooldownSneakingTicks === 26 * 20) {
                            player.camera.fade({
                                fadeColor: { red: 1, green: 0.7, blue: 0 },
                                fadeTime: { fadeInTime: 0.1, fadeOutTime: 0.1, holdTime: 2.1 }
                            });
                        }

                        if (player.cooldownSneakingTicks === 23 * 20) {
                            player.camera.fade({
                                fadeColor: { red: 1, green: 0, blue: 0 },
                                fadeTime: { fadeInTime: 0.1, fadeOutTime: 0.1, holdTime: 2.1 }
                            });
                        }

                        if (player.cooldownSneakingTicks === 20 * 20) {
                            dimension.playSound("random.explode", player.location)
                            dimension.spawnParticle("runes:massive_flame_particle", player.location);
                            dimension.spawnParticle("runes:massive_fire_particle", player.location);
                            dimension.getEntities({ location: player.location, maxDistance: 50 }).forEach(entity => {
                                if (entity.nameTag === player.nameTag) return;
                                dimension.playSound("random.explode", entity.location)

                                entity.setOnFire(20)
                                entity.applyDamage(40, {
                                    cause: "fire",
                                    damagingEntity: player
                                })
                            })
                            player.addEffect("slowness", 3 * 20, { amplifier: 10 })
                        }
                    }
                }
            } else if (player.hasTag("has_full_molten_knight")) {
                player.removeEffect("minecraft:speed")
                player.removeEffect("minecraft:strength")
                player.removeEffect("minecraft:fire_resistance")
                player.removeTag("has_full_molten_knight")
                player.triggerEvent("default_player")
                player.removeTag("has_molten_send_message")
            }
        })

        isRunning = false
    })
})