/**
 * Running page: renders stats, tables and charts from the embedded Strava data.
 * Metric calculations live in strava-metrics.js.
 */
(function () {
  const M = window.StravaMetrics;
  const source = document.getElementById('strava-data');
  if (!M || !source) return;

  const LOCALE = 'en-GB';
  const TIME_ZONE = 'Europe/Brussels';
  const EQUATOR_KM = 40075;
  const CALENDAR_WEEKS = 53;
  const CALENDAR_LEVELS_KM = [7, 11, 15]; // upper bounds of the first three shades
  const MONTH_LABEL_COLUMNS = 3; // room a month label needs in the calendar
  const LOAD_CHART_DAYS = 180;
  const FITNESS_TREND_DAYS = 28;
  const CHART_HEIGHTS = {
    wide: { standard: 300, cumulative: 360 },
    compact: { standard: 240, cumulative: 280 }
  };
  const RECENT_RUNS = 6;
  const RECENT_WORKOUTS = 8;
  const COMPACT_QUERY = '(max-width: 768px)';

  /* ---------- formatting ---------- */

  const whole = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
  const oneDecimal = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const dateFormatter = options => new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: 'UTC' });
  const DATE = {
    full: dateFormatter({ day: 'numeric', month: 'long', year: 'numeric' }),
    short: dateFormatter({ day: 'numeric', month: 'short', year: 'numeric' }),
    weekday: dateFormatter({ weekday: 'short', day: 'numeric', month: 'short' }),
    month: dateFormatter({ month: 'short' }),
    monthYear: dateFormatter({ month: 'long', year: 'numeric' }),
    dayMonth: dateFormatter({ day: 'numeric', month: 'short' })
  };

  const formatDay = (day, style = 'short') => DATE[style].format(M.toDate(day));
  const formatMonth = monthKey => formatDay(M.toDay(`${monthKey}-01`), 'monthYear');
  const km = meters => meters / 1000;
  const formatKm = meters => oneDecimal.format(km(meters));
  const signed = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${whole.format(Math.abs(value))}`;
  const percent = share => `${Math.round(share * 100)}%`;
  const el = id => document.getElementById(id);

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, ch => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
  }

  /* ---------- data ---------- */

  function parseActivities(rows) {
    return rows.map(([type, start, name, distance, moving, elapsed, climb, hr, maxHr, workout]) => {
      const date = start.slice(0, 10);
      return { type, date, hour: +start.slice(11, 13), day: M.toDay(date), name, distance, moving, elapsed, climb, hr, maxHr, workout };
    });
  }

  function buildView() {
    const raw = JSON.parse(source.textContent);
    const activities = parseActivities(raw.activities);
    const runs = activities
      .filter(a => a.type === 'Run' && a.distance > 0 && a.moving > 0)
      .sort((a, b) => a.day - b.day);

    // "Today" is the day the data was fetched, so the page never depends on the visitor's clock.
    const asOfKey = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date(raw.updated));
    const asOfDay = M.toDay(asOfKey);
    const year = asOfKey.slice(0, 4);

    const hrModel = M.estimateHrModel(runs, asOfDay);
    const scoreLoad = M.createLoadScorer(activities, hrModel);
    const raceList = M.races(runs);
    const months = M.monthSummaries(runs, asOfKey);

    return {
      runs,
      asOfKey,
      asOfDay,
      year,
      hrModel,
      scoreLoad,
      raceList,
      total: M.summarize(runs),
      years: M.yearSummaries(runs),
      months,
      bestMonth: months.reduce((top, m) => (m.distance > top.distance ? m : top)),
      easyBand: hrModel && M.easyBandBpm(hrModel),
      toDate: M.distanceToDate(runs, asOfKey),
      cumulative: M.cumulativeByYear(runs, asOfKey),
      byDay: M.dailyRuns(runs),
      load: M.trainingLoadHistory(activities, asOfDay, scoreLoad),
      easyPace: M.easyPaceByQuarter(runs, hrModel),
      intensity: M.intensityByYear(runs, hrModel),
      predictions: M.racePredictions(raceList, asOfDay)
    };
  }

  /* ---------- building blocks ---------- */

  function renderStats(id, stats) {
    el(id).innerHTML = stats
      .map(({ label, value, unit, detail }) => `
        <div class="run-stat">
          <dt>${label}</dt>
          <dd>
            <span class="run-stat-value">${value}</span>${unit ? `<span class="run-stat-unit">${unit}</span>` : ''}
            ${detail ? `<span class="run-stat-detail">${detail}</span>` : ''}
          </dd>
        </div>`)
      .join('');
  }

  function renderTable(id, columns, rows) {
    const head = columns
      .map(c => `<th scope="col"${c.className ? ` class="${c.className}"` : ''}>${c.label}</th>`)
      .join('');
    const body = rows
      .map(row => `<tr>${columns
        .map(c => `<td${c.className ? ` class="${c.className}"` : ''}>${c.cell(row)}</td>`)
        .join('')}</tr>`)
      .join('');
    el(id).innerHTML = `<table class="run-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  const keyItem = (kind, label) => `<span><i class="run-swatch run-swatch-${kind}" aria-hidden="true"></i>${label}</span>`;
  const dash = '<span class="run-empty-cell">–</span>';

  /* ---------- sections ---------- */

  function renderAllTime(view) {
    const { total, runs } = view;
    const lap = km(total.distance) / EQUATOR_KM;
    const distance = lap >= 1
      ? `${oneDecimal.format(lap)} laps of the equator`
      : `${percent(lap)} of the way around the equator`;
    el('run-alltime-note').textContent =
      `Every run since ${formatDay(runs[0].day, 'monthYear')}. That is ${distance}. Updated ${formatDay(view.asOfDay, 'full')}.`;

    renderStats('run-alltime-stats', [
      { label: 'Distance', value: whole.format(km(total.distance)), unit: 'km' },
      { label: 'Runs', value: whole.format(total.count) },
      { label: 'Time', value: whole.format(total.moving / 3600), unit: 'h' },
      { label: 'Climbed', value: whole.format(total.climb), unit: 'm' }
    ]);
  }

  function renderYear(view) {
    const { year, toDate, asOfKey } = view;
    const summary = view.years.find(y => y.year === year);
    el('run-year-title').textContent = `${year} so far`;
    if (!summary) {
      el('run-year-note').textContent = 'No runs yet this year.';
      return;
    }

    const lastYear = String(+year - 1);
    const sentences = [];
    if (toDate[lastYear]) {
      const gap = Math.round(km(toDate[year] - toDate[lastYear]));
      sentences.push(gap === 0
        ? `Level with ${lastYear} at this date.`
        : `${whole.format(Math.abs(gap))} km ${gap > 0 ? 'ahead of' : 'behind'} ${lastYear} at this date.`);
    }
    const projected = Math.round(km(M.projectYearEnd(toDate[year], asOfKey)) / 10) * 10;
    sentences.push(`At this rate the year ends near ${whole.format(projected)} km.`);
    el('run-year-note').textContent = sentences.join(' ');

    renderStats('run-year-stats', [
      { label: 'Distance', value: whole.format(km(summary.distance)), unit: 'km' },
      { label: 'Runs', value: whole.format(summary.count) },
      { label: 'Time', value: whole.format(summary.moving / 3600), unit: 'h' },
      { label: 'Average pace', value: M.formatPace(summary.pace), unit: '/km' }
    ]);

    const earlier = view.cumulative.years.filter(c => c.year !== year).map(c => c.year);
    el('run-cumulative-key').innerHTML = keyItem('accent', year) +
      (earlier.length ? keyItem('context', `${earlier[0]} to ${earlier[earlier.length - 1]}`) : '');
  }

  function calendarLevel(distanceKm) {
    return 1 + CALENDAR_LEVELS_KM.filter(limit => distanceKm >= limit).length;
  }

  function describeDay(view, day) {
    const runs = view.byDay.get(day);
    if (!runs) return `${formatDay(day, 'weekday')}: rest day`;
    const { distance, pace } = M.summarize(runs);
    const names = runs.map(r => r.name).join(' + ');
    return `${formatDay(day, 'weekday')}: ${names}, ${formatKm(distance)} km at ${M.formatPace(pace)}/km`;
  }

  function renderCalendar(view) {
    const { asOfDay, byDay } = view;
    const lastWeek = M.toWeek(asOfDay);
    const firstDay = M.weekStartDay(lastWeek - CALENDAR_WEEKS + 1);

    let cells = '';
    const labels = [];
    let previousMonth = null;
    for (let week = 0; week < CALENDAR_WEEKS; week++) {
      const monday = firstDay + week * 7;
      const month = M.toDateKey(monday).slice(0, 7);
      if (month !== previousMonth) labels.push({ week, text: formatDay(monday, 'month') });
      previousMonth = month;

      for (let offset = 0; offset < 7; offset++) {
        const day = monday + offset;
        if (day > asOfDay) {
          cells += '<i class="run-cal-cell is-future"></i>';
          continue;
        }
        const runs = byDay.get(day);
        const level = runs ? calendarLevel(km(M.sum(runs, r => r.distance))) : 0;
        cells += `<i class="run-cal-cell l${level}" data-day="${day}"></i>`;
      }
    }

    // Drop a label without enough columns before the next label or the edge.
    const months = labels
      .filter((label, i) => (labels[i + 1] ? labels[i + 1].week : CALENDAR_WEEKS) - label.week >= MONTH_LABEL_COLUMNS)
      .map(label => `<span style="grid-column:${label.week + 1}">${label.text}</span>`)
      .join('');
    const legend = [0, 1, 2, 3, 4].map(level => `<i class="run-cal-cell l${level}"></i>`).join('');
    el('run-calendar').innerHTML = `
      <div class="run-cal-scroll">
        <div class="run-cal" role="img" aria-labelledby="run-calendar-note">
          <div class="run-cal-months" style="grid-template-columns:repeat(${CALENDAR_WEEKS}, minmax(0, 1fr))">${months}</div>
          <div class="run-cal-weekdays" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span></div>
          <div class="run-cal-grid">${cells}</div>
        </div>
      </div>
      <div class="run-cal-footer">
        <p class="run-cal-detail" aria-live="polite"></p>
        <p class="run-cal-legend" aria-hidden="true">Shorter ${legend} Longer</p>
      </div>`;

    const windowDays = asOfDay - firstDay + 1;
    const inWindow = view.runs.filter(r => r.day >= firstDay);
    const runDays = new Set(inWindow.map(r => r.day)).size;
    el('run-calendar-note').textContent =
      `Ran on ${runDays} of the last ${windowDays} days, ${whole.format(km(M.sum(inWindow, r => r.distance)))} km in total. Each square is a day, shaded by distance.`;

    const grid = el('run-calendar').querySelector('.run-cal-grid');
    const detail = el('run-calendar').querySelector('.run-cal-detail');
    const latest = view.runs[view.runs.length - 1].day;
    let selected = null;
    const show = day => {
      detail.textContent = describeDay(view, day);
    };
    const select = cell => {
      if (selected) selected.classList.remove('is-selected');
      selected = cell;
      selected.classList.add('is-selected');
      show(+cell.dataset.day);
    };
    const cellOf = event => event.target.closest('.run-cal-cell[data-day]');

    grid.addEventListener('mouseover', event => {
      const cell = cellOf(event);
      if (cell) show(+cell.dataset.day);
    });
    grid.addEventListener('mouseleave', () => show(+selected.dataset.day));
    grid.addEventListener('click', event => {
      const cell = cellOf(event);
      if (cell) select(cell);
    });
    select(grid.querySelector(`[data-day="${latest}"]`));

    // On narrow screens the grid scrolls; start at the most recent weeks.
    const scroller = el('run-calendar').querySelector('.run-cal-scroll');
    scroller.scrollLeft = scroller.scrollWidth;
  }

  const runColumns = {
    date: { label: 'Date', className: 'nowrap', cell: r => formatDay(r.day) },
    distance: { label: 'Distance', className: 'num', cell: r => `${formatKm(r.distance)} km` },
    pace: { label: 'Pace', className: 'num', cell: r => `${M.formatPace(M.paceOf(r))}/km` },
    hr: { label: 'Avg HR', className: 'num wide-only', cell: r => (r.hr ? Math.round(r.hr) : dash) },
    maxHr: { label: 'Max HR', className: 'num wide-only', cell: r => (r.maxHr ? Math.round(r.maxHr) : dash) }
  };
  const nameColumn = label => ({ label, className: 'name', cell: r => escapeHtml(r.name) });

  function renderRecent(view) {
    renderTable('run-recent', [
      runColumns.date,
      nameColumn('Run'),
      runColumns.distance,
      runColumns.pace,
      runColumns.hr,
      { label: 'Climb', className: 'num wide-only', cell: r => `${Math.round(r.climb)} m` }
    ], view.runs.slice(-RECENT_RUNS).reverse());
  }

  function renderYears(view) {
    const longest = Math.max(...view.years.map(y => y.distance));
    renderTable('run-years', [
      { label: 'Year', cell: y => y.year },
      {
        label: 'Distance',
        className: 'bar',
        cell: y => `
          <div class="run-bar-cell">
            <span class="run-bar${y.year === view.year ? ' is-current' : ''}"><span style="width:${(y.distance / longest) * 100}%"></span></span>
            <span class="run-bar-value">${whole.format(km(y.distance))} km</span>
          </div>`
      },
      { label: 'Runs', className: 'num', cell: y => y.count },
      { label: 'Time', className: 'num wide-only', cell: y => `${whole.format(y.moving / 3600)} h` },
      { label: 'Pace', className: 'num', cell: y => `${M.formatPace(y.pace)}/km` },
      { label: 'Climbed', className: 'num wide-only', cell: y => `${whole.format(y.climb)} m` },
      { label: 'Longest', className: 'num wide-only', cell: y => `${formatKm(y.longest.distance)} km` }
    ], [...view.years].reverse());
  }

  function renderTrendNotes(view) {
    const { months, bestMonth, easyPace, intensity } = view;

    const lastTwelve = months.slice(0, -1).slice(-12); // the current month is still in progress
    el('run-monthly-note').textContent =
      `${whole.format(km(M.sum(lastTwelve, m => m.distance)) / lastTwelve.length)} km a month on average over the last 12 full months. ` +
      `The record is ${whole.format(km(bestMonth.distance))} km in ${formatMonth(bestMonth.month)}.`;

    if (!easyPace.length) {
      el('run-easy-figure').hidden = true;
    } else {
      const [low, high] = view.easyBand;
      const latest = easyPace[easyPace.length - 1];
      const [latestYear, latestQuarter] = latest.quarter.split('-');
      const yearBefore = easyPace.find(q => q.quarter === `${+latestYear - 1}-${latestQuarter}`);
      let comparison = '';
      if (yearBefore) {
        const gap = Math.round(yearBefore.pace - latest.pace);
        comparison = gap === 0
          ? ', the same as a year earlier'
          : `, ${Math.abs(gap)} s/km ${gap > 0 ? 'faster' : 'slower'} than a year earlier`;
      }
      el('run-easy-note').textContent =
        `Median pace of steady runs at ${low} to ${high} bpm, per quarter. Faster at the same heart rate means fitter. ` +
        `Now ${M.formatPace(latest.pace)}/km${comparison}.`;
    }

    if (!intensity.length) {
      el('run-intensity-figure').hidden = true;
    } else {
      const latest = intensity[intensity.length - 1];
      const previous = intensity[intensity.length - 2];
      el('run-intensity-note').textContent =
        `Share of running time by each run's average heart rate. In ${latest.year}, ${percent(latest.shares[0])} was easy` +
        (previous ? `, against ${percent(previous.shares[0])} in ${previous.year}.` : '.');
      renderIntensity(view);
    }
  }

  function renderIntensity(view) {
    const { intensity, hrModel } = view;
    const zones = M.INTENSITY_ZONES;
    const bounds = zones.map(z => Math.round(z.upTo * hrModel.max));
    const range = i => {
      if (i === 0) return `under ${bounds[0]} bpm`;
      if (i === zones.length - 1) return `${bounds[i - 1]} bpm and up`;
      return `${bounds[i - 1]} to ${bounds[i]} bpm`;
    };

    const key = zones
      .map((z, i) => `<span><i class="run-zone z${i + 1}" aria-hidden="true"></i>${z.name} <small>${range(i)}</small></span>`)
      .join('');
    const rows = [...intensity].reverse()
      .map(({ year, shares }) => {
        const segments = shares
          .map((share, i) => (share > 0
            ? `<span class="run-zone z${i + 1}" style="flex-grow:${share * 1000}" title="${zones[i].name}: ${percent(share)}">${share >= 0.08 ? percent(share) : ''}</span>`
            : ''))
          .join('');
        const label = shares.map((share, i) => `${zones[i].name} ${percent(share)}`).join(', ');
        return `<div class="run-zone-row"><span>${year}</span><div class="run-zone-bar" role="img" aria-label="${year}: ${label}">${segments}</div></div>`;
      })
      .join('');
    el('run-intensity').innerHTML = `<p class="run-key run-zone-key">${key}</p>${rows}`;
  }

  function renderLoad(view) {
    const { load } = view;
    const today = load[load.length - 1];
    const before = load[Math.max(0, load.length - 1 - FITNESS_TREND_DAYS)];
    const peak = load.reduce((top, d) => (d.fitness > top.fitness ? d : top), load[0]);
    const trend = Math.round(today.fitness - before.fitness);
    const weeks = `${FITNESS_TREND_DAYS / 7} weeks`;

    el('run-load-note').textContent =
      `Fitness is the ${M.FITNESS_DAYS}-day average of daily training load, fatigue the ${M.FATIGUE_DAYS}-day average. ` +
      'Form is fitness minus fatigue: negative while training hard, positive when rested.';

    renderStats('run-load-stats', [
      {
        label: 'Fitness',
        value: whole.format(today.fitness),
        detail: trend === 0 ? `Level over ${weeks}` : `${signed(trend)} in ${weeks}`
      },
      { label: 'Fatigue', value: whole.format(today.fatigue) },
      { label: 'Form', value: signed(Math.round(today.form)), detail: M.describeForm(today.form) },
      { label: 'Peak fitness', value: whole.format(peak.fitness), detail: formatDay(peak.day, 'monthYear') }
    ]);
  }

  function renderRaces(view) {
    const { raceList, predictions } = view;
    if (!raceList.length) {
      el('run-races-section').hidden = true;
      return;
    }

    if (predictions) {
      const { race, times } = predictions;
      el('run-races-note').textContent =
        `Best race of the last 12 months: ${race.name}, ${formatKm(race.distance)} km in ${M.formatDuration(race.elapsed)}. ` +
        'The same effort at other distances would be worth:';
      renderStats('run-predictions', times.map(t => ({ label: t.name, value: M.formatDuration(t.seconds) })));
    } else {
      el('run-predictions').hidden = true;
    }

    const bestVdot = Math.max(...raceList.map(r => r.vdot));
    renderTable('run-races', [
      runColumns.date,
      nameColumn('Race'),
      runColumns.distance,
      { label: 'Time', className: 'num', cell: r => M.formatDuration(r.elapsed) },
      { label: 'Pace', className: 'num wide-only', cell: r => `${M.formatPace(r.pace)}/km` },
      {
        label: 'VDOT',
        className: 'num',
        cell: r => (r.vdot === bestVdot ? `<strong title="Best race">${oneDecimal.format(r.vdot)}</strong>` : oneDecimal.format(r.vdot))
      }
    ], raceList);
  }

  function renderWorkouts(view) {
    const workouts = view.runs.filter(M.isWorkout).slice(-RECENT_WORKOUTS).reverse();
    if (!workouts.length) {
      el('run-workouts-section').hidden = true;
      return;
    }
    renderTable('run-workouts', [
      runColumns.date,
      nameColumn('Workout'),
      runColumns.distance,
      runColumns.pace,
      runColumns.hr,
      runColumns.maxHr,
      { label: 'Load', className: 'num', cell: r => Math.round(view.scoreLoad(r)) }
    ], workouts);
  }

  function renderRecords(view) {
    const { runs, total, bestMonth, asOfDay } = view;
    const week = M.biggestBy(runs, r => M.toWeek(r.day));
    const streaks = M.weekStreaks(runs, asOfDay);
    const eddington = M.eddington(runs);
    const start = M.favouriteHour(runs);

    const records = [
      {
        label: 'Longest run',
        value: `${formatKm(total.longest.distance)} km`,
        detail: `${escapeHtml(total.longest.name)}, ${formatDay(total.longest.day)}`
      },
      { label: 'Biggest week', value: `${formatKm(week.distance)} km`, detail: `Week of ${formatDay(M.weekStartDay(week.key))}` },
      { label: 'Biggest month', value: `${whole.format(km(bestMonth.distance))} km`, detail: formatMonth(bestMonth.month) },
      {
        label: 'Weekly streak',
        value: `${streaks.current} weeks`,
        detail: `in a row with at least one run. The record is ${streaks.longest}.`
      },
      { label: 'Eddington number', value: eddington, detail: `${eddington} km or more on ${eddington} different days` },
      { label: 'Favourite start', value: `${start.hour}:00`, detail: `${percent(start.share)} of all runs start in this hour` }
    ];
    el('run-records').innerHTML = records
      .map(r => `<div class="run-record"><dt>${r.label}</dt><dd><span class="run-record-value">${r.value}</span><span class="run-record-detail">${r.detail}</span></dd></div>`)
      .join('');
  }

  function renderMethod(view) {
    const { hrModel, easyBand } = view;
    const paragraphs = [
      'Activities come from Strava and refresh once a day. Totals count runs only.',
      'Race equivalents use the Daniels and Gilbert VDOT formula on finish time and GPS distance. It assumes an all-out effort, so it is only applied to races.'
    ];
    if (hrModel) {
      paragraphs.splice(1, 0,
        `Max heart rate (${hrModel.max} bpm) is read from the data: the ${M.HR_MODEL.maxPercentile * 100}th percentile of per-run peaks over the last ${M.HR_MODEL.maxWindowYears} years. ` +
        `Threshold heart rate (${hrModel.threshold} bpm) is ${M.HR_MODEL.thresholdFraction * 100}% of that, which matches my hour-long races. Resting heart rate is assumed to be ${hrModel.resting} bpm.`,
        'Training load is the Banister heart-rate impulse of each activity, scaled so an hour at threshold scores 100. Runs without heart rate get my median load per hour. ' +
        `Fitness and fatigue are ${M.FITNESS_DAYS}-day and ${M.FATIGUE_DAYS}-day exponential averages, calculated from the very first run.`,
        `Easy effort means steady runs of ${M.STEADY_MIN_KM} km or more, races and workouts excluded, with an average heart rate of ${easyBand[0]} to ${easyBand[1]} bpm. ` +
        'Heart rate comes from three different watches over the years, so small shifts can be the sensor rather than me.'
      );
    }
    el('run-method').innerHTML = paragraphs.map(p => `<p>${p}</p>`).join('');
  }

  /* ---------- charts ---------- */

  const charts = [];
  let drawnWith = null;

  function themeColors() {
    const style = getComputedStyle(document.documentElement);
    const read = name => style.getPropertyValue(name).trim();
    return {
      dark: document.documentElement.getAttribute('data-theme') === 'dark',
      font: getComputedStyle(document.body).fontFamily,
      muted: read('--color-text-muted'),
      grid: read('--color-border-secondary'),
      axis: read('--color-border-primary'),
      surface: read('--color-bg-primary'),
      ink: read('--color-text-secondary'),
      accent: read('--run-accent'),
      context: read('--run-context')
    };
  }

  function baseOptions(colors, type, height) {
    return {
      chart: {
        type,
        height,
        fontFamily: colors.font,
        background: 'transparent',
        toolbar: { show: false },
        zoom: { enabled: false },
        selection: { enabled: false },
        animations: { enabled: false },
        parentHeightOffset: 0
      },
      theme: { mode: colors.dark ? 'dark' : 'light' },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: {
        borderColor: colors.grid,
        strokeDashArray: 0,
        padding: { top: 0, right: 12, bottom: 0, left: 8 }
      },
      states: {
        hover: { filter: { type: 'none' } },
        active: { filter: { type: 'none' } }
      },
      markers: { size: 0, strokeColors: colors.surface, strokeWidth: 2, hover: { size: 4 } },
      tooltip: { theme: colors.dark ? 'dark' : 'light', style: { fontSize: '12px' } }
    };
  }

  function axisLabels(colors, extra = {}) {
    return { style: { colors: colors.muted, fontSize: '11px' }, ...extra };
  }

  // Category axis that prints only the labels `labelOf` returns; every other category stays blank.
  function categoryAxis(colors, categories, labelOf) {
    return {
      type: 'category',
      categories,
      axisBorder: { color: colors.axis },
      axisTicks: { show: false },
      tooltip: { enabled: false },
      crosshairs: { stroke: { color: colors.axis, dashArray: 0 } },
      labels: axisLabels(colors, {
        rotate: 0,
        hideOverlappingLabels: false,
        formatter: value => labelOf(String(value))
      })
    };
  }

  const yearAtJanuary = monthKey => (monthKey.endsWith('-01') ? monthKey.slice(0, 4) : '');
  const monthAtFirst = dateKey => (dateKey.endsWith('-01') ? formatDay(M.toDay(dateKey), 'month') : '');

  // Tooltip titled by data index, because most category labels are blank.
  function indexTooltip(base, titleOf, valueOf, extra) {
    return {
      ...base.tooltip,
      x: { formatter: (_value, { dataPointIndex }) => titleOf(dataPointIndex) },
      y: { formatter: valueOf },
      ...extra
    };
  }

  // Butt caps (the default): round caps would paint a dot for every empty day in a series.
  const LINE = { width: 2, curve: 'straight' };
  const SINGLE_SERIES = { marker: { show: false } };
  const SHARED = { shared: true, intersect: false };

  // Value axis from zero with at most five round steps.
  function valueAxis(colors, values) {
    const top = Math.max(...values.filter(v => v !== null), 1);
    const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000]
      .find(candidate => top / candidate <= 5) || 10000;
    const max = Math.ceil(top / step) * step;
    return { min: 0, max, tickAmount: max / step, labels: axisLabels(colors, { formatter: v => whole.format(v) }) };
  }

  // Pace axis snapped to round steps, faster at the top.
  function paceAxis(colors, values) {
    const present = values.filter(v => v !== null);
    const step = Math.max(...present) - Math.min(...present) > 60 ? 20 : 10;
    const min = Math.floor(Math.min(...present) / step) * step;
    const max = Math.ceil(Math.max(...present) / step) * step;
    return {
      reversed: true,
      min,
      max,
      tickAmount: (max - min) / step,
      labels: axisLabels(colors, { formatter: M.formatPace })
    };
  }

  function draw(id, options) {
    const chart = new ApexCharts(el(id), options);
    chart.render();
    charts.push(chart);
  }

  function drawCumulative(view, colors, height, compact) {
    const { slots, years } = view.cumulative;
    const isCurrent = y => y.year === view.year;
    const base = baseOptions(colors, 'line', height);
    draw('run-cumulative-chart', {
      ...base,
      series: years.map(y => ({ name: y.year, data: y.values.map(v => (v === null ? null : Math.round(v))) })),
      colors: years.map(y => (isCurrent(y) ? colors.accent : colors.context)),
      stroke: { ...LINE, width: years.map(y => (isCurrent(y) ? 2.5 : 1.25)) },
      // Every other month when space is tight.
      xaxis: categoryAxis(colors, slots, key => (compact && +key.slice(5, 7) % 2 === 0 ? '' : monthAtFirst(key))),
      yaxis: valueAxis(colors, years.flatMap(y => y.values)),
      tooltip: indexTooltip(
        base,
        i => formatDay(M.toDay(slots[i]), 'dayMonth'),
        v => (Number.isFinite(v) ? `${whole.format(v)} km` : ''),
        { ...SHARED, inverseOrder: true }
      )
    });
  }

  function drawMonthlyDistance(months, colors, height) {
    const base = baseOptions(colors, 'bar', height);
    draw('run-monthly-chart', {
      ...base,
      series: [{
        name: 'Distance',
        data: months.map((m, i) => ({
          x: m.month,
          y: Math.round(km(m.distance)),
          // The last month is still in progress.
          fillColor: i === months.length - 1 ? colors.context : colors.ink
        }))
      }],
      plotOptions: { bar: { columnWidth: '64%', borderRadius: 2, borderRadiusApplication: 'end' } },
      xaxis: categoryAxis(colors, months.map(m => m.month), yearAtJanuary),
      yaxis: valueAxis(colors, months.map(m => km(m.distance))),
      tooltip: indexTooltip(base, i => formatMonth(months[i].month), v => `${whole.format(v)} km`, SINGLE_SERIES)
    });
  }

  function drawPace(id, colors, height, { name, categories, paces, labelOf, titleOf, dots }) {
    const base = baseOptions(colors, 'line', height);
    draw(id, {
      ...base,
      series: [{ name, data: paces }],
      colors: [colors.ink],
      stroke: LINE,
      markers: dots ? { ...base.markers, size: 4, hover: { size: 5 } } : base.markers,
      xaxis: categoryAxis(colors, categories, labelOf),
      yaxis: paceAxis(colors, paces),
      tooltip: indexTooltip(base, titleOf, v => `${M.formatPace(v)}/km`, SINGLE_SERIES)
    });
  }

  function drawMonthlyPace(months, colors, height) {
    drawPace('run-pace-chart', colors, height, {
      name: 'Average pace',
      categories: months.map(m => m.month),
      paces: months.map(m => (m.count ? Math.round(m.pace) : null)),
      labelOf: yearAtJanuary,
      titleOf: i => formatMonth(months[i].month)
    });
  }

  function drawEasyPace(quarters, colors, height) {
    if (!quarters.length) return;
    drawPace('run-easy-chart', colors, height, {
      name: 'Easy pace',
      categories: quarters.map(q => q.quarter),
      paces: quarters.map(q => Math.round(q.pace)),
      labelOf: quarter => (quarter.endsWith('Q1') ? quarter.slice(0, 4) : ''),
      titleOf: i => `${quarters[i].quarter.slice(5)} ${quarters[i].quarter.slice(0, 4)}, ${quarters[i].count} runs`,
      dots: true
    });
  }

  function drawLoad(view, colors, height) {
    const days = view.load.slice(-LOAD_CHART_DAYS);
    const series = pick => days.map(d => Math.round(pick(d) * 10) / 10);
    const base = baseOptions(colors, 'line', height);
    draw('run-load-chart', {
      ...base,
      series: [
        { name: 'Fitness', data: series(d => d.fitness) },
        { name: 'Fatigue', data: series(d => d.fatigue) }
      ],
      colors: [colors.accent, colors.context],
      stroke: { ...LINE, width: [2.5, 1.25] },
      xaxis: categoryAxis(colors, days.map(d => M.toDateKey(d.day)), monthAtFirst),
      yaxis: valueAxis(colors, days.map(d => Math.max(d.fitness, d.fatigue))),
      tooltip: indexTooltip(base, i => formatDay(days[i].day), v => whole.format(v), SHARED)
    });
  }

  function renderCharts(view) {
    const compact = window.matchMedia(COMPACT_QUERY).matches;
    const heights = compact ? CHART_HEIGHTS.compact : CHART_HEIGHTS.wide;
    // Hold the space so the page does not jump when the charts arrive.
    document.querySelectorAll('.run-chart').forEach(node => {
      node.style.minHeight = `${node.id === 'run-cumulative-chart' ? heights.cumulative : heights.standard}px`;
    });
    if (!window.ApexCharts) return;

    // main.js re-applies the current theme on load, so only redraw on a real change.
    const colors = themeColors();
    const signature = `${colors.dark}:${compact}`;
    if (signature === drawnWith) return;
    drawnWith = signature;

    charts.splice(0).forEach(chart => chart.destroy());
    const months = view.months.slice(compact ? -24 : -36);
    drawCumulative(view, colors, heights.cumulative, compact);
    drawMonthlyDistance(months, colors, heights.standard);
    drawMonthlyPace(months, colors, heights.standard);
    drawEasyPace(view.easyPace, colors, heights.standard);
    drawLoad(view, colors, heights.standard);
  }

  /* ---------- start ---------- */

  function start() {
    const view = buildView();
    if (!view.runs.length) return;

    renderAllTime(view);
    renderYear(view);
    renderCalendar(view);
    renderRecent(view);
    renderYears(view);
    renderTrendNotes(view);
    renderLoad(view);
    renderRaces(view);
    renderWorkouts(view);
    renderRecords(view);
    renderMethod(view);
    renderCharts(view);

    // ApexCharts loads async so it never holds up the text; draw once it arrives.
    if (!window.ApexCharts) el('apexcharts-script').addEventListener('load', () => renderCharts(view));
    // Chart colors are read from CSS, so redraw when the theme or layout changes.
    new MutationObserver(() => renderCharts(view))
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.matchMedia(COMPACT_QUERY).addEventListener('change', () => renderCharts(view));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
