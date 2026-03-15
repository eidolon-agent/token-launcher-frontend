'use client';

import { useReadContract, useWriteContract, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { base } from 'wagmi/chains';
import { useState } from 'react';

// Minimal ABI for ERC20 + Ownable (only needed functions)
const abi = [
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Placeholder: Replace with your deployed contract address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000';

export default function HomePage() {
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  // Balance of connected account
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'balanceOf',
    args: [undefined as any], // will fill with account
    query: { enabled: false },
  });

  // Total supply
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'totalSupply',
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  // Owner check
  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'owner',
    query: { enabled: !!CONTRACT_ADDRESS },
  });

  // Write hooks
  const { writeContract: writeMint, data: mintHash } = useWriteContract();
  const { writeContract: writeBurn, data: burnHash } = useWriteContract();
  const { writeContract: writeTransfer, data: transferHash } = useWriteContract();

  // Wait for tx
  const { isLoading: mintPending } = useWaitForTransaction({ hash: mintHash || undefined });
  const { isLoading: burnPending } = useWaitForTransaction({ hash: burnHash || undefined });
  const { isLoading: transferPending } = useWaitForTransaction({ hash: transferHash || undefined });

  // Handlers
  const handleMint = async () => {
    if (!amount) return;
    writeMint({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'mint',
      args: [parseEther(amount)],
    });
    setAmount('');
  };

  const handleBurn = async () => {
    if (!amount) return;
    writeBurn({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'burn',
      args: [parseEther(amount)],
    });
    setAmount('');
  };

  const handleTransfer = async () => {
    if (!amount || !recipient) return;
    writeTransfer({
      address: CONTRACT_ADDRESS,
      abi,
      functionName: 'transfer',
      args: [recipient as `0x${string}`, parseEther(amount)],
    });
    setAmount('');
    setRecipient('');
  };

  const format = (wei: bigint | undefined) => (wei ? formatEther(wei) : '0');

  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Token Launcher Frontend</h1>
      <p className="text-gray-600 mb-6">
        Connect your wallet to interact with the ERC-20 contract on Base Mainnet.
      </p>

      {/* Connect Wallet is handled by wagmi's ConnectButton or custom; we'll rely on a UI hook later. For now, note: */}
      <div className="mb-4">
        <em className="text-sm text-gray-500">
          Add <code>&lt;ConnectButton /&gt;</code> from wagmi in a real app.
        </em>
      </div>

      {CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000' && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          Please set <code>NEXT_PUBLIC_TOKEN_ADDRESS</code> in your .env.local to your deployed contract address.
        </div>
      )}

      <div className="space-y-6">
        {/* Stats */}
        <section className="bg-gray-50 p-4 rounded">
          <h2 className="font-semibold mb-2">Stats</h2>
          <p>Total Supply: {format(totalSupply)} TKN</p>
          <p>Owner: {owner}</p>
        </section>

        {/* Mint */}
        <section>
          <h2 className="font-semibold mb-2">Mint (owner only)</h2>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border p-2 rounded flex-1"
            />
            <button
              onClick={handleMint}
              disabled={mintPending}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {mintPending ? 'Minting...' : 'Mint'}
            </button>
          </div>
        </section>

        {/* Burn */}
        <section>
          <h2 className="font-semibold mb-2">Burn</h2>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border p-2 rounded flex-1"
            />
            <button
              onClick={handleBurn}
              disabled={burnPending}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              {burnPending ? 'Burning...' : 'Burn'}
            </button>
          </div>
        </section>

        {/* Transfer */}
        <section>
          <h2 className="font-semibold mb-2">Transfer</h2>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Recipient address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="border p-2 rounded flex-1"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border p-2 rounded flex-1"
            />
            <button
              onClick={handleTransfer}
              disabled={transferPending}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {transferPending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
