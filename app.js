// PCC Trolley Tracker - Main Application

// Configuration
const CONFIG = {
    API_BASE: '/.netlify/functions/septa-proxy',
    REFRESH_INTERVAL: 60000,
    MINUTES_PER_STOP: 1.5,
    ESTIMATED_HEADWAY: 15
};

// ============================================
// SEPTA METRO & REGIONAL RAIL STATIONS
// Organized by SEPTA's new Metro branding
// ============================================

// Metro Lines
const METRO_LINES = {
    'B': {
        name: 'Broad Street Line',
        color: '#F37021',
        mode: 'metro',
        stations: [
            { name: 'Fern Rock TC', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Olney', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Logan', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Wyoming', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Hunting Park', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Erie', transfer_point: 'Girard', walk_time: 3 },
            { name: 'North Philadelphia', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Susquehanna-Dauphin', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Cecil B. Moore', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Girard', transfer_point: null, walk_time: 3 },
            { name: 'Fairmount', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Spring Garden', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Race-Vine', transfer_point: 'Girard', walk_time: 3 },
            { name: 'City Hall', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Walnut-Locust', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Lombard-South', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Ellsworth-Federal', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Tasker-Morris', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Snyder', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Oregon', transfer_point: 'Girard', walk_time: 3 },
            { name: 'AT&T', transfer_point: 'Girard', walk_time: 3 },
            { name: 'NRG', transfer_point: 'Girard', walk_time: 3 }
        ]
    },
    'L': {
        name: 'Market-Frankford Line',
        color: '#0070C0',
        mode: 'metro',
        stations: [
            { name: 'Frankford TC', transfer_point: 'Girard', walk_time: 3, note: 'Transfer to B at City Hall' },
            { name: 'Arrott TC', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Church', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Margaret-Orthodox', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Huntingdon', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Somerset', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Allegheny', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Tioga', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Erie-Torresdale', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Berks', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Girard (MFL)', transfer_point: null, walk_time: 5 },
            { name: 'Spring Garden (MFL)', transfer_point: 'Girard', walk_time: 3 },
            { name: '8th Street', transfer_point: 'Girard', walk_time: 3 },
            { name: '11th Street', transfer_point: 'Girard', walk_time: 3 },
            { name: '13th Street', transfer_point: 'Girard', walk_time: 3 },
            { name: '15th Street', transfer_point: 'Girard', walk_time: 3 },
            { name: 'City Hall (MFL)', transfer_point: 'Girard', walk_time: 3 },
            { name: '30th Street (MFL)', transfer_point: 'Girard', walk_time: 3 },
            { name: '40th Street', transfer_point: 'Girard', walk_time: 3 },
            { name: '46th Street', transfer_point: 'Girard', walk_time: 3 },
            { name: '52nd Street', transfer_point: 'Girard', walk_time: 3 },
            { name: '56th Street', transfer_point: 'Girard', walk_time: 3 },
            { name: '60th Street', transfer_point: 'Girard', walk_time: 3 },
            { name: '63rd Street', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Millbourne', transfer_point: 'Girard', walk_time: 3 },
            { name: '69th Street TC', transfer_point: 'Girard', walk_time: 3 }
        ]
    },
    'M': {
        name: 'Norristown High Speed Line',
        color: '#84329B',
        mode: 'metro',
        stations: [
            { name: '69th Street TC (NHSL)', transfer_point: 'Girard', walk_time: 3, note: 'Transfer to L' },
            { name: 'Beechwood-Brookline', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Drexel Hill Junction', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Drexel Manor', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Pennfield', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Township Line', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Wynnewood Road', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Ardmore Junction', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Bryn Mawr (NHSL)', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Roberts Road', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Villanova (NHSL)', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Radnor (NHSL)', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Garrett Hill', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Stadium', transfer_point: 'Girard', walk_time: 3 },
            { name: 'County Line', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Hughes Park', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Gulph Mills', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Matsonford', transfer_point: 'Girard', walk_time: 3 },
            { name: 'Norristown TC (NHSL)', transfer_point: 'Girard', walk_time: 3 }
        ]
    },
    'T': {
        name: 'Trolleys',
        color: '#00A650',
        mode: 'metro',
        routes: {
            'Route 10': [
                { name: '13th & Market (Route 10)', transfer_point: 'Girard', walk_time: 8 },
                { name: '36th & Lancaster', transfer_point: 'Girard', walk_time: 8 },
                { name: '40th & Lancaster', transfer_point: 'Girard', walk_time: 8 },
                { name: 'Overbrook', transfer_point: 'Girard', walk_time: 8 }
            ],
            'Route 11': [
                { name: '13th & Market (Route 11)', transfer_point: 'Girard', walk_time: 8 },
                { name: '40th & Woodland', transfer_point: 'Girard', walk_time: 8 },
                { name: 'Darby TC', transfer_point: 'Girard', walk_time: 8 }
            ],
            'Route 13': [
                { name: '13th & Market (Route 13)', transfer_point: 'Girard', walk_time: 8 },
                { name: '40th & Woodland (Route 13)', transfer_point: 'Girard', walk_time: 8 },
                { name: 'Yeadon', transfer_point: 'Girard', walk_time: 8 },
                { name: 'Darby TC (Route 13)', transfer_point: 'Girard', walk_time: 8 }
            ],
            'Route 34': [
                { name: '13th & Market (Route 34)', transfer_point: 'Girard', walk_time: 8 },
                { name: '61st & Baltimore', transfer_point: 'Girard', walk_time: 8 }
            ],
            'Route 36': [
                { name: '13th & Market (Route 36)', transfer_point: 'Girard', walk_time: 8 },
                { name: '58th & Baltimore', transfer_point: 'Girard', walk_time: 8 },
                { name: 'Eastwick', transfer_point: 'Girard', walk_time: 8 }
            ],
            'Route 15': [
                { name: '63rd & Girard (Route 15)', transfer_point: null, walk_time: 3 },
                { name: 'Broad & Girard', transfer_point: null, walk_time: 0 },
                { name: 'Richmond & Westmoreland', transfer_point: null, walk_time: 3 }
            ],
            'Route G': [
                { name: '63rd & Girard', transfer_point: null, walk_time: 3, note: 'PCC Trolley Route!' },
                { name: 'Broad & Girard (Route G)', transfer_point: null, walk_time: 0 },
                { name: 'Richmond & Westmoreland (Route G)', transfer_point: null, walk_time: 3 }
            ]
        }
    }
};

// Regional Rail Lines (dark grey #4A4A4D)
const REGIONAL_RAIL_LINES = {
    'Airport': {
        stations: ['Airport Terminal E-F', 'Airport Terminal C-D', 'Airport Terminal A-B', 'Eastwick', 'University City', '30th Street', 'Suburban', 'Jefferson']
    },
    'Chestnut Hill East': {
        stations: ['Chestnut Hill East', 'Gravers', 'Mt Airy', 'Sedgwick', 'Stenton', 'Wyndmoor', 'Germantown', 'Washington Lane', 'Wister', 'Wayne Junction', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'Chestnut Hill West': {
        stations: ['Chestnut Hill West', 'Highland', 'St. Martins', 'Allen Lane', 'Carpenter', 'Upsal', 'Tulpehocken', 'Chelten Avenue', 'Queen Lane', 'North Broad', 'Jefferson', 'Suburban', '30th Street']
    },
    'Cynwyd': {
        stations: ['Cynwyd', 'Bala', 'Wynnefield Avenue', 'Suburban', '30th Street']
    },
    'Fox Chase': {
        stations: ['Fox Chase', 'Ryers', 'Cheltenham', 'Lawndale', 'Olney', 'Wayne Junction', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'Lansdale/Doylestown': {
        stations: ['Doylestown', 'Delaware Valley College', 'New Britain', 'Chalfont', 'Colmar', 'Lansdale', 'Fortuna', 'Pennbrook', 'North Wales', 'Gwynedd Valley', 'Penllyn', 'Ambler', 'Fort Washington', 'Oreland', 'North Hills', 'Glenside', 'Ardsley', 'Roslyn', 'Jenkintown-Wyncote', 'Elkins Park', 'Melrose Park', 'Fern Rock TC', 'Wayne Junction', 'North Philadelphia', 'North Broad', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'Manayunk/Norristown': {
        stations: ['Elm Street', 'Main Street', 'Norristown TC', 'Conshohocken', 'Spring Mill', 'Miquon', 'Wissahickon', 'Manayunk', 'Ivy Ridge', 'East Falls', 'Allegheny', 'North Broad', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'Media/Wawa': {
        stations: ['Wawa', 'Media', 'Moylan-Rose Valley', 'Wallingford', 'Swarthmore', 'Morton', 'Secane', 'Primos', 'Clifton-Aldan', 'Gladstone', 'Lansdowne', 'Fernwood-Yeadon', 'Angora', '49th Street', '30th Street', 'Suburban', 'Jefferson']
    },
    'Paoli/Thorndale': {
        stations: ['Thorndale', 'Downingtown', 'Whitford', 'Exton', 'Malvern', 'Paoli', 'Daylesford', 'Berwyn', 'Devon', 'Strafford', 'Wayne', 'St. Davids', 'Radnor', 'Villanova', 'Rosemont', 'Bryn Mawr', 'Haverford', 'Ardmore', 'Wynnewood', 'Narberth', 'Merion', 'Overbrook', '30th Street', 'Suburban', 'Jefferson']
    },
    'Trenton': {
        stations: ['Trenton', 'Levittown', 'Bristol', 'Croydon', 'Eddington', 'Cornwells Heights', 'Torresdale', 'Holmesburg Junction', 'Tacony', 'Bridesburg', 'North Philadelphia', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'Warminster': {
        stations: ['Warminster', 'Hatboro', 'Willow Grove', 'Crestmont', 'Roslyn', 'Ardsley', 'Glenside', 'Jenkintown-Wyncote', 'Elkins Park', 'Melrose Park', 'Fern Rock TC', 'Wayne Junction', 'North Philadelphia', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'West Trenton': {
        stations: ['West Trenton', 'Yardley', 'Woodbourne', 'Langhorne', 'Neshaminy Falls', 'Trevose', 'Somerton', 'Forest Hills', 'Philmont', 'Bethayres', 'Meadowbrook', 'Rydal', 'Noble', 'Jenkintown-Wyncote', 'Elkins Park', 'Melrose Park', 'Fern Rock TC', 'Wayne Junction', 'North Philadelphia', 'North Broad', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'Wilmington/Newark': {
        stations: ['Newark', 'Wilmington', 'Claymont', 'Marcus Hook', 'Highland Avenue', 'Chester', 'Eddystone', 'Crum Lynne', 'Ridley Park', 'Prospect Park', 'Norwood', 'Glenolden', 'Folcroft', 'Sharon Hill', 'Darby', 'Curtis Park', 'Eastwick', '30th Street', 'Suburban', 'Jefferson']
    }
};

// Build flat STATIONS object for lookups
const STATIONS = {};

// Add Metro stations
for (const [lineId, line] of Object.entries(METRO_LINES)) {
    if (line.stations) {
        for (const station of line.stations) {
            const key = station.name;
            STATIONS[key] = {
                type: 'metro_' + lineId,
                line: lineId,
                lineName: line.name,
                transfer_point: station.transfer_point,
                walk_time: station.walk_time
            };
        }
    }
    if (line.routes) {
        for (const [routeName, stops] of Object.entries(line.routes)) {
            for (const station of stops) {
                const key = station.name;
                STATIONS[key] = {
                    type: 'metro_T',
                    line: 'T',
                    route: routeName,
                    lineName: routeName,
                    transfer_point: station.transfer_point,
                    walk_time: station.walk_time
                };
            }
        }
    }
}

// Add Regional Rail stations
for (const [lineName, line] of Object.entries(REGIONAL_RAIL_LINES)) {
    for (const stationName of line.stations) {
        // Determine transfer point based on station
        let transfer_point = 'North Broad St';
        let walk_time = 8;

        if (['Temple University', 'North Broad'].includes(stationName)) {
            transfer_point = null;
            walk_time = stationName === 'Temple University' ? 12 : 8;
        } else if (['Jefferson', 'Suburban', '30th Street'].includes(stationName)) {
            transfer_point = 'North Broad St';
        }

        const key = stationName;
        if (!STATIONS[key]) {
            STATIONS[key] = {
                type: 'regional_rail',
                line: lineName,
                lineName: lineName,
                api_name: stationName === '30th Street' ? '30th Street Station' :
                          stationName === 'Suburban' ? 'Suburban Station' :
                          stationName === 'Jefferson' ? 'Jefferson Station' : stationName,
                transfer_point: transfer_point,
                walk_time: walk_time
            };
        }
    }
}

// State
let selectedMode = localStorage.getItem('pcc_mode') || 'metro';
let selectedLine = localStorage.getItem('pcc_line') || 'B';
let selectedStation = localStorage.getItem('pcc_home_station') || 'Girard';

// ============================================
// MODE / LINE / STATION SELECTOR FUNCTIONS
// ============================================

function setMode(mode) {
    selectedMode = mode;
    localStorage.setItem('pcc_mode', mode);

    // Update mode button styles
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.mode-btn.${mode === 'metro' ? 'metro' : 'regional'}`).classList.add('active');

    // Set default line for this mode
    if (mode === 'metro') {
        selectedLine = 'B';
    } else {
        selectedLine = 'Manayunk/Norristown';
    }
    localStorage.setItem('pcc_line', selectedLine);

    // Rebuild line selector and station dropdown
    populateLineSelector();
    populateStationSelector();

    // Select first station on new line
    const select = document.getElementById('station-select');
    if (select.options.length > 0) {
        selectedStation = select.value;
        localStorage.setItem('pcc_home_station', selectedStation);
    }

    refreshData();
}

function setLine(lineId) {
    selectedLine = lineId;
    localStorage.setItem('pcc_line', lineId);

    // Update line button styles
    document.querySelectorAll('.line-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.line-btn[data-line="${lineId}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Rebuild station dropdown
    populateStationSelector();

    // Select first station on new line
    const select = document.getElementById('station-select');
    if (select.options.length > 0) {
        selectedStation = select.value;
        localStorage.setItem('pcc_home_station', selectedStation);
    }

    refreshData();
}

function populateLineSelector() {
    const container = document.getElementById('line-selector');

    if (selectedMode === 'metro') {
        // Show Metro lines: B, L, M, T
        container.innerHTML = `
            <button class="line-btn line-B ${selectedLine === 'B' ? 'active' : ''}" data-line="B" onclick="setLine('B')">
                <span class="line-letter">B</span> Broad St
            </button>
            <button class="line-btn line-L ${selectedLine === 'L' ? 'active' : ''}" data-line="L" onclick="setLine('L')">
                <span class="line-letter">L</span> Market-Frankford
            </button>
            <button class="line-btn line-M ${selectedLine === 'M' ? 'active' : ''}" data-line="M" onclick="setLine('M')">
                <span class="line-letter">M</span> Norristown
            </button>
            <button class="line-btn line-T ${selectedLine === 'T' ? 'active' : ''}" data-line="T" onclick="setLine('T')">
                <span class="line-letter">T</span> Trolleys
            </button>
        `;
    } else {
        // Show Regional Rail lines
        const rrLines = Object.keys(REGIONAL_RAIL_LINES);
        container.innerHTML = rrLines.map(line => `
            <button class="line-btn line-RR ${selectedLine === line ? 'active' : ''}" data-line="${line}" onclick="setLine('${line}')">
                ${line}
            </button>
        `).join('');
    }
}

// Broad & Girard stop info
const BROAD_GIRARD = {
    'Eastbound': { stop_id: '352', sequence: 33 },
    'Westbound': { stop_id: '343', sequence: 13 }
};

// Known stops along Route G for location context
const ROUTE_G_STOPS = {
    // Eastbound stops (heading toward Richmond/Westmoreland)
    1: '63rd & Girard (Terminal)',
    5: '60th & Girard',
    9: '56th & Girard',
    13: '52nd & Girard',
    17: '48th & Girard',
    21: '44th & Girard',
    25: '40th & Girard',
    29: '36th & Girard',
    33: 'Broad & Girard',
    37: '20th & Girard',
    41: '15th & Girard',
    45: 'Girard & Front',
    49: 'Frankford & Girard',
    53: 'Richmond & Westmoreland (Terminal)',
    // Westbound uses different sequence numbers
    // We'll estimate based on sequence
};

// State
let trolleyData = [];
let trainData = [];
let refreshTimer = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set initial mode button state
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.mode-btn.${selectedMode === 'metro' ? 'metro' : 'regional'}`).classList.add('active');

    // Build line selector and station dropdown
    populateLineSelector();
    populateStationSelector();

    refreshData();
    startAutoRefresh();
});

// Populate station dropdown based on selected mode and line
function populateStationSelector() {
    const select = document.getElementById('station-select');
    let stations = [];

    if (selectedMode === 'metro') {
        const line = METRO_LINES[selectedLine];
        if (line) {
            if (line.stations) {
                // B, L, M lines have simple station arrays
                stations = line.stations.map(s => s.name);
            } else if (line.routes) {
                // T (Trolleys) has routes with stations
                for (const [routeName, stops] of Object.entries(line.routes)) {
                    for (const stop of stops) {
                        stations.push(stop.name);
                    }
                }
            }
        }
    } else {
        // Regional Rail
        const line = REGIONAL_RAIL_LINES[selectedLine];
        if (line) {
            stations = [...line.stations];
        }
    }

    // Build the dropdown
    let html = '';
    let foundSelected = false;

    for (const name of stations) {
        const selected = name === selectedStation ? 'selected' : '';
        if (name === selectedStation) foundSelected = true;
        html += `<option value="${name}" ${selected}>${name}</option>`;
    }

    select.innerHTML = html;

    // If previously selected station isn't on this line, select the first one
    if (!foundSelected && stations.length > 0) {
        selectedStation = stations[0];
        localStorage.setItem('pcc_home_station', selectedStation);
        select.value = selectedStation;
    }
}

// Change station
function changeStation() {
    const select = document.getElementById('station-select');
    selectedStation = select.value;
    localStorage.setItem('pcc_home_station', selectedStation);
    refreshData();
}

function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(refreshData, CONFIG.REFRESH_INTERVAL);
}

async function refreshData() {
    const btn = document.getElementById('refresh-btn');
    btn.disabled = true;
    btn.textContent = '↻ Loading...';

    try {
        const [trolleys, trains] = await Promise.all([
            fetchTrolleyData(),
            fetchTrainData()
        ]);

        trolleyData = trolleys;
        trainData = trains;

        updateUI();
        updateLastRefresh();
    } catch (error) {
        console.error('Error refreshing data:', error);
        showError('Unable to fetch data. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = '↻ Refresh';
    }
}

async function fetchTrolleyData() {
    try {
        const response = await fetch(`${CONFIG.API_BASE}?type=trolleys`);
        if (!response.ok) throw new Error('API error');

        const data = await response.json();
        const trolleys = [];

        for (const route of (data.routes || [])) {
            for (const [routeId, vehicles] of Object.entries(route)) {
                if (routeId === 'G1') {
                    for (const vehicle of vehicles) {
                        const label = String(vehicle.label || '');

                        if (label.startsWith('23') && label.length === 4) {
                            const destination = (vehicle.destination || '').toUpperCase();

                            let direction = 'Unknown';
                            if (['RICHMOND', 'FISHTOWN', 'FRANKFORD', 'DELAWARE', 'WESTMORELAND'].some(d => destination.includes(d))) {
                                direction = 'Eastbound';
                            } else if (['63RD', 'PARKSIDE', '63'].some(d => destination.includes(d))) {
                                direction = 'Westbound';
                            }

                            const currentSeq = vehicle.next_stop_sequence;
                            let stopsAway = null;
                            let etaMinutes = null;

                            if (direction in BROAD_GIRARD && currentSeq != null) {
                                const broadSeq = BROAD_GIRARD[direction].sequence;
                                stopsAway = broadSeq - currentSeq;

                                if (stopsAway > 0) {
                                    etaMinutes = Math.round(stopsAway * CONFIG.MINUTES_PER_STOP);
                                } else if (stopsAway === 0) {
                                    etaMinutes = 0;
                                } else {
                                    // Already passed - calculate how long ago
                                    stopsAway = null;
                                    etaMinutes = null;
                                }
                            }

                            // Get approximate location
                            const location = getApproximateLocation(currentSeq, direction);

                            trolleys.push({
                                vehicle: label,
                                destination: vehicle.destination || '',
                                direction,
                                lat: vehicle.lat,
                                lng: vehicle.lng,
                                currentSequence: currentSeq,
                                stopsAway,
                                etaMinutes,
                                location,
                                nextStopId: vehicle.next_stop_id
                            });
                        }
                    }
                }
            }
        }

        return trolleys;
    } catch (error) {
        console.error('Trolley fetch error:', error);
        return [];
    }
}

function getApproximateLocation(sequence, direction) {
    if (sequence == null) return 'Location unknown';

    // For eastbound, we can use the sequence directly
    if (direction === 'Eastbound') {
        // Find the closest known stop
        const knownStops = Object.keys(ROUTE_G_STOPS).map(Number).sort((a, b) => a - b);

        for (let i = 0; i < knownStops.length; i++) {
            if (sequence <= knownStops[i]) {
                return `Near ${ROUTE_G_STOPS[knownStops[i]]}`;
            }
        }
        return 'Near Richmond & Westmoreland';
    } else if (direction === 'Westbound') {
        // Westbound sequence is roughly inverted
        // Broad & Girard is seq 13 westbound
        if (sequence < 8) return 'Near Richmond/Westmoreland area';
        if (sequence < 13) return 'Between Front St & Broad St';
        if (sequence === 13) return 'At Broad & Girard';
        if (sequence < 20) return 'Between Broad & 40th St';
        if (sequence < 25) return 'Between 40th & 52nd St';
        return 'Near 63rd St Terminal';
    }

    return `Stop sequence ${sequence}`;
}

async function fetchTrainData() {
    const stationConfig = STATIONS[selectedStation];

    if (!stationConfig) {
        console.error('No station config for:', selectedStation);
        return [];
    }

    // For stations where you just walk (e.g., Girard on BSL/MFL, Route G stops)
    if (!stationConfig.transfer_point) {
        return [{
            depart: 'Now',
            walkOnly: true,
            arrivalTime: new Date(Date.now() + stationConfig.walk_time * 60000),
            trainId: 'walk',
            line: `${stationConfig.walk_time} min walk`
        }];
    }

    // For Metro lines (B, L, M) - rapid transit, no real-time API
    if (stationConfig.type && stationConfig.type.startsWith('metro_') && stationConfig.type !== 'metro_T') {
        // Subway/rapid transit comes every 5-10 min, estimate total time
        const transitTime = 10; // average time on subway/train to transfer point
        const totalTime = transitTime + stationConfig.walk_time;
        const lineLabel = stationConfig.line === 'B' ? 'Broad St Line' :
                          stationConfig.line === 'L' ? 'Market-Frankford' :
                          stationConfig.line === 'M' ? 'Norristown HSL' : 'Metro';
        return [{
            depart: 'Every 5-10 min',
            walkOnly: false,
            isSubway: true,
            arrivalTime: new Date(Date.now() + totalTime * 60000),
            trainId: stationConfig.line,
            line: `${lineLabel} • ~${totalTime} min total`,
            totalTime
        }];
    }

    // For Trolley (T) transfers - estimate transfer time
    if (stationConfig.type === 'metro_T') {
        const totalTime = stationConfig.walk_time + 15; // trolley wait + transfer
        return [{
            depart: 'Every 10-15 min',
            walkOnly: false,
            isSubway: true,
            arrivalTime: new Date(Date.now() + totalTime * 60000),
            trainId: 'T',
            line: `${stationConfig.route || 'Trolley'} • ~${totalTime} min total`,
            totalTime
        }];
    }

    // Regional Rail - fetch from API
    if (stationConfig.type === 'regional_rail') {
        try {
            const origin = encodeURIComponent(stationConfig.api_name || selectedStation);
            const dest = encodeURIComponent(stationConfig.transfer_point);
            const response = await fetch(`${CONFIG.API_BASE}?type=trains&origin=${origin}&dest=${dest}`);
            if (!response.ok) throw new Error('API error');

            const data = await response.json();
            const trains = [];

            for (const train of data) {
                if (train && typeof train === 'object') {
                    const departTime = train.orig_departure_time || '';
                    const arriveTime = train.orig_arrival_time || '';
                    if (departTime && departTime !== 'NA') {
                        trains.push({
                            depart: departTime,
                            arrive: arriveTime,
                            trainId: train.orig_train || '',
                            delay: train.orig_delay || '0',
                            line: train.orig_line || '',
                            walkTime: stationConfig.walk_time
                        });
                    }
                }
            }

            return trains;
        } catch (error) {
            console.error('Train fetch error:', error);
            return [];
        }
    }

    return [];
}

function parseTime(timeStr) {
    if (!timeStr) return null;

    try {
        const cleaned = timeStr.trim().toUpperCase();
        const match = cleaned.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);

        if (match) {
            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const period = match[3];

            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            const now = new Date();
            const result = new Date(now);
            result.setHours(hours, minutes, 0, 0);

            if (result < new Date(now.getTime() - 60000)) {
                result.setDate(result.getDate() + 1);
            }

            return result;
        }
    } catch (e) {
        console.error('Time parse error:', e);
    }
    return null;
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function updateUI() {
    updateTrolleyDetails();
    updateConnections();
}

function updateConnections() {
    const section = document.getElementById('connections-section');
    const container = document.getElementById('connections-list');
    const title = document.getElementById('connections-title');
    const now = new Date();

    // Hide if no trolleys
    if (trolleyData.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    const stationConfig = STATIONS[selectedStation];

    if (trainData.length === 0) {
        container.innerHTML = `
            <div class="error-message">
                No service found from ${selectedStation}.
            </div>
        `;
        return;
    }

    // Update title based on transport type
    const isMetro = stationConfig.type && stationConfig.type.startsWith('metro_');
    const isRegionalRail = stationConfig.type === 'regional_rail';

    if (isMetro) {
        title.textContent = '🚇 From ' + selectedStation;
    } else if (isRegionalRail) {
        title.textContent = '🚆 From ' + selectedStation;
    } else {
        title.textContent = '🚶 From ' + selectedStation;
    }

    // Show train options (up to 3 for regional rail, 1 for subway/walk)
    const trainOptions = trainData.slice(0, isRegionalRail ? 3 : 1);

    container.innerHTML = trainOptions.map((train, index) => {
        let arrivalAtStop;
        let departDisplay;
        let subtitleDisplay;

        if (train.walkOnly) {
            // Walking only
            arrivalAtStop = train.arrivalTime;
            departDisplay = 'Walk now';
            subtitleDisplay = train.line;
        } else if (train.isSubway) {
            // Subway
            arrivalAtStop = train.arrivalTime;
            departDisplay = train.depart;
            subtitleDisplay = train.line;
        } else {
            // Regional Rail
            const departTime = parseTime(train.depart);
            if (!departTime) return '';

            // Calculate arrival: depart + train travel + walk
            const arriveTime = parseTime(train.arrive);
            if (arriveTime) {
                arrivalAtStop = new Date(arriveTime.getTime() + train.walkTime * 60000);
            } else {
                // Fallback if no arrival time
                arrivalAtStop = new Date(departTime.getTime() + 20 * 60000 + train.walkTime * 60000);
            }

            const minutesUntilTrain = Math.round((departTime - now) / 60000);
            const delayNote = train.delay !== '0' && train.delay !== 'On time'
                ? ` (+${train.delay} min)`
                : '';

            departDisplay = `${formatTime(departTime)}${delayNote}`;
            subtitleDisplay = `In ${minutesUntilTrain} min • ${train.line || 'Regional Rail'}`;
        }

        // Calculate connection quality for each trolley
        const connections = calculateConnections(arrivalAtStop, now);

        // Determine overall verdict
        const { verdict, verdictClass } = getConnectionVerdict(connections);

        const icon = train.isSubway ? '🚇' : (train.walkOnly ? '🚶' : '🚆');

        return `
            <div class="connection-card ${verdictClass}">
                <div class="connection-header">
                    <div class="train-info">
                        <span class="train-depart">${icon} ${departDisplay}</span>
                        <span class="train-in">${subtitleDisplay}</span>
                    </div>
                    <div class="connection-verdict">
                        <span class="verdict-badge ${verdictClass}">${verdict}</span>
                    </div>
                </div>
                <div class="connection-details">
                    <div class="arrive-time">At Broad & Girard: ${formatTime(arrivalAtStop)}</div>
                    ${renderTrolleyWaits(connections)}
                </div>
            </div>
        `;
    }).join('');
}

function calculateConnections(arrivalTime, now) {
    const connections = [];

    for (const trolley of trolleyData) {
        const conn = {
            vehicle: trolley.vehicle,
            direction: trolley.direction,
            location: trolley.location,
            isRealtime: true // All our data is real-time GPS
        };

        if (trolley.etaMinutes !== null) {
            // Trolley hasn't passed Broad & Girard yet
            const trolleyArrival = new Date(now.getTime() + trolley.etaMinutes * 60000);
            conn.trolleyArrivalTime = trolleyArrival;
            conn.waitMinutes = Math.round((trolleyArrival - arrivalTime) / 60000);
            conn.willCatch = conn.waitMinutes >= 0;
            conn.stopsAway = trolley.stopsAway;

            // If you'll miss this trolley, calculate when the NEXT one arrives after you
            if (!conn.willCatch) {
                const missedBy = Math.abs(conn.waitMinutes);
                // How long after your arrival until next trolley in this direction?
                // If trolley passes X min before you, next one comes at headway intervals
                // e.g., miss by 40 min with 15 min headway: 40 % 15 = 10, so next is in 15-10 = 5 min
                const remainder = missedBy % CONFIG.ESTIMATED_HEADWAY;
                conn.nextTrolleyWait = remainder === 0 ? 0 : CONFIG.ESTIMATED_HEADWAY - remainder;
            }
        } else {
            // Trolley already passed Broad & Girard (before we started tracking)
            conn.alreadyPassed = true;
            conn.waitMinutes = null;
            // Can't calculate precisely, just use headway as estimate
            conn.nextTrolleyWait = CONFIG.ESTIMATED_HEADWAY;
        }

        connections.push(conn);
    }

    return connections;
}

function getConnectionVerdict(connections) {
    // Find the best catchable trolley
    const catchable = connections.filter(c => c.willCatch && c.waitMinutes !== null);

    if (catchable.length > 0) {
        const bestWait = Math.min(...catchable.map(c => c.waitMinutes));

        if (bestWait <= 5) {
            return { verdict: `${bestWait} min wait`, verdictClass: 'good', bestWait };
        } else if (bestWait <= 12) {
            return { verdict: `${bestWait} min wait`, verdictClass: 'okay', bestWait };
        } else {
            return { verdict: `${bestWait} min wait`, verdictClass: 'okay', bestWait };
        }
    }

    // All trolleys will pass before arrival - find best "next trolley" wait
    const nextWaits = connections
        .filter(c => c.nextTrolleyWait !== undefined)
        .map(c => c.nextTrolleyWait);

    if (nextWaits.length > 0) {
        const bestNextWait = Math.min(...nextWaits);
        return {
            verdict: `${bestNextWait} min wait`,
            verdictClass: bestNextWait <= 8 ? 'okay' : 'miss',
            bestWait: bestNextWait
        };
    }

    return { verdict: 'Check times', verdictClass: 'miss', bestWait: null };
}

function renderTrolleyWaits(connections) {
    let html = '';

    // Sort: catchable first, then by wait time
    const sorted = [...connections].sort((a, b) => {
        if (a.willCatch && !b.willCatch) return -1;
        if (!a.willCatch && b.willCatch) return 1;
        if (a.waitMinutes !== null && b.waitMinutes !== null) {
            return a.waitMinutes - b.waitMinutes;
        }
        return 0;
    });

    for (const conn of sorted) {
        const dirClass = conn.direction === 'Eastbound' ? 'east' : 'west';
        const dirEmoji = conn.direction === 'Eastbound' ? '→ East' : '← West';

        let waitText = '';
        let waitClass = '';

        if (conn.alreadyPassed) {
            waitText = `${conn.nextTrolleyWait} min wait (next one)`;
            waitClass = 'long';
        } else if (conn.willCatch) {
            if (conn.waitMinutes === 0) {
                waitText = 'There when you arrive';
                waitClass = 'good';
            } else {
                waitText = `${conn.waitMinutes} min wait`;
                waitClass = conn.waitMinutes <= 5 ? 'good' : 'long';
            }
        } else {
            // Will miss this one - show wait for next trolley
            waitText = `${conn.nextTrolleyWait} min wait (next one)`;
            waitClass = conn.nextTrolleyWait <= 8 ? 'long' : 'miss';
        }

        html += `
            <div class="trolley-wait">
                <span>
                    <span class="trolley-id">#${conn.vehicle}</span>
                    <span class="direction-badge ${dirClass}">${dirEmoji}</span>
                </span>
                <span class="wait-time ${waitClass}">${waitText}</span>
            </div>
        `;
    }

    return html;
}

function updateTrolleyDetails() {
    const container = document.getElementById('trolley-list');
    const now = new Date();

    if (trolleyData.length === 0) {
        container.innerHTML = `
            <div class="no-trolleys">
                <div class="no-trolleys-title">No PCC Trolleys Running</div>
                <div class="no-trolleys-subtitle">Route G is using bus substitutes right now</div>
            </div>
        `;
        return;
    }

    container.innerHTML = trolleyData.map(trolley => {
        const dirClass = trolley.direction === 'Eastbound' ? 'east' : 'west';
        const dirText = trolley.direction === 'Eastbound'
            ? '→ East to Richmond'
            : '← West to 63rd';

        let etaText = '';
        let etaClass = '';

        if (trolley.etaMinutes !== null) {
            if (trolley.etaMinutes === 0) {
                etaText = 'At Broad & Girard NOW';
            } else {
                const etaTime = new Date(now.getTime() + trolley.etaMinutes * 60000);
                etaText = `${trolley.etaMinutes} min to Broad & Girard (${formatTime(etaTime)})`;
            }
        } else if (trolley.stopsAway === null && trolley.direction !== 'Unknown') {
            etaText = 'Passed Broad & Girard';
            etaClass = 'passed';
        } else {
            etaText = 'Tracking...';
        }

        return `
            <div class="trolley-item ${dirClass}">
                <div class="trolley-header">
                    <span class="live-dot"></span>
                    <span class="trolley-number">#${trolley.vehicle}</span>
                    <span class="trolley-direction ${dirClass}">${dirText}</span>
                </div>
                <div class="trolley-location">${trolley.location}</div>
                <div class="trolley-eta ${etaClass}">${etaText}</div>
            </div>
        `;
    }).join('');
}

function updateLastRefresh() {
    const element = document.getElementById('last-update');
    const now = new Date();
    element.innerHTML = `
        <span class="auto-refresh">
            <span class="pulse"></span>
            Live • ${formatTime(now)}
        </span>
    `;
}

function showError(message) {
    const container = document.getElementById('pcc-alert');
    container.innerHTML = `<div class="error-message">${message}</div>`;
}
