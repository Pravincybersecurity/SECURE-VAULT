import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Database, Shield, Eye, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = "http://localhost:8080/api/admin";

// --- ADDED: Mapping for professional field names ---
const FIELD_DISPLAY_NAMES: { [key: string]: string } = {
    fullname: "Full Name",
    dob: "Date of Birth",
    phone: "Phone Number",
    email: "Email Address",
    address: "Residential Address",
    adhar: "Aadhaar Number",
    passport: "Passport Number",
    pan: "PAN Number",
    license: "Driver's License",
    smartcard: "Smart Card Number",
    professionallicence: "Professional License",
    accnum: "Bank Account Number",
    creditnum: "Credit/Debit Card Number",
    cvv: "CVV Number",
    tax: "Tax Filing Reference",
    pension: "Pension Account Number",
    tradingacc: "Trading Account Number",
    empid: "Employee ID",
    workemail: "Work Email",
    emis: "EMIS Number",
    umis: "UMIS Number",
    health_insurance: "Health Insurance ID",
    patientid: "Patient ID",
    disability_certificate: "Disability Certificate Number",
    emergency_contact: "Emergency Contact",
};

const getDisplayFieldName = (fieldName: string) => {
    return FIELD_DISPLAY_NAMES[fieldName] || fieldName;
};


interface UserRecord {
    type: string;
    fields: string[];
    maskedData: { [key: string]: string };
}

interface UserData {
    id: number;
    username: string;
    email: string;
    joinDate: string;
    recordsCount: number;
    lastActive: string;
    status: string;
    records: UserRecord[];
}

const Admin = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
    const { logout } = useAuth();
    const { toast } = useToast();

    const fetchAdminData = useCallback(async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            logout();
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users-data`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.status === 401) {
                toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
                logout();
                return;
            }
            if (!response.ok) throw new Error("Failed to fetch admin data.");
            
            const data = await response.json();
            setUsers(data);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [logout, toast]);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            logout();
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/users/${userToDelete.id}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ detail: "Failed to delete user." }));
                 throw new Error(errorData.detail);
            }
            
            setUsers(prevUsers => prevUsers.filter(u => u.id !== userToDelete.id));
            toast({ title: "Success", description: `User '${userToDelete.username}' has been deleted.` });

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setUserToDelete(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        return status === "active" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200";
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    return (
        <TooltipProvider>
            <div className="bg-blue-200 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Manage users and monitor encrypted data storage</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <Card className="shadow-card bg-card border-primary/10"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{users.length}</p></div><Users className="h-8 w-8 text-primary" /></div></CardContent></Card>
                        <Card className="shadow-card bg-card border-primary/10"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Active Users</p><p className="text-2xl font-bold text-success">{users.filter(u => u.status === 'active').length}</p></div><div className="h-8 w-8 bg-success/10 rounded-full flex items-center justify-center"><Shield className="h-4 w-4 text-success" /></div></div></CardContent></Card>
                        <Card className="shadow-card bg-card border-primary/10"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total Records</p><p className="text-2xl font-bold">{users.reduce((sum, user) => sum + user.recordsCount, 0)}</p></div><Database className="h-8 w-8 text-primary" /></div></CardContent></Card>
                        <Card className="shadow-card bg-card border-primary/10"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Encrypted</p><p className="text-2xl font-bold text-success">100%</p></div><div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center"><Shield className="h-4 w-4 text-primary" /></div></div></CardContent></Card>
                    </div>

                    <Card className="shadow-card bg-gradient-blue border-primary/10">
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>View and manage all users and their encrypted data </CardDescription>
                            <div className="relative pt-4"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search users by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 max-w-sm" /></div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Email</TableHead><TableHead>Join Date</TableHead><TableHead>Records</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.username}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                                            <TableCell><Badge variant="secondary">{user.recordsCount} records</Badge></TableCell>
                                            <TableCell><Badge className={getStatusColor(user.status)}>{user.status}</Badge></TableCell>
                                            <TableCell className="flex gap-2">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />View</Button></DialogTrigger>
                                                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                                        <DialogHeader><DialogTitle>Masked Data for: {user.username}</DialogTitle></DialogHeader>
                                                        <div className="space-y-6 pt-4">
                                                            {user.records.length > 0 ? user.records.map((record, index) => (
                                                                <Card key={index} className="border-primary/20">
                                                                    <CardHeader><CardTitle className="text-lg">{record.type}</CardTitle><CardDescription>{record.fields.length} encrypted fields</CardDescription></CardHeader>
                                                                    <CardContent>
                                                                        <div className="grid gap-3">
                                                                            {Object.entries(record.maskedData).map(([field, value]: [string, any]) => (<div key={field} className="flex justify-between items-center p-2 bg-muted/50 rounded"><span className="font-medium text-muted-foreground">{getDisplayFieldName(field)}:</span><span className="font-mono text-sm">{value}</span></div>))}
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            )) : <p className="text-center text-muted-foreground py-8">This user has not stored any data yet.</p>}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="destructive" size="icon" onClick={() => setUserToDelete(user)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Delete user</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-destructive"/>Are you sure?</DialogTitle>
                                <DialogDescription className="pt-2">
                                    This action cannot be undone. This will permanently delete the user account for <strong>{userToDelete?.username}</strong> and all of their associated PII data.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setUserToDelete(null)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleDeleteUser}>Yes, delete user</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>
        </TooltipProvider>
    );
};

export default Admin;

