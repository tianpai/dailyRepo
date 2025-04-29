export function calculateTrendScore({
  stars,
  forks,
  watches,
  age,
  previousTrend = 0,
}) {
  // Normalize age to avoid extreme penalty
  const normalizedAge = Math.max(1, age / (1000 * 60 * 60 * 24)); // in days

  // Weight factors (tweakable)
  const starWeight = 1.5;
  const forkWeight = 1.0;
  const watchWeight = 0.8;
  const decayFactor = 0.2; // how much age reduces the score

  const rawScore =
    stars * starWeight + forks * forkWeight + watches * watchWeight;

  // Apply decay by age (softly)
  const agePenalty = 1 / Math.pow(normalizedAge, decayFactor);

  // Combine
  const finalScore = rawScore * agePenalty;

  // smooth with previous trend (moving average style)
  return Math.round((finalScore + previousTrend * 2) / 3);
}
