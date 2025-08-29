import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Search, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Digital ID Management System
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Secure, Efficient, and Transparent ID Processing for Kenya
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Admin Portal */}
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Admin Portal</CardTitle>
              <CardDescription>
                Manage applications, approve officers, and oversee the entire system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" className="w-full">
                <Link to="/admin-portal">Access Admin</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Application Officer */}
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 text-secondary mx-auto mb-4" />
              <CardTitle>Application Officer</CardTitle>
              <CardDescription>
                Process new applications, renewals, and manage ID collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" variant="secondary" className="w-full">
                <Link to="/officer-portal">Officer Portal</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Public Tracking */}
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Search className="h-12 w-12 text-tertiary mx-auto mb-4" />
              <CardTitle>Track Application</CardTitle>
              <CardDescription>
                Check the status of your ID application using your waiting card number
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="lg" variant="tertiary" className="w-full">
                <Link to="/public-portal">Track Status</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-card/50 rounded-lg p-8 max-w-2xl mx-auto">
            <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">About the System</h2>
            <p className="text-muted-foreground">
              The Digital ID Management System streamlines the process of applying for, 
              renewing, and tracking national identification cards. Our secure platform 
              ensures efficient processing while maintaining the highest standards of 
              data protection and verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
