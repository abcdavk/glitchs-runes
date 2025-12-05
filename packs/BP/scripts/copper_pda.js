import { EntityComponentTypes, ItemStack, Player, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui"

function getCopperAmount(player) {
    const inv = player.getComponent(EntityComponentTypes.Inventory)
    const con = inv.container
    
    let countCopper = 0
    
    for (let i = 0; i < inv.inventorySize; i++) {
        let itemInv = con.getItem(i)
        if (itemInv && itemInv.typeId === "minecraft:copper_ingot") {
            countCopper += itemInv.amount
        }
    }

    return countCopper
}

world.afterEvents.worldInitialize.subscribe(() => {
    world.afterEvents.itemUse.subscribe(({ itemStack, source: player }) => {
        if (!player instanceof Player) return;
        
        const countCopper = getCopperAmount(player) 

        if (itemStack.typeId === "kit:copper_pda") {
            const form = new ActionFormData()
                .title("Copper PDA")
                .body(`§vCopper Amount: §r${countCopper}\n\n`)
                .button("Control Panel")
                .button("Shop")
            form.show(player).then(res => {
                switch (res.selection) {
                    case 0:
                        
                        break;
                    case 1:
                        showShop(player)
                        break;
                
                    default:
                        break;
                }
            })
        }        
    });
});

function showControlPanel() {

}

const copperShopList = [
    {
        item: "weapons:copper_chainsaw",
        title: "Copper Chainsaw",
        cost: 256
    },
    {
        item: "weapons:copper_cannon",
        title: "Copper Cannon",
        cost: 256
    },
    {
        item: "weapons:copper_saber",
        title: "Copper Saber",
        cost: 320
    },
    {
        item: "weapons:copper_blaster",
        title: "Copper Blaster",
        cost: 320
    },
    {
        item: "weapons:statue_kit",
        title: "Statue Kit",
        cost: 64
    },
    {
        item: "weapons:swordsmachine_kit",
        title: "Swordsmachine Kit",
        cost: 128
    },
    {
        item: "weapons:drone_kit",
        title: "Drone Kit",
        cost: 32
    },
    {
        item: "weapons:golem_kit",
        title: "Golem Kit",
        cost: 640
    }
]

function removeCopper(player, cost) {
    player.runCommand(`clear @s copper_ingot 0 ${cost}`)
}

function showShop(player) {
    const countCopper = getCopperAmount(player);
    const dimension = player.dimension

    const form = new ActionFormData()
        .title("Copper PDA - Shop")
        .body(`§vCopper Amount: §r${countCopper}\n\n`);

    copperShopList.forEach(item => {
        form.button(`${item.title}\n§vCost: ${item.cost}`);
    });

    form.show(player).then(res => {
        if (!res) return;

        if (res.canceled || res.selection === undefined) return;

        const selectedIndex = res.selection;
        const shopItem = copperShopList[selectedIndex];

        if (!shopItem) return;

        if (countCopper < shopItem.cost) {
            player.sendMessage("§cYou don't have enough copper ingot!");
            return;
        }

        removeCopper(player, shopItem.cost); 
        dimension.spawnItem(new ItemStack(shopItem.item, 1), player.location)

        player.sendMessage(`§aPurchased §r${shopItem.title}§a for ${shopItem.cost} copper!`);
    });
}
