/**
 * Real Estate Comparison Engine
 * Matches units against customer requirements and generates scores
 */

export function compareUnits(units, requirements) {
  const results = units.map(unit => {
    const scores = calculateScores(unit, requirements);
    const totalScore = calculateTotalScore(scores);
    const matchPercentage = Math.round(totalScore * 100);
    
    return {
      unit,
      scores,
      totalScore,
      matchPercentage,
      recommendation: getRecommendation(matchPercentage),
      highlights: getHighlights(unit, requirements, scores)
    };
  });

  // Sort by total score descending
  return results.sort((a, b) => b.totalScore - a.totalScore);
}

function calculateScores(unit, req) {
  const scores = {};

  // Bedrooms score (weight: 15%)
  if (req.minBedrooms || req.maxBedrooms) {
    const min = req.minBedrooms || 0;
    const max = req.maxBedrooms || 10;
    if (unit.bedrooms >= min && unit.bedrooms <= max) {
      scores.bedrooms = 1.0;
    } else {
      const diff = unit.bedrooms < min ? min - unit.bedrooms : unit.bedrooms - max;
      scores.bedrooms = Math.max(0, 1 - (diff * 0.3));
    }
  } else {
    scores.bedrooms = 1.0;
  }

  // Bathrooms score (weight: 5%)
  if (req.minBathrooms || req.maxBathrooms) {
    const min = req.minBathrooms || 0;
    const max = req.maxBathrooms || 10;
    if (unit.bathrooms >= min && unit.bathrooms <= max) {
      scores.bathrooms = 1.0;
    } else {
      const diff = unit.bathrooms < min ? min - unit.bathrooms : unit.bathrooms - max;
      scores.bathrooms = Math.max(0, 1 - (diff * 0.3));
    }
  } else {
    scores.bathrooms = 1.0;
  }

  // Area score (weight: 15%)
  if (req.minArea || req.maxArea) {
    const min = req.minArea || 0;
    const max = req.maxArea || 10000;
    if (unit.area >= min && unit.area <= max) {
      scores.area = 1.0;
    } else {
      const range = max - min || 100;
      const diff = unit.area < min ? min - unit.area : unit.area - max;
      scores.area = Math.max(0, 1 - (diff / range));
    }
  } else {
    scores.area = 1.0;
  }

  // Budget score (weight: 20%)
  if (req.minBudget || req.maxBudget) {
    const min = req.minBudget || 0;
    const max = req.maxBudget || Infinity;
    if (unit.price >= min && unit.price <= max) {
      scores.budget = 1.0;
    } else if (unit.price < min) {
      scores.budget = 0.8;
    } else {
      const overBy = (unit.price - max) / max;
      scores.budget = Math.max(0, 1 - overBy);
    }
  } else {
    scores.budget = 1.0;
  }

  // Location score (weight: 10%)
  if (req.preferredLocations) {
    try {
      const preferredLocs = JSON.parse(req.preferredLocations);
      const compoundLocation = unit.compound?.location?.toLowerCase() || '';
      const compoundCity = unit.compound?.city?.toLowerCase() || '';
      const locationMatch = preferredLocs.some(loc =>
        compoundLocation.includes(loc.toLowerCase()) ||
        compoundCity.includes(loc.toLowerCase())
      );
      scores.location = locationMatch ? 1.0 : 0.5;
    } catch {
      scores.location = 1.0;
    }
  } else {
    scores.location = 1.0;
  }

  // Unit type score (weight: 8%)
  if (req.preferredTypes) {
    try {
      const preferredTypes = JSON.parse(req.preferredTypes);
      const typeMatch = preferredTypes.some(t => t.toLowerCase() === unit.type.toLowerCase());
      scores.unitType = typeMatch ? 1.0 : 0.6;
    } catch {
      scores.unitType = 1.0;
    }
  } else {
    scores.unitType = 1.0;
  }

  // Appreciation rate score (weight: 8%) — higher is better, baseline 15%
  if (unit.appreciationRate != null) {
    scores.appreciation = Math.min(1.0, unit.appreciationRate / 25);
  } else {
    scores.appreciation = 0.5; // neutral if not set
  }

  // Rent yield score (weight: 7%) — higher is better, baseline 7%
  if (unit.rentYield != null) {
    scores.rentYield = Math.min(1.0, unit.rentYield / 12);
  } else {
    scores.rentYield = 0.5;
  }

  // Value for money score (weight: 7%) — directly normalized (1-10 → 0-1)
  if (unit.valueForMoney != null) {
    scores.valueForMoney = Math.min(1.0, unit.valueForMoney / 10);
  } else {
    scores.valueForMoney = 0.5;
  }

  // Finishing type score (weight: 5%)
  if (req.finishingType && req.finishingType !== '') {
    scores.finishing = unit.finishingType === req.finishingType ? 1.0 : 0.5;
  } else {
    scores.finishing = 1.0;
  }

  return scores;
}

function calculateTotalScore(scores) {
  const weights = {
    bedrooms: 0.15,
    bathrooms: 0.05,
    area: 0.15,
    budget: 0.20,
    location: 0.10,
    unitType: 0.08,
    appreciation: 0.08,
    rentYield: 0.07,
    valueForMoney: 0.07,
    finishing: 0.05,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const [key, score] of Object.entries(scores)) {
    const weight = weights[key] || 0;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function getRecommendation(matchPercentage) {
  if (matchPercentage >= 90) return { level: 'excellent', text: 'Excellent Match', color: '#10b981' };
  if (matchPercentage >= 75) return { level: 'good', text: 'Good Match', color: '#3b82f6' };
  if (matchPercentage >= 60) return { level: 'fair', text: 'Fair Match', color: '#f59e0b' };
  return { level: 'poor', text: 'Below Requirements', color: '#ef4444' };
}

function getHighlights(unit, req, scores) {
  const highlights = [];
  const concerns = [];

  if (scores.budget === 1.0 && req.maxBudget) {
    const savings = req.maxBudget - unit.price;
    if (savings > 0) highlights.push(`${formatCurrency(savings)} under budget`);
  }

  if (scores.area === 1.0 && unit.area >= (req.minArea || 0)) {
    highlights.push(`${unit.area} sqm (meets requirement)`);
  }

  if (scores.location === 1.0) highlights.push('Preferred location');
  if (unit.view) highlights.push(`${capitalize(unit.view)} view`);

  if (unit.appreciationRate != null && unit.appreciationRate >= 15) {
    highlights.push(`${unit.appreciationRate}% annual appreciation`);
  }

  if (unit.rentYield != null && unit.rentYield >= 7) {
    highlights.push(`${unit.rentYield}% rental yield`);
  }

  if (unit.valueForMoney != null && unit.valueForMoney >= 7) {
    highlights.push(`Value for money: ${unit.valueForMoney}/10`);
  }

  if (unit.resaleMarket) highlights.push(`Resale: ${unit.resaleMarket}`);

  if (scores.budget < 0.8 && req.maxBudget) {
    const overBy = unit.price - req.maxBudget;
    concerns.push(`${formatCurrency(overBy)} over budget`);
  }

  if (scores.bedrooms < 1.0) {
    concerns.push(`${unit.bedrooms} bedrooms (requirement: ${req.minBedrooms || 0}-${req.maxBedrooms || 'any'})`);
  }

  if (unit.appreciationRate != null && unit.appreciationRate < 10) {
    concerns.push(`Low appreciation rate (${unit.appreciationRate}%)`);
  }

  return { highlights, concerns };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0
  }).format(amount);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function generateComparisonSummary(results, requirements) {
  const excellentMatches = results.filter(r => r.matchPercentage >= 90).length;
  const goodMatches = results.filter(r => r.matchPercentage >= 75 && r.matchPercentage < 90).length;
  const totalMatches = results.length;
  
  const priceRange = results.length > 0 ? {
    min: Math.min(...results.map(r => r.unit.price)),
    max: Math.max(...results.map(r => r.unit.price)),
    avg: results.reduce((sum, r) => sum + r.unit.price, 0) / results.length
  } : null;

  const areaRange = results.length > 0 ? {
    min: Math.min(...results.map(r => r.unit.area)),
    max: Math.max(...results.map(r => r.unit.area)),
    avg: results.reduce((sum, r) => sum + r.unit.area, 0) / results.length
  } : null;

  return {
    totalMatches,
    excellentMatches,
    goodMatches,
    priceRange,
    areaRange,
    topRecommendation: results[0] || null
  };
}
