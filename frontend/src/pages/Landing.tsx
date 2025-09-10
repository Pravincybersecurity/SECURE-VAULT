import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Users, Award, LogOut, User } from "lucide-react";
import heroImage from "@/assets/hero-security.jpg";

// --- MODIFICATION: Import the useAuth hook ---
import { useAuth } from "@/context/AuthContext";

const Landing = () => {
  // --- MODIFICATION: Get authentication state and logout function from context ---
  const { isAuthenticated, logout } = useAuth();

  const features = [
    { icon: Shield, title: "Advanced Encryption", description: "Military-grade AES-256 encryption ensures your PII data remains completely secure." },
    { icon: Lock, title: "Zero-Knowledge Architecture", description: "We can't see your data even if we wanted to. Your privacy is guaranteed by design." },
    { icon: Database, title: "Secure Storage", description: "Stores encrypted data and their DEKs in separate databases to minimize breach impact." },
    { icon: Eye, title: "Easy Access", description: "Access your encrypted data anytime, anywhere with our intuitive interface." },
    { icon: Users, title: "Performance & Security Balance", description: "Uses per-field encryption for higher security or per-category encryption for better performance." },
    { icon: Award, title: "Auditing and Logging", description: "Track every access and activity with comprehensive logs, ensuring transparency and accountability at all times." }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                Secure Your
                <span className="block text-primary-glow">PII Data</span>
                with Confidence
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Protect sensitive personally identifiable information with enterprise-grade encryption. 
                Store, manage, and access your data with complete peace of mind.
              </p>
               {/* --- MODIFICATION: Conditionally render buttons based on auth state --- */}
               <div className="flex flex-col sm:flex-row gap-4">
                 {isAuthenticated ? (
                   <>
                     <Link to="/dashboard">
                       <Button size="lg" className="bg-white text-primary hover:bg-white/90 hover:shadow-glow">
                         <User className="w-4 h-4 mr-2" /> Go to Dashboard
                       </Button>
                     </Link>
                     <Button size="lg" variant="outline" className="text-primary border-white bg-white" onClick={logout}>
                       <LogOut className="w-4 h-4 mr-2" /> Logout
                     </Button>
                   </>
                 ) : (
                   <>
                     <Link to="/register">
                       <Button size="lg" className="bg-white text-primary hover:bg-white/90 hover:shadow-glow">
                         Get Started Now
                       </Button>
                     </Link>
                     <Link to="/awareness">
                       <Button size="lg" variant="outline" className="text-primary border-white bg-white">
                         Know More
                       </Button>
                     </Link>
                   </>
                 )}
               </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-white/20 rounded-2xl blur-xl"></div>
              <img 
                src={heroImage} 
                alt="Secure PII Data Protection" 
                className="relative rounded-2xl shadow-elevated w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Why Choose SecureVault?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Designed specifically for those who prioritize strong data protection. Your PII data deserves the highest level of security.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-card hover:shadow-elevated transition-all duration-300 bg-gradient-card">
                  <CardContent className="p-6">
                    <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Secure Your PII Data?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            With SecureVault, your PII data receives the highest level of protection for all sensitive information.
          </p>
          {/* --- MODIFICATION: Conditionally render buttons in CTA as well --- */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to="/encrypt">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 hover:shadow-glow">
                  <Lock className="w-4 h-4 mr-2" /> Encrypt New Data
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 hover:shadow-glow">
                    Get Started Now
                  </Button>
                </Link>
                <Link to="/awareness">
                  <Button size="lg" variant="outline" className="text-primary border-white bg-white">
                    Know More
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
