import { EntityComponentTypes, EquipmentSlot, Player, system, world } from "@minecraft/server";

world.afterEvents.worldInitialize.subscribe(() => {
    // world.afterEvents..subscribe(({ itemStack, source: player }) => {
    //     if (!(player instanceof Player)) return;
    //     if (itemStack.typeId !== "weapons:dismantel_gauntlet") return;

    // });

    world.afterEvents.entityHitEntity.subscribe(({ damagingEntity: player, hitEntity: target }) => {
        if (player instanceof Player) {
            const equippable = player.getComponent(EntityComponentTypes.Equippable)
            const itemHand = equippable.getEquipment(EquipmentSlot.Mainhand)
            if (player.hasTag("has_entity_on_hand")) {
                const view = player.getViewDirection();

                const power = 1.9;

                const impulse = {
                    x: view.x * power,
                    y: view.y * power,
                    z: view.z * power,
                };
                target.applyImpulse(impulse);


                player.removeTag("has_entity_on_hand")
                target.removeTag("has_grab_by_dismantel_gauntlet")
            } else {
                if (itemHand && itemHand.typeId === "weapons:dismantel_gauntlet") {
                    player.addTag("has_entity_on_hand")
                    target.addTag("has_grab_by_dismantel_gauntlet")
                }
            }
        }
    })

    system.runInterval(() => {
        world.getAllPlayers().forEach(player => {
            if (player.hasTag("has_entity_on_hand")) {
                if (player.grabTicks === undefined) player.grabTicks = 0;

                const dimension = player.dimension
                dimension.getEntities({ location: player.location, maxDistance: 5, tags: ["has_grab_by_dismantel_gauntlet"] }).forEach(entity => {
                    if (!entity) return;
                    const view = player.getViewDirection()
                    const targetLocation = {
                        x: player.location.x + view.x * 2,
                        y: player.location.y + 1.2 + view.y * 2,
                        z: player.location.z + view.z * 2,
                    }

                    entity.teleport(targetLocation)
                    if (player.grabTicks > 3 * 20) {
                        player.removeTag("has_entity_on_hand")     
                        entity.removeTag("has_grab_by_dismantel_gauntlet")
                        player.grabTicks = 0;
                    }
                    player.grabTicks++
                })
            }
        })
    })
});
