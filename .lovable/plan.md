

# Archetype Renaming Implementation

## Overview
Update all 11 archetype names in the system while keeping "The Oracle" for Sphere 2 as requested.

## Final Name Mapping

| Sphere | Current Name | New Name |
|--------|--------------|----------|
| 0 | The Blank Canvas | **The Witness** |
| 1 | The Auteur | **The Resurrector** |
| 2 | The Oracle | **The Oracle** *(unchanged)* |
| 3 | The System Builder | **The Architect** |
| 4 | The Law Keeper | **The Arbiter** |
| 5 | The Sentinel | **The Guardian** |
| 6 | The Sovereign Will | **The Commander** |
| 7 | The Creative Muse | **The Alchemist** |
| 8 | The Analyst | **The Strategist** |
| 9 | The Deep Memory | **The Vessel** |
| 10 | The Anchor | **The Materializer** |

## Files to Update

### 1. `src/components/character/archetypes.ts`
- Update the `name` field for each archetype in the `ARCHETYPES` array
- Update the `id` field to match new names (snake_case)
- Expand the `LEGACY_ID_MAP` to include mappings from old IDs to new IDs for backward compatibility with existing database records

### 2. Backward Compatibility
Add legacy mappings to ensure users with existing archetype assignments don't break:

```text
Legacy ID Mappings (added to LEGACY_ID_MAP):
- "blank_canvas" → "witness"
- "auteur" → "resurrector"
- "system_builder" → "architect"
- "law_keeper" → "arbiter"
- "sentinel" → "guardian"
- "sovereign_will" → "commander"
- "creative_muse" → "alchemist"
- "analyst" → "strategist"
- "deep_memory" → "vessel"
- "anchor" → "materializer"
```

## Technical Details

### New Archetype IDs
| New Name | New ID |
|----------|--------|
| The Witness | `witness` |
| The Resurrector | `resurrector` |
| The Oracle | `oracle` |
| The Architect | `architect` |
| The Arbiter | `arbiter` |
| The Guardian | `guardian` |
| The Commander | `commander` |
| The Alchemist | `alchemist` |
| The Strategist | `strategist` |
| The Vessel | `vessel` |
| The Materializer | `materializer` |

### No Database Migration Required
The `LEGACY_ID_MAP` handles backward compatibility at the application layer, so existing `character_profiles.archetype` values will continue to work without data migration.

