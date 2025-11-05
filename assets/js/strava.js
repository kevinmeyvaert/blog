/**
 * Strava Data Visualization Script
 * Initializes ApexCharts and Leaflet.js for running statistics
 */

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
  initializeActivityMap(data);
  initializeActivityCalendar(data);
}

/**
 * Distance Over Time Chart
 */
function initializeDistanceChart(data) {
  if (!data.aggregated || !data.aggregated.monthly) {
    return;
  }

  const monthlyData = data.aggregated.monthly;

  // Sort by month
  monthlyData.sort((a, b) => a.month.localeCompare(b.month));

  // Take last 12 months
  const last12Months = monthlyData.slice(-12);

  const options = {
    series: [{
      name: 'Distance (km)',
      data: last12Months.map(m => ({
        x: formatMonth(m.month),
        y: (m.total_distance / 1000).toFixed(1)
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
    colors: ['#000000'],
    xaxis: {
      type: 'category',
      labels: {
        style: {
          colors: '#000000',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Distance (km)',
        style: {
          color: '#000000',
          fontSize: '12px'
        }
      },
      labels: {
        style: {
          colors: '#000000',
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: '#e0e0e0'
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + ' km';
        }
      }
    }
  };

  const chart = new ApexCharts(document.querySelector('#distance-chart'), options);
  chart.render();
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
    colors: ['#000000'],
    xaxis: {
      type: 'category',
      labels: {
        style: {
          colors: '#000000',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Pace (min/km)',
        style: {
          color: '#000000',
          fontSize: '12px'
        }
      },
      labels: {
        style: {
          colors: '#000000',
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
      borderColor: '#e0e0e0'
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

  if (activeZones.length === 0) {
    document.querySelector('#hr-zones-chart').innerHTML =
      '<p style="text-align: center; color: #999; padding: 40px;">No heart rate data available</p>';
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
        colors: ['#000000'],
        fontSize: '12px'
      }
    },
    xaxis: {
      categories: activeZones.map(z => `${z.name} (${z.min}-${z.max} bpm)`),
      labels: {
        style: {
          colors: '#000000',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#000000',
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: '#e0e0e0'
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
    .filter(a => a.type === 'Run' && a.has_heartrate && a.average_heartrate && a.distance > 1000)
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(-50); // Last 50 runs with HR data

  if (runsWithHR.length === 0) {
    document.querySelector('#efficiency-chart').innerHTML =
      '<p style="text-align: center; color: #999; padding: 40px;">Not enough heart rate data available</p>';
    return;
  }

  // Calculate pace (min/km) and HR for each run
  const scatterData = runsWithHR.map(run => {
    const paceMinPerKm = (run.moving_time / 60) / (run.distance / 1000);
    return {
      x: run.average_heartrate,
      y: paceMinPerKm,
      date: new Date(run.start_date_local).toLocaleDateString(),
      name: run.name
    };
  });

  const options = {
    series: [{
      name: 'Runs',
      data: scatterData
    }],
    chart: {
      type: 'scatter',
      height: 350,
      toolbar: {
        show: false
      },
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      zoom: {
        enabled: false
      }
    },
    colors: ['#000000'],
    xaxis: {
      title: {
        text: 'Average Heart Rate (bpm)',
        style: {
          color: '#000000',
          fontSize: '12px'
        }
      },
      labels: {
        style: {
          colors: '#000000',
          fontSize: '12px'
        }
      },
      tickAmount: 8
    },
    yaxis: {
      min: 3.0,
      max: 6.0,
      title: {
        text: 'Pace (min/km)',
        style: {
          color: '#000000',
          fontSize: '12px'
        }
      },
      labels: {
        style: {
          colors: '#000000',
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
      borderColor: '#e0e0e0'
    },
    markers: {
      size: 6,
      strokeWidth: 1,
      strokeColors: '#ffffff',
      hover: {
        size: 8
      }
    },
    tooltip: {
      custom: function({ seriesIndex, dataPointIndex, w }) {
        const data = scatterData[dataPointIndex];
        const minutes = Math.floor(data.y);
        const seconds = Math.round((data.y - minutes) * 60);
        const pace = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

        return `<div style="padding: 10px; background: white; border: 1px solid #e0e0e0; border-radius: 4px;">
          <strong>${data.name}</strong><br>
          ${data.date}<br>
          <strong>HR:</strong> ${Math.round(data.x)} bpm<br>
          <strong>Pace:</strong> ${pace} /km
        </div>`;
      }
    }
  };

  const chart = new ApexCharts(document.querySelector('#efficiency-chart'), options);
  chart.render();
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

  // Second pass: add polylines to map
  allPolylines.forEach(({ polyline, activity }) => {
    const line = L.polyline(polyline, {
      color: '#000000',
      weight: 2,
      opacity: 0.3
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

  console.log(`Loaded ${routeCount} activity routes on map, centered at [${centerLat.toFixed(4)}, ${centerLng.toFixed(4)}]`);
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
 * Activity Calendar - shows last 4 months of activities
 */
function initializeActivityCalendar(data) {
  if (!data.activities) {
    return;
  }

  const calendarElement = document.getElementById('activity-calendar');
  if (!calendarElement) {
    return;
  }

  // Get dates for last 4 months
  const today = new Date();
  const fourMonthsAgo = new Date(today);
  fourMonthsAgo.setMonth(today.getMonth() - 4);

  // Create map of dates with activities
  const activityDates = new Map();
  data.activities.forEach(activity => {
    if (activity.type === 'Run') {
      const activityDate = new Date(activity.start_date_local);
      if (activityDate >= fourMonthsAgo) {
        const dateKey = activityDate.toISOString().split('T')[0];
        if (!activityDates.has(dateKey)) {
          activityDates.set(dateKey, []);
        }
        activityDates.get(dateKey).push(activity);
      }
    }
  });

  // Generate calendar HTML
  let calendarHTML = '<div class="calendar-months">';

  // Generate for current month and previous 3 months
  for (let i = 3; i >= 0; i--) {
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
      const activities = activityDates.get(dateKey) || [];
      const hasActivity = activities.length > 0;
      const isFuture = currentDate > today;

      let dayClass = 'calendar-day';
      if (isFuture) {
        dayClass += ' calendar-day-future';
      } else if (hasActivity) {
        dayClass += ' calendar-day-active';
      }

      let title = '';
      if (hasActivity) {
        const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0) / 1000;
        title = `${activities.length} run${activities.length > 1 ? 's' : ''} - ${totalDistance.toFixed(1)} km`;
      }

      calendarHTML += `<div class="${dayClass}" title="${title}">`;
      calendarHTML += `<span class="calendar-day-number">${day}</span>`;
      if (hasActivity) {
        calendarHTML += `<span class="calendar-day-indicator"></span>`;
      }
      calendarHTML += `</div>`;
    }

    calendarHTML += `</div>`; // calendar-grid
    calendarHTML += `</div>`; // calendar-month
  }

  calendarHTML += '</div>'; // calendar-months

  calendarElement.innerHTML = calendarHTML;
}
