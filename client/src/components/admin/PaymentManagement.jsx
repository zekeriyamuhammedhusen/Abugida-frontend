import React, { useEffect, useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, FileText, FileDown, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const PaymentManagement = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("transactions");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const normalizeStatus = (status) => (status ?? "").toString().trim().toLowerCase();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [txRes, poRes] = await Promise.all([
          api.get('/api/admin/payments/transactions'),
          api.get('/api/admin/payments/payouts'),
        ]);
        setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
        setPayoutRequests(Array.isArray(poRes.data) ? poRes.data : []);
      } catch (err) {
        console.error('Failed to fetch payment data', err);
        toast.error(t("admin.payments.loadError"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  
  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(transaction => 
    transaction.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter payout requests based on search query
  const filteredPayouts = payoutRequests.filter(payout => 
    payout.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payout.id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleApprovePayout = (payoutId) => {
    toast.success(t("admin.payments.payoutApproved", { id: payoutId }));
  };
  
  const handleRejectPayout = (payoutId) => {
    toast.error(t("admin.payments.payoutRejected", { id: payoutId }));
  };

  const handleGenerateReport = () => {
    const rows = activeTab === "transactions" ? filteredTransactions : filteredPayouts;
    const headers = activeTab === "transactions"
      ? [
          t("admin.payments.table.transactionId"),
          t("admin.payments.table.date"),
          t("admin.payments.table.student"),
          t("admin.payments.table.course"),
          t("admin.payments.table.amount"),
          t("admin.payments.table.instructor"),
          t("admin.payments.table.status"),
        ]
      : [
          t("admin.payments.table.payoutId"),
          t("admin.payments.table.date"),
          t("admin.payments.table.instructor"),
          t("admin.payments.table.amount"),
          t("admin.payments.table.courses"),
          t("admin.payments.table.status"),
        ];

    const csvRows = [headers.join(",")];
    rows.forEach((r) => {
      const status = normalizeStatus(r.status);
      if (activeTab === "transactions") {
        csvRows.push([
          r.id,
          new Date(r.date).toISOString(),
          r.student,
          r.course,
          r.amount,
          r.instructor,
          status || "unknown",
        ].join(","));
      } else {
        csvRows.push([
          r.id,
          new Date(r.date).toISOString(),
          r.instructor,
          r.amount,
          r.courses,
          status || "unknown",
        ].join(","));
      }
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payments-${activeTab}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t("admin.payments.reportDownloaded"));
  };
  
  const getStatusBadge = (rawStatus) => {
    const status = normalizeStatus(rawStatus);
    switch (status) {
      case "completed":
      case "approved":
      case "success":
        return (
          <span className="flex items-center text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <Check size={12} className="mr-1" />
            {status === "approved" ? t("admin.payments.status.approved") : t("admin.payments.status.completed")}
          </span>
        );
      case "failed":
      case "faild":
      case "rejected":
      case "declined":
        return (
          <span className="flex items-center text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <X size={12} className="mr-1" />
            {status === "failed" ? t("admin.payments.status.failed") : t("admin.payments.status.rejected")}
          </span>
        );
      case "refunded":
        return (
          <span className="flex items-center text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Check size={12} className="mr-1" />
            {t("admin.payments.status.refunded")}
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <AlertCircle size={12} className="mr-1" />
            {t("admin.payments.status.pending")}
          </span>
        );
      default:
        return (
          <span className="flex items-center text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-200">
            {status || t("admin.payments.status.unknown")}
          </span>
        );
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500">
          {t("admin.payments.title")}
        </CardTitle>
        <CardDescription className="text-blue-700/80 dark:text-blue-200/80">
          {t("admin.payments.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="transactions" onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="transactions">{t("admin.payments.tabs.transactions")}</TabsTrigger>
              <TabsTrigger value="payouts">{t("admin.payments.tabs.payouts")}</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input 
                  className="pl-9 w-full md:w-64" 
                  placeholder={activeTab === "transactions" ? t("admin.payments.search.transactions") : t("admin.payments.search.payouts")} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button variant="outline" size="icon">
                <FileDown size={16} />
              </Button>
              <Button variant="outline" onClick={handleGenerateReport}>
                <FileText size={16} className="mr-2" />
                {t("admin.payments.generateReport")}
              </Button>
            </div>
          </div>
          
          <TabsContent value="transactions" className="mt-0">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>{t("admin.payments.table.date")}</TableHead>
                    <TableHead>{t("admin.payments.table.student")}</TableHead>
                    <TableHead>{t("admin.payments.table.course")}</TableHead>
                    <TableHead>{t("admin.payments.table.amount")}</TableHead>
                    <TableHead>{t("admin.payments.table.instructor")}</TableHead>
                    <TableHead>{t("admin.payments.table.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-xs">{transaction.id}</TableCell>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-emerald-700 dark:text-emerald-300 font-medium">{transaction.student}</TableCell>
                      <TableCell className="text-emerald-700 dark:text-emerald-300 font-medium">{transaction.course}</TableCell>
                      <TableCell className="font-mono">${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-emerald-700 dark:text-emerald-300 font-medium">{transaction.instructor}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="payouts" className="mt-0">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.payments.table.payoutId")}</TableHead>
                    <TableHead>{t("admin.payments.table.date")}</TableHead>
                    <TableHead>{t("admin.payments.table.instructor")}</TableHead>
                    <TableHead>{t("admin.payments.table.amount")}</TableHead>
                    <TableHead>{t("admin.payments.table.courses")}</TableHead>
                    <TableHead>{t("admin.payments.table.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono text-xs">{payout.id}</TableCell>
                      <TableCell>{new Date(payout.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-emerald-700 dark:text-emerald-300 font-medium">{payout.instructor}</TableCell>
                      <TableCell className="font-mono">${payout.amount.toFixed(2)}</TableCell>
                      <TableCell>{payout.courses}</TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex items-center justify-between" />
    </Card>
  );
};

export default PaymentManagement;