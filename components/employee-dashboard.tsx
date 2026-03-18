"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePlus,
  FilePlus2,
  FileText,
  Home,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

import ReportDetails from "@/components/report-details";
import ReportForm from "@/components/report-form";
import StudentTracker from "@/components/student-tracker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTelegramBackButton } from "@/hooks/use-telegram-back-button";
import type { User } from "@/lib/types";
import { normalizeText } from "@/lib/utils";

interface EmployeeDashboardProps {
  user: User;
}

const slideUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
  transition: { duration: 0.2 },
};

export default function EmployeeDashboard({ user }: EmployeeDashboardProps) {
  const [showReportForm, setShowReportForm] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [userReports, setUserReports] = useState<any[]>([]);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const asArray = <T,>(value: unknown): T[] =>
    Array.isArray(value) ? value : [];

  const debugLog = async (message: string, data?: any) => {
    try {
      await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          level: "info",
          component: "EmployeeDashboard",
          data,
        }),
      });
    } catch (err) {
      console.error("Debug log failed:", err);
    }
  };

  const refreshData = async () => {
    try {
      const [reportsRes, teamsRes, templatesRes] = await Promise.all([
        fetch("/api/reports"),
        fetch("/api/teams"),
        fetch("/api/templates"),
      ]);

      const reportsData = await reportsRes.json();
      const teamsData = await teamsRes.json();
      const templatesData = await templatesRes.json();

      const fetchedReports = asArray<any>(reportsData?.reports);
      const allTeams = asArray<any>(teamsData?.teams);
      const allTemplates = asArray<any>(templatesData?.templates);

      const reportsWithDates = fetchedReports.map((report: any) => ({
        ...report,
        createdAt: new Date(report.createdAt),
        updatedAt: new Date(report.updatedAt),
      }));

      const userReportsFiltered = reportsWithDates.filter(
        (report: any) => report.userId === user.telegramId,
      );

      setAllReports(reportsWithDates);
      setUserReports(userReportsFiltered);
      setTeams(allTeams);
      setTemplates(allTemplates);
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        await debugLog("Starting fetchData", { userId: user.telegramId });

        const [reportsRes, teamsRes, templatesRes] = await Promise.all([
          fetch("/api/reports"),
          fetch("/api/teams"),
          fetch("/api/templates"),
        ]);

        await debugLog("API responses received", {
          reportsStatus: reportsRes.status,
          teamsStatus: teamsRes.status,
          templatesStatus: templatesRes.status,
        });

        const reportsData = await reportsRes.json();
        const teamsData = await teamsRes.json();
        const templatesData = await templatesRes.json();

        await debugLog("Data parsed", {
          reportsCount: asArray<any>(reportsData?.reports).length,
          teamsCount: asArray<any>(teamsData?.teams).length,
          templatesCount: asArray<any>(templatesData?.templates).length,
        });

        const fetchedReports = asArray<any>(reportsData?.reports);
        const allTeams = asArray<any>(teamsData?.teams);
        const allTemplates = asArray<any>(templatesData?.templates);

        const reportsWithDates = fetchedReports.map((report: any) => ({
          ...report,
          createdAt: new Date(report.createdAt),
          updatedAt: new Date(report.updatedAt),
        }));

        const userReportsFiltered = reportsWithDates.filter(
          (report: any) => report.userId === user.telegramId,
        );

        setAllReports(reportsWithDates);
        setUserReports(userReportsFiltered);
        setTeams(allTeams);
        setTemplates(allTemplates);
        setLoading(false);

        await debugLog("State updated successfully");
      } catch (error) {
        await debugLog("Error in fetchData", { error: error?.toString() });
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    }

    fetchData();
  }, [user.telegramId]);

  // Scroll to top only when entering child views, not on tab switches
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [showTemplateSelection, showReportForm, selectedReportId]);

  const userTeam = teams.find((team: any) => team.id === user.teamId);
  const userTeamName = normalizeText(userTeam?.name || "No team assigned");
  const teamReports = user.teamId
    ? allReports.filter((report: any) => report.teamId === user.teamId)
    : [];
  const totalPages = Math.ceil(userReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = userReports.slice(startIndex, endIndex);
  const recentReports = userReports.slice(0, 3);
  const userTeamTemplates = userTeam?.templateIds
    ? templates.filter((template: any) =>
        userTeam.templateIds.includes(template.id),
      )
    : [];
  const studentTrackerTemplate = userTeamTemplates.find(
    (template: any) => template.isStudentTracker,
  );

  const stats = {
    totalReports: userReports.length,
    teamReports: teamReports.length,
  };

  const isInChildView = showTemplateSelection || showReportForm || !!selectedReportId;
  useTelegramBackButton(
    isInChildView,
    () => {
      if (showReportForm) {
        setShowReportForm(false);
        setSelectedTemplateId(null);
      } else if (showTemplateSelection) {
        setShowTemplateSelection(false);
        setSelectedTemplateId(null);
      } else if (selectedReportId) {
        setSelectedReportId(null);
      }
    },
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Determine which view key to use for AnimatePresence
  const viewKey = showReportForm
    ? "reportForm"
    : showTemplateSelection
    ? "templateSelection"
    : selectedReportId
    ? "reportDetails"
    : `main-${activeSection}`;

  // Whether to show bottom nav (show on main views AND template selection)
  const showBottomNav = !showReportForm && !selectedReportId;

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-32">
      <AnimatePresence mode="wait">
        {showReportForm ? (
          <motion.div
            key="reportForm"
            {...slideUp}
            className="mx-auto max-w-2xl"
          >
            <ReportForm
              user={user}
              templateId={selectedTemplateId}
              onCancel={() => {
                setShowReportForm(false);
                setSelectedTemplateId(null);
              }}
              onSuccess={async () => {
                setShowReportForm(false);
                setSelectedTemplateId(null);
                await refreshData();
              }}
            />
          </motion.div>
        ) : showTemplateSelection ? (
          <motion.div
            key="templateSelection"
            {...slideUp}
            className="mx-auto max-w-2xl"
          >
            <div className="space-y-6">
              <div>
                <h2 className="font-heading text-2xl font-bold tracking-tight">
                  Select Template
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose the structure you want to submit.
                </p>
              </div>

              {userTeamTemplates.length === 0 ? (
                <Card className="surface-panel border-glass-border">
                  <CardContent className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[calc(var(--radius)+4px)] bg-muted/40">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-heading text-lg font-medium">
                      No Templates
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Your team does not have any templates assigned yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 stagger-children">
                  {userTeamTemplates.map((template: any) => (
                    <Card
                      key={template.id}
                      className="surface-panel card-interactive cursor-pointer border-glass-border/80 hover:border-primary/30 transition-all active:scale-[0.98]"
                      onClick={() => {
                        setSelectedTemplateId(template.id);
                        setShowTemplateSelection(false);
                        setShowReportForm(true);
                      }}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--radius)+2px)] bg-primary/12 text-primary">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="font-heading text-base leading-snug">
                              {normalizeText(template.name)}
                            </CardTitle>
                            <CardDescription className="mt-1 line-clamp-2 text-xs leading-relaxed">
                              {normalizeText(template.description) ||
                                "No description"}
                            </CardDescription>
                            <span className="mt-3 inline-flex items-center rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                              {template.questions?.length || 0} fields
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : selectedReportId ? (
          <motion.div
            key="reportDetails"
            {...slideUp}
            className="mx-auto max-w-4xl"
          >
            <ReportDetails
              reportId={selectedReportId}
              onBack={() => setSelectedReportId(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key={`main-${activeSection}`}
            {...slideUp}
            className="space-y-6"
          >
            {activeSection === "overview" ? (
              <div className="space-y-5">
                <Card className="surface-panel overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card/90 to-card/70">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                      <div className="space-y-2">
                        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                          User Dashboard
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          Submit your reports
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                        <div className="rounded-[calc(var(--radius)+4px)] border border-border/70 bg-background/70 p-4 backdrop-blur-sm card-interactive">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              My Reports
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-[calc(var(--radius)+1px)] bg-chart-2/12 text-chart-2">
                              <FileText className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="font-heading text-3xl font-bold tracking-tight">
                            {stats.totalReports}
                          </div>
                        </div>

                        <div className="rounded-[calc(var(--radius)+4px)] border border-border/70 bg-background/70 p-4 backdrop-blur-sm card-interactive">
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Team Reports
                            </span>
                            <div className="flex h-8 w-8 items-center justify-center rounded-[calc(var(--radius)+1px)] bg-success/12 text-success">
                              <Users className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="font-heading text-3xl font-bold tracking-tight">
                            {stats.teamReports}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="surface-panel border-primary/20">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-heading text-lg font-semibold">
                        Ready to submit?
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Use the centered action below to create a new report
                        without leaving this screen.
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowTemplateSelection(true)}
                      className="h-11 bg-primary px-5 text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95 shadow-md hover:shadow-lg"
                    >
                      <Plus className="h-4 w-4" />
                      New Report
                    </Button>
                  </CardContent>
                </Card>

                {studentTrackerTemplate && (
                  <StudentTracker
                    user={user}
                    template={studentTrackerTemplate}
                    onSuccess={refreshData}
                  />
                )}

                <Card className="surface-panel border-glass-border/80">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-heading text-base">
                      Recent Reports
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Your latest submissions with cleaned titles and native
                      scrolling.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 stagger-children">
                      {recentReports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between gap-3 rounded-[calc(var(--radius)+2px)] border border-border/80 bg-background/65 p-3 card-interactive"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="truncate text-sm font-medium leading-tight">
                                {normalizeText(report.title)}
                              </span>
                              {report.priority === "high" && (
                                <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
                                  high
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{normalizeText(report.category)}</span>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                              <span>{report.createdAt.toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedReportId(report.id)}
                            className="h-9 w-9 shrink-0 p-0 hover:bg-primary/10 hover:text-primary transition-transform active:scale-95"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {recentReports.length === 0 && (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                          No reports submitted yet.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-heading text-lg font-semibold">
                      My Reports
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Browse your full submission history.
                    </p>
                  </div>

                  {userReports.length > 0 && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-xs text-muted-foreground">Show</span>
                      <Select
                        value={String(itemsPerPage)}
                        onValueChange={handleItemsPerPageChange}
                      >
                        <SelectTrigger className="h-10 w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {userReports.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {startIndex + 1}-{Math.min(endIndex, userReports.length)} of{" "}
                    {userReports.length}
                  </p>
                )}

                <div className="space-y-3 stagger-children">
                  {userReports.length === 0 ? (
                    <Card className="surface-panel border-glass-border/80">
                      <CardContent className="py-12 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[calc(var(--radius)+4px)] bg-muted/40">
                          <FilePlus2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-heading text-lg font-medium">
                          No reports yet
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Submit your first report to get started.
                        </p>
                        <Button
                          onClick={() => setShowTemplateSelection(true)}
                          size="sm"
                          className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95"
                        >
                          <Plus className="h-4 w-4" />
                          Create First Report
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    paginatedReports.map((report) => (
                      <Card
                        key={report.id}
                        className="surface-panel card-interactive border-glass-border/80 transition-all"
                      >
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-2 text-sm font-medium leading-snug">
                                {normalizeText(report.title)}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                                {normalizeText(report.description)}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-1.5">
                              {report.priority === "high" && (
                                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
                                  high
                                </span>
                              )}
                              <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                {normalizeText(report.status)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {report.createdAt.toLocaleDateString()}
                              </span>
                              {report.category && (
                                <span className="rounded-full bg-muted/45 px-2 py-1 text-[10px] uppercase tracking-wide">
                                  {normalizeText(report.category)}
                                </span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedReportId(report.id)}
                              className="h-8 text-xs hover:bg-primary/10 hover:text-primary transition-transform active:scale-95"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0 transition-transform active:scale-90"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {Array.from(
                      { length: Math.min(totalPages, 3) },
                      (_, index) => {
                        let pageNumber: number;
                        if (totalPages <= 3) {
                          pageNumber = index + 1;
                        } else if (currentPage <= 2) {
                          pageNumber = index + 1;
                        } else if (currentPage >= totalPages - 1) {
                          pageNumber = totalPages - 2 + index;
                        } else {
                          pageNumber = currentPage - 1 + index;
                        }

                        return (
                          <Button
                            key={pageNumber}
                            variant={
                              currentPage === pageNumber ? "default" : "ghost"
                            }
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                            className={
                              currentPage === pageNumber
                                ? "h-8 w-8 bg-primary p-0 text-primary-foreground shadow-sm transition-transform active:scale-90"
                                : "h-8 w-8 p-0 text-xs transition-transform active:scale-90"
                            }
                          >
                            {pageNumber}
                          </Button>
                        );
                      },
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0 transition-transform active:scale-90"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav — always rendered, visibility controlled by CSS to prevent flicker */}
      <div
        className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2.5 pb-[calc(0.7rem+var(--tg-safe-area-inset-bottom,0px))] transition-opacity duration-150 ${showBottomNav ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {/* Overview + Reports pill */}
        <nav className="glass-floating pointer-events-auto flex items-center rounded-[26px] px-1.5 py-1.5">
          {(
            [
              { id: "overview", label: "Overview", icon: Home },
              { id: "reports", label: "Reports", icon: FileText },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const isActive = !showTemplateSelection && activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  window.scrollTo(0, 0);
                  if (showTemplateSelection) {
                    setShowTemplateSelection(false);
                    setSelectedTemplateId(null);
                  }
                  setActiveSection(id);
                }}
                className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] px-5 py-2 transition-colors active:scale-[0.98] ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="employee-nav-active"
                    className="absolute inset-0 rounded-[20px] border border-primary/15 bg-primary/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className="relative z-10 h-[18px] w-[18px]"
                  strokeWidth={2.2}
                />
                <span className="relative z-10 text-[10px] font-semibold leading-none">
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* New Report button */}
        <button
          type="button"
          onClick={() => setShowTemplateSelection(true)}
          className={`glass-floating pointer-events-auto flex h-[60px] w-[60px] items-center justify-center rounded-full transition-colors active:scale-[0.98] ${showTemplateSelection ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <FilePlus className="h-[18px] w-[18px]" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
