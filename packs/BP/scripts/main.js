import { ItemTypes, system, world } from '@minecraft/server'
import "./grand_widow_armor"
import "./molten_knight_armor"
import "./crescent_rose"

const runes = ItemTypes.getAll()
	.filter(i => i.id.startsWith("runes:"))
	.filter(i => i.id !== "runes:blank")
	.sort((a, b) => a.id.localeCompare(b.id))

for (const type of runes) {
	import(`./runes/${type.id.split(":")[1]}`)
		.catch((e) => {
			console.error(`Error when load: ${type.id} | ${e}`)
		})
}

console.log("Loaded.")

// DEBUG CODE
const log = console.log
console.log = (...args) => log("[Glitch's Rune]", ...args)

const warn = console.warn
console.warn = (...args) => warn("[Glitch's Rune]", ...args)

const error = console.error
console.error = (...args) => error("[Glitch's Rune]", ...args)