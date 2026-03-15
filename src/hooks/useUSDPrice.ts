'use client';

import { useState, useEffect } from 'react';

const ETH_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';

export default function useUSDPrice(tokenAddress?: `0x${string}`) {
  const [ethPrice, setEthPrice] = useState<number>(3000); // fallback
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);

  useEffect(() => {
    fetch(ETH_PRICE_URL)
      .then((res) => res.json())
      .then((data) => data.ethereum?.usd && setEthPrice(data.ethereum.usd))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!tokenAddress) return;
    // Try DexScreener for token price
    fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.pairs?.[0]?.priceUsd) {
          setTokenPrice(parseFloat(data.pairs[0].priceUsd));
        }
      })
      .catch(() => {});
  }, [tokenAddress]);

  const formatUSD = (value: number | bigint, decimals: number = 18) => {
    const num = typeof value === 'bigint' ? Number(value) / 10 ** decimals : value;
    if (tokenPrice) {
      return `~$${(num * tokenPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (tokenAddress) {
      return `<price loading>`;
    }
    return `~$${(num * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return { ethPrice, tokenPrice, formatUSD };
}
