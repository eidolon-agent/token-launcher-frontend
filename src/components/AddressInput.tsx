'use client';

import React, { useState, useEffect } from 'react';
import { useEnsAddress } from 'wagmi';
import { parseAddress } from 'viem';

interface Props {
  value: string;
  onChange: (value: `0x${string}`) => void;
  placeholder?: string;
}

export default function AddressInput({ value, onChange, placeholder = '0x... or ENS' }: Props) {
  const [input, setInput] = useState('');
  const { data: resolvedAddress, isError, isLoading } = useEnsAddress({
    name: input,
    query: { enabled: input.endsWith('.eth') },
  });

  useEffect(() => {
    if (resolvedAddress) {
      onChange(resolvedAddress);
    } else if (!input.endsWith('.eth')) {
      try {
        const addr = parseAddress(input) as `0x${string}`;
        onChange(addr);
      } catch {
        // invalid, do nothing
      }
    }
  }, [resolvedAddress, input, onChange]);

  return (
    <div className="form-control">
      <input
        type="text"
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className={`input input-bordered w-full ${isError && input ? 'input-error' : ''}`}
      />
      {isError && input && <label className="label"><span className="label-text-alt text-red-500">Invalid ENS or address</span></label>}
    </div>
  );
}
