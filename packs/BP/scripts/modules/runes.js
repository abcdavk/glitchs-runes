import { system, world, Player, Entity, ItemTypes, EntityDamageCause } from '@minecraft/server'
import events from "./events.js"

const runes = {}

/**
 * @type {Object.<string, {
    id: string,
    itemId: string,
    displayName: string,
    onDamage (data: { player: Player, enemy: Entity, cause: EntityDamageCause }) => void,
    onDamaged (data: { player: Player, enemy: Entity, cause: EntityDamageCause }) => void,
    onShoot (data: { player: Player, projectile: Entity, enemy: Entity }) => void,
    onKilling (data: { player: Player, enemy: Entity, cause: EntityDamageCause }) => void,
    onDoubleJump: (data: { player: Player, locationBeforeJump: {x: number, y: number, z: number} setCooldown: (seconds: number) => void }) => void,
    onSneak: (data: { player: Player, setCooldown: (seconds: number) => void }) => void,
    beforeEffectAdd: (data: { cancel: boolean, duration: number, effectType: string, player: Player }) => void,
    onDie: (data: {  player: Player }) => void,
    passive: (data: { player: Player }) => void,
    onRuneAdded: (data: { player: Player }) => void,
    onRuneRemove: (data: { player: Player }) => void
}>}
 */
runes.registeredRune = {}

/**
 * @param {{
    id: string,
    itemId: string,
    displayName: string,
    onDamage (data: { player: Player, enemy: Entity, cause: EntityDamageCause }) => void,
    onDamaged (data: { player: Player, enemy: Entity, cause: EntityDamageCause }) => void,
    onShoot (data: { player: Player, projectile: Entity, enemy: Entity }) => void,
    onKilling (data: { player: Player, enemy: Entity, cause: EntityDamageCause }) => void,
    onDoubleJump: (data: { player: Player, locationBeforeJump: {x: number, y: number, z: number} setCooldown: (seconds: number) => void }) => void,
    onSneak: (data: { player: Player, setCooldown: (seconds: number) => void }) => void,
    beforeEffectAdd: (data: { cancel: boolean, duration: number, effectType: string, player: Player }) => void,
    onDie: (data: {  player: Player }) => void,
    passive: (data: { player: Player }) => void,
    onRuneAdded: (data: { player: Player }) => void,
    onRuneRemove: (data: { player: Player }) => void
}} data
 */
runes.registerPower = (data) => {
    try {
        data.itemId = ItemTypes.get(data.itemId).id
        runes.registeredRune[data.id] = data
        // console.log(`Registered ${data.displayName} rune.`)
    } catch (e) {
        console.log(`Error registering ${data.displayName} rune.`)
    }
}

/**
 * @param {Player} player
 */
runes.getPlayerRune = (player) => {
    const rune = player.getDynamicProperty("playerRune")
    return Object.keys(runes.registeredRune).find(r => r == rune)
}

/**
 * @param {Player} player
 * @param {string} runeId
 */
runes.setPlayerRune = (player, runeId) => {
    world.setDynamicProperty(runeId, player.name)
    player.setDynamicProperty("playerRune", runeId)

    const runeData = runes.registeredRune[runeId]
    if (runeData.onRuneAdded) runeData.onRuneAdded({ player })
}

/**
 * @param {Player} player
 */
runes.resetPlayerRune = (player) => {
    const playerRune = runes.getPlayerRune(player)
    if (playerRune) {
        const runeData = runes.registeredRune[playerRune]
        world.setDynamicProperty(runeData.id)
        player.setDynamicProperty("playerRune")

        if (runeData.onRuneRemove) runeData.onRuneRemove({ player })
        player.triggerEvent("runes:default")
    }
}

/**
 * @param {string} runeId
 */
runes.isRuneUsed = (runeId) => {
    return world.getDynamicProperty(runeId) != undefined
}

world.afterEvents.entityHurt.subscribe((data) => {
    if (data.damageSource.damagingEntity instanceof Player) {
        const player = data.damageSource.damagingEntity
        const enemy = data.hurtEntity

        const playerRune = runes.getPlayerRune(player)
        if (playerRune) {
            const runeData = runes.registeredRune[playerRune]
            if (runeData.onDamage) runeData.onDamage({ player, enemy, cause: data.damageSource.cause })
        }
    } else if (data.hurtEntity instanceof Player) {
        const player = data.hurtEntity
        const enemy = data.damageSource.damagingEntity

        const playerRune = runes.getPlayerRune(player)
        if (playerRune) {
            const runeData = runes.registeredRune[playerRune]
            if (runeData.onDamaged) runeData.onDamaged({ player, enemy, cause: data.damageSource.cause })
        }
    }
})

world.afterEvents.projectileHitEntity.subscribe((data) => {
    const { source: player, projectile, hitVector } = data
    if (player instanceof Player) {
        const entityHit = data.getEntityHit()
        if (entityHit) {
            const playerRune = runes.getPlayerRune(player)
            if (playerRune) {
                const runeData = runes.registeredRune[playerRune]
                if (runeData.onShoot) runeData.onShoot({ player, hitVector, projectile, enemy: entityHit.entity })
            }
        }
    }
})

world.afterEvents.entityDie.subscribe((data) => {
    if (data.damageSource.damagingEntity instanceof Player) {
        const player = data.damageSource.damagingEntity
        const enemy = data.deadEntity

        const playerRune = runes.getPlayerRune(player)
        if (playerRune) {
            const runeData = runes.registeredRune[playerRune]
            if (runeData.onKilling) runeData.onKilling({ player, enemy, cause: data.damageSource.cause })
        }
    }
})

events.jumpAfterEvent.subscribe(({ player, locationBeforeJump }) => {
    const playerRune = runes.getPlayerRune(player)
    if (!playerRune) return
    if (player.isFalling && !player.isGliding && !player.doubleJump) {
        player.doubleJump = true
        const runeData = runes.registeredRune[playerRune]
        const setCooldown = (seconds) => {
            player.setDynamicProperty("nextDoubleJump", Date.now() + (seconds * 1000))
        }
        const isCooldown = Date.now() < (player.getDynamicProperty("nextDoubleJump") ?? Date.now())
        player.applyKnockback(0, 0, 0, 0.7)
        if (runeData.onDoubleJump && !isCooldown) runeData.onDoubleJump({ player, locationBeforeJump, setCooldown })

        let runId = system.runInterval(() => {
            if (player.isOnGround) {
                player.doubleJump = false
                return system.clearRun(runId)
            }
        })
    }
})

events.sneakAfterEvent.subscribe(({ player }) => {
    const playerRune = runes.getPlayerRune(player)
    if (playerRune) {
        const runeData = runes.registeredRune[playerRune]
        const setCooldown = (seconds) => {
            player.setDynamicProperty("nextSneak", Date.now() + (seconds * 1000))
        }
        const isCooldown = Date.now() < (player.getDynamicProperty("nextSneak") ?? Date.now())
        if (runeData.onSneak && !isCooldown) runeData.onSneak({ player, setCooldown })
    }
})

world.beforeEvents.effectAdd.subscribe((data) => {
    data.player = data.entity
    if (data.player instanceof Player) {
        const playerRune = runes.getPlayerRune(data.player)
        if (playerRune) {
            const runeData = runes.registeredRune[playerRune]
            if (runeData.beforeEffectAdd) runeData.beforeEffectAdd(data)
        }
    }
})

world.afterEvents.entityDie.subscribe(({ deadEntity: player }) => {
    if (player instanceof Player) {
        const playerRune = runes.getPlayerRune(player)
        if (playerRune) {
            const runeData = runes.registeredRune[playerRune]
            if (runeData.onDie) runeData.onDie({ player })
        }
    }
})

system.runInterval(() => {
    world.getAllPlayers().forEach((player) => {
        if (!player.isValid()) return
        const playerRune = runes.getPlayerRune(player)
        if (playerRune) {
            const runeData = runes.registeredRune[playerRune]
            if (runeData.passive) runeData.passive({ player })
        }
    })
})

world.afterEvents.itemUse.subscribe(({ source: player, itemStack }) => {
    if (player instanceof Player) {
        const runeData = Object.values(runes.registeredRune).find(r => r.itemId == itemStack.typeId)
        if (runeData) {
            if (!runes.isRuneUsed(runeData.id)) {
                if (runes.getPlayerRune(player) != undefined)
                    return player.sendMessage("You already converged with other rune.")

                player.getComponent("inventory").container.setItem(player.selectedSlotIndex)
                runes.setPlayerRune(player, runeData.id)

                world.sendMessage(`${player.name} has converged with ${runeData.displayName}`)
                try { player.triggerEvent(`runes:add_${runeData.id.split(":")[1]}`) } catch (e) { }

                return player.sendMessage("Converged successful.")
            } else {
                return player.sendMessage("This rune already used by someone.")
            }
        } else if (itemStack.typeId == "runes:blank") {
            const playerRune = runes.getPlayerRune(player)
            if (playerRune) {
                const runeData = runes.registeredRune[playerRune]

                player.runCommand("clear @s[m=!1] runes:blank 0 1")
                player.runCommand(`give @s ${runeData.itemId}`)

                runes.resetPlayerRune(player)
                player.sendMessage("Rune stored.")
            }
        }
    }
})

system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity: player }) => {
    if (id === "runes:reset_rune") {
        const playerRune = runes.getPlayerRune(player)
        if (playerRune) {
            runes.resetPlayerRune(player)
            player.sendMessage("Rune reseted.")
        }
    } else if (id === "runes:get_all_runes") {
        const runesItems = Object.values(runes.registeredRune).map(l => l.itemId)
        for (const itemId of runesItems) {
            player.runCommand(`give @s ${itemId}`)
        }

        player.sendMessage("Successful gave runes.")
    }
}, { namespaces: ["runes"] })

world.afterEvents.playerSpawn.subscribe(({ player }) => {
    player.triggerEvent("runes:default")

    const playerRune = runes.getPlayerRune(player)
    if (playerRune) {
        const runeData = runes.registeredRune[playerRune]
        try { player.triggerEvent(`runes:add_${runeData.id.split(":")[1]}`) } catch (e) { }
    }
})

world.afterEvents.worldInitialize.subscribe(() => {
    system.runInterval(() => {
        const e = world.getDimension("overworld").getEntities({ tags: ["TEST"] })[0]
        if (e) {
            e.nameTag = e.getComponent("minecraft:health").currentValue.toString()
        }
    })
})

export default runes