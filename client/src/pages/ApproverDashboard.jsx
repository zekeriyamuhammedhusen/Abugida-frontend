import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { toast } from "sonner";
import api from "@/lib/api";
import Logo from "@/components/layout/Logo";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import ukFlag from "@/assets/flags/uk.png";
import ethFlag from "@/assets/flags/eth.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Users,
  Clock,
  Search,
  Eye,
  FileText,
  LayoutDashboard,
  Menu,
} from "lucide-react";

const ApproverDashboard = () => {
  const { logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [approvedCount, setApprovedCount] = useState(0);
  const [approved, setApproved] = useState([]);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const pendingRef = useRef(null);
  const approvedRef = useRef(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/approver/instructors/pending");
      setPending(res.data?.pending || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load pending instructors");
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedCount = async () => {
    try {
      const res = await api.get("/api/approver/instructors/approved-count");
      setApprovedCount(res.data?.approvedCount || 0);
    } catch (error) {
      setApprovedCount(0);
    }
  };

  const fetchApproved = async () => {
    try {
      setApprovedLoading(true);
      const res = await api.get("/api/approver/instructors/approved");
      setApproved(res.data?.approved || []);
      setApprovedCount(res.data?.approved?.length || 0);
    } catch (error) {
      setApproved([]);
    } finally {
      setApprovedLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchApproved();
  }, []);

  const filteredPending = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return pending;
    return pending.filter((u) =>
      [u.name, u.email].filter(Boolean).some((v) => v.toLowerCase().includes(term))
    );
  }, [pending, search]);

  const today = useMemo(() => new Date().toLocaleDateString(), []);
  const languageOptions = [
    { code: "en", label: t("english"), flag: ukFlag },
    { code: "am", label: t("amharic"), flag: ethFlag },
  ];

  const getCvUrl = (cvPath) => {
    if (!cvPath) return "";
    if (cvPath.startsWith("http")) return cvPath;
    const base = import.meta.env.VITE_API_BASE_URL || "";
    const normalized = cvPath.startsWith("/") ? cvPath : `/${cvPath}`;
    return `${base}${normalized}`;
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/api/approver/instructors/approve/${id}`);
      toast.success("Instructor approved");
      fetchPending();
      fetchApproved();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve instructor");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.delete(`/api/approver/instructors/reject/${id}`);
      toast.success("Instructor rejected");
      fetchPending();
      fetchApproved();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject instructor");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 h-[100vh] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative md:block overflow-hidden`}
      >
        <div className="flex items-center space-x-2 mb-8">
          <Logo />
          <span className="text-lg font-semibold text-slate-900 dark:text-white">Abugida</span>
        </div>

        <nav className="space-y-1">
          <button
            className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium bg-abugida-50 text-abugida-600 dark:bg-slate-800 dark:text-abugida-400"
          >
            <LayoutDashboard size={18} className="mr-2" />
            {t("approver.nav.dashboard")}
          </button>
        </nav>

        <div className="absolute bottom-5 left-5 right-5">
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            <div className="h-8 w-8 rounded-full bg-abugida-100 dark:bg-abugida-900/30 flex items-center justify-center text-abugida-600 dark:text-abugida-400 font-medium">
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "AP"}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium truncate">
                {user?.name || t("approver.sidebar.namePlaceholder")}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user?.email || t("approver.sidebar.emailPlaceholder")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar toggle button */}
      <button
        className="fixed top-5 left-5 z-50 md:hidden p-2 rounded-full bg-abugida-500 text-white"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={20} />
      </button>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-auto h-[100vh]">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("approver.header.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("approver.header.subtitle")}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden md:inline">{today}</span>
              <ThemeToggle />
              <div className="relative">
                <button
                  onClick={() => setLanguageMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
                  aria-haspopup="listbox"
                  aria-expanded={languageMenuOpen}
                >
                  {(() => {
                    const current = languageOptions.find((o) => o.code === language) || languageOptions[0];
                    return (
                      <>
                        <img src={current.flag} alt="flag" className="w-4 h-4 object-contain" />
                        <span>{current.label}</span>
                      </>
                    );
                  })()}
                </button>
                {languageMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 rounded-md border dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-50">
                    <ul role="listbox" className="py-1">
                      {languageOptions.map((opt) => (
                        <li key={opt.code}>
                          <button
                            onClick={() => {
                              setLanguage(opt.code);
                              setLanguageMenuOpen(false);
                            }}
                            className={`w-full px-3 py-2 flex items-center gap-2 text-sm text-left ${
                              language === opt.code
                                ? "bg-slate-100 dark:bg-slate-800 font-medium"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                            role="option"
                            aria-selected={language === opt.code}
                          >
                            <img src={opt.flag} alt="flag" className="w-4 h-4 object-contain" />
                            <span>{opt.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                {t("approver.actions.logout")}
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="border-slate-200/60 dark:border-slate-800/60 cursor-pointer"
            onClick={() => pendingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("approver.stats.pending")}</p>
                  <p className="text-2xl font-semibold mt-1">{approved.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-slate-200/60 dark:border-slate-800/60 cursor-pointer"
            onClick={() => approvedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("approver.stats.total")}</p>
                  <p className="text-2xl font-semibold mt-1">{pending.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 dark:border-slate-800/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("approver.stats.quickActions")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("approver.stats.quickActionsHint")}</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchPending}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  {t("approver.actions.refresh")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card ref={pendingRef} className="border-slate-200/60 dark:border-slate-800/60 shadow-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>{t("approver.table.title")}</CardTitle>
                <CardDescription>{t("approver.table.subtitle")}</CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("approver.search.placeholder")}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-slate-200/70 dark:border-slate-800/70 overflow-hidden bg-white dark:bg-slate-900">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                  <TableRow>
                    <TableHead>{t("approver.table.name")}</TableHead>
                    <TableHead>{t("approver.table.email")}</TableHead>
                    <TableHead>{t("approver.table.submitted")}</TableHead>
                    <TableHead className="text-right">{t("approver.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        {t("approver.table.loading")}
                      </TableCell>
                    </TableRow>
                  ) : filteredPending.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        {t("approver.table.empty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPending.map((user) => (
                      <TableRow key={user._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-abugida-400 to-abugida-600 text-white flex items-center justify-center text-sm font-semibold">
                              {user?.name?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-white">{user.name}</div>
                              <div className="text-xs text-muted-foreground">{user.expertise || t("approver.table.instructor")}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setSelectedInstructor(user)}
                              className="h-9 w-9 text-slate-600"
                              aria-label={t("approver.actions.view")}
                              title={t("approver.actions.view")}
                            >
                              <Eye className="h-5 w-5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleApprove(user._id)}
                              className="h-9 w-9 text-green-600"
                              aria-label={t("approver.actions.approve")}
                              title={t("approver.actions.approve")}
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleReject(user._id)}
                              className="h-9 w-9 text-red-600"
                              aria-label={t("approver.actions.reject")}
                              title={t("approver.actions.reject")}
                            >
                              <XCircle className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        </main>
      </div>

      <Dialog open={!!selectedInstructor} onOpenChange={(open) => !open && setSelectedInstructor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("approver.details.title")}</DialogTitle>
            <DialogDescription>{t("approver.details.subtitle")}</DialogDescription>
          </DialogHeader>
          {selectedInstructor && (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">{t("approver.details.name")}</div>
                <div className="font-medium">{selectedInstructor.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("approver.details.email")}</div>
                <div className="font-medium">{selectedInstructor.email}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("approver.details.phone")}</div>
                <div className="font-medium">{selectedInstructor.phone || t("approver.details.na")}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("approver.details.expertise")}</div>
                <div className="font-medium">{selectedInstructor.expertise || t("approver.details.na")}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("approver.details.submitted")}</div>
                <div className="font-medium">
                  {new Date(selectedInstructor.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("approver.details.document")}</div>
                {selectedInstructor.cv ? (
                  <a
                    href={getCvUrl(selectedInstructor.cv)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-abugida-600 hover:text-abugida-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {t("approver.details.viewDocument")}
                  </a>
                ) : (
                  <div className="font-medium">{t("approver.details.noDocument")}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApproverDashboard;
