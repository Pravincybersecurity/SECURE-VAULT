import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Search, Plus, Shield, Eye, EyeOff, Edit, Trash2, X, Loader2, AlertTriangle, Database } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "http://localhost:8080/api/vault";

// Interfaces to match API and component state
interface Record {
  id: string; // The category name
  name: string;
  type: string;
  dateAdded: string;
  status: string;
  fields: string[];
}

interface DecryptedData {
  [key: string]: string;
}

// --- NEW: Mapping for professional field names ---
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

// Data structures for validation and placeholders
const validationPatterns: { [key: string]: { regex: RegExp; message: string } } = {
    fullname: { regex: /^[a-zA-Z\s\.\']{2,100}$/, message: "Please enter a valid name." },
    dob: { regex: /^\d{4}-\d{2}-\d{2}$/, message: "Date of Birth must be in YYYY-MM-DD format." },
    phone: { regex: /^\+?[0-9\s-]{10,15}$/, message: "Invalid phone number format." },
    email: { regex: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, message: "Invalid email address." },
    address: { regex: /^[a-zA-Z0-9\s,.'-]{10,255}$/, message: "Please enter a valid address." },
    adhar: { regex: /^\d{4}[-\s]?\d{4}[-\s]?\d{4}$/, message: "Aadhaar must be 12 digits." },
    passport: { regex: /^[A-Z0-9-]{6,20}$/, message: "Invalid passport number format." },
    pan: { regex: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: "Invalid PAN format. Must be ABCDE1234F." },
    license: { regex: /^[A-Z0-9-]{5,20}$/, message: "Invalid license number format." },
    smartcard: { regex: /^[a-zA-Z0-9]{10,20}$/, message: "Invalid smart card number format." },
    professionallicence: { regex: /^[a-zA-Z0-9-/\s]{5,30}$/, message: "Invalid professional license format." },
    accnum: { regex: /^[0-9-]{8,20}$/, message: "Invalid account number format." },
    creditnum: { regex: /^\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}$/, message: "Credit card must be 16 digits." },
    cvv: { regex: /^[0-9]{3,4}$/, message: "CVV must be 3 or 4 digits." },
    tax: { regex: /^[a-zA-Z0-9-]{10,30}$/, message: "Invalid tax ID format." },
    pension: { regex: /^[a-zA-Z0-9-]{10,25}$/, message: "Invalid pension account format." },
    tradingacc: { regex: /^[a-zA-Z0-9-]{8,20}$/, message: "Invalid trading account format." },
    empid: { regex: /^[a-zA-Z0-9-]{3,20}$/, message: "Invalid Employee ID format." },
    workemail: { regex: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, message: "Invalid work email address." },
    emis: { regex: /^[0-9]{10,20}$/, message: "EMIS number must be 10-20 digits." },
    umis: { regex: /^[a-zA-Z0-9]{10,20}$/, message: "Invalid UMIS number format." },
    health_insurance: { regex: /^[a-zA-Z0-9-]{10,30}$/, message: "Invalid health insurance ID." },
    patientid: { regex: /^[a-zA-Z0-9-]{5,25}$/, message: "Invalid patient ID." },
    disability_certificate: { regex: /^[a-zA-Z0-9-/\s]{10,30}$/, message: "Invalid certificate number." },
    emergency_contact: { regex: /^[a-zA-Z0-9\s,.'-:+()]{10,100}$/, message: "Invalid emergency contact format." },
};

const categories: {[key: string]: {value: string, label: string, hint?: string, placeholder?: string}[]} = {
    "Basic Identifiers": [
      { value: "fullname", label: "Full Name", placeholder: "John Michael Doe" },
      { value: "dob", label: "Date of Birth", hint: "Format: YYYY-MM-DD", placeholder: "1999-05-12" },
      { value: "phone", label: "Phone Number", placeholder: "+91-9876543210" },
      { value: "email", label: "Email Address", placeholder: "john.doe@example.com" },
      { value: "address", label: "Residential Address", placeholder: "221B Baker Street, London" },
    ],
    "Government Identifiers": [
      { value: "adhar", label: "Aadhaar Number", hint: "Must be 12 digits", placeholder: "XXXX-XXXX-XXXX" },
      { value: "passport", label: "Passport Number", placeholder: "A1234567" },
      { value: "pan", label: "PAN Number", hint: "Format: ABCDE1234F", placeholder: "ABCDE1234F" },
      { value: "license", label: "Driver's License", placeholder: "DL-0420110149646" },
      { value: "smartcard", label: "Smart Card Number", placeholder: "123456789012" },
      { value: "professionallicence", label: "Professional License", placeholder: "PROF-2024-12345" },
    ],
    "Financial Info": [
      { value: "accnum", label: "Bank Account Number", placeholder: "1234567890123456" },
      { value: "creditnum", label: "Credit/Debit Card Number", hint: "Must be 16 digits", placeholder: "XXXX-XXXX-XXXX-XXXX" },
      { value: "cvv", label: "CVV Number", hint: "Must be 3 or 4 digits", placeholder: "123" },
      { value: "tax", label: "Tax Filing Reference", placeholder: "TXN-2024-ABCDE" },
      { value: "pension", label: "Pension Account Number", placeholder: "PEN-1234567890" },
      { value: "tradingacc", label: "Trading Account Number", placeholder: "INV-2024-12345" },
    ],
    "Employment Education": [
      { value: "empid", label: "Employee ID", placeholder: "EMP-1234" },
      { value: "workemail", label: "Work Email", placeholder: "user@company.com" },
      { value: "emis", label: "EMIS Number", placeholder: "123456789012345" },
      { value: "umis", label: "UMIS Number", placeholder: "UMIS-123456" },
    ],
    "Health Insurance": [
      { value: "health_insurance", label: "Health Insurance ID", placeholder: "HIN-12345678" },
      { value: "patientid", label: "Patient ID", placeholder: "PAT-2024-0012" },
      { value: "disability_certificate", label: "Disability Certificate Number", placeholder: "DIS-12345678" },
      { value: "emergency_contact", label: "Emergency Contact", placeholder: "Alice Doe (+91-9876543210)" },
    ]
};

const sanitizeInput = (value: string) => value.replace(/[<>/&"']/g, '');

const Dashboard = () => {
    const [records, setRecords] = useState<Record[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [decryptedData, setDecryptedData] = useState<DecryptedData>({});
    const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
    const [recordToDelete, setRecordToDelete] = useState<Record | null>(null);
    const [fieldToDelete, setFieldToDelete] = useState<{record: Record, field: string} | null>(null);
    const [editingField, setEditingField] = useState<{ recordId: string; field: string } | null>(null);
    const [editValue, setEditValue] = useState("");
    const { user, logout } = useAuth();
    const { toast } = useToast();

    const fetchVaultData = useCallback(async () => {
        const token = localStorage.getItem('accessToken');
        if (!token || !user) {
            if (user) logout();
            return;
        }
        try {
            setIsLoading(true);
            const response = await fetch(API_BASE_URL, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.status === 401) {
                toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
                logout();
                return;
            }
            if (!response.ok) throw new Error("Failed to fetch vault data.");
            const data: Record[] = await response.json();
            setRecords(data);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast, user, logout]);

    useEffect(() => {
        fetchVaultData();
    }, [fetchVaultData]);

    const getPlaceholderForField = (category: string, field: string) => {
        const categoryFields = categories[category];
        if (!categoryFields) return "Enter new value...";
        const fieldInfo = categoryFields.find(f => f.value === field);
        return fieldInfo?.placeholder || "Enter new value...";
    };

    const handleDecryptField = useCallback(async (record: Record, fieldName: string) => {
        const dataKey = `${record.id}-${fieldName}`;
        if (decryptedData[dataKey]) return;

        const token = localStorage.getItem('accessToken');
        try {
            const response = await fetch(`${API_BASE_URL}/decrypt`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ category: record.type, field_name: fieldName }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Decryption failed.");
            }
            const data = await response.json();
            setDecryptedData(prev => ({ ...prev, [dataKey]: data.plaintext }));
        } catch (error: any) {
            toast({ title: "Decryption Failed", description: error.message, variant: "destructive" });
        }
    }, [decryptedData, toast]);
    
    useEffect(() => {
        expandedRecords.forEach(recordId => {
            const record = records.find(r => r.id === recordId);
            if (record) {
                record.fields.forEach(field => {
                    handleDecryptField(record, field);
                });
            }
        });
    }, [expandedRecords, records, handleDecryptField]);

    const handleViewToggle = (record: Record) => {
        const newExpandedSet = new Set(expandedRecords);
        if (newExpandedSet.has(record.id)) {
            newExpandedSet.delete(record.id);
        } else {
            newExpandedSet.add(record.id);
        }
        setExpandedRecords(newExpandedSet);
    };

    const handleSaveEdit = async () => {
        if (!editingField || !user) return;

        const sanitizedValue = sanitizeInput(editValue);
        const validator = validationPatterns[editingField.field];
        if (validator && !validator.regex.test(sanitizedValue)) {
            toast({ title: "Validation Error", description: validator.message, variant: "destructive" });
            return;
        }

        const token = localStorage.getItem('accessToken');
        const record = records.find(r => r.id === editingField.recordId);
        if (!record) return;

        try {
            const response = await fetch(`${API_BASE_URL}/field`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ category: record.type, field_name: editingField.field, new_value: sanitizedValue }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to update field.");
            }
            
            const dataKey = `${editingField.recordId}-${editingField.field}`;
            setDecryptedData(prev => ({ ...prev, [dataKey]: sanitizedValue }));

            toast({ title: "Success", description: `Field '${getDisplayFieldName(editingField.field)}' updated.` });
            setEditingField(null);
            setEditValue("");
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        const isCategoryDelete = recordToDelete && !fieldToDelete;
        
        if (!recordToDelete) return;

        const token = localStorage.getItem('accessToken');
        const url = isCategoryDelete ? `${API_BASE_URL}/category/${recordToDelete.type}` : `${API_BASE_URL}/field`;
        
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: isCategoryDelete ? undefined : JSON.stringify({ category: recordToDelete.type, field_name: fieldToDelete?.field }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({detail: 'Failed to delete data'}));
                throw new Error(errorData.detail);
            }
            
            toast({ title: "Success", description: `Data deleted successfully.` });
            fetchVaultData();
        } catch (error: any) {
            toast({ title: "Deletion Failed", description: error.message, variant: "destructive" });
        } finally {
            setRecordToDelete(null);
            setFieldToDelete(null);
        }
    };

    const filteredRecords = records.filter(record =>
        record.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTypeColor = (type: string) => {
        if (type.includes("Basic")) return "bg-blue-100 text-blue-800 border-blue-200";
        if (type.includes("Government")) return "bg-green-100 text-green-800 border-green-200";
        if (type.includes("Financial")) return "bg-red-100 text-red-800 border-red-200";
        if (type.includes("Employment")) return "bg-purple-100 text-purple-800 border-purple-200";
        if (type.includes("Health")) return "bg-orange-100 text-orange-800 border-orange-200";
        return "bg-gray-100 text-gray-800 border-gray-200";
    };

    const totalFields = records.reduce((acc, r) => acc + r.fields.length, 0);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }

    return (
        <div className="bg-blue-200 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Secure Data Vault</h1>
                    <p className="text-muted-foreground">Manage and access your encrypted PII data securely</p>
                </div>

                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <Card className="shadow-card bg-card border-primary/10"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total Fields</p><p className="text-2xl font-bold">{totalFields}</p></div><Database className="h-8 w-8 text-primary" /></div></CardContent></Card>
                    <Card className="shadow-card bg-card border-primary/10"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Encrypted Records</p><p className="text-2xl font-bold text-success">{totalFields}</p></div><div className="h-8 w-8 bg-success/10 rounded-full flex items-center justify-center"><Shield className="h-4 w-4 text-success" /></div></div></CardContent></Card>
                    <Card className="shadow-card bg-card border-primary/10"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total Categories</p><p className="text-2xl font-bold">{records.length}</p></div><div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center"><Shield className="h-4 w-4 text-primary" /></div></div></CardContent></Card>
                    <Card className="shadow-card bg-card border-primary/10"><CardContent className="p-6"><Link to="/encrypt"><Button className="w-full bg-gradient-primary hover:shadow-glow"><Plus className="h-4 w-4 mr-2" />Add New Data</Button></Link></CardContent></Card>
                </div>

                <Card className="mb-6 shadow-card bg-gradient-blue border-primary/10">
                    <CardHeader>
                        <CardTitle>{user?.name}'s Encrypted Records</CardTitle>
                        <CardDescription>Search and manage your securely stored PII data, {user?.name}</CardDescription>
                        <div className="relative pt-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search records by category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {records.length > 0 ? (
                            <div className="grid gap-4">
                                {filteredRecords.map((record) => (
                                    <Card key={record.id} className="border-0 bg-card hover:shadow-elevated transition-all duration-300">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold mb-2">{record.type}</h3>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Badge className={getTypeColor(record.type)}>{record.type}</Badge>
                                                        <Badge variant="outline" className="text-success border-success"><Shield className="h-3 w-3 mr-1" />Encrypted</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Added on {new Date(record.dateAdded).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleViewToggle(record)}>
                                                        {expandedRecords.has(record.id) ? <><EyeOff className="h-4 w-4 mr-1" />Collapse</> : <><Eye className="h-4 w-4 mr-1" />View</>}
                                                    </Button>
                                                    <Button variant="destructive" size="icon" onClick={() => setRecordToDelete(record)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                            
                                            <div className="border-t pt-4">
                                                <p className="text-sm font-medium mb-2">Encrypted Fields:</p>
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {record.fields.map((field) => <Badge key={field} variant="secondary" className="text-xs">{getDisplayFieldName(field)}</Badge>)}
                                                </div>
                                            </div>

                                            <Collapsible open={expandedRecords.has(record.id)}>
                                                <CollapsibleContent className="mt-4 pt-4 border-t border-gray-200">
                                                    <div className="bg-muted/50 rounded-lg p-4">
                                                        <h4 className="font-semibold text-muted-foreground mb-3">Data Fields:</h4>
                                                        <div className="grid gap-3">
                                                            {record.fields.map((field) => {
                                                                const dataKey = `${record.id}-${field}`;
                                                                const isEditing = editingField?.recordId === record.id && editingField.field === field;
                                                                return (
                                                                    <div key={field} className="p-3 bg-card rounded-lg border">
                                                                        {isEditing ? (
                                                                            <div className="space-y-3">
                                                                                <div className="flex justify-between items-center"><span className="font-medium text-muted-foreground">{getDisplayFieldName(field)}:</span>
                                                                                    <div className="flex gap-2">
                                                                                        <Button variant="outline" size="sm" onClick={handleSaveEdit} className="bg-success text-success-foreground hover:bg-success/90">Save</Button>
                                                                                        <Button variant="outline" size="sm" onClick={() => setEditingField(null)}><X className="h-4 w-4" /></Button>
                                                                                    </div>
                                                                                </div>
                                                                                <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="font-mono text-sm" placeholder={getPlaceholderForField(record.type, field)} />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex justify-between items-center">
                                                                                <div className="flex-1 min-w-0"><span className="font-medium text-muted-foreground">{getDisplayFieldName(field)}:</span>
                                                                                    <span className="font-mono text-sm text-primary ml-2 truncate">{decryptedData[dataKey] ?? "Decrypting..."}</span>
                                                                                </div>
                                                                                <div className="flex gap-2">
                                                                                    <Button variant="outline" size="sm" onClick={() => { setEditingField({ recordId: record.id, field }); setEditValue(decryptedData[dataKey] ?? ""); }}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                                                                                    <Button variant="destructive" size="icon" onClick={() => { setRecordToDelete(record); setFieldToDelete({record, field}); }}><Trash2 className="h-4 w-4" /></Button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Your Vault is Empty</h3>
                                <p className="text-muted-foreground mb-6">Start securing your sensitive information by adding your first record.</p>
                                <Link to="/encrypt"><Button className="bg-gradient-primary hover:shadow-glow" size="lg"><Plus className="h-5 w-5 mr-2" />Add Your First Record</Button></Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={!!recordToDelete} onOpenChange={() => { setRecordToDelete(null); setFieldToDelete(null); }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center"><AlertTriangle className="h-5 w-5 mr-2 text-destructive" />Confirm Deletion</DialogTitle>
                            <DialogDescription className="pt-2">
                                {fieldToDelete ? (
                                    <>Are you sure you want to permanently delete the field <strong>{getDisplayFieldName(fieldToDelete.field)}</strong> in <strong>{fieldToDelete.record.type}</strong>?</>
                                ) : (
                                    <>Are you sure you want to permanently delete the entire <strong>{recordToDelete?.type}</strong> category and all its data?</>
                                )}
                                <br/>This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => { setRecordToDelete(null); setFieldToDelete(null); }}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete}>Yes, delete</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default Dashboard;

