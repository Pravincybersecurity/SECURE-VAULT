import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Lock, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = "http://localhost:8080/api/vault";

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

const Encrypt = () => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { logout } = useAuth();

  const currentFieldHint = useMemo(() => {
    if (!selectedCategory || !selectedField) return null;
    const categoryFields = categories[selectedCategory];
    const fieldObject = categoryFields?.find(f => f.value === selectedField);
    return fieldObject?.hint || null;
  }, [selectedCategory, selectedField]);

  const currentFieldPlaceholder = useMemo(() => {
    if (!selectedCategory || !selectedField) return "Enter the sensitive data here...";
    const categoryFields = categories[selectedCategory];
    const fieldObject = categoryFields?.find(f => f.value === selectedField);
    return fieldObject?.placeholder || "Enter the sensitive data here...";
  }, [selectedCategory, selectedField]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const sanitizedValue = sanitizeInput(fieldValue);

    if (!selectedCategory || !selectedField || !sanitizedValue) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const validator = validationPatterns[selectedField];
    if (validator && !validator.regex.test(sanitizedValue)) {
      toast({ title: "Validation Error", description: validator.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
        logout();
        return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          category: selectedCategory,
          field_name: selectedField,
          value: sanitizedValue,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Encryption failed");
      }
      const data = await response.json();
      
      // --- UPDATED: Use the professional display name in the toast ---
      const displayFieldName = getDisplayFieldName(selectedField);
      toast({ title: "Success", description: `${displayFieldName} encrypted successfully` });
      
      setSelectedCategory("");
      setSelectedField("");
      setFieldValue("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-blue-200 min-h-screen">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Encrypt PII Data</h1>
          <p className="text-muted-foreground">
            Securely encrypt and store your personally identifiable information.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="mb-6 shadow-card bg-gradient-blue border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center"><Lock className="w-5 h-5 mr-2" />PII Data Encryption</CardTitle>
              <CardDescription>Select category and field, then enter data to encrypt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="category">Data Category *</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      setSelectedField("");
                    }}
                  >
                    <SelectTrigger id="category" className="mt-1"><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(categories).map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="field">Field Type *</Label>
                  <Select
                    value={selectedField}
                    onValueChange={setSelectedField}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger id="field" className="mt-1"><SelectValue placeholder="Select a field type" /></SelectTrigger>
                    <SelectContent>
                      {selectedCategory &&
                        categories[selectedCategory]?.map((field) => (
                          <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="value">Data Value *</Label>
                <Input
                  id="value"
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder={currentFieldPlaceholder}
                  className="mt-1"
                />
                {currentFieldHint && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                    <Info className="w-3 h-3 mr-1" />
                    {currentFieldHint}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Security Notice</h3>
                  <ul className="mt-2 text-sm text-gray-700 list-disc list-inside">
                    <li>Your data is encrypted using AES-256 before storage.</li>
                    <li>Encryption keys are managed separately from your data.</li>
                    <li>All data transmission is secured with modern TLS.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <><Lock className="w-4 h-4 mr-2 animate-spin" />Encrypting Data...</>
            ) : (
              <><Shield className="w-4 h-4 mr-2" />Encrypt & Store Data</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Encrypt;

