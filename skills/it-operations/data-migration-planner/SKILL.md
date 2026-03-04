---
name: data-migration-planner
description: >
  Plan and document data migration projects including mapping specifications, validation checklists, rollback procedures, and stakeholder communications.
  TRIGGER when user needs to plan, document, or execute a data migration between campus systems.
version: 1.0.0
category: it-operations
tags: [data-migration, project-planning, data-mapping, system-conversion]
---

# Data Migration Planner

You are a higher education data migration specialist. Help campus IT teams plan and document data migration projects between campus systems, including mapping specifications, validation checklists, rollback procedures, and stakeholder communications for SIS conversions, LMS migrations, ERP upgrades, and cloud transitions.

## When to Activate

Trigger this skill when the user:
- Needs to plan a data migration between campus systems
- Wants to create data mapping specifications for a system conversion
- Must develop validation checklists or testing procedures for migrated data
- Needs rollback procedures or go/no-go criteria for a migration cutover
- Must communicate migration plans and impacts to stakeholders

## Migration Project Plan Template

```
# Data Migration Plan: [Source System] to [Target System]

## Project Overview
- **Project Name:** [Name]
- **Source System:** [System, version]
- **Target System:** [System, version]
- **Migration Type:** [Full replacement / Parallel run / Phased migration]
- **Data Volume:** [Approximate record counts by data domain]
- **Target Go-Live Date:** [Date]
- **Project Lead:** [Name, title]
- **Last Updated:** [Date]

## Business Justification
[Why this migration is happening: end of life, vendor change, cloud
transition, functionality gap, cost reduction]

## Scope

### In Scope
| Data Domain | Source | Record Count (est.) | Priority |
|------------|--------|-------------------|----------|
| Student records | [Source table/system] | [count] | Critical |
| Course catalog | [Source table/system] | [count] | Critical |
| Financial records | [Source table/system] | [count] | Critical |
| Historical transcripts | [Source table/system] | [count] | High |
| Documents/attachments | [Source file store] | [count/size] | Medium |

### Out of Scope
- [Data or systems explicitly excluded and why]

## Migration Phases

### Phase 1: Discovery and Assessment ([Date range])
- Inventory all source data objects and relationships
- Assess data quality (completeness, accuracy, duplicates)
- Identify data cleansing requirements
- Document business rules and transformation logic

### Phase 2: Mapping and Design ([Date range])
- Create field-level mapping specifications
- Define transformation rules and crosswalk tables
- Design ETL/migration scripts
- Establish validation criteria

### Phase 3: Development and Testing ([Date range])
- Build migration scripts and processes
- Execute test migration with subset of data
- Validate migrated data against source
- Fix defects and re-test

### Phase 4: Full Test Migration ([Date range])
- Execute full data migration in test environment
- Run comprehensive validation suite
- User acceptance testing (UAT) with functional owners
- Performance testing of target system with migrated data

### Phase 5: Cutover ([Date range])
- Execute go/no-go decision
- Freeze source system for final extract
- Run production migration
- Execute post-migration validation
- Enable target system for users

### Phase 6: Post-Migration ([Date range])
- Monitor for data issues (30/60/90 day checkpoints)
- Decommission source system per retention policy
- Close project and document lessons learned
```

## Data Mapping Specification

```
# Data Mapping: [Data Domain]
# Source: [System] | Target: [System]
# Version: [X.X] | Date: [Date]
# Author: [Name]

## Mapping Rules Legend
- DM = Direct Map (no transformation)
- XW = Crosswalk (lookup table translation)
- CALC = Calculated field
- DEF = Default value (no source equivalent)
- CONCAT = Concatenation of multiple source fields
- COND = Conditional logic
```

| Map ID | Source Table | Source Field | Source Type | Target Table | Target Field | Target Type | Rule | Rule Detail | Nullable | Notes |
|--------|------------|-------------|------------|-------------|-------------|------------|------|-------------|----------|-------|
| STU-001 | SPRIDEN | SPRIDEN_ID | VARCHAR(9) | students | external_id | VARCHAR(20) | DM | | No | Primary key |
| STU-002 | SPRIDEN | SPRIDEN_LAST_NAME | VARCHAR(60) | students | last_name | VARCHAR(100) | DM | | No | |
| STU-003 | SPBPERS | SPBPERS_BIRTH_DATE | DATE | students | date_of_birth | DATE | DM | | Yes | Confidential |
| STU-004 | SGBSTDN | SGBSTDN_STST_CODE | VARCHAR(2) | students | enrollment_status | ENUM | XW | See Status Crosswalk | No | |
| STU-005 | -- | -- | -- | students | created_at | TIMESTAMP | DEF | Current timestamp | No | No source equivalent |

## Crosswalk Table Template

```
# Crosswalk: [Domain] — [Field Name]
# Purpose: Translate [source system] codes to [target system] values

| Source Code | Source Description | Target Value | Target Description | Notes |
|------------|-------------------|-------------|-------------------|-------|
| AS | Active Student | active | Active | |
| IS | Inactive Student | inactive | Inactive | |
| GR | Graduated | graduated | Graduated | New status in target |
| WD | Withdrawn | withdrawn | Withdrawn | |
| EX | Expelled | separated | Separated | Target combines EX+DS |
| DS | Dismissed | separated | Separated | Target combines EX+DS |
| ?? | Unknown / Null | review | Needs Review | Flag for manual review |
```

## Data Quality Assessment

Run this assessment on source data before designing the migration.

| Check | Query / Method | Threshold | Result | Action Required |
|-------|---------------|-----------|--------|----------------|
| Completeness: required fields | Count NULLs in required fields | 0% null | [X]% null | Cleanse before migration |
| Uniqueness: primary keys | Count duplicates on key fields | 0 duplicates | [X] dupes found | Deduplicate or merge |
| Referential integrity | Join child to parent tables | 0 orphans | [X] orphans | Resolve or exclude |
| Format consistency | Regex validation on formatted fields | 100% match | [X]% match | Standardize formats |
| Date validity | Check for future dates, impossible dates | 0 invalid | [X] invalid | Correct or null out |
| Range checks | Min/max on numeric fields | Within expected range | [X] outliers | Review and correct |
| Encoding | Check for non-UTF8 characters | 0 encoding errors | [X] errors | Convert or replace |

## Validation Checklist

Execute this checklist after every migration run (test and production).

```
# Post-Migration Validation: [Migration Name] — [Date]

## Record Count Validation
| Data Domain | Source Count | Target Count | Variance | Pass? |
|------------|-------------|-------------|----------|-------|
| Students | [X] | [X] | [X]% | [ ] |
| Courses | [X] | [X] | [X]% | [ ] |
| Enrollments | [X] | [X] | [X]% | [ ] |
| Grades | [X] | [X] | [X]% | [ ] |
| Financial | [X] | [X] | [X]% | [ ] |

Acceptable variance threshold: [0% for critical, <1% for non-critical]

## Sample Record Validation
Select [25-50] records at random from each data domain.
Compare every field between source and target.

| Sample | Domain | Source ID | All Fields Match? | Discrepancies |
|--------|--------|----------|-------------------|---------------|
| 1 | Student | [ID] | [Yes/No] | [Field: expected vs. actual] |
| 2 | Student | [ID] | [Yes/No] | [Field: expected vs. actual] |

## Business Logic Validation
| Test Case | Expected Result | Actual Result | Pass? |
|-----------|----------------|---------------|-------|
| Student with multiple majors shows both | Both majors visible | [Result] | [ ] |
| Graduated student transcript is complete | All terms and grades | [Result] | [ ] |
| Financial hold prevents registration | Hold active in target | [Result] | [ ] |

## Functional Owner Sign-Off
| Domain | Functional Owner | Validated? | Date | Signature |
|--------|-----------------|-----------|------|-----------|
| Student Records | Registrar | [ ] | | |
| Financial Aid | FA Director | [ ] | | |
| Finance | Bursar | [ ] | | |
| Academics | Provost Office | [ ] | | |
```

## Go / No-Go Criteria

| Criterion | Threshold | Status | Decision |
|-----------|-----------|--------|----------|
| Record count variance | < 0.1% for critical domains | [ ] Met / Not Met | |
| Sample validation pass rate | 100% of sampled records | [ ] Met / Not Met | |
| Business logic tests | 100% passed | [ ] Met / Not Met | |
| Functional owner sign-off | All owners signed off | [ ] Met / Not Met | |
| Rollback tested | Successfully tested in staging | [ ] Met / Not Met | |
| Performance benchmarks | Target system meets response time SLAs | [ ] Met / Not Met | |
| Training completed | All impacted staff trained | [ ] Met / Not Met | |

**Decision:** All criteria must be "Met" for a GO decision. Any "Not Met" triggers a NO-GO and reschedule.

## Rollback Procedure

```
# Rollback Plan: [Migration Name]

## Trigger Conditions
Initiate rollback if any of the following occur within [X] hours of go-live:
- Critical data integrity issue affecting [student records / financial data]
- Target system performance below acceptable thresholds
- Go/no-go criterion found to be invalid post-cutover

## Rollback Steps
1. Notify stakeholders: "Migration rollback initiated"
2. Disable user access to target system
3. Restore source system from pre-migration backup
4. Verify source system data integrity
5. Re-enable source system for users
6. Notify stakeholders: "Source system restored; target migration postponed"
7. Preserve target system state for root cause analysis

## Rollback Decision Authority
- **Decision maker:** [CIO / Project Sponsor]
- **Must consult:** [Registrar, CISO, Project Lead]
- **Rollback window:** [X] hours from go-live (after this, forward-fix only)
```

## Input Requirements

Ask the user for:
- **Source and target systems** (specific products and versions)
- **Data domains** (student records, financial, academic history, etc.)
- **Data volume** (approximate record counts)
- **Timeline** (target go-live date and key milestones)
- **Deliverable needed** (full plan, mapping spec, validation checklist, rollback procedure, communication)
- **Known data quality issues** (duplicates, missing data, format inconsistencies)

## Anti-Patterns

- DO NOT begin migration development without a completed data quality assessment on the source data
- DO NOT skip the crosswalk tables — code translation errors are the number one cause of migration failures
- DO NOT validate only record counts — counts can match while individual records have field-level errors
- DO NOT plan a migration without a tested rollback procedure
- DO NOT assume "we will clean it up after go-live" — data quality issues multiply after migration
- DO NOT migrate without functional owner sign-off on validation results
