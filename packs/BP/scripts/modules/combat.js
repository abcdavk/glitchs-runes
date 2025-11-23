import { system, Entity, Player } from '@minecraft/server'

/**
 * @type {Map<Entity, number>}
 */
const StunHandlers = new Map()
/**
 * @param {Entity} entity
 * @param {number} seconds
 */
const Stun = (entity, seconds) => {
    const currentStun = StunHandlers.get(entity) ?? system.currentTick
    StunHandlers.set(entity, currentStun + (20 * seconds))
    if (entity instanceof Player) {
        entity.inputPermissions.movementEnabled = false
        entity.inputPermissions.cameraEnabled = false
    } else {
        entity.addEffect("minecraft:slowness", 20, { showParticles: false, amplifier: 10 })
    }
}

system.runInterval(() => {
    StunHandlers.forEach((tick, entity) => {
        if (system.currentTick >= tick) {
            StunHandlers.delete(entity)
            try {
                if (entity instanceof Player) {
                    entity.inputPermissions.movementEnabled = true
                    entity.inputPermissions.cameraEnabled = true
                } else {
                    entity.removeEffect(effect)
                }
            } catch (e) { }
        } else {
            try {
                if (entity instanceof Player) {
                    entity.inputPermissions.movementEnabled = false
                    entity.inputPermissions.cameraEnabled = false
                } else {
                    entity.addEffect("minecraft:slowness", 20, { showParticles: false, amplifier: 10 })
                }
            } catch (e) { }
        }
    })
})

export { Stun }