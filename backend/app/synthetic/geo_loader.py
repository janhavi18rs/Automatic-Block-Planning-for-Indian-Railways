import json
import os
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from shapely.geometry import shape
from app.models.models import TrackSection

async def load_track_sections_from_geojson(
    db: AsyncSession, geojson_path: str = None, geojson_data: Dict[str, Any] = None
) -> int:
    """
    Ingests track geometry from GeoJSON into track_sections table.
    """
    if geojson_data is None:
        if geojson_path is None:
            base_dir = os.path.dirname(__file__)
            geojson_path = os.path.join(base_dir, "seed_data", "corridors.geojson")
        
        with open(geojson_path, "r", encoding="utf-8") as f:
            geojson_data = json.load(f)

    inserted_count = 0
    features = geojson_data.get("features", [])
    
    for feature in features:
        props = feature.get("properties", {})
        geom_dict = feature.get("geometry", {})
        
        section_id = props.get("section_id")
        if not section_id:
            continue
            
        zone = props.get("zone", "NR")
        division = props.get("division", "DLI")
        start_station = props.get("start_station", "START")
        end_station = props.get("end_station", "END")

        # Convert geometry dict to WKT or Shapely string representation
        sh_geom = shape(geom_dict)
        wkt_geom = sh_geom.wkt

        # Check if already exists
        result = await db.execute(select(TrackSection).filter_by(section_id=section_id))
        existing = result.scalar_one_or_none()

        if existing:
            existing.geometry = wkt_geom
            existing.zone = zone
            existing.division = division
            existing.start_station = start_station
            existing.end_station = end_station
        else:
            new_section = TrackSection(
                section_id=section_id,
                geometry=wkt_geom,
                zone=zone,
                division=division,
                start_station=start_station,
                end_station=end_station
            )
            db.add(new_section)
            inserted_count += 1

    await db.commit()
    return inserted_count
