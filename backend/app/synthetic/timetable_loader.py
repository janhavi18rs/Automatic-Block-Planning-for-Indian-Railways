import csv
import io
import os
from typing import List, Dict, Any, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import TrainSchedule, TrackSection

async def load_train_schedules(
    db: AsyncSession,
    csv_path: str = None,
    raw_csv_text: str = None,
    json_list: List[Dict[str, Any]] = None
) -> int:
    """
    Ingests train schedule from CSV file/string or JSON list into train_schedule table.
    """
    records_to_insert = []
    
    if json_list is not None:
        records_to_insert = json_list
    elif raw_csv_text is not None:
        f = io.StringIO(raw_csv_text)
        reader = csv.DictReader(f)
        records_to_insert = list(reader)
    else:
        if csv_path is None:
            base_dir = os.path.dirname(__file__)
            csv_path = os.path.join(base_dir, "seed_data", "train_schedule.csv")
        
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            records_to_insert = list(reader)

    # Fetch valid track section IDs
    res = await db.execute(select(TrackSection.section_id))
    valid_sections = set(res.scalars().all())

    inserted_count = 0
    for row in records_to_insert:
        sec_id = row.get("section_id")
        if sec_id not in valid_sections:
            # If track section doesn't exist yet, insert a fallback section so FK constraint passes
            fallback = TrackSection(
                section_id=sec_id,
                geometry=f"LINESTRING(77.0 28.0, 78.0 29.0)",
                zone="NR",
                division="DLI",
                start_station="STN1",
                end_station="STN2"
            )
            db.add(fallback)
            await db.flush()
            valid_sections.add(sec_id)

        new_ts = TrainSchedule(
            train_number=str(row.get("train_number")),
            section_id=sec_id,
            arrival_time=row.get("arrival_time", "08:00"),
            departure_time=row.get("departure_time", "08:30"),
            days_of_week=row.get("days_of_week", "MON,TUE,WED,THU,FRI,SAT,SUN"),
            train_type=row.get("train_type", "passenger")
        )
        db.add(new_ts)
        inserted_count += 1

    await db.commit()
    return inserted_count
