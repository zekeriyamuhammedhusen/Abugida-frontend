import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Logo from "@/components/layout/Logo";
import api from "@/lib/api";
import { toast } from "sonner";
import { Search, ArrowLeft, Users } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const ApproverApplicantsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setLoading(true);
        const [pendingRes, approvedRes] = await Promise.all([
          api.get("/api/approver/instructors/pending"),
          api.get("/api/approver/instructors/approved"),
        ]);

        setPending(pendingRes.data?.pending || []);
        setApproved(approvedRes.data?.approved || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load applicants");
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, []);

  const applicants = useMemo(() => {
    const mappedPending = pending.map((applicant) => ({ ...applicant, status: "pending" }));
    const mappedApproved = approved.map((applicant) => ({ ...applicant, status: "approved" }));

    return [...mappedPending, ...mappedApproved].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [pending, approved]);

  const filteredApplicants = useMemo(() => {
    const term = search.trim().toLowerCase();

    return applicants.filter((applicant) => {
      const matchSearch = !term
        || [applicant.name, applicant.email, applicant.expertise]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));

      const matchStatus = statusFilter === "all" || applicant.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [applicants, search, statusFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{t("approver.stats.total")}</h1>
              <p className="text-sm text-muted-foreground">Manage and search all applicants</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => navigate("/approver-dashboard")}> 
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-abugida-600" />
                  Applicant List
                </CardTitle>
                <CardDescription>
                  {filteredApplicants.length} of {applicants.length} applicants
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, expertise"
                    className="pl-9"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background/90 px-3 text-sm shadow-sm"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="rounded-md border border-slate-200/70 dark:border-slate-800/70 overflow-hidden bg-white dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Expertise</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        Loading applicants...
                      </TableCell>
                    </TableRow>
                  ) : filteredApplicants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        No applicants found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplicants.map((applicant) => (
                      <TableRow key={applicant._id}>
                        <TableCell className="font-medium">{applicant.name}</TableCell>
                        <TableCell>{applicant.email}</TableCell>
                        <TableCell>{applicant.expertise || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              applicant.status === "approved"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}
                          >
                            {applicant.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(applicant.createdAt).toLocaleDateString()}</TableCell>
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
  );
};

export default ApproverApplicantsPage;
