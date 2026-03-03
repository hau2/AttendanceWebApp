I have some new requirements:

## 1. Accounts and Roles

* Admin can create **Divisions**. When creating a Division, a Manager can be assigned to it.
* One Manager can manage one or multiple Divisions.
* Each Division has only one Manager.
* Each Employee belongs to exactly one Division.
* When a Manager creates an employee account, they can assign that employee to any Division they manage.
* When an Admin creates an employee account, they can assign that employee to any Division without restriction.

---

## 2. Views and Visibility

* Admin and higher roles such as Executive can view all Divisions and all Employees in the system.
* They can monitor attendance status by Division and by individual Employee.
* They can see which Manager is assigned to a specific Employee, so they can contact that Manager if needed.
* Admin and Executive can filter employees by attendance status, such as:

  * Late
  * Early leave
  * Absent
  * Absent in the morning
  * Absent in the afternoon
* There should be a "data refresh" function where Admin can run a job at 12:00 PM or 11:30 PM (or schedule this API to run automatically at specified times).
* Managers can only view the Divisions they manage and the Employees within those Divisions.

---

## 3. Actions

* Admin can delete an employee account when the employee leaves the company.
* Admin can edit employee account information, such as name, working hours, and assigned Manager.

---

## 4. Attendance Changes

* Remove the company-level timezone setting.
* The attendance page should display a live clock showing the current time based on the device’s timezone (including hours, minutes, and seconds), so employees can check in and check out accurately.

---

## 5. Late / Early Leave Reasons

* When an employee submits a check-in with a late reason or an early leave reason:

  * The Manager can see this information in their view.
  * There should be an "Acknowledge" button for the Manager to confirm they have seen the information.
  * After the Manager acknowledges, the Employee should also see that the Manager has acknowledged it.

---

## 6. Remote Work Feature

* In special cases (e.g., bad weather or urgent personal matters), employees can select a "Remote Work" option when checking in.
* The Manager will receive this information and can click an "Acknowledge" button to confirm awareness.

---

## 7. UI Requirements

UI Specification – Attendance SaaS (NextJS + Tailwind + Lucide)

Build a clean, modern, role-based UI for a multi-tenant Attendance SaaS using NextJS (App Router), TailwindCSS, and Lucide Icons.

The UI must be consistent across roles but show different navigation items and home pages depending on role (Owner, Admin, Manager, Employee, Executive).

Global Design Requirements
- Clean SaaS layout: Header + Sidebar (desktop), responsive for mobile.
- Use Lucide icons for navigation and action buttons.
- Consistent components: Button, Card, Badge, Table, Modal, Confirmation Modal, Dropdown, Toast.
- All Edit/Delete actions must open a modal form.
- All destructive actions require confirmation modal.
- Use status badges for attendance states (On-time, Within-grace, Late, Early, Missing, Absent, Remote).
- Provide loading states and toast feedback.
- Layout must feel modern, spacious, and easy to scan.
- Navbar and Header must be consistent per role.

Pages

1) Login Page
- Simple centered login form.
- Clean branding.
- Error feedback and loading state.

2) Registration Page
- Company registration form.
- Clear field grouping.
- Success state after creation.

3) Onboarding Wizard Page
- Step-based wizard:
  Step 1: Timezone
  Step 2: Shift creation
  Step 3: First user setup
- Progress indicator at top.
- Cannot skip required steps.

4) Employee Home Page
- Large live clock (HH:MM:SS) based on device timezone.
- Prominent CHECK-IN / CHECK-OUT button with icon.
- “Today” summary card:
  - Shift time
  - Check-in time
  - Check-out time
  - Status badge
- Quick recent history (last few days).

5) Employee Attendance History Page
- Full table of attendance records.
- Columns: Date, Check-in, Check-out, Status, Late/Early minutes, Remote flag.
- Record detail modal with photo and reason.
- Employee can only see their own records.

6) Manager Dashboard Page
- Summary cards:
  - Late Today
  - Early Today
  - Missing Today
  - Remote Today
  - Monthly Attendance Rate
- Filters: date, division, employee, status.
- Attendance table for managed divisions.
- Each row includes:
  - Status badge
  - Reason indicator
  - Remote indicator
  - Acknowledge button
- Record detail modal with photos and notes.

7) Employee Detail Page (Manager View)
- Employee profile summary.
- Monthly attendance table.
- Late/Early reasons visible.
- Acknowledge status visible.

8) Admin Dashboard Page
- Company overview metrics.
- Quick access cards to Divisions, Users, Shifts, Attendance.

9) Division Management Page
- Table of divisions.
- Create/Edit Division modal.
- Assign Manager to division.
- Clear display of manager per division.

10) User Management Page
- Table of users:
  - Name
  - Role
  - Division
  - Manager
  - Status
- Actions: Edit, Disable/Enable, Delete.
- Modal for editing.
- Confirmation modal for delete.

11) Shift Management Page
- Table of shifts.
- Create/Edit shift modal.
- Assign shift to user with effective date.

12) Company Attendance Page (Admin View)
- Company-wide attendance table.
- Advanced filters:
  - Late
  - Early
  - Absent
  - Missing checkout
  - Remote
- Record detail modal with photo and audit trail.
- Manual “Refresh Data” action button with last-run timestamp.

13) Executive Dashboard Page
- Company attendance rate.
- Monthly trend chart.
- Top late employees.
- Division comparison view.
- Drill-down to employee history (read-only).

UI Behavior Requirements
- Managers can only see their assigned divisions.
- Admin/Executive can see all divisions and employees.
- Managers and Employees see acknowledgment status for late/remote submissions.
- Remote work selection appears during check-in when enabled.
- IP enforcement mode shows clear blocking message when applicable.

The UI must feel modern, professional, and easy to use for internal company workflows.
Use Tailwind for styling and Lucide icons consistently across all pages.
Ensure responsive layout and clear visual hierarchy.
