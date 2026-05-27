import { parseAbi } from 'viem';

export const erc20Abi = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]);

export const vaultAbi = parseAbi([
  'function owner() view returns (address)',
  'function currentRiskProfile() view returns (uint8)',
  'function deposit(address asset, uint256 amount)',
  'function withdraw(address asset, uint256 amount, address recipient)',
  'function setRiskProfile(uint8 newRiskProfile)',
]);
