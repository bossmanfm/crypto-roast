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
  }
}

function pickRoast(roasts: string[], address: string): string {
  // Deterministic pick from address last 4 chars
  const seed = parseInt(address.slice(-6), 16) || 0
  return roasts[seed % roasts.length]
}

export function buildRoastResult(
  address: string,
  category: string,
  degenScore: number,
  stats: RoastResult['stats']
): RoastResult {
  switch (category) {

    case 'sad_whale': {
      const roasts = [
        "Big bag, small brain. Congrats on holding ETH while missing every 10x",
        "You have more ETH than personality",
        "Rich wallet, poor life choices",
        "All that ETH and you still stress-check prices at 3AM",
        "You're rich but your DeFi yield is -40%. Skill issue.",
        "Your net worth is high, your IQ is low",
        "50 ETH, 0 chill. Therapy is cheaper than gas fees.",
        "The market dumps 5% and you panic. Imagine being this wealthy and this fragile.",
      ]
      return {
        type: 'Anxious Whale', title: '🐋 SAD WHALE',
        roast: pickRoast(roasts, address),
        severity: 'spicy', emoji: '🐋😢', degenScore, stats,
      }
    }

    case 'paper_hands': {
      const roasts = [
        "Your wallet has been sitting longer than your gym membership",
        "You downloaded MetaMask, got scared, and called it investing",
        "The only thing you're farming is disappointment",
        "You've been 'doing research' for 3 years. Still nothing.",
        "Your wallet activity is flatter than your gains",
        "You're not hodling. You just forgot this wallet exists.",
        "Your last transaction was basically in the stone age",
        "Web3 dreamer, Web0 doer",
      ]
      return {
        type: 'Paper Hands', title: '📝 PAPER HANDS',
        roast: pickRoast(roasts, address),
        severity: 'mild', emoji: '📝😅', degenScore, stats,
      }
    }

    case 'ghost': {
      const roasts = [
        "Your wallet has never been used. Are you even real?",
        "Zero transactions. Zero NFTs. Maximum existential dread.",
        "This wallet is emptier than your promises",
        "You created a wallet and immediately gave up. Valid strategy.",
      ]
      return {
        type: 'Ghost Wallet', title: '👻 GHOST',
        roast: pickRoast(roasts, address),
        severity: 'mild', emoji: '👻', degenScore, stats,
      }
    }

    case 'gas_waster': {
      const failedPct = stats.txCount > 0
        ? Math.round((stats.failedTxs / stats.txCount) * 100)
        : 0
      const roasts = [
        `${failedPct}% of your transactions failed. You're not using blockchain, you're donating to it.`,
        "Your failed transactions could fund a small country",
        "You set gas to 1 gwei and wonder why nothing confirms",
        "Miners love you. Your portfolio doesn't.",
        "Half your transactions are just expensive errors",
        "You've gifted more to validators than to your own portfolio",
        "Your transaction success rate is lower than your dating success rate",
        "Failed txs: your most consistent on-chain activity",
      ]
      return {
        type: 'Gas Waster', title: '⛽ GAS WASTER',
        roast: pickRoast(roasts, address),
        severity: 'savage', emoji: '⛽💸', degenScore, stats,
      }
    }

    case 'jpeg_degen': {
      const roasts = [
        `${stats.nftCount} NFTs. Not one of them worth the gas you paid.`,
        "Your NFT portfolio is just a gallery of regrets",
        "You spent ETH on pictures my grandma could draw",
        "Those pixels cost more than your rent",
        "Your 'rare' NFTs are rare because nobody wants them",
        "You've been rugged more times than a Persian carpet store",
        "The only thing rare about your NFTs is finding a buyer",
        "You bought JPEGs, I bought food. We are not the same.",
        "Your NFT strategy: buy high, pray, cry, repeat",
      ]
      return {
        type: 'JPEG Degen', title: '🖼️ JPEG DEGEN',
        roast: pickRoast(roasts, address),
        severity: 'spicy', emoji: '🖼️💸', degenScore, stats,
      }
    }

    case 'airdrop_hunter': {
      const roasts = [
        "Your wallet screams 'airdrop farmer' louder than a Discord ping",
        "10 wallets, same IP. Very sneaky. Not sneaky at all.",
        "You interact with every protocol once then ghost it",
        "Your 'portfolio' is 90% airdrop tokens worth $0.00001",
        "Sybil hunters have a poster of your wallet on their wall",
        "You're not a builder. You're a transaction factory.",
        "Your wallet history looks like a checklist, not a life",
        "You've bridged ETH 50 times but never actually used anything",
        "Linea, zkSync, Starknet, Base, Scroll... You have no loyalty.",
      ]
      return {
        type: 'Airdrop Farmer', title: '🌾 AIRDROP HUNTER',
        roast: pickRoast(roasts, address),
        severity: 'spicy', emoji: '🌾💨', degenScore, stats,
      }
    }

    case 'certified_degen': {
      const roasts = [
        "Your wallet has more red flags than a Chinese New Year parade",
        "You've rugged yourself more times than actual scammers",
        "Buying high, selling low — the strategy of legends (in their own mind)",
        "Your transaction history reads like a horror novel",
        "Even your mom stopped asking about your 'investments'",
        "Your DCA strategy: Disaster Continues Always",
        "You FOMO in, panic sell, repeat. It's a lifestyle.",
        "Your portfolio is a perfect inverse of the market",
        "You've never met a shitcoin you didn't like",
        "You're the liquidity that smarter traders exit into",
        "Your trading plan: YOLO → REKT → COPE → REPEAT",
        "You are not early. You are just consistently wrong.",
        `${stats.txCount} transactions and still not profitable. Talent.`,
      ]
      return {
        type: 'Certified Degen', title: '💀 DEGEN ALERT',
        roast: pickRoast(roasts, address),
        severity: 'savage', emoji: '💀🔥', degenScore, stats,
      }
    }

    default: {
      const roasts = [
        "You're not early, you're just consistently wrong",
        "Web3 believer, Web2 salary",
        `You spent $50 in gas to move $20 of tokens. Math genius.`,
        "Your due diligence is reading 3 tweets and a Discord message",
        "You're one bad trade away from uninstalling MetaMask",
        "You're not investing. You're burning money, just slower.",
        "Your trading plan: Hope → Cope → Rope",
        "Average in, average out, average life",
        `${stats.erc20Count} random tokens in your wallet. You collect L's like NFTs.`,
      ]
      return {
        type: 'Average Degen', title: '🎯 MID DEGEN',
        roast: pickRoast(roasts, address),
        severity: 'mild', emoji: '🎯😐', degenScore, stats,
      }
    }
  }
}

// Legacy (fallback if API fails — hash-based)
export function generateRoastFallback(address: string, balance: string): RoastResult {
  const seed = parseInt(address.slice(-8), 16) || 1
  const balNum = parseFloat(balance) || 0
  const categoryRoll = seed % 100
  const degenScore = (seed % 60) + 20

  const emptyStats = {
    txCount: 0, failedTxs: 0, nftCount: 0,
    uniqueContracts: 0, walletAgeDays: 0, erc20Count: 0,
  }

  if (balNum > 5) return buildRoastResult(address, 'sad_whale', degenScore, emptyStats)
  if (categoryRoll < 20) return buildRoastResult(address, 'certified_degen', degenScore, emptyStats)
  if (categoryRoll < 40) return buildRoastResult(address, 'jpeg_degen', degenScore, emptyStats)
  if (categoryRoll < 55) return buildRoastResult(address, 'paper_hands', degenScore, emptyStats)
  if (categoryRoll < 70) return buildRoastResult(address, 'airdrop_hunter', degenScore, emptyStats)
  if (categoryRoll < 85) return buildRoastResult(address, 'gas_waster', degenScore, emptyStats)
  return buildRoastResult(address, 'mid_degen', degenScore, emptyStats)
}

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
