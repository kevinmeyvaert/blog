/**
 * Running metrics: pure calculations over Strava activity summaries, no DOM.
 *
 * Activities are plain objects:
 *   { type, date: 'YYYY-MM-DD', hour, day, name, distance (m), moving (s),
 *     elapsed (s), climb (m), hr, maxHr, workout }
 * `day` is a whole-day count since 1970-01-01, so date maths never touches
 * timezones or daylight saving.
 */
(function (root) {
  const DAY_MS = 864e5;

  // Max HR is read from the data. The other two are assumptions, stated on the page.
  const HR_MODEL = {
    maxPercentile: 0.995, // of per-run peak HR; the top 0.5% is treated as sensor spikes
    maxWindowYears: 3, // max HR drops with age, so only recent years count
    thresholdFraction: 0.915, // average HR of hour-long races relative to max HR
    resting: 50 // not available from Strava
  };

  const FALLBACK_LOAD_PER_HOUR = 55;
  const FITNESS_DAYS = 42;
  const FATIGUE_DAYS = 7;

  // Share of max HR. Bands are applied to a run's average HR.
  const INTENSITY_ZONES = [
    { name: 'Easy', upTo: 0.75 },
    { name: 'Steady', upTo: 0.82 },
    { name: 'Tempo', upTo: 0.89 },
    { name: 'Hard', upTo: Infinity }
  ];
  const EASY_BAND = [0.74, 0.82];
  const STEADY_MIN_KM = 5;
  const EASY_QUARTER_MIN_RUNS = 8;
  const INTENSITY_YEAR_MIN_RUNS = 50;
  const RACE_WINDOW_DAYS = 365;

  const WORKOUT_NAME = /\d\s*x\s|interval|tempo|fartlek|blokjes|wissel|vvo2|drempel/i;
  const STRAVA_RACE = 1;
  const STRAVA_WORKOUT = 3;

  const RACE_DISTANCES = [
    { name: '5K', meters: 5000 },
    { name: '10K', meters: 10000 },
    { name: 'Half marathon', meters: 21097.5 },
    { name: 'Marathon', meters: 42195 }
  ];

  /* ---------- dates ---------- */

  function toDay(dateKey) {
    return Date.UTC(+dateKey.slice(0, 4), +dateKey.slice(5, 7) - 1, +dateKey.slice(8, 10)) / DAY_MS;
  }

  function toDate(day) {
    return new Date(day * DAY_MS);
  }

  function toDateKey(day) {
    return toDate(day).toISOString().slice(0, 10);
  }

  // Monday-based week index (1970-01-01 was a Thursday).
  function toWeek(day) {
    return Math.floor((day + 3) / 7);
  }

  function weekStartDay(week) {
    return week * 7 - 3;
  }

  /* ---------- formatting ---------- */

  // Rounds the total first, so 4:59.6 becomes 5:00 and never 4:60.
  function formatPace(secondsPerKm) {
    const total = Math.round(secondsPerKm);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  function formatDuration(seconds) {
    const total = Math.round(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
  }

  /* ---------- small statistics ---------- */

  function quantile(sortedValues, q) {
    if (!sortedValues.length) return null;
    const position = (sortedValues.length - 1) * q;
    const low = Math.floor(position);
    const high = Math.ceil(position);
    return sortedValues[low] + (sortedValues[high] - sortedValues[low]) * (position - low);
  }

  function median(values) {
    return quantile([...values].sort((a, b) => a - b), 0.5);
  }

  function sum(items, pick) {
    return items.reduce((total, item) => total + pick(item), 0);
  }

  function paceOf(run) {
    return (run.moving / run.distance) * 1000;
  }

  /* ---------- totals ---------- */

  function summarize(runs) {
    const distance = sum(runs, r => r.distance);
    const moving = sum(runs, r => r.moving);
    return {
      count: runs.length,
      distance,
      moving,
      climb: sum(runs, r => r.climb),
      // Total time over total distance. Averaging per-run paces would let a
      // 3 km jog count as much as a half marathon.
      pace: distance ? (moving / distance) * 1000 : null,
      longest: runs.reduce((best, r) => (!best || r.distance > best.distance ? r : best), null)
    };
  }

  function groupBy(items, keyOf) {
    const groups = new Map();
    items.forEach(item => {
      const key = keyOf(item);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    return groups;
  }

  function yearSummaries(runs) {
    return [...groupBy(runs, r => r.date.slice(0, 4))]
      .map(([year, items]) => ({ year, ...summarize(items) }))
      .sort((a, b) => a.year.localeCompare(b.year));
  }

  // Every month from the first run to `asOfKey`, including empty ones.
  function monthSummaries(runs, asOfKey) {
    if (!runs.length) return [];
    const byMonth = groupBy(runs, r => r.date.slice(0, 7));
    const first = runs.reduce((min, r) => (r.date < min ? r.date : min), runs[0].date);
    const monthIndex = dateKey => +dateKey.slice(0, 4) * 12 + +dateKey.slice(5, 7) - 1;
    const months = [];
    for (let index = monthIndex(first); index <= monthIndex(asOfKey); index++) {
      const key = `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
      months.push({ month: key, ...summarize(byMonth.get(key) || []) });
    }
    return months;
  }

  // Distance per year up to the same calendar date as `asOfKey`.
  function distanceToDate(runs, asOfKey) {
    const cutoff = asOfKey.slice(5);
    const totals = {};
    runs.forEach(r => {
      if (r.date.slice(5) <= cutoff) {
        const year = r.date.slice(0, 4);
        totals[year] = (totals[year] || 0) + r.distance;
      }
    });
    return totals;
  }

  function daysInYear(year) {
    return toDay(`${year + 1}-01-01`) - toDay(`${year}-01-01`);
  }

  // Year-end distance if the rest of the year matches the year so far.
  function projectYearEnd(distanceSoFar, asOfKey) {
    const year = +asOfKey.slice(0, 4);
    const elapsed = toDay(asOfKey) - toDay(`${year}-01-01`) + 1;
    return (distanceSoFar / elapsed) * daysInYear(year);
  }

  /**
   * Cumulative km per year on a shared calendar with a slot for every date of
   * a leap year, so the same index means the same calendar date in every year.
   * Returns the slot dates and, per year, one value per slot (null after `asOfKey`).
   */
  function cumulativeByYear(runs, asOfKey) {
    const leapStart = toDay('2024-01-01');
    const slotOf = dateKey => toDay(`2024-${dateKey.slice(5)}`) - leapStart;
    const slots = Array.from({ length: 366 }, (_, slot) => toDateKey(leapStart + slot));
    const lastSlot = slotOf(asOfKey);
    const currentYear = asOfKey.slice(0, 4);

    const years = [...groupBy(runs, r => r.date.slice(0, 4))]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, items]) => {
        const perSlot = slots.map(() => 0);
        items.forEach(r => {
          perSlot[slotOf(r.date)] += r.distance / 1000;
        });
        let total = 0;
        const values = perSlot.map((distance, slot) => {
          total += distance;
          return year === currentYear && slot > lastSlot ? null : total;
        });
        return { year, values };
      });
    return { slots, years };
  }

  /* ---------- habits and records ---------- */

  function dailyRuns(runs) {
    return groupBy(runs, r => r.day);
  }

  function longestConsecutive(sortedNumbers) {
    let best = 0;
    let current = 0;
    sortedNumbers.forEach((value, i) => {
      current = i > 0 && value === sortedNumbers[i - 1] + 1 ? current + 1 : 1;
      best = Math.max(best, current);
    });
    return best;
  }

  /**
   * Weeks in a row with at least one run. An unfinished current week does not
   * break the streak.
   */
  function weekStreaks(runs, asOfDay) {
    const weeks = [...new Set(runs.map(r => toWeek(r.day)))].sort((a, b) => a - b);
    const weekSet = new Set(weeks);
    let cursor = toWeek(asOfDay);
    if (!weekSet.has(cursor)) cursor -= 1;
    let current = 0;
    while (weekSet.has(cursor)) {
      current += 1;
      cursor -= 1;
    }
    return { current, longest: longestConsecutive(weeks) };
  }

  function biggestBy(runs, keyOf) {
    let best = null;
    groupBy(runs, keyOf).forEach((items, key) => {
      const distance = sum(items, r => r.distance);
      if (!best || distance > best.distance) best = { key, distance, count: items.length };
    });
    return best;
  }

  // Largest E such that at least E days had E km or more.
  function eddington(runs) {
    const dailyKm = [...dailyRuns(runs).values()]
      .map(items => sum(items, r => r.distance) / 1000)
      .sort((a, b) => b - a);
    let e = 0;
    while (e < dailyKm.length && dailyKm[e] >= e + 1) e += 1;
    return e;
  }

  function favouriteHour(runs) {
    const counts = new Array(24).fill(0);
    runs.forEach(r => {
      counts[r.hour] += 1;
    });
    const hour = counts.indexOf(Math.max(...counts));
    return { hour, share: runs.length ? counts[hour] / runs.length : 0 };
  }

  /* ---------- heart rate ---------- */

  function estimateHrModel(runs, asOfDay) {
    const peaks = runs
      .filter(r => r.maxHr && asOfDay - r.day <= HR_MODEL.maxWindowYears * 365)
      .map(r => r.maxHr)
      .sort((a, b) => a - b);
    if (peaks.length < 20) return null;
    const max = Math.round(quantile(peaks, HR_MODEL.maxPercentile));
    return {
      max,
      threshold: Math.round(max * HR_MODEL.thresholdFraction),
      resting: HR_MODEL.resting
    };
  }

  // Banister's training impulse per minute, from heart-rate reserve.
  function impulsePerMinute(hr, model) {
    const reserve = Math.min(Math.max((hr - model.resting) / (model.max - model.resting), 0), 1);
    return reserve * 0.64 * Math.exp(1.92 * reserve);
  }

  /**
   * Returns a function scoring one activity's training load, scaled so an
   * hour at threshold heart rate is 100 (the TSS convention).
   *
   * Activities without heart rate get the median load per hour of the runs
   * that have it; non-runs without heart rate score 0.
   */
  function createLoadScorer(activities, model) {
    let hrLoadPerHour = null;
    let runLoadPerHour = FALLBACK_LOAD_PER_HOUR;
    if (model) {
      const thresholdImpulse = impulsePerMinute(model.threshold, model);
      hrLoadPerHour = a => (100 * impulsePerMinute(a.hr, model)) / thresholdImpulse;
      const rates = activities.filter(a => a.type === 'Run' && a.hr && a.moving > 0).map(hrLoadPerHour);
      if (rates.length) runLoadPerHour = median(rates);
    }

    return a => {
      const perHour = hrLoadPerHour && a.hr ? hrLoadPerHour(a) : a.type === 'Run' ? runLoadPerHour : 0;
      return (a.moving / 3600) * perHour;
    };
  }

  /**
   * Fitness (42-day) and fatigue (7-day) exponentially weighted averages of
   * daily load, from the very first activity so no warm-up period is needed.
   * Form is the gap between the two: fitness minus fatigue.
   */
  function trainingLoadHistory(activities, asOfDay, scoreLoad) {
    if (!activities.length) return [];
    const dailyLoad = new Map();
    let firstDay = Infinity;
    activities.forEach(a => {
      dailyLoad.set(a.day, (dailyLoad.get(a.day) || 0) + scoreLoad(a));
      firstDay = Math.min(firstDay, a.day);
    });

    const fitnessGain = 1 - Math.exp(-1 / FITNESS_DAYS);
    const fatigueGain = 1 - Math.exp(-1 / FATIGUE_DAYS);
    const history = [];
    let fitness = 0;
    let fatigue = 0;
    for (let day = firstDay; day <= asOfDay; day++) {
      const load = dailyLoad.get(day) || 0;
      fitness += (load - fitness) * fitnessGain;
      fatigue += (load - fatigue) * fatigueGain;
      history.push({ day, load, fitness, fatigue, form: fitness - fatigue });
    }
    return history;
  }

  function describeForm(form) {
    if (form > 25) return 'Very fresh, losing fitness';
    if (form > 5) return 'Fresh';
    if (form >= -10) return 'Neutral';
    if (form >= -30) return 'Building';
    return 'Overreaching';
  }

  function isSteady(run) {
    return run.workout !== STRAVA_RACE && !isWorkout(run) && run.distance >= STEADY_MIN_KM * 1000;
  }

  function easyBandBpm(model) {
    return EASY_BAND.map(fraction => Math.round(fraction * model.max));
  }

  /**
   * Median pace per quarter of steady runs whose average HR falls in the easy
   * band. Faster pace at the same heart rate means better aerobic fitness.
   */
  function easyPaceByQuarter(runs, model) {
    if (!model) return [];
    const [low, high] = easyBandBpm(model);
    const eligible = runs.filter(r => r.hr && r.hr >= low && r.hr <= high && isSteady(r));
    const quarterOf = r => `${r.date.slice(0, 4)}-Q${Math.ceil(+r.date.slice(5, 7) / 3)}`;
    return [...groupBy(eligible, quarterOf)]
      .filter(([, items]) => items.length >= EASY_QUARTER_MIN_RUNS)
      .map(([quarter, items]) => ({ quarter, pace: median(items.map(paceOf)), count: items.length }))
      .sort((a, b) => a.quarter.localeCompare(b.quarter));
  }

  // Share of running time per intensity zone per year, by each run's average HR.
  function intensityByYear(runs, model) {
    if (!model) return [];
    const withHr = runs.filter(r => r.hr);
    return [...groupBy(withHr, r => r.date.slice(0, 4))]
      .filter(([, items]) => items.length >= INTENSITY_YEAR_MIN_RUNS)
      .map(([year, items]) => {
        const seconds = INTENSITY_ZONES.map(() => 0);
        items.forEach(r => {
          const zone = INTENSITY_ZONES.findIndex(z => r.hr / model.max < z.upTo);
          seconds[zone] += r.moving;
        });
        const total = sum(seconds, s => s);
        return { year, shares: seconds.map(s => s / total) };
      })
      .sort((a, b) => a.year.localeCompare(b.year));
  }

  /* ---------- races and workouts ---------- */

  /**
   * Daniels & Gilbert VDOT. Only meaningful for an all-out effort, so it is
   * applied to races and never to training runs.
   */
  function vdot(meters, seconds) {
    const minutes = seconds / 60;
    const velocity = meters / minutes;
    const oxygenCost = -4.6 + 0.182258 * velocity + 0.000104 * velocity * velocity;
    const sustainable =
      0.8 + 0.1894393 * Math.exp(-0.012778 * minutes) + 0.2989558 * Math.exp(-0.1932605 * minutes);
    return oxygenCost / sustainable;
  }

  // Time (s) over `meters` that scores `targetVdot`. VDOT falls as time rises, so bisect.
  function equivalentTime(targetVdot, meters) {
    let fast = meters / 9;
    let slow = meters / 1.2;
    for (let i = 0; i < 50; i++) {
      const middle = (fast + slow) / 2;
      if (vdot(meters, middle) > targetVdot) fast = middle;
      else slow = middle;
    }
    return (fast + slow) / 2;
  }

  // Race clocks do not pause, so races use elapsed time.
  function races(runs) {
    return runs
      .filter(r => r.workout === STRAVA_RACE)
      .map(r => ({ ...r, pace: (r.elapsed / r.distance) * 1000, vdot: vdot(r.distance, r.elapsed) }))
      .sort((a, b) => b.day - a.day);
  }

  function racePredictions(raceList, asOfDay) {
    const recent = raceList.filter(r => asOfDay - r.day <= RACE_WINDOW_DAYS);
    if (!recent.length) return null;
    const best = recent.reduce((top, r) => (r.vdot > top.vdot ? r : top));
    return {
      race: best,
      times: RACE_DISTANCES.map(d => ({ ...d, seconds: equivalentTime(best.vdot, d.meters) }))
    };
  }

  function isWorkout(run) {
    return run.workout === STRAVA_WORKOUT || WORKOUT_NAME.test(run.name);
  }

  const api = {
    HR_MODEL,
    INTENSITY_ZONES,
    STEADY_MIN_KM,
    FITNESS_DAYS,
    FATIGUE_DAYS,
    toDay,
    toDate,
    toDateKey,
    toWeek,
    weekStartDay,
    formatPace,
    formatDuration,
    sum,
    paceOf,
    summarize,
    yearSummaries,
    monthSummaries,
    distanceToDate,
    projectYearEnd,
    cumulativeByYear,
    dailyRuns,
    weekStreaks,
    biggestBy,
    eddington,
    favouriteHour,
    estimateHrModel,
    createLoadScorer,
    trainingLoadHistory,
    describeForm,
    easyBandBpm,
    easyPaceByQuarter,
    intensityByYear,
    races,
    racePredictions,
    isWorkout
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.StravaMetrics = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
