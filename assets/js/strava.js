/**
 * Strava Data Visualization Script
 * Initializes ApexCharts and Leaflet.js for running statistics
 */

// Store chart instances for re-rendering on theme change
const chartInstances = {};

/**
 * Get theme-aware colors from CSS variables
 */
function getThemeColors() {
  const root = document.documentElement;
  const style = getComputedStyle(root);

  return {
    textPrimary: style.getPropertyValue('--color-text-primary').trim() || '#000000',
    textSecondary: style.getPropertyValue('--color-text-secondary').trim() || '#333333',
    textMuted: style.getPropertyValue('--color-text-muted').trim() || '#666666',
    textLight: style.getPropertyValue('--color-text-light').trim() || '#999999',
    borderPrimary: style.getPropertyValue('--color-border-primary').trim() || '#e0e0e0',
    bgPrimary: style.getPropertyValue('--color-bg-primary').trim() || '#ffffff',
    bgSecondary: style.getPropertyValue('--color-bg-secondary').trim() || '#f9f9f9'
  };
}

function initializeStravaCharts(data) {
  if (!data || !data.activities) {
    console.warn('No Strava data available');
    return;
  }

  // Initialize all charts
  initializeDistanceChart(data);
  initializePaceChart(data);
  initializeHRZonesChart(data);
  initializeEfficiencyChart(data);
  initializeTrainingLoadChart(data);
  initializeIntervalScorecard(data);
  initializeActivityMap(data);
  initializeActivityCalendar(data);

  // Re-render charts on theme change
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        // Re-render all charts with new theme
        Object.values(chartInstances).forEach(chart => {
          if (chart && chart.destroy) {
            chart.destroy();
          }
        });
        initializeStravaCharts(data);
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}

/**
 * Distance Over Time Chart
 */
function initializeDistanceChart(data) {
  // CHART TYPE CONFIG: Change 'line' to 'bar' to switch visualization style
  const CHART_TYPE = 'bar'; // Options: 'line' or 'bar'

  if (!data.aggregated || !data.aggregated.monthly) {
    return;
  }

  const monthlyData = data.aggregated.monthly;

  // Sort by month
  monthlyData.sort((a, b) => a.month.localeCompare(b.month));

  // Filter out first month if it's partial (activities don't start in first few days)
  let filteredMonthlyData = [...monthlyData];
  if (filteredMonthlyData.length > 0 && data.activities) {
    const firstMonth = filteredMonthlyData[0].month;
    const activitiesInFirstMonth = data.activities.filter(a =>
      a.start_date_local && a.start_date_local.startsWith(firstMonth)
    );

    if (activitiesInFirstMonth.length > 0) {
      // Find the earliest activity in the first month
      const earliestActivity = activitiesInFirstMonth.reduce((earliest, current) =>
        current.start_date_local < earliest.start_date_local ? current : earliest
      );

      // Extract day of month from date (format: YYYY-MM-DD)
      const dayOfMonth = parseInt(earliestActivity.start_date_local.split('T')[0].split('-')[2]);

      // If first activity is after day 3, consider it a partial month and remove it
      if (dayOfMonth > 3) {
        filteredMonthlyData = filteredMonthlyData.slice(1);
      }
    }
  }

  // Take last 12 months
  const last12Months = filteredMonthlyData.slice(-12);

  const colors = getThemeColors();

  const options = {
    series: [{
      name: 'Distance (km)',
      data: last12Months.map(m => ({
        x: formatMonth(m.month),
        y: (m.total_distance / 1000).toFixed(1)
      }))
    }],
    chart: {
      type: CHART_TYPE,
      height: 350,
      toolbar: {
        show: false
      },
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    },
    colors: [colors.textPrimary],
    xaxis: {
      type: 'category',
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Distance (km)',
        style: {
          color: colors.textPrimary,
          fontSize: '12px'
        }
      },
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: colors.borderPrimary
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + ' km';
        }
      }
    }
  };

  // Add chart type-specific options
  if (CHART_TYPE === 'line') {
    options.stroke = {
      curve: 'smooth',
      width: 2
    };
  } else if (CHART_TYPE === 'bar') {
    options.plotOptions = {
      bar: {
        borderRadius: 4,
        columnWidth: '60%'
      }
    };
  }

  const chart = new ApexCharts(document.querySelector('#distance-chart'), options);
  chart.render();
  chartInstances.distance = chart;
}

/**
 * Average Pace Chart
 */
function initializePaceChart(data) {
  if (!data.activities) {
    return;
  }

  // Filter only runs and calculate monthly average pace
  const runs = data.activities.filter(a => a.type === 'Run');

  // Group by month and calculate average pace
  const monthlyPace = {};

  runs.forEach(run => {
    const month = run.start_date.substring(0, 7); // YYYY-MM
    const paceMinPerKm = (run.moving_time / 60) / (run.distance / 1000);

    if (!monthlyPace[month]) {
      monthlyPace[month] = { total: 0, count: 0 };
    }

    monthlyPace[month].total += paceMinPerKm;
    monthlyPace[month].count += 1;
  });

  // Calculate averages and sort
  const paceData = Object.keys(monthlyPace)
    .map(month => ({
      month: month,
      avgPace: monthlyPace[month].total / monthlyPace[month].count
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months

  const colors = getThemeColors();

  const options = {
    series: [{
      name: 'Avg Pace (min/km)',
      data: paceData.map(p => ({
        x: formatMonth(p.month),
        y: p.avgPace.toFixed(2)
      }))
    }],
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false
      },
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    colors: [colors.textPrimary],
    xaxis: {
      type: 'category',
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Pace (min/km)',
        style: {
          color: colors.textPrimary,
          fontSize: '12px'
        }
      },
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        },
        formatter: function(val) {
          const minutes = Math.floor(val);
          const seconds = Math.round((val - minutes) * 60);
          return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        }
      },
      reversed: true // Lower pace is better
    },
    grid: {
      borderColor: colors.borderPrimary
    },
    tooltip: {
      y: {
        formatter: function(val) {
          const minutes = Math.floor(val);
          const seconds = Math.round((val - minutes) * 60);
          return minutes + ':' + (seconds < 10 ? '0' : '') + seconds + ' /km';
        }
      }
    }
  };

  const chart = new ApexCharts(document.querySelector('#pace-chart'), options);
  chart.render();
  chartInstances.pace = chart;
}

/**
 * Heart Rate Zones Distribution Chart
 */
function initializeHRZonesChart(data) {
  if (!data.activities) {
    return;
  }

  // Define HR zones
  const zones = [
    { name: 'Recovery', min: 0, max: 130, color: '#90EE90' },
    { name: 'Easy', min: 130, max: 150, color: '#87CEEB' },
    { name: 'Moderate', min: 150, max: 165, color: '#FFD700' },
    { name: 'Hard', min: 165, max: 180, color: '#FF8C00' },
    { name: 'Max', min: 180, max: 220, color: '#FF4500' }
  ];

  // Count activities in each zone based on average HR
  const zoneCounts = zones.map(zone => ({ ...zone, count: 0 }));

  data.activities.forEach(activity => {
    if (activity.type === 'Run' && activity.has_heartrate && activity.average_heartrate) {
      const avgHR = activity.average_heartrate;
      const zone = zoneCounts.find(z => avgHR >= z.min && avgHR < z.max);
      if (zone) {
        zone.count++;
      }
    }
  });

  // Filter out zones with no activities
  const activeZones = zoneCounts.filter(z => z.count > 0);

  const colors = getThemeColors();

  if (activeZones.length === 0) {
    document.querySelector('#hr-zones-chart').innerHTML =
      `<p style="text-align: center; color: ${colors.textLight}; padding: 40px;">No heart rate data available</p>`;
    return;
  }

  const options = {
    series: [{
      name: 'Number of Runs',
      data: activeZones.map(z => z.count)
    }],
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false
      },
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
        distributed: true,
        dataLabels: {
          position: 'right'
        }
      }
    },
    colors: activeZones.map(z => z.color),
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val + ' runs';
      },
      style: {
        colors: [colors.textPrimary],
        fontSize: '12px'
      }
    },
    xaxis: {
      categories: activeZones.map(z => `${z.name} (${z.min}-${z.max} bpm)`),
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: colors.borderPrimary
    },
    legend: {
      show: false
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + ' runs';
        }
      }
    }
  };

  const chart = new ApexCharts(document.querySelector('#hr-zones-chart'), options);
  chart.render();
  chartInstances.hrZones = chart;
}

/**
 * Running Efficiency Chart (Pace vs Heart Rate over time)
 */
function initializeEfficiencyChart(data) {
  if (!data.activities) {
    return;
  }

  // Filter runs with HR data and sort by date
  const runsWithHR = data.activities
    .filter(a => {
      if (a.type !== 'Run' || !a.has_heartrate || !a.average_heartrate || a.distance <= 1000) {
        return false;
      }
      // Exclude runs with pace slower than 5:30 min/km
      const paceMinPerKm = (a.moving_time / 60) / (a.distance / 1000);
      return paceMinPerKm <= 5.5;
    })
    .sort((a, b) => new Date(a.start_date_local) - new Date(b.start_date_local))
    .slice(-50); // Last 50 runs with HR data

  const colors = getThemeColors();

  if (runsWithHR.length === 0) {
    document.querySelector('#efficiency-chart').innerHTML =
      `<p style="text-align: center; color: ${colors.textLight}; padding: 40px;">Not enough heart rate data available</p>`;
    return;
  }

  // Get date range for color mapping
  const timestamps = runsWithHR.map(r => new Date(r.start_date_local).getTime());
  const minDate = Math.min(...timestamps);
  const maxDate = Math.max(...timestamps);
  const dateRange = maxDate - minDate || 1;

  // Calculate pace, EF, and color for each run
  const scatterData = runsWithHR.map((run, index) => {
    const paceMinPerKm = (run.moving_time / 60) / (run.distance / 1000);
    const speedKmPerMin = 1 / paceMinPerKm; // km/min
    const ef = speedKmPerMin / run.average_heartrate * 1000; // Scale for readability
    const timestamp = new Date(run.start_date_local).getTime();
    const dateProgress = (timestamp - minDate) / dateRange;

    // Color gradient: light gray (old) to dark blue (recent)
    const lightness = 80 - (dateProgress * 50); // 80 to 30
    const hue = 210; // Blue hue

    return {
      x: run.average_heartrate,
      y: paceMinPerKm,
      date: new Date(run.start_date_local).toLocaleDateString(),
      timestamp: timestamp,
      name: run.name,
      distance: (run.distance / 1000).toFixed(2),
      ef: ef.toFixed(2),
      color: `hsl(${hue}, 60%, ${lightness}%)`,
      dateProgress: dateProgress
    };
  });

  // Calculate LOWESS smoothed trend line
  // Sort by HR for LOWESS
  const sortedData = [...scatterData].sort((a, b) => a.x - b.x);

  // Simple LOWESS implementation with tricube weighting
  const lowessSmooth = (data, bandwidth = 0.3) => {
    const n = data.length;
    const result = [];

    for (let i = 0; i < n; i++) {
      const x0 = data[i].x;
      const distances = data.map(d => Math.abs(d.x - x0));
      const maxDist = Math.max(...distances);

      // Calculate weights using tricube kernel
      const weights = distances.map(d => {
        const u = d / (maxDist * bandwidth);
        return u < 1 ? Math.pow(1 - Math.pow(u, 3), 3) : 0;
      });

      // Weighted linear regression
      const sumW = weights.reduce((a, b) => a + b, 0);
      const sumWX = weights.reduce((sum, w, j) => sum + w * data[j].x, 0);
      const sumWY = weights.reduce((sum, w, j) => sum + w * data[j].y, 0);
      const sumWXX = weights.reduce((sum, w, j) => sum + w * data[j].x * data[j].x, 0);
      const sumWXY = weights.reduce((sum, w, j) => sum + w * data[j].x * data[j].y, 0);

      const meanX = sumWX / sumW;
      const meanY = sumWY / sumW;

      const slope = (sumWXY - sumW * meanX * meanY) / (sumWXX - sumW * meanX * meanX);
      const intercept = meanY - slope * meanX;

      result.push({ x: x0, y: slope * x0 + intercept });
    }

    return result;
  };

  const trendLineData = lowessSmooth(sortedData, 0.4);

  // Detect outliers using signed residuals
  // Positive residual = slower than trend (bad), Negative residual = faster than trend (good)
  const signedResiduals = scatterData.map((d, i) => {
    const trendY = trendLineData.find(t => Math.abs(t.x - d.x) < 1)?.y || d.y;
    return d.y - trendY; // Keep sign: positive = slower, negative = faster
  });

  const absResiduals = signedResiduals.map(r => Math.abs(r));
  const meanResidual = absResiduals.reduce((a, b) => a + b, 0) / absResiduals.length;
  const stdResidual = Math.sqrt(
    absResiduals.reduce((sum, r) => sum + Math.pow(r - meanResidual, 2), 0) / absResiduals.length
  );

  const threshold = 2 * stdResidual;

  // Classify outliers
  scatterData.forEach((d, i) => {
    const signedRes = signedResiduals[i];
    d.isPositiveOutlier = signedRes < -threshold; // Faster than expected (GOOD)
    d.isNegativeOutlier = signedRes > threshold;  // Slower than expected (BAD)
    d.isOutlier = d.isPositiveOutlier || d.isNegativeOutlier;
  });

  // Calculate overall and recent EF statistics
  const allEF = scatterData.map(d => parseFloat(d.ef));
  const meanEF = (allEF.reduce((a, b) => a + b, 0) / allEF.length).toFixed(2);

  // Last 30 days
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentEF = scatterData
    .filter(d => d.timestamp >= thirtyDaysAgo)
    .map(d => parseFloat(d.ef));
  const recentMeanEF = recentEF.length > 0
    ? (recentEF.reduce((a, b) => a + b, 0) / recentEF.length).toFixed(2)
    : meanEF;

  const options = {
    series: [
      {
        name: 'Runs',
        type: 'scatter',
        data: scatterData
      },
      {
        name: 'Trend',
        type: 'line',
        data: trendLineData
      }
    ],
    chart: {
      type: 'line', // Changed from 'scatter' to support mixed types
      height: 400,
      toolbar: {
        show: false
      },
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      zoom: {
        enabled: false
      },
      animations: {
        enabled: true,
        speed: 800
      }
    },
    colors: ['#4169E1', colors.textSecondary],
    stroke: {
      width: [0, 3],
      dashArray: [0, 0],
      curve: ['straight', 'straight']
    },
    fill: {
      opacity: [1, 0.5]
    },
    xaxis: {
      title: {
        text: 'Average Heart Rate (bpm)',
        style: {
          color: colors.textPrimary,
          fontSize: '12px',
          fontWeight: 600
        }
      },
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        }
      },
      tickAmount: 8
    },
    yaxis: {
      title: {
        text: 'Pace (min/km)',
        style: {
          color: colors.textPrimary,
          fontSize: '12px',
          fontWeight: 600
        }
      },
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        },
        formatter: function(val) {
          const minutes = Math.floor(val);
          const seconds = Math.round((val - minutes) * 60);
          return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
        }
      },
      reversed: true // Lower pace (faster) at top
    },
    grid: {
      borderColor: colors.borderPrimary,
      strokeDashArray: 3
    },
    markers: {
      size: [7, 0],
      strokeWidth: 2,
      strokeColors: [colors.bgPrimary],
      hover: {
        size: 10
      },
      discrete: scatterData.map((d, index) => ({
        seriesIndex: 0,
        dataPointIndex: index,
        fillColor: d.isPositiveOutlier ? '#4CAF50' : (d.isNegativeOutlier ? '#FF6B6B' : d.color),
        strokeColor: d.isOutlier ? colors.bgPrimary : colors.bgPrimary,
        strokeWidth: d.isOutlier ? 3 : 2,
        size: d.isOutlier ? 9 : 7,
        shape: d.isOutlier ? 'square' : 'circle'
      }))
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      markers: {
        width: 12,
        height: 12
      },
      labels: {
        colors: colors.textPrimary
      }
    },
    tooltip: {
      shared: false,
      intersect: true,
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        if (seriesIndex === 1) return ''; // No tooltip for trend line

        const colors = getThemeColors();
        const d = scatterData[dataPointIndex];
        const minutes = Math.floor(d.y);
        const seconds = Math.round((d.y - minutes) * 60);
        const pace = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

        let outlierBadge = '';
        if (d.isPositiveOutlier) {
          outlierBadge = '<span style="display: inline-block; background: #4CAF50; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 6px;">▲ FASTER</span>';
        } else if (d.isNegativeOutlier) {
          outlierBadge = '<span style="display: inline-block; background: #FF6B6B; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 6px;">▼ SLOWER</span>';
        }

        return `<div style="padding: 12px; background: ${colors.bgPrimary}; border: 1px solid ${colors.borderPrimary}; border-radius: 6px; min-width: 220px;">
          <strong style="color: ${colors.textSecondary}; font-size: 13px;">${d.name}</strong>${outlierBadge}<br>
          <div style="margin-top: 8px; font-size: 12px; color: ${colors.textMuted};">
            <strong>Date:</strong> ${d.date}<br>
            <strong>Distance:</strong> ${d.distance} km<br>
            <strong>HR:</strong> ${Math.round(d.x)} bpm<br>
            <strong>Pace:</strong> ${pace} /km<br>
            <strong>EF:</strong> ${d.ef}
          </div>
        </div>`;
      }
    },
    annotations: {
      position: 'back',
      yaxis: [],
      points: scatterData
        .filter(d => d.isOutlier)
        .map((d, idx) => ({
          x: d.x,
          y: d.y,
          marker: {
            size: 0
          },
          label: {
            text: d.isPositiveOutlier ? '▲' : '▼',
            offsetY: d.isPositiveOutlier ? -12 : -12,
            style: {
              fontSize: '14px',
              background: 'transparent',
              color: d.isPositiveOutlier ? '#4CAF50' : '#FF6B6B',
              fontWeight: 'bold'
            }
          }
        }))
    }
  };

  const chart = new ApexCharts(document.querySelector('#efficiency-chart'), options);
  chart.render();
  chartInstances.efficiency = chart;

  // Add EF statistics and interpretation below chart
  const chartContainer = document.querySelector('#efficiency-chart').parentElement;
  let statsElement = chartContainer.querySelector('.efficiency-stats');

  if (!statsElement) {
    statsElement = document.createElement('div');
    statsElement.className = 'efficiency-stats';
    chartContainer.appendChild(statsElement);
  }

  const positiveOutlierCount = scatterData.filter(d => d.isPositiveOutlier).length;
  const negativeOutlierCount = scatterData.filter(d => d.isNegativeOutlier).length;

  statsElement.innerHTML = `
    <div class="efficiency-metrics">
      <div class="efficiency-metric">
        <span class="metric-label">▲ Better than expected:</span>
        <span class="metric-value" style="color: #4CAF50;">${positiveOutlierCount}</span>
      </div>
      <div class="efficiency-metric">
        <span class="metric-label">▼ Worse than expected:</span>
        <span class="metric-value" style="color: #FF6B6B;">${negativeOutlierCount}</span>
      </div>
      <div class="efficiency-legend">
        <div class="legend-gradient-bar"></div>
        <div class="legend-labels-row">
          <span>Older</span>
          <span>Recent</span>
        </div>
      </div>
    </div>
    <div class="efficiency-info">
      <p class="efficiency-interpretation">
        ⚙️ Each dot represents one run. A flatter or upward-shifting <strong>LOWESS trend line</strong> indicates improved aerobic efficiency (faster pace at the same heart rate).
      </p>
      <div class="efficiency-outlier-guide">
        <div class="outlier-guide-item">
          <span class="outlier-icon" style="color: #4CAF50; font-weight: bold;">▲</span>
          <span class="outlier-text"><strong>Faster pace</strong> (better efficiency) — pace faster than expected for given HR</span>
        </div>
        <div class="outlier-guide-item">
          <span class="outlier-icon" style="color: #FF6B6B; font-weight: bold;">▼</span>
          <span class="outlier-text"><strong>Slower pace</strong> (less efficient) — pace slower than expected for given HR</span>
        </div>
      </div>
      <p class="efficiency-features">
        • <strong>Color:</strong> Light to dark blue shows older to recent runs<br>
        • <strong>Outliers:</strong> Green squares (▲) and red squares (▼) mark unusual performances (±2σ from trend)<br>
        • <strong>Trend:</strong> LOWESS smoothed line captures non-linear HR response patterns
      </p>
    </div>
  `;
}

/**
 * Activity Map with Leaflet.js
 */
function initializeActivityMap(data) {
  if (!data.activities) {
    return;
  }

  const mapElement = document.getElementById('activity-map');
  if (!mapElement) {
    return;
  }

  const colors = getThemeColors();

  // Collect activity data first before initializing map
  const activityCenters = [];
  const allPolylines = [];
  let routeCount = 0;

  // Use last 10 activities to focus on current/local training area
  const recentActivities = data.activities.slice(0, 10);

  // First pass: decode polylines and collect centers
  recentActivities.forEach((activity, index) => {
    if (activity.type === 'Run' && activity.map && activity.map.summary_polyline) {
      try {
        const polyline = decodePolyline(activity.map.summary_polyline);

        if (polyline.length > 0) {
          allPolylines.push({ polyline, activity });

          // Calculate center of this activity
          const centerLat = polyline.reduce((sum, p) => sum + p[0], 0) / polyline.length;
          const centerLng = polyline.reduce((sum, p) => sum + p[1], 0) / polyline.length;
          activityCenters.push([centerLat, centerLng]);

          routeCount++;
        }
      } catch (e) {
        console.warn('Could not decode polyline for activity:', activity.id, e);
      }
    }
  });

  // Calculate center point using median (more robust to outliers)
  let centerLat = 51.05; // Gent default
  let centerLng = 3.72;
  let zoom = 12;

  if (activityCenters.length > 0) {
    // Sort and find median
    const lats = activityCenters.map(p => p[0]).sort((a, b) => a - b);
    const lngs = activityCenters.map(p => p[1]).sort((a, b) => a - b);

    const midIndex = Math.floor(lats.length / 2);
    centerLat = lats.length % 2 === 0
      ? (lats[midIndex - 1] + lats[midIndex]) / 2
      : lats[midIndex];
    centerLng = lngs.length % 2 === 0
      ? (lngs[midIndex - 1] + lngs[midIndex]) / 2
      : lngs[midIndex];
  }

  // Initialize map with calculated center
  const map = L.map('activity-map').setView([centerLat, centerLng], zoom);

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  // Calculate tile coverage for explorer view
  const visitedTiles = new Set();
  const tileZoom = 14; // Tile zoom level for coverage calculation

  allPolylines.forEach(({ polyline }) => {
    polyline.forEach(([lat, lng]) => {
      const tileX = Math.floor((lng + 180) / 360 * Math.pow(2, tileZoom));
      const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, tileZoom));
      visitedTiles.add(`${tileX},${tileY}`);
    });
  });

  // Add coverage overlay
  visitedTiles.forEach(tileKey => {
    const [tileX, tileY] = tileKey.split(',').map(Number);
    const n = Math.pow(2, tileZoom);
    const lng1 = tileX / n * 360 - 180;
    const lng2 = (tileX + 1) / n * 360 - 180;
    const lat1 = Math.atan(Math.sinh(Math.PI * (1 - 2 * tileY / n))) * 180 / Math.PI;
    const lat2 = Math.atan(Math.sinh(Math.PI * (1 - 2 * (tileY + 1) / n))) * 180 / Math.PI;

    L.rectangle([[lat1, lng1], [lat2, lng2]], {
      color: '#4169E1',
      weight: 1,
      fillColor: '#4169E1',
      fillOpacity: 0.05
    }).addTo(map);
  });

  // Second pass: add polylines to map
  allPolylines.forEach(({ polyline, activity }) => {
    const line = L.polyline(polyline, {
      color: '#4169E1',  // Royal blue - visible in both light and dark modes
      weight: 2,
      opacity: 0.7
    }).addTo(map);

    // Add popup with activity info
    line.bindPopup(`
      <strong>${activity.name}</strong><br>
      ${(activity.distance / 1000).toFixed(2)} km<br>
      ${new Date(activity.start_date_local).toLocaleDateString()}
    `);
  });

  // Fit bounds to activity centers if we have multiple activities
  if (activityCenters.length > 1) {
    const centerBounds = L.latLngBounds(activityCenters);
    map.fitBounds(centerBounds, {
      padding: [50, 50],
      maxZoom: 13
    });
  }

  console.log(`Loaded ${routeCount} activity routes on map with ${visitedTiles.size} explored tiles, centered at [${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}]`);
}

/**
 * Decode polyline encoded string to array of [lat, lng] coordinates
 * Based on Google's polyline encoding algorithm
 */
function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/**
 * Format month string (YYYY-MM) to readable format
 */
function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Activity Calendar - shows last 4 months of activities with TSS intensity
 */
function initializeActivityCalendar(data) {
  if (!data.activities) {
    return;
  }

  const calendarElement = document.getElementById('activity-calendar');
  if (!calendarElement) {
    return;
  }

  const colors = getThemeColors();

  // Initialize metrics calculator
  const metrics = new StravaMetrics(data);

  // Get dates for last 4 months
  const today = new Date();
  const fourMonthsAgo = new Date(today);
  fourMonthsAgo.setMonth(today.getMonth() - 4);

  // Create map of dates with activities and TSS
  const activityDates = new Map();
  data.activities.forEach(activity => {
    if (activity.type === 'Run') {
      const activityDate = new Date(activity.start_date_local);
      if (activityDate >= fourMonthsAgo) {
        const dateKey = activityDate.toISOString().split('T')[0];
        if (!activityDates.has(dateKey)) {
          activityDates.set(dateKey, { activities: [], tss: 0 });
        }
        const tss = metrics.calculateTSS(activity);
        activityDates.get(dateKey).activities.push(activity);
        activityDates.get(dateKey).tss += tss;
      }
    }
  });

  // Find max TSS for scaling colors
  let maxTSS = 0;
  activityDates.forEach(data => {
    if (data.tss > maxTSS) maxTSS = data.tss;
  });

  // Generate calendar HTML
  let calendarHTML = '<div class="calendar-months">';

  // Generate for current month and previous month only
  for (let i = 1; i >= 0; i--) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    calendarHTML += `<div class="calendar-month">`;
    calendarHTML += `<h3 class="calendar-month-title">${monthName}</h3>`;
    calendarHTML += `<div class="calendar-grid">`;

    // Add day headers
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayNames.forEach(day => {
      calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });

    // Calculate first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = monthDate.getDay();
    // Adjust so Monday is 0 (shift Sunday to 6)
    const firstDayAdjusted = firstDay === 0 ? 6 : firstDay - 1;

    // Add empty cells for days before month starts
    for (let j = 0; j < firstDayAdjusted; j++) {
      calendarHTML += `<div class="calendar-day calendar-day-empty"></div>`;
    }

    // Get number of days in month
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayData = activityDates.get(dateKey);
      const isFuture = currentDate > today;
      const hasActivity = !isFuture && dayData && dayData.activities.length > 0;

      let dayClass = 'calendar-day';
      let dayStyle = '';

      if (hasActivity) {
        dayClass += ' calendar-day-active';

        // Calculate color intensity based on TSS (0-100% scale)
        const intensity = Math.min(dayData.tss / Math.max(maxTSS, 100), 1);
        // Use grayscale from light to dark gray
        const grayValue = Math.round(255 - (intensity * 180)); // 255 (light) to 75 (dark)
        dayStyle = `background-color: rgb(${grayValue}, ${grayValue}, ${grayValue});`;
      }

      let title = '';
      if (hasActivity) {
        const totalDistance = dayData.activities.reduce((sum, a) => sum + a.distance, 0) / 1000;
        title = `${dayData.activities.length} run${dayData.activities.length > 1 ? 's' : ''} - ${totalDistance.toFixed(1)} km - TSS: ${Math.round(dayData.tss)}`;
      }

      calendarHTML += `<div class="${dayClass}" style="${dayStyle}" title="${title}">`;
      calendarHTML += `<span class="calendar-day-number">${day}</span>`;
      calendarHTML += `</div>`;
    }

    calendarHTML += `</div>`; // calendar-grid
    calendarHTML += `</div>`; // calendar-month
  }

  calendarHTML += '</div>'; // calendar-months

  // Add gradient legend below calendars
  calendarHTML += '<div class="calendar-legend">';
  calendarHTML += '<span class="legend-label">Training Load:</span>';
  calendarHTML += '<div class="legend-gradient"></div>';
  calendarHTML += '<div class="legend-labels">';
  calendarHTML += '<span class="legend-text">Low</span>';
  calendarHTML += '<span class="legend-text">High</span>';
  calendarHTML += '</div>';
  calendarHTML += '</div>';

  calendarElement.innerHTML = calendarHTML;
}

/**
 * VO2max Trend Chart
 */
function initializeVO2maxChart(data) {
  if (!data.activities) {
    return;
  }

  const metrics = new StravaMetrics(data);
  const vo2History = metrics.generateVO2maxHistory();

  const colors = getThemeColors();

  if (vo2History.length === 0) {
    document.querySelector('#vo2max-chart').innerHTML =
      `<p style="text-align: center; color: ${colors.textLight}; padding: 40px;">Not enough data to estimate VO2max. Need runs >3km with heart rate data.</p>`;
    return;
  }

  const options = {
    series: [{
      name: 'VO2max',
      data: vo2History.map(h => ({
        x: new Date(h.date).getTime(),
        y: h.vo2max
      }))
    }],
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false
      },
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    colors: [colors.textPrimary],
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'VO2max (ml/kg/min)',
        style: {
          color: colors.textPrimary,
          fontSize: '12px'
        }
      },
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        }
      },
      min: Math.floor(Math.min(...vo2History.map(h => h.vo2max)) - 2),
      max: Math.ceil(Math.max(...vo2History.map(h => h.vo2max)) + 2)
    },
    grid: {
      borderColor: colors.borderPrimary
    },
    tooltip: {
      x: {
        format: 'MMM dd, yyyy'
      },
      custom: function({ seriesIndex, dataPointIndex, w }) {
        const colors = getThemeColors();
        const point = vo2History[dataPointIndex];
        return `<div style="padding: 10px; background: ${colors.bgPrimary}; border: 1px solid ${colors.borderPrimary}; border-radius: 4px;">
          <strong>${point.activityName}</strong><br>
          ${new Date(point.date).toLocaleDateString()}<br>
          <strong>VO2max:</strong> ${point.vo2max.toFixed(1)} ml/kg/min<br>
          <strong>Distance:</strong> ${(point.distance / 1000).toFixed(2)} km
        </div>`;
      }
    }
  };

  const chart = new ApexCharts(document.querySelector('#vo2max-chart'), options);
  chart.render();
  chartInstances.vo2max = chart;
}

/**
 * Race Predictions Table
 */
function initializeRacePredictions(data) {
  if (!data.activities) {
    return;
  }

  const metrics = new StravaMetrics(data);
  const predictions = metrics.predictRaceTimes();

  const predElement = document.querySelector('#race-predictions');
  if (!predElement) return;

  const colors = getThemeColors();

  if (!predictions) {
    predElement.innerHTML =
      `<p style="text-align: center; color: ${colors.textLight}; padding: 20px;">Not enough data for race predictions.</p>`;
    return;
  }

  let html = `
    <div class="predictions-header">
      <p>Based on current VO2max: <strong>${predictions.currentVO2max}</strong> ml/kg/min</p>
    </div>
    <table class="predictions-table">
      <thead>
        <tr>
          <th>Distance</th>
          <th>Predicted Time</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const [distance, time] of Object.entries(predictions.predictions)) {
    html += `
      <tr>
        <td>${distance}</td>
        <td>${time}</td>
      </tr>
    `;
  }

  html += `
      </tbody>
    </table>
  `;

  predElement.innerHTML = html;
}

/**
 * Training Load Chart (CTL/ATL/TSB)
 */
function initializeTrainingLoadChart(data) {
  if (!data.activities) {
    return;
  }

  const metrics = new StravaMetrics(data);
  const history = metrics.generateTrainingLoadHistory(90);

  const colors = getThemeColors();

  if (history.length === 0) {
    document.querySelector('#training-load-chart').innerHTML =
      `<p style="text-align: center; color: ${colors.textLight}; padding: 40px;">Not enough activity data.</p>`;
    return;
  }

  // Calculate warm-up period (first 42 days)
  const WARMUP_DAYS = 42;
  const firstDate = new Date(history[0].date).getTime();
  const warmupEndDate = new Date(history[0].date);
  warmupEndDate.setDate(warmupEndDate.getDate() + WARMUP_DAYS);
  const warmupEndTime = warmupEndDate.getTime();
  const lastDate = new Date(history[history.length - 1].date).getTime();

  // Check if entire dataset is within warm-up period
  const entirelyWarmup = history.length <= WARMUP_DAYS;

  const options = {
    series: [
      {
        name: 'CTL (Fitness)',
        data: history.map(h => ({ x: new Date(h.date).getTime(), y: h.ctl }))
      },
      {
        name: 'ATL (Fatigue)',
        data: history.map(h => ({ x: new Date(h.date).getTime(), y: h.atl }))
      },
      {
        name: 'TSB (Form)',
        data: history.map(h => ({ x: new Date(h.date).getTime(), y: h.tsb }))
      }
    ],
    chart: {
      type: 'line',
      height: 400,
      toolbar: {
        show: false
      },
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    colors: ['#4169E1', '#DC143C', '#32CD32'],
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Training Load',
        style: {
          color: colors.textPrimary,
          fontSize: '12px'
        }
      },
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: colors.borderPrimary
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      labels: {
        colors: colors.textPrimary
      }
    },
    tooltip: {
      x: {
        format: 'MMM dd, yyyy'
      }
    },
    annotations: {
      xaxis: [
        {
          x: firstDate,
          x2: entirelyWarmup ? lastDate : warmupEndTime,
          fillColor: colors.textMuted,
          opacity: 0.15,
          label: {
            text: 'Warm-up period',
            borderColor: 'transparent',
            style: {
              color: colors.textMuted,
              background: 'transparent',
              fontSize: '11px'
            },
            position: 'top',
            offsetY: 0
          }
        }
      ]
    }
  };

  const chart = new ApexCharts(document.querySelector('#training-load-chart'), options);
  chart.render();
  chartInstances.trainingLoad = chart;

  // Add warning caption below the chart
  const chartContainer = document.querySelector('#training-load-chart').parentElement;
  let captionElement = chartContainer.querySelector('.warmup-caption');

  if (!captionElement) {
    captionElement = document.createElement('p');
    captionElement.className = 'warmup-caption';
    chartContainer.appendChild(captionElement);
  }

  captionElement.innerHTML = '⚠️ <strong>Model warm-up:</strong> Absolute fitness values may be underestimated during the first 6 weeks due to limited historical data.';
}

/**
 * Power-Duration Curve Chart
 */
function initializePowerCurveChart(data) {
  if (!data.activities) {
    return;
  }

  const metrics = new StravaMetrics(data);
  const powerData = metrics.analyzePowerCurve();

  const chartElement = document.querySelector('#power-curve-chart');
  if (!chartElement) return;

  const colors = getThemeColors();

  if (!powerData || powerData.curve.length === 0) {
    chartElement.innerHTML =
      `<p style="text-align: center; color: ${colors.textLight}; padding: 40px;">No power data available. Power meter required.</p>`;
    return;
  }

  const options = {
    series: [{
      name: 'Best Power',
      data: powerData.curve.map(c => ({
        x: c.duration,
        y: c.power
      }))
    }],
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false
      },
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    colors: [colors.textPrimary],
    xaxis: {
      type: 'numeric',
      title: {
        text: 'Duration (seconds)',
        style: {
          color: colors.textPrimary,
          fontSize: '12px'
        }
      },
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        },
        formatter: function(val) {
          if (val < 60) return val + 's';
          if (val < 3600) return (val / 60).toFixed(0) + 'min';
          return (val / 3600).toFixed(1) + 'h';
        }
      }
    },
    yaxis: {
      title: {
        text: 'Power (watts)',
        style: {
          color: colors.textPrimary,
          fontSize: '12px'
        }
      },
      labels: {
        style: {
          colors: colors.textPrimary,
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: colors.borderPrimary
    },
    markers: {
      size: 5,
      strokeWidth: 1,
      strokeColors: colors.bgPrimary,
      hover: {
        size: 7
      }
    },
    tooltip: {
      custom: function({ seriesIndex, dataPointIndex, w }) {
        const colors = getThemeColors();
        const point = powerData.curve[dataPointIndex];
        let durationStr = '';
        if (point.duration < 60) durationStr = point.duration + 's';
        else if (point.duration < 3600) durationStr = Math.round(point.duration / 60) + ' min';
        else durationStr = (point.duration / 3600).toFixed(1) + ' hours';

        return `<div style="padding: 10px; background: ${colors.bgPrimary}; border: 1px solid ${colors.borderPrimary}; border-radius: 4px;">
          <strong>${point.activityName}</strong><br>
          ${new Date(point.date).toLocaleDateString()}<br>
          <strong>Duration:</strong> ${durationStr}<br>
          <strong>Power:</strong> ${point.power}W
        </div>`;
      }
    },
    annotations: powerData.criticalPower ? {
      yaxis: [{
        y: powerData.criticalPower.cp,
        borderColor: colors.textLight,
        label: {
          borderColor: colors.textLight,
          style: {
            color: colors.bgPrimary,
            background: colors.textLight,
          },
          text: `Critical Power: ${powerData.criticalPower.cp}W`
        }
      }]
    } : {}
  };

  const chart = new ApexCharts(chartElement, options);
  chart.render();
  chartInstances.powerCurve = chart;
}

/**
 * Interval Scorecard Table
 */
function initializeIntervalScorecard(data) {
  if (!data.activities) {
    return;
  }

  const metrics = new StravaMetrics(data);
  const intervals = metrics.detectIntervals();

  const scorecardElement = document.querySelector('#interval-scorecard');
  if (!scorecardElement) return;

  const colors = getThemeColors();

  if (intervals.length === 0) {
    scorecardElement.innerHTML =
      `<p style="text-align: center; color: ${colors.textLight}; padding: 20px;">No interval workouts detected. Workouts with "interval", "tempo", or "rep" in the name will appear here.</p>`;
    return;
  }

  // Show last 10 interval workouts
  const recentIntervals = intervals.slice(0, 10);

  let html = `
    <table class="interval-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Workout</th>
          <th>Distance</th>
          <th>Avg Pace</th>
          <th>Avg HR</th>
          <th>Avg Power</th>
          <th>TSS</th>
          <th>Quality</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const workout of recentIntervals) {
    html += `
      <tr>
        <td>${new Date(workout.date).toLocaleDateString()}</td>
        <td class="workout-name">${workout.name}</td>
        <td>${workout.distance} km</td>
        <td>${workout.avgPace}</td>
        <td>${workout.avgHR ? workout.avgHR + ' bpm' : '-'}</td>
        <td>${workout.avgPower ? workout.avgPower + 'W' : '-'}</td>
        <td>${workout.tss}</td>
        <td><span class="quality-badge quality-${Math.floor(workout.quality / 3)}">${workout.quality.toFixed(1)}/10</span></td>
      </tr>
    `;
  }

  html += `
      </tbody>
    </table>
  `;

  scorecardElement.innerHTML = html;
}
