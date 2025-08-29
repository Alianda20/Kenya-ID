import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Constituency {
  id: number;
  name: string;
  created_at: string;
}

const OfficerAuth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  
  useEffect(() => {
    fetchConstituencies();
  }, []);

  const fetchConstituencies = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/constituencies');
      const data = await response.json();
      
      if (response.ok) {
        setConstituencies(data.constituencies);
      } else {
        toast({
          title: "Error",
          description: "Failed to load constituencies",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });

  const [signupData, setSignupData] = useState({
    idNumber: "",
    email: "",
    phoneNumber: "",
    fullName: "",
    station: "",
    constituency: "",
    password: "",
    confirmPassword: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/officer/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Login Successful",
          description: "Welcome back! Redirecting to dashboard...",
        });
        
        // Store the token (you can use localStorage or a state management solution)
        localStorage.setItem("officerToken", data.token);
        localStorage.setItem("officerData", JSON.stringify(data.officer));
        
        // Redirect to officer dashboard
        navigate("/officer/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: data.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please check if the backend server is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    console.log('Password validation:', {
      password,
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar
    });
    
    return {
      isValid: minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar,
      errors: [
        !minLength && "At least 8 characters",
        !hasUppercase && "At least 1 uppercase letter",
        !hasLowercase && "At least 1 lowercase letter", 
        !hasNumber && "At least 1 number",
        !hasSpecialChar && "At least 1 special character"
      ].filter(Boolean)
    };
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate full name (at least 2 names)
    const nameWords = signupData.fullName.trim().split(/\s+/);
    if (nameWords.length < 2) {
      toast({
        title: "Error",
        description: "Please enter at least 2 names (e.g., Kelvin Alianda)",
        variant: "destructive",
      });
      return;
    }
    
    // Validate ID number (only numbers, max 9 digits)
    if (!/^\d{1,9}$/.test(signupData.idNumber)) {
      toast({
        title: "Error",
        description: "ID number must be only numbers with maximum 9 digits",
        variant: "destructive",
      });
      return;
    }
    
    // Validate phone number (only numbers, max 12 digits)
    if (!/^\d{1,12}$/.test(signupData.phoneNumber)) {
      toast({
        title: "Error",
        description: "Phone number must be only numbers with maximum 12 digits",
        variant: "destructive",
      });
      return;
    }
    
    // Validate password requirements
    const passwordValidation = validatePassword(signupData.password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password Requirements",
        description: passwordValidation.errors.join(", "),
        variant: "destructive",
      });
      return;
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/officer/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: signupData.fullName,
          idNumber: signupData.idNumber,
          email: signupData.email,
          phoneNumber: signupData.phoneNumber,
          station: signupData.station,
          constituency: signupData.constituency,
          password: signupData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Application Submitted",
          description: "Your application has been submitted for admin approval. You will be notified once approved.",
        });
        // Reset form
        setSignupData({
          idNumber: "",
          email: "",
          phoneNumber: "",
          fullName: "",
          station: "",
          constituency: "",
          password: "",
          confirmPassword: ""
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to submit application",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please check if the backend server is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary-hover mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Application Officer</h1>
            <p className="text-muted-foreground">Digital ID Management System</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Officer Portal</CardTitle>
              <CardDescription className="text-center">
                Sign in to manage ID applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
                    <Badge variant="outline" className="bg-warning/20 text-warning-foreground">
                      Pending Approval
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your account will require admin approval before activation
                    </p>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={signupData.fullName}
                        onChange={(e) => setSignupData({...signupData, fullName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idNumber">ID Number</Label>
                      <Input
                        id="idNumber"
                        placeholder="Enter your ID number (max 9 digits)"
                        value={signupData.idNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                          setSignupData({...signupData, idNumber: value});
                        }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupEmail">Email</Label>
                      <Input
                        id="signupEmail"
                        type="email"
                        placeholder="Enter your email"
                        value={signupData.email}
                        onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        placeholder="Enter phone number (max 12 digits)"
                        value={signupData.phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                          setSignupData({...signupData, phoneNumber: value});
                        }}
                        required
                      />
                    </div>
                     <div className="space-y-2">
                       <Label htmlFor="station">Station</Label>
                       <Input
                         id="station"
                         placeholder="Enter your station name"
                         value={signupData.station}
                         onChange={(e) => setSignupData({...signupData, station: e.target.value})}
                         required
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="constituency">Constituency</Label>
                       <Select onValueChange={(value) => setSignupData({...signupData, constituency: value})}>
                         <SelectTrigger>
                           <SelectValue placeholder="Select your constituency" />
                         </SelectTrigger>
                         <SelectContent>
                           {constituencies.map((constituency) => (
                             <SelectItem key={constituency.id} value={constituency.name}>
                               {constituency.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                    <div className="space-y-2">
                      <Label htmlFor="signupPassword">Password</Label>
                      <Input
                        id="signupPassword"
                        type="password"
                        placeholder="Create a password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Submitting..." : "Submit for Approval"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OfficerAuth;