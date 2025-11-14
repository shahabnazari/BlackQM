# Heat Map Gradient Logic Test

## Expected Behavior:

### Stage 1 (currentStage=1, percentage 0-50%):
- 0-12.5%: Blue → Cyan (Cool start)
- 12.5-25%: Sky → Indigo (Warming)
- 25-37.5%: Yellow → Orange (Hot)
- 37.5-50%: Orange → Red (MAXIMUM HEAT)

### Stage 2 (currentStage=2, percentage 50-100%):
- 50-62.5%: Red → Orange (Still hot)
- 62.5-75%: Orange → Yellow (Cooling)
- 75-87.5%: Yellow → Lime (Cooler)
- 87.5-100%: Lime → Green (COOL)

## Test Cases:

| Stage | Percentage | Expected Color | Test Result |
|-------|------------|----------------|-------------|
| 1 | 5% | Blue-Cyan | ? |
| 1 | 15% | Sky-Indigo | ? |
| 1 | 30% | Yellow-Orange | ? |
| 1 | 45% | Orange-Red | ? |
| 1 | 50% | Orange-Red (MAX HEAT) | ? |
| 2 | 55% | Red-Orange | ? |
| 2 | 70% | Orange-Yellow | ? |
| 2 | 80% | Yellow-Lime | ? |
| 2 | 95% | Lime-Green | ? |
| Complete | 100% | Green (Complete) | ? |

## Counter Test:

Assume: stage1Total = 11,000, stage2Final = 500

| Stage | Percentage | Expected Count | Calc | Test Result |
|-------|------------|----------------|------|-------------|
| 1 | 0% | 0 | 0 + (0/50 × 11000) = 0 | ? |
| 1 | 25% | 5,500 | 0 + (25/50 × 11000) = 5500 | ? |
| 1 | 50% | 11,000 | 0 + (50/50 × 11000) = 11000 | ? |
| 2 | 60% | 8,900 | 11000 - (10/50 × 10500) = 8900 | ? |
| 2 | 75% | 5,750 | 11000 - (25/50 × 10500) = 5750 | ? |
| 2 | 100% | 500 | 11000 - (50/50 × 10500) = 500 | ? |

## Issue Found:

The counter calculation looks correct, but let me verify the heatmap gradient...

