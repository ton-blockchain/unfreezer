# TON Unfreezer

A tool to unfreeze TON contracts that entered the `frozen` state due to running out of gas.

## Why do contracts get frozen?

In TON, every contract that is deployed on-chain needs to pay rent occasionally from its TON coin balance. The more data the contract stores in state, the higher the rent. If the contract is deployed to the masterchain, these costs are significantly higher.

If the contract runs out of gas for rent, it may become frozen. This is a cleanup mechanism that makes sure the system doesn't waste resources unless fees can be paid for consuming these resources.

## What happens during a freeze?

To free resources, both the code cell and the data cell of the frozen contract will be deleted. The system does remember the hashes of these two cells to allow the contract to be recovered in the future. A frozen contract still retains its address and its TON coin balance.

## How can you unfreeze?

To unfreeze a frozen contract, you first need to send it some TON coins for gas so it can pay its rent costs. Then, you need to send it a message that contains the contents of the code cell and the data cell on the moment of freezing. If the contents of both cells match the hashes, the system will recover the contract and use the supplied cells to restore the deleted data.

## What does this tool do?

This tool uses an archive node to find the old values of the code cell and the data cell from before the freeze. Then, the tool sends a message to the frozen contract with some TON coin and the code cell and data cell.
