import { world, system, Player, ItemStack, ItemLockMode, EquipmentSlot } from '@minecraft/server'
import runes from "../modules/runes.js"
import { Vector3Utils } from "../modules/minecraft-math.js"

const EnergyWeapons = [
    "runes_weapons:energy_sword",
    "runes_weapons:energy_bow",
    "runes_weapons:energy_totem"
]

/**
 * @param {Player} player
 */
const giveWeapon = (player) => {
    const currentIndexWeapon = player.getDynamicProperty("energy_weapons")
    let nextIndexWeapon = currentIndexWeapon != undefined ? currentIndexWeapon + 1 : 0
    if (nextIndexWeapon >= EnergyWeapons.length) nextIndexWeapon = 0

    EnergyWeapons.forEach((i) => player.runCommand(`clear @s ${i}`))

    const container = player.getComponent("inventory").container
    if (container.emptySlotsCount <= 0)
        return player.onScreenDisplay.setActionBar("Inventory full, change weapon failed.")

    const weapon = new ItemStack(EnergyWeapons[nextIndexWeapon])
    weapon.lockMode = ItemLockMode.inventory
    weapon.keepOnDeath = true

    container.addItem(weapon)

    player.setDynamicProperty("energy_weapons", nextIndexWeapon)
    return player.onScreenDisplay.setActionBar("Weapon changed.")
}

runes.registerPower({
    id: "runes:energy",
    itemId: "runes:energy",
    displayName: "Energy",
    onDamage: (({ player, enemy, cause }) => {
        if (cause == "entityAttack") {
            enemy.dimension.playSound("laser_blast", enemy.location)
        }
    }),
    onDoubleJump: (({ player, setCooldown }) => {
        setCooldown(1)

        player.applyKnockback(0, 0, 0, 1)
        let runId = system.runInterval(() => {
            if (player.isValid() && !player.isOnGround && (!player.isFlying && !player.isGliding)) {
                player.addEffect("minecraft:slow_falling", 20, { showParticles: false })
                player.dimension.spawnParticle("runes:energy_orb", player.location)
                player.dimension.spawnParticle("runes:energy_orb", player.location)
            } else {
                player.removeEffect("minecraft:slow_falling")
                return system.clearRun(runId)
            }
        })
    }),
    onSneak: (({ player, setCooldown }) => {
        giveWeapon(player)
    }),
    passive: (({ player }) => {
        if (player.isSprinting) {
            player.addEffect("minecraft:speed", 20, { showParticles: false })
        }
        player.runCommand("enchant @s unbreaking 3")
    }),
    onRuneAdded: (({ player }) => {
        giveWeapon(player)
    }),
    onRuneRemove: (({ player }) => {
        player.runCommand("clear @s runes_weapons:energy_sword")
        player.runCommand("clear @s runes_weapons:energy_bow")
        player.runCommand("clear @s runes_weapons:energy_totem")
    })
})

// Energy Sword
world.afterEvents.itemUse.subscribe(({ source: player, itemStack }) => {
    if (runes.getPlayerRune(player) !== "runes:energy") return
    if (itemStack.typeId === "runes_weapons:energy_sword") {
        const nextCooldown = player.getDynamicProperty("energy_swordCooldown") ?? 0

        if (Date.now() < nextCooldown) return
        player.setDynamicProperty("energy_swordCooldown", Date.now() + 5000)
        const view = player.getViewDirection()

        let force = 10
        if (!player.isOnGround) force = 5

        player.applyKnockback(view.x, view.z, force, 0)

        const entities = []
        let runId = system.runInterval(() => {
            const location = player.location
            location.y += 1
            player.dimension.spawnParticle("runes:energy_orb", location)

            player.dimension.playSound("lightsaber_swing", player.location)
            player.dimension.getEntities({
                location: location,
                maxDistance: 2,
            }).filter(p => p != player && p.getComponent("minecraft:health") != undefined && !entities.includes(p.id))
                .forEach((e) => {
                    entities.push(e.id)
                    e.applyDamage(5, { cause: "magic", damagingEntity: player })
                    e.applyKnockback(view.x, view.z, 1, 0.5)
                })
        })

        system.runTimeout(() => system.clearRun(runId), 5)
    }
})

// Energy Bow
const holdItem = {}
world.afterEvents.itemStartUse.subscribe(({ source }) => {
    holdItem[source.id] = Date.now()
})

world.afterEvents.itemReleaseUse.subscribe(({ source: player, itemStack }) => {
    if (runes.getPlayerRune(player) !== "runes:energy") return
    if (itemStack.typeId === "runes_weapons:energy_bow") {
        const view = player.getViewDirection()
        const head = player.getHeadLocation()
        let holdingTime = Date.now() - (holdItem[player.id] ?? Date.now())

        const minInput = 150
        const maxInput = 1000
        const minOutput = 1
        const maxOutput = 20

        if (holdingTime < minInput) return
        if (holdingTime > maxInput) holdingTime = maxInput

        const resultRange = Math.floor(((holdingTime - minInput) * (maxOutput - minOutput)) / (maxInput - minInput) + minOutput);

        const entities = []
        player.dimension.playSound("mob.warden.sonic_boom", player.location)
        for (let i = 0; i < resultRange; i++) {
            const range = i + 1
            const particleLocation = Vector3Utils.add(
                head,
                {
                    x: view.x * range,
                    y: view.y * range,
                    z: view.z * range
                }
            )

            player.dimension.spawnParticle(
                "minecraft:sonic_explosion",
                particleLocation
            )

            player.dimension.getEntities({
                location: particleLocation,
                maxDistance: 3,
            }).filter(p => p != player && p.getComponent("minecraft:health") != undefined && !entities.includes(p.id))
                .forEach((e) => {
                    entities.push(e.id)
                    e.applyDamage(12, { cause: "magic", damagingEntity: player })
                    e.applyKnockback(view.x, view.z, 2, 0.5)
                })
        }
    }
})

/**
 * @param {Player} player
 * @returns {ItemStack[]}
 */
const getUsedWeapon = (player) => {
    const equippable = player.getComponent("minecraft:equippable")
    const slots = [EquipmentSlot.Mainhand, EquipmentSlot.Offhand]

    const armors = []
    for (const slot of slots) {
        const armor = equippable.getEquipment(slot)
        if (armor) armors.push(armor)
    }

    return armors
}

const entities = []
const cooldown = {}
let isRunning = false

function* spawnShield(player, distance) {
    const edgeDistance = distance - (distance * 0.25)

    const forceFieldLocation = [
        { x: 0, y: 0, z: distance },
        { x: -edgeDistance, y: 0, z: edgeDistance },
        { x: -distance, y: 0, z: 0 },
        { x: -edgeDistance, y: 0, z: -edgeDistance },
        { x: 0, y: 0, z: -distance },
        { x: edgeDistance, y: 0, z: -edgeDistance },
        { x: distance, y: 0, z: 0 },
        { x: edgeDistance, y: 0, z: edgeDistance }
    ]

    const yLocations = [0, 1, 1.75]
    for (let yLocation of yLocations) {
        forceFieldLocation.forEach((l) => {
            const location = Vector3Utils.add(
                player.location,
                { x: l.x, y: yLocation, z: l.z }
            )
            player.dimension.spawnParticle("runes:energy_shield", location)
        })
    }
    player.dimension.playSound("beacon.ambient", player.location)

    yield
}

system.runInterval(() => {
    if (isRunning) return
    isRunning = true
    const players = world.getPlayers().filter((p) => runes.getPlayerRune(p) === "runes:energy")

    for (const player of players) {
        if (getUsedWeapon(player).find(i => i.typeId === "runes_weapons:energy_totem")) {
            const distance = 1.5
            const edgeDistance = distance - (distance * 0.25)

            if (system.currentTick >= (cooldown[player.id] ?? 0)) {
                system.runJob(spawnShield(player, distance))
                // cooldown[player.id] = system.currentTick + 20
            }

            player.dimension.getEntities({
                location: player.location,
                maxDistance: distance + (distance * 0.5),
            }).filter(e => !entities.includes(e.id))
                .forEach((e) => {
                    if (e != player && e.getComponent("minecraft:projectile") != undefined) {
                        console.log(Object.values(e.getVelocity()).join(" "))
                        e.clearVelocity()
                        entities.push(e.id)
                    }
                    if (e instanceof Player) {
                        e.addEffect("minecraft:resistance", 20, { amplifier: 1, showParticles: false })
                        e.addEffect("minecraft:regeneration", 20, { amplifier: 2, showParticles: false })
                    }
                })
        }
    }

    isRunning = false
})