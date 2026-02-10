# UI Structure & Design System

This document maps the implementation components to the design mockups and defines the visual system.
Mockup Path: `c:\example\IDE\10.Project\2026\03.AdaQueue\docs\mockup\`

## 1. Design System (Visual Identity)

### Typography
- **Font Family**: System Sans (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, etc.)
- **Headings**: Bold / ExtraBold for emphasis
- **Body**: Regular/Medium for readability

### Color Palette (Tailwind)
- **Primary Action**: Blue-600 (`#2563EB`) -> Blue-700 (Hover)
- **Secondary/Surface**: White (`#FFFFFF`) / Gray-50 (`#F9FAFB`)
- **Text**: Gray-900 (Headings), Gray-600 (Body), Gray-400 (Placeholder)
- **Status**:
  - **Success**: Green-500
  - **Warning**: Amber-500
  - **Error**: Red-500
  - **Info**: Blue-500

---

## 2. Component Implementation Status

### Customer Facing Screens (Kiosk)
| Mockup | Component | Status |
|--------|-----------|--------|
| `kiosk_welcome_&_category_selection.png` | `apps/frontend/src/pages/kiosk/OWelcome.tsx` | ✅ Implemented |
| `kiosk_details_&_ticket_issuing.png` | `apps/frontend/src/pages/kiosk/OIssueTicket.tsx` | ✅ Implemented |

### Public Display
| Mockup | Component | Status |
|--------|-----------|--------|
| `public_queue_display_board.png` | `apps/frontend/src/components/queue/OQueueBoard.tsx` | ✅ Implemented |

### Staff Operation
| Mockup | Component | Status |
|--------|-----------|--------|
| `dynamic_staff_console_(restaurant).png` | `apps/frontend/src/pages/staff/StaffControlPage.tsx` | ✅ Implemented |
| | `apps/frontend/src/components/queue/OQueueControl.tsx` | ✅ Implemented |

### Admin & Configuration
| Mockup | Component | Status |
|--------|-----------|--------|
| `uqms_admin_dashboard_1.png` | `apps/frontend/src/pages/admin/ODashboard.tsx` | ✅ Implemented |
| `queue_workflow_designer.png` | `apps/frontend/src/pages/admin/OWorkflowDesigner.tsx` | ✅ Implemented |

### Authentication & Navigation
- **Login Screen**: `apps/frontend/src/pages/auth/OLogin.tsx` (Pin Pad Style)
- **Main Layout**: `apps/frontend/src/layouts/MainLayout.tsx` (Collapsible Sidebar, Role-based Menu)
- **Auth Context**: `apps/frontend/src/context/AuthContext.tsx` (Mock JWT, Session Persistence)

---

## 3. User Roles & Access

| Role | PIN | Access |
|------|-----|--------|
| **ADMIN** | `1234` | Dashboard, Workflow, Staff Console, Board |
| **STAFF** | `0000` | Staff Console, Board |
| **KIOSK** | `9999` | Kiosk Screens, Board |

