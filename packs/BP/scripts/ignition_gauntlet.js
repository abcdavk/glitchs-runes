import { Player, world } from "@minecraft/server";

world.afterEvents.worldInitialize.subscribe(() => {
    world.afterEvents.itemUse.subscribe(({ itemStack, source: player }) => {

        if (!(player instanceof Player)) return;
        if (itemStack.typeId !== "weapons:ignition_gauntlet") return;

        const dimension = player.dimension;
        const view = player.getViewDirection();
        const origin = player.location;

        const distance = 1;

        const spawnLocation = {
            x: origin.x + view.x * distance,
            y: origin.y + 1.2 + view.y * distance,
            z: origin.z + view.z * distance
        };

        const fireball = dimension.spawnEntity("weapons:fireball", spawnLocation);

        const power = 1.3;

        const impulse = {
            x: view.x * power,
            y: view.y * power,
            z: view.z * power,
        };

        fireball.applyImpulse(impulse);
    });

    world.afterEvents.entityHitEntity.subscribe(({ damagingEntity: player, hitEntity: target }) => {
        if (!player instanceof Player) return
        if (target.typeId === "weapons:fireball") {
            const view = player.getViewDirection();

            const power = 4;

            const impulse = {
                x: view.x * power,
                y: view.y * power,
                z: view.z * power,
            };

            target.triggerEvent("minecraft:super")
            target.applyImpulse(impulse);
        }
    })
});
