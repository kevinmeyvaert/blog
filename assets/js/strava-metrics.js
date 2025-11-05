/**
 * Strava Metrics Calculator
 * Advanced running metrics and training load calculations
 */

class StravaMetrics {
  constructor(athleteData) {
    this.athlete = athleteData.athlete;
    this.activities = athleteData.activities || [];

    // Calculate default thresholds based on age
    const age = this.calculateAge(this.athlete.created_at);
    this.maxHR = 220 - age;
    this.thresholdHR = Math.round(this.maxHR * 0.9); // ~90% of max
    this.restingHR = 60; // Default, can be customized

    // Estimate FTP from best 20-min power if available
    this.ftp = this.estimateFTP();
  }

  /**
   * Calculate athlete age from Strava account creation (approximation)
   */
  calculateAge(createdAt) {
    // Assume athlete was ~25 when they created account (rough estimate)
    const accountYear = new Date(createdAt).getFullYear();
    const currentYear = new Date().getFullYear();
    const yearsActive = currentYear - accountYear;
    return 25 + yearsActive; // Default assumption
  }

  /**
   * Estimate FTP (Functional Threshold Power) from best 20-minute power
   */
  estimateFTP() {
    const activitiesWithPower = this.activities.filter(a =>
      a.average_watts && a.moving_time >= 1200 // At least 20 minutes
    );

    if (activitiesWithPower.length === 0) return 250; // Default FTP

    // Find best 20-minute effort (use weighted average watts as proxy)
    const best20Min = activitiesWithPower
      .filter(a => a.moving_time >= 1200 && a.moving_time <= 1800)
      .sort((a, b) => (b.weighted_average_watts || b.average_watts) - (a.weighted_average_watts || a.average_watts))[0];

    if (best20Min) {
      return Math.round((best20Min.weighted_average_watts || best20Min.average_watts) * 0.95);
    }

    // Otherwise, use 75% of best average watts across all activities
    const bestAvgWatts = Math.max(...activitiesWithPower.map(a => a.average_watts));
    return Math.round(bestAvgWatts * 0.75);
  }

  /**
   * Calculate Training Stress Score (TSS) for an activity
   * Uses HR-based calculation if power not available
   */
  calculateTSS(activity) {
    const durationHours = activity.moving_time / 3600;

    // If we have power data, use power-based TSS
    if (activity.average_watts && this.ftp) {
      const intensityFactor = activity.average_watts / this.ftp;
      return Math.round(durationHours * intensityFactor * intensityFactor * 100);
    }

    // Fall back to HR-based TSS (TRIMP method)
    if (activity.has_heartrate && activity.average_heartrate) {
      const hrr = (activity.average_heartrate - this.restingHR) / (this.maxHR - this.restingHR);
      const trimp = activity.moving_time / 60 * hrr * 0.64 * Math.exp(1.92 * hrr);
      return Math.round(trimp);
    }

    // If no HR or power, use pace-based estimation
    if (activity.distance && activity.moving_time) {
      const paceMinPerKm = (activity.moving_time / 60) / (activity.distance / 1000);
      // Rough estimation: easier run = ~40 TSS/hour, hard run = ~100+ TSS/hour
      const intensity = paceMinPerKm < 4.5 ? 1.2 : paceMinPerKm < 5.5 ? 0.8 : 0.5;
      return Math.round(durationHours * 60 * intensity);
    }

    return 0;
  }

  /**
   * Calculate CTL (Chronic Training Load) - Fitness
   * 42-day exponentially weighted moving average
   */
  calculateCTL(activities, date, previousCTL = 0) {
    const tssToday = activities
      .filter(a => new Date(a.start_date_local).toDateString() === date.toDateString())
      .reduce((sum, a) => sum + this.calculateTSS(a), 0);

    const ctl = previousCTL + (tssToday - previousCTL) * (1 - Math.exp(-1/42));
    return ctl;
  }

  /**
   * Calculate ATL (Acute Training Load) - Fatigue
   * 7-day exponentially weighted moving average
   */
  calculateATL(activities, date, previousATL = 0) {
    const tssToday = activities
      .filter(a => new Date(a.start_date_local).toDateString() === date.toDateString())
      .reduce((sum, a) => sum + this.calculateTSS(a), 0);

    const atl = previousATL + (tssToday - previousATL) * (1 - Math.exp(-1/7));
    return atl;
  }

  /**
   * Calculate TSB (Training Stress Balance) - Form
   * TSB = CTL - ATL
   */
  calculateTSB(ctl, atl) {
    return ctl - atl;
  }

  /**
   * Generate complete training load history
   */
  generateTrainingLoadHistory(daysBack = 90) {
    // Sort activities by date (oldest first)
    const sorted = [...this.activities].sort((a, b) =>
      new Date(a.start_date_local) - new Date(b.start_date_local)
    );

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysBack);

    const history = [];
    let ctl = 0;
    let atl = 0;

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = new Date(d).toDateString();

      ctl = this.calculateCTL(sorted, new Date(d), ctl);
      atl = this.calculateATL(sorted, new Date(d), atl);
      const tsb = this.calculateTSB(ctl, atl);

      history.push({
        date: new Date(d).toISOString().split('T')[0],
        ctl: Math.round(ctl * 10) / 10,
        atl: Math.round(atl * 10) / 10,
        tsb: Math.round(tsb * 10) / 10
      });
    }

    return history;
  }

  /**
   * Estimate VO2max from pace and heart rate
   * Using the formula from Jack Daniels' Running Formula
   */
  estimateVO2max(activity) {
    if (!activity.has_heartrate || !activity.average_heartrate) return null;
    if (!activity.distance || !activity.moving_time) return null;

    // Calculate pace in m/min
    const paceMetersPerMin = activity.distance / (activity.moving_time / 60);

    // Calculate %HRmax
    const hrPercent = activity.average_heartrate / this.maxHR;

    // Estimate VO2 at this pace and HR
    // Rough formula: VO2 = (0.2 * speed) + (0.9 * speed * grade) + 3.5
    // Then adjust for %HRmax
    const speedMPerMin = paceMetersPerMin;
    const vo2 = (0.2 * speedMPerMin / 5 + 3.5) / (hrPercent * 0.85); // Simplified

    // Alternative: Use race performance calculators
    // For runs > 3km at sustained effort
    if (activity.distance > 3000 && hrPercent > 0.75) {
      const timeMinutes = activity.moving_time / 60;
      const distanceKm = activity.distance / 1000;
      const velocity = (distanceKm * 1000) / timeMinutes; // m/min

      // Jack Daniels VDOT approximation
      const vdot = (-4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity) /
                   (0.8 + 0.1894393 * Math.exp(-0.012778 * timeMinutes) +
                    0.2989558 * Math.exp(-0.1932605 * timeMinutes));

      return Math.round(vdot * 10) / 10;
    }

    return null;
  }

  /**
   * Generate VO2max history from activities
   */
  generateVO2maxHistory() {
    const history = [];

    // Filter for quality runs (>3km, >75% HR)
    const qualityRuns = this.activities
      .filter(a => {
        if (!a.has_heartrate || !a.average_heartrate) return false;
        if (!a.distance || a.distance < 3000) return false;
        const hrPercent = a.average_heartrate / this.maxHR;
        return hrPercent > 0.75;
      })
      .sort((a, b) => new Date(a.start_date_local) - new Date(b.start_date_local));

    for (const activity of qualityRuns) {
      const vo2max = this.estimateVO2max(activity);
      if (vo2max && vo2max > 30 && vo2max < 90) { // Sanity check
        history.push({
          date: activity.start_date_local.split('T')[0],
          vo2max: vo2max,
          distance: activity.distance,
          activityName: activity.name
        });
      }
    }

    return history;
  }

  /**
   * Predict race times using current VO2max estimate
   */
  predictRaceTimes() {
    const vo2History = this.generateVO2maxHistory();
    if (vo2History.length === 0) return null;

    // Use recent average VO2max (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentVO2 = vo2History
      .filter(h => new Date(h.date) >= thirtyDaysAgo)
      .map(h => h.vo2max);

    const currentVO2max = recentVO2.length > 0
      ? recentVO2.reduce((a, b) => a + b) / recentVO2.length
      : vo2History[vo2History.length - 1].vo2max;

    // Jack Daniels VDOT race time predictions
    // These are simplified formulas
    const predictions = {
      '5k': this.predictTime(5, currentVO2max),
      '10k': this.predictTime(10, currentVO2max),
      'Half Marathon': this.predictTime(21.097, currentVO2max),
      'Marathon': this.predictTime(42.195, currentVO2max)
    };

    return { currentVO2max: Math.round(currentVO2max * 10) / 10, predictions };
  }

  /**
   * Predict time for a given distance and VO2max
   */
  predictTime(distanceKm, vo2max) {
    // Simplified VDOT to pace conversion
    // These constants are derived from Jack Daniels' tables
    const velocity = vo2max * 0.2 * distanceKm / (0.000104 * distanceKm + 0.182258);
    const timeMinutes = (distanceKm * 1000) / velocity;

    const hours = Math.floor(timeMinutes / 60);
    const minutes = Math.floor(timeMinutes % 60);
    const seconds = Math.floor((timeMinutes % 1) * 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Analyze power-duration curve
   * Find best power efforts at various durations
   */
  analyzePowerCurve() {
    const activitiesWithPower = this.activities.filter(a => a.average_watts);

    if (activitiesWithPower.length === 0) return null;

    // Target durations in seconds
    const durations = [5, 10, 30, 60, 120, 300, 600, 1200, 1800, 3600];
    const curve = [];

    for (const duration of durations) {
      // Find activities close to this duration
      const candidates = activitiesWithPower.filter(a => {
        const timeDiff = Math.abs(a.moving_time - duration);
        return timeDiff < duration * 0.2; // Within 20% of target duration
      });

      if (candidates.length > 0) {
        const bestEffort = candidates.reduce((best, current) => {
          const bestPower = best.weighted_average_watts || best.average_watts;
          const currentPower = current.weighted_average_watts || current.average_watts;
          return currentPower > bestPower ? current : best;
        });

        curve.push({
          duration: duration,
          power: bestEffort.weighted_average_watts || bestEffort.average_watts,
          date: bestEffort.start_date_local.split('T')[0],
          activityName: bestEffort.name
        });
      }
    }

    // Calculate critical power (2-parameter model: CP and W')
    const cp = this.calculateCriticalPower(curve);

    return { curve, criticalPower: cp };
  }

  /**
   * Calculate Critical Power using 2-parameter model
   */
  calculateCriticalPower(curve) {
    if (curve.length < 3) return null;

    // Use 2 data points: ~5min and ~20min efforts
    const fiveMin = curve.find(c => c.duration >= 250 && c.duration <= 350);
    const twentyMin = curve.find(c => c.duration >= 1000 && c.duration <= 1400);

    if (!fiveMin || !twentyMin) return null;

    // CP = (P1*t1 - P2*t2) / (t1 - t2)
    const cp = (fiveMin.power * fiveMin.duration - twentyMin.power * twentyMin.duration) /
               (fiveMin.duration - twentyMin.duration);

    // W' = (P - CP) * t
    const wPrime = (fiveMin.power - cp) * fiveMin.duration;

    return {
      cp: Math.round(cp),
      wPrime: Math.round(wPrime)
    };
  }

  /**
   * Detect intervals in workouts
   * Look for repeated high-intensity efforts
   */
  detectIntervals(minActivities = 20) {
    // This is limited by summary data - we don't have second-by-second data
    // But we can identify workouts with "interval" patterns in the name
    const intervalWorkouts = this.activities.filter(a => {
      const name = a.name.toLowerCase();
      return name.includes('interval') ||
             name.includes('x ') || // e.g., "5 x 500m"
             name.includes('tempo') ||
             name.includes('fartlek') ||
             name.includes('rep');
    });

    return intervalWorkouts.map(workout => {
      const tss = this.calculateTSS(workout);
      const paceMinPerKm = (workout.moving_time / 60) / (workout.distance / 1000);

      return {
        date: workout.start_date_local.split('T')[0],
        name: workout.name,
        distance: (workout.distance / 1000).toFixed(2),
        avgPace: `${Math.floor(paceMinPerKm)}:${Math.round((paceMinPerKm % 1) * 60).toString().padStart(2, '0')}`,
        avgHR: workout.average_heartrate ? Math.round(workout.average_heartrate) : null,
        avgPower: workout.average_watts ? Math.round(workout.average_watts) : null,
        tss: tss,
        quality: this.calculateWorkoutQuality(workout, tss)
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * Calculate workout quality score (0-10)
   */
  calculateWorkoutQuality(activity, tss) {
    let score = 5; // Base score

    // Higher TSS relative to duration = better quality
    const tssPerHour = tss / (activity.moving_time / 3600);
    if (tssPerHour > 80) score += 2;
    else if (tssPerHour > 60) score += 1;

    // High average HR = good effort
    if (activity.has_heartrate) {
      const hrPercent = activity.average_heartrate / this.maxHR;
      if (hrPercent > 0.85) score += 2;
      else if (hrPercent > 0.75) score += 1;
    }

    // High power = good effort
    if (activity.average_watts && this.ftp) {
      const powerPercent = activity.average_watts / this.ftp;
      if (powerPercent > 0.9) score += 1;
    }

    return Math.min(10, Math.max(0, score));
  }

  /**
   * Calculate daily TSS for calendar heatmap
   */
  getDailyTSS(daysBack = 120) {
    const dailyData = {};

    for (const activity of this.activities) {
      const date = activity.start_date_local.split('T')[0];
      const tss = this.calculateTSS(activity);

      if (!dailyData[date]) {
        dailyData[date] = 0;
      }
      dailyData[date] += tss;
    }

    return dailyData;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StravaMetrics;
}
