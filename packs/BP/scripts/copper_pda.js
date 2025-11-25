import { EntityComponentTypes, Player, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui"
world.afterEvents.worldInitialize.subscribe(() => {
    world.afterEvents.itemUse.subscribe(({ itemStack, source: player }) => {
        if (!player instanceof Player) return;
        const inv = player.getComponent(EntityComponentTypes.Inventory)
        const con = inv.container
        
        let countCopper = 0
        
        for (let i = 0; i < inv.inventorySize; i++) {
            let itemInv = con.getItem(i)
            if (itemInv && itemInv.typeId === "minecraft:copper_ingot") {
                countCopper += itemInv.amount
            }
        }


        if (itemStack.typeId === "kit:copper_pda") {
            const form = new ActionFormData()
                .title("Copper PDA")
                .body(`§vCopper Amount: §r${countCopper}\n\n`)
                .button("Control Panel")
                .button("Shop")
            form.show(player).then(res => {

            })
        }        
    });
});

function showControlPanel() {

}

const copperShopList = [
    {
        item: "copper_chainsaw",
        title: "Copper Chainsaw",
        cost: 256
    }
]

function showShop() {
    const form = new ActionFormData()
        .title("Copper PDA - Shop")
        .body(`§vCopper Amount: §r${countCopper}\n\n`)
        .button("Control Panel")
        .button("Shop")
    form.show(player).then(res => {

    })
}