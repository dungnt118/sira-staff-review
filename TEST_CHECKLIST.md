# Test Checklist: Bulk Assignment Filtering Fix

## Pre-Test Setup
- [ ] Close current browser tabs with StaffReviewer
- [ ] Open new incognito/private window (to clear all cache)
- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Clear any previous logs (Ctrl+L)

## Test Case 1: Data Loading
- [ ] Navigate to Assignments Manager page
- [ ] Expected: Console shows `✅ Loaded data` in green with counts
- [ ] Expected: Employees count > 0
- [ ] Expected: Assignments count >= 0
- [ ] Expected: Sample assignments shown with fields: reviewer_email, reviewee_email, target_type, status

## Test Case 2: Bulk Add Modal Opening
- [ ] Click "Thêm gộp" button
- [ ] Expected: Modal dialog opens
- [ ] Expected: All 3 dropdowns are empty (showing placeholder text)

## Test Case 3: Reviewer Selection
- [ ] Select a reviewer from "Chọn Reviewer" dropdown (e.g., someone with name + department)
- [ ] Console shows: `Reviewer changed: [email]`
- [ ] Expected: "Phòng ban: ..." shows reviewer's info
- [ ] Expected: "Chọn Loại đánh giá" is still empty
- [ ] Expected: "Chọn reviewee để thêm" is empty (no options shown yet)

## Test Case 4: Target Type Selection
- [ ] Select a target type from "Chọn Loại đánh giá" dropdown (EMPLOYEE or MANAGER)
- [ ] Console shows:
  - `Target type changed: [type]`
  - `📋 Filtering reviewees` (blue bold)
  - Shows: reviewer, targetType, counts
  - List of employees with ✅ or ❌ marks
  - Summary: "📊 Result: X available (từ Y tổng)"
- [ ] Expected: Reviewee dropdown now has options
- [ ] Expected: Some employees might show ❌ with reason "assignment(...)" if they already have assignment with this reviewer+type

## Test Case 5: Verify Exclusion Logic
- [ ] Open a text file and list people currently in the assignments table with this reviewer+type
- [ ] In console, find employees with `❌ ... - bỏ vì: assignment(...)`
- [ ] Expected: These excluded people should NOT appear in reviewee dropdown
- [ ] Expected: People with other reviewer or type CAN appear (only excluded if EXACT match)

## Test Case 6: Selection and Removal
- [ ] Select multiple reviewees from dropdown
- [ ] After each selection:
  - [ ] Person appears in "Những người được chọn" section
  - [ ] Dropdown resets to "-- Chọn reviewee để thêm --"
  - [ ] Console shows: "📊 Result: X available" (number should decrease as more picked)
- [ ] Click X button next to picked person
- [ ] Expected: Person removed from selected list
- [ ] Expected: Dropdown updates to show them again (if not already assigned)

## Test Case 7: Bulk Save
- [ ] With multiple reviewees selected, click "Lưu" button
- [ ] Expected: Modal closes
- [ ] Expected: New assignments appear in main table
- [ ] Expected: Status should be "PENDING"
- [ ] Expected: All have same reviewer, target_type, and selected reviewees

## Test Case 8: Duplicate Prevention
- [ ] Try to add same person again in another session:
  - [ ] Select reviewer A, type E, person X → Save
  - [ ] Open "Thêm gộp" again
  - [ ] Select reviewer A, type E
  - [ ] Person X should show ❌ in console
  - [ ] Person X should NOT appear in reviewee dropdown

## Test Case 9: Edge Cases

### Case 9a: No assignments yet
- [ ] Clear ASSIGNMENTS sheet (or use new reviewer)
- [ ] Expected: Console should show "allAssignmentsCount: 0"
- [ ] Expected: Everyone (except reviewer) appears in dropdown

### Case 9b: Email case sensitivity
- [ ] If you see emails like "User@Email.COM" and "user@email.com"
- [ ] Expected: They should still be treated as same person (lowercased in comparison)

### Case 9c: Large employee list
- [ ] If >1000 employees:
  - [ ] Console should show all filtering steps
  - [ ] Dropdown should populate (might take 1-2 seconds)
  - [ ] Check if it's responsive

## Troubleshooting Steps

### Dropdown is empty after selecting type
```
1. Check console for allAssignmentsCount value
2. If 0, check if assignments exist in Google Sheets
3. If >0, check if all selected options show ❌
4. Reload page and try different reviewer+type combination
```

### Someone already assigned still appears
```
1. Check console logs for "❌ [Name] - bỏ vì: assignment(...)"
2. If NOT shown, they shouldn't be assigned - verify Google Sheets
3. If shown but they still appear, there's a rendering bug - refresh
4. Check if reviewer/type in dropdown exactly matches table
```

### No console logs appearing
```
1. F12 → Console tab opened?
2. No errors showing? (red text)
3. Try selecting reviewer again
4. If still nothing, check if config.js loaded (look for errors at top)
```

## Expected Console Output During Test

```javascript
// Page load:
✅ Loaded data {employees: 45, assignments: 120}
📋 Sample assignments: [{reviewer_email: "...", ...}]

// Select reviewer + type:
Reviewer changed: admin@company.com
Target type changed: EMPLOYEE
📋 Filtering reviewees {
  reviewer: "admin@company.com",
  targetType: "EMPLOYEE",
  allAssignmentsCount: 120,
  allEmployeesCount: 45,
  bulkSelectedCount: 0
}
  ❌ Admin User - bỏ vì là reviewer
  ❌ John Doe - bỏ vì: assignment(admin@company.com->john@company.com, EMPLOYEE)
  ✅ Jane Smith - giữ lại
  ✅ Bob Wilson - giữ lại
  ✅ Alice Brown - giữ lại
📊 Result: 42 available (từ 45 tổng)

// Select reviewee:
  ✅ Jane Smith - giữ lại
  ❌ Jane Smith - bỏ vì đã được chọn
  ✅ Bob Wilson - giữ lại
  ✅ Alice Brown - giữ lại
📊 Result: 41 available (từ 45 tổng)
```

## Sign-Off
- [ ] All test cases passed
- [ ] No JavaScript errors in console
- [ ] Bulk add creates correct assignments in table
- [ ] Assignments saved to Google Sheets correctly
- [ ] Filtering excludes duplicates properly

