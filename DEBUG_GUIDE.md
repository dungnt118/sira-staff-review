# Debug Guide: Bulk Assignment Filtering

## Problem
"danh sách reviewee chọn được vẫn bao gồm cả danh sách hiện có trong bảng assignemnt"
→ Selected reviewee list still includes existing assignments from the table

## Root Cause Analysis
The filtering logic in `filterAndUpdateBulkRevieweeSelect()` wasn't properly excluding reviewees who already have assignments with the selected reviewer + target_type combination.

## Solution Applied

### 1. Enhanced Data Normalization
- All email comparisons now use `.toLowerCase().trim()`
- All target_type comparisons now use `.toUpperCase().trim()`
- This prevents case-sensitivity and whitespace issues

### 2. Defensive Null Checks
- Each field in the assignment object is checked with `(value || '').toLowerCase()`
- Prevents errors when fields are null/undefined

### 3. Detailed Console Logging
Added comprehensive console logs with visual indicators:
- 📋 Loading: Shows employees and assignments count
- 📋 Filtering: Shows reviewer, targetType, and dataset sizes
- ❌ Excluded reviewees: With reason (self, already-picked, or duplicate assignment)
- ✅ Kept reviewees: Shows which ones will appear in dropdown
- 📊 Summary: Final count of available vs total

### 4. Better Option Rendering
Changed from `innerHTML +=` to using `document.createElement()` to prevent potential concatenation issues.

## How to Test

### Step 1: Open Browser DevTools
- Press `F12` to open Developer Tools
- Go to Console tab
- Clear previous logs (Ctrl+L or Command+K)

### Step 2: Reload Page
- Press `Ctrl+Shift+R` (or Cmd+Shift+R on Mac) to hard-refresh and clear cache
- Wait for data to load
- You should see green "✅ Loaded data" message showing employee and assignment counts

### Step 3: Test Bulk Assignment
1. Open "Thêm gộp" (Bulk Add) modal
2. In "Chọn Reviewer" dropdown, select a reviewer (e.g., "Nguyễn Tuấn Dũng")
3. In "Chọn Loại đánh giá" dropdown, select a type (e.g., "EMPLOYEE" or "MANAGER")
4. Watch the Console - you should see:
   - 📋 Filtering message with selected reviewer and type
   - Sample assignments (first 3) showing the data structure
   - List of all employees with ❌ (excluded) or ✅ (kept) indicators

### Step 4: Verify Filtering
Check console output for:
- Are there any ❌ marks for people already in the assignments table?
- The log should show: "❌ [Name] - bỏ vì: assignment(...)"
- Count of "available reviewees" should match the dropdown options

### Step 5: Common Issues & Solutions

**Issue: Dropdown is empty**
```
Console shows: "📋 Filtering reviewees, allAssignmentsCount: 0"
→ allAssignments is not loaded. Check network tab for getAllAssignments API call
```

**Issue: Everyone appears in dropdown**
```
Console shows: "✅ [Everyone] - giữ lại"
→ allAssignments is loaded but empty. Check if assignments exist in Google Sheets
```

**Issue: Someone already assigned is still in dropdown**
```
Console shows: "❌ [Name] - bỏ vì: assignment(...)"
BUT they still appear in dropdown
→ There might be a timing issue. Refresh page and try again.
```

**Issue: Dropdown shows different formatting than table**
```
Check console for: "📋 Sample assignments:" section
Compare the field names with table display (reviewer_email, reviewee_email, target_type, status)
```

## Console Output Example

```javascript
// When page loads:
✅ Loaded data
{
  employees: 45,
  assignments: 120
}
📋 Sample assignments:
[
  { reviewer_email: "user1@company.com", reviewee_email: "user2@company.com", target_type: "EMPLOYEE", status: "PENDING" },
  { reviewer_email: "user1@company.com", reviewee_email: "user3@company.com", target_type: "MANAGER", status: "COMPLETED" },
  ...
]

// When filtering in bulk modal:
📋 Filtering reviewees
{
  reviewer: "user1@company.com",
  targetType: "EMPLOYEE",
  allAssignmentsCount: 120,
  allEmployeesCount: 45,
  bulkSelectedCount: 0
}
  ❌ User 1 - bỏ vì là reviewer
  ❌ User 2 - bỏ vì: assignment(user1@company.com->user2@company.com, EMPLOYEE)
  ✅ User 3 - giữ lại
  ✅ User 4 - giữ lại
  ...
📊 Result: 38 available (từ 45 tổng)
```

## If Issue Persists

1. **Check Google Sheets Data**
   - Open the Google Sheet (ASSIGNMENTS tab)
   - Verify assignments exist with correct reviewer_email, reviewee_email, target_type columns

2. **Check API Response**
   - Open Network tab in DevTools
   - Look for `getAllAssignments` call
   - Check Response tab to see actual assignment data structure

3. **Verify Column Names**
   - API should return fields: `reviewer_email`, `reviewee_email`, `target_type`, `status`
   - If different, the filtering will fail to match

4. **Check Email Normalization**
   - Some emails might have spaces or different cases
   - The .toLowerCase().trim() should handle this, but verify in console output

## Files Modified
- `public/assignments-manager.html`:
  - Enhanced `filterAndUpdateBulkRevieweeSelect()` with detailed logging
  - Enhanced `loadData()` to show sample data structure
  - Enhanced `onBulkReviewerChange()` to log state changes
  - Changed option rendering to use `createElement` instead of `innerHTML +=`

## Next Steps if Still Not Working
1. Check [Google Sheets](https://docs.google.com/spreadsheets/d/1tXLOOPHF-PzjxawZvoJjMn8UYG26abwU_EQvHIvOhko)
2. Verify ASSIGNMENTS sheet has data
3. Check that column headers are: reviewer_email, reviewee_email, target_type, status
4. Open console and share the "Sample assignments" output with the team
