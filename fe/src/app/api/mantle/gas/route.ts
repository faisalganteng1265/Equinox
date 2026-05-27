import { asL2Provider } from '@mantleio/sdk';
import { ethers } from 'ethers';
import { NextResponse } from 'next/server';

interface GasPayload {
  txs?: Array<{
    to: string;
    data?: string;
    value?: string;
  }>;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as GasPayload;
  const txs = payload.txs || [];

  if (txs.length === 0) {
    return NextResponse.json(
      {
        error: 'At least one transaction is required.',
      },
      { status: 400 },
    );
  }

  const rpcUrl = process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz';
  const provider = asL2Provider(new ethers.providers.JsonRpcProvider(rpcUrl));

  const estimates = await Promise.all(
    txs.map(async (tx, index) => {
      const requestLike = {
        to: tx.to,
        data: tx.data,
        value: tx.value ? ethers.BigNumber.from(tx.value) : undefined,
      };

      const [gasLimit, l1GasCost, l2GasCost, totalGasCost] = await Promise.all([
        provider.estimateGas(requestLike),
        provider.estimateL1GasCost(requestLike),
        provider.estimateL2GasCost(requestLike),
        provider.estimateTotalGasCost(requestLike),
      ]);

      return {
        index,
        gasLimit: gasLimit.toString(),
        l1GasCostWei: l1GasCost.toString(),
        l2GasCostWei: l2GasCost.toString(),
        totalGasCostWei: totalGasCost.toString(),
        totalGasCostEth: ethers.utils.formatEther(totalGasCost),
      };
    }),
  );

  const totalGasCostWei = estimates
    .reduce((sum, item) => sum.add(ethers.BigNumber.from(item.totalGasCostWei)), ethers.BigNumber.from(0))
    .toString();

  return NextResponse.json({
    network: 'Mantle Sepolia',
    estimates,
    totalGasCostWei,
    totalGasCostEth: ethers.utils.formatEther(totalGasCostWei),
  });
}
