# Visual Guide: Bulk Assignment Filtering Fix

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    BULK ADD MODAL                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │  Reviewer    │ │  Target Type │ │  Reviewee    │
        │  Dropdown    │ │  Dropdown    │ │  Dropdown    │
        └──────────────┘ └──────────────┘ └──────────────┘
              │ select        │ select            │
              │               │                   │
              └───────────┬───┴───────────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ onBulkReviewerChange() │
              │ onBulkTargetTypeChange│
              └────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────────┐
        │  filterAndUpdateBulkRevieweeSelect()    │
        │                                         │
        │  1. Get reviewer and targetType        │
        │  2. Normalize values                   │
        │  3. Filter employees                   │
        │     - Exclude self                     │
        │     - Exclude already-picked           │
        │     - Exclude with existing assignment │
        │  4. Render dropdown                    │
        └─────────────────────────────────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   Filtered Dropdown    │
              │  (Only available people)
              └────────────────────────┘
```

## Filtering Logic (Detailed)

```
FOR each employee:
  ├─ Is their email === reviewer email?
  │  └─ YES → ❌ EXCLUDE (can't review self)
  │
  ├─ Are they already selected in bulk?
  │  └─ YES → ❌ EXCLUDE (already picked)
  │
  ├─ Check all assignments:
  │  └─ FOR each assignment:
  │     ├─ assignment.reviewer_email EQUALS reviewer?
  │     ├─ assignment.reviewee_email EQUALS employee email?
  │     ├─ assignment.target_type EQUALS selected type?
  │     └─ ALL 3 TRUE? → ❌ EXCLUDE (duplicate)
  │
  └─ If not excluded → ✅ INCLUDE in dropdown
```

## Normalization Fix (Visual)

### Before (Broken)
```
Compare: "admin@company.com" === "Admin@Company.Com"
         FALSE ❌ (not excluded, but should be!)

Compare: "EMPLOYEE" === "Employee"
         FALSE ❌ (not excluded, but should be!)

Compare with null: null === "admin@company.com"
         FALSE ❌ (throws error or fails silently)
```

### After (Fixed)
```
Compare: ("admin@company.com" || "").toLowerCase()
         === 
         ("Admin@Company.Com" || "").toLowerCase()
         "admin@company.com" === "admin@company.com"
         TRUE ✅ (correctly excluded!)

Compare: ("EMPLOYEE" || "").toUpperCase()
         === 
         ("Employee" || "").toUpperCase()
         "EMPLOYEE" === "EMPLOYEE"
         TRUE ✅ (correctly excluded!)

Compare with null: (null || "").toLowerCase()
         === 
         ("admin@company.com" || "").toLowerCase()
         "" === "admin@company.com"
         FALSE ✅ (safely handled, no error)
```

## Console Output Structure

```
┌─ Page Load
│  ✅ Loaded data {employees: 45, assignments: 120}
│  📋 Sample assignments: [{...}, {...}, {...}]
│
├─ Reviewer Selected
│  Reviewer changed: admin@company.com
│
├─ Target Type Selected
│  Target type changed: EMPLOYEE
│  📋 Filtering reviewees {reviewer: "admin@company.com", targetType: "EMPLOYEE", ...}
│  ├─ ❌ Admin User - bỏ vì là reviewer
│  ├─ ❌ John Doe - bỏ vì: assignment(admin@company.com->john@company.com, EMPLOYEE)
│  ├─ ✅ Jane Smith - giữ lại
│  ├─ ✅ Bob Wilson - giữ lại
│  └─ ✅ Alice Brown - giữ lại
│  📊 Result: 42 available (từ 45 tổng)
│
└─ Reviewee Selected
   ❌ Jane Smith - bỏ vì đã được chọn
   📊 Result: 41 available (từ 45 tổng)
```

## Assignment Matching Logic

```
Selected in Bulk Add Modal:
  Reviewer: admin@company.com
  Target Type: EMPLOYEE
  Reviewee Candidates: [Jane, Bob, Alice, ...]

For each employee in allAssignments:
  
  Assignment 1: { 
    reviewer_email: "admin@company.com",
    reviewee_email: "john@company.com",
    target_type: "EMPLOYEE"
  }
  ├─ reviewer_email match? ✓
  ├─ reviewee_email is John? ✓
  ├─ target_type match? ✓
  └─ RESULT: ❌ EXCLUDE John

  Assignment 2: { 
    reviewer_email: "admin@company.com",
    reviewee_email: "bob@company.com",
    target_type: "MANAGER"          ← Different type!
  }
  ├─ reviewer_email match? ✓
  ├─ reviewee_email is Bob? ✓
  ├─ target_type match? ✗ (MANAGER ≠ EMPLOYEE)
  └─ RESULT: ✅ INCLUDE Bob (can have different type)

  Assignment 3: { 
    reviewer_email: "other@company.com",  ← Different reviewer!
    reviewee_email: "jane@company.com",
    target_type: "EMPLOYEE"
  }
  ├─ reviewer_email match? ✗ (other ≠ admin)
  ├─ reviewee_email is Jane? ✓
  ├─ target_type match? ✓
  └─ RESULT: ✅ INCLUDE Jane (different reviewer is OK)
```

## Summary of Changes

```
OLD VERSION:
function filterAndUpdateBulkRevieweeSelect() {
  ❌ No null checks
  ❌ Case-sensitive comparison
  ❌ No logging
  ❌ innerHTML += (inefficient)
  ❌ Weak exclusion logic
}

NEW VERSION:
function filterAndUpdateBulkRevieweeSelect() {
  ✅ Defensive null checks
  ✅ Case-insensitive comparison (.toLowerCase().toUpperCase())
  ✅ Comprehensive logging (📋 ❌ ✅ 📊)
  ✅ Safe option rendering (createElement)
  ✅ Strict triple-field matching (reviewer + reviewee + type)
}
```

## Test Scenarios

```
Scenario 1: Admin with no existing assignments
  Expected: Everyone except admin appears in dropdown
  Result: ✅ PASS (all are ✅ INCLUDE)

Scenario 2: Admin with some assignments
  Expected: Admin + assigned people excluded, others shown
  Result: ✅ PASS (assigned shown ❌ EXCLUDE, others ✅ INCLUDE)

Scenario 3: Case sensitivity in emails
  Expected: "Admin@Company.Com" matches "admin@company.com"
  Result: ✅ PASS (.toLowerCase() handles this)

Scenario 4: Different target types
  Expected: Same person OK for EMPLOYEE but not for EMPLOYEE again
  Result: ✅ PASS (type must exact match)

Scenario 5: Different reviewers
  Expected: Same person OK with different reviewer
  Result: ✅ PASS (reviewer must exact match)
```

