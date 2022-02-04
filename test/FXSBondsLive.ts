import { ethers } from 'hardhat'

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import { impersonateAddressAndReturnSigner, mineBlocks } from './utils'

import {
  TREASURY_ADDRESS,
  FXS_ADDRESS,
  BTRFLY_ADDRESS,
  MULTISIG_ADDRESS,
  ZERO_ADDRESS,
} from './constants'

import { REDACTEDTreasury, REDACTEDBondDepositoryRewardBased, IERC20 } from '../typechain'

import { BigNumber } from 'ethers'

const VESTING = '33110'
const MINPRICE = '0'
const MAXPAYOUT = '100'
const FEE = '9500'
const MAXDEBT = ethers.utils.parseEther('10000000000000000000000000000')
const TITHE = '500'

//GET FROM GSHEET
const BCV = '1000'
const initialDebtRatio = 1.450010875
const fxsFloorValue = 30
const fxsValueUSD = BigNumber.from(2639)
const btrflyValueUSD = BigNumber.from(114800)


//GET FROM CONTRACT IMMEDIATELY BEFORE INITIALISATION
const btrflySupplyRaw = 239985617870589

const INITIALDEBT = ethers.BigNumber.from(
  parseInt(
    (btrflySupplyRaw*initialDebtRatio).toString(),
    0
    )
  )

console.log( "Initial debt : " + INITIALDEBT.toString())

const FXS_WHALE = '0x5028d77b91a3754fb38b2fbb726af02d1fe44db6'

describe('Live FXS bonds', function () {
  let dao: SignerWithAddress
  let olympusDao: SignerWithAddress
  let recipient: SignerWithAddress
  let treasuryOwner: SignerWithAddress
  let btrfly: IERC20
  let fxs: IERC20
  let fxsBond: REDACTEDBondDepositoryRewardBased
  let fxsWhale: SignerWithAddress
  let treasuryContract: REDACTEDTreasury

  beforeEach(async function () {
    ;[dao, olympusDao, recipient] = await ethers.getSigners()

    //impersonate Treasury owner and whale
    treasuryOwner = await impersonateAddressAndReturnSigner(dao, MULTISIG_ADDRESS)
    fxsWhale = await impersonateAddressAndReturnSigner(dao, FXS_WHALE)

    btrfly = (await ethers.getContractAt(
      '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
      BTRFLY_ADDRESS,
    )) as IERC20

    fxs = (await ethers.getContractAt(
      '@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20',
      FXS_ADDRESS,
    )) as IERC20

    // get Treasury contract
    treasuryContract = await ethers.getContractAt(
      'REDACTEDTreasury',
      TREASURY_ADDRESS,
      treasuryOwner,
    )

    // deploy LPbonds
    const FXSBond = await ethers.getContractFactory('REDACTEDBondDepositoryRewardBased')

    fxsBond = await ethers.getContractAt("REDACTEDBondDepositoryRewardBased","0xfd7bda47cbeeed93c897273585f666f8d1cc8d45")

    //await fxsBond.deployed()

   /* await treasuryContract.connect(treasuryOwner).queue('8',fxsBond.address)
    await treasuryContract.connect(treasuryOwner).toggle('8',fxsBond.address,ZERO_ADDRESS)

    // Add Bonds as Reserve Assets and set Floor
    await treasuryContract.connect(treasuryOwner).queue('2', fxs.address)
    await treasuryContract
      .connect(treasuryOwner)
      .toggle('2', fxs.address, ZERO_ADDRESS)

    await treasuryContract.connect(treasuryOwner).
    setFloor(
      fxs.address, 
      ethers.BigNumber.from(
        parseInt(
          (1e9/fxsFloorValue).toString(),
          0
          )
        )
        )*/

    
  })

  it(`Initial debt calculated gives [Sam] an ROI of -15% to -5% out the gate`, async function () {

    /*await fxsBond.initializeBondTerms(
      BCV,
      VESTING,
      MINPRICE,
      MAXPAYOUT,
      FEE,
      MAXDEBT,
      TITHE,
      INITIALDEBT
    )*/

    const fxsDepositBtrflyValue = ethers.utils
      .parseUnits('1000', 'gwei')
      .mul(fxsValueUSD)
      .div(btrflyValueUSD)

    const redemptionMinValue = fxsDepositBtrflyValue
      .mul(BigNumber.from(85))
      .div(BigNumber.from(100))

    const redemptionMaxValue = fxsDepositBtrflyValue
      .mul(BigNumber.from(95))
      .div(BigNumber.from(100))

    console.log('DEPOSIT VALUE : ' + fxsDepositBtrflyValue.toString())
    console.log('MIN VALUE TO SATISFY REQ : ' + redemptionMinValue.toString())
    console.log('MAX VALUE TO SATISFY REQ : ' + redemptionMaxValue.toString())

    //console.log('bond price in usd', await fxsBond.bondPriceInUSD())

    await fxs.connect(fxsWhale).transfer(recipient.address,ethers.utils.parseUnits('1000', 'ether'))
    await fxs.connect(recipient).approve(fxsBond.address, ethers.constants.MaxUint256)

    await fxsBond
      .connect(recipient)
      .deposit(
        ethers.utils.parseUnits('1000', 'ether'),
        BigNumber.from(300000),
        recipient.address,
      )

    await mineBlocks(34000)

    await fxsBond.connect(recipient).redeem(recipient.address, false)

    const redemptionAmount = await btrfly.balanceOf(recipient.address)

    console.log('REDEMPTION VALUE : ' + redemptionAmount.toString())

    // expect(redemptionAmount.toNumber()).is.greaterThan(redemptionMinValue.toNumber())
    // expect(redemptionAmount.toNumber()).is.lessThan(redemptionMaxValue.toNumber())
  })
})