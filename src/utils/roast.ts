export interface RoastResult {
  type: string
  title: string
  roast: string
  severity: 'mild' | 'spicy' | 'savage'
  emoji: string
  degenScore: number
  stats: {
    txCount: number
    failedTxs: number
    nftCount: number
    uniqueContracts: number
    walletAgeDays: number
    erc20Count: number
    avgTxPerDay: number
    contractDiversity: number
    activeChains?: number
  }
}

// Deterministic pick — same wallet always gets same roast line
function pickRoast(roasts: string[], address: string): string {
  const seed = parseInt(address.slice(-6), 16) || 0
  return roasts[seed % roasts.length]
}

function pct(n: number): string {
  return Math.round(n * 100) + '%'
}

export function buildRoastResult(
  address: string,
  category: string,
  degenScore: number,
  stats: RoastResult['stats']
): RoastResult {
  const { txCount, failedTxs, nftCount, erc20Count, walletAgeDays, avgTxPerDay } = stats
  const failedPct = txCount > 0 ? Math.round((failedTxs / txCount) * 100) : 0
  const avgTxStr = avgTxPerDay < 1
    ? `${(avgTxPerDay * 7).toFixed(1)} txs/week`
    : `${avgTxPerDay.toFixed(1)} txs/day`

  switch (category) {

    // ─── SILENT WHALE ────────────────────────────────────────
    case 'silent_whale': {
      const roasts = [
        `Big bag, zero moves. ${txCount} transactions total — even your ETH is embarrassed by your inactivity.`,
        "Rich on paper, brain still on demo mode. New money, same old indecision.",
        "You have ETH. You have potential. You have ${txCount} txs in your entire life. Pick a struggle.",
        "Congratulations. You're the whale that everyone charts and nobody respects.",
        "You're what happens when someone buys ETH, gets excited, then just... sits there.",
        "Your ETH is doing nothing. It's not diamond hands. It's paralysis.",
        "Sitting on bags but scared to move. That's not investing, that's hoarding with extra steps.",
      ]
      return {
        type: 'Silent Whale', title: '🐋 SILENT WHALE',
        roast: pickRoast(roasts, address).replace('${txCount}', txCount.toString()),
        severity: 'spicy', emoji: '🐋🤫', degenScore, stats,
      }
    }

    // ─── ACTIVE WHALE ────────────────────────────────────────
    case 'active_whale': {
      const roasts = [
        `${txCount} transactions, fat bag, and still can't find a winning trade. Rich AND wrong is a talent.`,
        "You move ETH like it's a hobby. The market treats it like a donation.",
        "Heavy wallet, heavy losses. At least you're consistent.",
        "You've been active enough to know better. You just choose not to.",
        "The most dangerous animal in DeFi: a whale with confidence and no edge.",
        `${avgTxStr} and your portfolio still underperforms a savings account.`,
        "Rich, busy, and still rekt. The holy trinity of crypto disappointment.",
      ]
      return {
        type: 'Active Whale', title: '🐋 ACTIVE WHALE',
        roast: pickRoast(roasts, address),
        severity: 'savage', emoji: '🐋🔥', degenScore, stats,
      }
    }

    // ─── CRYPTO NEWBIE ───────────────────────────────────────
    case 'crypto_newbie': {
      const roasts = [
        "Fresh wallet, fresh meat. The market will educate you shortly.",
        `${txCount} transactions in. Just wait until you discover leverage.`,
        "You just started. Everything looks like opportunity. It isn't.",
        "Your journey: excitement → confusion → rekt → wisdom (optional).",
        "You're new here. The veterans are already planning how to exit into your buys.",
        "Wallet age: days. Overconfidence level: veteran. This won't end well.",
        "You haven't lost enough money yet to have opinions. Give it time.",
      ]
      return {
        type: 'Crypto Newbie', title: '🐣 FRESH MEAT',
        roast: pickRoast(roasts, address),
        severity: 'mild', emoji: '🐣😬', degenScore, stats,
      }
    }

    // ─── TRUE PAPER HANDS ────────────────────────────────────
    case 'paper_hands': {
      const roasts = [
        `${walletAgeDays} days old, ${txCount} transactions. You're not holding — you just forgot this wallet exists.`,
        "Your wallet has been gathering dust longer than your gym membership.",
        "You downloaded MetaMask, got scared, and called it a 'long term strategy'.",
        `${walletAgeDays} days and ${txCount} txs. The blockchain barely knows you're alive.`,
        "Web3 believer. Web0 activity. Maximum cope.",
        "You've been 'doing research' for months. The research is: doing nothing.",
        "Your wallet activity is as dead as every project you FOMO'd into.",
        "Not diamond hands. Just frozen. There's a difference.",
      ]
      return {
        type: 'Paper Hands', title: '📝 PAPER HANDS',
        roast: pickRoast(roasts, address),
        severity: 'mild', emoji: '📝😅', degenScore, stats,
      }
    }

    // ─── GHOST ───────────────────────────────────────────────
    case 'ghost': {
      const roasts = [
        "Zero transactions. Zero NFTs. Maximum existential dread.",
        "You created a wallet and immediately gave up. Honestly, valid.",
        "This wallet is emptier than your promises to stop buying shitcoins.",
        "Are you even real? The blockchain has no record of your existence.",
      ]
      return {
        type: 'Ghost Wallet', title: '👻 GHOST',
        roast: pickRoast(roasts, address),
        severity: 'mild', emoji: '👻', degenScore, stats,
      }
    }

    // ─── GAS WASTER ──────────────────────────────────────────
    case 'gas_waster': {
      const roasts = [
        `${failedPct}% of your ${txCount} transactions failed. You're not using the blockchain — you're donating to it.`,
        `${failedTxs} failed txs. That's not bad luck. That's a pattern. That's you.`,
        "You've paid more in failed transactions than most people invest in their retirement.",
        `${failedPct}% failure rate. Your MetaMask should come with a warning label.`,
        "Validators see your address and start rubbing their hands together.",
        "Your failed txs aren't accidents. They're a lifestyle.",
        `You've burned ${failedTxs} transactions worth of gas to achieve nothing. Efficiency king.`,
        "The blockchain is a mirror. Yours shows someone who clicks 'confirm' before reading.",
      ]
      return {
        type: 'Gas Waster', title: '⛽ GAS WASTER',
        roast: pickRoast(roasts, address),
        severity: 'savage', emoji: '⛽💸', degenScore, stats,
      }
    }

    // ─── JPEG DEGEN ──────────────────────────────────────────
    case 'jpeg_degen': {
      const roasts = [
        `${nftCount} NFTs. Not one of them worth the gas you paid to mint it.`,
        "Your NFT portfolio is a museum of other people's marketing success.",
        `${nftCount} JPEGs and the best offer you've gotten is 0.001 ETH. Floor: non-existent.`,
        "You bought the art. You bought the community. You bought the bag. In that order.",
        "Your collection is rare in the only way that matters: nobody wants it.",
        "You spent real ETH on pictures my phone can screenshot for free.",
        `${nftCount} tokens in your wallet that are images. Calling that 'investing' is generous.`,
        "JPEG collector. Portfolio destructor. You are built different (not in a good way).",
      ]
      return {
        type: 'JPEG Degen', title: '🖼️ JPEG DEGEN',
        roast: pickRoast(roasts, address),
        severity: 'spicy', emoji: '🖼️💸', degenScore, stats,
      }
    }

    // ─── AIRDROP HUNTER ──────────────────────────────────────
    case 'airdrop_hunter': {
      const chains = stats.activeChains || 1
      const roasts = [
        `${txCount} transactions across ${stats.uniqueContracts} contracts on ${chains} chains. The checklist energy is radiating.`,
        `${chains} chains, same strategy: interact once, disappear, wait for token. They know.`,
        "Your wallet history isn't a journey. It's a farming operation.",
        "You don't use protocols. You audit them for future airdrop eligibility.",
        `${avgTxStr} but you've never actually used anything you've touched.`,
        "Sybil detection teams have a folder named after your address.",
        "You interact with every protocol exactly once. That's not activity, that's an audition.",
        "Your on-chain fingerprint screams: I am here for the airdrop and nothing else.",
        "Protocol teams see wallets like yours and rewrite their airdrop criteria.",
        "Technically active. Spiritually a parasite.",
      ]
      return {
        type: 'Airdrop Hunter', title: '🌾 AIRDROP HUNTER',
        roast: pickRoast(roasts, address),
        severity: 'spicy', emoji: '🌾💨', degenScore, stats,
      }
    }

    // ─── CERTIFIED DEGEN ─────────────────────────────────────
    case 'certified_degen': {
      const roasts = [
        `${txCount} transactions. Degen score ${degenScore}/100. You're not using DeFi — DeFi is using you.`,
        "Your wallet is a documentary about what not to do with money.",
        `${avgTxStr}, ${erc20Count} random tokens, and still haven't found the one that saves you.`,
        "You've been rekt so many times it stopped being a event and became a personality.",
        "Buying high, selling low — not a mistake. A practice. A religion.",
        "Your on-chain history is the kind of thing therapists bill by the hour to unpack.",
        "You are not early. You are not late. You are consistently, magnificently wrong.",
        `${erc20Count} tokens in your wallet. You've never sold a winner but you've held every loser.`,
        "The market exists to transfer money from people like you to people less degen than you.",
        "Your portfolio isn't red. It's a crime scene.",
        `${txCount} transactions and still no edge. Dedication without direction is just chaos.`,
      ]
      return {
        type: 'Certified Degen', title: '💀 CERTIFIED DEGEN',
        roast: pickRoast(roasts, address),
        severity: 'savage', emoji: '💀🔥', degenScore, stats,
      }
    }

    // ─── MID DEGEN (default) ─────────────────────────────────
    default: {
      const roasts = [
        `${txCount} transactions, ${erc20Count} tokens, no clear strategy. The textbook mid.`,
        "You're not a degen. You're not a whale. You're the filler episode of crypto.",
        "Average entry, average exit, average regret. You've mastered the middle.",
        "Your wallet says: 'I've tried things.' Your PnL says: 'And failed quietly.'",
        `${avgTxStr}. Active enough to lose money, passive enough to not learn from it.`,
        "You're not early. You're not late. You're just kind of... there.",
        "Mid degen energy: enough activity to feel involved, not enough to matter.",
        "Your due diligence: 3 tweets, a YouTube thumbnail, and a Discord invite.",
        `${erc20Count} different tokens. You've diversified your losses beautifully.`,
      ]
      return {
        type: 'Average Degen', title: '🎯 MID DEGEN',
        roast: pickRoast(roasts, address),
        severity: 'mild', emoji: '🎯😐', degenScore, stats,
      }
    }
  }
}

// Fallback if API calls fail — hash-based, no real data
export function generateRoastFallback(address: string, balance: string): RoastResult {
  const seed = parseInt(address.slice(-8), 16) || 1
  const balNum = parseFloat(balance) || 0
  const roll = seed % 100
  const degenScore = (seed % 55) + 20

  const emptyStats = {
    txCount: 0, failedTxs: 0, nftCount: 0,
    uniqueContracts: 0, walletAgeDays: 0, erc20Count: 0,
    avgTxPerDay: 0, contractDiversity: 0,
  }

  if (balNum > 5) return buildRoastResult(address, 'silent_whale', degenScore, emptyStats)
  if (roll < 15) return buildRoastResult(address, 'certified_degen', degenScore, emptyStats)
  if (roll < 30) return buildRoastResult(address, 'jpeg_degen', degenScore, emptyStats)
  if (roll < 45) return buildRoastResult(address, 'paper_hands', degenScore, emptyStats)
  if (roll < 60) return buildRoastResult(address, 'airdrop_hunter', degenScore, emptyStats)
  if (roll < 75) return buildRoastResult(address, 'gas_waster', degenScore, emptyStats)
  if (roll < 88) return buildRoastResult(address, 'crypto_newbie', degenScore, emptyStats)
  return buildRoastResult(address, 'mid_degen', degenScore, emptyStats)
}

// Keep for legacy compat
export function calculateDegenScore(
  txCount: number,
  nftTrades: number,
  failedTxs: number,
  balance: number
): number {
  let score = 0
  if (txCount > 100) score += 30
  if (nftTrades > 10) score += 25
  if (failedTxs > 5) score += 20
  if (balance < 0.1) score += 15
  return Math.min(100, score)
}
