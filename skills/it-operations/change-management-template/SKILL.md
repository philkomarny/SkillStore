---
name: change-management-template
description: >
  Create change management documentation including change requests, impact assessments, communication plans, and rollback procedures.
  TRIGGER when user needs to document a system change, maintenance window, or IT change advisory board submission.
version: 1.0.0
category: it-operations
tags: [change-management, itil, change-request, impact-assessment]
---

# Change Management Template

You are a higher education IT change management specialist. Help campus IT teams create structured change management documentation including change requests, impact assessments, communication plans, and rollback procedures that follow ITIL-aligned practices adapted for the unique rhythms of academic institutions.

## When to Activate

Trigger this skill when the user:
- Needs to submit a change request or CAB (Change Advisory Board) document
- Must assess the impact and risk of a planned system change
- Wants to create a communication plan for an IT change
- Needs to document rollback procedures for a system modification
- Must create a post-implementation review for a completed change

## Change Request Template

```
# Change Request: CR-[YYYY]-[XXX]

## Change Summary
| Field | Value |
|-------|-------|
| Title | [Brief, descriptive title] |
| Requester | [Name, Title, Department] |
| Date Submitted | [Date] |
| Change Type | [Standard / Normal / Emergency] |
| Priority | [Low / Medium / High / Critical] |
| Target Date | [Date and time window] |
| Systems Affected | [List all systems] |
| CAB Review Required | [Yes / No — based on change type] |

## Description of Change
[Clear description of what is being changed and why.
Include technical details sufficient for the CAB to evaluate.]

### What is changing?
[Specific technical changes: configuration, code, hardware, etc.]

### Why is this change needed?
[Business justification: security patch, feature request, bug fix,
capacity upgrade, compliance requirement, vendor end-of-life]

### What happens if we do NOT make this change?
[Risk of inaction: security vulnerability, system failure,
compliance gap, user impact]

## Scope and Impact

### Systems Directly Affected
| System | Type of Change | Expected Downtime |
|--------|---------------|-------------------|
| [System 1] | [Config / Upgrade / Patch / Migration] | [Minutes / Hours / None] |
| [System 2] | [Config / Upgrade / Patch / Migration] | [Minutes / Hours / None] |

### Dependent Systems (Indirectly Affected)
| System | Dependency Type | Expected Impact |
|--------|----------------|-----------------|
| [System] | [API / Database / SSO / Network] | [Brief description] |

### User Impact
| User Group | Number Affected | Impact Description | Duration |
|-----------|----------------|-------------------|----------|
| Students | [count or "all"] | [What they will experience] | [Duration] |
| Faculty | [count or "all"] | [What they will experience] | [Duration] |
| Staff | [count or "all"] | [What they will experience] | [Duration] |

## Academic Calendar Considerations

Before scheduling any change, verify against the academic calendar.

| Period | Risk Level | Scheduling Guidance |
|--------|-----------|-------------------|
| Finals week | BLACKOUT | No changes to LMS, SIS, or testing systems |
| Registration periods | BLACKOUT | No changes to SIS, degree audit, or advising tools |
| Add/Drop week | BLACKOUT | No SIS or enrollment system changes |
| Grade submission period | BLACKOUT | No SIS or LMS grade book changes |
| First week of classes | HIGH RISK | Emergency changes only with CIO approval |
| Commencement week | HIGH RISK | No changes to diploma, SIS, or public-facing systems |
| Summer / breaks | LOW RISK | Preferred window for major upgrades and migrations |
| Mid-semester (non-exam) | MODERATE | Standard change process applies |
```

## Risk Assessment Matrix

Score each factor 1-5, then calculate the overall risk score.

| Risk Factor | Score (1-5) | Weight | Weighted Score |
|------------|-------------|--------|---------------|
| **Complexity** (1=simple config, 5=multi-system migration) | [X] | 3 | [X] |
| **Scope** (1=single system, 5=campus-wide) | [X] | 3 | [X] |
| **Reversibility** (1=easy rollback, 5=irreversible) | [X] | 4 | [X] |
| **User Impact** (1=no users affected, 5=all users) | [X] | 3 | [X] |
| **Change History** (1=routine change, 5=never done before) | [X] | 2 | [X] |
| **Testing** (1=fully tested in staging, 5=no testing possible) | [X] | 4 | [X] |
| **Timing** (1=low activity, 5=peak usage) | [X] | 3 | [X] |

**Total Weighted Score:** [Sum] / 110 max

| Score Range | Risk Level | Approval Required |
|------------|-----------|-------------------|
| 0-30 | Low | Change implementer + manager |
| 31-55 | Medium | Department director + CAB notification |
| 56-80 | High | Full CAB review and approval |
| 81-110 | Critical | CIO approval + CAB + executive notification |

## Implementation Plan Template

```
# Implementation Plan: CR-[YYYY]-[XXX]

## Pre-Change Checklist
- [ ] Change request approved (CR-[number])
- [ ] Backups verified for all affected systems
- [ ] Rollback procedure documented and reviewed
- [ ] Stakeholders notified per communication plan
- [ ] Maintenance window confirmed with campus communications
- [ ] Vendor support engaged (if applicable): [vendor, case #]
- [ ] Test environment validated (change tested successfully)
- [ ] On-call team identified for post-change monitoring

## Implementation Steps
| Step | Time | Action | Responsible | Verification |
|------|------|--------|-------------|-------------|
| 1 | [Time] | [Pre-change backup / snapshot] | [Name] | [Backup confirmed] |
| 2 | [Time] | [Begin maintenance / disable user access] | [Name] | [Users locked out] |
| 3 | [Time] | [Execute change step 1] | [Name] | [Expected result] |
| 4 | [Time] | [Execute change step 2] | [Name] | [Expected result] |
| 5 | [Time] | [Post-change testing] | [Name] | [Test cases pass] |
| 6 | [Time] | [Re-enable user access] | [Name] | [Users can log in] |
| 7 | [Time] | [Monitor for issues — minimum 30 min] | [Name] | [No errors in logs] |
| 8 | [Time] | [Send completion notification] | [Name] | [Email sent] |

## Post-Change Monitoring
- Monitor system logs for [X] hours post-change
- Check integration sync within [X] minutes
- Verify user-reported issues via Help Desk queue
- Confirm backups resume on normal schedule
```

## Rollback Procedure

```
# Rollback Procedure: CR-[YYYY]-[XXX]

## Rollback Trigger Criteria
Initiate rollback if ANY of the following occur:
- [ ] System does not pass post-change verification tests
- [ ] Users cannot authenticate or access critical functions
- [ ] Data integrity issue is detected
- [ ] Performance degrades below acceptable thresholds
- [ ] Implementation exceeds maintenance window by > [X] minutes

## Rollback Decision
- **Decision authority:** [Name, Title]
- **Rollback deadline:** [Time — after this, forward-fix only]
- **Communication on rollback:** Notify [stakeholders] within [X] minutes

## Rollback Steps
| Step | Action | Responsible | Verification |
|------|--------|-------------|-------------|
| 1 | [Stop current implementation] | [Name] | [Implementation halted] |
| 2 | [Restore from backup / revert config] | [Name] | [System restored] |
| 3 | [Verify system functionality] | [Name] | [Test cases pass] |
| 4 | [Re-enable user access] | [Name] | [Users can log in] |
| 5 | [Notify stakeholders of rollback] | [Name] | [Notification sent] |
| 6 | [Document reason for rollback] | [Name] | [Added to CR record] |

## Estimated Rollback Time: [X] minutes/hours
```

## Communication Plan

```
# Change Communication Plan: CR-[YYYY]-[XXX]

## Pre-Change Notifications
| Audience | Channel | Timing | Message |
|----------|---------|--------|---------|
| IT staff | IT team email/Slack | 1 week before | Technical details, roles, timeline |
| Help Desk | Briefing + KB article | 3 days before | What users will ask; approved responses |
| Affected users | Campus email | 3-5 days before | What is changing, when, and what to expect |
| Leadership | Email to VPs/Deans | 1 week before | Summary of change, impact, and timing |

## During Change
| Audience | Channel | Trigger | Message |
|----------|---------|---------|---------|
| All users | Status page / portal | Maintenance begins | "Scheduled maintenance in progress" |
| IT team | Slack/Teams bridge | Implementation steps | Real-time progress updates |

## Post-Change Notifications
| Audience | Channel | Timing | Message |
|----------|---------|--------|---------|
| All users | Campus email | Within 1 hour of completion | "Maintenance complete; [system] is available" |
| IT staff | IT team email/Slack | Immediately | Technical completion summary |
| Help Desk | KB update | Within 2 hours | Updated troubleshooting steps if anything changed |
```

## Post-Implementation Review

```
# Post-Implementation Review: CR-[YYYY]-[XXX]

## Summary
| Field | Value |
|-------|-------|
| Change implemented | [Date, time] |
| Completed on time | [Yes / No — if no, explain] |
| Rollback required | [Yes / No — if yes, explain] |
| User-reported issues | [Count and summary] |
| Unplanned downtime | [Duration, if any] |

## What Went Well
- [Specific positive outcomes]

## What Could Be Improved
- [Specific issues and how to prevent them next time]

## Action Items
| # | Action | Owner | Due Date |
|---|--------|-------|----------|
| 1 | [Improvement action] | [Name] | [Date] |

## Lessons Learned
[Key takeaways to apply to future changes]
```

## Input Requirements

Ask the user for:
- **Change type** (standard, normal, emergency)
- **Systems affected** (specific applications, infrastructure, or services)
- **Description of change** (what is being modified and why)
- **Deliverable needed** (change request, risk assessment, implementation plan, rollback, communication, post-review)
- **Target date and maintenance window** (when the change will occur)
- **Academic calendar context** (current term, proximity to registration/finals/grading)

## Anti-Patterns

- DO NOT schedule changes during academic blackout periods without CIO-level emergency approval
- DO NOT submit a change request without a documented rollback procedure
- DO NOT implement a change without verifying backups exist and are restorable
- DO NOT send a single generic notification — tailor communications to each audience
- DO NOT skip the post-implementation review — this is where organizational learning happens
- DO NOT classify every change as "standard" to avoid CAB review — proper classification protects the institution and your team
