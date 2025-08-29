import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, FileText, Search } from "lucide-react";

const Dashboard = () => {
  const [userRole, setUserRole] = useState<'admin' | 'officer' | 'public' | null>(null);

  const handleRoleSelection = (role: 'admin' | 'officer' | 'public') => {
    setUserRole(role);
    // In a real app, this would redirect to the appropriate dashboard
    console.log(`Selected role: ${role}`);
  };

  if (userRole) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setUserRole(null)}
              className="mb-4"
            >
              ← Back to Role Selection
            </Button>
            <h1 className="text-3xl font-bold text-foreground">
              {userRole === 'admin' ? 'Admin Dashboard' : 
               userRole === 'officer' ? 'Application Officer Dashboard' : 
               'Track Your Application'}
            </h1>
          </div>
          
          <div className="bg-card p-8 rounded-lg border">
            <p className="text-muted-foreground">
              {userRole === 'admin' ? 'Admin features will be implemented here' :
               userRole === 'officer' ? 'Officer features will be implemented here' :
               'Public tracking features will be implemented here'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Kenya Digital ID System</h1>
              <p className="text-primary-foreground/80">Secure, Efficient, Transparent</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Welcome to the Kenya Digital ID System
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A comprehensive platform for ID application processing, tracking, and management.
            Select your role to continue.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Admin Portal */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle className="text-xl">System Administrator</CardTitle>
              <CardDescription>
                Manage applications, approve officers, and oversee the entire system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li>• Review and approve ID applications</li>
                <li>• Manage application officers</li>
                <li>• Handle dispatch operations</li>
                <li>• Generate ID numbers</li>
              </ul>
              <Button 
                onClick={() => handleRoleSelection('admin')}
                className="w-full"
              >
                Access Admin Portal
              </Button>
            </CardContent>
          </Card>

          {/* Officer Portal */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-secondary">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-secondary mx-auto mb-4" />
              <CardTitle className="text-xl">Application Officer</CardTitle>
              <CardDescription>
                Process new applications, renewals, and manage collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li>• Process new ID applications</li>
                <li>• Handle ID renewals</li>
                <li>• Manage collection updates</li>
                <li>• Upload supporting documents</li>
              </ul>
              <Button 
                onClick={() => handleRoleSelection('officer')}
                variant="secondary"
                className="w-full"
              >
                Access Officer Portal
              </Button>
            </CardContent>
          </Card>

          {/* Public Tracking */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-accent">
            <CardHeader className="text-center">
              <Search className="h-12 w-12 text-accent mx-auto mb-4" />
              <CardTitle className="text-xl">Track Application</CardTitle>
              <CardDescription>
                Check the status of your ID application using your waiting card number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li>• Real-time status tracking</li>
                <li>• Application progress updates</li>
                <li>• Collection notifications</li>
                <li>• Simple and secure</li>
              </ul>
              <Button 
                onClick={() => handleRoleSelection('public')}
                variant="outline"
                className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                Track My Application
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Features */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>System Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Secure biometric data handling</li>
                <li>• M-Pesa payment integration</li>
                <li>• Real-time application tracking</li>
                <li>• Document upload and verification</li>
                <li>• Multi-level approval workflow</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Security & Compliance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li>• End-to-end encryption</li>
                <li>• Role-based access control</li>
                <li>• Audit trail for all operations</li>
                <li>• Government compliance standards</li>
                <li>• Data protection measures</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-tertiary text-tertiary-foreground py-8 mt-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p>&copy; 2024 Republic of Kenya - Digital ID System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;