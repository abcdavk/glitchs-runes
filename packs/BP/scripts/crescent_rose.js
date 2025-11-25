import { world, system, Player } from "@minecraft/server"
import { Vector3Utils } from "./modules/minecraft-math.js"

world.afterEvents.worldInitialize.subscribe(() => {
    world.afterEvents.itemUse.subscribe(({ itemStack, source: player }) => {
        if (!player instanceof Player) return
        if (itemStack.typeId === "weapons:crescent_rose") {
            if (itemStack.getComponent("cooldown").getCooldownTicksRemaining(player) > 0) return
            itemStack.getComponent("cooldown").startCooldown(player)

            const view = player.getViewDirection()

            player.addEffect("minecraft:invisibility", 20 * 4, { showParticles: false })
            player.applyKnockback(
                view.x,
                view.z,
                player.isOnGround ? 10 : 4,
                view.y * 1
            )

            let runId = system.runInterval(() => {
                const view = player.getViewDirection()
                const normalizedDirection = Vector3Utils.normalize(view)
                const offset = 0.5
                const particleLocation = Vector3Utils.subtract(player.location, {
                        x: normalizedDirection.x * offset,
                        y: -0.25,
                        z: normalizedDirection.z * offset
                    })
                player.dimension.spawnParticle("weapons:crescent_particle", particleLocation)
            })
            system.runTimeout(() => system.clearRun(runId), 20 * 4)
        }
    })
})