// TrolleyWidget.swift - Philly Trolleys home screen widget. Added 2026-08-15.
// Shows how many PCC trolleys are out on the G Line right now, and which cars.
// Reads a small JSON feed from the live site every 15 minutes; tapping opens the app.

import WidgetKit
import SwiftUI

// MARK: - Data

struct WidgetVehicle: Decodable, Hashable {
    let id: String
    let direction: String
    let destination: String
    let lateMinutes: Int
}

struct WidgetStatus: Decodable {
    let updatedAt: String
    let pccCount: Int
    let busCount: Int
    let vehicles: [WidgetVehicle]
}

struct TrolleyEntry: TimelineEntry {
    let date: Date
    let status: WidgetStatus?
    let failed: Bool

    static let placeholder = TrolleyEntry(
        date: Date(),
        status: WidgetStatus(updatedAt: "", pccCount: 2, busCount: 4, vehicles: [
            WidgetVehicle(id: "2332", direction: "Eastbound", destination: "Richmond-Westmoreland", lateMinutes: 0),
            WidgetVehicle(id: "2333", direction: "Westbound", destination: "63rd-Girard", lateMinutes: 2)
        ]),
        failed: false
    )
}

enum StatusFeed {
    static let url = URL(string: "https://septa-g-trolley-tracker.netlify.app/.netlify/functions/widget-status")!

    static func fetch() async -> WidgetStatus? {
        var request = URLRequest(url: url)
        request.timeoutInterval = 12
        request.cachePolicy = .reloadIgnoringLocalCacheData
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return nil }
            return try JSONDecoder().decode(WidgetStatus.self, from: data)
        } catch {
            return nil
        }
    }
}

// MARK: - Timeline

struct TrolleyProvider: TimelineProvider {
    func placeholder(in context: Context) -> TrolleyEntry { .placeholder }

    func getSnapshot(in context: Context, completion: @escaping (TrolleyEntry) -> Void) {
        if context.isPreview {
            completion(.placeholder)
            return
        }
        Task {
            let status = await StatusFeed.fetch()
            completion(TrolleyEntry(date: Date(), status: status, failed: status == nil))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TrolleyEntry>) -> Void) {
        Task {
            let status = await StatusFeed.fetch()
            let entry = TrolleyEntry(date: Date(), status: status, failed: status == nil)
            // Ask iOS to refresh in 15 minutes; it may stretch that when the phone is idle.
            let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
            completion(Timeline(entries: [entry], policy: .after(next)))
        }
    }
}

// MARK: - Look

enum TrolleyColors {
    static let greenDark = Color(red: 13/255, green: 40/255, blue: 24/255)
    static let green = Color(red: 27/255, green: 67/255, blue: 50/255)
    static let cream = Color(red: 245/255, green: 241/255, blue: 227/255)
    static let creamDim = Color(red: 212/255, green: 207/255, blue: 192/255)
    static let gold = Color(red: 201/255, green: 162/255, blue: 39/255)
}

struct TrolleyWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: TrolleyEntry

    private var timeText: String {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return f.string(from: entry.date)
    }

    var body: some View {
        Group {
            switch family {
            case .systemMedium: medium
            default: small
            }
        }
        .containerBackground(for: .widget) {
            LinearGradient(colors: [TrolleyColors.greenDark, TrolleyColors.green],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }

    // Small: the number, a label, the time.
    private var small: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 6) {
                Image(systemName: "tram.fill")
                    .foregroundStyle(TrolleyColors.gold)
                Text("PCC trolleys")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(TrolleyColors.creamDim)
            }
            Spacer(minLength: 0)
            if entry.failed {
                Text("Data unavailable")
                    .font(.headline)
                    .foregroundStyle(TrolleyColors.cream)
                Text("Tap to open the app.")
                    .font(.caption2)
                    .foregroundStyle(TrolleyColors.creamDim)
            } else if let s = entry.status, s.pccCount > 0 {
                Text("\(s.pccCount)")
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .foregroundStyle(TrolleyColors.gold)
                    .minimumScaleFactor(0.6)
                Text(s.pccCount == 1 ? "out on the G Line" : "out on the G Line")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(TrolleyColors.cream)
            } else {
                Text("None out")
                    .font(.title3.weight(.bold))
                    .foregroundStyle(TrolleyColors.cream)
                Text("Buses cover the G Line right now.")
                    .font(.caption2)
                    .foregroundStyle(TrolleyColors.creamDim)
            }
            Spacer(minLength: 0)
            Text("Updated \(timeText)")
                .font(.caption2)
                .foregroundStyle(TrolleyColors.creamDim.opacity(0.8))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }

    // Medium: number on the left, the cars on the right.
    private var medium: some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Image(systemName: "tram.fill")
                        .foregroundStyle(TrolleyColors.gold)
                    Text("PCC trolleys")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(TrolleyColors.creamDim)
                }
                Spacer(minLength: 0)
                if entry.failed {
                    Text("Data unavailable")
                        .font(.headline)
                        .foregroundStyle(TrolleyColors.cream)
                } else if let s = entry.status {
                    Text("\(s.pccCount)")
                        .font(.system(size: 44, weight: .bold, design: .rounded))
                        .foregroundStyle(TrolleyColors.gold)
                    Text(s.pccCount == 0 ? "out right now" : "out on the G Line")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(TrolleyColors.cream)
                }
                Spacer(minLength: 0)
                Text("Updated \(timeText)")
                    .font(.caption2)
                    .foregroundStyle(TrolleyColors.creamDim.opacity(0.8))
            }
            .frame(width: 118, alignment: .leading)

            VStack(alignment: .leading, spacing: 6) {
                if entry.failed {
                    Text("Could not reach the trolley feed. Tap to open the app.")
                        .font(.caption)
                        .foregroundStyle(TrolleyColors.creamDim)
                } else if let s = entry.status, !s.vehicles.isEmpty {
                    ForEach(s.vehicles.prefix(3), id: \.self) { v in
                        HStack(spacing: 8) {
                            Text("#\(v.id)")
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(TrolleyColors.cream)
                            Text(v.direction == "Unknown" ? "on the line" : v.direction)
                                .font(.caption)
                                .foregroundStyle(TrolleyColors.gold)
                            Spacer(minLength: 0)
                        }
                        .padding(.vertical, 6)
                        .padding(.horizontal, 10)
                        .background(Color.black.opacity(0.22), in: RoundedRectangle(cornerRadius: 8))
                    }
                    if s.vehicles.count > 3 {
                        Text("and \(s.vehicles.count - 3) more")
                            .font(.caption2)
                            .foregroundStyle(TrolleyColors.creamDim)
                    }
                } else {
                    Text("No PCC cars are out. Buses cover the G Line right now.")
                        .font(.caption)
                        .foregroundStyle(TrolleyColors.creamDim)
                    Text("PCC cars usually run mornings into early evening.")
                        .font(.caption2)
                        .foregroundStyle(TrolleyColors.creamDim.opacity(0.8))
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Widget

struct TrolleyWidget: Widget {
    let kind = "TrolleyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TrolleyProvider()) { entry in
            TrolleyWidgetView(entry: entry)
        }
        .configurationDisplayName("PCC Trolleys Now")
        .description("How many vintage PCC trolleys are out on the G Line right now, and which cars.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct TrolleyWidgetBundle: WidgetBundle {
    var body: some Widget {
        TrolleyWidget()
    }
}
