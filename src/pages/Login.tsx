import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, Eye, EyeOff, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "@/context/AuthContext";
import newLogoImg from "@/assets/secure vault logo.png";
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpData, setOtpData] = useState({ email: "", otp: "", newPassword: "", confirmPassword: "" });
  const [passwordResetStep, setPasswordResetStep] = useState<'email' | 'otp' | 'password'>('email');
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

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

  const passwordRequirements = validatePassword(otpData.newPassword);
  const isPasswordValid = passwordRequirements.every(req => req.test);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) {
      console.error("CRITICAL: VITE_RECAPTCHA_SITE_KEY is not configured in your .env.local file.");
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtpData({ ...otpData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recaptchaToken) {
      toast({ title: "Verification Required", description: "Please complete the reCAPTCHA.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const formBody = new URLSearchParams({ 
        username: formData.username, 
        password: formData.password 
      });

      // --- MODIFICATION: Send reCAPTCHA token in header ---
      const response = await fetch("http://localhost:8080/auth/login", { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Recaptcha-Token": recaptchaToken
        }, 
        body: formBody, 
      });
      // --- END MODIFICATION ---

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Login failed.");
      
      login(data.access_token);
      toast({ title: "Login Successful", description: "Welcome back!" });

    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    }
  };

  const handleSendOtp = async () => {
    if (!otpData.email) {
        toast({ title: "Email Required", description: "Please enter your email address.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      const formBody = new URLSearchParams({ email: otpData.email });
      const response = await fetch("http://localhost:8080/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: formBody });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to send OTP.");

      setPasswordResetStep('otp');
      toast({ title: "OTP Sent", description: "Please check your email for the OTP." });
      
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const formBody = new URLSearchParams({ email: otpData.email, otp: otpData.otp });
      const response = await fetch("http://localhost:8080/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: formBody });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "OTP verification failed.");
      setPasswordResetStep('password');
      toast({ title: "OTP Verified", description: "Please enter your new password." });
    } catch (error: any) {
      toast({ title: "Invalid OTP", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isPasswordValid) {
      toast({ title: "Invalid Password", description: "Please meet all password requirements.", variant: "destructive" });
      return;
    }
    if (otpData.newPassword !== otpData.confirmPassword) {
      toast({ title: "Passwords Don't Match", description: "Please ensure both passwords match.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const formBody = new URLSearchParams({ email: otpData.email, otp: otpData.otp, new_password: otpData.newPassword });
      const response = await fetch("http://localhost:8080/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: formBody });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to reset password.");
      toast({ title: "Password Changed", description: "Your password has been successfully updated." });
      setShowForgotPassword(false);
      setPasswordResetStep('email');
      setOtpData({ email: "", otp: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-blue-200 min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated bg-gradient-blue backdrop-blur-lg border border-primary/40">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4"><img src={newLogoImg} alt="SecureVault Logo" className="h-14 w-14" /></div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your secure PII vault</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div><Label htmlFor="username">Email Address</Label><Input id="username" name="username" type="email" required value={formData.username} onChange={handleInputChange} className="mt-1 transition-all focus:shadow-glow" placeholder="Enter your email address" /></div>
              <div><Label htmlFor="password">Password</Label><div className="relative mt-1"><Input id="password" name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleInputChange} className="pr-10 transition-all focus:shadow-glow" placeholder="Enter your password" /><Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}</Button></div></div>
            </div>
            <div className="flex justify-center">{RECAPTCHA_SITE_KEY ? <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_SITE_KEY} onChange={setRecaptchaToken} /> : <p className="text-destructive text-sm">reCAPTCHA not configured.</p>}</div>
            <Button type="submit" className="w-full bg-gradient-primary hover:shadow-glow" disabled={isLoading || !recaptchaToken}>{isLoading ? "Signing In..." : "Sign In"}</Button>
            <div className="text-center">
              <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                <DialogTrigger asChild><Button variant="link" className="text-sm text-primary hover:underline">Forgot Password?</Button></DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      {passwordResetStep === 'email' && "Enter your email address to receive an OTP."}
                      {passwordResetStep === 'otp' && "Enter the OTP sent to your email address."}
                      {passwordResetStep === 'password' && "Create a new, strong password."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {passwordResetStep === 'email' && (<div className="space-y-4"><Input id="email" name="email" type="email" required value={otpData.email} onChange={handleOtpInputChange} placeholder="Enter your email address" /><Button onClick={handleSendOtp} className="w-full" disabled={isLoading}>Send OTP</Button></div>)}
                    {passwordResetStep === 'otp' && (<div className="space-y-4"><div className="flex justify-center"><InputOTP maxLength={6} value={otpData.otp} onChange={(value) => setOtpData(prev => ({ ...prev, otp: value }))}><InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup></InputOTP></div><Button onClick={handleVerifyOtp} className="w-full" disabled={isLoading}>Verify OTP</Button></div>)}
                    {passwordResetStep === 'password' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new-password">New Password</Label>
                          <div className="relative mt-1">
                            <Input id="new-password" name="newPassword" type={showNewPassword ? "text" : "password"} value={otpData.newPassword} onChange={handleOtpInputChange} className="pr-10" placeholder="Enter new password" />
                            <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                          </div>
                          {otpData.newPassword && (
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
                        <div><Label htmlFor="confirm-password">Confirm New Password</Label><Input id="confirm-password" name="confirmPassword" type="password" value={otpData.confirmPassword} onChange={handleOtpInputChange} className="mt-1" placeholder="Confirm new password" /></div>
                        <Button onClick={handleResetPassword} className="w-full" disabled={isLoading || !isPasswordValid}>Reset Password</Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="text-center text-sm"><span className="text-muted-foreground">Don't have an account? </span><Link to="/register" className="text-primary hover:underline font-medium">Sign up</Link></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

