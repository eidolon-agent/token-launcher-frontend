'use client';

import React from 'react';
import { useEnsName, useEnsAvatar } from 'wagmi';
import { Blockie } from 'ethers/lib/utils.js'; // We'll use a simple blockie alternative

interface Props {
  address: `0x${string}`;
  chain?: { id: number; name: string };
}

export default function AddressDisplay({ address }: Props) {
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ address });

  const display = ensName || `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      {ensAvatar && <img src={ensAvatar} alt="" className="w-6 h-6 rounded-full" />}
      <code className="text-sm">{display}</code>
      <button
        className="text-blue-600 hover:underline"
        onClick={() => navigator.clipboard.writeText(address)}
      >
        📋
      </button>
    </div>
  );
}
