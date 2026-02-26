import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Filter,
  LayoutGrid,
  Server,
  ArrowRight,
  AlertTriangle,
  Monitor,
} from "lucide-react";
import { apiPath } from "../../config/api";

// --- Interfaces (Mirrors OStaffOperations/OWorkflowDesigner) ---
interface IServiceGroup {
  code: string;
  name: string;
}

interface IServicePoint {
  code: string;
  name: string;
  serviceGroups?: string[];
}

interface IWorkflowDefinition {
  serviceGroups: IServiceGroup[];
  servicePoints: IServicePoint[];
}

interface IProfileOption {
  code: string;
  name: string;
  agnCode?: string;
}

// Interfaces
interface IQueueItem {
  id: string;
  ticketNo: string;
  customerName: string;
  customerTier: "Standard" | "Gold" | "Platinum";
  channel: "Walk-in" | "Mobile" | "Voice" | "Chat";
  serviceType: string; // Will map to Service Group Name
  servicePoint: string; // Will map to Service Point Name
  waitTime: string; // formatted string for display
  status: "WAITING" | "SERVING" | "HOLD" | "ASSIGNED";
  serviceGroupCode?: string;
  servicePointCode?: string;
}

interface IActivityLog {
  id: string;
  user: string;
  action: string;
  details: string;
  timestamp: string;
  type: "danger" | "info" | "warning";
}

// Mock Data Generator based on Workflow
const generateMockQueues = (
  workflow: IWorkflowDefinition | null,
): IQueueItem[] => {
  if (
    !workflow ||
    !workflow.servicePoints ||
    workflow.servicePoints.length === 0
  )
    return [];
  if (!workflow.serviceGroups) return [];

  const queues: IQueueItem[] = [];
  const tiers: ("Standard" | "Gold" | "Platinum")[] = [
    "Standard",
    "Gold",
    "Platinum",
  ];
  const channels: ("Walk-in" | "Mobile" | "Voice" | "Chat")[] = [
    "Walk-in",
    "Mobile",
    "Voice",
    "Chat",
  ];
  const statuses: ("WAITING" | "SERVING" | "HOLD" | "ASSIGNED")[] = [
    "WAITING",
    "SERVING",
    "HOLD",
    "ASSIGNED",
  ];

  // Generate 15 mock items distributed across service points
  for (let i = 0; i < 15; i++) {
    const point =
      workflow.servicePoints[
        Math.floor(Math.random() * workflow.servicePoints.length)
      ];
    if (!point) continue;

    // Find group for this point (first one)
    const groupCode =
      point.serviceGroups && point.serviceGroups.length > 0
        ? point.serviceGroups[0]
        : "";
    const group = workflow.serviceGroups.find((g) => g.code === groupCode);

    queues.push({
      id: `mk-${i}`,
      ticketNo: `#TK-${8900 + i}`,
      customerName: `Customer ${i + 1}`,
      customerTier: tiers[Math.floor(Math.random() * tiers.length)],
      channel: channels[Math.floor(Math.random() * channels.length)],
      serviceType: group ? group.name : "General",
      servicePoint: point.name,
      serviceGroupCode: group ? group.code : "",
      servicePointCode: point.code,
      waitTime: `${Math.floor(Math.random() * 30)}m ${Math.floor(Math.random() * 60)}s`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
    });
  }
  return queues;
};

const MOCK_LOGS: IActivityLog[] = [
  {
    id: "1",
    user: "Admin_Sarah",
    action: "Bulk Cancel",
    details: "Performed Bulk Cancel on 15 tickets from Zone-A (Technical).",
    timestamp: "2 MINS AGO",
    type: "danger",
  },
  {
    id: "2",
    user: "Staff_04",
    action: "Transferred",
    details: "Transferred 8 items from Sales Queue to Express Lane.",
    timestamp: "14 MINS AGO",
    type: "info",
  },
  {
    id: "3",
    user: "System",
    action: "Bulk Skip",
    details: "Bulk Skip applied to 3 timed-out entries in Waitlist-01.",
    timestamp: "45 MINS AGO",
    type: "warning",
  },
  {
    id: "4",
    user: "Admin_Sarah",
    action: "Mass Override",
    details: "High Priority flag added to all entries in Crisis Desk.",
    timestamp: "1 HOUR AGO",
    type: "info",
  },
];

const OBulkQueueManagement: React.FC = () => {
  const { t } = useTranslation("staff");
  const [startupStep, setStartupStep] = useState<
    "init" | "select_profile" | "select_point" | "ready"
  >("init");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [queues, setQueues] = useState<IQueueItem[]>([]);
  const [isHistoryOpen, setHistoryOpen] = useState(false);

  // --- Workflow Integration State ---
  const [profiles, setProfiles] = useState<IProfileOption[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [workflow, setWorkflow] = useState<IWorkflowDefinition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterGroup, setFilterGroup] = useState<string>("ALL");
  const [filterPoint, setFilterPoint] = useState<string>("ALL");

  // --- Initialization ---
  useEffect(() => {
    const initStartup = async () => {
      try {
        const res = await fetch(apiPath("/api/profile"));
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await res.json();
            const mapped = data.map((p: any) => ({
              code: p.code,
              name: p.name,
              agnCode: p.agnCode,
            }));
            setProfiles(mapped);

            if (mapped.length > 0) {
              setStartupStep("select_profile");
            } else {
              setError("No profiles found. Please configure in Admin.");
            }
          } else {
            console.error("Received non-JSON response from /api/profile");
            setError("Backend connection failed. Invalid response format.");
          }
        } else {
          setError(`Failed to fetch profiles: ${res.status}`);
        }
      } catch (e) {
        console.error("Failed to fetch profiles", e);
        setError("Network error connecting to backend.");
      }
    };
    initStartup();
  }, []);

  const handleProfileSelect = async (profileId: string) => {
    setSelectedProfileId(profileId);
    setStartupStep("select_point");
    await fetchWorkflow(profileId);
    fetchQueues(profileId);
  };

  useEffect(() => {
    if (selectedProfileId && startupStep === "ready") {
      fetchWorkflow(selectedProfileId);
    } else if (!selectedProfileId) {
      setWorkflow(null);
      setQueues([]);
    }
  }, [selectedProfileId, startupStep]);

  // Generate mock queues when workflow loads
  useEffect(() => {
    if (workflow) {
      const mockData = generateMockQueues(workflow);
      setQueues(mockData);
      setFilterGroup("ALL");
      setFilterPoint("ALL");
    }
  }, [workflow]);

  const fetchWorkflow = async (profileId: string) => {
    setLoading(true);
    try {
      const res = await fetch(apiPath(`/api/workflow-designer/${profileId}`));
      if (res.ok) {
        const data = await res.json();
        if (!data.serviceGroups) data.serviceGroups = [];
        if (!data.servicePoints) data.servicePoints = [];
        setWorkflow(data);
      }
    } catch (e) {
      console.error("Failed to fetch workflow", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueues = async (profileId: string) => {
    try {
      const res = await fetch(apiPath(`/api/queue/profile/${profileId}`));
      if (res.ok) {
        const data = await res.json();
        const mapped: IQueueItem[] = data.map((q: any) => {
          const qData =
            q.data || (q.dataString ? JSON.parse(q.dataString) : {});
          const groupCode = qData.queueType || qData.serviceGroup || "";
          const groupName =
            workflow?.serviceGroups?.find((g) => g.code === groupCode)?.name ||
            groupCode ||
            "General";

          return {
            id: q.docNo,
            ticketNo: groupCode
              ? `${groupCode}-${String(q.queueNo || q.docNo).padStart(3, "0")}`
              : String(q.queueNo || q.docNo),
            customerName: q.customerName || "Guest",
            customerTier: "Standard",
            channel: "Walk-in",
            serviceType: groupName,
            servicePoint: qData.counter || "-",
            waitTime: "—",
            status: q.status || "WAITING",
            serviceGroupCode: groupCode,
            servicePointCode: qData.counter || "",
          };
        });
        setQueues(mapped);
      }
    } catch {}
  };

  // --- Filter Logic ---
  const filteredQueues = queues.filter((q) => {
    if (filterGroup !== "ALL" && q.serviceGroupCode !== filterGroup)
      return false;
    if (filterPoint !== "ALL" && q.servicePointCode !== filterPoint)
      return false;
    return true;
  });

  // Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredQueues.map((q) => q.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk Actions
  const handleBulkAction = (action: string) => {
    if (!selectedIds.length) return;
    if (!window.confirm(`${action} ${selectedIds.length} items?`)) return;
    (async () => {
      try {
        const res = await fetch(apiPath("/api/staff/queue/bulk"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: action.toLowerCase().replace("bulk ", ""),
            docNos: selectedIds,
          }),
        });
        if (res.ok) {
          if (action === "Bulk Cancel" || action === "Bulk Skip") {
            setQueues(queues.filter((q) => !selectedIds.includes(q.id)));
          }
          setSelectedIds([]);
          return;
        }
      } catch {}
    })();
  };

  // --- Render ---

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] bg-gray-900 text-white p-6">
        <div className="text-center p-8 bg-gray-800 rounded-2xl border border-red-500/50 max-w-md mx-auto">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t("error.title")}</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("error.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (startupStep === "select_profile") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] bg-gray-900 text-white p-6 animate-fade-in">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/50">
              <Server className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">{t("login.title")}</h1>
            <p className="text-gray-400">{t("login.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profiles.map((profile) => (
              <button
                key={profile.code}
                onClick={() => handleProfileSelect(profile.code)}
                className="group bg-gray-800 hover:bg-gray-750 border-2 border-gray-700 hover:border-blue-500 rounded-2xl p-6 transition-all duration-300 text-left relative overflow-hidden shadow-xl"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-gray-700/50 rounded-full flex items-center justify-center text-gray-400 group-hover:text-blue-400 group-hover:bg-blue-600/20 transition-colors">
                    <Server className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-all transform group-hover:translate-x-1" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {profile.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    {profile.agnCode && (
                      <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs font-mono rounded border border-blue-800 uppercase tracking-wider">
                        {profile.agnCode}
                      </span>
                    )}
                    <p className="text-sm text-gray-500 font-mono uppercase tracking-wide">
                      ID: {profile.code}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (startupStep === "select_point") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] bg-gray-900 text-white p-6 animate-fade-in">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {t("login.selectStation")}
            </h1>
            <p className="text-gray-400">{t("login.whereToday")}</p>
            <div className="mt-2 inline-block px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-sm border border-blue-800">
              {profiles.find((p) => p.code === selectedProfileId)?.name}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {workflow?.servicePoints.map((point) => (
              <button
                key={point.code}
                onClick={() => {
                  setFilterPoint(point.code);
                  localStorage.setItem("adaqueue_bulk_point", point.code);
                  setStartupStep("ready");
                }}
                className="flex flex-col items-center justify-center p-6 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all border border-gray-600 hover:border-green-500 group text-center h-32"
              >
                <Monitor className="w-8 h-8 text-gray-400 mb-3 group-hover:text-green-400" />
                <h3 className="font-bold text-white group-hover:text-green-300">
                  {point.name}
                </h3>
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setStartupStep("select_profile");
                setSelectedProfileId("");
                setWorkflow(null);
              }}
              className="text-gray-500 hover:text-white underline text-sm"
            >
              {t("login.switchProfile")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900 overflow-hidden relative transition-colors duration-200">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 py-4 md:py-6 flex-shrink-0 transition-colors duration-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {t("bulk.title")}
                {loading && (
                  <span className="text-sm font-normal text-gray-500">
                    ({t("bulk.loading")})
                  </span>
                )}
              </h1>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1 hidden md:block">
                {t("bulk.subtitle")}
              </p>
            </div>
            {/* Mobile History Toggle */}
            <button
              onClick={() => setHistoryOpen(!isHistoryOpen)}
              className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg bg-gray-50 dark:bg-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </button>
          </div>

          {/* Toolbar */}
          <div className="mt-4 md:mt-6 flex flex-col xl:flex-row gap-4 justify-between">
            {/* Left: Actions */}
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 md:pb-0 items-center">
              {/* Profile Selector */}
              <div className="relative min-w-[200px]">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="" disabled>
                    {t("bulk.selectProfile")}
                  </option>
                  {profiles.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name} {p.agnCode ? `(${p.agnCode})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="px-3 md:px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium flex items-center gap-2 text-sm whitespace-nowrap transition-colors"
                onClick={() => fetchWorkflow(selectedProfileId)}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
                {t("bulk.refresh")}
              </button>
            </div>

            {/* Right: Filters */}
            <div className="flex flex-col md:flex-row gap-2 md:gap-3 flex-1 xl:justify-end">
              {/* Service Group Filter */}
              <div className="relative">
                <LayoutGrid className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="w-full md:w-auto pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm appearance-none"
                >
                  <option value="ALL">{t("bulk.allGroups")}</option>
                  {workflow?.serviceGroups.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Point Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterPoint}
                  onChange={(e) => setFilterPoint(e.target.value)}
                  className="w-full md:w-auto pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm appearance-none"
                >
                  <option value="ALL">{t("bulk.allPoints")}</option>
                  {workflow?.servicePoints
                    .filter(
                      (p) =>
                        filterGroup === "ALL" ||
                        (p.serviceGroups &&
                          p.serviceGroups.includes(filterGroup)),
                    )
                    .map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="relative w-full md:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder={t("bulk.searchTicket")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar (Contextual) */}
        {selectedIds.length > 0 && (
          <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 md:px-8 py-3 flex flex-col md:flex-row items-center justify-between shadow-md animate-fade-in-down gap-3 z-10">
            <div className="flex items-center gap-4">
              <span className="font-bold text-lg">
                {selectedIds.length} {t("bulk.items")}
              </span>
              <span className="text-blue-100 text-sm border-l border-blue-500 pl-4 hidden md:inline">
                {t("bulk.bulkActions")}
              </span>
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => handleBulkAction("Transfer to Zone")}
                className="flex-1 md:flex-none px-3 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  ></path>
                </svg>
                {t("bulk.transfer")}
              </button>
              <button
                onClick={() => handleBulkAction("Bulk Skip")}
                className="flex-1 md:flex-none px-3 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-400 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  ></path>
                </svg>
                {t("bulk.skip")}
              </button>
              <button
                onClick={() => handleBulkAction("Bulk Cancel")}
                className="flex-1 md:flex-none px-3 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-400 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
                {t("actions.cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col min-w-[800px] lg:min-w-0 transition-colors duration-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-700 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        className="rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                        checked={
                          selectedIds.length === filteredQueues.length &&
                          filteredQueues.length > 0
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4">{t("bulk.ticketId")}</th>
                    <th className="px-6 py-4">{t("bulk.customer")}</th>
                    <th className="px-6 py-4">{t("bulk.serviceGroup")}</th>
                    <th className="px-6 py-4">{t("bulk.servicePoint")}</th>
                    <th className="px-6 py-4">{t("bulk.waitTime")}</th>
                    <th className="px-6 py-4">{t("queue.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredQueues.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-gray-400"
                      >
                        {workflow
                          ? t("bulk.noQueues")
                          : t("bulk.selectProfileFirst")}
                      </td>
                    </tr>
                  ) : (
                    filteredQueues.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedIds.includes(item.id) ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-gray-800"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => handleSelectOne(item.id)}
                          />
                        </td>
                        <td className="px-6 py-4 font-mono text-blue-600 dark:text-blue-400 font-bold">
                          {item.ticketNo}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              {item.customerName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Tier: {item.customerTier} / {item.channel}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                            {item.serviceType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {item.servicePoint}
                          </span>
                        </td>
                        <td
                          className={`px-6 py-4 font-mono font-bold ${parseInt(item.waitTime) > 15 ? "text-red-500 dark:text-red-400" : "text-gray-700 dark:text-gray-300"}`}
                        >
                          {item.waitTime}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${item.status === "WAITING" ? "bg-yellow-400" : "bg-blue-500"}`}
                            ></span>
                            <span className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">
                              {item.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-gray-500 dark:text-gray-400 text-sm">
              <span>{t("bulk.showing", { count: filteredQueues.length })}</span>
              <div className="flex gap-1">
                <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    ></path>
                  </svg>
                </button>
                <button className="px-3 py-1 rounded bg-blue-600 text-white">
                  1
                </button>
                <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: History (Responsive) */}
      {isHistoryOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setHistoryOpen(false)}
        ></div>
      )}

      <div
        className={`
        fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:flex lg:flex-col
        ${isHistoryOpen ? "translate-x-0" : "translate-x-full"}
      `}
      >
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-gray-800 dark:text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            {t("bulk.historyLog")}
          </h2>
          <button
            onClick={() => setHistoryOpen(false)}
            className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
          {MOCK_LOGS.map((log) => (
            <div
              key={log.id}
              className="relative pl-6 border-l border-gray-200 dark:border-gray-700"
            >
              <span
                className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 shadow-sm ${
                  log.type === "danger"
                    ? "bg-red-500"
                    : log.type === "warning"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                }`}
              ></span>
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                  {log.user}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {log.timestamp}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                <span
                  className={`${
                    log.type === "danger"
                      ? "text-red-600 dark:text-red-400"
                      : log.type === "warning"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-blue-600 dark:text-blue-400"
                  } font-medium`}
                >
                  {log.action}
                </span>{" "}
                {log.details}
              </p>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium uppercase tracking-wide transition-colors">
            {t("bulk.viewFullReport")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OBulkQueueManagement;
