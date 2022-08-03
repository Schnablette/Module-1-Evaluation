// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { expect } = require("chai");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  const [deployer, addr1, addr2, addr3, addr4, ...addrs] =
    await ethers.getSigners();

  const Token = await hre.ethers.getContractFactory("Token");
  const initialSupply = hre.ethers.utils.parseEther("1000000");
  const token = await Token.deploy(initialSupply, "Schnabs", "SCH");

  console.log("Token deployed to:", token.address);

  // We get the contract to deploy
  const Staker = await hre.ethers.getContractFactory("Staker3");
  //const staker = await Staker.deploy();
  const staker = await Staker.deploy(token.address, 60 * 24);

  console.log("Staker deployed to:", staker.address);

  const stakerSupply = hre.ethers.utils.parseEther("500000");
  await token.connect(deployer).transfer(staker.address, stakerSupply);

  stakerBalance = await token.balanceOf(staker.address);
  console.log("Staker Balance: ", hre.ethers.utils.formatEther(stakerBalance));

  /// Have three accounts go and stake tokens at different levels
  /// Have a few try to pull out early and fail
  /// Stake too much and too little

  await staker
    .connect(addr1)
    .stake({ value: hre.ethers.utils.parseEther("1") });

  await hre.network.provider.send("evm_increaseTime", [60 * 60 * 24 * 7]);

  await staker
    .connect(addr2)
    .stake({ value: hre.ethers.utils.parseEther("1") });

  await hre.network.provider.send("evm_increaseTime", [60 * 60 * 24 * 7]);

  await staker
    .connect(addr3)
    .stake({ value: hre.ethers.utils.parseEther("1") });

  await hre.network.provider.send("evm_increaseTime", [60 * 60 * 24 * 7]);

  await staker
    .connect(addr4)
    .stake({ value: hre.ethers.utils.parseEther("1") });

  console.log("Added all stakes with not errors!");

  /// Forward time 12 hours
  await hre.network.provider.send("evm_increaseTime", [60 * 60 * 12]);

  /// Have a few accounts try to pull out and fail
  await expect(staker.connect(addr4).withdrawStake()).to.be.revertedWith(
    "Cannot Withdraw Yet"
  );
  // await expect(staker.connect(addr2).withdrawReward()).to.be.revertedWith(
  //   "Cannot Withdraw Yet"
  // );
  await expect(
    staker.connect(addr3).stake({ value: hre.ethers.utils.parseEther("1") })
  ).to.be.revertedWith("You cannot stake!");

  console.log("12 Hours Passed and cannot withdraw, continuing...");

  /// Forward time by another 12 hours
  await hre.network.provider.send("evm_increaseTime", [60 * 60 * 24]);
  await hre.network.provider.send("evm_mine");

  /// Have every pull out everything
  await staker.connect(addr1).withdrawStake();
  await staker.connect(addr1).withdrawReward();

  await staker.connect(addr2).withdrawStake();
  await expect(
    staker.connect(addr2).stake({ value: hre.ethers.utils.parseEther("1") })
  ).to.be.revertedWith("You cannot stake!");
  await staker.connect(addr2).withdrawReward();

  await staker.connect(addr3).withdrawReward();
  await expect(
    staker.connect(addr3).stake({ value: hre.ethers.utils.parseEther("1") })
  ).to.be.revertedWith("You cannot stake!");
  await staker.connect(addr3).withdrawStake();

  await staker.connect(addr4).withdrawReward();
  await staker.connect(addr4).withdrawStake();

  console.log("Able to withdraw all funds");

  // Try to re-withdraw
  await expect(staker.connect(addr1).withdrawStake()).to.be.revertedWith(
    "No Value to Unstake"
  );
  await expect(staker.connect(addr1).withdrawReward()).to.be.revertedWith(
    "No Stake Reward to Claim"
  );

  console.log("Could not re-withdraw");

  /// Check balances of people
  tbaddr1 = await token.balanceOf(addr1.address);
  tbaddr2 = await token.balanceOf(addr2.address);
  tbaddr3 = await token.balanceOf(addr3.address);
  tbaddr4 = await token.balanceOf(addr4.address);

  expect(tbaddr1).to.equal(hre.ethers.utils.parseEther("100"));
  console.log("equaled 100");
  expect(tbaddr2).to.equal(hre.ethers.utils.parseEther("50"));
  console.log("equaled 50");
  expect(tbaddr3).to.equal(hre.ethers.utils.parseEther("25"));
  console.log("equaled 25");
  expect(tbaddr4).to.equal(hre.ethers.utils.parseEther("15"));
  console.log("equaled 15");

  console.log("Token values match expected!");

  /// Have one person restake
  await staker
    .connect(addr1)
    .stake({ value: hre.ethers.utils.parseEther("1") });

  console.log("Address able to re-stake.");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
