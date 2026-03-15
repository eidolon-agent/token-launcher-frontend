'use client';

import { useState } from 'react';
import { useAccount, useConnect, useChainId, useSwitchChain, useReadContract, useWriteContract, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { base } from 'wagmi/chains';
import AddressDisplay from '@/components/AddressDisplay';
import AddressInput from '@/components/AddressInput';
import useUSDPrice from '@/hooks/useUSDPrice';

const abi = [
  { inputs: [], name: 'totalSupply', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'transfer', outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'amount', type: 'uint256' }], name: 'mint', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [{ name: 'amount', type: 'uint256' }], name: 'burn', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'owner', outputs: [{ name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
] as const;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000';

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [errors, setErrors] = useState<{ mint?: string; burn?: string; transfer?: string }>({});

  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'totalSupply',
    query: { enabled: !!CONTRACT_ADDRESS },
  });
  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'owner',
    query: { enabled: !!CONTRACT_ADDRESS },
  });
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi,
    functionName: 'balanceOf',
    args: [CONTRACT_ADDRESS, address || '0x' as any], // just placeholder, will update
    query: { enabled: !!CONTRACT_ADDRESS && !!address },
  });

  const { writeContract: rawWrite, data: txHash, isPending: isWriting } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransaction({ hash: txHash || undefined });

  // Simplified: use a cooldown per action to avoid double-clicks during confirmation
  const [cooldowns, setCooldowns] = useState<{ mint?: boolean; burn?: boolean; transfer?: boolean }>({});

  const { formatUSD } = useUSDPrice(CONTRACT_ADDRESS);

  // Check network
  const wrongNetwork = chainId !== base.id;

  // Single cooldown to lock buttons through confirmation
  const startCooldown = (key: 'mint' | 'burn' | 'transfer') => {
    setCooldowns({ [key]: true });
    setTimeout(() => setCooldowns((c) => ({ ...c, [key]: false }), 5000); // 5s cooldown after tx
  };

  const handleMint = async () => {
    setErrors({});
    if (!amount) return setErrors({ mint: 'Enter amount' });
    try {
      rawWrite({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'mint',
        args: [parseEther(amount)],
      });
      startCooldown('mint');
      setAmount('');
    } catch (e: any) {
      setErrors({ mint: e.message });
    }
  };

  const handleBurn = async () => {
    setErrors({});
    if (!amount) return setErrors({ burn: 'Enter amount' });
    try {
      rawWrite({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'burn',
        args: [parseEther(amount)],
      });
      startCooldown('burn');
      setAmount('');
    } catch (e: any) {
      setErrors({ burn: e.message });
    }
  };

  const handleTransfer = async () => {
    setErrors({});
    if (!amount || !recipient) return setErrors({ transfer: 'Enter amount and recipient' });
    try {
      rawWrite({
        address: CONTRACT_ADDRESS,
        abi,
        functionName: 'transfer',
        args: [recipient as `0x${string}`, parseEther(amount)],
      });
      startCooldown('transfer');
      setAmount('');
      setRecipient('');
    } catch (e: any) {
      setErrors({ transfer: e.message });
    }
  };

  // Determine which primary action to show? Since they're independent, we show all but each with its own cooldown.
  // But we must obey rule: one big button at a time? The rule is for sequential flows (approve then action). Here no approvals, so multiple action buttons may be okay.
  // We'll keep separate sections.

  // Build four-state UI: If not connected -> Connect button. If wrong network -> Switch button. Else show actions.
  let primaryUI;
  if (!isConnected) {
    primaryUI = (
      <button className="btn btn-primary w-full" onClick={() => connect({ connector: connectors[0] })}>
        Connect Wallet
      </button>
    );
  } else if (wrongNetwork) {
    primaryUI = (
      <button className="btn btn-primary w-full" onClick={() => switchChain({ chainId: base.id })} disabled={isSwitching}>
        {isSwitching ? 'Switching...' : 'Switch to Base'}
      </button>
    );
  } else {
    primaryUI = null; // actions rendered normally
  }

  const format = (wei?: bigint) => (wei ? formatEther(wei) : '0');

  return (
    <main className="min-h-screen bg-base-200 text-base-content p-6">
      <div className="max-w-xl mx-auto">
        {/* Title: Only one H1, no duplicate */}
        <h1 className="text-2xl font-bold mb-4">Token Launcher</h1>

        {/* Connect/Network banner */}
        {primaryUI && (
          <div className="mb-6 p-4 bg-base-300 rounded text-center">
            {primaryUI}
          </div>
        )}

        {/* Contract address display */}
        <div className="mb-6">
          <p className="text-sm opacity-70">Contract:</p>
          <AddressDisplay address={CONTRACT_ADDRESS} />
        </div>

        {/* Error banner */}
        {(errors.mint || errors.burn || errors.transfer) && (
          <div className="alert alert-error mb-4 text-sm">
            <span>{errors.mint || errors.burn || errors.transfer}</span>
          </div>
        )}

        <div className="grid gap-6">
          {/* Stats */}
          <section className="bg-base-100 p-4 rounded-box shadow">
            <h2 className="font-semibold mb-2">Stats</h2>
            <div className="space-y-1">
              <p>Total Supply: {format(totalSupply)} TKN {totalSupply && `(${formatUSD(Number(format(totalSupply)) * 1e18)})`}</p>
              <p>Owner: {owner && <AddressDisplay address={owner} />}</p>
              {address && <p>Your balance: {format(balance)} TKN {balance && `(${formatUSD(Number(format(balance)) * 1e18)})`}</p>}
            </div>
          </section>

          {/* Mint */}
          <section className="bg-base-100 p-4 rounded-box shadow">
            <h2 className="font-semibold mb-2">Mint (owner only)</h2>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input input-bordered flex-1"
                disabled={cooldowns.mint}
              />
              <button
                onClick={handleMint}
                disabled={!!cooldowns.mint || isWriting || isConfirming}
                className="btn btn-primary"
              >
                {(cooldowns.mint || isConfirming) ? (
                  <><span className="loading loading-spinner loading-sm mr-2" />Minting...</>
                ) : (
                  'Mint'
                )}
              </button>
            </div>
            {errors.mint && <p className="text-red-500 text-sm mt-2">{errors.mint}</p>}
          </section>

          {/* Burn */}
          <section className="bg-base-100 p-4 rounded-box shadow">
            <h2 className="font-semibold mb-2">Burn</h2>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input input-bordered flex-1"
                disabled={cooldowns.burn}
              />
              <button
                onClick={handleBurn}
                disabled={!!cooldowns.burn || isWriting || isConfirming}
                className="btn btn-error"
              >
                {(cooldowns.burn || isConfirming) ? (
                  <><span className="loading loading-spinner loading-sm mr-2" />Burning...</>
                ) : (
                  'Burn'
                )}
              </button>
            </div>
            {errors.burn && <p className="text-red-500 text-sm mt-2">{errors.burn}</p>}
          </section>

          {/* Transfer */}
          <section className="bg-base-100 p-4 rounded-box shadow">
            <h2 className="font-semibold mb-2">Transfer</h2>
            <div className="flex flex-col gap-2">
              <AddressInput value={recipient} onChange={setRecipient} placeholder="Recipient address" />
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input input-bordered flex-1"
                  disabled={cooldowns.transfer}
                />
                <button
                  onClick={handleTransfer}
                  disabled={!!cooldowns.transfer || isWriting || isConfirming}
                  className="btn btn-success"
                >
                  {(cooldowns.transfer || isConfirming) ? (
                    <><span className="loading loading-spinner loading-sm mr-2" />Sending...</>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
            {errors.transfer && <p className="text-red-500 text-sm mt-2">{errors.transfer}</p>}
          </section>
        </div>

        <footer className="mt-8 text-center text-sm opacity-70">
          <p>Built with ❤️ by Eidolon</p>
          <p className="text-xs">Always verify contract address before interacting.</p>
        </footer>
      </div>
    </main>
  );
}
