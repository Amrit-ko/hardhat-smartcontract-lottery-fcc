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
              isCallTrace(
                  "works with life ChainlinkKeepers and Chainlunk VRF, randomly picks winner",
                  async () => {
                      const startingTimeStamp = await raffle.getLatestTimeStamp()
                      const accounts = await ethers.getSigners()

                      await new Promise(async (resolve, reject) => {
                          raffle.once("WinnerPicked", async () => {
                              console.log("WinnerPicked event fired!")
                              try {
                                  const recentWinner = await raffle.getRecentWinner()
                                  const winnerEndingBalance = await ethers.provider.getBalance(
                                      accounts[0].address,
                                  )
                                  const endingTimeStamp = await raffle.getLatestTimeStamp()
                                  const raffleState = await raffle.getRaffleState()
                                  await expect(raffle.getPlayers(0)).to.be.reverted
                                  assert(endingTimeStamp > startingTimeStamp)
                                  assert.equal(raffleState, 0n)
                                  assert.equal(
                                      winnerEndingBalance,
                                      winnerStartingBalance + raffleEntranceFee,
                                  )
                                  assert.equal(recentWinner, accounts[0].address)
                                  resolve()
                              } catch (error) {
                                  console.log(error)
                                  reject(error)
                              }
                          })
                          await raffle.enterRaffle({ value: raffleEntranceFee })
                          const winnerStartingBalance = await ethers.provider.getBalance(
                              accounts[0].address,
                          )
                      })
                  },
              )
          })
      })
