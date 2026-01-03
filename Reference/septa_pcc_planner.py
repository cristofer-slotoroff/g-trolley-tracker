#!/usr/bin/env python3
"""
SEPTA Smart Transfer Planner
Combines train schedule + real-time PCC trolley tracking
Find when to catch actual Route G trolleys (not buses) from East Falls
"""

import requests
import json
import time
from datetime import datetime, timedelta
import sys

# API Endpoints
TRANSITVIEW_ALL_URL = "https://www3.septa.org/api/TransitViewAll/index.php"
NEXTTOARRIVE_URL = "https://www3.septa.org/hackathon/NextToArrive"

# Transfer timing
TRANSFER_TIME = {
    "rail_travel": 12,      # East Falls to North Broad
    "walk_to_trolley": 8,   # Walk to Broad & Girard
    "buffer": 3             # Safety buffer
}
TOTAL_TRANSFER = sum(TRANSFER_TIME.values())  # 23 minutes

# Broad & Girard stop info
# Stop 352 (south side) = Inbound/Eastbound, sequence 33
# Stop 343 (north side) = Outbound/Westbound, sequence 13
BROAD_GIRARD = {
    'Eastbound': {'stop_id': '352', 'sequence': 33},
    'Westbound': {'stop_id': '343', 'sequence': 13}
}

# Estimated minutes per stop (trolleys average about 1.5 min/stop with traffic)
MINUTES_PER_STOP = 1.5


class SmartTransferPlanner:
    def __init__(self):
        self.pcc_trolleys = []
        self.train_schedule = []
        
    def get_pcc_trolleys_only(self):
        """Get ONLY actual PCC trolleys (23xx vehicles), not buses"""
        try:
            response = requests.get(TRANSITVIEW_ALL_URL, timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                trolleys = []
                
                # Structure: {"routes": [{"G1": [vehicles...]}, ...]}
                for route in data.get('routes', []):
                    for route_id, vehicles in route.items():
                        # Only look at Route G1
                        if route_id == 'G1':
                            for vehicle in vehicles:
                                label = str(vehicle.get('label', ''))
                                
                                # PCC trolleys: 4 digits starting with "23"
                                if label.startswith('23') and len(label) == 4:
                                    destination = vehicle.get('destination', '').upper()
                                    
                                    # Determine direction
                                    if any(d in destination for d in ['RICHMOND', 'FISHTOWN', 'FRANKFORD', 'DELAWARE', 'WESTMORELAND']):
                                        direction = 'Eastbound'
                                    elif any(d in destination for d in ['63RD', 'PARKSIDE', '63']):
                                        direction = 'Westbound'
                                    else:
                                        direction = 'Unknown'
                                    
                                    # Get sequence info for ETA calculation
                                    current_seq = vehicle.get('next_stop_sequence')
                                    
                                    # Calculate stops away from Broad & Girard
                                    stops_away = None
                                    eta_minutes = None
                                    
                                    if direction in BROAD_GIRARD and current_seq is not None:
                                        broad_seq = BROAD_GIRARD[direction]['sequence']
                                        stops_away = broad_seq - current_seq
                                        
                                        if stops_away > 0:
                                            # Trolley hasn't reached Broad & Girard yet
                                            eta_minutes = int(stops_away * MINUTES_PER_STOP)
                                        elif stops_away == 0:
                                            # Trolley is at Broad & Girard now
                                            eta_minutes = 0
                                        else:
                                            # Trolley already passed Broad & Girard
                                            stops_away = None
                                            eta_minutes = None
                                    
                                    trolleys.append({
                                        'vehicle': label,
                                        'destination': vehicle.get('destination', ''),
                                        'direction': direction,
                                        'lat': vehicle.get('lat', ''),
                                        'lng': vehicle.get('lng', ''),
                                        'current_sequence': current_seq,
                                        'stops_away': stops_away,
                                        'eta_minutes': eta_minutes
                                    })
                
                return trolleys
        except Exception as e:
            print(f"TransitView Error: {e}")
        return []
    
    def get_next_trains_from_east_falls(self):
        """Get scheduled trains from East Falls to North Broad St"""
        try:
            url = f"{NEXTTOARRIVE_URL}/East Falls/North Broad St/10"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                trains = []
                
                for train in data:
                    if isinstance(train, dict):
                        depart_time = train.get('orig_departure_time', '')
                        train_id = train.get('orig_train', '')
                        delay = train.get('orig_delay', '0')
                        line = train.get('orig_line', '')
                        
                        if depart_time and depart_time != 'NA':
                            trains.append({
                                'depart': depart_time,
                                'train_id': train_id,
                                'delay': delay,
                                'line': line
                            })
                
                return trains
        except Exception as e:
            print(f"Train schedule error: {e}")
        return []
    
    def parse_time(self, time_str):
        """Parse SEPTA time to datetime"""
        try:
            time_str = time_str.strip()
            
            for fmt in ['%I:%M %p', '%I:%M%p']:
                try:
                    time_obj = datetime.strptime(time_str, fmt)
                    now = datetime.now()
                    result = now.replace(hour=time_obj.hour, minute=time_obj.minute, second=0, microsecond=0)
                    
                    if result < now - timedelta(minutes=1):
                        result += timedelta(days=1)
                        
                    return result
                except ValueError:
                    continue
        except:
            pass
        return None
    
    def display_planner(self):
        """Display transfer planning information"""
        self.pcc_trolleys = self.get_pcc_trolleys_only()
        self.train_schedule = self.get_next_trains_from_east_falls()
        
        now = datetime.now()
        
        print(f"\n{'='*75}")
        print(f"🚆→🚋 SMART TRANSFER PLANNER: EAST FALLS → PCC TROLLEY")
        print(f"{'='*75}")
        print(f"Current time: {now.strftime('%I:%M %p')}")
        print(f"Transfer time: {TOTAL_TRANSFER} minutes (rail + walk)")
        
        # Show real-time PCC trolley status
        print(f"\n🚋 REAL-TIME PCC TROLLEYS (Vehicle #s 23xx):")
        if not self.pcc_trolleys:
            print("   ❌ NO PCC TROLLEYS RUNNING - Only bus substitutes!")
            print("   🚌 Route G is currently served by buses")
            print("   💡 Check back later for PCC trolley service")
        else:
            print(f"   ✅ {len(self.pcc_trolleys)} PCC trolley(s) currently running:")
            for trolley in self.pcc_trolleys:
                eta_text = ""
                if trolley['eta_minutes'] is not None:
                    if trolley['eta_minutes'] == 0:
                        eta_text = f" | AT Broad & Girard NOW!"
                    else:
                        eta_time = now + timedelta(minutes=trolley['eta_minutes'])
                        eta_text = f" | ~{trolley['eta_minutes']} min to Broad & Girard ({eta_time.strftime('%I:%M %p')})"
                elif trolley['stops_away'] is None and trolley['direction'] != 'Unknown':
                    eta_text = " | Already passed Broad & Girard"
                
                print(f"      • Trolley #{trolley['vehicle']} → {trolley['destination']}")
                print(f"        {trolley['direction']}{eta_text}")
        
        # Show train schedule
        print(f"\n🚆 NEXT TRAINS FROM EAST FALLS:")
        if not self.train_schedule:
            print("   ❌ No scheduled trains found")
            print("   Check SEPTA alerts or try later")
        else:
            for i, train in enumerate(self.train_schedule[:5], 1):
                depart_dt = self.parse_time(train['depart'])
                if depart_dt:
                    arrival_at_trolley = depart_dt + timedelta(minutes=TOTAL_TRANSFER)
                    minutes_until = int((depart_dt - now).total_seconds() / 60)
                    
                    delay_text = f" ({train['delay']} min delay)" if train['delay'] != '0' and train['delay'] != 'On time' else ""
                    line_text = f" - {train['line']}" if train['line'] else ""
                    
                    print(f"\n   {i}. Train #{train['train_id']}{line_text}")
                    print(f"      Depart East Falls: {depart_dt.strftime('%I:%M %p')}{delay_text}")
                    print(f"      In: {minutes_until} minutes")
                    print(f"      Arrive Broad & Girard: ~{arrival_at_trolley.strftime('%I:%M %p')}")
        
        # Recommendation with wait time calculation
        print(f"\n{'='*75}")
        print(f"💡 RECOMMENDATION:")
        
        if not self.pcc_trolleys:
            print("   ⚠️  WAIT - No PCC trolleys running right now")
            print("   Route G is using bus substitutes (not vintage trolleys)")
            print("   Check later when actual trolley service resumes")
        elif not self.train_schedule:
            print("   ⏳ No trains scheduled soon - check back later")
        else:
            next_train = self.train_schedule[0]
            depart_dt = self.parse_time(next_train['depart'])
            
            if depart_dt:
                time_until_train = int((depart_dt - now).total_seconds() / 60)
                arrival_at_stop = depart_dt + timedelta(minutes=TOTAL_TRANSFER)
                minutes_until_at_stop = int((arrival_at_stop - now).total_seconds() / 60)
                
                print(f"   🎯 {len(self.pcc_trolleys)} PCC TROLLEY(S) RUNNING!")
                print(f"   • Next train: #{next_train['train_id']} in {time_until_train} minutes")
                print(f"   • You'll arrive at Broad & Girard: ~{arrival_at_stop.strftime('%I:%M %p')}")
                
                # Calculate wait time for each trolley
                print(f"\n   📊 WAIT TIME ESTIMATE AT BROAD & GIRARD:")
                
                any_good_connection = False
                for trolley in self.pcc_trolleys:
                    if trolley['eta_minutes'] is not None:
                        # Trolley ETA at Broad & Girard
                        trolley_arrival = now + timedelta(minutes=trolley['eta_minutes'])
                        
                        # Your wait time = trolley arrival - your arrival
                        wait_minutes = int((trolley_arrival - arrival_at_stop).total_seconds() / 60)
                        
                        direction_emoji = "⬅️" if trolley['direction'] == 'Westbound' else "➡️"
                        
                        if wait_minutes >= 0:
                            # Trolley arrives after you - good!
                            print(f"      {direction_emoji} #{trolley['vehicle']} ({trolley['direction']}): ~{wait_minutes} min wait")
                            any_good_connection = True
                        else:
                            # Trolley arrives before you - you'll miss it
                            print(f"      {direction_emoji} #{trolley['vehicle']} ({trolley['direction']}): ❌ Arrives {abs(wait_minutes)} min before you")
                    elif trolley['stops_away'] is None:
                        direction_emoji = "⬅️" if trolley['direction'] == 'Westbound' else "➡️"
                        print(f"      {direction_emoji} #{trolley['vehicle']} ({trolley['direction']}): Already passed Broad & Girard")
                
                if any_good_connection:
                    print(f"\n   🚶 LEAVE NOW to catch the {depart_dt.strftime('%I:%M %p')} train!")
                else:
                    print(f"\n   ⏳ Current trolleys will pass before you arrive.")
                    print(f"   Consider waiting for next train or check back soon.")


def main():
    """Main loop"""
    print("🚆→🚋 SEPTA Smart Transfer Planner")
    print("Finding real PCC trolleys (not buses!) for your East Falls connection")
    print("Press Ctrl+C to stop\n")
    
    planner = SmartTransferPlanner()
    
    try:
        while True:
            planner.display_planner()
            
            print(f"\n🔄 Refreshing in 60 seconds... (Ctrl+C to stop)")
            time.sleep(60)
            
    except KeyboardInterrupt:
        print("\n\n🚆 Transfer planner stopped")
        print("Safe travels on the PCC!")


if __name__ == "__main__":
    main()
