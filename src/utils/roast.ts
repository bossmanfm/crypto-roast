export interface RoastResult {
  type: string
  title: string
  roast: string
  severity: 'mild' | 'spicy' | 'savage'
  emoji: string
}

export function generateRoast(
  address: string,
  balance: string,
  txCount: number,
  nfts: number,
  degenScore: number
): RoastResult {
  const seed = parseInt(address.slice(-4), 16)
  
  // 🔥 CERTIFIED DEGEN - Most savage
  if (degenScore > 80) {
    const roasts = [
      "Your wallet has more red flags than a Chinese parade",
      "You don't trade, you donate to the market",
      "Buying high, selling low - the strategy of legends (in their own mind)",
      "Your portfolio is like your dating life - constantly disappointing",
      "You've rugged yourself more times than actual scammers",
      "Your transaction history reads like a horror story",
      "Even your mom stopped asking about your 'investments'",
      "You've paid more in gas fees than your portfolio is worth",
      "Your DCA strategy: Disaster Continues Always",
      "You're the reason exchanges have 'are you sure?' popups",
      "Your wallet is a museum of bad decisions",
      "You've been 'early' to every project that died",
      "Your average buy price is higher than the all-time high",
      "You FOMO so hard, you buy the top and sell the bottom in the same day",
      "Your portfolio diversification is just different shades of red",
    ]
    return {
      type: 'Certified Degen',
      title: '💀 DEGEN ALERT',
      roast: roasts[seed % roasts.length],
      severity: 'savage',
      emoji: '💀🔥',
    }
  }
  
  // 🐋 SAD WHALE - Rich but anxious
  if (parseFloat(balance) > 10) {
    const roasts = [
      "Big balance, small gains. Whales can be paper hands too",
      "You're rich but still can't pick a winning token",
      "All that ETH and you still check prices every 5 minutes",
      "You have 50 ETH but stress over a $50 loss",
      "Your portfolio is green but your mental health isn't",
      "You're the whale that gets liquidated first",
      "Richest wallet, poorest decisions",
      "You could've just bought BTC and chilled, but no",
      "Your net worth is high, your IQ is low",
      "50 ETH, 0 chill",
    ]
    return {
      type: 'Anxious Whale',
      title: '🐋 SAD WHALE',
      roast: roasts[seed % roasts.length],
      severity: 'spicy',
      emoji: '🐋😢',
    }
  }
  
  // 📝 PAPER HANDS - Barely active
  if (txCount < 5) {
    const roasts = [
      "Your wallet is so empty, even dust bunnies moved out",
      "You call that a wallet? That's a participation trophy",
      "One transaction doesn't make you a crypto investor, Kevin",
      "Your wallet has been sitting longer than your gym membership",
      "You're not holding, you're just forgotten",
      "Your crypto journey: downloaded MetaMask, got scared, left",
      "The only thing you're farming is disappointment",
      "You've been 'doing research' for 3 years with 0 trades",
      "Your wallet activity is as dead as your motivation",
      "You're not diamond hands, you're just hands",
    ]
    return {
      type: 'Paper Hands',
      title: '📝 PAPER HANDS',
      roast: roasts[seed % roasts.length],
      severity: 'mild',
      emoji: '📝😅',
    }
  }
  
  // 🖼️ JPEG DEGEN - NFT obsessed
  if (nfts > 20) {
    const roasts = [
      "Your JPEG collection is worth less than the gas you spent",
      "NFTs: The art of buying screenshots you could've saved",
      "Those monkeys aren't making you rich, they're just making you poor",
      "Your NFT portfolio is just a gallery of regrets",
      "You spent 5 ETH on pictures my grandma could draw",
      "Your 'rare' NFTs are rare because nobody wants them",
      "You've been rugged more times than a Persian carpet store",
      "Your wallet is a graveyard of dead projects",
      "The only thing rare about your NFTs is finding a buyer",
      "You bought JPEGs, I bought food. We're not the same",
      "Your NFT strategy: buy high, pray, cry",
      "Those pixels cost more than your car payment",
    ]
    return {
      type: 'JPEG Collector',
      title: '🖼️ JPEG DEGEN',
      roast: roasts[seed % roasts.length],
      severity: 'spicy',
      emoji: '🖼️💸',
    }
  }
  
  // 🎯 DEFAULT - Average degen
  const defaultRoasts = [
    "You're not early, you're just consistently wrong",
    "Your trading strategy? Hope and cope",
    "Web3 believer, Web2 salary",
    "You spent $50 in gas to buy $20 of tokens. Math genius",
    "Your portfolio is a perfect inverse of the market",
    "You're the reason 'not financial advice' exists",
    "Your due diligence is reading 3 tweets and a Discord message",
    "You've never met a shitcoin you didn't like",
    "Your 'research' is just following Elon Musk",
    "You're one bad trade away from uninstalling MetaMask",
    "Your portfolio summary: bought the hype, sold the news",
    "You're not investing, you're just burning money slower",
    "Your wallet is like a casino, but with worse odds",
    "You're the liquidity that smarter traders exit into",
    "Your trading plan: YOLO → REKT → REPEAT",
  ]
  
  return {
    type: 'Average Degen',
    title: '🎯 MID DEGEN',
    roast: defaultRoasts[seed % defaultRoasts.length],
    severity: 'mild',
    emoji: '🎯😐',
  }
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
