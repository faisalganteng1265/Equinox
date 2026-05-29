@echo off
setlocal EnableExtensions

rem ============================================================
rem Equinox SC verification helper for Mantle Sepolia (chain 5003)
rem Run this from CMD at the repo root:
rem   verify-equinox-sc.bat
rem
rem Before running:
rem 1. Paste your MantleScan / Etherscan API key below.
rem 2. Make sure forge + cast are installed and available in PATH.
rem
rem This script is aligned to the latest Equinox deployment in Mantle Sepolia.
rem ============================================================

set "MANTLESCAN_API_KEY=NQT6NJS9RX8NC6DCHAKI23CP6WNK49C2BN"
set "CHAIN_ID=5003"
set "COMPILER_VERSION=v0.8.23+commit.f704f362"

if "%MANTLESCAN_API_KEY%"=="<PASTE_MANTLESCAN_API_KEY_HERE>" (
  echo [ERROR] Fill MANTLESCAN_API_KEY first in verify-equinox-sc.bat
  exit /b 1
)

set "ROOT_DIR=%~dp0"
set "SC_DIR=%ROOT_DIR%sc"

if not exist "%SC_DIR%\foundry.toml" (
  echo [ERROR] Could not find sc\foundry.toml from %ROOT_DIR%
  exit /b 1
)

pushd "%SC_DIR%" >nul

set "COMMON_ARGS=--chain %CHAIN_ID% --verifier etherscan --etherscan-api-key %MANTLESCAN_API_KEY% --compiler-version %COMPILER_VERSION% --num-of-optimizations 200 --via-ir --watch"

echo.
echo [STEP] Encoding constructor arguments...

for /f %%i in ('cast abi-encode "constructor(string,string,address)" "Mock USDY" "mUSDY" 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') do set "ARGS_MUSDY=%%i"
for /f %%i in ('cast abi-encode "constructor(string,string,address)" "Mock mETH" "mmETH" 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') do set "ARGS_MMETH=%%i"
for /f %%i in ('cast abi-encode "constructor(string,string,address)" "Mock fBTC" "mfBTC" 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') do set "ARGS_MFBTC=%%i"
for /f %%i in ('cast abi-encode "constructor(string,string,address)" "Mock MI4" "mMI4" 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') do set "ARGS_MMI4=%%i"

for /f %%i in ('cast abi-encode "constructor(address,address,uint16)" 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701 0') do set "ARGS_EXCHANGE=%%i"
for /f %%i in ('cast abi-encode "constructor(address)" 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') do set "ARGS_STRATEGY_REGISTRY=%%i"
for /f %%i in ('cast abi-encode "constructor(string,string,string,address)" "Equinox Agent Registry" "EQAGENT" "ipfs://equinox-agent-registry" 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') do set "ARGS_AGENT_REGISTRY=%%i"

for /f %%i in ('cast abi-encode "constructor(address,address,address)" 0x9e7aF1A46613f04450012E822Bc8b674C33aa5D8 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') do set "ARGS_USDY_IDLE=%%i"
for /f %%i in ('cast abi-encode "constructor(address,address,address)" 0xB4967c57550152026578bbBC998c47ca3fe9B69B 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') do set "ARGS_METH_DEFI=%%i"
for /f %%i in ('cast abi-encode "constructor(address,address,address)" 0xa65074FDc9aD5c3889D9f75Eb87F9Bf6D21bda09 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') do set "ARGS_FBTC_CEFI=%%i"
for /f %%i in ('cast abi-encode "constructor(address,address,address)" 0x8Ec27fcf7f6396D3c35902c5d144D40E66729F85 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701') do set "ARGS_MI4_DEFI=%%i"

for /f %%i in ('cast abi-encode "constructor(address,address,address,address,address,uint256,uint8,address[],uint8[],uint16[3][])" 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701 0x48C51D7ADB14B79bC3e01B5eCeFBE63695c99834 0x57A447FC04934b45d47Bc408cca92c27D77838e3 0x17c4CE203272C62A8d029210b1eD182127Aa94FD 1 1 "[0x9e7aF1A46613f04450012E822Bc8b674C33aa5D8,0xB4967c57550152026578bbBC998c47ca3fe9B69B,0xa65074FDc9aD5c3889D9f75Eb87F9Bf6D21bda09,0x8Ec27fcf7f6396D3c35902c5d144D40E66729F85]" "[0,1,2,2]" "[[7000,5000,3500],[3500,4500,5000],[2000,3000,4000],[1500,2500,3500]]"') do set "ARGS_INITIAL_VAULT=%%i"
for /f %%i in ('cast abi-encode "constructor(address,address,address,address,address,uint8,address[],uint8[],uint16[3][])" 0x48C51D7ADB14B79bC3e01B5eCeFBE63695c99834 0x57A447FC04934b45d47Bc408cca92c27D77838e3 0x17c4CE203272C62A8d029210b1eD182127Aa94FD 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701 0x722550Bb8Ec6416522AfE9EAf446F0DE3262f701 1 "[0x9e7aF1A46613f04450012E822Bc8b674C33aa5D8,0xB4967c57550152026578bbBC998c47ca3fe9B69B,0xa65074FDc9aD5c3889D9f75Eb87F9Bf6D21bda09,0x8Ec27fcf7f6396D3c35902c5d144D40E66729F85]" "[0,1,2,2]" "[[7000,5000,3500],[3500,4500,5000],[2000,3000,4000],[1500,2500,3500]]"') do set "ARGS_FACTORY=%%i"

echo [STEP] Verifying deployed contracts on Mantle Sepolia...
echo.

call :verify 0x9e7aF1A46613f04450012E822Bc8b674C33aa5D8 src/mocks/MockAssetToken.sol:MockAssetToken %ARGS_MUSDY% || goto :fail
call :verify 0xB4967c57550152026578bbBC998c47ca3fe9B69B src/mocks/MockAssetToken.sol:MockAssetToken %ARGS_MMETH% || goto :fail
call :verify 0xa65074FDc9aD5c3889D9f75Eb87F9Bf6D21bda09 src/mocks/MockAssetToken.sol:MockAssetToken %ARGS_MFBTC% || goto :fail
call :verify 0x8Ec27fcf7f6396D3c35902c5d144D40E66729F85 src/mocks/MockAssetToken.sol:MockAssetToken %ARGS_MMI4% || goto :fail

call :verify 0x17c4CE203272C62A8d029210b1eD182127Aa94FD src/MockAssetExchange.sol:MockAssetExchange %ARGS_EXCHANGE% || goto :fail
call :verify 0x57A447FC04934b45d47Bc408cca92c27D77838e3 src/StrategyRegistry.sol:StrategyRegistry %ARGS_STRATEGY_REGISTRY% || goto :fail
call :verify 0x48C51D7ADB14B79bC3e01B5eCeFBE63695c99834 src/MantleAgentRegistry8004.sol:MantleAgentRegistry8004 %ARGS_AGENT_REGISTRY% || goto :fail

call :verify 0xf0A77F62e5BD9905be20E9016d316786903223e3 src/adapters/MockIdleAdapter.sol:MockIdleAdapter %ARGS_USDY_IDLE% || goto :fail
call :verify 0x8f699c98556e30Dc17Fb2BDBEeF76D25767145c2 src/adapters/MockDeFiLendingAdapter.sol:MockDeFiLendingAdapter %ARGS_METH_DEFI% || goto :fail
call :verify 0x748914EFb51e8F24b8177f4C1E6d82ec68E67e3C src/adapters/MockCeFiEarnAdapter.sol:MockCeFiEarnAdapter %ARGS_FBTC_CEFI% || goto :fail
call :verify 0x0B39E9865B027C288872CA71A2a567E95C6FcF58 src/adapters/MockDeFiLendingAdapter.sol:MockDeFiLendingAdapter %ARGS_MI4_DEFI% || goto :fail

call :verify 0x5cFF4689e4c828EBbfd2e15E1a8629137219Eaf1 src/MantleVaultOrchestrator.sol:MantleVaultOrchestrator %ARGS_INITIAL_VAULT% || goto :fail
call :verify 0x49cf06766902AD1022927fac6F98B2b793D29531 src/VaultFactory.sol:VaultFactory %ARGS_FACTORY% || goto :fail

echo.
echo [DONE] All verify commands submitted.
popd >nul
exit /b 0

:verify
echo [VERIFY] %~2
echo          %~1
forge verify-contract %COMMON_ARGS% --constructor-args %3 %1 %2
if errorlevel 1 exit /b 1
echo.
exit /b 0

:fail
echo.
echo [FAILED] Verification stopped because one command returned an error.
popd >nul
exit /b 1
