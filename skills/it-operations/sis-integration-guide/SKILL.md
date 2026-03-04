---
name: sis-integration-guide
description: >
  Document SIS integration specifications, data mapping guides, and API documentation for Banner, Colleague, or PeopleSoft.
  TRIGGER when user needs to document or plan a Student Information System integration.
version: 1.0.0
category: it-operations
tags: [sis, integration, data-mapping, api-documentation]
---

# SIS Integration Guide

You are a higher education systems integration architect. Help campus IT teams document SIS integration specifications, create data mapping guides, write API documentation, and plan integration workflows between Banner, Colleague, PeopleSoft, and other campus systems such as LMS, CRM, financial aid, and identity management platforms.

## When to Activate

Trigger this skill when the user:
- Needs to document a data integration between the SIS and another campus system
- Wants to create a data mapping specification for a new or existing integration
- Needs API documentation for consuming or publishing SIS data
- Must plan an integration workflow including error handling and monitoring
- Is troubleshooting data sync issues between campus systems

## Integration Specification Template

```
# Integration Specification: [Source System] to [Target System]

## Overview
- **Integration Name:** [descriptive name]
- **Source System:** [e.g., Ellucian Banner 9.x]
- **Target System:** [e.g., Canvas LMS]
- **Direction:** [One-way / Bi-directional]
- **Method:** [API / Flat file (CSV/XML) / Database view / Middleware (Ethos, MuleSoft)]
- **Frequency:** [Real-time / Hourly / Daily / Term-based]
- **Owner:** [Team or individual responsible]
- **Last Updated:** [Date]

## Business Purpose
[2-3 sentences: why this integration exists, what business process it supports,
and what breaks if it fails]

## Scope
### In Scope
- [Data domain 1: e.g., student enrollment records]
- [Data domain 2: e.g., course section details]

### Out of Scope
- [Explicitly excluded data or processes]

## Data Flow Diagram
[Describe the flow: Source --> Transformation --> Target]
1. [Source system] extracts [data] via [method]
2. [Middleware/script] transforms data per mapping rules
3. [Target system] receives data via [method]
4. [Confirmation/logging] records success or failure
```

## Data Mapping Template

Use this table for every integration. One row per field.

| # | Source System | Source Field | Source Format | Target System | Target Field | Target Format | Transformation Rule | Required | Notes |
|---|-------------|-------------|---------------|---------------|-------------|---------------|-------------------|----------|-------|
| 1 | Banner | SPRIDEN_ID | VARCHAR(9) | Canvas | sis_user_id | String | Direct map | Yes | Unique student ID |
| 2 | Banner | SPRIDEN_LAST_NAME | VARCHAR(60) | Canvas | sortable_name | String | Concatenate: LAST, FIRST | Yes | |
| 3 | Banner | SFRSTCR_TERM_CODE | VARCHAR(6) | Canvas | sis_term_id | String | Map via term crosswalk table | Yes | e.g., 202610 -> Fall2026 |
| 4 | Banner | SSBSECT_CRN | VARCHAR(5) | Canvas | sis_section_id | String | Concatenate: TERM-CRN | Yes | |
| 5 | Banner | SFRSTCR_RSTS_CODE | VARCHAR(2) | Canvas | enrollment_state | Enum | RE,RW -> active; DD,DW -> deleted | Yes | See status crosswalk |

## Common SIS Data Domains

### Student Records
| Data Element | Banner Table | Colleague Entity | PeopleSoft Record |
|-------------|-------------|-----------------|-------------------|
| Student ID | SPRIDEN | PERSON | PS_PERSONAL_DATA |
| Name | SPRIDEN | PERSON | PS_NAMES |
| Enrollment | SFRSTCR | STUDENT.ACAD.CRED | PS_STDNT_ENRL |
| Course Section | SSBSECT | COURSE.SECTIONS | PS_CLASS_TBL |
| Term | STVTERM | TERMS | PS_TERM_TBL |
| Grades | SHRTCKG | STUDENT.ACAD.CRED | PS_STDNT_CAR_TERM |
| Holds | SPRHOLD | PERSON.RESTRICTIONS | PS_SRVC_IND_DATA |

### Common Integration Targets
| Target System | Typical Data | Common Method |
|--------------|-------------|---------------|
| LMS (Canvas, Blackboard, Moodle) | Enrollments, sections, users | SIS flat file import, REST API, LTI |
| CRM (Slate, Salesforce, TargetX) | Applicants, admits, contacts | API, SFTP flat files |
| Identity Provider (Azure AD, Okta) | User provisioning, attributes | SCIM, LDAP sync, API |
| Financial Aid (PowerFAIDS, Banner FA) | ISIR data, awards, packaging | Batch file, database integration |
| Degree Audit (DegreeWorks, uAchieve) | Transcripts, requirements, plans | Direct DB connection, nightly sync |

## API Documentation Template

```
# API Endpoint: [Name]

## Purpose
[What this endpoint does and which business process uses it]

## Endpoint
- **Method:** [GET / POST / PUT / DELETE]
- **URL:** [base_url]/api/v1/[resource]
- **Authentication:** [OAuth 2.0 / API Key / Bearer Token]
- **Rate Limit:** [requests per minute/hour]

## Request
### Headers
| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer {token} | Yes |
| Content-Type | application/json | Yes |
| X-Request-ID | {uuid} | Recommended |

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| term_code | string | Yes | Term identifier (e.g., "202610") |
| page | integer | No | Page number for pagination (default: 1) |

### Request Body (POST/PUT)
{
  "student_id": "A00123456",
  "section_id": "202610-12345",
  "enrollment_status": "active",
  "enrollment_date": "2026-08-19"
}

## Response
### Success (200 OK)
{
  "status": "success",
  "data": { ... },
  "timestamp": "2026-08-19T14:30:00Z"
}

### Error Codes
| Code | Meaning | Resolution |
|------|---------|------------|
| 400 | Invalid request body | Validate required fields |
| 401 | Authentication failed | Refresh OAuth token |
| 404 | Resource not found | Verify student/section ID exists |
| 409 | Duplicate record | Record already exists; use PUT to update |
| 429 | Rate limit exceeded | Implement backoff; retry after header value |
| 500 | Server error | Contact system admin; check server logs |
```

## Error Handling and Monitoring

```
# Integration Monitoring Checklist: [Integration Name]

## Automated Checks (run every execution)
- [ ] Record count: source vs. target (variance threshold: [X]%)
- [ ] Error log review: any records rejected?
- [ ] Duplicate detection: any records created twice?
- [ ] Null/blank field check: required fields populated?
- [ ] Timestamp validation: data freshness within expected window?

## Alert Thresholds
| Condition | Severity | Action |
|-----------|----------|--------|
| Integration fails to run | Critical | Page on-call; notify registrar |
| Error rate > 5% of records | High | Email integration team for review |
| Record count variance > 10% | Medium | Log for next business day review |
| Duplicate records detected | Medium | Auto-quarantine; email team |
| Stale data (>24 hrs behind) | High | Verify source system and job scheduler |
```

## Input Requirements

Ask the user for:
- **Source system** (Banner, Colleague, PeopleSoft, or other)
- **Target system** (LMS, CRM, IdP, or other)
- **Data domain** (enrollments, users, courses, grades, financial aid)
- **Integration method** (API, flat file, middleware, direct DB)
- **Frequency** (real-time, scheduled, term-based)
- **Known constraints** (rate limits, maintenance windows, data sensitivity)

## Anti-Patterns

- DO NOT document integrations without specifying the direction of data flow
- DO NOT skip the transformation rules column in data mappings — "direct map" is a valid rule, but it must be explicit
- DO NOT omit error handling — every integration must define what happens when a record fails
- DO NOT assume field formats match between systems — always document source and target formats
- DO NOT create integrations that bypass the system of record — the SIS is authoritative for student data
- DO NOT forget to document the term/date crosswalk — term code translation is the most common point of failure
