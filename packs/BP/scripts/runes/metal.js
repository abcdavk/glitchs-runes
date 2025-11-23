import { system } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

runes.registerPower({
    id: "runes:metal",
    itemId: "runes:metal",
    displayName: "Metal",
    onDamage: (({ player, enemy, cause }) => {
        if (cause == "entityAttack")
            enemy.dimension.playSound("random.anvil_land", enemy.location)
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        setCooldown(3)
        const anvilLocation = Vector3Utils.add(
            player.location,
            { x: 0, y: -1, z: 0 }
        )
        const dimension = player.dimension
        const anvil = dimension.getBlock(anvilLocation)
        anvil.setType("minecraft:anvil")
        dimension.playSound("random.anvil_land", player.location)
        const rayCast = dimension.getBlockFromRay(anvil.location, { x: 0, y: -1, z: 0 }, { excludeTypes: ["minecraft:anvil"] })

        if (!rayCast || !rayCast.block) return

        const endTick = system.currentTick + (20 * 15)
        let runId = system.runInterval(() => {
            const above = rayCast.block.above()
            if (above && above.isValid() && system.currentTick < endTick) {
                if (above.typeId.includes("anvil")) {
                    above.setType("minecraft:air")
                    return system.clearRun(runId)
                }
            } else {
                return system.clearRun(runId)
            }
        })
    }),
    onSneak: (({ player, setCooldown }) => {
        const location = player.location
        let runId = system.runInterval(() => {
            if (player.isValid() && player.isSneaking) {
                player.runCommand("tp @e[type=item,r=10] @s")
                player.teleport(location)
                player.addEffect("minecraft:resistance", 20000000, { showParticles: false, amplifier: 3 })
            } else {
                setCooldown(5)
                player.removeEffect("minecraft:resistance")
                return system.clearRun(runId)
            }
        })
    }),
    passive: (({ player }) => {
        player.addEffect("minecraft:resistance", 20000000, { showParticles: false })
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:resistance")
    })
})