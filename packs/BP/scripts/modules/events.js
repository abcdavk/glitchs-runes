import { system, world, Player, GameMode, InputButton, ButtonState } from '@minecraft/server'

class EventListener {
    constructor() {
        this.callbacks = [];
    }

    subscribe(callback) {
        this.callbacks.push(callback);
        return callback
    }

    unsubscribe(callback) {
        this.callbacks = this.callbacks.filter(cb => cb !== callback);
    }

    emit(data) {
        this.callbacks.forEach(callback => callback(data));
    }
}

// Jump Event
const jumpEventListener = new EventListener()
const jumpAfterEvent = {}
/**
 * @param {(data: { player: Player, locationBeforeJump: {x: number, y: number, z: number} }) => void} callback
 */
jumpAfterEvent.subscribe = (callback) => {
    return jumpEventListener.subscribe(callback)
}
jumpAfterEvent.unsubscribe = (callback) => {
    jumpEventListener.unsubscribe(callback)
}
world.afterEvents.playerButtonInput.subscribe(({ player }) => {
    jumpEventListener.emit({ player })
}, { buttons: [InputButton.Jump], state: ButtonState.Pressed })

// Sneak Event
const sneakEventListener = new EventListener()
const sneakAfterEvent = {}
/**
 * @param {(data: { player: Player }) => void} callback
 */
sneakAfterEvent.subscribe = (callback) => {
    return sneakEventListener.subscribe(callback)
}
sneakAfterEvent.unsubscribe = (callback) => {
    sneakEventListener.unsubscribe(callback)
}
world.afterEvents.playerButtonInput.subscribe(({ player }) => {
    sneakEventListener.emit({ player })
}, { buttons: [InputButton.Sneak], state: ButtonState.Pressed })

const events = {
    jumpAfterEvent,
    sneakAfterEvent
}

export default events