const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")

developmentChains.includes(network.name)
    ? describe.scip
    : describe("Raffle Unit Test", async function () {
          let raffle, deployer, raffleEntranceFee

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("works with life ChainlinkKeepers and Chainlunk VRF, randomly picks winner", async function () {
                  console.log("Setting up test...")
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()

                  console.log("Setting up Listener...")
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              const recentWinner = await raffle.getRecentWinner()
                              console.log(recentWinner)
                              const winnerEndingBalance = await ethers.provider.getBalance(
                                  accounts[0].address,
                              )
                              console.log(winnerEndingBalance - raffleEntranceFee)
                              console.log(winnerEndingBalance)
                              console.log(winnerStartingBalance + raffleEntranceFee)
                              const endingTimeStamp = await raffle.getLatestTimeStamp()
                              console.log(endingTimeStamp)
                              const raffleState = await raffle.getRaffleState()
                              console.log(raffleState)
                              await expect(raffle.getPlayers(0)).to.be.reverted
                              console.log("assert on players revert done")
                              assert(endingTimeStamp > startingTimeStamp)
                              console.log("assert on timestamp done")
                              assert.equal(raffleState, 0n)
                              console.log("assert on state done")
                              assert.equal(
                                  winnerEndingBalance,
                                  winnerStartingBalance + raffleEntranceFee,
                              )
                              console.log("assert on winnerbalance done")
                              assert.equal(recentWinner, accounts[0].address)
                              console.log("assert on winner address done")
                              resolve()
                              console.log("resolve done")
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      console.log("Entering Raffle...")
                      const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      const winnerStartingBalance = await ethers.provider.getBalance(
                          accounts[0].address,
                      )
                      console.log(winnerStartingBalance)
                  })
              })
          })
      })
