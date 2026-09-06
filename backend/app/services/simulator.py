import random
import numpy as np
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import Schedule, TrainSchedule

async def run_what_if_simulation(
    db: AsyncSession,
    schedule_batch_id: str = "default",
    variation_pct: float = 15.0,
    iterations: int = 100
) -> Dict[str, Any]:
    """
    Monte Carlo What-If Delay Risk Simulator:
    Simulates random train arrival variations and maintenance overruns across 'iterations'
    to compute delay risk distribution, P95 risk, and actionable recommendations.
    """
    # Fetch schedules
    res = await db.execute(select(Schedule))
    schedules = res.scalars().all()
    count = max(len(schedules), 1)

    # Perform Monte Carlo sampling
    # Base delay per schedule slot varies based on variation_pct
    mean_delay = (variation_pct / 100.0) * 20.0  # e.g., 3.0 minutes average delay per slot
    std_delay = mean_delay * 0.75

    simulated_delays = []
    for i in range(iterations):
        # Sample total corridor delay for iteration
        iteration_delay = np.random.normal(mean_delay * count, std_delay * np.sqrt(count))
        # Ensure non-negative delay
        iteration_delay = float(max(0.0, round(iteration_delay, 1)))
        simulated_delays.append(iteration_delay)

    simulated_delays.sort()
    avg_delay = float(np.mean(simulated_delays))
    p95_delay = float(np.percentile(simulated_delays, 95))

    if p95_delay < 15.0:
        risk_level = "low"
        recommendation = "Schedule is highly resilient. Proceed with current 3-hour shadow block windows."
    elif p95_delay < 35.0:
        risk_level = "medium"
        recommendation = "Moderate delay risk detected during peak hours. Recommend adding a 15-minute buffer between blocks."
    else:
        risk_level = "high"
        recommendation = "High risk of freight train knock-on delays. Shift shadow block start time by +30 minutes into off-peak window."

    return {
        "schedule_batch_id": schedule_batch_id,
        "risk_level": risk_level,
        "expected_delay_risk_minutes": round(avg_delay, 1),
        "p95_delay_minutes": round(p95_delay, 1),
        "delay_distribution": [round(x, 1) for x in simulated_delays[:20]],  # sample distribution array
        "recommended_adjustment": recommendation
    }
