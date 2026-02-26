import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Monitor,
  Server,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import OQueueBoard from "../../components/queue/OQueueBoard";
import { apiPath } from "../../config/api";
import { io, Socket } from "socket.io-client";

// --- Types ---
interface IProfileOption {
  code: string;
  name: string;
  agnCode?: string;
  description?: string;
}

interface IDisplayBoardDefinition {
  code: string;
  name: string;
  description?: string;
  title?: string;
  visibleServiceGroups: string[];
}

interface IServiceGroup {
  code: string;
  name: string;
  description?: string;
  priority?: string;
  initialState?: string;
  states?: Record<string, any>;
}

const ODisplayBoard: React.FC = () => {
  const { t } = useTranslation("common");
  // --- State ---
  const [startupStep, setStartupStep] = useState<
    "init" | "select_profile" | "select_board" | "ready"
  >("init");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [selectedBoard, setSelectedBoard] =
    useState<IDisplayBoardDefinition | null>(null);

  // Data State
  const [availableProfiles, setAvailableProfiles] = useState<IProfileOption[]>(
    [],
  );
  const [availableBoards, setAvailableBoards] = useState<
    IDisplayBoardDefinition[]
  >([]);
  const [serviceGroups, setServiceGroups] = useState<IServiceGroup[]>([]);
  const [businessType, setBusinessType] = useState<string>("1"); // '1' = flow steps, '2' = 3-column fixed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queues, setQueues] = useState<any[]>([]); // Real Queue Data

  // --- Effects ---

  // 1. Initial Startup Check
  useEffect(() => {
    const initStartup = async () => {
      // 1. Load Profiles first
      const profiles = await loadProfiles();

      // Strict Mode: Mandatory Two-Step Selection (No Auto-Select)
      if (profiles.length > 0) {
        setStartupStep("select_profile");
      }
    };
    initStartup();
  }, []);

  // Helper to check board step
  const checkBoardStep = async (profileId: string) => {
    setSelectedProfileId(profileId);
    const boards = await loadWorkflowForProfile(profileId);
    setAvailableBoards(boards);

    // Mandatory Two-Step Selection: Do NOT auto-select board
    setStartupStep("select_board");
  };

  // 2. Real-time updates via WebSocket
  useEffect(() => {
    if (startupStep !== "ready" || !selectedProfileId) return;

    const fetchQueues = async () => {
      const url = apiPath(`/api/queue/profile/${selectedProfileId}`);
      const startTime = performance.now();
      console.groupCollapsed(`🟢 GET ${url}`);
      console.log("📤 REQUEST:", {
        method: "GET",
        url,
        params: { profileId: selectedProfileId },
        timestamp: new Date().toISOString(),
      });
      try {
        const res = await fetch(url);
        const duration = Math.round(performance.now() - startTime);
        console.log("📥 RESPONSE:", {
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
          duration: `${duration}ms`,
          headers: { "content-type": res.headers.get("content-type") },
        });
        if (res.ok) {
          const data = await res.json();
          console.log("📦 RESPONSE DATA:", data);
          const mapped = data.map((q: any) => {
            let embedded: any = {};
            try {
              if (q.data && typeof q.data === "object") embedded = q.data;
              else if (q.dataString) embedded = JSON.parse(q.dataString);
            } catch {}
            const label = q.docNo;
            const serviceGroup = q.queueType || "General";
            return {
              docNo: q.docNo,
              queueNo: label,
              ticketNo: q.ticketNo || "",
              status: q.status,
              serviceGroup: serviceGroup,
              queueType: q.queueType || "",
              refId: q.refId || embedded.counter || "",
              refType: q.refType || "",
              checkInTime: q.checkInTime || new Date().toISOString(),
              queueDate: q.date,
              counter: embedded.counter ?? "-",
            };
          });
          // Sort oldest-first using queueDate, fallback to checkInTime
          mapped.sort(
            (a: any, b: any) =>
              new Date(a.queueDate).getTime() - new Date(b.queueDate).getTime(),
          );
          console.log("✅ SUCCESS: Mapped", mapped.length, "queues");
          console.groupEnd();
          setQueues(mapped);
        } else {
          console.error("❌ FAILED:", res.status, res.statusText);
          console.groupEnd();
        }
      } catch (e) {
        console.error("❌ ERROR:", e);
        console.groupEnd();
      }
    };

    const base = (process.env.REACT_APP_API_BASE || "").trim();
    const url =
      base && base.startsWith("http")
        ? base.replace(/\/+$/, "")
        : window.location.origin;
    const socket: Socket = io(`${url}/ws`, {
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: true,
      withCredentials: false,
      reconnection: true,
    });

    const handler = (evt: any) => {
      fetchQueues();
    };

    socket.on("queue:update", handler);
    fetchQueues();

    return () => {
      socket.off("queue:update", handler);
      socket.disconnect();
    };
  }, [startupStep, selectedProfileId]);

  // --- Logic ---

  const loadProfiles = async (): Promise<IProfileOption[]> => {
    const url = apiPath("/api/profile");
    const startTime = performance.now();

    console.groupCollapsed(`🔵 GET ${url}`);
    console.log("📤 REQUEST:", {
      method: "GET",
      url: url,
      timestamp: new Date().toISOString(),
    });

    try {
      const res = await fetch(url);
      const duration = Math.round(performance.now() - startTime);
      const contentType = res.headers.get("content-type");

      console.log("📥 RESPONSE:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        duration: `${duration}ms`,
        headers: {
          "content-type": contentType,
        },
      });

      if (res.ok) {
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await res.json();
          console.log("📦 RESPONSE DATA:", data);

          // Map to IProfileOption
          const profiles: IProfileOption[] = data.map((p: any) => ({
            code: p.code,
            name: p.name,
            agnCode: p.agnCode,
            description: p.name, // Use name as description if not available
          }));
          setAvailableProfiles(profiles);
          console.log("✅ SUCCESS: Loaded", profiles.length, "profiles");
          console.groupEnd();
          return profiles;
        } else {
          console.error("❌ FAILED: Received non-JSON response");
          console.groupEnd();
          setError("Backend connection failed. Invalid response format.");
        }
      } else {
        console.error(`❌ FAILED: ${res.status} ${res.statusText}`);
        console.groupEnd();
        setError(`Failed to load profiles: ${res.status}`);
      }
    } catch (e) {
      console.error("❌ ERROR:", e);
      console.groupEnd();
      setError("Network error connecting to backend.");
    }
    return [];
  };

  const loadWorkflowForProfile = async (
    profileId: string,
  ): Promise<IDisplayBoardDefinition[]> => {
    setLoading(true);
    const url = apiPath(`/api/workflow-designer/${profileId}`);
    const startTime = performance.now();

    console.groupCollapsed(`🟣 GET ${url}`);
    console.log("📤 REQUEST:", {
      method: "GET",
      url: url,
      params: { profileId },
      timestamp: new Date().toISOString(),
    });

    try {
      const res = await fetch(url);
      const duration = Math.round(performance.now() - startTime);

      console.log("📥 RESPONSE:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        duration: `${duration}ms`,
        headers: {
          "content-type": res.headers.get("content-type"),
        },
      });

      if (res.ok) {
        const workflow = await res.json();
        console.log("📦 RESPONSE DATA:", workflow);
        console.log("📊 SUMMARY:", {
          profileId: workflow.profileId,
          profileName: workflow.profileName,
          serviceGroups: workflow.serviceGroups?.length || 0,
          displayBoards: workflow.displayBoards?.length || 0,
        });
        console.log(
          "✅ SUCCESS: Workflow loaded with",
          workflow.displayBoards?.length || 0,
          "display boards",
        );
        console.groupEnd();

        // Save workflow data including serviceGroups
        localStorage.setItem(
          `adaqueue_workflow_${profileId}`,
          JSON.stringify(workflow),
        );

        // Store serviceGroups and businessType for later use
        if (workflow.serviceGroups) {
          setServiceGroups(workflow.serviceGroups);
        }

        // businessType '1' = flow steps columns, '2' = 3-column fixed layout
        setBusinessType(workflow.businessType || "1");

        setLoading(false);
        return workflow.displayBoards || [];
      } else {
        console.error("❌ FAILED:", res.status, res.statusText);
        console.groupEnd();
        setError("Failed to load workflow configuration.");
      }
    } catch (e) {
      console.error("❌ ERROR:", e);
      console.groupEnd();
      setError("Network error loading workflow.");
    }
    setLoading(false);
    return [];
  };

  const handleProfileSelect = async (profileId: string) => {
    localStorage.setItem("adaqueue_board_profile_id", profileId);
    await checkBoardStep(profileId);
  };

  const handleBoardSelect = (board: IDisplayBoardDefinition) => {
    if (!selectedProfileId) return;
    setSelectedBoard(board);

    // Save Config
    localStorage.setItem("adaqueue_board_code", board.code);
    localStorage.setItem("adaqueue_board_name", board.name); // For easy access

    setStartupStep("ready");
  };

  const handleResetConfig = () => {
    if (window.confirm("Reset Display Board configuration?")) {
      localStorage.removeItem("adaqueue_board_profile_id");
      localStorage.removeItem("adaqueue_board_code");
      setStartupStep("select_profile");
      loadProfiles();
    }
  };

  // --- Render ---

  if (startupStep === "ready" && selectedBoard) {
    // Get visible service group codes
    const visibleGroupCodes = selectedBoard.visibleServiceGroups || [];

    // Helper function to get service group name from code
    const getServiceGroupName = (code: string): string => {
      const group = serviceGroups.find((sg) => sg.code === code);
      return group?.name || code;
    };

    // Hidden reset button (shared)
    const ResetButton = () => (
      <div className="absolute top-0 left-0 w-16 h-16 z-50 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={handleResetConfig}
          className="bg-red-600 text-white text-xs p-2 rounded shadow-lg m-2 hover:bg-red-700 transition-colors"
        >
          {t("board.resetConfig")}
        </button>
      </div>
    );

    // ─── Business Type 1: Flow Steps Columns ───────────────────────────────
    if (businessType === "1") {
      const singleGroupCode = visibleGroupCodes[0];
      const singleGroup = singleGroupCode
        ? serviceGroups.find((sg) => sg.code === singleGroupCode)
        : null;

      // Fallback: if no state info, show plain waiting list
      if (!singleGroup || !singleGroup.states) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-2">
            <ResetButton />
            <div className="flex gap-2 h-full">
              <OQueueBoard
                queues={queues.filter((q) =>
                  visibleGroupCodes.includes(q.serviceGroup),
                )}
                leftTitle={t("queueBoard.waitingQueue")}
                title={t("queueBoard.waitingQueue")}
              />
            </div>
          </div>
        );
      }

      // แสดงเฉพาะ states ที่ไม่ใช่ FINAL (ไม่แสดง column เสร็จสิ้น)
      const stateEntries = Object.entries(singleGroup.states).filter(
        ([, stateData]: [string, any]) => stateData?.type !== "FINAL",
      );

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-2">
          <ResetButton />
          <div className="flex gap-2 h-full">
            {stateEntries.map(([stateCode, stateData]: [string, any]) => {
              const code = (stateData?.code || stateCode || "")
                .toString()
                .toUpperCase();
              const stateQueues = queues.filter((q) => {
                const s = (q.status || "").toString().toUpperCase();
                const inGroup =
                  visibleGroupCodes.length === 1
                    ? q.serviceGroup === visibleGroupCodes[0]
                    : true;
                return inGroup && (s === code || s.startsWith(code));
              });
              return (
                <OQueueBoard
                  key={stateCode}
                  queues={stateQueues}
                  leftTitle={stateData.label || stateCode}
                  title={stateData.label || stateCode}
                  displayMode="all"
                />
              );
            })}
          </div>
        </div>
      );
    }

    // ─── Business Type 2: 3 Fixed Columns ──────────────────────────────────

    // คำนวณ active statuses แบบ dynamic จาก NORMAL states ของทุก service group ที่ visible
    // ครอบคลุม STATE_2, STATE_3, STATE_N ทุกตัวโดยอัตโนมัติ
    const baseActiveStatuses = ["CALLING", "SERVING", "IN_PROGRESS", "IN_ROOM"];
    const normalStateCodes = serviceGroups
      .filter((sg) => visibleGroupCodes.includes(sg.code))
      .flatMap((sg) => Object.entries(sg.states || {}))
      .filter(([, stateData]: [string, any]) => stateData?.type === "NORMAL")
      .map(([code]) => code);
    const activeStatuses = Array.from(
      new Set([...baseActiveStatuses, ...normalStateCodes]),
    );

    const isActiveQueue = (q: any) =>
      activeStatuses.includes(q.status) &&
      visibleGroupCodes.includes(q.serviceGroup);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-2">
        <ResetButton />
        <div className="flex gap-2 h-full">
          {/* Column 1: Waiting Queue */}
          <OQueueBoard
            queues={queues.filter((q) =>
              visibleGroupCodes.includes(q.serviceGroup),
            )}
            leftTitle={t("queueBoard.waitingQueue")}
            title={t("queueBoard.waitingQueue")}
          />

          {/* Column 2: In Progress */}
          <OQueueBoard
            queues={queues.filter(isActiveQueue)}
            leftTitle={t("queueBoard.inProgress")}
            title={t("queueBoard.inProgress")}
            displayMode="all"
          />

          {/* Column 3: Service Counter */}
          <OQueueBoard
            queues={queues.filter(isActiveQueue).map((q) => {
              const label =
                q.refId ||
                q.counter ||
                q.refType ||
                getServiceGroupName(q.serviceGroup);
              return { ...q, queueNo: label, ticketNo: "" };
            })}
            leftTitle={t("queueBoard.serviceCounter")}
            title={t("queueBoard.serviceCounter")}
            displayMode="all"
          />
        </div>
      </div>
    );
  }

  // --- Render ---

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center p-8 bg-gray-800 rounded-2xl border border-red-500/50 max-w-md mx-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t("board.systemError")}</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("board.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (startupStep === "select_profile") {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8 animate-fade-in">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-900/50">
            <Server className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t("board.selectEnvironment")}
          </h1>
          <p className="text-gray-400">{t("board.selectEnvironmentDesc")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          {availableProfiles.map((profile) => (
            <button
              key={profile.code}
              onClick={() => handleProfileSelect(profile.code)}
              className="group bg-gray-800 hover:bg-gray-750 border-2 border-gray-700 hover:border-blue-500 rounded-2xl p-8 transition-all duration-300 text-left relative overflow-hidden shadow-xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center text-gray-400 group-hover:text-blue-400 group-hover:bg-blue-600/20 transition-colors">
                  <Server className="w-6 h-6" />
                </div>
                <ArrowRight className="w-6 h-6 text-gray-600 group-hover:text-blue-500 transition-all transform group-hover:translate-x-1" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
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
    );
  }

  if (startupStep === "select_board") {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 animate-fade-in">
        <button
          onClick={() => setStartupStep("select_profile")}
          className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          ← {t("board.backToProfiles")}
        </button>

        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-pink-900/50">
            <Monitor className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {t("board.selectDisplayBoard")}
          </h1>
          <p className="text-gray-400 text-lg">
            {t("board.selectDisplayBoardDesc")}
          </p>
        </div>

        {loading ? (
          <div className="text-white">{t("board.loadingConfig")}</div>
        ) : availableBoards.length === 0 ? (
          <div className="text-center bg-gray-800 p-8 rounded-xl border border-dashed border-gray-700 max-w-md">
            <Monitor className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {t("board.noBoardsFound")}
            </h3>
            <p className="text-gray-400 mb-6">{t("board.noBoardsDesc")}</p>
            <button
              onClick={() => setStartupStep("select_profile")}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
            >
              {t("board.chooseDifferentProfile")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
            {availableBoards.map((board) => (
              <button
                key={board.code}
                onClick={() => handleBoardSelect(board)}
                className="group bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-pink-500 rounded-2xl p-6 text-left transition-all duration-300 shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gray-700 group-hover:bg-pink-600/20 flex items-center justify-center transition-colors">
                    <Monitor className="w-6 h-6 text-gray-400 group-hover:text-pink-400" />
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-gray-700 group-hover:text-pink-500 opacity-0 group-hover:opacity-100 transition-all" />
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {board.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {board.description || t("board.noDescription")}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-gray-900 rounded text-xs font-mono text-gray-500 border border-gray-700">
                      {board.code}
                    </span>
                    {board.visibleServiceGroups?.length > 0 && (
                      <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded text-xs font-bold border border-blue-900/50">
                        {board.visibleServiceGroups.length} {t("board.queues")}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
      {t("board.loading")}
    </div>
  );
};

export default ODisplayBoard;
