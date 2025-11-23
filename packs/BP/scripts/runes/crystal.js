import { system, Block, Player, ItemStack, EquipmentSlot, MolangVariableMap } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

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

runes.registerPower({
    id: "runes:crystal",
    itemId: "runes:crystal",
    displayName: "Crystal",
    onDamage: (({ player, enemy, cause }) => {
        if (cause == "entityAttack")
            enemy.dimension.playSound("random.glass", enemy.location)
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        const playerLocation = player.location;
        const viewDirection = player.getViewDirection();

        const baseLocation = Vector3Utils.add(
            playerLocation,
            {
                x: viewDirection.x * 3,
                y: 2,
                z: viewDirection.z * 3
            }
        );

        setCooldown(7)
        const entities = player.dimension.getEntities({
            location: baseLocation,
            maxDistance: 5,
        }).filter(p => p != player)

        entities.forEach((e) => {
            try {
                e.applyKnockback(
                    viewDirection.x,
                    viewDirection.z,
                    2,
                    0
                )
            } catch (e) { }
        })

        player.dimension.playSound("chime.amethyst_block", baseLocation)
        const isLookingAlongX = Math.abs(viewDirection.x) > Math.abs(viewDirection.z);
        /** @type {Block[]} */
        const blocks = []
        for (let offset = -1; offset <= 1; offset++) {
            const blockLocation = Vector3Utils.add(
                baseLocation,
                {
                    x: isLookingAlongX ? 0 : offset,
                    y: 0,
                    z: isLookingAlongX ? offset : 0
                }
            )

            const rayCast = player.dimension.getBlockFromRay(
                blockLocation,
                { x: 0, y: -1, z: 0 },
                { maxDistance: 10 }
            );

            if (rayCast && rayCast.block) {
                let above = rayCast.block.above();
                for (let i = 0; i < 3; i++) {
                    if (!above.isAir) break;
                    blocks.push(above)
                    above.setType("minecraft:amethyst_block");
                    above = above.above();
                }
            }
        }

        system.runTimeout(() => {
            blocks.forEach((b) => b.setType("minecraft:air"))
        }, 20 * 6)
    }),
    onSneak: (({ player, setCooldown }) => {
        setCooldown(7)

        const random = (min, max) => Math.random() * (max - min) + min

        player.addEffect("minecraft:resistance", 20 * 5, { amplifier: 2, showParticles: false })
        player.addEffect("minecraft:regeneration", 20 * 5, { amplifier: 3, showParticles: false })

        for (let i = 0; i < 20; i++) {
            const molang = new MolangVariableMap()
            molang.setColorRGB("orb_color", {
                red: Math.random(),
                green: Math.random(),
                blue: Math.random()
            })
            player.dimension.spawnParticle(
                "runes:crystal_orb",
                Vector3Utils.add(
                    player.location,
                    {
                        x: random(-0.75, 0.75),
                        y: random(0, 2),
                        z: random(-0.75, 0.75)
                    }
                ),
                molang
            )
        }

        player.dimension.playSound("beacon.power", player.location)
    }),
    passive: (({ player }) => {
        const armors = Object.values(getArmors(player))
        const isUsingDiamond = armors.find(i => i.typeId.startsWith("minecraft:diamond"))
        const isUsingNetherite = armors.find(i => i.typeId.startsWith("minecraft:netherite"))
        const isUsingIron = armors.find(i => i.typeId.startsWith("minecraft:iron"))
        const isUsingGold = armors.find(i => i.typeId.startsWith("minecraft:gold"))

        if (isUsingDiamond) {
            player.addEffect("minecraft:strength", 20000000, { amplifier: 1, showParticles: false })
        }

        if (isUsingNetherite) {
            player.addEffect("minecraft:resistance", 20000000, { amplifier: 1, showParticles: false })
        }

        if (isUsingIron) {
            player.addEffect("minecraft:speed", 20000000, { amplifier: 1, showParticles: false })
        }

        if (isUsingGold) {
            player.addEffect("minecraft:haste", 20000000, { amplifier: 1, showParticles: false })
        }
    }),
    onRuneRemove: (({ player }) => {
        player.removeEffect("minecraft:strength")
        player.removeEffect("minecraft:resistance")
        player.removeEffect("minecraft:speed")
        player.removeEffect("minecraft:haste")
    })
})