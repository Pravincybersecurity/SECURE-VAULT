import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, EyeOff, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReCAPTCHA from "react-google-recaptcha";
import newLogoImg from "@/assets/secure vault logo.png";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      console.error("CRITICAL: VITE_RECAPTCHA_SITE_KEY is not configured in your .env.local file.");
    }
  }, []);

  const validatePassword = (password: string) => {
    const requirements = [
      { test: password.length >= 8, label: "At least 8 characters" },
      { test: /[A-Z]/.test(password), label: "One uppercase letter" },
      { test: /[a-z]/.test(password), label: "One lowercase letter" },
      { test: /\d/.test(password), label: "One number" },
      { test: /[!@#$%^&*]/.test(password), label: "One special character" },
    ];
    return requirements;
  };

  const passwordRequirements = validatePassword(formData.password);
  const isPasswordValid = passwordRequirements.every(req => req.test);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recaptchaToken) {
      toast({ title: "Verification Required", description: "Please complete the reCAPTCHA.", variant: "destructive" });
      return;
    }

    if (!isPasswordValid) {
      toast({ title: "Invalid Password", description: "Please meet all password requirements.", variant: "destructive" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const formBody = new URLSearchParams({
        email: formData.email,
        name: formData.name,
        password: formData.password,
        recaptcha_token: recaptchaToken,
      });

      const response = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Registration failed.");
      }

      toast({ title: "Registration Successful", description: "Welcome! You can now sign in." });
      navigate("/login");

    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      recaptchaRef.current?.reset();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-blue-200 min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated bg-gradient-blue backdrop-blur-lg border border-primary/40">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><img src={newLogoImg} alt="SecureVault Logo" className="h-14 w-14" /></div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Start securing your PII data with SecureVault</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" required value={formData.email} onChange={handleInputChange} className="mt-1" placeholder="Enter your email address" />
              </div>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" type="text" required value={formData.name} onChange={handleInputChange} className="mt-1" placeholder="Enter your full name" />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleInputChange} className="pr-10" placeholder="Create a strong password" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                </div>
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center text-xs">
                        <Check className={`h-3 w-3 mr-2 ${req.test ? "text-success" : "text-muted-foreground"}`} />
                        <span className={req.test ? "text-success" : "text-muted-foreground"}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative mt-1">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={handleInputChange} className="pr-10" placeholder="Confirm your password" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              {RECAPTCHA_SITE_KEY ? (
                <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} onChange={setRecaptchaToken} />
              ) : <p className="text-destructive text-sm">reCAPTCHA not configured.</p>}
            </div>
            <Button type="submit" className="w-full bg-gradient-primary" disabled={isLoading || !recaptchaToken}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;

