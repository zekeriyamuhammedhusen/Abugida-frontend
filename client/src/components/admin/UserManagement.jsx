import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FaBan, FaUnlock } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Eye } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

const UserManagement = ({ onViewUser }) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("instructor");
  const [filterStatus, setFilterStatus] = useState("all");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get(`/api/admin/all-users`);
        if (response.data?.users) {
          setUsers(response.data.users);
        } else {
          toast.error(t("admin.users.error.invalidResponse"));
          setUsers([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error(t("admin.users.error.load"));
        setUsers([]);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = Array.isArray(users)
    ? users.filter((user) => {
        const matchesSearch =
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = user.role === filterRole;

        const userStatus = user.status.toLowerCase();
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "active" && userStatus === "active") ||
          (filterStatus === "pending" && userStatus === "pending");

        return matchesSearch && matchesRole && matchesStatus;
      })
    : [];

  const handleViewUser = (userId) => {
    onViewUser(userId);
  };

  const handleBlockUser = async (userId) => {
    try {
      const res = await api.put(`/api/users/block/${userId}`);
      if (res.status === 200) {
        toast.success("User blocked successfully");
      }
      setUsers(
        users.map((user) =>
          user._id === userId
            ? { ...user, blocked: true, status: "blocked" }
            : user
        )
      );
    } catch (error) {
      console.error("Error:", error);
      alert(t("admin.users.error.block"));
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const response = await api.put(`/api/users/unblock/${userId}`);
      toast.success(response.data.message);
      setUsers(
        users.map((user) =>
          user._id === userId
            ? { ...user, blocked: false, status: "active" }
            : user
        )
      );
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert(t("admin.users.error.unblock"));
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{t("admin.users.title")}</CardTitle>
        <CardDescription>{t("admin.users.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
          <Button
            variant={filterStatus === "all" ? "default" : "ghost"}
            onClick={() => setFilterStatus("all")}
            className="whitespace-nowrap"
          >
            {t("admin.users.filter.all")}
          </Button>
          <Button
            variant={filterStatus === "active" ? "default" : "ghost"}
            onClick={() => setFilterStatus("active")}
            className="whitespace-nowrap"
          >
            {t("admin.users.filter.active")}
          </Button>
          <Button
            variant={filterStatus === "pending" ? "default" : "ghost"}
            onClick={() => setFilterStatus("pending")}
            className="whitespace-nowrap"
          >
            {t("admin.users.filter.pending")}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-9 w-full md:w-64"
              placeholder={t("admin.users.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 items-center">
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("admin.users.filter.role")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">{t("admin.users.roles.student")}</SelectItem>
                <SelectItem value="instructor">{t("admin.users.roles.instructor")}</SelectItem>
                <SelectItem value="approver">{t("admin.users.roles.approver")}</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Filter size={16} />
            </Button>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.users.table.id")}</TableHead>
                <TableHead>{t("admin.users.table.name")}</TableHead>
                <TableHead>{t("admin.users.table.email")}</TableHead>
                <TableHead>{t("admin.users.table.role")}</TableHead>
                <TableHead>{t("admin.users.table.status")}</TableHead>
                <TableHead>{t("admin.users.table.joined")}</TableHead>
                <TableHead>{t("admin.users.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers
                .sort((a, b) => {
                  if (a.role === "student" && b.role !== "student") return -1;
                  if (a.role !== "student" && b.role === "student") return 1;
                  if (a.status === "Active" && b.status !== "Active") return -1;
                  if (a.status !== "Active" && b.status === "Active") return 1;
                  return 0;
                })
                .map((user) => {
                  const userStatus = user.status.toLowerCase();
                  return (
                    <TableRow
                      key={user.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <TableCell>#{user._id}</TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="capitalize">{user.role}</span>
                      </TableCell>
                      <TableCell>{user.status}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewUser(user._id)}
                            className="h-8 w-8"
                            aria-label={t("admin.users.actions.view")}
                          >
                            <Eye size={16} />
                          </Button>

                          {userStatus === "active" && !user.blocked && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleBlockUser(user._id)}
                              className="h-8 w-8 text-yellow-600"
                              aria-label={t("admin.users.actions.block")}
                            >
                              <FaBan size={16} />
                            </Button>
                          )}

                          {user && user.status === "blocked" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUnblockUser(user._id)}
                              className="h-8 w-8 text-green-600"
                              aria-label={t("admin.users.actions.unblock")}
                            >
                              <FaUnlock size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            {t("admin.users.pagination.previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-abugida-50 dark:bg-slate-800"
          >
            1
          </Button>
          <Button variant="outline" size="sm">
            {t("admin.users.pagination.next")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default UserManagement;
