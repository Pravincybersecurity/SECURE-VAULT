import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, Eye, Lock, Users, FileText, Globe, Zap } from "lucide-react";

const Awareness = () => {
  const piiTypes = [
    {
      category: "Identity Information",
      icon: Users,
      examples: ["Full Name", "Social Security Number", "Driver's License", "Passport Number", "Date of Birth"],
      risk: "high"
    },
    {
      category: "Contact Information",
      icon: Globe,
      examples: ["Home Address", "Email Address", "Phone Number", "Personal Website"],
      risk: "medium"
    },
    {
      category: "Financial Information",
      icon: FileText,
      examples: ["Credit Card Numbers", "Bank Account Numbers", "Tax ID", "Financial Records"],
      risk: "high"
    },
    {
      category: "Biometric Data",
      icon: Eye,
      examples: ["Fingerprints", "Facial Recognition", "Voice Patterns", "DNA Information"],
      risk: "critical"
    }
  ];

  const threats = [
    {
      title: "Identity Theft",
      description: "Criminals use stolen PII to impersonate victims, open accounts, and commit fraud.",
      impact: "Financial loss, damaged credit, legal complications"
    },
    {
      title: "Data Breaches",
      description: "Large-scale unauthorized access to databases containing personal information.",
      impact: "Mass exposure of sensitive data, regulatory fines, loss of trust"
    },
    {
      title: "Social Engineering",
      description: "Attackers use PII to build trust and manipulate victims into revealing more information.",
      impact: "Compromised accounts, unauthorized access, further data theft"
    },
    {
      title: "Medical Identity Theft",
      description: "Stolen health information used to obtain medical services or prescription drugs.",
      impact: "Corrupted medical records, insurance fraud, denied coverage"
    }
  ];

  const bestPractices = [
    {
      category: "Data Collection",
      practices: [
        "Only collect PII that is absolutely necessary for business operations",
        "Implement privacy by design principles from the start",
        "Obtain explicit consent before collecting sensitive information",
        "Provide clear privacy policies explaining data usage"
      ]
    },
    {
      category: "Data Storage",
      practices: [
        "Use strong encryption (AES-256) for data at rest and in transit",
        "Implement access controls with role-based permissions",
        "Regularly backup encrypted data to secure locations",
        "Use secure, compliant cloud storage solutions"
      ]
    },
    {
      category: "Data Access",
      practices: [
        "Implement multi-factor authentication for all accounts",
        "Use strong, unique passwords for each system",
        "Regularly audit user access and permissions",
        "Monitor and log all data access activities"
      ]
    },
    {
      category: "Data Disposal",
      practices: [
        "Securely delete data when no longer needed",
        "Use certified data destruction methods",
        "Maintain records of data disposal activities",
        "Follow legal retention requirements before disposal"
      ]
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="bg-blue-200 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">PII Security Awareness</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Understanding personally identifiable information (PII) and how to protect it is crucial 
            for individuals and organizations in today's digital world.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="types">PII Types</TabsTrigger>
            <TabsTrigger value="threats">Threats</TabsTrigger>
            <TabsTrigger value="practices">Best Practices</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* What is PII */}
            <Card className="shadow-card bg-gradient-blue border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-6 w-6 mr-2 text-primary" />
                  What is Personally Identifiable Information (PII)?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg leading-relaxed">
                  Personally Identifiable Information (PII) refers to any data that can be used to identify, 
                  contact, or locate a specific individual. This includes both direct identifiers (like name or SSN) 
                  and indirect identifiers that can be combined to identify someone.
                </p>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    PII is valuable to cybercriminals and must be protected according to various privacy laws 
                    including GDPR, CCPA, and HIPAA.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Why PII Matters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Legal compliance requirements</li>
                        <li>• Customer trust and reputation</li>
                        <li>• Financial liability from breaches</li>
                        <li>• Individual privacy rights</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Protection Benefits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>• Prevents identity theft</li>
                        <li>• Avoids regulatory penalties</li>
                        <li>• Maintains business reputation</li>
                        <li>• Builds customer confidence</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              {piiTypes.map((type, index) => {
                const Icon = type.icon;
                return (
                  <Card key={index} className="shadow-card bg-gradient-blue border-primary/10">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                          <Icon className="h-5 w-5 mr-2 text-primary" />
                          {type.category}
                        </CardTitle>
                        <Badge className={getRiskColor(type.risk)}>
                          {type.risk.toUpperCase()} RISK
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {type.examples.map((example, i) => (
                          <Badge key={i} variant="outline" className="mr-2 mb-2">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="threats" className="space-y-8">
            <div className="grid gap-6">
              {threats.map((threat, index) => (
                <Card key={index} className="shadow-card bg-gradient-blue border-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center text-black">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      {threat.title}
                    </CardTitle>
                    <CardDescription>{threat.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 text-destructive">Potential Impact:</h4>
                      <p className="text-sm">{threat.impact}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="practices" className="space-y-8">
            <div className="grid gap-8">
              {bestPractices.map((section, index) => (
                <Card key={index} className="shadow-card bg-gradient-blue border-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lock className="h-5 w-5 mr-2 text-success" />
                      {section.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {section.practices.map((practice, i) => (
                        <div key={i} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-2 h-2 bg-success rounded-full mt-2"></div>
                          <p className="text-sm leading-relaxed">{practice}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Call to Action */}
            <Card className="shadow-elevated bg-gradient-primary text-white">
              <CardContent className="p-8 text-center">
                <Zap className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Ready to Secure Your PII Data?</h3>
                <p className="text-lg mb-6 text-white/90">
                  Start encrypting and protecting your sensitive information with SecureVault's 
                  enterprise-grade security features.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="/register" className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors">
                    Get Started Now
                  </a>
                  <a href="/encrypt" className="border border-white/20 px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                    Encrypt Data
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Awareness;