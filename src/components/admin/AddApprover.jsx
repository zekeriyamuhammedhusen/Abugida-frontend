import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import api from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const AddApprover = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [approvers, setApprovers] = useState([]);
  const [approversLoading, setApproversLoading] = useState(false);
  const [selectedApprover, setSelectedApprover] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await api.get("/api/admin/approval-logs");
      setLogs(res.data?.logs || []);
    } catch (error) {
      toast.error(error.response?.data?.message || t("admin.approver.logs.error"));
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchApprovers = async () => {
    try {
      setApproversLoading(true);
      const res = await api.get("/api/admin/approvers");
      setApprovers(res.data?.approvers || []);
    } catch (error) {
      toast.error(error.response?.data?.message || t("admin.approver.list.error"));
    } finally {
      setApproversLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchApprovers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post("/api/admin/approvers", formData);
      toast.success(t("admin.approver.create.success"));
      setFormData({ name: "", email: "", password: "" });
      fetchApprovers();
    } catch (error) {
      toast.error(error.response?.data?.message || t("admin.approver.create.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApprover = async (id) => {
    try {
      await api.delete(`/api/admin/approvers/${id}`);
      toast.success(t("admin.approver.delete.success"));
      fetchApprovers();
    } catch (error) {
      toast.error(error.response?.data?.message || t("admin.approver.delete.error"));
    }
  };

  const getActionLabel = (action) => {
    if (action === "approve" || action === "approved") return t("admin.approver.logs.approved");
    if (action === "reject" || action === "rejected") return t("admin.approver.logs.rejected");
    return t("admin.approver.logs.pending");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.approver.form.title")}</CardTitle>
          <CardDescription>
            {t("admin.approver.form.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("admin.approver.form.name")}</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t("admin.approver.form.namePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("admin.approver.form.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t("admin.approver.form.emailPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("admin.approver.form.password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t("admin.approver.form.passwordPlaceholder")}
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? t("admin.approver.form.creating") : t("admin.approver.form.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.approver.list.title")}</CardTitle>
          <CardDescription>{t("admin.approver.list.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.approver.table.name")}</TableHead>
                  <TableHead>{t("admin.approver.table.email")}</TableHead>
                  <TableHead>{t("admin.approver.table.created")}</TableHead>
                  <TableHead className="text-right">{t("admin.approver.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approversLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      {t("admin.approver.table.loading")}
                    </TableCell>
                  </TableRow>
                ) : approvers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      {t("admin.approver.table.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  approvers.map((approver) => (
                    <TableRow key={approver._id}>
                      <TableCell className="font-medium">{approver.name}</TableCell>
                      <TableCell>{approver.email}</TableCell>
                      <TableCell>
                        {new Date(approver.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSelectedApprover(approver)}
                            className="h-8 w-8"
                            aria-label={t("admin.approver.actions.view")}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteApprover(approver._id)}
                            className="h-8 w-8 text-red-600"
                            aria-label={t("admin.approver.actions.delete")}
                          >
                            <Trash2 size={16} />
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

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.approver.logs.title")}</CardTitle>
          <CardDescription>
            {t("admin.approver.logs.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.approver.logs.action")}</TableHead>
                  <TableHead>{t("admin.approver.logs.instructor")}</TableHead>
                  <TableHead>{t("admin.approver.logs.approver")}</TableHead>
                  <TableHead>{t("admin.approver.logs.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      {t("admin.approver.logs.loading")}
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      {t("admin.approver.logs.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="capitalize">{getActionLabel(log.action)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{log.instructorName}</div>
                        <div className="text-xs text-muted-foreground">{log.instructorEmail}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.approverName}</div>
                        <div className="text-xs text-muted-foreground">{log.approverEmail}</div>
                      </TableCell>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={fetchLogs}>
              {t("admin.approver.logs.refresh")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedApprover} onOpenChange={(open) => !open && setSelectedApprover(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.approver.details.title")}</DialogTitle>
            <DialogDescription>{t("admin.approver.details.subtitle")}</DialogDescription>
          </DialogHeader>
          {selectedApprover && (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">{t("admin.approver.details.name")}</div>
                <div className="font-medium">{selectedApprover.name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("admin.approver.details.email")}</div>
                <div className="font-medium">{selectedApprover.email}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("admin.approver.details.status")}</div>
                <div className="font-medium capitalize">{selectedApprover.status || "active"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">{t("admin.approver.details.created")}</div>
                <div className="font-medium">
                  {new Date(selectedApprover.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddApprover;
