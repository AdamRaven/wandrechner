"use client";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function ProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(null);
  const [showPageModal, setShowPageModal] = useState(false);
  const [pageName, setPageName] = useState("");

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setProject(data);
      if (data.pages.length > 0 && !activePage) {
        setActivePage(data.pages[0].id);
      } else if (data.pages.length > 0 && activePage) {
        const stillExists = data.pages.find((p) => p.id === activePage);
        if (!stillExists) setActivePage(data.pages[0].id);
      } else {
        setActivePage(null);
      }
    }
    setLoading(false);
  }, [params.id, activePage]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchProject();
  }, [status, router, fetchProject]);

  const currentPage = project?.pages?.find((p) => p.id === activePage);

  // --- Page CRUD ---
  const addPage = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/projects/${params.id}/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: pageName }),
    });
    if (res.ok) {
      const newPage = await res.json();
      setActivePage(newPage.id);
      setShowPageModal(false);
      setPageName("");
      fetchProject();
    }
  };

  const deletePage = async (pageId) => {
    if (!confirm("Seite wirklich löschen?")) return;
    await fetch(`/api/pages/${pageId}`, { method: "DELETE" });
    if (activePage === pageId) setActivePage(null);
    fetchProject();
  };

  // --- Wall CRUD ---
  const addWall = async () => {
    await fetch(`/api/pages/${activePage}/walls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Neue Wand",
        width: 0,
        height: 0,
        count: 1,
      }),
    });
    fetchProject();
  };

  const updateWall = async (wallId, field, value) => {
    const wall = currentPage.walls.find((w) => w.id === wallId);
    await fetch(`/api/walls/${wallId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...wall, [field]: value }),
    });
    fetchProject();
  };

  const deleteWall = async (wallId) => {
    await fetch(`/api/walls/${wallId}`, { method: "DELETE" });
    fetchProject();
  };

  // --- Window CRUD ---
  const addWindow = async () => {
    await fetch(`/api/pages/${activePage}/windows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Neues Fenster",
        width: 0,
        height: 0,
        count: 1,
      }),
    });
    fetchProject();
  };

  const updateWindow = async (windowId, field, value) => {
    const win = currentPage.windows.find((w) => w.id === windowId);
    const updated = { ...win, [field]: value };
    if (field === "manualArea") {
      updated.manualArea = value === "" || value == null ? null : value;
    }
    await fetch(`/api/windows/${windowId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    fetchProject();
  };

  const deleteWindow = async (windowId) => {
    await fetch(`/api/windows/${windowId}`, { method: "DELETE" });
    fetchProject();
  };

  // --- Extra CRUD ---
  const addExtra = async (type = "standard") => {
    const isLeibung = type === "leibung";
    await fetch(`/api/pages/${activePage}/extras`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: isLeibung ? "Fensterleibung" : "Neuer Eintrag",
        type,
        width: null,
        height: null,
        height2: null,
        count: 1,
      }),
    });
    fetchProject();
  };

  const updateExtra = async (extraId, field, value) => {
    const extra = currentPage.extras.find((e) => e.id === extraId);
    const numericFields = ["width", "height", "height2"];
    const updated = { ...extra, [field]: value };
    if (numericFields.includes(field)) {
      updated[field] = value === "" || value == null ? null : value;
    }
    await fetch(`/api/extras/${extraId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    fetchProject();
  };

  const deleteExtra = async (extraId) => {
    await fetch(`/api/extras/${extraId}`, { method: "DELETE" });
    fetchProject();
  };

  // --- Calculation Logic ---
  const calcExtraArea = (extra) => {
    const w = extra.width || 0;
    const h = extra.height || 0;
    const h2 = extra.height2 || 0;
    // Fensterleibung: (höhe + breite + höhe2) × anzahl
    if (extra.type === "leibung") {
      if (h && w && h2) return (h + w + h2) * extra.count;
      if (h && w) return (h + w + h) * extra.count;
      return 0;
    }
    if (w && h && h2) return w * (h + h2) * extra.count;
    if (w && h) return w * h * extra.count;
    if (w) return w * extra.count;
    return 0;
  };
  const calcWallArea = (wall) => wall.width * wall.height * wall.count;

  const calcWindowArea = (win) => {
    // If manual m² is set, use it directly × count
    if (win.manualArea != null && win.manualArea > 0) {
      if (win.manualArea <= 2.5) return 0;
      return win.manualArea * win.count;
    }
    const singleArea = win.width * win.height;
    // If a single window is <= 2.5 sqm, no deduction needed
    if (singleArea <= 2.5) return 0;
    // If > 2.5 sqm, the full area must be deducted
    return singleArea * win.count;
  };

  const getTotalWallArea = (page) =>
    page.walls.reduce((sum, w) => sum + calcWallArea(w), 0);

  const getTotalWindowDeduction = (page) =>
    page.windows.reduce((sum, w) => sum + calcWindowArea(w), 0);

  const getPageTotal = (page) =>
    Math.max(0, getTotalWallArea(page) - getTotalWindowDeduction(page));

  const getProjectTotal = () =>
    project?.pages?.reduce((sum, page) => sum + getPageTotal(page), 0) || 0;

  // --- Text Export ---
  const exportText = () => {
    const pad = (str, len) => String(str).padEnd(len);
    const padR = (str, len) => String(str).padStart(len);
    const line = "=".repeat(60);
    const dash = "-".repeat(60);

    let text = "";
    text += line + "\n";
    text += "  WANDRECHNER PRO - Berechnung\n";
    text += line + "\n";
    text += `Projekt:  ${project.name}\n`;
    text += `Datum:    ${new Date(project.date).toLocaleDateString("de-DE")}\n`;
    text += line + "\n\n";

    project.pages.forEach((page) => {
      text += dash + "\n";
      text += `  Seite: ${page.name}\n`;
      text += dash + "\n\n";

      if (page.walls.length > 0) {
        text += "  WAENDE\n";
        text += "  " + pad("Name", 20) + pad("Breite", 10) + pad("Hoehe", 10) + pad("Anz.", 8) + padR("m²", 10) + "\n";
        text += "  " + "-".repeat(58) + "\n";
        page.walls.forEach((w) => {
          text += "  " + pad(w.name, 20) + pad(w.width.toFixed(2), 10) + pad(w.height.toFixed(2), 10) + pad(w.count, 8) + padR(calcWallArea(w).toFixed(2), 10) + "\n";
        });
        text += "  " + "-".repeat(58) + "\n";
        text += "  " + pad("", 38) + "Gesamt: " + padR(getTotalWallArea(page).toFixed(2) + " m²", 12) + "\n\n";
      }

      if (page.windows.length > 0) {
        text += "  FENSTER\n";
        text += "  " + pad("Name", 20) + pad("m²(man)", 10) + pad("Breite", 10) + pad("Hoehe", 10) + pad("Anz.", 8) + padR("Abzug m²", 10) + "\n";
        text += "  " + "-".repeat(68) + "\n";
        page.windows.forEach((w) => {
          const hasManual = w.manualArea != null && w.manualArea > 0;
          const singleArea = hasManual ? w.manualArea : w.width * w.height;
          const deduction = calcWindowArea(w);
          const display = singleArea <= 2.5 ? "0.00 (<=2.5)" : deduction.toFixed(2);
          const manualDisplay = hasManual ? w.manualArea.toFixed(2) : "";
          text += "  " + pad(w.name, 20) + pad(manualDisplay, 10) + pad(w.width.toFixed(2), 10) + pad(w.height.toFixed(2), 10) + pad(w.count, 8) + padR(display, 10) + "\n";
        });
        text += "  " + "-".repeat(58) + "\n";
        text += "  " + pad("", 38) + "Abzug:  " + padR(getTotalWindowDeduction(page).toFixed(2) + " m²", 12) + "\n";
        text += "  (Fenster <= 2.5 m² pro Stueck = kein Abzug)\n\n";
      }

      if (page.extras.length > 0) {
        text += "  EXTRAS (nur Info)\n";
        text += "  " + pad("Name", 20) + pad("Typ", 10) + pad("Breite", 10) + pad("Hoehe", 10) + pad("Hoehe 2", 10) + pad("Anz.", 8) + padR("m²", 10) + "\n";
        text += "  " + "-".repeat(78) + "\n";
        page.extras.forEach((e) => {
          const area = calcExtraArea(e);
          const typ = e.type === "leibung" ? "Leibung" : "";
          text += "  " + pad(e.name, 20) + pad(typ, 10) + pad(e.width != null ? e.width.toFixed(2) : "—", 10) + pad(e.height != null ? e.height.toFixed(2) : "—", 10) + pad(e.height2 != null ? e.height2.toFixed(2) : "—", 10) + pad(e.count, 8) + padR(area > 0 ? area.toFixed(2) : "—", 10) + "\n";
        });
        text += "\n";
      }

      text += `  >> Seite "${page.name}" Gesamt: ${getPageTotal(page).toFixed(2)} m²\n\n`;
    });

    text += line + "\n";
    text += `  GESAMTFLAECHE:  ${getProjectTotal().toFixed(2)} m²\n`;
    text += line + "\n";

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "_")}_Berechnung.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Projekt nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                {project.name}
              </h1>
              <p className="text-xs text-gray-400">
                {new Date(project.date).toLocaleDateString("de-DE")}
              </p>
            </div>
          </div>

          <button
            onClick={exportText}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition cursor-pointer"
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
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar: Pages */}
        <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Seiten
              </h2>
              <button
                onClick={() => setShowPageModal(true)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                title="Neue Seite"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>

            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {project.pages.map((page) => (
                <div
                  key={page.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition whitespace-nowrap flex-shrink-0 ${
                    activePage === page.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => setActivePage(page.id)}
                >
                  <span className="text-sm font-medium flex-1 truncate">
                    {page.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePage(page.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer opacity-0 group-hover:opacity-100"
                    style={{ opacity: activePage === page.id ? 1 : undefined }}
                    title="Seite löschen"
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
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              {project.pages.length === 0 && (
                <p className="text-sm text-gray-400 py-2">
                  Noch keine Seiten vorhanden
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-auto">
          {!currentPage ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">
                Erstelle eine Seite um zu beginnen
              </p>
              <button
                onClick={() => setShowPageModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition cursor-pointer"
              >
                Seite erstellen
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Walls Section */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z"
                      />
                    </svg>
                    Wände
                  </h3>
                  <button
                    onClick={addWall}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
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
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Wand hinzufügen
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[140px]">
                            Name
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[100px]">
                            Breite (m)
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[100px]">
                            Höhe (m)
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[80px]">
                            Anzahl
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500 min-w-[100px]">
                            m²
                          </th>
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPage.walls.map((wall) => (
                          <tr
                            key={wall.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                defaultValue={wall.name}
                                onBlur={(e) =>
                                  updateWall(wall.id, "name", e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={wall.width}
                                onBlur={(e) =>
                                  updateWall(wall.id, "width", e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={wall.height}
                                onBlur={(e) =>
                                  updateWall(wall.id, "height", e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                min="1"
                                defaultValue={wall.count}
                                onBlur={(e) =>
                                  updateWall(wall.id, "count", e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition"
                              />
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-gray-900">
                              {calcWallArea(wall).toFixed(2)}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => deleteWall(wall.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
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
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {currentPage.walls.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-8 text-center text-gray-400"
                            >
                              Noch keine Wände hinzugefügt
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {currentPage.walls.length > 0 && (
                        <tfoot>
                          <tr className="bg-blue-50 border-t border-blue-100">
                            <td
                              colSpan={4}
                              className="px-4 py-3 text-right font-semibold text-blue-700"
                            >
                              Wände Gesamt:
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-blue-700">
                              {getTotalWallArea(currentPage).toFixed(2)} m²
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </section>

              {/* Windows Section */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-amber-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                      />
                    </svg>
                    Fenster
                  </h3>
                  <button
                    onClick={addWindow}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
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
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Fenster hinzufügen
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[140px]">
                            Name
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[90px]">
                            m² (manuell)
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[100px]">
                            Breite (m)
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[100px]">
                            Höhe (m)
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[80px]">
                            Anzahl
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500 min-w-[120px]">
                            Abzug m²
                          </th>
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPage.windows.map((win) => {
                          const hasManual = win.manualArea != null && win.manualArea > 0;
                          const singleArea = hasManual ? win.manualArea : win.width * win.height;
                          const deduction = calcWindowArea(win);
                          return (
                            <tr
                              key={win.id}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  defaultValue={win.name}
                                  onBlur={(e) =>
                                    updateWindow(
                                      win.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none transition"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  defaultValue={win.manualArea ?? ""}
                                  onBlur={(e) =>
                                    updateWindow(
                                      win.id,
                                      "manualArea",
                                      e.target.value
                                    )
                                  }
                                  placeholder="—"
                                  className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none transition"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  defaultValue={win.width}
                                  onBlur={(e) =>
                                    updateWindow(
                                      win.id,
                                      "width",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none transition"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  defaultValue={win.height}
                                  onBlur={(e) =>
                                    updateWindow(
                                      win.id,
                                      "height",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none transition"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <input
                                  type="number"
                                  min="1"
                                  defaultValue={win.count}
                                  onBlur={(e) =>
                                    updateWindow(
                                      win.id,
                                      "count",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none transition"
                                />
                              </td>
                              <td className="px-4 py-2 text-right">
                                {singleArea <= 2.5 ? (
                                  <span className="text-green-600 font-medium">
                                    0.00
                                    <span className="text-xs text-gray-400 block">
                                      ≤ 2.5 m²
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-red-600 font-medium">
                                    -{deduction.toFixed(2)}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <button
                                  onClick={() => deleteWindow(win.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
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
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {currentPage.windows.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-8 text-center text-gray-400"
                            >
                              Noch keine Fenster hinzugefügt
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {currentPage.windows.length > 0 && (
                        <tfoot>
                          <tr className="bg-amber-50 border-t border-amber-100">
                            <td
                              colSpan={5}
                              className="px-4 py-3 text-right font-semibold text-amber-700"
                            >
                              Fenster Abzug Gesamt:
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-amber-700">
                              -
                              {getTotalWindowDeduction(currentPage).toFixed(2)}{" "}
                              m²
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-700">
                    <strong>Hinweis:</strong> Fenster ≤ 2,5 m² (pro Stück)
                    werden nicht abgezogen, da keine zusätzliche Isolierung nötig
                    ist. Fenster &gt; 2,5 m² werden von der Wandfläche
                    abgezogen.
                  </p>
                </div>
              </section>

              {/* Extras Section */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-violet-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                    Extras
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addExtra("standard")}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-violet-600 hover:bg-violet-50 rounded-lg transition cursor-pointer"
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
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Eintrag
                    </button>
                    <button
                      onClick={() => addExtra("leibung")}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
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
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Leibung
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[140px]">
                            Name
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[100px]">
                            Breite (m)
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[100px]">
                            Höhe (m)
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[100px]">
                            Höhe 2 (m)
                          </th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[80px]">
                            Anzahl
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500 min-w-[120px]">
                            Formel / m²
                          </th>
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentPage.extras.map((extra) => (
                          <tr
                            key={extra.id}
                            className={`border-b border-gray-100 hover:bg-gray-50 ${
                              extra.type === "leibung" ? "bg-emerald-50/40" : ""
                            }`}
                          >
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1">
                                {extra.type === "leibung" && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">L</span>
                                )}
                                <input
                                  type="text"
                                  defaultValue={extra.name}
                                  onBlur={(e) =>
                                    updateExtra(extra.id, "name", e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200 outline-none transition"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={extra.width ?? ""}
                                onBlur={(e) =>
                                  updateExtra(extra.id, "width", e.target.value)
                                }
                                placeholder="—"
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200 outline-none transition"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={extra.height ?? ""}
                                onBlur={(e) =>
                                  updateExtra(extra.id, "height", e.target.value)
                                }
                                placeholder="—"
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200 outline-none transition"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={extra.height2 ?? ""}
                                onBlur={(e) =>
                                  updateExtra(extra.id, "height2", e.target.value)
                                }
                                placeholder={extra.type === "leibung" ? "= Höhe" : "—"}
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200 outline-none transition"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                min="1"
                                defaultValue={extra.count}
                                onBlur={(e) =>
                                  updateExtra(extra.id, "count", e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 focus:border-violet-400 focus:ring-1 focus:ring-violet-200 outline-none transition"
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <span className="font-medium text-gray-900">
                                {calcExtraArea(extra) > 0 ? calcExtraArea(extra).toFixed(2) : "—"}
                              </span>
                              {extra.type === "leibung" && calcExtraArea(extra) > 0 && (
                                <span className="block text-[10px] text-gray-400">(H+B+H2)×Anz</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                onClick={() => deleteExtra(extra.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
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
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {currentPage.extras.length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-8 text-center text-gray-400"
                            >
                              Noch keine Extras hinzugefügt
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-2 p-3 bg-violet-50 rounded-xl border border-violet-100">
                  <p className="text-xs text-violet-700">
                    <strong>Info:</strong> Extras dienen nur zur Information und
                    fließen nicht in die Flächenberechnung ein.
                    <strong> Leibung</strong>-Einträge rechnen (Höhe + Breite + Höhe 2) × Anzahl. Wenn Höhe 2 leer ist, wird Höhe verwendet.
                  </p>
                </div>
              </section>

              {/* Page Summary */}
              <section className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Seite &quot;{currentPage.name}&quot;
                    </h4>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                      <span className="text-gray-600">
                        Wände:{" "}
                        <strong>
                          {getTotalWallArea(currentPage).toFixed(2)} m²
                        </strong>
                      </span>
                      <span className="text-gray-600">
                        Abzug:{" "}
                        <strong className="text-red-500">
                          -
                          {getTotalWindowDeduction(currentPage).toFixed(2)} m²
                        </strong>
                      </span>
                    </div>
                  </div>
                  <div className="bg-blue-50 px-5 py-3 rounded-xl text-right">
                    <p className="text-xs text-blue-500 font-medium">
                      Seiten-Total
                    </p>
                    <p className="text-2xl font-bold text-blue-700">
                      {getPageTotal(currentPage).toFixed(2)} m²
                    </p>
                  </div>
                </div>
              </section>

              {/* Project Total */}
              <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 sm:p-6 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-blue-100 text-sm font-medium">
                      Gesamtes Projekt
                    </h4>
                    <p className="text-blue-200 text-sm mt-1">
                      Alle Seiten zusammengerechnet
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-200 text-xs font-medium">
                      GESAMTFLÄCHE
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold">
                      {getProjectTotal().toFixed(2)} m²
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Add Page Modal */}
      {showPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPageModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Neue Seite</h3>
              <button
                onClick={() => setShowPageModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
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
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={addPage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seitenname
                </label>
                <input
                  type="text"
                  value={pageName}
                  onChange={(e) => setPageName(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                  placeholder="z.B. Erdgeschoss, Obergeschoss..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPageModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition cursor-pointer"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
