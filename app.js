// PCC Trolley Tracker - Main Application

// Configuration
const CONFIG = {
    API_BASE: '/.netlify/functions/septa-proxy',
    REFRESH_INTERVAL: 60000,
    MINUTES_PER_STOP: 1.5,
    ESTIMATED_HEADWAY: 15
};

// Test mode - add ?test=1 to URL to show all G line vehicles (not just PCC trolleys)
// This helps test routing when no PCC cars are running
const TEST_MODE = new URLSearchParams(window.location.search).get('test') === '1';

// ============================================
// G LINE STOPS (West to East) - Complete list from SEPTA API
// Sorted by longitude, organized for timeline display
// ============================================

// Complete G line stops sorted west to east with stop IDs from SEPTA API
const G_LINE_STOPS_FULL = [
    { stopId: '21481', name: 'Haverford Av & 63rd St', shortName: '63rd', lng: -75.244641, isTerminal: true },
    { stopId: '21044', name: 'Girard Av & 63rd St', shortName: '63rd', lng: -75.244598, isTerminal: true },
    { stopId: '31443', name: 'Girard Av & 62nd St', shortName: '62nd', lng: -75.243216 },
    { stopId: '21042', name: 'Haverford Av & 62nd St', shortName: '62nd', lng: -75.242704 },
    { stopId: '21047', name: 'Girard Av & 61st St', shortName: '61st', lng: -75.241221 },
    { stopId: '21041', name: 'Haverford Av & 61st St', shortName: '61st', lng: -75.240781 },
    { stopId: '21048', name: 'Girard Av & 60th St', shortName: '60th', lng: -75.239366 },
    { stopId: '21040', name: 'Girard Av & 60th St', shortName: '60th', lng: -75.238988 },
    { stopId: '349', name: 'Girard Av & 59th St', shortName: '59th', lng: -75.237523 },
    { stopId: '345', name: 'Girard Av & 59th St', shortName: '59th', lng: -75.237334 },
    { stopId: '21050', name: 'Girard Av & 57th St', shortName: '57th', lng: -75.234285 },
    { stopId: '21038', name: 'Girard Av & 57th St', shortName: '57th', lng: -75.234096 },
    { stopId: '21051', name: 'Girard Av & 56th St', shortName: '56th', lng: -75.232667 },
    { stopId: '21037', name: 'Girard Av & 56th St', shortName: '56th', lng: -75.232477 },
    { stopId: '21053', name: 'Girard Av & 54th St', shortName: '54th', lng: -75.228803 },
    { stopId: '21035', name: 'Girard Av & 54th St', shortName: '54th', lng: -75.228614 },
    { stopId: '21055', name: 'Girard Av & 52nd St', shortName: '52nd', lng: -75.225908 },
    { stopId: '21033', name: 'Girard Av & 52nd St', shortName: '52nd', lng: -75.22579 },
    { stopId: '21056', name: 'Girard Av & 51st St', shortName: '51st', lng: -75.223745 },
    { stopId: '21032', name: 'Girard Av & 51st St', shortName: '51st', lng: -75.223438 },
    { stopId: '21030', name: 'Girard Av & 49th St', shortName: '49th', lng: -75.219064 },
    { stopId: '21058', name: 'Lancaster-Girard', shortName: 'Lancaster', lng: -75.218521, isTransfer: true, transferLines: ['T1'] },
    { stopId: '30605', name: 'Girard Av & Merion Av', shortName: 'Merion', lng: -75.216431 },
    { stopId: '30550', name: 'Girard Av & Merion Av', shortName: 'Merion', lng: -75.216277 },
    { stopId: '21060', name: 'Girard Av & Belmont Av', shortName: 'Belmont', lng: -75.211964 },
    { stopId: '21028', name: 'Girard Av & Belmont Av', shortName: 'Belmont', lng: -75.212094 },
    { stopId: '21027', name: 'Girard Av & 42nd St', shortName: '42nd', lng: -75.208797 },
    { stopId: '21061', name: 'Girard Av & 42nd St', shortName: '42nd', lng: -75.208975 },
    { stopId: '21062', name: 'Girard Av & 41st St', shortName: '41st', lng: -75.206528 },
    { stopId: '21026', name: 'Girard Av & 41st St', shortName: '41st', lng: -75.206268 },
    { stopId: '344', name: '40th St/Parkside', shortName: '40th', lng: -75.204543 },
    { stopId: '350', name: '40th St/Parkside', shortName: '40th', lng: -75.204531 },
    { stopId: '21063', name: 'Girard Av & 39th St', shortName: '39th', lng: -75.201802 },
    { stopId: '21025', name: 'Girard Av & 39th St', shortName: '39th', lng: -75.201683 },
    { stopId: '30291', name: '34th St/Zoo', shortName: '34th', lng: -75.196472 },
    { stopId: '30292', name: '34th St/Zoo', shortName: '34th', lng: -75.196733 },
    { stopId: '21022', name: 'Girard Av & 33rd St', shortName: '33rd', lng: -75.188002 },
    { stopId: '21067', name: 'Girard Av & 31st St', shortName: '31st', lng: -75.18675 },
    { stopId: '21021', name: 'Girard Av & 31st St', shortName: '31st', lng: -75.186549 },
    { stopId: '21019', name: 'Girard Av & 29th St', shortName: '29th', lng: -75.183361 },
    { stopId: '21068', name: 'Girard Av & 29th St', shortName: '29th', lng: -75.183622 },
    { stopId: '21069', name: 'Girard Av & 28th St', shortName: '28th', lng: -75.181969 },
    { stopId: '21018', name: 'Girard Av & 28th St', shortName: '28th', lng: -75.181756 },
    { stopId: '21070', name: 'Girard Av & 27th St', shortName: '27th', lng: -75.180504 },
    { stopId: '21017', name: 'Girard Av & 27th St', shortName: '27th', lng: -75.18028 },
    { stopId: '21072', name: '26th St & Poplar St', shortName: '26th', lng: -75.179198 },
    { stopId: '21071', name: 'Girard Av & 26th St', shortName: '26th', lng: -75.178946 },
    { stopId: '21016', name: 'Girard Av & 26th St', shortName: '26th', lng: -75.178733 },
    { stopId: '21073', name: 'Poplar St & Stillman St', shortName: '25th', lng: -75.178171 },
    { stopId: '21014', name: 'Poplar St & 25th St', shortName: '25th', lng: -75.177403 },
    { stopId: '30791', name: 'Girard Av & 24th St', shortName: '24th', lng: -75.175844 },
    { stopId: '21075', name: 'College Av & 24th St', shortName: '24th', lng: -75.175384 },
    { stopId: '21078', name: 'Girard Av & Corinthian Av', shortName: 'Corinthian', lng: -75.170421 },
    { stopId: '21010', name: 'Girard Av & Corinthian Av', shortName: 'Corinthian', lng: -75.17022 },
    { stopId: '21079', name: 'Girard Av & 20th St', shortName: '20th', lng: -75.169087 },
    { stopId: '21009', name: 'Girard Av & 20th St', shortName: '20th', lng: -75.168874 },
    { stopId: '21080', name: 'Girard Av & 19th St', shortName: '19th', lng: -75.16754 },
    { stopId: '30290', name: 'Girard Av & 19th St', shortName: '19th', lng: -75.167339 },
    { stopId: '21081', name: 'Girard Av & Ridge Av', shortName: 'Ridge', lng: -75.166572 },
    { stopId: '21008', name: 'Girard Av & Ridge Av', shortName: 'Ridge', lng: -75.166217 },
    { stopId: '21082', name: 'Girard Av & 17th St', shortName: '17th', lng: -75.164352 },
    { stopId: '21006', name: 'Girard Av & 17th St', shortName: '17th', lng: -75.164151 },
    { stopId: '21083', name: 'Girard Av & 16th St', shortName: '16th', lng: -75.162806 },
    { stopId: '21005', name: 'Girard Av & 16th St', shortName: '16th', lng: -75.162605 },
    { stopId: '352', name: 'Broad-Girard', shortName: 'Broad', lng: -75.159594, isTransfer: true, transferLines: ['B'] },
    { stopId: '343', name: 'Broad-Girard', shortName: 'Broad', lng: -75.159275, isTransfer: true, transferLines: ['B'] },
    { stopId: '21002', name: 'Girard Av & 12th St', shortName: '12th', lng: -75.155603 },
    { stopId: '21086', name: 'Girard Av & 12th St', shortName: '12th', lng: -75.155816 },
    { stopId: '21087', name: 'Girard Av & 11th St', shortName: '11th', lng: -75.154222 },
    { stopId: '21001', name: 'Girard Av & 11th St', shortName: '11th', lng: -75.154021 },
    { stopId: '21090', name: 'Girard Av & 8th St', shortName: '8th', lng: -75.150042 },
    { stopId: '20999', name: 'Girard Av & 8th St', shortName: '8th', lng: -75.149853 },
    { stopId: '21091', name: 'Girard Av & 7th St', shortName: '7th', lng: -75.148211 },
    { stopId: '20998', name: 'Girard Av & 7th St', shortName: '7th', lng: -75.148022 },
    { stopId: '20996', name: 'Girard Av & 5th St', shortName: '5th', lng: -75.144905 },
    { stopId: '21093', name: 'Girard Av & 5th St', shortName: '5th', lng: -75.145094 },
    { stopId: '20995', name: 'Girard Av & 4th St', shortName: '4th', lng: -75.142968 },
    { stopId: '21095', name: 'Girard Av & 3rd St', shortName: '3rd', lng: -75.141599 },
    { stopId: '20994', name: 'Girard Av & 3rd St', shortName: '3rd', lng: -75.141386 },
    { stopId: '21096', name: 'Girard Av & 2nd St', shortName: '2nd', lng: -75.139805 },
    { stopId: '20993', name: 'Girard Av & 2nd St', shortName: '2nd', lng: -75.13945 },
    { stopId: '20978', name: 'Front-Girard', shortName: 'Front', lng: -75.136358, isTransfer: true, transferLines: ['L'] },
    { stopId: '342', name: 'Front-Girard', shortName: 'Front', lng: -75.136075, isTransfer: true, transferLines: ['L'] },
    { stopId: '21098', name: 'Girard Av & Frankford Av', shortName: 'Frankford Av', lng: -75.134244 },
    { stopId: '31540', name: 'Frankford Av & Girard Av', shortName: 'Frankford Av', lng: -75.134493 },
    { stopId: '481', name: 'Frankford Av & Girard Av', shortName: 'Frankford Av', lng: -75.134351 },
    { stopId: '31347', name: 'Frankford-Delaware', shortName: 'Frankford', lng: -75.134154 },
    { stopId: '24038', name: 'Frankford Av & Richmond St', shortName: 'Frankford', lng: -75.134492 },
    { stopId: '23992', name: 'Frankford Av & Richmond St', shortName: 'Frankford', lng: -75.134338 },
    { stopId: '21100', name: 'Girard Av & Columbia Av', shortName: 'Columbia', lng: -75.130542 },
    { stopId: '20989', name: 'Girard Av & Columbia Av', shortName: 'Columbia', lng: -75.130423 },
    { stopId: '20988', name: 'Girard Av & Palmer St', shortName: 'Palmer', lng: -75.1284 },
    { stopId: '21101', name: 'Girard Av & Palmer St', shortName: 'Palmer', lng: -75.128519 },
    { stopId: '21103', name: 'Girard Av & Berks St', shortName: 'Berks', lng: -75.125999 },
    { stopId: '20986', name: 'Girard Av & Berks St', shortName: 'Berks', lng: -75.125833 },
    { stopId: '21105', name: 'Girard Av & Richmond St', shortName: 'Richmond', lng: -75.119769 },
    { stopId: '25779', name: 'Richmond St & Girard Av', shortName: 'Richmond', lng: -75.119591 },
    { stopId: '650', name: 'Richmond St & Cumberland St', shortName: 'Cumberland', lng: -75.118038 },
    { stopId: '649', name: 'Richmond St & Cumberland St', shortName: 'Cumberland', lng: -75.118181 },
    { stopId: '21107', name: 'Richmond St & Huntingdon St', shortName: 'Huntingdon', lng: -75.11573 },
    { stopId: '20984', name: 'Richmond St & Huntingdon St', shortName: 'Huntingdon', lng: -75.115552 },
    { stopId: '21108', name: 'Richmond St & Lehigh Av', shortName: 'Lehigh', lng: -75.113302 },
    { stopId: '20983', name: 'Richmond St & Lehigh Av', shortName: 'Lehigh', lng: -75.113101 },
    { stopId: '21109', name: 'Richmond St & Somerset St', shortName: 'Somerset', lng: -75.110887 },
    { stopId: '12218', name: 'Richmond St & Somerset St', shortName: 'Somerset', lng: -75.110697 },
    { stopId: '21110', name: 'Richmond St & Cambria St', shortName: 'Cambria', lng: -75.109052 },
    { stopId: '20982', name: 'Richmond St & Cambria St', shortName: 'Cambria', lng: -75.108862 },
    { stopId: '21111', name: 'Richmond St & Ann St', shortName: 'Ann', lng: -75.107536 },
    { stopId: '20981', name: 'Richmond St & Ann St', shortName: 'Ann', lng: -75.107311 },
    { stopId: '21113', name: 'Richmond St & Clearfield St', shortName: 'Clearfield', lng: -75.104019 },
    { stopId: '20979', name: 'Richmond St & Clearfield St', shortName: 'Clearfield', lng: -75.103782 },
    { stopId: '21114', name: 'Richmond St & Allegheny Av', shortName: 'Allegheny', lng: -75.101544 },
    { stopId: '12196', name: 'Richmond St & Allegheny Av', shortName: 'Allegheny', lng: -75.101437 },
    { stopId: '341', name: 'Richmond-Westmoreland', shortName: 'Richmond', lng: -75.099553, isTerminal: true }
];

// Create a lookup map by stop ID for quick access
const G_STOPS_BY_ID = {};
G_LINE_STOPS_FULL.forEach((stop, index) => {
    G_STOPS_BY_ID[stop.stopId] = { ...stop, index };
});

// Simplified list for timeline display (unique stops, deduplicated)
const G_LINE_STOPS_SIMPLE = [
    { name: '63rd-Girard', shortName: '63rd', isTerminal: true },
    { name: '62nd St', shortName: '62nd' },
    { name: '61st St', shortName: '61st' },
    { name: '60th St', shortName: '60th' },
    { name: '59th St', shortName: '59th' },
    { name: '57th St', shortName: '57th' },
    { name: '56th St', shortName: '56th' },
    { name: '54th St', shortName: '54th' },
    { name: '52nd St', shortName: '52nd' },
    { name: '51st St', shortName: '51st' },
    { name: '49th St', shortName: '49th' },
    { name: 'Lancaster-Girard', shortName: 'Lancaster', isTransfer: true, transferLines: ['T1'] },
    { name: 'Merion Av', shortName: 'Merion' },
    { name: 'Belmont Av', shortName: 'Belmont' },
    { name: '42nd St', shortName: '42nd' },
    { name: '41st St', shortName: '41st' },
    { name: '40th St/Parkside', shortName: '40th' },
    { name: '39th St', shortName: '39th' },
    { name: '34th St/Zoo', shortName: '34th' },
    { name: '33rd St', shortName: '33rd' },
    { name: '31st St', shortName: '31st' },
    { name: '29th St', shortName: '29th' },
    { name: '28th St', shortName: '28th' },
    { name: '27th St', shortName: '27th' },
    { name: '26th St', shortName: '26th' },
    { name: '25th St', shortName: '25th' },
    { name: '24th St', shortName: '24th' },
    { name: 'Corinthian Av', shortName: 'Corinthian' },
    { name: '20th St', shortName: '20th' },
    { name: '19th St', shortName: '19th' },
    { name: 'Ridge Av', shortName: 'Ridge' },
    { name: '17th St', shortName: '17th' },
    { name: '16th St', shortName: '16th' },
    { name: 'Broad-Girard', shortName: 'Broad', isTransfer: true, transferLines: ['B'] },
    { name: '12th St', shortName: '12th' },
    { name: '11th St', shortName: '11th' },
    { name: '8th St', shortName: '8th' },
    { name: '7th St', shortName: '7th' },
    { name: '5th St', shortName: '5th' },
    { name: '4th St', shortName: '4th' },
    { name: '3rd St', shortName: '3rd' },
    { name: '2nd St', shortName: '2nd' },
    { name: 'Front-Girard', shortName: 'Front', isTransfer: true, transferLines: ['L'] },
    { name: 'Frankford Av', shortName: 'Frankford Av' },
    { name: 'Frankford-Delaware', shortName: 'Frankford' },
    { name: 'Columbia Av', shortName: 'Columbia' },
    { name: 'Palmer St', shortName: 'Palmer' },
    { name: 'Berks St', shortName: 'Berks' },
    { name: 'Richmond & Girard', shortName: 'Richmond' },
    { name: 'Cumberland St', shortName: 'Cumberland' },
    { name: 'Huntingdon St', shortName: 'Huntingdon' },
    { name: 'Lehigh Av', shortName: 'Lehigh' },
    { name: 'Somerset St', shortName: 'Somerset' },
    { name: 'Cambria St', shortName: 'Cambria' },
    { name: 'Ann St', shortName: 'Ann' },
    { name: 'Clearfield St', shortName: 'Clearfield' },
    { name: 'Allegheny Av', shortName: 'Allegheny' },
    { name: 'Richmond-Westmoreland', shortName: 'Westmoreland', isTerminal: true }
];

// G Line Transfer Points - where other metro lines intersect
const G_TRANSFER_POINTS = {
    'Lancaster-Girard': {
        stopIndex: 11, // Index in G_LINE_STOPS_SIMPLE
        connectsTo: ['T1'], // Route 10 trolley
        walkTime: 2
    },
    'Broad-Girard': {
        stopIndex: 33,
        connectsTo: ['B'], // Broad Street Line
        walkTime: 3
    },
    'Front-Girard': {
        stopIndex: 42,
        connectsTo: ['L'], // Market-Frankford Line
        walkTime: 5
    }
};

// Helper: Find stop index in G_LINE_STOPS_SIMPLE from stop ID
function getStopIndexFromId(stopId) {
    // Convert to string since G_STOPS_BY_ID keys are strings but API returns numbers
    const stopInfo = G_STOPS_BY_ID[String(stopId)];
    if (!stopInfo) {
        console.log('[STOP-INDEX DEBUG] Stop ID not found in G_STOPS_BY_ID:', stopId);
        return -1;
    }

    const shortName = stopInfo.shortName;
    // Find matching stop in simplified list
    for (let i = 0; i < G_LINE_STOPS_SIMPLE.length; i++) {
        if (G_LINE_STOPS_SIMPLE[i].shortName === shortName) {
            return i;
        }
    }
    console.log('[STOP-INDEX DEBUG] Short name not found in G_LINE_STOPS_SIMPLE:', shortName);
    return -1;
}

// Helper: Get 5-stop timeline around current position
function getTimelineStops(currentIndex, direction) {
    const total = G_LINE_STOPS_SIMPLE.length;
    const timeline = [];

    // For eastbound: lower indices are behind (west), higher are ahead (east)
    // For westbound: higher indices are behind (east), lower are ahead (west)
    const step = direction === 'Eastbound' ? 1 : -1;

    // Get prev2, prev1, current, next1, next2
    // offset < 0 = behind (where we came from), offset > 0 = ahead (where we're going)
    for (let offset = -2; offset <= 2; offset++) {
        const idx = currentIndex + (offset * step);
        if (idx >= 0 && idx < total) {
            timeline.push({
                ...G_LINE_STOPS_SIMPLE[idx],
                position: offset === 0 ? 'current' : (offset < 0 ? 'prev' : 'next'),
                offset: Math.abs(offset)
            });
        } else {
            timeline.push(null);
        }
    }

    return timeline;
}

// ============================================
// SEPTA METRO & REGIONAL RAIL STATIONS
// With routing to G line pickup points
// ============================================

// Metro line frequencies (minutes) - used for estimated wait times
const METRO_FREQUENCY = {
    'B': { peak: 5, offpeak: 8 },      // Broad Street Line
    'L': { peak: 5, offpeak: 8 },      // Market-Frankford Line
    'M': { peak: 10, offpeak: 15 },    // Norristown High Speed Line
    'D': { peak: 10, offpeak: 15 },    // Media/Sharon Hill Lines
    'T': { peak: 10, offpeak: 12 }     // Subway-Surface Trolleys
};

// Metro Lines with routing to G pickup points
const METRO_LINES = {
    'B': {
        name: 'Broad Street Line',
        color: '#F37021',
        mode: 'metro',
        apiRoute: null, // No real-time API for subway
        frequency: { peak: 5, offpeak: 8 }, // Train frequency in minutes
        // B line stations with ACTUAL travel times to Girard (from SEPTA schedule screenshots)
        // Girard station on B line connects directly to Broad-Girard on G
        stations: [
            { name: 'Fern Rock TC', travelTimeToGirard: 19, direction: 'southbound' },
            { name: 'Olney', travelTimeToGirard: 16, direction: 'southbound' },
            { name: 'Logan', travelTimeToGirard: 13, direction: 'southbound' },
            { name: 'Wyoming', travelTimeToGirard: 12, direction: 'southbound' },
            { name: 'Hunting Park', travelTimeToGirard: 11, direction: 'southbound' },
            { name: 'Erie', travelTimeToGirard: 8, direction: 'southbound' },
            { name: 'Broad-Allegheny', travelTimeToGirard: 7, direction: 'southbound' },
            { name: 'North Philadelphia', travelTimeToGirard: 5, direction: 'southbound' },
            { name: 'Susquehanna-Dauphin', travelTimeToGirard: 3, direction: 'southbound' },
            { name: 'Cecil B. Moore', travelTimeToGirard: 2, direction: 'southbound' },
            { name: 'Girard', travelTimeToGirard: 0, direction: null, gPickup: 'Broad-Girard', walkTime: 3 },
            { name: 'Fairmount', travelTimeToGirard: 2, direction: 'northbound' },
            { name: 'Spring Garden', travelTimeToGirard: 3, direction: 'northbound' },
            { name: 'Race-Vine', travelTimeToGirard: 5, direction: 'northbound' },
            { name: 'City Hall', travelTimeToGirard: 7, direction: 'northbound' },
            { name: 'Walnut-Locust', travelTimeToGirard: 8, direction: 'northbound' },
            { name: 'Lombard-South', travelTimeToGirard: 11, direction: 'northbound' },
            { name: 'Ellsworth-Federal', travelTimeToGirard: 12, direction: 'northbound' },
            { name: 'Tasker-Morris', travelTimeToGirard: 14, direction: 'northbound' },
            { name: 'Snyder', travelTimeToGirard: 16, direction: 'northbound' },
            { name: 'Oregon', travelTimeToGirard: 17, direction: 'northbound' },
            { name: 'AT&T', travelTimeToGirard: 19, direction: 'northbound' },
            { name: 'NRG', travelTimeToGirard: 21, direction: 'northbound' }
        ]
    },
    'L': {
        name: 'Market-Frankford Line',
        color: '#0070C0',
        mode: 'metro',
        apiRoute: null, // No real-time API for subway
        frequency: { peak: 5, offpeak: 8 }, // Train frequency in minutes
        // L line - Girard station connects to Front-Girard on G
        // ACTUAL travel times from SEPTA schedule data
        stations: [
            { name: 'Frankford TC', travelTimeToGirard: 12, direction: 'westbound' },
            { name: 'Arrott TC', travelTimeToGirard: 11, direction: 'westbound' },
            { name: 'Church', travelTimeToGirard: 10, direction: 'westbound' },
            { name: 'Margaret-Orthodox', travelTimeToGirard: 9, direction: 'westbound' },
            { name: 'Huntingdon', travelTimeToGirard: 8, direction: 'westbound' },
            { name: 'Somerset', travelTimeToGirard: 7, direction: 'westbound' },
            { name: 'Allegheny', travelTimeToGirard: 6, direction: 'westbound' },
            { name: 'Tioga', travelTimeToGirard: 5, direction: 'westbound' },
            { name: 'Erie-Torresdale', travelTimeToGirard: 3, direction: 'westbound' },
            { name: 'Berks', travelTimeToGirard: 1, direction: 'westbound' },
            { name: 'Front-Girard', travelTimeToGirard: 0, direction: null, gPickup: 'Front-Girard', walkTime: 5 },
            { name: 'Spring Garden (MFL)', travelTimeToGirard: 1, direction: 'eastbound' },
            { name: '8th Street', travelTimeToGirard: 3, direction: 'eastbound' },
            { name: '11th Street', travelTimeToGirard: 4, direction: 'eastbound' },
            { name: '13th Street', travelTimeToGirard: 5, direction: 'eastbound' },
            { name: '15th Street', travelTimeToGirard: 6, direction: 'eastbound' },
            { name: 'City Hall (MFL)', travelTimeToGirard: 7, direction: 'eastbound' },
            { name: '30th Street (MFL)', travelTimeToGirard: 10, direction: 'eastbound' },
            { name: '40th Street', travelTimeToGirard: 13, direction: 'eastbound' },
            { name: '46th Street', travelTimeToGirard: 14, direction: 'eastbound' },
            { name: '52nd Street', travelTimeToGirard: 16, direction: 'eastbound' },
            { name: '56th Street', travelTimeToGirard: 17, direction: 'eastbound' },
            { name: '60th Street', travelTimeToGirard: 18, direction: 'eastbound' },
            { name: '63rd Street', travelTimeToGirard: 19, direction: 'eastbound' },
            { name: 'Millbourne', travelTimeToGirard: 20, direction: 'eastbound' },
            { name: '69th Street TC', travelTimeToGirard: 21, direction: 'eastbound' }
        ]
    },
    'M': {
        name: 'Norristown High Speed Line',
        color: '#84329B',
        mode: 'metro',
        apiRoute: null, // No real-time API
        // M line connects to L at 69th St TC, then to Front-Girard
        stations: [
            { name: '69th Street TC (NHSL)', stopsTo69th: 0, transferTo: 'L' },
            { name: 'Beechwood-Brookline', stopsTo69th: 1 },
            { name: 'Drexel Hill Junction', stopsTo69th: 2 },
            { name: 'Drexel Manor', stopsTo69th: 3 },
            { name: 'Pennfield', stopsTo69th: 4 },
            { name: 'Township Line', stopsTo69th: 5 },
            { name: 'Wynnewood Road', stopsTo69th: 6 },
            { name: 'Ardmore Junction', stopsTo69th: 7 },
            { name: 'Bryn Mawr (NHSL)', stopsTo69th: 8 },
            { name: 'Roberts Road', stopsTo69th: 9 },
            { name: 'Villanova (NHSL)', stopsTo69th: 10 },
            { name: 'Radnor (NHSL)', stopsTo69th: 11 },
            { name: 'Garrett Hill', stopsTo69th: 12 },
            { name: 'Stadium', stopsTo69th: 13 },
            { name: 'County Line', stopsTo69th: 14 },
            { name: 'Hughes Park', stopsTo69th: 15 },
            { name: 'Gulph Mills', stopsTo69th: 16 },
            { name: 'Matsonford', stopsTo69th: 17 },
            { name: 'Norristown TC (NHSL)', stopsTo69th: 18 }
        ]
    },
    'D': {
        name: 'Media/Sharon Hill Lines',
        color: '#dc2e6b',
        mode: 'metro',
        apiRoutes: ['D1', 'D2'], // Routes 101, 102 - real-time available
        // D lines connect to L at 69th St TC
        routes: {
            'Route 101': [
                { name: '69th Street TC (D)', stopsTo69th: 0, transferTo: 'L', stopId: '15497' },
                { name: 'Drexel Park', stopsTo69th: 1, stopId: '18600' },
                { name: 'Aronimink', stopsTo69th: 2, stopId: '18628' },
                { name: 'Scenic Road', stopsTo69th: 3, stopId: '30607' },
                { name: 'Springfield Mall', stopsTo69th: 5, stopId: '1951' },
                { name: 'Media TC', stopsTo69th: 10, stopId: '18615' }
            ],
            'Route 102': [
                { name: '69th Street TC (D2)', stopsTo69th: 0, transferTo: 'L', stopId: '15497' },
                { name: 'Drexel Park (102)', stopsTo69th: 1, stopId: '18600' },
                { name: 'Sharon Hill', stopsTo69th: 8, stopId: '15333' }
            ]
        }
    },
    'T': {
        name: 'Subway-Surface Trolleys',
        color: '#00A650',
        mode: 'metro',
        apiRoutes: ['T1', 'T2', 'T3', 'T4', 'T5'], // Real-time available
        // T1 (Route 10) connects to G at Lancaster-Girard
        routes: {
            'T1': { // Route 10
                name: 'Route 10',
                gPickup: 'Lancaster-Girard',
                stations: [
                    { name: '13th & Market (T1)', stopsToLancaster: 8, stopId: '20659' },
                    { name: '19th & Market', stopsToLancaster: 7, stopId: '20646' },
                    { name: '22nd & Market', stopsToLancaster: 6, stopId: '20645' },
                    { name: '30th & Market', stopsToLancaster: 5, stopId: '20643' },
                    { name: '33rd & Market', stopsToLancaster: 4, stopId: '20642' },
                    { name: '36th & Lancaster', stopsToLancaster: 3, stopId: '20639' },
                    { name: '40th & Lancaster', stopsToLancaster: 2, stopId: '20635' },
                    { name: '48th & Lancaster', stopsToLancaster: 1, stopId: '20626' },
                    { name: 'Lancaster-Girard (T1)', stopsToLancaster: 0, gPickup: 'Lancaster-Girard', walkTime: 2, stopId: '20624' },
                    { name: '63rd-Malvern', stopsToLancaster: 4, stopId: '20610' }
                ]
            },
            'T2': { // Route 11
                name: 'Route 11',
                stations: [
                    { name: '13th & Market (T2)', connectsVia: 'subway', stopId: '20659' },
                    { name: '40th & Woodland', connectsVia: 'subway', stopId: '20804' },
                    { name: 'Darby TC', connectsVia: 'subway', stopId: '20704' }
                ]
            },
            'T3': { // Route 13
                name: 'Route 13',
                stations: [
                    { name: '13th & Market (T3)', connectsVia: 'subway', stopId: '20659' },
                    { name: '40th & Woodland (T3)', connectsVia: 'subway', stopId: '20804' },
                    { name: 'Yeadon', connectsVia: 'subway', stopId: '20774' },
                    { name: 'Darby TC (T3)', connectsVia: 'subway', stopId: '20704' }
                ]
            },
            'T4': { // Route 34
                name: 'Route 34',
                stations: [
                    { name: '13th & Market (T4)', connectsVia: 'subway', stopId: '20659' },
                    { name: '61st & Baltimore', connectsVia: 'subway', stopId: '20859' }
                ]
            },
            'T5': { // Route 36
                name: 'Route 36',
                stations: [
                    { name: '13th & Market (T5)', connectsVia: 'subway', stopId: '20659' },
                    { name: '58th & Baltimore', connectsVia: 'subway', stopId: '20861' },
                    { name: 'Eastwick', connectsVia: 'subway', stopId: '20917' }
                ]
            }
        }
    },
    'G': {
        name: 'Route G (Girard)',
        color: '#FFD200',
        mode: 'metro',
        apiRoute: 'G1',
        // G line pickup points - these are direct access
        stations: [
            { name: '63rd-Girard', gPickup: '63rd-Girard', walkTime: 0 },
            { name: '40th St/Parkside', gPickup: '40th St/Parkside', walkTime: 0 },
            { name: 'Lancaster-Girard', gPickup: 'Lancaster-Girard', walkTime: 0 },
            { name: 'Broad-Girard', gPickup: 'Broad-Girard', walkTime: 0 },
            { name: 'Front-Girard', gPickup: 'Front-Girard', walkTime: 0 },
            { name: 'Frankford-Delaware', gPickup: 'Frankford-Delaware', walkTime: 0 },
            { name: 'Richmond-Westmoreland', gPickup: 'Richmond-Westmoreland', walkTime: 0 }
        ]
    }
};

// Regional Rail Lines with G line routing
// Each line includes which stations can connect to G pickup points
const REGIONAL_RAIL_LINES = {
    'Airport': {
        abbrev: 'AIR',
        stations: ['Airport Terminal E-F', 'Airport Terminal C-D', 'Airport Terminal A-B', 'Eastwick', 'University City', '30th Street', 'Suburban', 'Jefferson']
    },
    'Chestnut Hill East': {
        abbrev: 'CHE',
        stations: ['Chestnut Hill East', 'Gravers', 'Mt Airy', 'Sedgwick', 'Stenton', 'Wyndmoor', 'Germantown', 'Washington Lane', 'Wister', 'Wayne Junction', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'Chestnut Hill West': {
        abbrev: 'CHW',
        stations: ['Chestnut Hill West', 'Highland', 'St. Martins', 'Allen Lane', 'Carpenter', 'Upsal', 'Tulpehocken', 'Chelten Avenue', 'Queen Lane', 'North Broad', 'Jefferson', 'Suburban', '30th Street']
    },
    'Cynwyd': {
        abbrev: 'CYN',
        stations: ['Cynwyd', 'Bala', 'Wynnefield Avenue', 'Suburban', '30th Street']
    },
    'Fox Chase': {
        abbrev: 'FOX',
        stations: ['Fox Chase', 'Ryers', 'Cheltenham', 'Lawndale', 'Olney', 'Wayne Junction', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'Lansdale/Doylestown': {
        abbrev: 'DOY',
        stations: ['Doylestown', 'Delaware Valley College', 'New Britain', 'Chalfont', 'Colmar', 'Lansdale', 'Fortuna', 'Pennbrook', 'North Wales', 'Gwynedd Valley', 'Penllyn', 'Ambler', 'Fort Washington', 'Oreland', 'North Hills', 'Glenside', 'Ardsley', 'Roslyn', 'Jenkintown-Wyncote', 'Elkins Park', 'Melrose Park', 'Fern Rock TC', 'Wayne Junction', 'North Philadelphia', 'North Broad', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'Manayunk/Norristown': {
        abbrev: 'NOR',
        stations: ['Elm Street', 'Main Street', 'Norristown TC', 'Conshohocken', 'Spring Mill', 'Miquon', 'Wissahickon', 'Manayunk', 'Ivy Ridge', 'East Falls', 'Allegheny', 'North Broad', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'Media/Wawa': {
        abbrev: 'MED',
        stations: ['Wawa', 'Media', 'Moylan-Rose Valley', 'Wallingford', 'Swarthmore', 'Morton', 'Secane', 'Primos', 'Clifton-Aldan', 'Gladstone', 'Lansdowne', 'Fernwood-Yeadon', 'Angora', '49th Street', '30th Street', 'Suburban', 'Jefferson']
    },
    'Paoli/Thorndale': {
        abbrev: 'PAO',
        stations: ['Thorndale', 'Downingtown', 'Whitford', 'Exton', 'Malvern', 'Paoli', 'Daylesford', 'Berwyn', 'Devon', 'Strafford', 'Wayne', 'St. Davids', 'Radnor', 'Villanova', 'Rosemont', 'Bryn Mawr', 'Haverford', 'Ardmore', 'Wynnewood', 'Narberth', 'Merion', 'Overbrook', '30th Street', 'Suburban', 'Jefferson']
    },
    'Trenton': {
        abbrev: 'TRE',
        stations: ['Trenton', 'Levittown', 'Bristol', 'Croydon', 'Eddington', 'Cornwells Heights', 'Torresdale', 'Holmesburg Junction', 'Tacony', 'Bridesburg', 'North Philadelphia', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'Warminster': {
        abbrev: 'WAR',
        stations: ['Warminster', 'Hatboro', 'Willow Grove', 'Crestmont', 'Roslyn', 'Ardsley', 'Glenside', 'Jenkintown-Wyncote', 'Elkins Park', 'Melrose Park', 'Fern Rock TC', 'Wayne Junction', 'North Philadelphia', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'West Trenton': {
        abbrev: 'WTR',
        stations: ['West Trenton', 'Yardley', 'Woodbourne', 'Langhorne', 'Neshaminy Falls', 'Trevose', 'Somerton', 'Forest Hills', 'Philmont', 'Bethayres', 'Meadowbrook', 'Rydal', 'Noble', 'Jenkintown-Wyncote', 'Elkins Park', 'Melrose Park', 'Fern Rock TC', 'Wayne Junction', 'North Philadelphia', 'North Broad', 'Temple University', 'Jefferson', 'Suburban', '30th Street']
    },
    'Wilmington/Newark': {
        abbrev: 'WIL',
        stations: ['Newark', 'Wilmington', 'Claymont', 'Marcus Hook', 'Highland Avenue', 'Chester', 'Eddystone', 'Crum Lynne', 'Ridley Park', 'Prospect Park', 'Norwood', 'Glenolden', 'Folcroft', 'Sharon Hill', 'Darby', 'Curtis Park', 'Eastwick', '30th Street', 'Suburban', 'Jefferson']
    }
};

// Regional Rail transfer hubs that connect to G line
const RR_TO_G_TRANSFERS = {
    'Temple University': {
        // Walk to Broad-Girard (about 12 min walk)
        gPickup: 'Broad-Girard',
        walkTime: 12,
        transferVia: null
    },
    'North Broad': {
        // Walk to Broad-Girard (about 8 min walk)
        gPickup: 'Broad-Girard',
        walkTime: 8,
        transferVia: null
    },
    'Jefferson': {
        // Transfer to L line at 8th St, then to Front-Girard
        // Or transfer to B line at City Hall, then to Broad-Girard
        routes: [
            { gPickup: 'Broad-Girard', transferVia: 'B', transferAt: 'City Hall', travelTime: 12, walkTime: 3 },
            { gPickup: 'Front-Girard', transferVia: 'L', transferAt: '8th Street', travelTime: 10, walkTime: 5 }
        ]
    },
    'Suburban': {
        // Transfer to B line at City Hall
        routes: [
            { gPickup: 'Broad-Girard', transferVia: 'B', transferAt: 'City Hall', travelTime: 10, walkTime: 3 }
        ]
    },
    '30th Street': {
        // Transfer to L at 30th St MFL, then eastbound to Front-Girard
        // Or transfer to B via Suburban/City Hall
        routes: [
            { gPickup: 'Front-Girard', transferVia: 'L', transferAt: '30th Street (MFL)', travelTime: 18, walkTime: 5 },
            { gPickup: 'Broad-Girard', transferVia: 'B', transferAt: 'City Hall', travelTime: 15, walkTime: 3 }
        ]
    },
    'Wayne Junction': {
        // Can connect to multiple lines
        routes: [
            { gPickup: 'Broad-Girard', transferVia: 'RR', dest: 'Temple University', travelTime: 8, walkTime: 12 }
        ]
    },
    'Fern Rock TC': {
        // Transfer to B line (Broad Street)
        routes: [
            { gPickup: 'Broad-Girard', transferVia: 'B', transferAt: 'Fern Rock TC', travelTime: 15, walkTime: 3 }
        ]
    },
    'North Philadelphia': {
        // Transfer to B or continue to Temple
        routes: [
            { gPickup: 'Broad-Girard', transferVia: 'RR', dest: 'Temple University', travelTime: 3, walkTime: 12 },
            { gPickup: 'Broad-Girard', transferVia: 'B', transferAt: 'North Philadelphia', travelTime: 8, walkTime: 3 }
        ]
    }
};

// Transfer stations for each RR line, ordered from outbound terminus toward Center City
// These are stations where riders can exit to connect to the G line
const RR_LINE_TRANSFERS = {
    'Chestnut Hill East': {
        transferStations: ['Wayne Junction', 'Temple University', 'Jefferson', 'Suburban', '30th Street'],
        inboundTerminus: '30th Street',
        outboundTerminus: 'Chestnut Hill East'
    },
    'Chestnut Hill West': {
        transferStations: ['North Broad', 'Jefferson', 'Suburban', '30th Street'],
        inboundTerminus: '30th Street',
        outboundTerminus: 'Chestnut Hill West'
    },
    'Cynwyd': {
        transferStations: ['Suburban', '30th Street'],
        inboundTerminus: '30th Street',
        outboundTerminus: 'Cynwyd'
    },
    'Fox Chase': {
        transferStations: ['Wayne Junction', 'Temple University', 'Jefferson', 'Suburban', '30th Street'],
        inboundTerminus: '30th Street',
        outboundTerminus: 'Fox Chase'
    },
    'Lansdale/Doylestown': {
        transferStations: ['Fern Rock TC', 'Wayne Junction', 'North Philadelphia', 'North Broad', 'Temple University', 'Jefferson', 'Suburban', '30th Street'],
        inboundTerminus: '30th Street',
        outboundTerminus: 'Doylestown'
    },
    'Manayunk/Norristown': {
        transferStations: ['North Broad', 'Temple University', 'Jefferson', 'Suburban', '30th Street'],
        inboundTerminus: '30th Street',
        outboundTerminus: 'Elm Street'
    },
    'Media/Wawa': {
        transferStations: ['30th Street', 'Suburban', 'Jefferson'],
        inboundTerminus: 'Jefferson',
        outboundTerminus: 'Wawa'
    },
    'Paoli/Thorndale': {
        transferStations: ['30th Street', 'Suburban', 'Jefferson'],
        inboundTerminus: 'Jefferson',
        outboundTerminus: 'Thorndale'
    },
    'Trenton': {
        transferStations: ['North Philadelphia', 'Temple University', 'Jefferson', 'Suburban', '30th Street'],
        inboundTerminus: '30th Street',
        outboundTerminus: 'Trenton'
    },
    'Warminster': {
        transferStations: ['Fern Rock TC', 'Wayne Junction', 'North Philadelphia', 'Temple University', 'Jefferson', 'Suburban', '30th Street'],
        inboundTerminus: '30th Street',
        outboundTerminus: 'Warminster'
    },
    'West Trenton': {
        transferStations: ['Fern Rock TC', 'Wayne Junction', 'North Philadelphia', 'North Broad', 'Temple University', 'Jefferson', 'Suburban', '30th Street'],
        inboundTerminus: '30th Street',
        outboundTerminus: 'West Trenton'
    },
    'Wilmington/Newark': {
        transferStations: ['30th Street', 'Suburban', 'Jefferson'],
        inboundTerminus: 'Jefferson',
        outboundTerminus: 'Newark'
    }
};

// Exit station info - what to do when you get off at each transfer station
const EXIT_STATION_INFO = {
    'Temple University': {
        gPickup: 'Broad-Girard',
        walkTime: 12,
        transferVia: null,
        description: 'Walk to Broad-Girard'
    },
    'North Broad': {
        gPickup: 'Broad-Girard',
        walkTime: 3,  // Walk from Girard BSL to Broad-Girard
        transferVia: 'B',
        metroDirection: 'southbound',
        metroTime: 5,  // North Philadelphia B to Girard B is ~5 min
        walkToMetro: 7,  // Walk from North Broad RR to North Philadelphia B station
        description: 'Walk to North Philadelphia (BSL), take B southbound to Broad-Girard'
    },
    'North Philadelphia': {
        gPickup: 'Broad-Girard',
        walkTime: 3,  // Walk from Girard BSL to Broad-Girard
        transferVia: 'B',
        metroDirection: 'southbound',
        metroTime: 5,  // North Philadelphia B to Girard B is ~5 min
        walkToMetro: 5,  // Walk from North Philadelphia RR to North Philadelphia B station
        description: 'Walk to North Philadelphia (BSL), take B southbound to Broad-Girard'
    },
    'Fern Rock TC': {
        gPickup: 'Broad-Girard',
        walkTime: 3,
        transferVia: 'B',
        metroDirection: 'southbound',
        metroTime: 12,
        description: 'Transfer to B southbound to Broad-Girard'
    },
    'Wayne Junction': {
        gPickup: 'Broad-Girard',
        walkTime: 12,
        transferVia: null,
        description: 'Walk to Broad-Girard (via Temple area)',
        note: 'Stay on train to Temple University for easier walk'
    },
    'Jefferson': {
        gPickup: 'Broad-Girard',
        walkTime: 3,
        transferVia: 'B',
        metroDirection: 'northbound',
        metroTime: 10,
        description: 'Transfer to B northbound to Broad-Girard'
    },
    'Suburban': {
        gPickup: 'Broad-Girard',
        walkTime: 3,
        transferVia: 'B',
        metroDirection: 'northbound',
        metroTime: 12,
        description: 'Transfer to B northbound to Broad-Girard'
    },
    '30th Street': {
        gPickup: 'Front-Girard',
        walkTime: 5,
        transferVia: 'L',
        metroDirection: 'eastbound',
        metroTime: 15,
        description: 'Transfer to L eastbound to Front-Girard'
    }
};

// Determine ALL viable exit stations for a given origin station traveling toward a destination
// Returns array of exit options, sorted by preference (shortest travel time first)
function getAllExitStations(originStation, lineName, trainDestination) {
    const results = [];

    // Check if origin IS a transfer station - user can walk directly
    if (EXIT_STATION_INFO[originStation]) {
        return [{
            exitStation: originStation,
            info: EXIT_STATION_INFO[originStation],
            alreadyAtTransfer: true,
            stopsAway: 0
        }];
    }

    const lineConfig = RR_LINE_TRANSFERS[lineName];
    if (!lineConfig) {
        console.log('No line config for:', lineName);
        return [];
    }

    const lineStations = REGIONAL_RAIL_LINES[lineName]?.stations || [];
    const originIndex = lineStations.indexOf(originStation);

    if (originIndex === -1) {
        console.log('Origin not found on line:', originStation, lineName);
        return [];
    }

    // Determine if train passes through Center City based on destination
    // SEPTA through-routes trains, so "Airport" from East Falls passes through Temple/Jefferson
    const destLower = (trainDestination || '').toLowerCase();

    // Outbound destinations by line - these go AWAY from Center City
    const outboundDestinations = {
        'Manayunk/Norristown': ['norristown', 'elm street', 'elm st', 'conshohocken', 'spring mill', 'manayunk'],
        'Chestnut Hill East': ['chestnut hill east', 'chestnut hill', 'mt airy', 'wyndmoor', 'gravers'],
        'Chestnut Hill West': ['chestnut hill west', 'chestnut hill', 'st. martins', 'allen lane', 'carpenter'],
        'Fox Chase': ['fox chase', 'ryers', 'cheltenham', 'lawndale', 'olney'],
        'Lansdale/Doylestown': ['doylestown', 'lansdale', 'north wales', 'gwynedd', 'penllyn', 'ambler', 'fort washington', 'oreland', 'north hills', 'glenside'],
        'Warminster': ['warminster', 'hatboro', 'willow grove', 'crestmont', 'roslyn', 'ardsley', 'glenside'],
        'West Trenton': ['west trenton', 'yardley', 'woodbourne', 'langhorne', 'neshaminy', 'trevose', 'somerton', 'forest hills', 'philmont', 'bethayres', 'meadowbrook', 'rydal'],
        'Trenton': ['trenton', 'levittown', 'bristol', 'croydon', 'eddington', 'cornwells', 'torresdale', 'holmesburg', 'tacony', 'bridesburg'],
        'Media/Wawa': ['wawa', 'media', 'elwyn', 'moylan-rose', 'wallingford', 'swarthmore', 'morton', 'secane', 'primos', 'clifton-aldan', 'gladstone', 'lansdowne', 'fernwood'],
        'Paoli/Thorndale': ['thorndale', 'downingtown', 'whitford', 'exton', 'malvern', 'paoli', 'daylesford', 'berwyn', 'devon', 'strafford', 'wayne', 'st davids', 'radnor', 'villanova', 'rosemont', 'bryn mawr', 'haverford', 'ardmore', 'wynnewood', 'narberth', 'merion', 'overbrook'],
        'Wilmington/Newark': ['newark', 'wilmington', 'claymont', 'marcus hook', 'highland ave', 'chester', 'eddystone', 'crum lynne', 'ridley park', 'prospect park', 'norwood', 'glenolden', 'folcroft', 'sharon hill', 'curtis park', 'darby'],
        'Cynwyd': ['cynwyd', 'bala', 'wynnefield']
    };

    // Check if this train is going outbound (away from Center City)
    const lineOutbound = outboundDestinations[lineName] || [];
    const isOutbound = lineOutbound.some(dest => destLower.includes(dest));

    // If going outbound, this train doesn't help reach G line
    if (isOutbound) {
        console.log('Train is outbound (away from Center City):', trainDestination);
        return [];
    }

    // Train is inbound or through-routed to south side - it passes through Center City
    console.log('Train is inbound/through-routed:', trainDestination, '- will pass through transfer stations');

    const transferStations = lineConfig.transferStations;
    const reverseLines = ['Media/Wawa', 'Paoli/Thorndale', 'Wilmington/Newark'];
    const isReverse = reverseLines.includes(lineName);

    // Find ALL reachable exit stations
    for (const exitStation of transferStations) {
        const exitIndex = lineStations.indexOf(exitStation);
        if (exitIndex === -1) continue;

        // Check if this exit station is reachable in direction of travel
        let isReachable = false;
        let stopsAway = 0;

        if (isReverse) {
            if (exitIndex < originIndex) {
                isReachable = true;
                stopsAway = originIndex - exitIndex;
            }
        } else {
            if (exitIndex > originIndex) {
                isReachable = true;
                stopsAway = exitIndex - originIndex;
            }
        }

        if (isReachable && EXIT_STATION_INFO[exitStation]) {
            results.push({
                exitStation,
                info: EXIT_STATION_INFO[exitStation],
                stopsAway
            });
        }
    }

    // Sort by stops away (closest first)
    results.sort((a, b) => a.stopsAway - b.stopsAway);

    return results;
}

// Get the best single exit station (for backwards compatibility)
function getBestExitStation(originStation, lineName, trainDestination) {
    const allExits = getAllExitStations(originStation, lineName, trainDestination);
    return allExits.length > 0 ? allExits[0] : null;
}

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
                lineColor: line.color,
                stationData: station
            };
        }
    }
    if (line.routes) {
        for (const [routeId, routeData] of Object.entries(line.routes)) {
            const stations = routeData.stations || routeData;
            const routeName = routeData.name || routeId;
            for (const station of stations) {
                const key = station.name;
                STATIONS[key] = {
                    type: 'metro_' + lineId,
                    line: lineId,
                    route: routeId,
                    routeName: routeName,
                    lineName: line.name,
                    lineColor: line.color,
                    stationData: station
                };
            }
        }
    }
}

// Add Regional Rail stations
for (const [lineName, line] of Object.entries(REGIONAL_RAIL_LINES)) {
    for (const stationName of line.stations) {
        const key = stationName;
        if (!STATIONS[key]) {
            // Check if this station has a defined G transfer
            const gTransfer = RR_TO_G_TRANSFERS[stationName];

            STATIONS[key] = {
                type: 'regional_rail',
                line: lineName,
                lineName: lineName,
                lineAbbrev: line.abbrev,
                lineColor: '#4A4A4D',
                api_name: stationName === '30th Street' ? '30th Street Station' :
                          stationName === 'Suburban' ? 'Suburban Station' :
                          stationName === 'Jefferson' ? 'Jefferson Station' : stationName,
                gTransfer: gTransfer || null
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
        // Show Metro lines: B, L, M, D, T, G
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
            <button class="line-btn line-D ${selectedLine === 'D' ? 'active' : ''}" data-line="D" onclick="setLine('D')">
                <span class="line-letter">D</span> Media/Sharon Hill
            </button>
            <button class="line-btn line-T ${selectedLine === 'T' ? 'active' : ''}" data-line="T" onclick="setLine('T')">
                <span class="line-letter">T</span> Trolleys
            </button>
            <button class="line-btn line-G ${selectedLine === 'G' ? 'active' : ''}" data-line="G" onclick="setLine('G')">
                <span class="line-letter">G</span> Girard
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

// G pickup point sequence numbers (approximate)
const G_PICKUP_SEQUENCES = {
    'Lancaster-Girard': { eb: 11, wb: 16 },  // Index 11 in simple list
    'Broad-Girard': { eb: 17, wb: 10 },      // Index 33 in simple list
    'Front-Girard': { eb: 21, wb: 6 }        // Index 42 in simple list
};

// ============================================
// SMART ROUTING FUNCTIONS
// Calculate routes from any origin to G pickup points
// ============================================

function isPeakHour() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    // Weekday 6-9am or 4-7pm
    return day >= 1 && day <= 5 && ((hour >= 6 && hour < 9) || (hour >= 16 && hour < 19));
}

function getMetroFrequency(lineId) {
    const freq = METRO_FREQUENCY[lineId];
    if (!freq) return 10;
    return isPeakHour() ? freq.peak : freq.offpeak;
}

// Get intermediate stations between origin and destination on a line
function getIntermediateStations(lineName, fromStation, toStation, maxStops = 5) {
    const lineData = REGIONAL_RAIL_LINES[lineName];
    if (!lineData) return { stations: [], stops: 0 };

    const stations = lineData.stations;
    const fromIdx = stations.indexOf(fromStation);
    const toIdx = stations.indexOf(toStation);

    if (fromIdx === -1 || toIdx === -1) return { stations: [], stops: 0 };

    const start = Math.min(fromIdx, toIdx);
    const end = Math.max(fromIdx, toIdx);
    const allStops = stations.slice(start, end + 1);

    // If traveling in reverse order, reverse the array
    if (fromIdx > toIdx) {
        allStops.reverse();
    }

    const stops = allStops.length - 1;

    // Pick key intermediate stations (first, middle, last)
    let intermediates = [];
    if (allStops.length <= 3) {
        intermediates = allStops;
    } else if (allStops.length <= 5) {
        intermediates = [allStops[0], allStops[Math.floor(allStops.length / 2)], allStops[allStops.length - 1]];
    } else {
        // For longer routes, show origin, 1-2 key stops, destination
        const midIdx = Math.floor(allStops.length / 2);
        intermediates = [allStops[0], allStops[midIdx], allStops[allStops.length - 1]];
    }

    return { stations: intermediates, stops, allStops };
}

// Generate HTML for stops indicator line
function generateStopsIndicator(fromStation, toStation, numStops, intermediateStops = []) {
    if (!fromStation || !toStation) return '';

    // Shorten station names for display
    const shorten = (name) => {
        if (!name) return '';
        // Remove common suffixes and shorten
        return name
            .replace(' Station', '')
            .replace(' (MFL)', '')
            .replace(' TC', '')
            .replace('North ', 'N ')
            .replace('South ', 'S ')
            .replace('East ', 'E ')
            .replace('West ', 'W ')
            .replace(' Street', ' St')
            .replace(' Avenue', ' Av')
            .substring(0, 10);
    };

    const from = shorten(fromStation);
    const to = shorten(toStation);

    // Build intermediate dots - show names if provided, otherwise just dots
    let stopsHtml = '';
    const maxIntermediates = 4; // Max intermediate stops to show

    if (intermediateStops.length > 0) {
        // We have named intermediate stops
        const toShow = intermediateStops.slice(0, maxIntermediates);
        stopsHtml = toShow.map(name =>
            `<span class="stop-dot" title="${name}"></span>`
        ).join('');
        if (intermediateStops.length > maxIntermediates) {
            stopsHtml += `<span class="stop-more">+${intermediateStops.length - maxIntermediates}</span>`;
        }
    } else if (numStops > 1) {
        // No names, just show dots for intermediate stops
        const numDots = Math.min(numStops - 1, maxIntermediates);
        for (let i = 0; i < numDots; i++) {
            stopsHtml += '<span class="stop-dot"></span>';
        }
        if (numStops - 1 > maxIntermediates) {
            stopsHtml += `<span class="stop-more">+${numStops - 1 - maxIntermediates}</span>`;
        }
    }

    return `
        <div class="stops-indicator">
            <span class="stop-label start">${from}</span>
            <div class="stops-line">
                <span class="stop-dot origin"></span>
                ${stopsHtml}
                <span class="stop-dot destination"></span>
            </div>
            <span class="stop-label end">${to}</span>
            <span class="stops-count">${numStops} stop${numStops !== 1 ? 's' : ''}</span>
        </div>
    `;
}

// Calculate ETA of next G trolley at a specific pickup point
function getNextTrolleyAtPickup(pickupName, trolleyData) {
    const pickupSeq = G_PICKUP_SEQUENCES[pickupName];
    if (!pickupSeq) return null;

    let bestEta = null;
    let bestTrolley = null;

    for (const trolley of trolleyData) {
        if (!trolley.currentSequence) continue;

        let stopsAway;
        if (trolley.direction === 'Eastbound') {
            stopsAway = pickupSeq.eb - trolley.currentSequence;
        } else if (trolley.direction === 'Westbound') {
            stopsAway = pickupSeq.wb - trolley.currentSequence;
        } else {
            continue;
        }

        // Only count trolleys that haven't passed this stop yet
        if (stopsAway > 0) {
            const eta = Math.round(stopsAway * CONFIG.MINUTES_PER_STOP);
            if (bestEta === null || eta < bestEta) {
                bestEta = eta;
                bestTrolley = trolley;
            }
        }
    }

    return bestEta !== null ? { eta: bestEta, trolley: bestTrolley } : null;
}

// Calculate route options from origin station to G pickup points
async function calculateRouteOptions(originStation, trolleyData) {
    const station = STATIONS[originStation];
    if (!station) return [];

    const options = [];
    const now = new Date();

    // Handle different station types
    if (station.type === 'metro_G') {
        // Already on G line - show all approaching trolleys with directions
        const pickup = station.stationData?.gPickup || originStation;
        const allTrolleys = await getTrolleysForPickup(pickup, trolleyData);

        if (allTrolleys.length > 0) {
            // Create an option for each trolley
            for (const trolley of allTrolleys) {
                const arrivalTime = new Date(now.getTime() + trolley.etaToPickup * 60000);
                options.push({
                    gPickup: pickup,
                    steps: [{ type: 'wait', description: 'Wait for G trolley', time: 0 }],
                    travelTime: 0,
                    walkTime: 0,
                    trolleyWait: trolley.etaToPickup,
                    totalTime: trolley.etaToPickup,
                    minutesToPickup: 0,
                    trolleyVehicle: trolley.vehicle,
                    trolleyDirection: trolley.direction,
                    trolleyArrivalTime: arrivalTime
                });
            }
        } else {
            // No trolleys approaching - show estimated wait
            options.push({
                gPickup: pickup,
                steps: [{ type: 'wait', description: 'Wait for G trolley', time: 0 }],
                travelTime: 0,
                walkTime: 0,
                trolleyWait: CONFIG.ESTIMATED_HEADWAY,
                totalTime: CONFIG.ESTIMATED_HEADWAY,
                minutesToPickup: 0
            });
        }
    } else if (station.type === 'metro_B') {
        // B line -> Multiple departure options to Broad-Girard
        const stationData = station.stationData;
        const direction = stationData?.direction;
        // Use ACTUAL travel time from SEPTA schedule data (not estimated)
        const travelTime = stationData?.travelTimeToGirard ?? 10;
        const frequency = getMetroFrequency('B');
        const walkTime = stationData?.walkTime || 3;
        const directionText = direction === 'northbound' ? 'northbound' : 'southbound';

        // Create options for next 5 departures
        for (let departureNum = 0; departureNum < 5; departureNum++) {
            const waitTime = departureNum * frequency; // 0, 5, 10, 15, 20 min
            const departureTime = new Date(now.getTime() + waitTime * 60000);
            const departTimeFormatted = formatTime(departureTime);
            const totalTravelTime = waitTime + travelTime + walkTime;

            // Check trolleys at pickup
            const pickupTrolleys = await getTrolleysForPickup('Broad-Girard', trolleyData);

            // Find best trolley for this departure
            let bestTrolley = null;
            let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

            for (const trolley of pickupTrolleys) {
                const waitForThisTrolley = trolley.etaToPickup - totalTravelTime;
                if (waitForThisTrolley >= -2) {
                    if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                        bestTrolley = trolley;
                        trolleyWait = Math.max(0, waitForThisTrolley);
                    }
                }
            }

            const totalTime = totalTravelTime + trolleyWait;

            const option = {
                gPickup: 'Broad-Girard',
                steps: [
                    {
                        type: 'metro',
                        line: 'B',
                        direction: directionText,
                        description: `Take B ${directionText} to Broad-Girard (B1 local or B3 express)`,
                        departTime: '~' + departTimeFormatted,
                        time: waitTime + travelTime,
                        fromStation: originStation,
                        toStation: 'Broad-Girard',
                        travelTimeMin: travelTime,
                        isScheduled: false  // B line has no public real-time API
                    },
                    { type: 'exit', description: 'Exit at Broad-Girard', station: 'Broad-Girard', exitLine: 'B', time: 0 },
                    { type: 'walk', description: 'Walk to Broad-Girard', time: walkTime }
                ],
                travelTime: waitTime + travelTime,
                walkTime: walkTime,
                trolleyWait: trolleyWait,
                totalTime: totalTime,
                minutesToPickup: totalTravelTime,
                metroDepartTime: '~' + departTimeFormatted
            };

            if (bestTrolley) {
                option.trolleyVehicle = bestTrolley.vehicle;
                option.trolleyDirection = bestTrolley.direction;
                option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
            }

            options.push(option);
        }
    } else if (station.type === 'metro_L') {
        // L line -> Multiple routes possible
        const stationData = station.stationData;
        const direction = stationData?.direction;
        console.log('[L-LINE DEBUG] Station:', originStation, 'stationData:', stationData, 'direction:', direction);
        // Use ACTUAL travel time from SEPTA schedule data (not estimated)
        const travelTime = stationData?.travelTimeToGirard ?? 10;
        const frequency = getMetroFrequency('L');
        const walkTime = stationData?.walkTime || 5;

        // Check if this station can transfer to B at City Hall
        // Stations southwest of Girard (direction 'eastbound' to reach Girard) can also reach City Hall going westbound
        const canTransferToB = direction === 'eastbound';

        // L line stations and their stops to City Hall (MFL)
        const stopsToCityHall = {
            'Spring Garden (MFL)': 5,
            '8th Street': 4,
            '11th Street': 3,
            '13th Street': 2,
            '15th Street': 1,
            'City Hall (MFL)': 0,
            '30th Street (MFL)': 1,
            '40th Street': 2,
            '46th Street': 3,
            '52nd Street': 4,
            '56th Street': 5,
            '60th Street': 6,
            '63rd Street': 7,
            'Millbourne': 8,
            '69th Street TC': 9
        };

        // Route 1: Direct L line to Front-Girard
        for (let departureNum = 0; departureNum < 3; departureNum++) {
            const waitTime = departureNum * frequency;
            const departureTime = new Date(now.getTime() + waitTime * 60000);
            const departTimeFormatted = formatTime(departureTime);
            const totalTravelTime = waitTime + travelTime + walkTime;

            const pickupTrolleys = await getTrolleysForPickup('Front-Girard', trolleyData);

            let bestTrolley = null;
            let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

            for (const trolley of pickupTrolleys) {
                const waitForThisTrolley = trolley.etaToPickup - totalTravelTime;
                if (waitForThisTrolley >= -2) {
                    if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                        bestTrolley = trolley;
                        trolleyWait = Math.max(0, waitForThisTrolley);
                    }
                }
            }

            const totalTime = totalTravelTime + trolleyWait;
            // Direction to Front-Girard which connects to Front-Girard:
            // - Stations northeast of Girard (Berks, Erie, etc.) have direction 'westbound'
            // - Stations southwest of Girard (13th St, City Hall, etc.) have direction 'eastbound'
            const directionText = direction === 'westbound' ? 'westbound' : 'eastbound';
            console.log('[L-LINE DEBUG] Route 1 (Front-Girard): direction=', direction, '-> directionText=', directionText);

            const option = {
                gPickup: 'Front-Girard',
                steps: [
                    {
                        type: 'metro',
                        line: 'L',
                        direction: directionText,
                        description: `Take L ${directionText} to Front-Girard`,
                        departTime: '~' + departTimeFormatted,
                        time: waitTime + travelTime,
                        fromStation: originStation,
                        toStation: 'Front-Girard',
                        travelTimeMin: travelTime,
                        isScheduled: false  // L line has no public real-time API
                    },
                    { type: 'exit', description: 'Exit at Front-Girard', station: 'Front-Girard', exitLine: 'L', time: 0 },
                    { type: 'walk', description: 'Walk to Front-Girard on G line', time: walkTime }
                ],
                travelTime: waitTime + travelTime,
                walkTime: walkTime,
                trolleyWait: trolleyWait,
                totalTime: totalTime,
                minutesToPickup: totalTravelTime,
                metroDepartTime: '~' + departTimeFormatted
            };

            if (bestTrolley) {
                option.trolleyVehicle = bestTrolley.vehicle;
                option.trolleyDirection = bestTrolley.direction;
                option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
            }

            options.push(option);
        }

        // Route 2: Transfer to B at City Hall → Broad-Girard (only for stations that pass through City Hall)
        if (canTransferToB) {
            const stationName = stationData?.name || originStation;
            // L line travel times to City Hall (from SEPTA schedule data)
            const lTimesToCityHall = {
                'Spring Garden (MFL)': 6, '8th Street': 4, '11th Street': 3,
                '13th Street': 2, '15th Street': 1, 'City Hall (MFL)': 0,
                '30th Street (MFL)': 3, '40th Street': 6, '46th Street': 7,
                '52nd Street': 9, '56th Street': 10, '60th Street': 11,
                '63rd Street': 12, 'Millbourne': 13, '69th Street TC': 14
            };
            const lToCityHall = lTimesToCityHall[stationName] ?? 5;
            const bWait = getMetroFrequency('B');
            const bToGirard = 7; // City Hall to Girard on B = 7 min (from SEPTA schedule)
            const bWalkTime = 3;

            // Determine direction to City Hall based on station position
            // Stations west of City Hall (30th St and beyond) go eastbound to City Hall
            // Stations east of City Hall (Spring Garden to 15th St) go westbound to City Hall
            const westOfCityHall = ['30th Street (MFL)', '40th Street', '46th Street', '52nd Street',
                                     '56th Street', '60th Street', '63rd Street', 'Millbourne', '69th Street TC'];
            const directionToCityHall = westOfCityHall.includes(stationName) ? 'eastbound' : 'westbound';

            for (let departureNum = 0; departureNum < 2; departureNum++) {
                const waitTime = departureNum * frequency;
                const departureTime = new Date(now.getTime() + waitTime * 60000);
                const departTimeFormatted = formatTime(departureTime);
                const totalTravelTime = waitTime + lToCityHall + bWait + bToGirard + bWalkTime;

                const pickupTrolleys = await getTrolleysForPickup('Broad-Girard', trolleyData);

                let bestTrolley = null;
                let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

                for (const trolley of pickupTrolleys) {
                    const waitForThisTrolley = trolley.etaToPickup - totalTravelTime;
                    if (waitForThisTrolley >= -2) {
                        if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                            bestTrolley = trolley;
                            trolleyWait = Math.max(0, waitForThisTrolley);
                        }
                    }
                }

                const totalTime = totalTravelTime + trolleyWait;

                const option = {
                    gPickup: 'Broad-Girard',
                    steps: [
                        {
                            type: 'metro',
                            line: 'L',
                            direction: directionToCityHall,
                            description: `Take L ${directionToCityHall} to City Hall`,
                            departTime: '~' + departTimeFormatted,
                            time: waitTime + lToCityHall,
                            fromStation: originStation,
                            toStation: 'City Hall',
                            numStops: stopsToCityHall[stationName] || 0,
                            isScheduled: false
                        },
                        { type: 'exit', description: 'Exit at City Hall', station: 'City Hall (MFL)', exitLine: 'L', time: 0 },
                        { type: 'transfer', description: 'Transfer to B line (Broad Street Line)' },
                        { type: 'metro', line: 'B', direction: 'northbound', description: 'Take B northbound to Broad-Girard (B1 local or B3 express)', time: bWait + bToGirard, fromStation: 'City Hall', toStation: 'Broad-Girard', numStops: 4 },
                        { type: 'exit', description: 'Exit at Broad-Girard', station: 'Broad-Girard', exitLine: 'B', time: 0 },
                        { type: 'walk', description: 'Walk to Broad-Girard', time: bWalkTime }
                    ],
                    travelTime: waitTime + lToCityHall + bWait + bToGirard,
                    walkTime: bWalkTime,
                    trolleyWait: trolleyWait,
                    totalTime: totalTime,
                    minutesToPickup: totalTravelTime,
                    metroDepartTime: '~' + departTimeFormatted
                };

                if (bestTrolley) {
                    option.trolleyVehicle = bestTrolley.vehicle;
                    option.trolleyDirection = bestTrolley.direction;
                    option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
                }

                options.push(option);
            }
        }

        // Route 3: Transfer to T1 at 30th Street → Lancaster-Girard (west side option)
        // This gives users the option to catch trolleys on the west end of the G line
        const stationName = stationData?.name || originStation;

        // L line travel times to 30th Street MFL (from SEPTA schedule data)
        const lTimesTo30th = {
            'Frankford TC': 22, 'Arrott TC': 21, 'Church': 20, 'Margaret-Orthodox': 19,
            'Huntingdon': 18, 'Somerset': 17, 'Allegheny': 16, 'Tioga': 15,
            'Erie-Torresdale': 13, 'Berks': 11, 'Front-Girard': 10,
            'Spring Garden (MFL)': 9, '8th Street': 7, '11th Street': 6,
            '13th Street': 5, '15th Street': 4, 'City Hall (MFL)': 3,
            '30th Street (MFL)': 0, '40th Street': 3, '46th Street': 4,
            '52nd Street': 6, '56th Street': 7, '60th Street': 8,
            '63rd Street': 9, 'Millbourne': 10, '69th Street TC': 11
        };

        const lTo30th = lTimesTo30th[stationName];

        // Only add this route if we have travel time data for this station
        if (lTo30th !== undefined) {
            const t1Wait = getMetroFrequency('T');
            const t1ToLancaster = 12; // 30th St to Lancaster-Girard on T1 (5 stops × ~2.5 min)
            const t1WalkTime = 2;

            // Determine direction to 30th St based on station position
            // Stations east of 30th St go westbound, stations west go eastbound
            const eastOf30th = ['Spring Garden (MFL)', '8th Street', '11th Street', '13th Street',
                               '15th Street', 'City Hall (MFL)', 'Front-Girard', 'Berks',
                               'Erie-Torresdale', 'Tioga', 'Allegheny', 'Somerset', 'Huntingdon',
                               'Margaret-Orthodox', 'Church', 'Arrott TC', 'Frankford TC'];
            const directionTo30th = eastOf30th.includes(stationName) ? 'westbound' : 'eastbound';

            for (let departureNum = 0; departureNum < 2; departureNum++) {
                const waitTime = departureNum * frequency;
                const departureTime = new Date(now.getTime() + waitTime * 60000);
                const departTimeFormatted = formatTime(departureTime);
                const totalTravelTime = waitTime + lTo30th + t1Wait + t1ToLancaster + t1WalkTime;

                const pickupTrolleys = await getTrolleysForPickup('Lancaster-Girard', trolleyData);

                let bestTrolley = null;
                let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

                for (const trolley of pickupTrolleys) {
                    const waitForThisTrolley = trolley.etaToPickup - totalTravelTime;
                    if (waitForThisTrolley >= -2) {
                        if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                            bestTrolley = trolley;
                            trolleyWait = Math.max(0, waitForThisTrolley);
                        }
                    }
                }

                const totalTime = totalTravelTime + trolleyWait;

                const option = {
                    gPickup: 'Lancaster-Girard',
                    steps: [
                        {
                            type: 'metro',
                            line: 'L',
                            direction: directionTo30th,
                            description: `Take L ${directionTo30th} to 30th Street`,
                            departTime: '~' + departTimeFormatted,
                            time: waitTime + lTo30th,
                            fromStation: originStation,
                            toStation: '30th Street',
                            isScheduled: false
                        },
                        { type: 'exit', description: 'Exit at 30th Street', station: '30th Street (MFL)', exitLine: 'L', time: 0 },
                        { type: 'transfer', description: 'Transfer to T1 trolley (Route 10)' },
                        { type: 'metro', line: 'T', direction: 'outbound', description: 'Take T1 toward 63rd-Malvern', time: t1Wait + t1ToLancaster, fromStation: '30th Street', toStation: 'Lancaster-Girard' },
                        { type: 'exit', description: 'Exit at Lancaster-Girard', station: 'Lancaster-Girard', exitLine: 'T', time: 0 },
                        { type: 'walk', description: 'Walk to G line stop', time: t1WalkTime }
                    ],
                    travelTime: waitTime + lTo30th + t1Wait + t1ToLancaster,
                    walkTime: t1WalkTime,
                    trolleyWait: trolleyWait,
                    totalTime: totalTime,
                    minutesToPickup: totalTravelTime,
                    metroDepartTime: '~' + departTimeFormatted
                };

                if (bestTrolley) {
                    option.trolleyVehicle = bestTrolley.vehicle;
                    option.trolleyDirection = bestTrolley.direction;
                    option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
                }

                options.push(option);
            }
        }

        // Route 4: Direct T1 access from 40th Street (walk to 40th & Lancaster T1 stop)
        // 40th St Portal (L) is adjacent to 40th & Lancaster (T1) - much faster than going to 30th St first
        if (stationName === '40th Street') {
            const walkToT1 = 5;  // Walk from 40th St Portal to 40th & Lancaster T1 stop
            const t1Wait = getMetroFrequency('T');
            const t1ToLancaster = 5;  // 40th & Lancaster to Lancaster-Girard = 2 stops * 2.5 min
            const t1WalkTime = 2;

            for (let departureNum = 0; departureNum < 2; departureNum++) {
                const waitAtStop = departureNum * t1Wait;
                const departureTime = new Date(now.getTime() + (walkToT1 + waitAtStop) * 60000);
                const departTimeFormatted = formatTime(departureTime);
                const totalTravelTime = walkToT1 + waitAtStop + t1ToLancaster + t1WalkTime;

                const pickupTrolleys = await getTrolleysForPickup('Lancaster-Girard', trolleyData);

                let bestTrolley = null;
                let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

                for (const trolley of pickupTrolleys) {
                    const waitForThisTrolley = trolley.etaToPickup - totalTravelTime;
                    if (waitForThisTrolley >= -2) {
                        if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                            bestTrolley = trolley;
                            trolleyWait = Math.max(0, waitForThisTrolley);
                        }
                    }
                }

                const totalTime = totalTravelTime + trolleyWait;

                const option = {
                    gPickup: 'Lancaster-Girard',
                    steps: [
                        { type: 'walk', description: 'Walk to 40th & Lancaster (T1 stop)', time: walkToT1 },
                        {
                            type: 'metro',
                            line: 'T',
                            direction: 'outbound',
                            description: 'Take T1 toward 63rd-Malvern',
                            departTime: '~' + departTimeFormatted,
                            time: waitAtStop + t1ToLancaster,
                            fromStation: '40th & Lancaster',
                            toStation: 'Lancaster-Girard',
                            numStops: 2,
                            isScheduled: false
                        },
                        { type: 'exit', description: 'Exit at Lancaster-Girard', station: 'Lancaster-Girard', exitLine: 'T', time: 0 },
                        { type: 'walk', description: 'Walk to G line stop', time: t1WalkTime }
                    ],
                    travelTime: walkToT1 + waitAtStop + t1ToLancaster,
                    walkTime: walkToT1 + t1WalkTime,
                    trolleyWait: trolleyWait,
                    totalTime: totalTime,
                    minutesToPickup: totalTravelTime,
                    metroDepartTime: '~' + departTimeFormatted
                };

                if (bestTrolley) {
                    option.trolleyVehicle = bestTrolley.vehicle;
                    option.trolleyDirection = bestTrolley.direction;
                    option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
                }

                options.push(option);
            }
        }
    } else if (station.type === 'metro_M') {
        // M line (Norristown High Speed Line) -> 69th St TC -> L -> Front-Girard
        const stationData = station.stationData;
        const stopsTo69th = stationData?.stopsTo69th || 5;
        const mTravelTime = Math.round(stopsTo69th * 2.5);
        const mFrequency = getMetroFrequency('M');
        const lTravelTime = 30; // 69th St to Girard on L
        const lWait = getMetroFrequency('L');
        const walkTime = 5;

        for (let departureNum = 0; departureNum < 5; departureNum++) {
            const mWait = departureNum * mFrequency;
            const departureTime = new Date(now.getTime() + mWait * 60000);
            const departTimeFormatted = formatTime(departureTime);
            const totalTravelTime = mWait + mTravelTime + lWait + lTravelTime + walkTime;

            const pickupTrolleys = await getTrolleysForPickup('Front-Girard', trolleyData);

            let bestTrolley = null;
            let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

            for (const trolley of pickupTrolleys) {
                const waitForThisTrolley = trolley.etaToPickup - totalTravelTime;
                if (waitForThisTrolley >= -2) {
                    if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                        bestTrolley = trolley;
                        trolleyWait = Math.max(0, waitForThisTrolley);
                    }
                }
            }

            const totalTime = totalTravelTime + trolleyWait;

            const option = {
                gPickup: 'Front-Girard',
                steps: [
                    {
                        type: 'metro',
                        line: 'M',
                        description: 'Take M toward 69th St',
                        departTime: '~' + departTimeFormatted,
                        time: mWait + mTravelTime,
                        fromStation: originStation,
                        toStation: '69th St TC',
                        numStops: stopsTo69th,
                        isScheduled: false
                    },
                    { type: 'exit', description: 'Exit at 69th Street TC', station: '69th Street TC', exitLine: 'M', time: 0 },
                    { type: 'transfer', description: 'Transfer to L line at 69th Street TC' },
                    { type: 'metro', line: 'L', direction: 'eastbound', description: 'Take L eastbound to Front-Girard', time: lWait + lTravelTime, fromStation: '69th St TC', toStation: 'Front-Girard', numStops: 15 },
                    { type: 'exit', description: 'Exit at Front-Girard', station: 'Front-Girard', exitLine: 'L', time: 0 },
                    { type: 'walk', description: 'Walk to Front-Girard on G line', time: walkTime }
                ],
                travelTime: mWait + mTravelTime + lWait + lTravelTime,
                walkTime: walkTime,
                trolleyWait: trolleyWait,
                totalTime: totalTime,
                minutesToPickup: totalTravelTime,
                metroDepartTime: '~' + departTimeFormatted
            };

            if (bestTrolley) {
                option.trolleyVehicle = bestTrolley.vehicle;
                option.trolleyDirection = bestTrolley.direction;
                option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
            }

            options.push(option);
        }
    } else if (station.type === 'metro_D') {
        // D line (101/102) -> 69th St TC -> L -> Front-Girard
        const stationData = station.stationData;
        const stopsTo69th = stationData?.stopsTo69th || 5;
        const dTravelTime = Math.round(stopsTo69th * 3); // ~3 min per stop
        const lTravelTime = 30; // 69th St to Girard on L
        const lWait = getMetroFrequency('L');
        const walkTime = 5;

        // Try to get actual scheduled departures
        const stopId = stationData?.stopId;
        let departures = [];

        if (stopId) {
            // Get all D line departures (both D1 and D2), filter by direction
            departures = await fetchMetroSchedule(stopId, null);
            // Filter for D line trains going TO 69th St (inbound)
            departures = departures.filter(d =>
                (d.route === 'D1' || d.route === 'D2') &&
                (d.direction?.toLowerCase().includes('69th') ||
                 d.direction?.toLowerCase().includes('transit center'))
            );
        }

        // Use actual departures if available, otherwise fall back to estimates
        const useScheduledTimes = departures.length > 0;
        const numOptions = useScheduledTimes ? Math.min(departures.length, 5) : 5;
        const dFrequency = getMetroFrequency('D');

        for (let departureNum = 0; departureNum < numOptions; departureNum++) {
            let departureTime, departTimeFormatted, dWait;

            if (useScheduledTimes) {
                const dep = departures[departureNum];
                departureTime = dep.departureTime;
                departTimeFormatted = dep.time.toUpperCase(); // "3:45P" -> "3:45P"
                dWait = dep.minutesUntil;
            } else {
                // Fall back to estimated times
                dWait = departureNum * dFrequency;
                departureTime = new Date(now.getTime() + dWait * 60000);
                departTimeFormatted = '~' + formatTime(departureTime);
            }

            const totalTravelTime = dWait + dTravelTime + lWait + lTravelTime + walkTime;

            const pickupTrolleys = await getTrolleysForPickup('Front-Girard', trolleyData);

            let bestTrolley = null;
            let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

            for (const trolley of pickupTrolleys) {
                const waitForThisTrolley = trolley.etaToPickup - totalTravelTime;
                if (waitForThisTrolley >= -2) {
                    if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                        bestTrolley = trolley;
                        trolleyWait = Math.max(0, waitForThisTrolley);
                    }
                }
            }

            const totalTime = totalTravelTime + trolleyWait;

            const option = {
                gPickup: 'Front-Girard',
                steps: [
                    {
                        type: 'metro',
                        line: 'D',
                        description: `Take ${station.routeName || 'D'} toward 69th St`,
                        departTime: departTimeFormatted,
                        time: dWait + dTravelTime,
                        fromStation: originStation,
                        toStation: '69th St TC',
                        numStops: stopsTo69th,
                        isScheduled: useScheduledTimes
                    },
                    { type: 'exit', description: 'Exit at 69th Street TC', station: '69th Street TC', exitLine: 'D', time: 0 },
                    { type: 'transfer', description: 'Transfer to L line at 69th Street TC' },
                    { type: 'metro', line: 'L', direction: 'eastbound', description: 'Take L eastbound to Front-Girard', time: lWait + lTravelTime, fromStation: '69th St TC', toStation: 'Front-Girard', numStops: 15 },
                    { type: 'exit', description: 'Exit at Front-Girard', station: 'Front-Girard', exitLine: 'L', time: 0 },
                    { type: 'walk', description: 'Walk to Front-Girard on G line', time: walkTime }
                ],
                travelTime: dWait + dTravelTime + lWait + lTravelTime,
                walkTime: walkTime,
                trolleyWait: trolleyWait,
                totalTime: totalTime,
                minutesToPickup: totalTravelTime,
                metroDepartTime: departTimeFormatted
            };

            if (bestTrolley) {
                option.trolleyVehicle = bestTrolley.vehicle;
                option.trolleyDirection = bestTrolley.direction;
                option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
            }

            options.push(option);
        }
    } else if (station.type === 'metro_T') {
        // T line - check if T1 (connects to Lancaster-Girard)
        if (station.route === 'T1') {
            const stationData = station.stationData;
            const walkTime = stationData?.walkTime || 2;
            const stopId = stationData?.stopId;

            // Get real-time T line vehicle ETAs using GTFS + TransitView
            // Direction: Outbound = toward 63rd-Malvern/Lancaster-Girard (west)
            const tLineVehicles = stopId ? getTLineVehicleETAs(stopId, 'T1', 'Outbound') : [];
            const hasRealTimeData = tLineVehicles.length > 0;

            console.log(`[T1 ROUTING] Stop ${stopId}, found ${tLineVehicles.length} approaching vehicles`);

            if (hasRealTimeData) {
                // Use real-time vehicle data with GTFS-calculated ETAs
                for (let i = 0; i < Math.min(tLineVehicles.length, 5); i++) {
                    const vehicle = tLineVehicles[i];

                    // Vehicle arrives at user's stop in etaMinutes
                    const waitTime = vehicle.etaMinutes;

                    // Calculate travel time from user's stop to Lancaster-Girard using GTFS
                    // Look up Lancaster-Girard in GTFS for T1 outbound
                    const lancasterStopId = '20624';  // Lancaster-Girard stop ID
                    const lancasterKey = `T1_${lancasterStopId}`;
                    const lancasterData = T_LINE_STOP_LOOKUP[lancasterKey];
                    const userKey = `T1_${stopId}`;
                    const userData = T_LINE_STOP_LOOKUP[userKey];

                    let travelTimeToLancaster = stationData?.stopsToLancaster ? stationData.stopsToLancaster * 2 : 10;

                    if (lancasterData?.outbound && userData?.outbound) {
                        // Calculate actual scheduled travel time from GTFS
                        const travelSec = lancasterData.outbound.cumulative_sec - userData.outbound.cumulative_sec;
                        travelTimeToLancaster = Math.round(travelSec / 60);
                    }

                    const travelTime = travelTimeToLancaster;
                    const totalTravelTime = waitTime + travelTime + walkTime;

                    const pickupTrolleys = await getTrolleysForPickup('Lancaster-Girard', trolleyData);

                    let bestTrolley = null;
                    let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

                    for (const trolley of pickupTrolleys) {
                        const waitForThisTrolley = trolley.etaToPickup - totalTravelTime;
                        if (waitForThisTrolley >= -2) {
                            if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                                bestTrolley = trolley;
                                trolleyWait = Math.max(0, waitForThisTrolley);
                            }
                        }
                    }

                    const totalTime = totalTravelTime + trolleyWait;

                    // Format departure time (when trolley arrives at user's stop)
                    const departureTime = new Date(now.getTime() + waitTime * 60000);
                    const lateInfo = vehicle.lateMinutes > 0 ? ` (${vehicle.lateMinutes} min late)` :
                                    vehicle.lateMinutes < 0 ? ` (${Math.abs(vehicle.lateMinutes)} min early)` : '';

                    const option = {
                        gPickup: 'Lancaster-Girard',
                        steps: [
                            {
                                type: 'metro',
                                line: 'T1',
                                description: `Take T1 #${vehicle.vehicle} toward Lancaster-Girard`,
                                departTime: formatTime(departureTime),
                                time: waitTime + travelTime,
                                fromStation: originStation,
                                toStation: 'Lancaster-Girard',
                                numStops: vehicle.stopsAway,
                                isRealTime: true,  // Real-time data from TransitView + GTFS
                                vehicleId: vehicle.vehicle,
                                lateMinutes: vehicle.lateMinutes,
                                lateInfo: lateInfo
                            },
                            { type: 'exit', description: 'Exit at Lancaster-Girard', station: 'Lancaster-Girard', exitLine: 'T', time: 0 },
                            { type: 'walk', description: 'Walk to G stop', time: walkTime }
                        ],
                        travelTime: waitTime + travelTime,
                        walkTime: walkTime,
                        trolleyWait: trolleyWait,
                        totalTime: totalTime,
                        minutesToPickup: totalTravelTime,
                        metroDepartTime: formatTime(departureTime)
                    };

                    if (bestTrolley) {
                        option.trolleyVehicle = bestTrolley.vehicle;
                        option.trolleyDirection = bestTrolley.direction;
                        option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
                    }

                    options.push(option);
                }
            } else {
                // No real-time data - fall back to frequency-based estimates
                const frequency = getMetroFrequency('T');
                const stopsToLancaster = stationData?.stopsToLancaster || 5;
                const travelTime = Math.round(stopsToLancaster * 2);  // ~2 min per stop from GTFS average

                for (let departureNum = 0; departureNum < 3; departureNum++) {
                    const waitTime = departureNum * frequency;
                    const departureTime = new Date(now.getTime() + waitTime * 60000);
                    const departTimeFormatted = '~' + formatTime(departureTime);

                    const totalTravelTime = waitTime + travelTime + walkTime;

                    const pickupTrolleys = await getTrolleysForPickup('Lancaster-Girard', trolleyData);

                    let bestTrolley = null;
                    let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

                    for (const trolley of pickupTrolleys) {
                        const waitForThisTrolley = trolley.etaToPickup - totalTravelTime;
                        if (waitForThisTrolley >= -2) {
                            if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                                bestTrolley = trolley;
                                trolleyWait = Math.max(0, waitForThisTrolley);
                            }
                        }
                    }

                    const totalTime = totalTravelTime + trolleyWait;

                    const option = {
                        gPickup: 'Lancaster-Girard',
                        steps: [
                            {
                                type: 'metro',
                                line: 'T1',
                                description: 'Take T1 toward Lancaster-Girard',
                                departTime: departTimeFormatted,
                                time: waitTime + travelTime,
                                fromStation: originStation,
                                toStation: 'Lancaster-Girard',
                                numStops: stopsToLancaster,
                                isScheduled: false  // No real-time data available
                            },
                            { type: 'exit', description: 'Exit at Lancaster-Girard', station: 'Lancaster-Girard', exitLine: 'T', time: 0 },
                            { type: 'walk', description: 'Walk to G stop', time: walkTime }
                        ],
                        travelTime: waitTime + travelTime,
                        walkTime: walkTime,
                        trolleyWait: trolleyWait,
                        totalTime: totalTime,
                        minutesToPickup: totalTravelTime,
                        metroDepartTime: departTimeFormatted
                    };

                    if (bestTrolley) {
                        option.trolleyVehicle = bestTrolley.vehicle;
                        option.trolleyDirection = bestTrolley.direction;
                        option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
                    }

                    options.push(option);
                }
            }

            // For T1 stations IN THE SHARED TUNNEL, also offer transfer options to L and B lines
            // Shared tunnel stations: 13th, 19th, 22nd, 30th, 33rd (before 36th St Portal)
            const tunnelStations = ['13th & Market (T1)', '19th & Market', '22nd & Market', '30th & Market', '33rd & Market'];
            const stationName = stationData?.name || originStation;

            if (tunnelStations.includes(stationName)) {
                // Travel times from T1 tunnel stations to 15th St (eastbound)
                const stopsTo15th = {
                    '13th & Market (T1)': 1,  // 13th → 15th is 1 stop (goes through loop)
                    '19th & Market': 2,        // 19th → 15th is 2 stops
                    '22nd & Market': 3,
                    '30th & Market': 5,
                    '33rd & Market': 6
                };
                const t1To15th = (stopsTo15th[stationName] || 3) * 2.5;  // ~2.5 min per stop
                const bWait = getMetroFrequency('B');
                const lWait = getMetroFrequency('L');
                const tFrequency = getMetroFrequency('T');
                const bToGirard = 7;  // 15th St to Girard on B
                const lToGirard = 10; // 15th St to Girard on L (eastbound)

                // Option: T1 eastbound → 15th St → B northbound → Broad-Girard
                for (let departureNum = 0; departureNum < 2; departureNum++) {
                    const tWait = departureNum * tFrequency;
                    const departureTime = new Date(now.getTime() + tWait * 60000);
                    const departTimeFormatted = '~' + formatTime(departureTime);
                    const totalTravelTime = tWait + t1To15th + bWait + bToGirard + 3;

                    const pickupTrolleys = await getTrolleysForPickup('Broad-Girard', trolleyData);

                    let bestTrolley = null;
                    let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

                    for (const trolley of pickupTrolleys) {
                        const waitForThisTrolley = trolley.etaToPickup - totalTravelTime;
                        if (waitForThisTrolley >= -2) {
                            if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                                bestTrolley = trolley;
                                trolleyWait = Math.max(0, waitForThisTrolley);
                            }
                        }
                    }

                    const totalTime = totalTravelTime + trolleyWait;

                    const option = {
                        gPickup: 'Broad-Girard',
                        steps: [
                            {
                                type: 'metro',
                                line: 'T',
                                description: 'Take T1 eastbound to 15th Street',
                                departTime: departTimeFormatted,
                                time: tWait + t1To15th,
                                fromStation: stationName,
                                toStation: '15th Street',
                                numStops: stopsTo15th[stationName] || 3,
                                isScheduled: false
                            },
                            { type: 'exit', description: 'Exit at 15th Street', station: '15th Street', exitLine: 'T', time: 0 },
                            { type: 'transfer', description: 'Transfer to B line (Broad Street Line)' },
                            { type: 'metro', line: 'B', direction: 'northbound', description: 'Take B northbound to Broad-Girard (B1 local or B3 express)', time: bWait + bToGirard, fromStation: '15th Street', toStation: 'Broad-Girard', numStops: 4 },
                            { type: 'exit', description: 'Exit at Broad-Girard', station: 'Broad-Girard', exitLine: 'B', time: 0 },
                            { type: 'walk', description: 'Walk to Broad-Girard on G line', time: 3 }
                        ],
                        travelTime: tWait + t1To15th + bWait + bToGirard,
                        walkTime: 3,
                        trolleyWait: trolleyWait,
                        totalTime: totalTime,
                        minutesToPickup: totalTravelTime,
                        metroDepartTime: departTimeFormatted
                    };

                    if (bestTrolley) {
                        option.trolleyVehicle = bestTrolley.vehicle;
                        option.trolleyDirection = bestTrolley.direction;
                        option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
                    }

                    options.push(option);
                }

                // Option: T1 eastbound → 15th St → L eastbound → Front-Girard
                for (let departureNum = 0; departureNum < 2; departureNum++) {
                    const tWait = departureNum * tFrequency;
                    const departureTime = new Date(now.getTime() + tWait * 60000);
                    const departTimeFormatted = '~' + formatTime(departureTime);
                    const totalTravelTime = tWait + t1To15th + lWait + lToGirard + 5;

                    const pickupTrolleys = await getTrolleysForPickup('Front-Girard', trolleyData);

                    let bestTrolley = null;
                    let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

                    for (const trolley of pickupTrolleys) {
                        const waitForThisTrolley = trolley.etaToPickup - totalTravelTime;
                        if (waitForThisTrolley >= -2) {
                            if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                                bestTrolley = trolley;
                                trolleyWait = Math.max(0, waitForThisTrolley);
                            }
                        }
                    }

                    const totalTime = totalTravelTime + trolleyWait;

                    const option = {
                        gPickup: 'Front-Girard',
                        steps: [
                            {
                                type: 'metro',
                                line: 'T',
                                description: 'Take T1 eastbound to 15th Street',
                                departTime: departTimeFormatted,
                                time: tWait + t1To15th,
                                fromStation: stationName,
                                toStation: '15th Street',
                                numStops: stopsTo15th[stationName] || 3,
                                isScheduled: false
                            },
                            { type: 'exit', description: 'Exit at 15th Street', station: '15th Street', exitLine: 'T', time: 0 },
                            { type: 'transfer', description: 'Transfer to L line (Market-Frankford Line)' },
                            { type: 'metro', line: 'L', direction: 'eastbound', description: 'Take L eastbound to Front-Girard', time: lWait + lToGirard, fromStation: '15th Street', toStation: 'Front-Girard', numStops: 6 },
                            { type: 'exit', description: 'Exit at Front-Girard', station: 'Front-Girard', exitLine: 'L', time: 0 },
                            { type: 'walk', description: 'Walk to Front-Girard on G line', time: 5 }
                        ],
                        travelTime: tWait + t1To15th + lWait + lToGirard,
                        walkTime: 5,
                        trolleyWait: trolleyWait,
                        totalTime: totalTime,
                        minutesToPickup: totalTravelTime,
                        metroDepartTime: departTimeFormatted
                    };

                    if (bestTrolley) {
                        option.trolleyVehicle = bestTrolley.vehicle;
                        option.trolleyDirection = bestTrolley.direction;
                        option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
                    }

                    options.push(option);
                }
            }
        } else {
            // Other T lines (T2-T5) - go via subway portal to B line
            const stationData = station.stationData;
            const tToCity = 15; // Time to reach City Hall area
            const bWait = getMetroFrequency('B');
            const bToGirard = 8; // City Hall to Girard on B

            // Try to get actual scheduled departures
            const stopId = stationData?.stopId;
            const routeFilter = station.route; // 'T2', 'T3', 'T4', 'T5'
            let departures = [];

            if (stopId) {
                departures = await fetchMetroSchedule(stopId, routeFilter);
            }

            // Use actual departures if available, otherwise fall back to estimates
            const useScheduledTimes = departures.length > 0;
            const numOptions = useScheduledTimes ? Math.min(departures.length, 5) : 5;
            const frequency = getMetroFrequency('T');

            for (let departureNum = 0; departureNum < numOptions; departureNum++) {
                let departureTime, departTimeFormatted, tWait;

                if (useScheduledTimes) {
                    const dep = departures[departureNum];
                    departureTime = dep.departureTime;
                    departTimeFormatted = dep.time.toUpperCase();
                    tWait = dep.minutesUntil;
                } else {
                    tWait = departureNum * frequency;
                    departureTime = new Date(now.getTime() + tWait * 60000);
                    departTimeFormatted = '~' + formatTime(departureTime);
                }

                const totalTravelTime = tWait + tToCity + bWait + bToGirard + 3;

                const pickupTrolleys = await getTrolleysForPickup('Broad-Girard', trolleyData);

                let bestTrolley = null;
                let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

                for (const trolley of pickupTrolleys) {
                    const waitForThisTrolley = trolley.etaToPickup - totalTravelTime;
                    if (waitForThisTrolley >= -2) {
                        if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                            bestTrolley = trolley;
                            trolleyWait = Math.max(0, waitForThisTrolley);
                        }
                    }
                }

                const totalTime = totalTravelTime + trolleyWait;
                const routeName = station.routeName || station.route;

                const option = {
                    gPickup: 'Broad-Girard',
                    steps: [
                        {
                            type: 'metro',
                            line: station.route,
                            description: `Take ${routeName} toward City Hall`,
                            departTime: departTimeFormatted,
                            time: tWait + tToCity,
                            fromStation: originStation,
                            toStation: '15th St',
                            numStops: 8,
                            isScheduled: useScheduledTimes
                        },
                        { type: 'exit', description: 'Exit at 15th St / City Hall', station: '15th St', exitLine: 'T', time: 0 },
                        { type: 'transfer', description: 'Transfer to B line (Broad Street Line)' },
                        { type: 'metro', line: 'B', direction: 'northbound', description: 'Take B northbound to Broad-Girard (B1 local or B3 express)', time: bWait + bToGirard, fromStation: 'City Hall', toStation: 'Broad-Girard', numStops: 4 },
                        { type: 'exit', description: 'Exit at Broad-Girard', station: 'Broad-Girard', exitLine: 'B', time: 0 },
                        { type: 'walk', description: 'Walk to Broad-Girard', time: 3 }
                    ],
                    travelTime: tWait + tToCity + bWait + bToGirard,
                    walkTime: 3,
                    trolleyWait: trolleyWait,
                    totalTime: totalTime,
                    minutesToPickup: totalTravelTime,
                    metroDepartTime: departTimeFormatted
                };

                if (bestTrolley) {
                    option.trolleyVehicle = bestTrolley.vehicle;
                    option.trolleyDirection = bestTrolley.direction;
                    option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
                }

                options.push(option);
            }

            // Also add L line transfer option for T2-T5: → 15th St → L eastbound → Front-Girard
            const lWait = getMetroFrequency('L');
            const lToGirard = 10; // 15th St to Front-Girard on L

            for (let departureNum = 0; departureNum < 2; departureNum++) {
                let departureTime, departTimeFormatted, tWait;

                if (useScheduledTimes && departureNum < departures.length) {
                    const dep = departures[departureNum];
                    departureTime = dep.departureTime;
                    departTimeFormatted = dep.time.toUpperCase();
                    tWait = dep.minutesUntil;
                } else {
                    tWait = departureNum * frequency;
                    departureTime = new Date(now.getTime() + tWait * 60000);
                    departTimeFormatted = '~' + formatTime(departureTime);
                }

                const totalTravelTime = tWait + tToCity + lWait + lToGirard + 5;

                const pickupTrolleys = await getTrolleysForPickup('Front-Girard', trolleyData);

                let bestTrolley = null;
                let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

                for (const trolley of pickupTrolleys) {
                    const waitForThisTrolley = trolley.etaToPickup - totalTravelTime;
                    if (waitForThisTrolley >= -2) {
                        if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                            bestTrolley = trolley;
                            trolleyWait = Math.max(0, waitForThisTrolley);
                        }
                    }
                }

                const totalTime = totalTravelTime + trolleyWait;
                const routeName = station.routeName || station.route;

                const option = {
                    gPickup: 'Front-Girard',
                    steps: [
                        {
                            type: 'metro',
                            line: station.route,
                            description: `Take ${routeName} toward City Hall`,
                            departTime: departTimeFormatted,
                            time: tWait + tToCity,
                            fromStation: originStation,
                            toStation: '15th St',
                            numStops: 8,
                            isScheduled: useScheduledTimes && departureNum < departures.length
                        },
                        { type: 'exit', description: 'Exit at 15th Street', station: '15th Street', exitLine: 'T', time: 0 },
                        { type: 'transfer', description: 'Transfer to L line (Market-Frankford Line)' },
                        { type: 'metro', line: 'L', direction: 'eastbound', description: 'Take L eastbound to Front-Girard', time: lWait + lToGirard, fromStation: '15th Street', toStation: 'Front-Girard', numStops: 6 },
                        { type: 'exit', description: 'Exit at Front-Girard', station: 'Front-Girard', exitLine: 'L', time: 0 },
                        { type: 'walk', description: 'Walk to Front-Girard on G line', time: 5 }
                    ],
                    travelTime: tWait + tToCity + lWait + lToGirard,
                    walkTime: 5,
                    trolleyWait: trolleyWait,
                    totalTime: totalTime,
                    minutesToPickup: totalTravelTime,
                    metroDepartTime: departTimeFormatted
                };

                if (bestTrolley) {
                    option.trolleyVehicle = bestTrolley.vehicle;
                    option.trolleyDirection = bestTrolley.direction;
                    option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
                }

                options.push(option);
            }
        }
    } else if (station.type === 'regional_rail') {
        // Regional Rail - Create route options with proper exit station info
        const availableTrains = typeof trainData !== 'undefined' ? trainData : [];
        const lineName = station.lineName;

        console.log('RR Station - creating route options for:', originStation, 'on', lineName);
        console.log('Available trains:', availableTrains.length);

        // Special case: User is already at a transfer station (Temple, Jefferson, etc.)
        // They don't need to take a train - just walk to the G pickup
        if (EXIT_STATION_INFO[originStation]) {
            const exitInfo = EXIT_STATION_INFO[originStation];
            const walkToMetro = exitInfo.walkToMetro || 0;  // Walk from RR station to metro station
            const metroTime = exitInfo.transferVia ? exitInfo.metroTime : 0;
            const walkTime = exitInfo.walkTime;
            const totalTravelTime = walkToMetro + metroTime + walkTime;

            const pickupTrolleys = await getTrolleysForPickup(exitInfo.gPickup, trolleyData);

            let bestTrolley = null;
            let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

            for (const trolley of pickupTrolleys) {
                if (trolley.etaToPickup >= totalTravelTime - 2) {
                    if (!bestTrolley || trolley.etaToPickup < bestTrolley.etaToPickup) {
                        bestTrolley = trolley;
                        trolleyWait = Math.max(0, trolley.etaToPickup - totalTravelTime);
                    }
                }
            }

            const steps = [];

            if (exitInfo.transferVia) {
                // If there's a walk to the metro station, add that step first
                if (walkToMetro > 0) {
                    // Determine the B line station name for North Broad/North Philadelphia
                    const bStationName = originStation === 'North Broad' || originStation === 'North Philadelphia'
                        ? 'North Philadelphia (BSL)'
                        : originStation;
                    steps.push({
                        type: 'walk',
                        description: `Walk to ${bStationName}`,
                        time: walkToMetro
                    });
                }
                const girardName = exitInfo.transferVia === 'B' ? 'Broad-Girard' : 'Front-Girard';
                steps.push({
                    type: 'metro',
                    line: exitInfo.transferVia,
                    direction: exitInfo.metroDirection,
                    description: `Take ${exitInfo.transferVia} ${exitInfo.metroDirection} to ${girardName}${exitInfo.transferVia === 'B' ? ' (B1 local or B3 express)' : ''}`,
                    time: metroTime
                });
                steps.push({
                    type: 'exit',
                    description: `Exit at ${girardName}`,
                    station: girardName,
                    exitLine: exitInfo.transferVia,
                    time: 0
                });
            }

            steps.push({
                type: 'walk',
                description: `Walk to ${exitInfo.gPickup} on G line`,
                time: walkTime
            });

            const option = {
                gPickup: exitInfo.gPickup,
                exitStation: originStation,
                steps: steps,
                travelTime: walkToMetro + metroTime,
                walkTime: walkTime,
                trolleyWait: trolleyWait,
                totalTime: totalTravelTime + trolleyWait,
                minutesToPickup: totalTravelTime
            };

            if (bestTrolley) {
                option.trolleyVehicle = bestTrolley.vehicle;
                option.trolleyDirection = bestTrolley.direction;
                option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
            }

            options.push(option);
            // Return early - no need to check train schedules
            return options;
        }

        if (availableTrains.length > 0) {
            // Create options for each upcoming train AND each viable exit station
            for (const train of availableTrains.slice(0, 3)) {
                const departTime = parseTime(train.depart);
                if (!departTime) {
                    console.log('Could not parse train depart time:', train.depart);
                    continue;
                }

                const departTimeFormatted = formatTime(departTime);
                const trainStatus = train.status || '';
                const isDelayed = trainStatus && !trainStatus.toLowerCase().includes('on time') && trainStatus !== '';

                // Get ALL viable exit stations for this train
                const allExits = getAllExitStations(originStation, lineName, train.destination);

                if (allExits.length === 0) {
                    console.log('No exit stations found for:', originStation, lineName, train.destination);
                    continue;
                }

                // Create an option for each exit station (limit to top 3)
                for (const exitResult of allExits.slice(0, 3)) {
                    const { exitStation, info: exitInfo, stopsAway } = exitResult;

                    // Get intermediate station names between origin and exit
                    const lineStations = REGIONAL_RAIL_LINES[lineName]?.stations || [];
                    const originIdx = lineStations.indexOf(originStation);
                    const exitIdx = lineStations.indexOf(exitStation);
                    let intermediateStations = [];
                    if (originIdx !== -1 && exitIdx !== -1) {
                        const start = Math.min(originIdx, exitIdx);
                        const end = Math.max(originIdx, exitIdx);
                        // Get stations between origin and exit (exclusive of both)
                        intermediateStations = lineStations.slice(start + 1, end);
                        // If we're traveling in reverse direction, reverse the list
                        if (originIdx > exitIdx) {
                            intermediateStations = intermediateStations.reverse();
                        }
                    }

                    // Get REAL travel time from NextToArrive API
                    let trainTravelTime = Math.max(3, stopsAway * 3); // fallback estimate
                    let realArrivalTime = null;

                    const travelData = await fetchRRTravelTime(originStation, exitStation);
                    if (travelData && travelData.travelTime) {
                        trainTravelTime = travelData.travelTime;
                        // Find the specific trip that matches our departure time
                        const matchingTrip = travelData.trips.find(t =>
                            t.departTime === train.depart ||
                            t.departTime === departTimeFormatted.replace(' ', '')
                        );
                        if (matchingTrip) {
                            realArrivalTime = parseNextToArriveTime(matchingTrip.arriveTime);
                        }
                    }

                    // Calculate total travel time to G pickup
                    const walkToMetro = exitInfo.walkToMetro || 0;  // Walk from RR to metro station
                    const metroTime = exitInfo.transferVia ? exitInfo.metroTime : 0;
                    const walkTime = exitInfo.walkTime;
                    const totalTravelTime = trainTravelTime + walkToMetro + metroTime + walkTime;

                    // Calculate arrival time at exit station (use real data if available)
                    const arriveAtExit = realArrivalTime || new Date(departTime.getTime() + trainTravelTime * 60000);

                    // Calculate arrival time at G pickup (exit + walkToMetro + metro + walk)
                    const arriveAtPickup = new Date(arriveAtExit.getTime() + (walkToMetro + metroTime + walkTime) * 60000);
                    const minutesToPickup = Math.round((arriveAtPickup - now) / 60000);

                    // Check for trolleys at this pickup
                    const pickupTrolleys = await getTrolleysForPickup(exitInfo.gPickup, trolleyData);

                    let bestTrolley = null;
                    let trolleyWait = CONFIG.ESTIMATED_HEADWAY;

                    for (const trolley of pickupTrolleys) {
                        const waitForThisTrolley = trolley.etaToPickup - minutesToPickup;
                        if (waitForThisTrolley >= -2) {
                            if (!bestTrolley || waitForThisTrolley < trolleyWait) {
                                bestTrolley = trolley;
                                trolleyWait = Math.max(0, waitForThisTrolley);
                            }
                        }
                    }

                    // Total journey time = train travel + metro + walk + trolley wait
                    // (NOT including time waiting for the train to depart)
                    const journeyTime = totalTravelTime + trolleyWait;

                    // Minutes until train departs (for sorting/display)
                    const minutesUntilDepart = Math.round((departTime - now) / 60000);

                    // Build step-by-step directions
                    const steps = [];

                    // Step 1: Board train
                    let boardDesc = 'Board';
                    if (train.trainNumber) {
                        boardDesc += ` Train #${train.trainNumber}`;
                    }
                    if (train.destination) {
                        boardDesc += ` → ${train.destination}`;
                    }
                    steps.push({
                        type: 'rr',
                        description: boardDesc,
                        time: trainTravelTime,
                        trainNumber: train.trainNumber,
                        departTime: departTimeFormatted,
                        departTimeObj: departTime,
                        arriveTime: formatTime(arriveAtExit),
                        arriveTimeObj: arriveAtExit,
                        destination: train.destination,
                        status: trainStatus,
                        isDelayed: isDelayed,
                        isLive: true,
                        fromStation: originStation,
                        toStation: exitStation,
                        numStops: stopsAway,
                        intermediateStations: intermediateStations,
                        hasRealTravelTime: travelData !== null
                    });

                    // Step 2: Exit at transfer station
                    steps.push({
                        type: 'exit',
                        description: `Exit at ${exitStation}`,
                        station: exitStation,
                        time: 0
                    });

                    // Step 3: Transfer to metro (if needed) or walk
                    if (exitInfo.transferVia) {
                        // If walk to metro is needed (e.g., North Broad RR to North Philadelphia BSL)
                        if (walkToMetro > 0) {
                            const metroStationName = exitStation === 'North Broad' || exitStation === 'North Philadelphia'
                                ? 'North Philadelphia (BSL)'
                                : exitStation;
                            steps.push({
                                type: 'walk',
                                description: `Walk to ${metroStationName}`,
                                time: walkToMetro
                            });
                        }
                        const girardStationName = exitInfo.transferVia === 'B' ? 'Broad-Girard' : 'Front-Girard';
                        steps.push({
                            type: 'metro',
                            line: exitInfo.transferVia,
                            direction: exitInfo.metroDirection,
                            description: `Take ${exitInfo.transferVia} ${exitInfo.metroDirection} to ${girardStationName}${exitInfo.transferVia === 'B' ? ' (B1 local or B3 express)' : ''}`,
                            time: metroTime
                        });
                        steps.push({
                            type: 'exit',
                            description: `Exit at ${girardStationName}`,
                            station: girardStationName,
                            exitLine: exitInfo.transferVia,
                            time: 0
                        });
                        steps.push({
                            type: 'walk',
                            description: `Walk to ${exitInfo.gPickup}`,
                            time: walkTime
                        });
                    } else {
                        // Direct walk from exit station
                        steps.push({
                            type: 'walk',
                            description: `Walk to ${exitInfo.gPickup}`,
                            time: walkTime
                        });
                    }

                    const option = {
                        gPickup: exitInfo.gPickup,
                        exitStation: exitStation,
                        steps: steps,
                        travelTime: trainTravelTime + walkToMetro + metroTime,
                        walkTime: walkTime,
                        trolleyWait: trolleyWait,
                        totalTime: journeyTime,  // Journey duration (not including wait for train)
                        minutesUntilDepart: minutesUntilDepart,  // How long until train leaves
                        minutesToPickup: minutesToPickup,  // How long until user arrives at G pickup
                        trainDepart: train.depart,
                        trainNumber: train.trainNumber,
                        trainLine: train.line
                    };

                    if (bestTrolley) {
                        option.trolleyVehicle = bestTrolley.vehicle;
                        option.trolleyDirection = bestTrolley.direction;
                        option.trolleyArrivalTime = new Date(now.getTime() + bestTrolley.etaToPickup * 60000);
                    }

                    options.push(option);
                }
            }
        }

        // Fallback if no trains found - use default transfer point based on line
        if (options.length === 0) {
            console.log('No train data available, using default routing');

            // Find the first transfer station on this line
            const lineConfig = RR_LINE_TRANSFERS[lineName];
            const defaultExit = lineConfig?.transferStations?.[0] || 'Temple University';
            const exitInfo = EXIT_STATION_INFO[defaultExit] || EXIT_STATION_INFO['Temple University'];

            const walkToMetro = exitInfo.walkToMetro || 0;
            const metroTime = exitInfo.transferVia ? exitInfo.metroTime : 0;
            const walkTime = exitInfo.walkTime;
            const totalTravelTime = 15 + walkToMetro + metroTime + walkTime;

            const pickupTrolleys = await getTrolleysForPickup(exitInfo.gPickup, trolleyData);
            const trolleyWait = pickupTrolleys.length > 0
                ? Math.max(0, pickupTrolleys[0].etaToPickup - totalTravelTime)
                : CONFIG.ESTIMATED_HEADWAY;

            const steps = [
                { type: 'rr', description: `Take ${station.lineAbbrev || lineName} toward Center City`, time: 15 },
                { type: 'exit', description: `Exit at ${defaultExit}`, station: defaultExit, time: 0 }
            ];

            if (exitInfo.transferVia) {
                // If walk to metro is needed (e.g., North Broad RR to North Philadelphia BSL)
                if (walkToMetro > 0) {
                    const metroStationName = defaultExit === 'North Broad' || defaultExit === 'North Philadelphia'
                        ? 'North Philadelphia (BSL)'
                        : defaultExit;
                    steps.push({ type: 'walk', description: `Walk to ${metroStationName}`, time: walkToMetro });
                }
                const girardName = exitInfo.transferVia === 'B' ? 'Broad-Girard' : 'Front-Girard';
                steps.push({
                    type: 'metro',
                    line: exitInfo.transferVia,
                    direction: exitInfo.metroDirection,
                    description: `Take ${exitInfo.transferVia} ${exitInfo.metroDirection} to ${girardName}${exitInfo.transferVia === 'B' ? ' (B1 local or B3 express)' : ''}`,
                    time: metroTime
                });
                steps.push({ type: 'exit', description: `Exit at ${girardName}`, station: girardName, exitLine: exitInfo.transferVia, time: 0 });
            }

            steps.push({ type: 'walk', description: `Walk to ${exitInfo.gPickup} on G line`, time: walkTime });

            const option = {
                gPickup: exitInfo.gPickup,
                exitStation: defaultExit,
                steps: steps,
                travelTime: 15 + walkToMetro + metroTime,
                walkTime: walkTime,
                trolleyWait: trolleyWait,
                totalTime: totalTravelTime + trolleyWait,
                minutesToPickup: totalTravelTime
            };

            if (pickupTrolleys.length > 0) {
                option.trolleyVehicle = pickupTrolleys[0].vehicle;
                option.trolleyDirection = pickupTrolleys[0].direction;
                option.trolleyArrivalTime = new Date(now.getTime() + pickupTrolleys[0].etaToPickup * 60000);
            }

            options.push(option);
        }
    }

    // Sort by soonest departure first, then by total time
    options.sort((a, b) => {
        const aDepart = a.minutesUntilDepart || 0;
        const bDepart = b.minutesUntilDepart || 0;
        if (aDepart !== bDepart) return aDepart - bDepart;
        return a.totalTime - b.totalTime;
    });

    return options.slice(0, 5);
}

// State
let trolleyData = [];
let tLineData = [];  // Real-time T line (T1-T5) vehicle positions
let trainData = [];
let refreshTimer = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Show test mode indicator if enabled
    if (TEST_MODE) {
        const banner = document.createElement('div');
        banner.id = 'test-mode-banner';
        banner.innerHTML = 'TEST MODE: Showing all G line vehicles (not just PCC trolleys)';
        banner.style.cssText = 'background: #ff6b6b; color: white; padding: 8px 16px; text-align: center; font-weight: bold; font-size: 14px; position: sticky; top: 0; z-index: 1000;';
        document.body.insertBefore(banner, document.body.firstChild);
        console.log('TEST MODE ENABLED - showing all G line vehicles');
    }

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
                // B, L, M, G lines have station arrays
                stations = line.stations.map(s => s.name);
            } else if (line.routes) {
                // D and T lines have routes with nested stations
                for (const [routeId, routeData] of Object.entries(line.routes)) {
                    // Handle both array format and object format
                    const stationList = routeData.stations || routeData;
                    if (Array.isArray(stationList)) {
                        for (const stop of stationList) {
                            stations.push(stop.name);
                        }
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
        const tLines = [];  // T1-T5 real-time positions

        for (const route of (data.routes || [])) {
            for (const [routeId, vehicles] of Object.entries(route)) {
                // Process G1 (Girard Ave trolley)
                if (routeId === 'G1') {
                    for (const vehicle of vehicles) {
                        const label = String(vehicle.label || '');

                        // In test mode, show ALL G line vehicles; normally only PCC trolleys (23xx)
                        const isPCC = label.startsWith('23') && label.length === 4;
                        if (isPCC || TEST_MODE) {
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
                                nextStopId: vehicle.next_stop_id,
                                isPCC: isPCC,  // true for PCC trolleys (23xx), false for buses
                                late: vehicle.late || 0,  // Real-time offset from schedule (negative = early)
                                tripId: vehicle.trip  // Trip ID to match with schedules
                            });
                        }
                    }
                }

                // Process T1-T5 (Subway-Surface Trolleys) for real-time tracking
                if (['T1', 'T2', 'T3', 'T4', 'T5'].includes(routeId)) {
                    for (const vehicle of vehicles) {
                        const label = String(vehicle.label || '');
                        // Skip invalid entries (label = 'None', '0', empty, or very late = 998/999)
                        if (!label || label === 'None' || label === '0' || label === '' ||
                            vehicle.late >= 998 || vehicle.next_stop_sequence == null) {
                            continue;
                        }

                        const destination = (vehicle.destination || '').toUpperCase();

                        // Determine direction based on destination
                        // Inbound = toward 13th St/City Hall (east)
                        // Outbound = toward terminals (west)
                        // IMPORTANT: Check outbound terminals FIRST because "40th-Market" contains "MARKET"
                        let direction = 'Unknown';
                        if (destination.includes('MALVERN') || destination.includes('BALTIMORE') ||
                            destination.includes('YEADON') || destination.includes('DARBY') ||
                            destination.includes('EASTWICK') || destination.includes('63RD') ||
                            destination.includes('61ST') || destination.includes('40TH-MARKET') ||
                            destination.includes('40TH ST')) {
                            direction = 'Outbound';  // Toward terminals (west)
                        } else if (destination.includes('CITY HALL') || destination.includes('13TH') ||
                                   destination.includes('15TH') || destination.includes('JUNIPER')) {
                            direction = 'Inbound';  // Toward Center City (east)
                        }

                        tLines.push({
                            route: routeId,
                            vehicle: label,
                            destination: vehicle.destination || '',
                            direction,
                            lat: parseFloat(vehicle.lat),
                            lng: parseFloat(vehicle.lng),
                            nextStopId: vehicle.next_stop_id,
                            nextStopSequence: vehicle.next_stop_sequence,
                            nextStopName: vehicle.next_stop_name,
                            late: vehicle.late || 0,
                            tripId: vehicle.trip,
                            timestamp: vehicle.timestamp
                        });
                    }
                }
            }
        }

        // Store T line data globally for use in routing
        tLineData = tLines;
        console.log(`[T-LINE] Fetched ${tLines.length} T line vehicles:`, tLines.map(t => `${t.route} #${t.vehicle} → ${t.destination}`));

        return trolleys;
    } catch (error) {
        console.error('Trolley fetch error:', error);
        return [];
    }
}

/**
 * Get real-time T line vehicle data for a specific route
 * @param {string} routeFilter - Route filter (T1, T2, etc.)
 * @returns {Array} Array of vehicles currently active on the route
 */
function getTLineVehicles(routeFilter = null) {
    if (!tLineData || tLineData.length === 0) {
        return [];
    }

    let vehicles = tLineData;
    if (routeFilter) {
        vehicles = vehicles.filter(v => v.route === routeFilter);
    }

    return vehicles;
}

/**
 * Check if real-time T line data is available for a route
 * @param {string} routeFilter - Route filter (T1, T2, etc.)
 * @returns {boolean} True if real-time data is available
 */
function hasTLineRealTimeData(routeFilter = null) {
    const vehicles = getTLineVehicles(routeFilter);
    return vehicles.length > 0;
}

/**
 * Calculate T line vehicle ETAs using actual GTFS schedule data + real-time positions
 * @param {string} userStopId - The user's stop ID
 * @param {string} route - Route (T1, T2, T3, T4, T5)
 * @param {string} direction - Direction ('Inbound' or 'Outbound')
 * @returns {Array} Array of vehicles with calculated ETAs, sorted by ETA
 */
function getTLineVehicleETAs(userStopId, route, direction) {
    // Check if GTFS data is loaded
    if (typeof T_LINE_GTFS_DATA === 'undefined' || typeof T_LINE_STOP_LOOKUP === 'undefined') {
        console.warn('[T-LINE ETA] GTFS data not loaded');
        return [];
    }

    const vehicles = getTLineVehicles(route);
    if (vehicles.length === 0) {
        console.log(`[T-LINE ETA] No vehicles on ${route}`);
        return [];
    }

    // Map app direction to GTFS direction
    // App: 'Inbound' = toward Center City (east) = GTFS 'inbound'
    // App: 'Outbound' = toward terminals (west) = GTFS 'outbound'
    const gtfsDirection = direction === 'Inbound' ? 'inbound' : 'outbound';

    // Look up user's stop in GTFS
    const userStopKey = `${route}_${userStopId}`;
    const userStopData = T_LINE_STOP_LOOKUP[userStopKey];
    if (!userStopData || !userStopData[gtfsDirection]) {
        console.log(`[T-LINE ETA] User stop ${userStopId} not found in GTFS for ${route} ${gtfsDirection}`);
        return [];
    }

    const userSeq = userStopData[gtfsDirection].seq;
    const userCumulativeSec = userStopData[gtfsDirection].cumulative_sec;

    console.log(`[T-LINE ETA] User at stop ${userStopId} (${userStopData[gtfsDirection].name}), seq=${userSeq}, cumulative=${userCumulativeSec}s`);

    // Calculate ETA for each vehicle heading in the right direction
    const vehiclesWithETA = [];

    for (const vehicle of vehicles) {
        // Only consider vehicles going in the requested direction
        if (vehicle.direction !== direction) {
            continue;
        }

        // Look up vehicle's current position in GTFS
        const vehicleStopKey = `${route}_${vehicle.nextStopId}`;
        const vehicleStopData = T_LINE_STOP_LOOKUP[vehicleStopKey];

        if (!vehicleStopData || !vehicleStopData[gtfsDirection]) {
            console.log(`[T-LINE ETA] Vehicle ${vehicle.vehicle} nextStopId ${vehicle.nextStopId} not found in GTFS`);
            continue;
        }

        const vehicleSeq = vehicleStopData[gtfsDirection].seq;
        const vehicleCumulativeSec = vehicleStopData[gtfsDirection].cumulative_sec;

        // Check if vehicle is approaching (has lower sequence than user)
        // In GTFS, lower sequence = earlier in trip = approaching
        if (vehicleSeq >= userSeq) {
            console.log(`[T-LINE ETA] Vehicle ${vehicle.vehicle} at seq ${vehicleSeq} has passed user at seq ${userSeq}`);
            continue;
        }

        // Calculate scheduled travel time from vehicle to user (in seconds)
        const scheduledTravelSec = userCumulativeSec - vehicleCumulativeSec;
        const scheduledTravelMin = scheduledTravelSec / 60;

        // Adjust by late/early status from TransitView (late is positive, early is negative)
        const adjustedETAMin = Math.round(scheduledTravelMin + (vehicle.late || 0));

        // Calculate stops away
        const stopsAway = userSeq - vehicleSeq;

        vehiclesWithETA.push({
            ...vehicle,
            stopsAway,
            scheduledTravelSec,
            scheduledTravelMin: Math.round(scheduledTravelMin),
            etaMinutes: Math.max(0, adjustedETAMin),
            lateMinutes: vehicle.late || 0,
            currentStopName: vehicleStopData[gtfsDirection].name,
            userStopName: userStopData[gtfsDirection].name,
            isRealTime: true  // This is calculated from real-time data + GTFS
        });
    }

    // Sort by ETA (soonest first)
    vehiclesWithETA.sort((a, b) => a.etaMinutes - b.etaMinutes);

    console.log(`[T-LINE ETA] Found ${vehiclesWithETA.length} approaching vehicles:`,
        vehiclesWithETA.map(v => `#${v.vehicle} ${v.stopsAway} stops, ${v.etaMinutes} min (${v.lateMinutes > 0 ? v.lateMinutes + ' late' : v.lateMinutes < 0 ? Math.abs(v.lateMinutes) + ' early' : 'on time'})`));

    return vehiclesWithETA;
}

/**
 * Get the next T line vehicle approaching a station using GTFS + real-time data
 * @param {string} stopId - The stop ID to check
 * @param {string} routeFilter - Route filter (T1, T2, etc.)
 * @param {string} directionFilter - Direction filter (Outbound, Inbound)
 * @returns {Object|null} Next approaching vehicle with ETA or null
 */
function getNextTLineVehicle(stopId, routeFilter = null, directionFilter = null) {
    if (!routeFilter || !directionFilter) {
        console.log('[T-LINE] getNextTLineVehicle requires route and direction');
        return null;
    }

    const vehiclesWithETA = getTLineVehicleETAs(stopId, routeFilter, directionFilter);

    if (vehiclesWithETA.length > 0) {
        return vehiclesWithETA[0];  // Return soonest arriving vehicle
    }

    return null;
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

    // Regional Rail - fetch from Arrivals API FIRST (before other checks)
    if (stationConfig.type === 'regional_rail') {
        try {
            const station = encodeURIComponent(stationConfig.api_name || selectedStation);
            console.log('Fetching RR arrivals for:', station);
            const response = await fetch(`${CONFIG.API_BASE}?type=arrivals&station=${station}&results=10`);
            if (!response.ok) throw new Error('API error');

            const data = await response.json();
            console.log('Raw API response:', data);
            const trains = [];

            // The Arrivals API returns data keyed by station name with timestamp
            const stationKey = Object.keys(data)[0];
            if (!stationKey) {
                console.log('No station key found in response');
                return [];
            }

            const departuresArray = data[stationKey];
            console.log('Departures array:', departuresArray);

            // The array contains objects with direction keys
            for (const directionObj of departuresArray) {
                for (const direction of ['Northbound', 'Southbound']) {
                    const dirTrains = directionObj[direction] || [];
                    for (const train of dirTrains) {
                        if (train && train.depart_time) {
                            const departTimeStr = train.depart_time;
                            const destination = (train.destination || '').toLowerCase();
                            const goesToCenterCity = destination.includes('center city') ||
                                destination.includes('30th') ||
                                destination.includes('suburban') ||
                                destination.includes('jefferson') ||
                                destination.includes('norristown') ||
                                destination.includes('elm') ||
                                destination.includes('warminster') ||
                                destination.includes('doylestown') ||
                                destination.includes('trenton') ||
                                destination.includes('airport') ||
                                destination.includes('wilmington') ||
                                destination.includes('media') ||
                                destination.includes('wawa') ||
                                destination.includes('fox chase') ||
                                destination.includes('chestnut hill') ||
                                destination.includes('west trenton');

                            trains.push({
                                depart: departTimeStr,
                                departTimeRaw: train.sched_time,
                                trainId: train.train_id || '',
                                trainNumber: train.train_id || '',
                                destination: train.destination || '',
                                line: train.line || '',
                                direction: direction,
                                status: train.status || '',
                                track: train.track || '',
                                goesToCenterCity: goesToCenterCity
                            });
                        }
                    }
                }
            }

            // Sort by departure time
            trains.sort((a, b) => {
                const timeA = parseTime(a.depart);
                const timeB = parseTime(b.depart);
                if (!timeA || !timeB) return 0;
                return timeA - timeB;
            });

            console.log('Fetched trains:', trains.length, trains);
            return trains;
        } catch (error) {
            console.error('Train fetch error:', error);
            return [];
        }
    }

    // For stations where you just walk (e.g., Girard on BSL/MFL, Route G stops)
    if (!stationConfig.transfer_point) {
        return [{
            depart: 'Now',
            walkOnly: true,
            arrivalTime: new Date(Date.now() + (stationConfig.walk_time || 5) * 60000),
            trainId: 'walk',
            line: `${stationConfig.walk_time || 5} min walk`
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

    return [];
}

// Fetch scheduled departure times for metro/trolley lines (D, T)
// Uses SEPTA BusSchedules API which works for trolley routes
async function fetchMetroSchedule(stopId, routeFilter = null) {
    if (!stopId) {
        console.log('fetchMetroSchedule: No stopId provided');
        return [];
    }

    try {
        console.log(`Fetching metro schedule for stop ${stopId}, filter: ${routeFilter}`);
        const response = await fetch(`${CONFIG.API_BASE}?type=schedule&stop_id=${stopId}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const data = await response.json();
        console.log('Metro schedule raw data:', data);

        // Data format: { "D1": [{date, DateCalender, DirectionDesc}, ...], "D2": [...] }
        const departures = [];
        const now = new Date();

        for (const [route, trips] of Object.entries(data)) {
            // Skip the "0" key that sometimes appears (seems to be duplicate data)
            if (route === '0') continue;

            // Filter by route if specified (e.g., 'D1', 'D2', 'T1')
            if (routeFilter && route !== routeFilter) continue;

            if (!Array.isArray(trips)) continue;

            for (const trip of trips) {
                if (!trip.date || !trip.DateCalender) continue;

                // Parse the full datetime "01/04/26 03:45 pm"
                const fullTimeStr = trip.DateCalender;
                const departureTime = parseScheduleTime(fullTimeStr);

                if (!departureTime) continue;

                // Only include future departures (with 2 min buffer for boarding)
                const minutesUntil = (departureTime - now) / 60000;
                if (minutesUntil < -2) continue;

                departures.push({
                    route: route,
                    time: trip.date,              // "3:45p"
                    fullTime: trip.DateCalender,  // "01/04/26 03:45 pm"
                    direction: trip.DirectionDesc,
                    departureTime: departureTime,
                    minutesUntil: Math.max(0, Math.round(minutesUntil))
                });
            }
        }

        // Sort by departure time
        departures.sort((a, b) => a.departureTime - b.departureTime);

        console.log('Parsed departures:', departures.length, departures.slice(0, 5));
        return departures;
    } catch (error) {
        console.error('Metro schedule fetch error:', error);
        return [];
    }
}

// Parse schedule time format "01/04/26 03:45 pm" into Date object
function parseScheduleTime(timeStr) {
    if (!timeStr) return null;

    try {
        // Format: "MM/DD/YY HH:MM am/pm"
        const match = timeStr.match(/(\d{2})\/(\d{2})\/(\d{2})\s+(\d{1,2}):(\d{2})\s*(am|pm)/i);
        if (!match) return null;

        const [, month, day, year, hours, minutes, ampm] = match;
        let hour = parseInt(hours, 10);

        // Convert to 24-hour format
        if (ampm.toLowerCase() === 'pm' && hour !== 12) {
            hour += 12;
        } else if (ampm.toLowerCase() === 'am' && hour === 12) {
            hour = 0;
        }

        // Assume 2000s for two-digit year
        const fullYear = 2000 + parseInt(year, 10);

        return new Date(fullYear, parseInt(month, 10) - 1, parseInt(day, 10), hour, parseInt(minutes, 10));
    } catch (e) {
        console.error('Error parsing schedule time:', timeStr, e);
        return null;
    }
}

// Cache for RR travel times to avoid repeated API calls
const rrTravelTimeCache = new Map();

// Map station names to SEPTA API-compatible names
const RR_STATION_API_NAMES = {
    'Jefferson': 'Jefferson Station',
    'Suburban': 'Suburban Station',
    '30th Street': '30th Street Station',
    'North Broad': 'North Broad Street', // May not work - some lines don't stop here
};

// Fetch real travel time between two Regional Rail stations using NextToArrive API
async function fetchRRTravelTime(origin, dest) {
    // Convert to API-compatible names
    const apiOrigin = RR_STATION_API_NAMES[origin] || origin;
    const apiDest = RR_STATION_API_NAMES[dest] || dest;

    const cacheKey = `${origin}|${dest}`;

    // Check cache first (valid for 10 minutes)
    const cached = rrTravelTimeCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 600000) {
        return cached.data;
    }

    try {
        const url = `${CONFIG.API_BASE}?type=nexttoarrive&origin=${encodeURIComponent(apiOrigin)}&dest=${encodeURIComponent(apiDest)}&count=3`;
        console.log('Fetching RR travel time:', origin, '→', dest, '(API:', apiOrigin, '→', apiDest, ')');

        const response = await fetch(url);
        if (!response.ok) throw new Error('API error');

        const data = await response.json();

        if (data && data.length > 0) {
            // Parse departure and arrival times to calculate travel time
            const trip = data[0];
            const departTime = parseNextToArriveTime(trip.orig_departure_time);
            const arriveTime = parseNextToArriveTime(trip.orig_arrival_time);

            if (departTime && arriveTime) {
                const travelMinutes = Math.round((arriveTime - departTime) / 60000);
                const result = {
                    travelTime: travelMinutes,
                    trips: data.map(t => ({
                        departTime: t.orig_departure_time,
                        arriveTime: t.orig_arrival_time,
                        delay: t.orig_delay,
                        train: t.orig_train,
                        line: t.orig_line,
                        isDirect: t.isdirect === 'true'
                    }))
                };

                // Cache the result
                rrTravelTimeCache.set(cacheKey, { data: result, timestamp: Date.now() });
                console.log('RR travel time:', origin, '→', dest, '=', travelMinutes, 'min');
                return result;
            }
        }

        return null;
    } catch (error) {
        console.error('Error fetching RR travel time:', error);
        return null;
    }
}

// Parse NextToArrive time format "6:03PM" into Date object
function parseNextToArriveTime(timeStr) {
    if (!timeStr) return null;

    const match = timeStr.match(/(\d{1,2}):(\d{2})(AM|PM)/i);
    if (!match) return null;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();

    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const now = new Date();
    const result = new Date(now);
    result.setHours(hours, minutes, 0, 0);

    // Handle midnight crossing
    if (result < now && (now.getHours() > 20 && hours < 6)) {
        result.setDate(result.getDate() + 1);
    }

    return result;
}

// ============================================
// G LINE SCHEDULE DATA - Real-time arrival predictions
// ============================================

// Cache for G line scheduled times at pickup stops
const gLineScheduleCache = new Map();

// Stop IDs for G line pickup points (eastbound and westbound platforms)
const G_LINE_PICKUP_STOPS = {
    'Broad-Girard': { eastbound: '352', westbound: '343' },
    'Front-Girard': { eastbound: '342', westbound: '20978' },
    'Lancaster-Girard': { eastbound: '21058', westbound: '21030' }
};

// Fetch scheduled arrival times at a G line pickup point
async function fetchGLineSchedule(pickupName) {
    console.log(`[SCHEDULE] Fetching schedule for pickup: ${pickupName}`);
    const stopInfo = G_LINE_PICKUP_STOPS[pickupName];
    if (!stopInfo) {
        console.log(`[SCHEDULE] No stop info found for ${pickupName}`);
        return null;
    }
    console.log(`[SCHEDULE] Stop IDs - East: ${stopInfo.eastbound}, West: ${stopInfo.westbound}`);

    const cacheKey = pickupName;
    const cached = gLineScheduleCache.get(cacheKey);

    // Cache valid for 2 minutes
    if (cached && (Date.now() - cached.timestamp) < 120000) {
        console.log(`[SCHEDULE] Using cached data for ${pickupName}`);
        return cached.data;
    }

    try {
        // Fetch schedules for both directions
        const [eastboundRes, westboundRes] = await Promise.all([
            fetch(`${CONFIG.API_BASE}?type=schedule&stop_id=${stopInfo.eastbound}`),
            fetch(`${CONFIG.API_BASE}?type=schedule&stop_id=${stopInfo.westbound}`)
        ]);

        const eastboundData = eastboundRes.ok ? await eastboundRes.json() : {};
        const westboundData = westboundRes.ok ? await westboundRes.json() : {};

        console.log(`[SCHEDULE] Raw eastbound data:`, eastboundData);
        console.log(`[SCHEDULE] Raw westbound data:`, westboundData);

        const schedules = {
            eastbound: (eastboundData.G1 || []).map(s => ({
                time: parseScheduleTime(s.date),
                tripId: s.trip_id,
                direction: 'Eastbound',
                destination: s.DirectionDesc
            })).filter(s => s.time),
            westbound: (westboundData.G1 || []).map(s => ({
                time: parseScheduleTime(s.date),
                tripId: s.trip_id,
                direction: 'Westbound',
                destination: s.DirectionDesc
            })).filter(s => s.time)
        };

        console.log(`[SCHEDULE] Parsed schedules for ${pickupName}:`, {
            eastboundCount: schedules.eastbound.length,
            westboundCount: schedules.westbound.length,
            nextEastbound: schedules.eastbound[0]?.time,
            nextWestbound: schedules.westbound[0]?.time
        });

        gLineScheduleCache.set(cacheKey, { data: schedules, timestamp: Date.now() });
        return schedules;
    } catch (error) {
        console.error('[SCHEDULE] Error fetching G line schedule:', error);
        return null;
    }
}

// Parse BusSchedules time format "7:19p" into Date object
function parseScheduleTime(timeStr) {
    if (!timeStr) return null;

    const match = timeStr.match(/(\d{1,2}):(\d{2})([ap])/i);
    if (!match) return null;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toLowerCase();

    if (ampm === 'p' && hours !== 12) hours += 12;
    if (ampm === 'a' && hours === 12) hours = 0;

    const now = new Date();
    const result = new Date(now);
    result.setHours(hours, minutes, 0, 0);

    // Handle times that have already passed (schedule for next occurrence)
    if (result < now) {
        result.setDate(result.getDate() + 1);
    }

    return result;
}

// Calculate real ETA for a trolley to reach a pickup point
// Uses scheduled arrival time adjusted by the trolley's current lateness
function calculateRealTrolleyETA(trolley, pickupSchedules, now) {
    console.log(`[ETA] Calculating ETA for trolley ${trolley.vehicle}, direction: ${trolley.direction}, late: ${trolley.late}`);

    if (!pickupSchedules || !trolley.direction) {
        console.log(`[ETA] No schedules or direction, returning null`);
        return null;
    }

    const directionSchedules = trolley.direction === 'Eastbound'
        ? pickupSchedules.eastbound
        : pickupSchedules.westbound;

    if (!directionSchedules || directionSchedules.length === 0) {
        console.log(`[ETA] No schedules for direction ${trolley.direction}`);
        return null;
    }

    // The trolley's "late" value tells us how it compares to schedule
    // Negative = early, positive = late
    const lateOffset = (trolley.late || 0) * 60000; // Convert to milliseconds

    // Find the next scheduled arrival in this direction
    const upcomingSchedules = directionSchedules
        .filter(s => s.time > now)
        .sort((a, b) => a.time - b.time);

    console.log(`[ETA] Found ${upcomingSchedules.length} upcoming ${trolley.direction} schedules`);

    if (upcomingSchedules.length === 0) {
        console.log(`[ETA] No upcoming schedules, returning null`);
        return null;
    }

    // The trolley is likely running the first upcoming scheduled trip
    // Adjust the scheduled time by how late/early the trolley is
    const scheduledArrival = upcomingSchedules[0].time;
    const adjustedArrival = new Date(scheduledArrival.getTime() + lateOffset);

    const result = {
        scheduledTime: scheduledArrival,
        adjustedTime: adjustedArrival,
        lateMinutes: trolley.late || 0,
        etaMinutes: Math.max(0, Math.round((adjustedArrival - now) / 60000))
    };

    console.log(`[ETA] Result for trolley ${trolley.vehicle}:`, {
        scheduled: scheduledArrival.toLocaleTimeString(),
        adjusted: adjustedArrival.toLocaleTimeString(),
        late: result.lateMinutes,
        etaMin: result.etaMinutes
    });

    return result;
}

function parseTime(timeStr) {
    if (!timeStr) return null;

    try {
        const cleaned = timeStr.trim();

        // Try ISO datetime format first (e.g., "2026-01-04 14:22:00.000" from SEPTA Arrivals API)
        const matchISO = cleaned.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (matchISO) {
            const year = parseInt(matchISO[1]);
            const month = parseInt(matchISO[2]) - 1; // JS months are 0-indexed
            const day = parseInt(matchISO[3]);
            const hours = parseInt(matchISO[4]);
            const minutes = parseInt(matchISO[5]);
            const seconds = parseInt(matchISO[6]);

            return new Date(year, month, day, hours, minutes, seconds);
        }

        // Try 12-hour format (e.g., "1:22 PM")
        const match12 = cleaned.toUpperCase().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
        if (match12) {
            let hours = parseInt(match12[1]);
            const minutes = parseInt(match12[2]);
            const period = match12[3];

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

        // Try 24-hour format (e.g., "13:22")
        const match24 = cleaned.match(/(\d{1,2}):(\d{2})/);
        if (match24) {
            const hours = parseInt(match24[1]);
            const minutes = parseInt(match24[2]);

            const now = new Date();
            const result = new Date(now);
            result.setHours(hours, minutes, 0, 0);

            // If the time is more than 1 minute in the past, assume it's tomorrow
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

async function updateConnections() {
    const section = document.getElementById('connections-section');
    const container = document.getElementById('connections-list');
    const title = document.getElementById('connections-title');

    // Hide if no trolleys
    if (trolleyData.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    // Debug logging
    console.log('=== updateConnections ===');
    console.log('Selected station:', selectedStation);
    console.log('Trolley data:', trolleyData);
    console.log('Train data:', trainData);

    // Get route options using smart routing (async for metro schedule fetching)
    const routeOptions = await calculateRouteOptions(selectedStation, trolleyData);
    console.log('Route options:', routeOptions);

    if (routeOptions.length === 0) {
        container.innerHTML = `
            <div class="error-message">
                No routes found from ${selectedStation} to Route G.
            </div>
        `;
        return;
    }

    // Update title
    title.textContent = 'Route Options';

    // Get station config for RR train times
    const stationConfig = STATIONS[selectedStation];
    const isRRStation = stationConfig?.type === 'regional_rail';

    // Pre-fetch trolley data for all unique pickup points (for real-time schedule data)
    const uniquePickups = [...new Set(routeOptions.map(o => o.gPickup).filter(Boolean))];
    const pickupTrolleyData = {};
    await Promise.all(uniquePickups.map(async pickup => {
        pickupTrolleyData[pickup] = await getTrolleysForPickup(pickup, trolleyData);
    }));

    // Render route options (sorted by soonest departure)
    container.innerHTML = routeOptions.map((option, index) => {
        const optionNum = index + 1;

        // Get line colors for step badges
        const lineColors = {
            'B': '#F37021',
            'L': '#0070C0',
            'M': '#84329B',
            'D': '#dc2e6b',
            'T': '#00A650',
            'T1': '#00A650',
            'T2': '#00A650',
            'T3': '#00A650',
            'T4': '#00A650',
            'T5': '#00A650',
            'G': '#FFD200',
            'RR': '#4A4A4D'
        };

        // Get the RR line abbreviation if applicable
        const rrAbbrev = stationConfig?.lineAbbrev || 'RR';

        // Get next train for RR steps (use trainData if available)
        let nextTrain = null;
        if (isRRStation && trainData.length > 0) {
            // Find the next train that matches this option's timing
            nextTrain = trainData[Math.min(index, trainData.length - 1)];
        }

        // Render steps with running time calculation
        // Start with first step's departure time
        let runningTime = null;
        if (option.steps.length > 0 && option.steps[0].departTime) {
            // Parse the departure time string (e.g., "5:03 PM")
            const firstStep = option.steps[0];
            if (firstStep.departTimeObj) {
                runningTime = new Date(firstStep.departTimeObj);
            } else {
                // Try to parse from string (handle "~" prefix for estimated times)
                const now = new Date();
                const timeStr = firstStep.departTime.replace(/^~\s*/, ''); // Remove leading tilde
                const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                if (timeMatch) {
                    let hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    const ampm = timeMatch[3].toUpperCase();
                    if (ampm === 'PM' && hours !== 12) hours += 12;
                    if (ampm === 'AM' && hours === 12) hours = 0;
                    runningTime = new Date(now);
                    runningTime.setHours(hours, minutes, 0, 0);
                }
            }
        }

        const stepsHtml = option.steps.map((step, stepIdx) => {
            const stepNum = stepIdx + 1;
            let lineColor = '#666';
            let lineLetter = '';
            let stepDescription = step.description;

            if (step.type === 'metro') {
                lineLetter = step.line;
                lineColor = lineColors[step.line] || '#666';
            } else if (step.type === 'rr') {
                lineLetter = rrAbbrev;
                lineColor = lineColors['RR'];
            } else if (step.type === 'exit' && step.exitLine) {
                // Exit steps can optionally show a line badge
                lineLetter = step.exitLine;
                lineColor = lineColors[step.exitLine] || '#666';
            } else if (step.type === 'walk') {
                lineLetter = '';
            } else if (step.type === 'transfer') {
                lineLetter = '';
            }

            // Calculate time for this step
            let timeBoxContent = '';
            if (runningTime) {
                timeBoxContent = formatTime(runningTime);
                // Add step duration to running time for next step
                if (step.time) {
                    runningTime = new Date(runningTime.getTime() + step.time * 60000);
                } else if (step.type === 'transfer') {
                    // Add 2 minutes for transfer time
                    runningTime = new Date(runningTime.getTime() + 2 * 60000);
                } else if (step.type === 'exit') {
                    // Add 1 minute to exit platform
                    runningTime = new Date(runningTime.getTime() + 1 * 60000);
                }
            } else if (step.departTime) {
                timeBoxContent = step.departTime;
            }

            // Add live indicator and delay info for steps with real-time or schedule data
            let liveIndicator = '';
            let delayInfo = '';
            if (step.type === 'rr' && step.isLive) {
                // Regional Rail with live GPS tracking
                liveIndicator = ' <span class="live-indicator" title="Live real-time data">●</span>';
                if (step.isDelayed && step.status) {
                    delayInfo = ` <span class="delay-info">${step.status}</span>`;
                }
            } else if (step.type === 'metro' && step.isScheduled) {
                // Metro with actual schedule data from API (T lines, D lines)
                liveIndicator = ' <span class="schedule-indicator" title="SEPTA schedule data">●</span>';
            } else if (step.type === 'metro' && step.isRealTime) {
                // Metro with real-time GPS data (future: T line TransitView)
                liveIndicator = ' <span class="live-indicator" title="Live real-time data">●</span>';
            }

            // Generate stops indicator if we have from/to info
            let stopsIndicatorHtml = '';
            if (step.fromStation && step.toStation && step.numStops > 0) {
                stopsIndicatorHtml = generateStopsIndicator(
                    step.fromStation,
                    step.toStation,
                    step.numStops,
                    step.intermediateStations || []
                );
            }

            // Build line badge HTML
            const lineBadgeHtml = lineLetter
                ? `<span class="line-badge" style="background-color: ${lineColor}">${lineLetter}</span> `
                : '';

            // Determine step class
            let stepClass = 'route-step';
            if (step.type === 'transfer') stepClass += ' transfer-step';
            if (step.type === 'exit') stepClass += ' exit-step';
            if (step.isDelayed) stepClass += ' delayed';

            return `
                <div class="${stepClass}">
                    <span class="step-time-box${timeBoxContent ? '' : ' empty'}">${timeBoxContent}</span>
                    <span class="step-number">Step ${stepNum}</span>
                    <span class="step-content">${lineBadgeHtml}${stepDescription}${liveIndicator}${delayInfo}</span>
                </div>
                ${stopsIndicatorHtml}
            `;
        }).join('');

        // Build trolley info display
        let trolleyInfoHtml = '';
        const now = new Date();

        // Determine direction for destination text
        const trolleyDir = option.trolleyDirection || '';
        const directionText = trolleyDir ? trolleyDir.toUpperCase() + ' ' : '';

        if (option.trolleyVehicle && option.trolleyDirection) {
            // This option has a specific trolley (e.g., from G line selection)
            const dirClass = option.trolleyDirection === 'Eastbound' ? 'east' : 'west';
            const arrivalTimeStr = option.trolleyArrivalTime ? formatTime(option.trolleyArrivalTime) : '';
            trolleyInfoHtml = `
                <div class="trolley-arrival-row">
                    <div class="trolley-dir-badge ${dirClass}">${option.trolleyDirection}</div>
                    <div class="trolley-details">
                        <span class="trolley-id">Trolley #${option.trolleyVehicle}</span>
                        <span class="trolley-eta">arrives in ${option.trolleyWait} min</span>
                        ${arrivalTimeStr ? `<span class="trolley-time">(${arrivalTimeStr})</span>` : ''}
                    </div>
                </div>
            `;
        } else {
            // Show trolleys heading to this pickup that the user can actually catch
            // Use pre-fetched data (with real schedule times)
            const pickupTrolleys = pickupTrolleyData[option.gPickup] || [];
            const userArrival = option.minutesToPickup || 0;

            // Filter to only trolleys the user can catch (arrive within 2 min before user or later)
            const catchableTrolleys = pickupTrolleys.filter(t => t.etaToPickup >= userArrival - 2);

            if (catchableTrolleys.length > 0) {
                trolleyInfoHtml = catchableTrolleys.slice(0, 3).map(t => {
                    const dirClass = t.direction === 'Eastbound' ? 'east' : 'west';
                    const waitTime = Math.max(0, t.etaToPickup - userArrival);
                    const arrivalTime = new Date(now.getTime() + t.etaToPickup * 60000);

                    // Check if this trolley needs to loop around
                    if (t.needsLoop) {
                        const dirText = t.direction === 'Eastbound' ? 'East →' : '← West';
                        return `
                            <div class="trolley-arrival-row wrong-direction">
                                <strong>Trolley #${t.vehicle}</strong> heading ${dirText} — needs to loop back
                                <div class="loop-eta">${t.stopsToPickup} stops away (~${waitTime} min wait after you arrive)</div>
                            </div>
                        `;
                    }

                    // Show real scheduled time if available, otherwise show estimate
                    let timeDisplay = '';
                    let sourceIndicator = '';

                    if (t.isRealTime && t.scheduledTime) {
                        // Real schedule data available
                        const scheduledStr = formatTime(t.scheduledTime);
                        const lateInfo = t.lateMinutes > 0 ? `${t.lateMinutes} min late` :
                                        t.lateMinutes < 0 ? `${Math.abs(t.lateMinutes)} min early` : 'on time';
                        timeDisplay = `arrives ${formatTime(arrivalTime)}`;
                        sourceIndicator = `<span class="schedule-source real">Sched: ${scheduledStr} (${lateInfo})</span>`;
                    } else {
                        // Estimated time
                        timeDisplay = `~${t.etaToPickup} min to stop`;
                        sourceIndicator = `<span class="schedule-source estimate">estimated</span>`;
                    }

                    const waitText = waitTime === 0 ? 'waiting for you' : `${waitTime} min wait`;

                    return `
                        <div class="trolley-arrival-row">
                            <div class="trolley-dir-badge ${dirClass}">${t.direction}</div>
                            <div class="trolley-details">
                                <span class="trolley-id">Trolley #${t.vehicle}</span>
                                <span class="trolley-eta">${waitText}</span>
                                <span class="trolley-time">${timeDisplay}</span>
                                ${sourceIndicator}
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                // No catchable trolleys
                if (trolleyData.length === 0) {
                    trolleyInfoHtml = `<div class="trolley-arrival-row no-trolleys">No PCC trolleys currently detected</div>`;
                } else if (pickupTrolleys.length > 0) {
                    // Trolleys exist but user would miss them all
                    trolleyInfoHtml = `<div class="trolley-arrival-row no-trolleys">No trolleys catchable (next one arrives before you)</div>`;
                } else {
                    // No trolleys heading to this pickup - explain why
                    // Check if trolleys are running but going the wrong direction
                    const wrongDirTrolleys = trolleyData.filter(t => {
                        if (t.direction === 'Unknown') return false;
                        const pickupIndex = G_TRANSFER_POINTS[option.gPickup]?.stopIndex ?? -1;
                        if (pickupIndex < 0) return false;
                        const trolleyIndex = getStopIndexFromId(t.nextStopId);
                        if (trolleyIndex < 0) return false;
                        // Check if this trolley is going away from the pickup
                        if (t.direction === 'Eastbound') {
                            return trolleyIndex > pickupIndex; // Already passed, heading east
                        } else {
                            return trolleyIndex < pickupIndex; // Already passed, heading west
                        }
                    });

                    if (wrongDirTrolleys.length > 0) {
                        const t = wrongDirTrolleys[0];
                        const dirText = t.direction === 'Eastbound' ? 'East →' : '← West';

                        // Calculate loop-around ETA
                        const pickupIndex = G_TRANSFER_POINTS[option.gPickup]?.stopIndex ?? 33;
                        const trolleyIndex = getStopIndexFromId(t.nextStopId);
                        const WEST_TERMINUS = 0;  // 63rd-Girard
                        const EAST_TERMINUS = G_LINE_STOPS_SIMPLE.length - 1;  // Richmond-Westmoreland
                        const TURNAROUND_TIME = 5;  // minutes at terminus

                        let loopETA = null;
                        let stopsAway = null;
                        if (trolleyIndex >= 0) {
                            if (t.direction === 'Westbound') {
                                // Heading west, needs to loop at west terminus and come back east
                                const stopsToWestTerminus = trolleyIndex - WEST_TERMINUS;
                                const stopsFromWestToPickup = pickupIndex - WEST_TERMINUS;
                                stopsAway = stopsToWestTerminus + stopsFromWestToPickup;
                            } else {
                                // Heading east, needs to loop at east terminus and come back west
                                const stopsToEastTerminus = EAST_TERMINUS - trolleyIndex;
                                const stopsFromEastToPickup = EAST_TERMINUS - pickupIndex;
                                stopsAway = stopsToEastTerminus + stopsFromEastToPickup;
                            }
                            // Calculate ETA: stops × time per stop + turnaround + current delay
                            const lateOffset = t.late || 0;  // Real-time delay from API
                            loopETA = Math.round(stopsAway * CONFIG.MINUTES_PER_STOP + TURNAROUND_TIME + lateOffset);
                        }

                        const loopInfo = loopETA !== null
                            ? `<div class="loop-eta">${stopsAway} stops away (~${loopETA} min, includes turnaround)</div>`
                            : '';
                        trolleyInfoHtml = `<div class="trolley-arrival-row wrong-direction">
                            <strong>Trolley #${t.vehicle}</strong> heading ${dirText} — needs to loop back${loopInfo}
                        </div>`;
                    } else {
                        trolleyInfoHtml = `<div class="trolley-arrival-row no-trolleys">No trolleys heading to this stop</div>`;
                    }
                }
            }
        }

        // Show departure timing if available
        const departInfo = option.minutesUntilDepart !== undefined && option.minutesUntilDepart >= 0
            ? `<span class="depart-info">Departs in ${option.minutesUntilDepart} min</span>`
            : '';

        return `
            <div class="route-option">
                <div class="option-header">
                    <span class="option-number">Option #${optionNum}</span>
                    ${departInfo}
                </div>
                <div class="route-steps">
                    ${stepsHtml}
                </div>
                <div class="destination-info">
                    <div class="destination-pickup">
                        <span class="destination-label">Destination:</span>
                        <span class="pickup-name">Catch ${directionText}G at ${option.gPickup}</span>
                    </div>
                    <div class="trolley-arrivals">${trolleyInfoHtml}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Helper: Get trolleys arriving at a specific pickup point
// Now uses real-time schedule data + late offset for accurate ETAs
async function getTrolleysForPickup(pickupName, trolleys) {
    console.log('=== getTrolleysForPickup ===');
    console.log('Looking for pickup:', pickupName);
    console.log('Trolleys to check:', trolleys);

    // First check if it's a known transfer point
    let pickupIndex = -1;
    const pickupInfo = G_TRANSFER_POINTS[pickupName];

    if (pickupInfo) {
        pickupIndex = pickupInfo.stopIndex;
        console.log('Found in G_TRANSFER_POINTS, index:', pickupIndex);
    } else {
        // Look up in G_LINE_STOPS_SIMPLE by name
        for (let i = 0; i < G_LINE_STOPS_SIMPLE.length; i++) {
            if (G_LINE_STOPS_SIMPLE[i].name === pickupName) {
                pickupIndex = i;
                break;
            }
        }
        console.log('Looked up in G_LINE_STOPS_SIMPLE, index:', pickupIndex);
    }

    if (pickupIndex < 0) {
        console.log('Pickup index not found, returning empty');
        return [];
    }

    // Fetch real schedule data for this pickup point
    const schedules = await fetchGLineSchedule(pickupName);
    const now = new Date();

    const results = [];

    for (const trolley of trolleys) {
        console.log('Checking trolley:', trolley.vehicle, 'direction:', trolley.direction, 'nextStopId:', trolley.nextStopId, 'late:', trolley.late);

        if (trolley.direction === 'Unknown') {
            console.log('  Skipping - unknown direction');
            continue;
        }

        const currentIndex = getStopIndexFromId(trolley.nextStopId);
        console.log('  Current index from stopId:', currentIndex);

        if (currentIndex < 0) {
            console.log('  Skipping - could not find stop index');
            continue;
        }

        // Calculate stops to pickup
        let stopsToPickup;
        if (trolley.direction === 'Eastbound') {
            stopsToPickup = pickupIndex - currentIndex;
        } else {
            stopsToPickup = currentIndex - pickupIndex;
        }
        console.log('  Stops to pickup:', stopsToPickup, '(pickup index:', pickupIndex, ', current index:', currentIndex, ')');

        // Only include trolleys approaching the pickup or at the pickup (not past it)
        if (stopsToPickup >= 0) {
            // Try to get real ETA from schedule + late offset
            const realETA = calculateRealTrolleyETA(trolley, schedules, now);

            let etaToPickup;
            let scheduledTime = null;
            let isRealTime = false;

            if (realETA) {
                // Use real schedule-based ETA
                etaToPickup = realETA.etaMinutes;
                scheduledTime = realETA.scheduledTime;
                isRealTime = true;
                console.log('  ADDING with REAL ETA:', etaToPickup, 'min (scheduled:', formatTime(scheduledTime), ', late:', trolley.late, 'min)');
            } else {
                // Fallback: use late-adjusted estimate if we have the late field
                // This is still better than raw stopsAway * 1.5
                const baseEstimate = stopsToPickup * CONFIG.MINUTES_PER_STOP;
                etaToPickup = Math.round(baseEstimate + (trolley.late || 0));
                console.log('  ADDING with adjusted estimate:', etaToPickup, 'min (base:', baseEstimate, ', late:', trolley.late, ')');
            }

            results.push({
                ...trolley,
                stopsToPickup,
                etaToPickup,
                scheduledTime,
                isRealTime,
                needsLoop: false,
                lateMinutes: trolley.late || 0
            });
        } else {
            // Trolley is heading away - calculate loop-around ETA
            const WEST_TERMINUS = 0;  // 63rd-Girard
            const EAST_TERMINUS = G_LINE_STOPS_SIMPLE.length - 1;  // Richmond-Westmoreland
            const TURNAROUND_TIME = 5;  // minutes at terminus

            let loopStops = 0;
            if (trolley.direction === 'Westbound') {
                // Heading west, will loop at west terminus and come back east
                const stopsToWestTerminus = currentIndex - WEST_TERMINUS;
                const stopsFromWestToPickup = pickupIndex - WEST_TERMINUS;
                loopStops = stopsToWestTerminus + stopsFromWestToPickup;
            } else {
                // Heading east, will loop at east terminus and come back west
                const stopsToEastTerminus = EAST_TERMINUS - currentIndex;
                const stopsFromEastToPickup = EAST_TERMINUS - pickupIndex;
                loopStops = stopsToEastTerminus + stopsFromEastToPickup;
            }

            const lateOffset = trolley.late || 0;
            const loopETA = Math.round(loopStops * CONFIG.MINUTES_PER_STOP + TURNAROUND_TIME + lateOffset);
            console.log('  ADDING with LOOP ETA:', loopETA, 'min (', loopStops, 'stops + turnaround + late:', lateOffset, ')');

            results.push({
                ...trolley,
                stopsToPickup: loopStops,  // Total stops including loop
                etaToPickup: loopETA,
                scheduledTime: null,
                isRealTime: false,
                needsLoop: true,
                lateMinutes: lateOffset
            });
        }
    }

    console.log('Results:', results);
    // Sort by ETA
    results.sort((a, b) => a.etaToPickup - b.etaToPickup);
    return results;
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
        const dirArrow = trolley.direction === 'Eastbound' ? '&#x2192;' : '&#x2190;'; // → or ←

        // Get approaching stop info and timeline
        // Note: nextStopId is the stop the trolley is approaching, not where it currently is
        const stopIndex = getStopIndexFromId(trolley.nextStopId);
        const approachingStopInfo = G_STOPS_BY_ID[String(trolley.nextStopId)];
        const approachingStopName = approachingStopInfo ? approachingStopInfo.name : trolley.location;

        // Build timeline if we have valid stop data
        let timelineHtml = '';
        if (stopIndex >= 0 && trolley.direction !== 'Unknown') {
            let timeline = getTimelineStops(stopIndex, trolley.direction);

            // For westbound, reverse the display order so "next" stops are on the LEFT
            // (since westbound = heading left/west)
            if (trolley.direction === 'Westbound') {
                timeline = timeline.slice().reverse();
            }

            timelineHtml = `
                <div class="trolley-timeline">
                    ${timeline.map((stop, i) => {
                        if (!stop) return `<span class="timeline-stop empty"></span>`;
                        const isCurrent = stop.position === 'current';
                        const isNextImmediate = stop.position === 'next' && stop.offset === 1;
                        const isTransfer = stop.isTransfer;
                        return `
                            <span class="timeline-stop ${stop.position}${isNextImmediate ? ' next-immediate' : ''}${isTransfer ? ' transfer' : ''}">
                                ${isCurrent ? '<span class="trolley-icon">&#x1F68B;</span>' : ''}
                                <span class="stop-name">${stop.shortName}</span>
                                ${isCurrent ? `<span class="direction-arrow ${dirClass}">${dirArrow}</span>` : ''}
                            </span>
                            ${i < 4 ? '<span class="timeline-connector"></span>' : ''}
                        `;
                    }).join('')}
                </div>
            `;
        }

        return `
            <div class="trolley-item ${dirClass}">
                <div class="trolley-box-layout">
                    <div class="direction-header ${dirClass}">
                        ${trolley.direction === 'Westbound' ? 'Westbound' : 'Eastbound'}
                    </div>
                    <div class="trolley-content">
                        <div class="trolley-header">
                            <span class="live-dot"></span>
                            <span class="trolley-number">${trolley.isPCC ? 'PCC Trolley' : 'BUS'} #${trolley.vehicle}</span>
                        </div>
                        <div class="trolley-stop-info">
                            <div class="current-stop">
                                <span class="stop-label">Approaching:</span>
                                <span class="stop-value">${approachingStopName}</span>
                            </div>
                        </div>
                        ${timelineHtml}
                    </div>
                </div>
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
