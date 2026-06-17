# API Guide
## Login Flow

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET / POST | `/vtop/prelogin/setup` | Prelogin setup for session cookies and CSRF token |
| GET / POST | `/vtop/login` | Login page (get captcha & submit details) |
| POST | `/vtop/open/page` | Landing/Dashboard page after login |

---

## Student Details

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/vtop/studentsRecord/StudentProfileAllView` | Fetch complete student profile details |

---

## Academics

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/vtop/academics/common/StudentTimeTableChn` | Get Semester IDs (for timetable) |
| POST | `/vtop/processViewTimeTable` | Get student timetable for a semester |
| POST | `/vtop/academics/common/StudentAttendance` | Get Semester IDs (for attendance) |
| POST | `/vtop/processViewStudentAttendance` | Get student attendance for a semester |
| POST | `/vtop/processViewAttendanceDetail` | Get detailed subject-wise attendance |
| POST | `/vtop/processViewCalendar` | Get timetable for the selected semester with suboptions for semester type |

---

## Examinations

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/vtop/examinations/StudExamSchedule` | Get Semester IDs (for exams) |
| POST | `/vtop/examinations/doSearchExamScheduleForStudent` | Get exam schedule for a semester |
| POST | `/vtop/examinations/examGradeView/StudentGradeHistory` | Fetch CGPA and course grade history |
| POST | `/vtop/examinations/StudentMarkView` | Get Semester IDs (for marks) |
| POST | `/vtop/examinations/doStudentMarkView` | Get student marks for a semester |
| POST | `/vtop/get/dashboard/current/cgpa/credits` | Get student credit

---

## Hostel

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/vtop/hostels/student/leave/1` | Open leave request page ( Need to call this before any of the ones below ) |
| POST | `/vtop/hostels/student/leave/2` | Leave request step (details) |
| POST | `/vtop/hostels/student/leave/3` | Submit leave request |
| POST | `/vtop/hostels/student/leave/4` | View leave status |
| POST | `/vtop/hostels/student/leave/5` | Cancel leave request *(assumed)* |
| POST | `/vtop/hostels/student/leave/6` | Leave history page |
| POST | `/vtop/hostels/room/allotment/info/student/1` | Get student hostel information |

---

## Q-Bank & Admin APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/qbank/upload` | Create paper metadata (accepts optional `fileUrl` for admin Direct JSON uploads) |
| POST | `/api/qbank/admin/questions/bulk` | Bulk insert/override questions for a past paper |
| GET | `/api/qbank/admin/queue` | Fetch queue of papers in all states (PENDING, OCR_QUEUED, OCR_PROCESSING, PENDING_Q_APPROVAL, OCR_FAILED, APPROVED, REJECTED) |
| PATCH | `/api/qbank/admin/queue` | Update paper metadata or approval status |
| GET | `/api/qbank/admin/questions?paperId=xxx` | Get list of questions for a specific paper |
| POST | `/api/qbank/admin/questions` | Create a new question draft in a paper |
| PATCH | `/api/qbank/admin/questions` | Update a question's content, number, type, options, answer, marks, or topic |
| DELETE | `/api/qbank/admin/questions` | Delete a question |
| POST | `/api/qbank/admin/ocr` | Queue a paper for OCR processing (specifying model) |
| POST | `/api/admin/ocr/reset` | Reset OCR status of a paper back to PENDING |
| POST | `/api/qbank/admin/publish` | Publish a paper and mark it as APPROVED |
| POST | `/api/qbank/admin/reject` | Mark a paper as REJECTED |
