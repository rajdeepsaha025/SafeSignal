# SafeSignal Rule-Based Risk Intelligence Engine

## Purpose

The Rule-Based Risk Intelligence Engine is the core deterministic fraud evaluation layer of SafeSignal. It evaluates a UPI ID against community reports, blacklists, report velocity, and recency to produce a normalized Risk Score between 0 and 100.

**Disclaimer:** The SafeSignal risk score is an intelligence signal, not a guarantee of fraud or legitimacy.

## Architecture

The Risk Engine adheres to strict Layered Architecture principles:

1.  **RiskController:** Validates the API request and parses the body. Contains NO scoring logic.
2.  **RiskService:** The main orchestrator. It checks the in-memory cache, calls intelligence gathering, runs the engine, logs the check to `HistoryRepository`, and updates the cache.
3.  **UPIIntelligenceService:** Queries the database (`UPIRepository` and `ReportRepository`) to aggregate all available raw data for the UPI ID.
4.  **RiskEngineService:** Coordinates the isolated Signal Calculators to determine the final score, Risk Level, and Confidence Level.
5.  **Signal Calculators:** Deterministic classes (`CommunitySignal`, `RecencySignal`, `VelocitySignal`, `BlacklistSignal`, `ScamCategorySignal`) that calculate individual risk contributions.

## Scoring Methodology

The final risk score is bounded strictly between **0 and 100**.

### Thresholds
*   **LOW:** 0-29
*   **MEDIUM:** 30-69
*   **HIGH:** 70-100

### Confidence Methodology
Confidence indicates how much evidence SafeSignal has available, independent of the risk itself.
*   **LOW:** Unknown UPI or no reports.
*   **MEDIUM:** 1-4 reports.
*   **HIGH:** 5+ reports or listed on a Blacklist.

## Risk Signals

1.  **CommunitySignal / Verified Reports:** Evaluates risk based on `APPROVED` vs `PENDING` vs `REJECTED` reports. Rejected reports do not increase risk.
2.  **RecencySignal:** A multiplier signal that decreases the weight of reports as they get older (e.g. > 30 days).
3.  **VelocitySignal:** A multiplier signal that detects bursts of reporting activity (e.g. > 10 reports in 24 hours).
4.  **BlacklistSignal:** If a UPI ID is marked as `isBlacklisted` in `upi_profiles`, this immediately yields a maximum score (100).
5.  **ScamCategorySignal:** Determines the most prominent scam category but does not alter the numeric score.

## Unknown UPI Behavior

If a UPI ID is completely unknown to SafeSignal (no profile, no reports), the system defaults to:
*   Risk Score: 0
*   Risk Level: LOW
*   Confidence: LOW
*   Warning: "Low risk does not guarantee that the recipient is legitimate."

## Limitations

*   **No ML:** Currently, the system uses static, heuristic weights.
*   **No External Threat APIs:** The system relies exclusively on internal data.
*   **In-Memory Caching:** The MVP uses a basic in-memory map cache. In a multi-node environment, this should be migrated to Redis.

## Future ML Integration

In future phases, machine learning models will consume these heuristic features alongside metadata (e.g., node centrality, device reputation) to emit probabilistic scores, potentially overriding or complementing this deterministic engine.
